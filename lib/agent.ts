// lib/agent.ts
import { google } from '@ai-sdk/google';
import { tool, stepCountIs } from 'ai';
import { z } from 'zod';

// --- Geçici sahte DB ---
const db = {
  products: {
    search: async (query: string) => [
      { id: 1, name: `${query} ürün 1`, price: 100 },
      { id: 2, name: `${query} ürün 2`, price: 200 }
    ]
  },
  orders: {
    byUser: async (userId: string) => [
      { id: 'ORD-1', userId, status: 'kargoda', total: 150 }
    ]
  }
};

// --- Araçlar (v5 sözdizimi) ---
export const tools = {
  searchProducts: tool({
    description: 'Sitede ürün arar. Kullanıcı ürün/hizmet sorduğunda kullan.',
    inputSchema: z.object({              // ⬅️ v5: parameters → inputSchema
      query: z.string().describe('Aranacak kelime')
    }),
    execute: async ({ query }) => {      // ⬅️ v5: tip otomatik gelir, yazma gerek yok
      return await db.products.search(query);
    }
  }),

  getUserOrders: tool({
    description: 'Kullanıcının siparişlerini getirir.',
    inputSchema: z.object({              // ⬅️ v5
      userId: z.string().describe('Kullanıcı ID')
    }),
    execute: async ({ userId }) => {     // ⬅️ v5
      return await db.orders.byUser(userId);
    }
  })
};

// --- Agent tanımı (v5) ---
export const agent = {
  model: google('gemini-2.0-flash'),
  system: `Sen Qperl sitesinin yardımcı asistanısın.
Kullanıcıya Türkçe, kısa ve net cevap ver.
Ürün sorulursa searchProducts, sipariş sorulursa getUserOrders aracını kullan.
Bilmediğin şeyi uydurma, kullanıcıya sor.`,
  tools,
  stopWhen: stepCountIs(5)               // ⬅️ v5: maxSteps → stopWhen
};
