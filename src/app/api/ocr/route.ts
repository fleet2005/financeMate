import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Tesseract from 'tesseract.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { initializeDatabase } from '@/lib/database';
import { Expense, ExpenseCategory } from '@/lib/entities/Expense';

async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const imageBuffer = await fileToBuffer(file);

    // OCR with Tesseract.js
    const { data } = await Tesseract.recognize(imageBuffer, 'eng', {
      // @ts-expect-error - Tesseract.js specific option
      tessjs_create_pdf: '0',
    });
    const rawText = data.text?.trim() || '';

    if (!rawText) {
      return NextResponse.json({ error: 'Could not extract text from image' }, { status: 422 });
    }

    // Use Gemini to parse fields and categorize
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const categories = Object.values(ExpenseCategory).join(', ');
    const prompt = `You are given receipt text extracted by OCR. Extract fields and categorize.
Return valid JSON with keys: title, amount, category, date, description.
Constraints:
- category must be one of: ${categories}
- amount is total in number
- date in YYYY-MM-DD if present, else today's date
- title short vendor/summary
- description short note
Receipt text:\n\n${rawText}`;

    const result = await model.generateContent(prompt);
    const text = await result.response.text();

    let parsed: { amount?: number; date?: string; category?: string; title?: string; description?: string };
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: 'Failed to parse categorization', raw: text }, { status: 502 });
    }

    const amount = Number(parsed.amount);
    const date = parsed.date ? new Date(parsed.date) : new Date();
    const category = (Object.values(ExpenseCategory) as string[]).includes(parsed.category || '')
      ? parsed.category
      : ExpenseCategory.OTHER;

    if (!parsed.title || !amount || Number.isNaN(amount)) {
      return NextResponse.json({ error: 'Invalid extracted fields', parsed }, { status: 400 });
    }

    const db = await initializeDatabase();
    const repo = db.getRepository(Expense);
    const expense = repo.create({
      userId,
      title: String(parsed.title).slice(0, 120),
      amount,
      category: category as ExpenseCategory,
      date,
      description: parsed.description ? String(parsed.description).slice(0, 500) : undefined,
    });
    const saved = await repo.save(expense);

    return NextResponse.json({ expense: saved, rawText });
  } catch (error) {
    console.error('OCR API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


