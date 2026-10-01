import { NextResponse } from 'next/server'

const modelMap: Record<string, string> = {
  'Claude 3.7 Sonnet': 'anthropic/claude-3.7-sonnet',
  'GPT-4o': 'openai/gpt-4o',
  'Gemini 2.5 Pro': 'google/gemini-2.5-pro',
  'Grok 3': 'x-ai/grok-3-beta',
}

export async function POST(request: Request) {
  try {
    const { model, messages } = await request.json()
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Mesaj gerekli.' }, { status: 400 })
    }
    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'OPENROUTER_API_KEY ayarlanmamış.' }, { status: 500 })

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'qperl',
      },
      body: JSON.stringify({
        model: modelMap[model] || 'openai/gpt-4o-mini',
        messages: messages.map((message: { role: string; text: string }) => ({ role: message.role === 'assistant' ? 'assistant' : 'user', content: message.text })),
        temperature: 0.7,
      }),
    })
    const data = await response.json()
    if (!response.ok) return NextResponse.json({ error: data?.error?.message || 'OpenRouter yanıt vermedi.' }, { status: response.status })
    return NextResponse.json({ text: data.choices?.[0]?.message?.content || 'Yanıt alınamadı.' })
  } catch {
    return NextResponse.json({ error: 'AI servisine bağlanırken bir hata oluştu.' }, { status: 500 })
  }
}
