// app/api/agent/route.ts
import { streamText, stepCountIs } from 'ai';
import { agent } from '@/lib/agent';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = streamText({
      model: agent.model,
      system: agent.system,
      messages,
      tools: agent.tools,
      stopWhen: stepCountIs(5)
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('[agent] hata:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Bilinmeyen hata'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
