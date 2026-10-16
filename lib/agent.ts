// lib/agent.ts
import { google } from '@ai-sdk/google';
import { tool, stepCountIs } from 'ai';
import { z } from 'zod';

// app/page.tsx'teki modellerle senkron
const AVAILABLE_MODELS = [
  { name: 'gemini-3.5-flash-lite', provider: 'Google Gemini', badge: 'NEW', bestFor: ['genel', 'kod'] },
  { name: 'gemini-3.1-flash-lite', provider: 'Google Gemini', bestFor: ['genel'] },
  { name: 'gemini-3.1-flash-lite-image', provider: 'Google Gemini', badge: 'IMAGE', bestFor: ['görsel'] },
  { name: 'gemini-flash-lite-latest', provider: 'Google Gemini', badge: 'FAST', bestFor: ['hız'] },
  { name: 'gemini-flash-latest', provider: 'Google Gemini', bestFor: ['genel'] }
];

export const tools = {
  listModels: tool({
    description: 'Kullanıcı hangi modellerin mevcut olduğunu sorduğunda çağır.',
    inputSchema: z.object({}),
    execute: async () => ({
      count: AVAILABLE_MODELS.length,
      models: AVAILABLE_MODELS
    })
  }),

  recommendModel: tool({
    description:
      'Kullanıcının görevine göre en uygun modeli önerir. "kod için hangisi", "hangi modeli seçeyim", "resim için ne kullanayım", "hızlı cevap istiyorum" gibi sorularda çağır.',
    inputSchema: z.object({
      task: z.string().describe('Kullanıcının yapmak istediği iş')
    }),
    execute: async ({ task }) => {
      const lower = task.toLowerCase();
      if (lower.includes('görsel') || lower.includes('resim') || lower.includes('image')) {
        return {
          öneri: 'gemini-3.1-flash-lite-image',
          sebep: 'Görsel üretimi destekleyen tek model'
        };
      }
      if (lower.includes('hız') || lower.includes('hızlı') || lower.includes('acil')) {
        return {
          öneri: 'gemini-flash-lite-latest',
          sebep: 'En hızlı yanıt veren hafif model'
        };
      }
      if (lower.includes('kod') || lower.includes('program') || lower.includes('yazılım')) {
        return {
          öneri: 'gemini-3.5-flash-lite',
          sebep: 'En yeni ve kod konusunda güçlü'
        };
      }
      return {
        öneri: 'gemini-3.5-flash-lite',
        sebep: 'Genel amaçlı, en yeni model'
      };
    }
  }),

  getModelInfo: tool({
    description: 'Belirli bir modelin detaylarını getirir.',
    inputSchema: z.object({
      modelName: z.string().describe('Model adı, örn: "gemini-3.5-flash-lite"')
    }),
    execute: async ({ modelName }) => {
      const model = AVAILABLE_MODELS.find((m) =>
        m.name.toLowerCase().includes(modelName.toLowerCase())
      );
      return (
        model ?? {
          error: 'Bu model bulunamadı',
          mevcut: AVAILABLE_MODELS.map((m) => m.name)
        }
      );
    }
  }),

  calculator: tool({
    description: 'Matematiksel hesaplama yapar. Kullanıcı sayısal işlem sorduğunda çağır.',
    inputSchema: z.object({
      expression: z.string().describe('Matematik ifadesi, örn: "150 * 0.18"')
    }),
    execute: async ({ expression }) => {
      try {
        const safe = expression.replace(/[^0-9+\-*/(). ]/g, '');
        const result = Function(`"use strict"; return (${safe})`)();
        return { expression: safe, result };
      } catch {
        return { error: 'Geçersiz matematik ifadesi' };
      }
    }
  })
};

export const agent = {
  model: google('gemini-flash-lite-latest'),
  system: `Sen Qperl platformunun AI asistanısın. Qperl, kullanıcıların farklı Gemini modelleriyle konuşabildiği bir AI playground.

DAVRANIŞIN:
- Normal sohbetlerde doğal, samimi ve kısa cevap ver
- Kullanıcı "hangi modeli seçeyim", "kod için hangisi", "resim üretebilir miyim", "hızlı cevap istiyorum" gibi sorular sorarsa MUTLAKA recommendModel aracını kullan
- "Hangi modeller var" diye sorarsa listModels kullan
- Belirli bir model hakkında sorulursa getModelInfo kullan
- Matematik sorulursa calculator kullan
- Markdown kullan: **kalın**, \`kod\`, listeler, başlıklar

KURALLAR:
- Türkçe konuş
- Model önerirken nedenini 1 cümleyle açıkla
- Uydurma, bilmiyorsan söyle
- Cevaplarını gereksiz uzatma, 3-4 cümleyi geçme`,

  tools,
  stopWhen: stepCountIs(5)
};
