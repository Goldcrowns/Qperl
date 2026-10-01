import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { text } = await request.json()
    if (!text || typeof text !== 'string') return NextResponse.json({ error: 'Metin gerekli.' }, { status: 400 })
    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'ELEVENLABS_API_KEY ayarlanmamış.' }, { status: 500 })
    const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({ text: text.slice(0, 4000), model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
    })
    if (!response.ok) return NextResponse.json({ error: 'Ses üretilemedi.' }, { status: response.status })
    return new NextResponse(await response.arrayBuffer(), { headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' } })
  } catch { return NextResponse.json({ error: 'Ses servisine bağlanılamadı.' }, { status: 500 }) }
}
