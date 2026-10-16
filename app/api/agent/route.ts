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
    console.error('[agent]', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Hata' },
      { status: 500 }
    );
  }
}
