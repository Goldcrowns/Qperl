import { NextResponse } from 'next/server'

const modelMap: Record<string, string> = {
  'Llama 3.3 70B': 'meta-llama/llama-3.3-70b-instruct:free',
  'Gemma 3 27B': 'google/gemma-3-27b-it:free',
  'DeepSeek Chat V3': 'deepseek/deepseek-chat-v3-0324:free',
  'Qwen 2.5 72B': 'qwen/qwen-2.5-72b-instruct:free',
}

export async function POST(request: Request) {
  try {
    const { model, messages } = await request.json()
    if (!Array.isArray(messages) || messages.length === 0) return NextResponse.json({ error: 'Mesaj gerekli.' }, { status: 400 })
    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'OPENROUTER_API_KEY ayarlanmamış.' }, { status: 500 })
    if (model === 'Gemini Flash Lite' && process.env.GEMINI_API_KEY) {
      const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: messages.map((message: { role: string; text: string }) => `${message.role}: ${message.text}`).join('\\n') }] }], generationConfig: { maxOutputTokens: 2000, temperature: 0.7 } }),
      })
      const geminiData = await geminiResponse.json()
      if (!geminiResponse.ok) return NextResponse.json({ error: geminiData?.error?.message || 'Gemini yanıt vermedi.' }, { status: geminiResponse.status })
      return NextResponse.json({ text: geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Yanıt alınamadı.' })
    }
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', 'X-Title': 'qperl' },
      body: JSON.stringify({ model: modelMap[model] || 'openai/gpt-4o-mini', messages: messages.map((message: { role: string; text: string }) => ({ role: message.role === 'assistant' ? 'assistant' : 'user', content: message.text })), temperature: 0.7, max_tokens: 2000 }),
    })
    const data = await response.json()
    if (!response.ok) return NextResponse.json({ error: data?.error?.message || 'OpenRouter yanıt vermedi.' }, { status: response.status })
    return NextResponse.json({ text: data.choices?.[0]?.message?.content || 'Yanıt alınamadı.' })
  } catch { return NextResponse.json({ error: 'AI servisine bağlanırken bir hata oluştu.' }, { status: 500 }) }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
