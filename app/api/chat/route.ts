import { NextResponse } from 'next/server'

// Arayüzdeki model adı -> AI Studio model kimliği.
// Kimlikleri aistudio.google.com'daki model listesinden kontrol et.
const MODEL_IDS: Record<string, string> = {
  'gemini-3.5-flash-lite': 'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite': 'gemini-3.1-flash-lite',
  'gemini-3.1-flash-lite-image': 'gemini-3.1-flash-lite-image',
  'gemini-flash-lite-latest': 'gemini-flash-lite-latest',
  'gemini-flash-latest': 'gemini-flash-latest',
}
const DEFAULT_MODEL = 'gemini-flash-lite-latest'

export async function POST(request: Request) {
  try {
    const { model, messages } = await request.json()

    const contents = (messages as { role: string; content: string }[]).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

    const modelId = MODEL_IDS[model] ?? DEFAULT_MODEL
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents }),
      },
    )

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data?.error?.message || 'Gemini isteği başarısız oldu.')
    }

    const text = data?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text ?? '')
      .join('')
      .trim()

    return NextResponse.json({ text: text || 'Yanıt oluşturulamadı.' })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Gemini isteği başarısız oldu.' }, { status: 500 })
  }
}
