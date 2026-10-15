import { GoogleGenAI } from '@google/genai'
import { NextResponse } from 'next/server'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

// Arayüzdeki model adı -> AI Studio model kimliği.
// Kimlikleri aistudio.google.com'daki model listesinden kontrol et.
const MODEL_IDS: Record<string, string> = {
  'Gemini 3.6': 'gemini-3.6-latest', 'Gemini Flash Lite Latest': 'gemini-flash-lite-latest','Gemini 3.7':'gemini-3.7-latest'
}
const DEFAULT_MODEL = 'gemini-flash-lite-latest'

export async function POST(request: Request) {
  try {
    const { model, messages } = await request.json()

    const contents = (messages as { role: string; content: string }[]).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

    const result = await ai.models.generateContent({
      model: MODEL_IDS[model] ?? DEFAULT_MODEL,
      contents,
    })

    return NextResponse.json({ text: result.text ?? '' })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Gemini isteği başarısız oldu.' }, { status: 500 })
  }
}
