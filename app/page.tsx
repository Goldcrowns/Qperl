'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUp, ChevronDown, Languages, Menu, Mic, Paperclip, Plus, Radio, Sparkles, Square, Volume2, X, Zap } from 'lucide-react'
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
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<{ start: () => void; stop: () => void; onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onend: (() => void) | null } | null>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, generating])

  async function speak(text: string) {
    setSpeaking(true)
    try {
      const response = await fetch('/api/voice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) })
      if (!response.ok) throw new Error('Ses üretilemedi')
      const audio = new Audio(URL.createObjectURL(await response.blob()))
      audio.onended = () => setSpeaking(false)
      await audio.play()
    } catch { setSpeaking(false); toast('Sesli yanıt kullanılamadı') }
  }

  function toggleMic() {
    const Recognition = (window as Window & { SpeechRecognition?: new () => typeof recognitionRef.current; webkitSpeechRecognition?: new () => typeof recognitionRef.current }).SpeechRecognition || (window as Window & { webkitSpeechRecognition?: new () => typeof recognitionRef.current }).webkitSpeechRecognition
    if (!Recognition) { toast('Bu tarayıcı mikrofonla yazmayı desteklemiyor'); return }
    if (listening) { recognitionRef.current?.stop(); return }
    const recognition = new Recognition() as NonNullable<typeof recognitionRef.current>
    recognition.onresult = (event) => setPrompt((event.results[0]?.[0]?.transcript || '').trim())
    recognition.onend = () => setListening(false)
    recognitionRef.current = recognition
    recognition.start(); setListening(true)
  }

  async function send(text = prompt) {
    if (!text.trim() || generating) return
    const history = [...messages, { role: 'user' as const, text }]
    setMessages([...history, { role: 'assistant', text: '' }]); setPrompt(''); setGenerating(true)
    try {
      const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: selected.name, messages: history }) })
      const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Yanıt alınamadı')
      const answer = String(data.text); let index = 0
      const timer = window.setInterval(() => { index += 2; setMessages((current) => current.map((item, itemIndex) => itemIndex === current.length - 1 ? { ...item, text: answer.slice(0, index) } : item)); if (index >= answer.length) { window.clearInterval(timer); setGenerating(false); if (live) void speak(answer) } }, 18)
    } catch (error) { setMessages(history); setGenerating(false); toast(error instanceof Error ? error.message : 'OpenRouter bağlantısı kurulamadı') }
  }

  return <main className="min-h-screen"><Toaster position="bottom-right" />
    <header className="flex h-16 items-center justify-between border-b border-[var(--line)] bg-white/40 px-5 backdrop-blur-xl md:px-8"><div className="flex items-center gap-3"><button className="rounded-lg p-2 md:hidden" aria-label="Menü"><Menu /></button><strong className="brand-font text-[22px] tracking-[-.06em]">qperl<span className="text-[#8099bd]">.</span></strong><span className="hidden border-l border-[var(--line)] pl-3 text-sm text-[var(--muted)] sm:block">AI çalışma alanı</span></div><div className="flex items-center gap-2"><div className="relative"><Languages size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" /><select value={language} onChange={(e) => { setLanguage(e.target.value); toast(`Dil ${e.target.value} olarak değiştirildi`) }} className="h-9 rounded-xl border border-[var(--line)] bg-white/60 pl-8 pr-3 text-xs font-semibold" aria-label="Dil seç"><option>TR</option><option>EN</option><option>DE</option><option>FR</option></select></div><span className="grid size-8 place-items-center rounded-full bg-[#172033] text-xs text-white">A</span></div></header>
    {landing ? <section className="landing-screen flex min-h-[calc(100vh-64px)] items-center justify-center px-5 text-center"><div className="max-w-3xl"><div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/55 px-3 py-1.5 text-xs font-semibold text-[#667897]"><Sparkles size={14} /> qperl ile üretmeye başla</div><h1 className="brand-font text-5xl font-semibold tracking-[-.07em] text-[#172033] sm:text-7xl">bugün ne üreteceğiz<span className="text-[#8099bd]"> ?</span></h1><p className="mx-auto mt-6 max-w-lg text-sm leading-7 text-[var(--muted)]">Fikirlerini hayata geçirmek için doğru modeli seç. Yaz, keşfet ve qperl ile birlikte üret.</p><button onClick={() => setLanding(false)} className="mt-9 inline-flex items-center gap-3 rounded-2xl bg-[#172033] px-6 py-3.5 text-sm font-semibold text-white shadow-xl transition hover:-translate-y-1">Get started <ArrowUp size={17} className="rotate-45" /></button><div className="mt-12 flex justify-center gap-6 text-xs text-[var(--muted)]"><span><Sparkles size={13} className="mr-1 inline" />12 model</span><span><Zap size={13} className="mr-1 inline" />Akıcı sohbet</span></div></div></section> : <section className="soft-grid min-h-[calc(100vh-64px)] px-4 py-8 sm:px-8 lg:px-14"><div className="mx-auto max-w-4xl"><div className="mb-8"><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#8090a7]">30 Eylül 2026 · Çarşamba</p><h1 className="brand-font mt-2 text-3xl font-semibold tracking-[-.05em] sm:text-4xl">Bugün ne üreteceğiz?</h1></div>{messages.length === 0 && <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">{starters.map((item) => <button key={item} onClick={() => setPrompt(item)} className="glass rounded-2xl p-4 text-left text-xs font-semibold transition hover:-translate-y-1">{item}<ArrowUp size={14} className="mt-4 rotate-45 text-[#9aa6b8]" /></button>)}</div>}{messages.length > 0 && <div className="mb-6 flex flex-col gap-4">{messages.map((message, index) => <div key={`${message.role}-${index}`} className={message.role === 'user' ? 'ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-[#172033] px-4 py-3 text-sm text-white' : 'max-w-[85%] rounded-2xl rounded-bl-md border border-white/70 bg-white/65 px-4 py-3 text-sm leading-7 text-[#26344b]'}>{message.text || (generating && <span className="typing-dots">qperl düşünüyor</span>)}{message.role === 'assistant' && message.text && <button onClick={() => void speak(message.text)} className="ml-2 inline-flex align-middle text-[#8099bd]" aria-label="Yanıtı seslendir"><Volume2 size={15} /></button>}</div>)}</div>}<div className="composer glass sticky bottom-4 rounded-3xl p-3 shadow-xl"><div className="mb-2 flex items-center justify-between px-2"><div className="relative"><button onClick={() => setModelsOpen(!modelsOpen)} className="flex items-center gap-2 text-xs font-semibold"><span className="size-2 rounded-full" style={{ background: selected.color }} />{selected.name}<ChevronDown size={14} /></button>{modelsOpen && <div className="absolute bottom-7 left-0 z-10 min-w-56 rounded-2xl border border-[var(--line)] bg-white p-2 shadow-xl">{models.map((model) => <button key={model.name} onClick={() => { setSelected(model); setModelsOpen(false) }} className="flex w-full items-center gap-2 rounded-xl p-2 text-left text-xs hover:bg-[#edf3fb]"><span className="size-2 rounded-full" style={{ background: model.color }} />{model.name}<span className="ml-auto text-[10px] text-[var(--muted)]">{model.provider}</span></button>)}</div>}</div><button onClick={() => setLive(true)} className="flex items-center gap-1.5 rounded-full border border-[#c6d7ed] px-2.5 py-1 text-[10px] font-bold text-[#6681a7]"><Radio size={12} /> Live mode</button></div><textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) { e.preventDefault(); void send() } }} placeholder="Bir şeyler üret..." className="min-h-20 w-full resize-none bg-transparent px-2 py-2 text-sm outline-none" aria-label="Mesaj yaz" /><div className="flex items-center justify-between"><div className="flex gap-1"><button className="rounded-xl p-2 text-[#8090a7] hover:bg-white/70" aria-label="Dosya ekle"><Paperclip size={17} /></button><button onClick={toggleMic} className={`rounded-xl p-2 ${listening ? 'bg-[#dceafe] text-[#5274a5]' : 'text-[#8090a7] hover:bg-white/70'}`} aria-label="Mikrofon"><Mic size={17} /></button></div><button onClick={() => void send()} disabled={generating || !prompt.trim()} className="grid size-10 place-items-center rounded-xl bg-[#172033] text-white disabled:opacity-40" aria-label="Gönder"><ArrowUp size={18} /></button></div></div><div ref={endRef} /></div></section>}
    {live && <div className="fixed inset-0 z-50 grid place-items-center bg-[#172033]/40 p-4 backdrop-blur-md"><div className="relative w-full max-w-sm rounded-[2rem] border border-white/80 bg-[#f8fbff]/95 p-8 text-center shadow-2xl"><button onClick={() => { setLive(false); recognitionRef.current?.stop() }} className="absolute right-5 top-5 rounded-full p-2 text-[#73829a] hover:bg-white" aria-label="Kapat"><X size={18} /></button><p className="text-xs font-bold uppercase tracking-[.2em] text-[#8099bd]">qperl live mode</p><div className={`qoyster-orb mx-auto mt-8 ${listening || speaking ? 'is-active' : ''}`}><div className="qoyster-eye left-eye" /><div className="qoyster-eye right-eye" /><div className="qoyster-mouth" /></div><h2 className="brand-font mt-6 text-3xl font-semibold text-[#172033]">qoyster</h2><p className="mt-2 text-sm text-[#718099]">{listening ? 'Seni dinliyorum...' : speaking ? 'Yanıt veriyorum...' : 'Konuşmak için mikrofona dokun'}</p><button onClick={toggleMic} className={`mx-auto mt-7 flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white ${listening ? 'bg-[#6c86ae]' : 'bg-[#172033]'}`}><Mic size={17} />{listening ? 'Dinlemeyi bitir' : 'Mikrofonu aç'}</button><p className="mt-4 text-[11px] text-[#8a98aa]">Mikrofon izni yalnızca canlı mod için kullanılır.</p></div></div>}
  </main>
}
