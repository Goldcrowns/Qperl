// lib/agent.ts
import { google } from '@ai-sdk/google';
import { tool } from 'ai';
import { z } from 'zod';

// --- Geçici sahte DB (sonra gerçek veritabanınla değiştir) ---
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

// --- Araçlar (Agent'ın kullanabileceği yetenekler) ---
export const tools = {
  searchProducts: tool({
    description: 'Sitede ürün arar. Kullanıcı ürün/hizmet sorduğunda kullan.',
    parameters: z.object({
      query: z.string().describe('Aranacak kelime')
    }),
    execute: async ({ query }) => {
      return await db.products.search(query);
    }
  }),

  getUserOrders: tool({
    description: 'Kullanıcının siparişlerini getirir.',
    parameters: z.object({
      userId: z.string().describe('Kullanıcı ID')
    }),
    execute: async ({ userId }) => {
      return await db.orders.byUser(userId);
    }
  })
};

// --- Agent tanımı ---
export const agent = {
  model: google('gemini-2.0-flash'),   // ✅ Doğru kullanım
  system: `Sen Qperl sitesinin yardımcı asistanısın.
Kullanıcıya Türkçe, kısa ve net cevap ver.
Ürün sorulursa searchProducts, sipariş sorulursa getUserOrders aracını kullan.
Bilmediğin şeyi uydurma, kullanıcıya sor.`,
  tools,
  maxSteps: 5
};
