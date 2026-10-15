'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  ArrowUp,
  Bell,
  BookOpen,
  ChevronDown,
  Copy,
  Folder,
  LayoutDashboard,
  LoaderCircle,
  Menu,
  Mic,
  MoreHorizontal,
  Paperclip,
  Plus,
  Settings2,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react'
import { Toaster, toast } from 'sonner'

type Model = { name: string; provider: string; color: string; badge?: string }
type Message = { role: 'user' | 'assistant'; text: string; model?: string }
type Attachment = { name: string; content: string }

const models: Model[] = [
  { name: 'Gemini 3.6', provider: 'Google', color: '#d68b68', badge: 'NEW' },
  { name: 'Gemini 3.7', provider: 'OpenAI', color: '#59a681' },
  { name: 'Gemini Flash Lite Latest', provider: 'Google', color: '#6a8eea', badge: 'FAST' },
  { name: 'Grok 3', provider: 'xAI', color: '#1d2939' },
]

const MAX_FILE_SIZE = 100 * 1024

export default function Home() {
  const [selected, setSelected] = useState(models[0])
  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [showModels, setShowModels] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const [activeSection, setActiveSection] = useState('Çalışma alanı')
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [attachment, setAttachment] = useState<Attachment | null>(null)

  // ⌘/Ctrl + K: model seçiciyi aç/kapat
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setShowModels((open) => !open)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Yeni mesajda listeyi en alta kaydır
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, isGenerating])

  // Sayfadan çıkarken sesi durdur
  useEffect(() => {
    return () => {
      audioRef.current?.pause()
    }
  }, [])

  async function speakLatest() {
    if (isSpeaking) return

    const latest = [...messages]
      .reverse()
      .find((message) => message.role === 'assistant' && message.text.trim())

    if (!latest) {
      toast('Henüz seslendirilecek bir yanıt yok.')
      return
    }

    let objectUrl: string | null = null
    const cleanup = () => {
      setIsSpeaking(false)
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
        objectUrl = null
      }
    }

    try {
      setIsSpeaking(true)
      audioRef.current?.pause()

      const response = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: latest.text }),
      })

      if (!response.ok) throw new Error('voice')

      objectUrl = URL.createObjectURL(await response.blob())
      const audio = new Audio(objectUrl)
      audioRef.current = audio
      audio.onended = cleanup
      audio.onerror = () => {
        cleanup()
        toast.error('Ses oynatılamadı.')
      }
      await audio.play()
    } catch {
      cleanup()
      toast.error('Sesli yanıt alınamadı.')
    }
  }

  async function sendPrompt(text = prompt) {
    if (!text.trim() || isGenerating) return

    // Eklenen metin dosyasını mesaja dahil et
    const fullText = attachment
      ? `${text}\n\n[Ek dosya: ${attachment.name}]\n${attachment.content}`
      : text

    const history = messages.map((message) => ({
      role: message.role,
      content: message.text,
    }))

    setMessages((current) => [...current, { role: 'user', text }])
    setPrompt('')
    setAttachment(null)
    setIsGenerating(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selected.name,
          messages: [...history, { role: 'user', content: fullText }],
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data.text) throw new Error(data.error || 'chat')

      setMessages((current) => [
        ...current,
        { role: 'assistant', text: data.text, model: selected.name },
      ])
    } catch {
      // Başarısız mesajı geri al, yazdığın metni koru
      setMessages((current) => current.slice(0, -1))
      setPrompt(text)
      toast.error('Yanıt alınamadı. Groq bağlantısını kontrol et.')
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleFile(file: File | undefined) {
    if (!file) return
    const isText =
      file.type.startsWith('text/') || /\.(txt|md|json|csv|ts|tsx|js|jsx|py|html|css)$/i.test(file.name)

    if (!isText) {
      toast.error('Şimdilik yalnızca metin dosyaları ekleyebilirsin.')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Dosya en fazla 100 KB olabilir.')
      return
    }

    try {
      const content = await file.text()
      setAttachment({ name: file.name, content })
      toast(`${file.name} eklendi`)
    } catch {
      toast.error('Dosya okunamadı.')
    }
  }

  function selectSection(section: string, message?: string) {
    setActiveSection(section)
    setMobileNav(false)
    if (message) toast(message)
  }

  function pickChat(text: string) {
    setPrompt(text)
    setMobileNav(false)
  }

  return (
    <main className="min-h-screen overflow-hidden">
      <Toaster position="bottom-right" />
      <header className="relative flex h-16 items-center justify-between border-b border-[var(--line)] bg-white/35 px-5 backdrop-blur-xl md:px-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileNav((open) => !open)}
            className="rounded-lg p-2 hover:bg-white/60 md:hidden"
            aria-label="Menüyü aç"
            aria-expanded={mobileNav}
          >
            <Menu />
          </button>
          <div className="brand-font text-[22px] font-bold tracking-[-.06em]">
            qperl<span className="text-[#7a8da9]">.</span>
          </div>
          <div className="hidden h-5 w-px bg-[var(--line)] sm:block" />
          <span className="hidden text-sm text-[var(--muted)] sm:block">
            Qperl AI ile daha iyi ve hızlı deneyim
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setNotificationsOpen((open) => !open)
              setProfileOpen(false)
            }}
            className="rounded-xl p-2 text-[var(--muted)] hover:bg-white/60"
            aria-label="Bildirimler"
            aria-expanded={notificationsOpen}
          >
            <Bell size={18} />
          </button>
          <button
            onClick={() => {
              setProfileOpen((open) => !open)
              setNotificationsOpen(false)
            }}
            className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-white/60 py-1 pl-1 pr-3 text-sm font-medium"
            aria-expanded={profileOpen}
          >
            <span className="grid size-7 place-items-center rounded-full bg-[#172033] text-xs text-white">
              A
            </span>
            <span className="hidden sm:inline">Kişi</span>
            <ChevronDown size={14} />
          </button>
          {profileOpen && (
            <div className="absolute right-5 top-14 z-30 w-48 rounded-2xl border border-[var(--line)] bg-white p-3 text-xs shadow-xl">
              <p className="font-semibold">Kişi hesabı</p>
              <p className="mt-1 text-[var(--muted)]">Misafir oturumu</p>
              <button
                onClick={() => {
                  setProfileOpen(false)
                  toast('Profil ayarları hazır.')
                }}
                className="mt-3 w-full rounded-lg bg-[#172033] px-3 py-2 text-white"
              >
                Profil ayarları
              </button>
            </div>
          )}
          {notificationsOpen && (
            <div className="absolute right-20 top-14 z-30 w-56 rounded-2xl border border-[var(--line)] bg-white p-3 text-xs shadow-xl">
              <p className="font-semibold">Bildirimler</p>
              <p className="mt-1 text-[var(--muted)]">Henüz yeni bildirimin yok.</p>
            </div>
          )}
        </div>
      </header>
      <div className="mx-auto flex max-w-[1440px]">
        <aside
          className={`${
            mobileNav ? 'fixed inset-y-16 left-0 z-20 flex md:static md:inset-auto' : 'hidden'
          } w-64 shrink-0 flex-col border-r border-[var(--line)] bg-white/60 p-4 backdrop-blur-xl md:flex`}
        >
          <button
            onClick={() => {
              setMessages([])
              setPrompt('')
              setAttachment(null)
              setMobileNav(false)
            }}
            className="mb-5 flex items-center justify-center gap-2 rounded-xl bg-[#172033] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#172033]/15 transition hover:-translate-y-0.5"
          >
            <Plus size={17} /> Yeni sohbet
          </button>
          <nav className="flex flex-col gap-1 text-sm">
            <NavItem
              icon={<LayoutDashboard size={17} />}
              label="Çalışma alanı"
              active={activeSection === 'Çalışma alanı'}
              onClick={() => selectSection('Çalışma alanı')}
            />
            <NavItem
              icon={<Star size={17} />}
              label="Favoriler"
              active={activeSection === 'Favoriler'}
              onClick={() => selectSection('Favoriler', 'Favoriler yakında burada görünecek.')}
            />
            <NavItem
              icon={<Folder size={17} />}
              label="Projeler"
              active={activeSection === 'Projeler'}
              onClick={() => selectSection('Projeler', 'Proje alanı seçildi.')}
            />
            <NavItem
              icon={<BookOpen size={17} />}
              label="Kütüphane"
              active={activeSection === 'Kütüphane'}
              onClick={() => selectSection('Kütüphane', 'Kütüphane seçildi.')}
            />
          </nav>
          <div className="my-7 h-px bg-[var(--line)]" />
          <div className="mb-3 flex items-center justify-between px-2 text-[10px] font-bold uppercase tracking-[.16em] text-[var(--muted)]">
            <span>Son sohbetler</span>
            <button
              onClick={() => toast('Sohbet geçmişi menüsü')}
              className="rounded p-1 hover:bg-white/70"
              aria-label="Sohbet geçmişi seçenekleri"
            >
              <MoreHorizontal size={15} />
            </button>
          </div>
          <div className="flex flex-col gap-1">
            <ChatItem title="Landing page fikirleri" onClick={() => pickChat('Landing page fikirleri hakkında yardım et')} />
            <ChatItem title="Kampanya stratejisi" onClick={() => pickChat('Kampanya stratejisi oluştur')} />
            <ChatItem title="React component refactor" onClick={() => pickChat('React component refactor öner')} />
            <ChatItem title="Marka isimleri" onClick={() => pickChat('Marka isimleri öner')} />
          </div>
          <div className="mt-auto flex flex-col gap-1 text-sm">
            <NavItem
              icon={<Settings2 size={17} />}
              label="Ayarlar"
              active={activeSection === 'Ayarlar'}
              onClick={() => selectSection('Ayarlar', 'Ayarlar paneli yakında açılacak.')}
            />
            <div className="mt-3 rounded-xl bg-[#172033]/[.05] p-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold">
                <Zap size={14} className="text-[#c78a48]" /> Pro plan
              </div>
              <p className="m-0 text-[11px] leading-relaxed text-[var(--muted)]">
                Daha güçlü modeller ve sınırsız sohbet.
              </p>
            </div>
          </div>
        </aside>
        <section className="soft-grid relative min-h-[calc(100vh-64px)] flex-1 px-4 py-6 sm:px-8 lg:px-14">
          <div className="mx-auto flex max-w-4xl flex-col">
            <div className="mb-8 flex items-end justify-between">
              <h1 className="brand-font m-0 text-3xl font-semibold tracking-[-.05em] sm:text-4xl">
                Bugün ne üreteceğiz?
              </h1>
              <button
                onClick={() => setShowModels(true)}
                className="hidden items-center gap-2 rounded-lg border border-[var(--line)] bg-white/50 px-3 py-2 text-xs text-[var(--muted)] sm:flex"
              >
                <span className="rounded border border-[var(--line)] px-1.5 py-0.5">⌘ K</span>{' '}
                Model seç
              </button>
            </div>
            <div className="mb-6 flex max-h-[52vh] flex-col gap-4 overflow-y-auto pr-1">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`message-enter flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`${
                      message.role === 'user'
                        ? 'rounded-2xl rounded-br-md bg-[#172033] text-white'
                        : 'glass rounded-2xl rounded-bl-md'
                    } max-w-[85%] px-4 py-3 text-sm leading-relaxed transition-all duration-300`}
                  >
                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider opacity-60">
                      {message.role === 'user' ? 'Sen' : message.model ?? selected.name}
                    </div>
                    {message.role === 'assistant' ? (
                      <>
                        <MarkdownMessage text={message.text} />
                        <button
                          onClick={() =>
                            navigator.clipboard
                              ?.writeText(message.text)
                              .then(() => toast('Yanıt kopyalandı'))
                              .catch(() => toast.error('Kopyalanamadı'))
                          }
                          className="mt-3 flex items-center gap-1 text-[10px] text-[var(--muted)] hover:text-[#172033]"
                          aria-label="Yanıtı kopyala"
                        >
                          <Copy size={12} /> Kopyala
                        </button>
                      </>
                    ) : (
                      <span className="whitespace-pre-wrap">{message.text}</span>
                    )}
                  </div>
                </div>
              ))}
              {isGenerating && (
                <div className="glass flex w-fit items-center gap-2 rounded-2xl px-4 py-3 text-sm text-[var(--muted)]">
                  <Sparkles size={15} className="animate-pulse" /> Düşünüyor...
                </div>
              )}
              <div ref={bottomRef} />
            </div>
            <div className="glass relative rounded-3xl p-2 transition focus-within:ring-2 focus-within:ring-[#8099bd]/30">
              {attachment && (
                <button
                  onClick={() => setAttachment(null)}
                  className="mb-2 ml-3 text-left text-[11px] text-[#657797] underline"
                >
                  Ek: {attachment.name} · kaldır
                </button>
              )}
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    event.key === 'Enter' &&
                    !event.shiftKey &&
                    !event.nativeEvent.isComposing &&
                    event.keyCode !== 229
                  ) {
                    event.preventDefault()
                    sendPrompt()
                  }
                }}
                placeholder="qperl'e bir şey sor..."
                rows={3}
                className="w-full resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-[#9aa6b8]"
              />
              <div className="flex items-center justify-between gap-2 border-t border-[var(--line)] px-2 pt-2">
                <div className="flex items-center gap-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(event) => {
                      handleFile(event.target.files?.[0])
                      event.target.value = ''
                    }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-lg p-2 text-[var(--muted)] hover:bg-white/70"
                    aria-label="Dosya ekle"
                  >
                    <Paperclip size={17} />
                  </button>
                  <button
                    onClick={speakLatest}
                    disabled={isSpeaking}
                    className="rounded-lg p-2 text-[var(--muted)] hover:bg-white/70 disabled:opacity-50"
                    aria-label="Son yanıtı sesli oku"
                  >
                    {isSpeaking ? (
                      <LoaderCircle size={17} className="animate-spin" />
                    ) : (
                      <Mic size={17} />
                    )}
                  </button>
                  <span className="hidden pl-2 text-[11px] text-[var(--muted)] sm:inline">
                    Shift + Enter ile yeni satır
                  </span>
                </div>
                <div className="relative flex items-center gap-2">
                  <button
                    onClick={() => setShowModels((open) => !open)}
                    className="flex items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium hover:bg-white/70"
                    aria-expanded={showModels}
                  >
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: selected.color }}
                    />
                    {selected.name}
                    <ChevronDown size={14} />
                  </button>
                  {showModels && (
                    <div className="glass absolute bottom-11 right-0 z-10 w-64 rounded-2xl p-2">
                      {models.map((model) => (
                        <button
                          key={model.name}
                          onClick={() => {
                            setSelected(model)
                            setShowModels(false)
                          }}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs hover:bg-white/70"
                        >
                          <span
                            className="size-2.5 rounded-full"
                            style={{ backgroundColor: model.color }}
                          />
                          <span className="flex-1">
                            <b className="block">{model.name}</b>
                            <span className="text-[10px] text-[var(--muted)]">
                              {model.provider}
                            </span>
                          </span>
                          {model.badge && (
                            <span className="text-[9px] font-bold text-[#8392a7]">
                              {model.badge}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => sendPrompt()}
                    disabled={!prompt.trim() || isGenerating}
                    className="grid size-9 place-items-center rounded-xl bg-[#172033] text-white transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Gönder"
                  >
                    <ArrowUp size={17} />
                  </button>
                </div>
              </div>
            </div>
            <p className="mt-4 text-center text-[11px] text-[var(--muted)]">
              qperl bazen hata yapabilir. Önemli bilgileri kontrol etmeyi unutma.
            </p>
            <div className="mt-10 flex items-center justify-center gap-5 text-xs text-[var(--muted)]">
              <span className="flex items-center gap-1.5">
                <Sparkles size={13} /> {models.length} model
              </span>
              <span className="size-1 rounded-full bg-[#aab4c2]" />
              <span className="flex items-center gap-1.5">
                <Zap size={13} /> Hızlı yanıt
              </span>
              <span className="size-1 rounded-full bg-[#aab4c2]" />
              <span className="flex items-center gap-1.5">
                <Copy size={13} /> Kolay paylaşım
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

/* ---------- Markdown ---------- */

function renderInline(text: string): ReactNode[] {
  return text.split(/(\*\*.*?\*\*|`[^`]+`)/g).map((part, index) => {
    if (part.length > 4 && part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>
    }
    if (part.length > 2 && part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={index} className="rounded bg-black/5 px-1 py-0.5 text-[12px]">
          {part.slice(1, -1)}
        </code>
      )
    }
    return part
  })
}

function MarkdownMessage({ text }: { text: string }) {
  const lines = text.split('\n')
  const blocks: ReactNode[] = []
  let listItems: string[] = []
  let codeLines: string[] | null = null

  const flushList = () => {
    if (!listItems.length) return
    const items = listItems
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="list-disc pl-5">
        {items.map((item, i) => (
          <li key={i}>{renderInline(item)}</li>
        ))}
      </ul>
    )
    listItems = []
  }

  lines.forEach((line) => {
    // Kod bloğu (```)
    if (line.trim().startsWith('```')) {
      if (codeLines === null) {
        flushList()
        codeLines = []
      } else {
        blocks.push(
          <pre
            key={`pre-${blocks.length}`}
            className="my-2 overflow-x-auto rounded-xl bg-[#172033] p-3 text-xs text-white"
          >
            <code>{codeLines.join('\n')}</code>
          </pre>
        )
        codeLines = null
      }
      return
    }
    if (codeLines !== null) {
      codeLines.push(line)
      return
    }

    if (/^[-*] /.test(line)) {
      listItems.push(line.slice(2))
      return
    }
    flushList()

    const key = `b-${blocks.length}`
    if (line.startsWith('### ')) blocks.push(<h4 key={key}>{renderInline(line.slice(4))}</h4>)
    else if (line.startsWith('## ')) blocks.push(<h3 key={key}>{renderInline(line.slice(3))}</h3>)
    else if (line.startsWith('# ')) blocks.push(<h2 key={key}>{renderInline(line.slice(2))}</h2>)
    else if (!line.trim()) blocks.push(<br key={key} />)
    else blocks.push(<p key={key}>{renderInline(line)}</p>)
  })

  flushList()
  // Kapanmamış kod bloğu (yanıt yarıda kesildiyse)
  if (codeLines !== null) {
    blocks.push(
      <pre
        key={`pre-${blocks.length}`}
        className="my-2 overflow-x-auto rounded-xl bg-[#172033] p-3 text-xs text-white"
      >
        <code>{(codeLines as string[]).join('\n')}</code>
      </pre>
    )
  }

  return <div className="markdown-content">{blocks}</div>
}

/* ---------- Küçük bileşenler ---------- */

function NavItem({
  icon,
  label,
  active = false,
  onClick,
}: {
  icon: ReactNode
  label: string
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left ${
        active ? 'bg-white/80 font-semibold shadow-sm' : 'text-[var(--muted)] hover:bg-white/60'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

function ChatItem({ title, onClick }: { title: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 truncate rounded-lg px-3 py-2 text-left text-xs text-[var(--muted)] hover:bg-white/60"
    >
      <span className="size-1.5 shrink-0 rounded-full bg-[#b9c7d8]" />
      {title}
    </button>
  )
}
