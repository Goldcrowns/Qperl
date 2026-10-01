'use client'

import { useRef, useState } from 'react'
import { ArrowUp, Bell, BookOpen, ChevronDown, Code2, Copy, FileText, Folder, Grid2X2, Image as ImageIcon, LayoutDashboard, LoaderCircle, Menu, Mic, MoreHorizontal, Paperclip, Plus, Search, Settings2, Sparkles, Star, WandSparkles, X, Zap } from 'lucide-react'
import { Toaster, toast } from 'sonner'

type Model = { name: string; provider: string; color: string; badge?: string }
const models: Model[] = [
  { name: 'Claude 3.7 Sonnet', provider: 'Anthropic', color: '#d68b68', badge: 'NEW' },
  { name: 'GPT-4o', provider: 'OpenAI', color: '#59a681' },
  { name: 'Gemini Flash Lite Latest', provider: 'Google', color: '#6a8eea', badge: 'FAST' },
  { name: 'Grok 3', provider: 'xAI', color: '#1d2939' },
]
const starterPrompts = ['Bir ürün fikrininin analizi yap', 'Bu metni daha iyi yaz', 'Kodumda hata bul', 'Bana bir plan çıkar']

export default function Home() {
  const [selected, setSelected] = useState(models[0])
  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [showModels, setShowModels] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const typingTimers = useRef<number[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)

  async function speakLatest() {
    const latest = [...messages].reverse().find((message) => message.role === 'assistant' && message.text.trim())
    if (!latest || isSpeaking) return
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error('Tarayıcın mikrofon erişimini desteklemiyor.')
      return
    }
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      setIsSpeaking(true)
      const response = await fetch('/api/voice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: latest.text }) })
      if (!response.ok) throw new Error('voice')
      const audio = new Audio(URL.createObjectURL(await response.blob()))
      audioRef.current = audio
      audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(audio.src) }
      await audio.play()
    } catch {
      setIsSpeaking(false)
      toast.error('Sesli yanıt alınamadı. Mikrofon iznini kontrol et.')
    }
  }

  function sendPrompt(text = prompt) {
    if (!text.trim() || isGenerating) return
    typingTimers.current.forEach((timer) => window.clearInterval(timer))
    typingTimers.current = []
    setMessages((current) => [...current, { role: 'user', text }])
    setPrompt(''); setIsGenerating(true)
    window.setTimeout(() => {
      const answer = `${selected.name} ile düşündüm. “${text}” için kapsamlı bir yanıt hazırladım. qperl üzerinde farklı modelleri karşılaştırarak en iyi sonucu birlikte geliştirebilirsin.`
      const assistantIndex = messages.length + 1
      setMessages((current) => [...current, { role: 'assistant', text: '' }])
      let characterIndex = 0
      const timer = window.setInterval(() => {
        characterIndex += 2
        setMessages((current) => current.map((message, index) => index === assistantIndex ? { ...message, text: answer.slice(0, characterIndex) } : message))
        if (characterIndex >= answer.length) {
          window.clearInterval(timer)
          typingTimers.current = typingTimers.current.filter((item) => item !== timer)
          setIsGenerating(false)
        }
      }, 24)
      typingTimers.current.push(timer)
    }, 500)
  }

  return <main className="min-h-screen overflow-hidden">
    <Toaster position="bottom-right" />
    <header className="flex h-16 items-center justify-between border-b border-[var(--line)] bg-white/35 px-5 backdrop-blur-xl md:px-8">
      <div className="flex items-center gap-3"><button onClick={() => setMobileNav(!mobileNav)} className="rounded-lg p-2 hover:bg-white/60 md:hidden" aria-label="Menüyü aç"><Menu /></button><div className="brand-font text-[22px] font-bold tracking-[-.06em]">qperl<span className="text-[#7a8da9]">.</span></div><div className="hidden h-5 w-px bg-[var(--line)] sm:block"/><span className="hidden text-sm text-[var(--muted)] sm:block">AI çalışma alanı</span></div>
      <div className="flex items-center gap-2"><button className="rounded-xl p-2 text-[var(--muted)] hover:bg-white/60" aria-label="Bildirimler"><Bell size={18}/></button><button onClick={() => toast('Profil ayarları yakında')} className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-white/60 py-1 pl-1 pr-3 text-sm font-medium"><span className="grid size-7 place-items-center rounded-full bg-[#172033] text-xs text-white">A</span><span className="hidden sm:inline">Ayşe</span><ChevronDown size={14}/></button></div>
    </header>
    <div className="mx-auto flex max-w-[1440px]">
      <aside className={`${mobileNav ? 'fixed inset-y-16 left-0 z-20 flex' : 'hidden'} w-64 shrink-0 flex-col border-r border-[var(--line)] bg-white/60 p-4 backdrop-blur-xl md:flex`}>
        <button onClick={() => { setMessages([]); setPrompt('') }} className="mb-5 flex items-center justify-center gap-2 rounded-xl bg-[#172033] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#172033]/15 transition hover:-translate-y-0.5"><Plus size={17}/> Yeni sohbet</button>
        <nav className="flex flex-col gap-1 text-sm"><NavItem icon={<LayoutDashboard size={17}/>} label="Çalışma alanı" active/><NavItem icon={<Star size={17}/>} label="Favoriler"/><NavItem icon={<Folder size={17}/>} label="Projeler"/><NavItem icon={<BookOpen size={17}/>} label="Kütüphane"/></nav>
        <div className="my-7 h-px bg-[var(--line)]"/><div className="mb-3 flex items-center justify-between px-2 text-[10px] font-bold uppercase tracking-[.16em] text-[var(--muted)]"><span>Son sohbetler</span><MoreHorizontal size={15}/></div>
        <div className="flex flex-col gap-1"><ChatItem title="Landing page fikirleri"/><ChatItem title="Kampanya stratejisi"/><ChatItem title="React component refactor"/><ChatItem title="Marka isimleri"/></div>
        <div className="mt-auto flex flex-col gap-1 text-sm"><NavItem icon={<Settings2 size={17}/>} label="Ayarlar"/><div className="mt-3 rounded-xl bg-[#172033]/[.05] p-3"><div className="mb-2 flex items-center gap-2 text-xs font-semibold"><Zap size={14} className="text-[#c78a48]"/> Pro plan</div><p className="m-0 text-[11px] leading-relaxed text-[var(--muted)]">Daha güçlü modeller ve sınırsız sohbet.</p></div></div>
      </aside>
      <section className="soft-grid relative min-h-[calc(100vh-64px)] flex-1 px-4 py-6 sm:px-8 lg:px-14">
        <div className="mx-auto flex max-w-4xl flex-col">
          <div className="mb-8 flex items-end justify-between"><div><p className="mb-2 text-xs font-semibold uppercase tracking-[.18em] text-[#8090a7]">30 Eylül 2026 · Çarşamba</p><h1 className="brand-font m-0 text-3xl font-semibold tracking-[-.05em] sm:text-4xl">Bugün ne üreteceğiz?</h1></div><button onClick={() => toast('Klavye kısayolları: ⌘ K model seç, ⌘ Enter gönder')} className="hidden items-center gap-2 rounded-lg border border-[var(--line)] bg-white/50 px-3 py-2 text-xs text-[var(--muted)] sm:flex"><span className="rounded border border-[var(--line)] px-1.5 py-0.5">⌘ K</span> Kısayollar</button></div>
          {messages.length === 0 ? <><div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">{starterPrompts.map((item, index) => <button key={item} onClick={() => setPrompt(item)} className="glass group rounded-2xl p-4 text-left transition hover:-translate-y-1 hover:bg-white/80"><div className="mb-5 grid size-8 place-items-center rounded-lg bg-white/75 text-[#657797]">{[<WandSparkles key="a" size={16}/>, <FileText key="b" size={16}/>, <Code2 key="c" size={16}/>, <Grid2X2 key="d" size={16}/>][index]}</div><span className="text-xs font-semibold leading-snug">{item}</span><ArrowUp size={14} className="mt-3 rotate-45 text-[#9aa6b8] transition group-hover:translate-x-1 group-hover:-translate-y-1"/></button>)}</div></> : <div className="mb-6 flex max-h-[52vh] flex-col gap-4 overflow-y-auto pr-1">{messages.map((message, index) => <div key={index} className={`message-enter flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`${message.role === 'user' ? 'rounded-2xl rounded-br-md bg-[#172033] text-white' : 'glass rounded-2xl rounded-bl-md'} max-w-[85%] px-4 py-3 text-sm leading-relaxed transition-all duration-300`}><div className="mb-1 text-[10px] font-semibold uppercase tracking-wider opacity-60">{message.role === 'user' ? 'Sen' : selected.name}</div>{message.role === 'assistant' ? <MarkdownMessage text={message.text} /> : message.text}{message.role === 'assistant' && isGenerating && index === messages.length - 1 && <span className="typing-cursor" aria-label="Yanıt yazılıyor" />}</div></div>)}{isGenerating && <div className="glass flex w-fit items-center gap-2 rounded-2xl px-4 py-3 text-sm text-[var(--muted)]"><Sparkles size={15} className="animate-pulse"/> Düşünüyor...</div>}</div>}
          <div className="glass relative rounded-3xl p-2 transition focus-within:ring-2 focus-within:ring-[#8099bd]/30"><textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) { event.preventDefault(); sendPrompt() } }} placeholder="qperl'e bir şey sor..." rows={3} className="w-full resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-[#9aa6b8]"/><div className="flex items-center justify-between gap-2 border-t border-[var(--line)] px-2 pt-2"><div className="flex items-center gap-1"><button onClick={() => toast('Dosya yükleme için sürükleyip bırakabilirsin')} className="rounded-lg p-2 text-[var(--muted)] hover:bg-white/70" aria-label="Dosya ekle"><Paperclip size={17}/></button><button onClick={speakLatest} disabled={isSpeaking} className="rounded-lg p-2 text-[var(--muted)] hover:bg-white/70 disabled:opacity-50" aria-label="Mikrofonla sesli yanıt al">{isSpeaking ? <LoaderCircle size={17} className="animate-spin"/> : <Mic size={17}/>}</button><span className="hidden pl-2 text-[11px] text-[var(--muted)] sm:inline">Shift + Enter ile yeni satır</span></div><div className="relative flex items-center gap-2"><button onClick={() => setShowModels(!showModels)} className="flex items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium hover:bg-white/70"><span className="size-2 rounded-full" style={{backgroundColor: selected.color}}/>{selected.name}<ChevronDown size={14}/></button>{showModels && <div className="glass absolute bottom-11 right-0 z-10 w-64 rounded-2xl p-2">{models.map((model) => <button key={model.name} onClick={() => { setSelected(model); setShowModels(false) }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs hover:bg-white/70"><span className="size-2.5 rounded-full" style={{backgroundColor:model.color}}/><span className="flex-1"><b className="block">{model.name}</b><span className="text-[10px] text-[var(--muted)]">{model.provider}</span></span>{model.badge && <span className="text-[9px] font-bold text-[#8392a7]">{model.badge}</span>}</button>)}</div>}<button onClick={() => sendPrompt()} disabled={!prompt.trim() || isGenerating} className="grid size-9 place-items-center rounded-xl bg-[#172033] text-white transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-30" aria-label="Gönder"><ArrowUp size={17}/></button></div></div></div>
          <p className="mt-4 text-center text-[11px] text-[var(--muted)]">qperl bazen hata yapabilir. Önemli bilgileri kontrol etmeyi unutma.</p>
          <div className="mt-10 flex items-center justify-center gap-5 text-xs text-[var(--muted)]"><span className="flex items-center gap-1.5"><Sparkles size={13}/> 12 model</span><span className="size-1 rounded-full bg-[#aab4c2]"/><span className="flex items-center gap-1.5"><Zap size={13}/> Hızlı yanıt</span><span className="size-1 rounded-full bg-[#aab4c2]"/><span className="flex items-center gap-1.5"><Copy size={13}/> Kolay paylaşım</span></div>
        </div>
      </section>
    </div>
  </main>
}
function MarkdownMessage({ text }: { text: string }) {
  return <div className="markdown-content">{text.split('\n').map((line, index) => {
    if (line.startsWith('### ')) return <h4 key={index}>{line.slice(4)}</h4>
    if (line.startsWith('## ')) return <h3 key={index}>{line.slice(3)}</h3>
    if (line.startsWith('# ')) return <h2 key={index}>{line.slice(2)}</h2>
    if (line.startsWith('- ')) return <li key={index}>{line.slice(2)}</li>
    if (!line.trim()) return <br key={index} />
    const parts = line.split(/(\*\*.*?\*\*)/g)
    return <p key={index}>{parts.map((part, partIndex) => part.startsWith('**') && part.endsWith('**') ? <strong key={partIndex}>{part.slice(2, -2)}</strong> : part)}</p>
  })}</div>
}
function NavItem({icon,label,active=false}:{icon:React.ReactNode;label:string;active?:boolean}) { return <button className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left ${active ? 'bg-white/80 font-semibold shadow-sm' : 'text-[var(--muted)] hover:bg-white/60'}`}>{icon}{label}</button> }
function ChatItem({title}:{title:string}) { return <button className="flex items-center gap-2 truncate rounded-lg px-3 py-2 text-left text-xs text-[var(--muted)] hover:bg-white/60"><span className="size-1.5 shrink-0 rounded-full bg-[#b9c7d8]"/>{title}</button> }
