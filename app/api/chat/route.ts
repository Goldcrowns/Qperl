import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { messages } = await request.json()
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY ?? ''}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'llama-3.1-8b-instant', messages, max_tokens: 2000, temperature: 0.7 }),
  })
  if (!response.ok) return NextResponse.json({ error: 'Yanıt alınamadı.' }, { status: response.status })
  const data = await response.json()
  return NextResponse.json({ text: data.choices?.[0]?.message?.content ?? 'Yanıt üretilemedi.' })
}
