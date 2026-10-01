import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { messages, model = 'google/gemini-2.0-flash-exp:free' } = await request.json()
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY ?? ''}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://qperl.vercel.app', 'X-Title': 'qperl' },
    body: JSON.stringify({ model, messages, max_tokens: 2000 }),
  })
  if (!response.ok) return NextResponse.json({ error: 'Yanıt alınamadı.' }, { status: response.status })
  const data = await response.json()
  return NextResponse.json({ text: data.choices?.[0]?.message?.content ?? 'Yanıt üretilemedi.' })
}
