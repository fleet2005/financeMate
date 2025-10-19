import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { RAGService } from '@/lib/ragService';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message } = await request.json();
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get user's financial context using RAG
    let financialContext;
    try {
      financialContext = await RAGService.getUserFinancialContext(userId);
    } catch (error) {
      console.error('Error fetching financial context:', error);
      // Fallback to basic prompt if RAG fails
      const basicPrompt = `You are FinanceMate, a helpful AI assistant for personal finance management. 
      
User message: ${message}

Provide helpful financial advice. Keep responses concise but helpful.`;
      
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const result = await model.generateContent(basicPrompt);
      const response = await result.response;
      const text = response.text();
      
      return NextResponse.json({ 
        message: text,
        timestamp: new Date().toISOString()
      });
    }
    
    // Generate RAG-enhanced prompt
    const ragPrompt = await RAGService.generateRAGPrompt(message, financialContext);

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    try {
      const result = await model.generateContent(ragPrompt);
      const response = await result.response;
      const text = response.text();

      return NextResponse.json({ 
        message: text,
        timestamp: new Date().toISOString()
      });
    } catch (aiError) {
      console.error('Gemini API error:', aiError);
      // Fallback response when Gemini is down
      return NextResponse.json({ 
        message: "I'm currently experiencing technical difficulties with the AI service. However, I can see your financial data is accessible. Please try again in a few minutes, or contact support if the issue persists.",
        timestamp: new Date().toISOString(),
        error: 'AI service unavailable'
      }, { status: 503 });
    }

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ 
      message: "I'm having trouble processing your request right now. Please try again later.",
      error: 'Service temporarily unavailable'
    }, { status: 500 });
  }
}

