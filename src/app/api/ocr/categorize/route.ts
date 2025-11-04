import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { initializeDatabase } from '@/lib/database';
import { Expense, ExpenseCategory } from '@/lib/entities/Expense';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => null) as { rawText?: string } | null;
    const rawText = body?.rawText as string;
    if (!rawText || typeof rawText !== 'string') {
      return NextResponse.json({ error: 'rawText is required' }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const models = ['gemini-2.0-flash', 'gemini-1.5-flash'];

    const categories = Object.values(ExpenseCategory).join(', ');
    const todayDate = new Date().toISOString().slice(0, 10);
    const prompt = `You are a receipt parser. Extract structured data from this OCR text.

RECEIPT TEXT:
${rawText}

REQUIREMENTS:
1. Extract the TOTAL AMOUNT (look for "Total", "Amount", "Rs", "₹", "$", final price)
2. Extract the VENDOR/STORE NAME (first line or business name)
3. Extract the DATE (look for date format, default to ${todayDate} if not found)
4. Categorize into one of: ${categories}

RESPOND WITH ONLY VALID JSON (no markdown, no code blocks, no explanations):
{
  "title": "vendor or store name",
  "amount": 123.45,
  "category": "food",
  "date": "2025-01-15",
  "description": "brief description"
}

CRITICAL:
- amount must be a NUMBER (no currency symbols, no commas)
- title must be a non-empty string
- category must be exactly one of: ${categories}
- date must be YYYY-MM-DD format
- Return ONLY the JSON object, nothing else`;

    // Retry with backoff and model fallback to handle transient 5xx and overloads
    const maxAttempts = 4;
    let lastError: unknown = null;
    let text = '';
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      for (const m of models) {
        try {
          const model = genAI.getGenerativeModel({ model: m });
          const result = await model.generateContent(prompt);
          text = await result.response.text();
          lastError = null;
          break;
        } catch (err: unknown) {
          lastError = err;
          // Only backoff on 5xx errors; for 4xx, break early
          const status = (err as { status?: number; response?: { status?: number } })?.status || (err as { status?: number; response?: { status?: number } })?.response?.status;
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
    let parsed: { title?: string; amount?: number; category?: string; date?: string; description?: string } | null = null;
    const tryParsers = () => {
      // 1) direct JSON parse
      try { 
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed === 'object') return parsed;
      } catch {}
      
      // 2) strip markdown code fences ```json ... ``` or ``` ... ```
      const cleaned = text
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();
      try { 
        const parsed = JSON.parse(cleaned);
        if (parsed && typeof parsed === 'object') return parsed;
      } catch {}
      
      // 3) extract first JSON object substring (more robust)
      const jsonMatch = text.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed && typeof parsed === 'object') return parsed;
        } catch {}
      }
      
      // 4) try to find JSON-like structure even if not perfect
      const jsonLikeMatch = text.match(/\{[^}]*"title"[^}]*"amount"[^}]*\}/i);
      if (jsonLikeMatch) {
        try {
          const fixed = jsonLikeMatch[0].replace(/(['"])?([a-zA-Z_][a-zA-Z0-9_]*)\1:/g, '"$2":');
          const parsed = JSON.parse(fixed);
          if (parsed && typeof parsed === 'object') return parsed;
        } catch {}
      }
      
      return null;
    };
    parsed = tryParsers();

    // Heuristic fallback if AI output is unusable - extract from raw text
    if (!parsed || !parsed.title || !parsed.amount || Number.isNaN(Number(parsed.amount))) {
      console.log('AI parsing failed, using fallback extraction. AI response:', text);
      
      // Extract amount (multiple patterns)
      let amountStr: string | null = null;
      
      // Try pattern 1: "Total: ₹123.45" or "Amount: 123.45"
      let amountMatch = rawText.match(/(?:total|amount|grand\s+total|final\s+amount)\s*[:\-]?\s*[₹$£€]?\s*(\d+(?:[.,]\d{2})?)/i);
      if (amountMatch && amountMatch[1]) {
        amountStr = amountMatch[1];
      } else {
        // Try pattern 2: Currency symbol followed by amount
        amountMatch = rawText.match(/[₹$£€]\s*(\d+(?:[.,]\d{2})?)/i);
        if (amountMatch && amountMatch[1]) {
          amountStr = amountMatch[1];
        } else {
          // Try pattern 3: Look for largest number (likely the total)
          const numbers = rawText.match(/\d+(?:[.,]\d{2})?/g);
          if (numbers && numbers.length > 0) {
            const nums = numbers.map(n => parseFloat(n.replace(/,/g, '')));
            amountStr = Math.max(...nums).toString();
          }
        }
      }
      
      // Extract date
      let dateMatch = rawText.match(/\b(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})\b/);
      if (!dateMatch) {
        dateMatch = rawText.match(/\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/);
      }
      
      // Extract vendor/store name (first meaningful line)
      const lines = rawText.split(/\r?\n/).map(s => s.trim()).filter(s => s.length > 3 && !/^\d+/.test(s));
      const vendorName = lines[0] || lines.find(l => /store|shop|restaurant|cafe|market|mall/i.test(l)) || 'Receipt';
      
      const amountValue = amountStr ? parseFloat(amountStr.replace(/,/g, '')) : NaN;
      const dateValue = dateMatch ? (() => {
        const parts = dateMatch[1].split(/[\/\-]/);
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
          } else {
            return `${parts[2].padStart(4, '20')}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
        }
        return todayDate;
      })() : todayDate;
      
      if (!Number.isNaN(amountValue) && amountValue > 0) {
        parsed = {
          title: vendorName.slice(0, 120),
          amount: amountValue,
          category: 'other',
          date: dateValue,
          description: 'Parsed from receipt (fallback extraction)'
        };
      }
    }
    
    if (!parsed || !parsed.title || !parsed.amount || Number.isNaN(Number(parsed.amount))) {
      console.error('Failed to extract valid fields. AI response:', text, 'Raw text:', rawText.substring(0, 200));
      return NextResponse.json({ 
        error: 'Failed to extract receipt information', 
        details: 'Could not find valid amount or vendor name in receipt',
        raw: text.substring(0, 500),
        rawText: rawText.substring(0, 500)
      }, { status: 502 });
    }

    // Validate and normalize extracted fields
    const amount = Number(parsed.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      console.error('Invalid amount extracted:', parsed.amount, 'Raw text:', rawText.substring(0, 200));
      return NextResponse.json({ 
        error: 'Invalid amount extracted', 
        details: `Could not extract a valid amount (got: ${parsed.amount})`,
        parsed,
        rawText: rawText.substring(0, 500)
      }, { status: 400 });
    }
    
    const title = String(parsed.title || '').trim();
    if (!title || title.length === 0) {
      console.error('Invalid title extracted:', parsed.title, 'Raw text:', rawText.substring(0, 200));
      return NextResponse.json({ 
        error: 'Invalid vendor name extracted', 
        details: `Could not extract vendor/store name`,
        parsed,
        rawText: rawText.substring(0, 500)
      }, { status: 400 });
    }
    
    let date: Date;
    if (parsed.date) {
      date = new Date(parsed.date);
      if (isNaN(date.getTime())) {
        date = new Date();
      }
    } else {
      date = new Date();
    }
    
    const category = (Object.values(ExpenseCategory) as string[]).includes(parsed.category || '')
      ? parsed.category
      : ExpenseCategory.OTHER;

    const db = await initializeDatabase();
    const repo = db.getRepository(Expense);
    const expense = repo.create({
      userId,
      title: title.slice(0, 120),
      amount,
      category: category as ExpenseCategory,
      date,
      description: parsed.description ? String(parsed.description).slice(0, 500) : undefined,
    });
    const saved = await repo.save(expense);

    return NextResponse.json({ expense: saved });
  } catch (error) {
    console.error('Categorize OCR error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


