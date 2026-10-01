import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { text } = await request.json()
  if (typeof text !== 'string' || !text.trim()) {
    return NextResponse.json({ error: 'Metin gerekli.' }, { status: 400 })
  }

  const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
    method: 'POST',
    headers: {
      accept: 'audio/mpeg',
      'content-type': 'application/json',
      'xi-api-key': process.env.ELEVENLABS_API_KEY ?? '',
    },
    body: JSON.stringify({
      text: text.slice(0, 4000),
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.45, similarity_boost: 0.78, style: 0.2, use_speaker_boost: true },
    }),
  })

  if (!response.ok) return NextResponse.json({ error: 'Ses üretilemedi.' }, { status: 502 })
  return new NextResponse(await response.arrayBuffer(), { headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' } })
}
