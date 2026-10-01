'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUp, ChevronDown, Languages, Menu, Mic, Paperclip, Plus, Radio, Sparkles, Square, Volume2, Zap } from 'lucide-react'
import { Toaster, toast } from 'sonner'

type Model = { name: string; provider: string; color: string }
type Message = { role: 'user' | 'assistant'; text: string }

const models: Model[] = [
  { name: 'Llama 3.3 70B', provider: 'Meta · Ücretsiz', color: '#6a8eea' },
  { name: 'Gemma 3 27B', provider: 'Google · Ücretsiz', color: '#59a681' },
  { name: 'DeepSeek Chat V3', provider: 'DeepSeek · Ücretsiz', color: '#d68b68' },
  { name: 'Qwen 2.5 72B', provider: 'Qwen · Ücretsiz', color: '#8099bd' },
  { name: 'Gemini Flash Lite', provider: 'Google · Ücretsiz', color: '#8c77d8' },
]
const starters = ['Bir ürün fikrini analiz et', 'Bu metni daha iyi yaz', 'Kodumda hata bul', 'Bana bir plan çıkar']

export default function Home() {
  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [selected, setSelected] = useState(models[0])
  const [modelsOpen, setModelsOpen] = useState(false)
  const [live, setLive] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [language, setLanguage] = useState('TR')
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [sessionId, setSessionId] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<{ start: () => void; stop: () => void; onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onend: (() => void) | null } | null>(null)

  useEffect(() => {
    const key = 'qperl-session-id'
    const existing = window.sessionStorage.getItem(key) || `q-live-${crypto.randomUUID().slice(0, 8)}`
    window.sessionStorage.setItem(key, existing)
    setSessionId(existing)
  }, [])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [messages, generating])

  async function speak(text: string) {
    setSpeaking(true)
    try {
      const response = await fetch('/api/voice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) })
      if (!response.ok) throw new Error()
      const audio = new Audio(URL.createObjectURL(await response.blob()))
      audio.onended = () => setSpeaking(false)
      await audio.play()
    } catch { setSpeaking(false); toast('Sesli yanıt şu an kullanılamıyor') }
  }

  function toggleMic() {
    const browser = window as Window & { SpeechRecognition?: new () => typeof recognitionRef.current; webkitSpeechRecognition?: new () => typeof recognitionRef.current }
    const Recognition = browser.SpeechRecognition || browser.webkitSpeechRecognition
    if (!Recognition) { toast('Bu tarayıcı mikrofonla yazmayı desteklemiyor'); return }
    if (listening) { recognitionRef.current?.stop(); return }
    const recognition = new Recognition() as NonNullable<typeof recognitionRef.current>
    recognition.onresult = (event) => {
      const transcript = (event.results[0]?.[0]?.transcript || '').trim()
      if (!transcript) return
      if (live) void send(transcript)
      else setPrompt(transcript)
    }
    recognition.onend = () => setListening(false)
    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }

  async function send(text = prompt) {
    if (!text.trim() || generating) return
    const history = [...messages, { role: 'user' as const, text: text.trim() }]
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
        if (index >= answer.length) { window.clearInterval(timer); setGenerating(false); if (live) void speak(answer) }
      }, 18)
    } catch (error) { setMessages(history); setGenerating(false); toast(error instanceof Error ? error.message : 'AI bağlantısı kurulamadı') }
  }

  function openLive() {
    setLive(true)
    navigator.mediaDevices?.getUserMedia({ audio: true }).then((stream) => stream.getTracks().forEach((track) => track.stop())).catch(() => toast('Canlı mod için mikrofon izni verilmedi'))
  }

  return <main className="min-h-screen"><Toaster position="bottom-right" />
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--line)] bg-white/55 px-4 backdrop-blur-xl sm:px-8"><div className="flex items-center gap-3"><button className="rounded-lg p-2 md:hidden" aria-label="Menü"><Menu /></button><strong className="brand-font text-[22px] tracking-[-.06em]">qperl<span className="text-[#8099bd]">.</span></strong><span className="hidden border-l border-[var(--line)] pl-3 text-sm text-[var(--muted)] sm:block">AI çalışma alanı</span><span className="hidden text-[10px] text-[var(--muted)] lg:block">{sessionId}</span></div><div className="flex items-center gap-2"><div className="relative"><Languages size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" /><select value={language} onChange={(e) => { setLanguage(e.target.value); toast(`Dil ${e.target.value} olarak değiştirildi`) }} className="h-9 rounded-xl border border-[var(--line)] bg-white/60 pl-8 pr-3 text-xs font-semibold" aria-label="Dil seç"><option>TR</option><option>EN</option><option>DE</option><option>FR</option></select></div><span className="grid size-8 place-items-center rounded-full bg-[#172033] text-xs text-white">A</span></div></header>
    <section className="soft-grid min-h-[calc(100vh-64px)] px-4 py-8 pb-28 sm:px-8 lg:px-14"><div className="mx-auto max-w-4xl"><div className="mb-8 flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#8090a7]">Qperl workspace</p><h1 className="brand-font mt-2 text-3xl font-semibold tracking-[-.05em] sm:text-4xl">Bugün ne üreteceğiz?</h1></div><div className="hidden items-center gap-2 text-xs text-[#697488] sm:flex"><span className="live-dot" /> Oturum aktif</div></div>
      {messages.length === 0 && <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">{starters.map((item) => <button key={item} onClick={() => setPrompt(item)} className="glass rounded-2xl p-4 text-left text-xs font-semibold transition hover:-translate-y-1">{item}<ArrowUp size={14} className="mt-4 rotate-45 text-[#9aa6b8]" /></button>)}</div>}
      {messages.length > 0 && <div className="mb-6 flex flex-col gap-4">{messages.map((message, index) => <div key={`${message.role}-${index}`} className={`message-enter flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[88%] rounded-3xl px-5 py-4 text-sm leading-7 shadow-sm ${message.role === 'user' ? 'bg-[#172033] text-white' : 'glass text-[#344057]'}`}>{message.text || (generating ? <span className="typing-cursor" /> : '')}{message.role === 'assistant' && message.text && !generating && <button onClick={() => void speak(message.text)} className="ml-3 inline-flex rounded-full p-1.5 text-[#8099bd] hover:bg-white" aria-label="Yanıtı seslendir"><Volume2 size={15} /></button>}</div></div>)}<div ref={endRef} /></div>}
      {!live && <div className="glass rounded-[1.75rem] p-3 shadow-xl"><textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) { e.preventDefault(); void send() } }} placeholder="Bir şeyler üretmeye başla..." className="min-h-24 w-full resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-[#9aa6b8]" aria-label="Mesaj yaz" /><div className="flex items-center justify-between gap-2 px-2"><div className="flex items-center gap-1"><button className="rounded-xl p-2.5 text-[#77869d] hover:bg-white" aria-label="Dosya ekle"><Paperclip size={17} /></button><div className="relative"><button onClick={() => setModelsOpen(!modelsOpen)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-[#53627b] hover:bg-white"><span className="size-2 rounded-full" style={{ background: selected.color }} />{selected.name}<ChevronDown size={14} /></button>{modelsOpen && <div className="absolute bottom-12 left-0 z-20 w-60 rounded-2xl border border-[var(--line)] bg-white/95 p-2 shadow-2xl backdrop-blur-xl">{models.map((model) => <button key={model.name} onClick={() => { setSelected(model); setModelsOpen(false) }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs hover:bg-[#eef4ff]"><span className="size-2 rounded-full" style={{ background: model.color }} /><span><strong className="block">{model.name}</strong><span className="text-[#8b98aa]">{model.provider}</span></span></button>)}</div>}</div></div><div className="flex items-center gap-2"><button onClick={toggleMic} className={`rounded-xl p-2.5 ${listening ? 'bg-[#dcecff] text-[#526f9c]' : 'text-[#77869d] hover:bg-white'}`} aria-label="Mikrofon"><Mic size={17} /></button><button onClick={() => void send()} disabled={!prompt.trim() || generating} className="grid size-10 place-items-center rounded-xl bg-[#172033] text-white transition hover:-translate-y-0.5 disabled:opacity-40" aria-label="Gönder">{generating ? <Square size={15} /> : <ArrowUp size={17} />}</button></div></div></div>}
      {messages.length === 0 && <p className="mt-4 text-center text-[11px] text-[#8996a8]">Enter ile gönder · Shift + Enter yeni satır · {selected.provider}</p>}
    </div></section>
    <footer className="border-t border-[var(--line)] bg-white/65 px-4 py-3 backdrop-blur-xl sm:px-8"><div className="mx-auto flex max-w-4xl items-center justify-between gap-3"><p className="hidden text-xs text-[#7d8ca1] sm:block">qperl · Oturumun hazır</p><button onClick={() => { if (live) { recognitionRef.current?.stop(); setLive(false) } else openLive() }} className={`flex w-full items-center justify-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition sm:w-auto ${live ? 'border-[#8099bd] bg-[#172033] text-white' : 'border-white/80 bg-white/75 text-[#172033] hover:-translate-y-0.5'}`} aria-pressed={live} aria-label={live ? 'q-live modunu kapat' : 'q-live modunu aç'}><span className="qoyster qoyster-footer"><span className="qoyster-eye" /><span className="qoyster-eye qoyster-eye-right" /><span className="qoyster-mouth" /></span><span>{live ? 'q-live aktif · çık' : 'q-live ile konuş'}</span><Radio size={16} /></button></div></footer>
    {live && <section className="q-live-panel soft-grid border-t border-[var(--line)] px-4 py-10 sm:px-8"><div className="mx-auto flex max-w-4xl flex-col items-center text-center"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#8099bd]">q-live</p><div className={`qoyster-orb mx-auto mt-6 ${listening || speaking ? 'is-active' : ''}`}><span className="left-eye" /><span className="right-eye" /><span className="qoyster-mouth" /></div><h2 className="brand-font mt-5 text-3xl font-semibold text-[#172033]">Merhaba, ben q-live</h2><p className="mt-2 max-w-md text-sm text-[#718099]">{listening ? 'Seni dinliyorum...' : speaking ? 'Yanıt veriyorum...' : 'Mikrofonu aç ve konuşmaya başla.'}</p><button onClick={toggleMic} className={`mt-6 flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white ${listening ? 'bg-[#6c86ae]' : 'bg-[#172033]'}`}><Mic size={17} />{listening ? 'Dinlemeyi bitir' : 'Mikrofonu aç'}</button><p className="mt-4 text-[11px] text-[#8a98aa]">Mikrofon izni yalnızca q-live açıkken kullanılır.</p></div></section>}
  </main>
}
