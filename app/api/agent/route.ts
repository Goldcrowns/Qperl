// app/api/agent/route.ts
import { streamText, stepCountIs } from 'ai';
import { agent } from '@/lib/agent';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('[agent] gelen mesajlar:', JSON.stringify(body.messages, null, 2));

    const result = streamText({
      model: agent.model,
      system: agent.system,
      messages: body.messages,
      tools: agent.tools,
      stopWhen: stepCountIs(5),
      onError: (error) => {
        console.error('[agent] streamText hatası:', error);
      }
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('[agent] catch hatası:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Hata' },
      { status: 500 }
    );
  }
}
