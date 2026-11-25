'use client'

import SendChatMessageService from '@/src/actions/chat/send_message'
import { ChatMessage } from '@/src/types/chat'
import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useRef, useState } from 'react'
import { AlertCircle, Bot, Loader2, RotateCcw, Send } from 'lucide-react'

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Olá! Sou o assistente da NERO. Posso ajudar com o status dos seus pedidos e reembolsos. Como posso ajudar?',
}

const SUGGESTIONS: string[] = [
  'Como solicito reembolso?',
  'Onde vejo o status do meu pedido?',
]

export default function SupportChat() {
  const router = useRouter()
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState<string>('')
  const [sending, setSending] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [lastFailed, setLastFailed] = useState<string>('')
  const idCounter = useRef<number>(0)
  const endRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, sending, error])

  function nextId(): string {
    idCounter.current += 1
    return `msg-${idCounter.current}`
  }

  async function send(text: string, appendUserMessage: boolean) {
    const clean = text.trim()
    if (!clean || sending) return

    setError('')
    setLastFailed('')
    if (appendUserMessage) {
      setMessages((prev) => [...prev, { id: nextId(), role: 'user', content: clean }])
    }
    setSending(true)

    try {
      const reply = await SendChatMessageService(clean)
      setMessages((prev) => [...prev, { id: nextId(), role: 'assistant', content: reply }])
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      if (message === '401') {
        router.push('/login')
        return
      }
      setError('Não foi possível enviar sua mensagem agora. Tente novamente.')
      setLastFailed(clean)
    } finally {
      setSending(false)
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const text = input
    setInput('')
    void send(text, true)
  }

  return (
    <section
      aria-label="Atendimento ao cliente"
      className="rounded-3xl border border-black/10 dark:border-white/10 bg-[#F2F0F1] dark:bg-[#1a1a1a] p-6 sm:p-8 space-y-4 text-black dark:text-white transition-colors"
    >
      <div className="flex items-center gap-2">
        <Bot size={18} aria-hidden="true" />
        <h3 className="font-display text-lg font-bold uppercase tracking-tight">Assistente NERO</h3>
      </div>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Tire dúvidas sobre pedidos e reembolsos.
      </p>

      <div aria-live="polite" className="max-h-[420px] min-h-[300px] overflow-y-auto space-y-3 pr-1">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <p
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-black dark:bg-white text-white dark:text-black'
                  : 'bg-white dark:bg-[#121212] text-black dark:text-white border border-black/10 dark:border-white/10'
              }`}
            >
              {msg.content}
            </p>
          </div>
        ))}

        {sending && (
          <p role="status" className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            <Loader2 size={14} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
            Digitando...
          </p>
        )}

        {error && (
          <div
            role="alert"
            className="flex flex-col gap-2 rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-3 text-xs font-medium text-red-600 dark:text-red-400"
          >
            <span className="flex items-start gap-2">
              <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
              {error}
            </span>
            {lastFailed && (
              <button
                type="button"
                onClick={() => void send(lastFailed, false)}
                disabled={sending}
                className="inline-flex w-fit items-center gap-1 rounded-full border border-red-300 dark:border-red-800 px-3 py-1 font-semibold hover:bg-red-100 dark:hover:bg-red-900/40 focus-visible:outline-2 focus-visible:outline-red-600 disabled:opacity-50 cursor-pointer"
              >
                <RotateCcw size={12} aria-hidden="true" /> Tentar novamente
              </button>
            )}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => void send(suggestion, true)}
            disabled={sending}
            className="rounded-full border border-black/15 dark:border-white/20 bg-white dark:bg-[#121212] px-3 py-1.5 text-xs font-medium text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-[#242424] focus-visible:outline-2 focus-visible:outline-black dark:focus-visible:outline-white disabled:opacity-50 cursor-pointer transition-colors"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <label htmlFor="support-chat-input" className="sr-only">
          Digite sua mensagem
        </label>
        <input
          id="support-chat-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={1000}
          disabled={sending}
          placeholder="Digite sua mensagem..."
          className="h-11 min-w-0 flex-1 rounded-full border border-black/15 dark:border-white/20 bg-white dark:bg-[#121212] px-4 text-sm text-black dark:text-white placeholder:text-neutral-500 focus-visible:outline-2 focus-visible:outline-black dark:focus-visible:outline-white disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          aria-label="Enviar mensagem"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black dark:bg-white text-white dark:text-black hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:focus-visible:outline-white disabled:opacity-50 cursor-pointer transition-opacity"
        >
          <Send size={16} aria-hidden="true" />
        </button>
      </form>
    </section>
  )
}
