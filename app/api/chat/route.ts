import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Groq API anahtarı yapılandırılmamış.' }, { status: 503 })

  const body = await request.json().catch(() => null)
  const messages = body?.messages
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'Geçerli bir mesaj gerekli.' }, { status: 400 })
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'llama-3.1-8b-instant', messages, max_tokens: 2000, temperature: 0.7 }),
  })

  if (!response.ok) return NextResponse.json({ error: 'Groq yanıtı alınamadı.' }, { status: response.status })
  const data = await response.json()
  return NextResponse.json({ text: data.choices?.[0]?.message?.content ?? 'Yanıt üretilemedi.' })
}
