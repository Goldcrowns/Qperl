'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUp, ChevronDown, Languages, Menu, Paperclip, Plus, Radio, Sparkles, Zap } from 'lucide-react'
import { Toaster, toast } from 'sonner'

type Model = { name: string; provider: string; color: string }
const models: Model[] = [
  { name: 'Claude 3.7 Sonnet', provider: 'Anthropic', color: '#d68b68' },
  { name: 'GPT-4o', provider: 'OpenAI', color: '#59a681' },
  { name: 'Gemini 2.5 Pro', provider: 'Google', color: '#6a8eea' },
  { name: 'Grok 3', provider: 'xAI', color: '#1d2939' },
]
const starters = ['Bir ürün fikrini analiz et', 'Bu metni daha iyi yaz', 'Kodumda hata bul', 'Bana bir plan çıkar']

type Message = { role: 'user' | 'assistant'; text: string }

export default function Home() {
  const [landing, setLanding] = useState(true)
  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [selected, setSelected] = useState(models[0])
  const [modelsOpen, setModelsOpen] = useState(false)
  const [live, setLive] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [language, setLanguage] = useState('TR')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, generating])

  async function send(text = prompt) {
    if (!text.trim() || generating) return
    const history = [...messages, { role: 'user' as const, text }]
    setMessages([...history, { role: 'assistant', text: '' }])
    setPrompt('')
    setGenerating(true)
    try {
      const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: selected.name, messages: history }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Yanıt alınamadı')
      const answer = String(data.text)
      let index = 0
      const timer = window.setInterval(() => {
        index += 2
        setMessages((current) => current.map((item, itemIndex) => itemIndex === current.length - 1 ? { ...item, text: answer.slice(0, index) } : item))
        if (index >= answer.length) { window.clearInterval(timer); setGenerating(false) }
      }, 18)
    } catch (error) {
      setMessages(history)
      setGenerating(false)
      toast(error instanceof Error ? error.message : 'OpenRouter bağlantısı kurulamadı')
    }
  }

  return <main className="min-h-screen"><Toaster position="bottom-right" />
    <header className="flex h-16 items-center justify-between border-b border-[var(--line)] bg-white/40 px-5 backdrop-blur-xl md:px-8">
      <div className="flex items-center gap-3"><button className="rounded-lg p-2 md:hidden" aria-label="Menü"><Menu /></button><strong className="brand-font text-[22px] tracking-[-.06em]">qperl<span className="text-[#8099bd]">.</span></strong><span className="hidden border-l border-[var(--line)] pl-3 text-sm text-[var(--muted)] sm:block">AI çalışma alanı</span></div>
      <div className="flex items-center gap-2"><div className="relative"><Languages size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" /><select value={language} onChange={(e) => { setLanguage(e.target.value); toast(`Dil ${e.target.value} olarak değiştirildi`) }} className="h-9 rounded-xl border border-[var(--line)] bg-white/60 pl-8 pr-3 text-xs font-semibold" aria-label="Dil seç"><option>TR</option><option>EN</option><option>DE</option><option>FR</option></select></div><span className="grid size-8 place-items-center rounded-full bg-[#172033] text-xs text-white">A</span></div>
    </header>
    {landing ? <section className="landing-screen flex min-h-[calc(100vh-64px)] items-center justify-center px-5 text-center"><div className="max-w-3xl"><div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/55 px-3 py-1.5 text-xs font-semibold text-[#667897]"><Sparkles size={14} /> qperl ile üretmeye başla</div><h1 className="brand-font text-5xl font-semibold tracking-[-.07em] text-[#172033] sm:text-7xl">bugün ne üreteceğiz<span className="text-[#8099bd]"> ?</span></h1><p className="mx-auto mt-6 max-w-lg text-sm leading-7 text-[var(--muted)]">Fikirlerini hayata geçirmek için doğru modeli seç. Yaz, keşfet ve qperl ile birlikte üret.</p><button onClick={() => setLanding(false)} className="mt-9 inline-flex items-center gap-3 rounded-2xl bg-[#172033] px-6 py-3.5 text-sm font-semibold text-white shadow-xl transition hover:-translate-y-1">Get started <ArrowUp size={17} className="rotate-45" /></button><div className="mt-12 flex justify-center gap-6 text-xs text-[var(--muted)]"><span><Sparkles size={13} className="mr-1 inline" />12 model</span><span><Zap size={13} className="mr-1 inline" />Akıcı sohbet</span></div></div></section> : <section className="soft-grid min-h-[calc(100vh-64px)] px-4 py-8 sm:px-8 lg:px-14"><div className="mx-auto max-w-4xl"><div className="mb-8"><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#8090a7]">30 Eylül 2026 · Çarşamba</p><h1 className="brand-font mt-2 text-3xl font-semibold tracking-[-.05em] sm:text-4xl">Bugün ne üreteceğiz?</h1></div>{messages.length === 0 && <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">{starters.map((item) => <button key={item} onClick={() => setPrompt(item)} className="glass rounded-2xl p-4 text-left text-xs font-semibold transition hover:-translate-y-1">{item}<ArrowUp size={14} className="mt-4 rotate-45 text-[#9aa6b8]" /></button>)}</div>}{messages.length > 0 && <div className="mb-6 flex flex-col gap-4">{messages.map((message, index) => <div key={index} className={`message-enter flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`${message.role === 'user' ? 'bg-[#172033] text-white' : 'glass'} max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed`}><div className="mb-1 text-[10px] font-semibold uppercase opacity-60">{message.role === 'user' ? 'Sen' : selected.name}</div>{message.text}{message.role === 'assistant' && generating && <span className="typing-cursor" />}</div></div>)}<div ref={endRef} /></div>}{live && <div className="qoyster-stage mb-6 flex flex-col items-center"><div className="qoyster-aura" /><div className="qoyster" aria-label="qoyster canlı maskotu"><span className="qoyster-eye qoyster-eye-left" /><span className="qoyster-eye qoyster-eye-right" /><span className="qoyster-mouth" /></div><div className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#657797]"><span className="live-dot" /> qoyster canlı modda</div></div>}<div className="glass rounded-3xl p-2"><textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) { e.preventDefault(); send() } }} placeholder="qperl'e bir şey sor..." rows={3} className="w-full resize-none bg-transparent px-3 py-2 text-sm outline-none" /><div className="flex items-center justify-between border-t border-[var(--line)] px-2 pt-2"><div className="flex items-center gap-1"><button onClick={() => { setLive(!live); toast(live ? 'Live mode kapatıldı' : 'Live mode açıldı') }} className={`rounded-lg p-2 text-xs ${live ? 'bg-[#dcebe4] text-[#2c7659]' : 'text-[var(--muted)]'}`} aria-pressed={live}><Radio size={16} /></button><button onClick={() => toast('Dosya ekleme yakında')} className="rounded-lg p-2 text-[var(--muted)]" aria-label="Dosya ekle"><Paperclip size={16} /></button></div><div className="relative flex items-center gap-2"><button onClick={() => setModelsOpen(!modelsOpen)} className="flex items-center gap-2 rounded-lg px-2 py-2 text-xs"><span className="size-2 rounded-full" style={{ backgroundColor: selected.color }} />{selected.name}<ChevronDown size={14} /></button>{modelsOpen && <div className="glass absolute bottom-11 right-0 z-10 w-60 rounded-2xl p-2">{models.map((model) => <button key={model.name} onClick={() => { setSelected(model); setModelsOpen(false) }} className="flex w-full items-center gap-2 rounded-xl p-3 text-left text-xs hover:bg-white/70"><span className="size-2 rounded-full" style={{ backgroundColor: model.color }} /><span>{model.name}<small className="ml-2 text-[var(--muted)]">{model.provider}</small></span></button>)}</div>}<button onClick={() => send()} disabled={!prompt.trim() || generating} className="grid size-9 place-items-center rounded-xl bg-[#172033] text-white disabled:opacity-40" aria-label="Gönder"><ArrowUp size={17} /></button></div></div></div><p className="mt-4 text-center text-[11px] text-[var(--muted)]">qperl bazen hata yapabilir. Önemli bilgileri kontrol etmeyi unutma.</p><button onClick={() => { setMessages([]); setPrompt('') }} className="mx-auto mt-8 flex items-center gap-2 text-xs text-[var(--muted)]"><Plus size={14} /> Yeni sohbet</button></div></section>}
  </main>
}
