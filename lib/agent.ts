import { generateText, tool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

export const siteAgent = {
  model: gemini('gemini-3.5-flash'),
  system: `Sen site asistanısın. Kullanıcıya yardım et.
  Gerektiğinde araçları kullan. Emin değilsen sor.`,
  tools: {
    searchProducts: tool({
      description: 'Sitede ürün arar',
      parameters: z.object({ query: z.string() }),
      execute: async ({ query }) => {
        // kendi DB/API çağrın
        return await db.products.search(query);
      }
    }),
    getUserOrders: tool({
      description: 'Kullanıcının siparişlerini getirir',
      parameters: z.object({ userId: z.string() }),
      execute: async ({ userId }) => await db.orders.byUser(userId)
    })
  },
  maxSteps: 5  // sonsuz döngü koruması
};
