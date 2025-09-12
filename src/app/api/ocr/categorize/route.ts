import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { initializeDatabase } from '@/lib/database';
import { Expense, ExpenseCategory } from '@/lib/entities/Expense';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => null as any);
    const rawText = body?.rawText as string;
    if (!rawText || typeof rawText !== 'string') {
      return NextResponse.json({ error: 'rawText is required' }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const models = ['gemini-1.5-flash', 'gemini-1.5-pro'];

    const categories = Object.values(ExpenseCategory).join(', ');
    const prompt = `You are given receipt text extracted by OCR. Extract fields and categorize.
Return STRICT JSON only (no prose, no markdown) with keys: title, amount, category, date, description.
Constraints:
- category must be one of: ${categories}
- amount is the total as a number (no currency symbols)
- date in YYYY-MM-DD if present, else today's date
- title short vendor/summary
- description short note
Receipt text:\n\n${rawText}`;

    // Retry with backoff and model fallback to handle transient 5xx and overloads
    const maxAttempts = 4;
    let lastError: any = null;
    let text = '';
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      for (const m of models) {
        try {
          const model = genAI.getGenerativeModel({ model: m });
          const result = await model.generateContent(prompt);
          text = await result.response.text();
          lastError = null;
          break;
        } catch (err: any) {
          lastError = err;
          // Only backoff on 5xx errors; for 4xx, break early
          const status = err?.status || err?.response?.status;
          if (status && status >= 400 && status < 500 && status !== 429) {
            break;
          }
          // next model or next attempt
        }
      }
      if (!lastError && text) break;
      // Exponential backoff: 300ms, 600ms, 1200ms
      const delayMs = 300 * Math.pow(2, attempt - 1);
      await new Promise(r => setTimeout(r, delayMs));
    }
    if (lastError || !text) {
      return NextResponse.json({ error: 'AI model unavailable, please try again shortly.' }, { status: 503 });
    }

    // Try to parse JSON robustly
    let parsed: any = null;
    const tryParsers = () => {
      // 1) direct JSON
      try { return JSON.parse(text); } catch {}
      // 2) strip code fences ```json ... ```
      const fenced = text.replace(/```json[\s\S]*?```/gi, (m) => m.replace(/```json|```/gi, '').trim());
      try { return JSON.parse(fenced); } catch {}
      // 3) extract first JSON object substring
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try { return JSON.parse(match[0]); } catch {}
      }
      return null;
    };
    parsed = tryParsers();

    // Heuristic fallback if AI output is unusable
    if (!parsed) {
      // Try simple regex extraction for amount/date/vendor
      const amountMatch = rawText.match(/total\s*[:\-]?\s*([$£€])?\s*(\d+[.,]?\d{0,2})/i) || rawText.match(/([£$€])\s?(\d+[.,]?\d{0,2})\b/);
      const dateMatch = rawText.match(/\b(\d{4}[\/-]\d{1,2}[\/-]\d{1,2}|\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})\b/);
      const firstLine = rawText.split(/\r?\n/).map(s => s.trim()).filter(Boolean)[0] || 'Receipt';
      const amt = amountMatch ? Number((amountMatch[2] || amountMatch[0]).replace(/[^0-9.]/g, '')) : NaN;
      const d = dateMatch ? new Date(dateMatch[0].replace(/\//g, '-')) : new Date();
      if (!Number.isNaN(amt)) {
        parsed = {
          title: firstLine.slice(0, 120),
          amount: amt,
          category: 'other',
          date: d.toISOString().slice(0, 10),
          description: 'Parsed from receipt (fallback)'
        };
      }
    }
    if (!parsed) {
      return NextResponse.json({ error: 'Failed to parse categorization', raw: text }, { status: 502 });
    }

    const amount = Number(parsed.amount);
    const date = parsed.date ? new Date(parsed.date) : new Date();
    const category = (Object.values(ExpenseCategory) as string[]).includes(parsed.category)
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
      description: parsed.description ? String(parsed.description).slice(0, 500) : null as any,
    });
    const saved = await repo.save(expense);

    return NextResponse.json({ expense: saved });
  } catch (error) {
    console.error('Categorize OCR error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


