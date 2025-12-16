'use client'

import { useState, useEffect, useRef } from 'react'
import Pusher from 'pusher-js'

interface Message {
  id: string
  sender: 'user' | 'admin'
  text: string
  status: string
  createdAt: string
}

interface Conversation {
  id: string
  messages: Message[]
}

export function ChatBox() {
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Pobierz konwersację
  useEffect(() => {
    const fetchConversation = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return

        const response = await fetch('/api/chat/conversation', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setConversation(data.conversation)
          setMessages(data.conversation.messages || [])
        }
      } catch (err) {
        console.error('Error fetching conversation:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchConversation()
  }, [])

  // Subskrypcja Pusher
  useEffect(() => {
    if (!conversation?.id) return

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || '', {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu',
    })

    const channel = pusher.subscribe(`chat-${conversation.id}`)

    channel.bind('message:new', (data: { message: Message }) => {
      setMessages((prev) => {
        // Sprawdź czy wiadomość już istnieje
        if (prev.some((m) => m.id === data.message.id)) {
          return prev
        }
        return [...prev, data.message]
      })
    })

    return () => {
      channel.unbind_all()
      pusher.unsubscribe(`chat-${conversation.id}`)
    }
  }, [conversation?.id])

  // Przewiń do ostatniej wiadomości
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!draft.trim() || sending) return

    setSending(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: draft }),
      })

      if (response.ok) {
        const data = await response.json()
        // Dodaj wiadomość lokalnie (Pusher też ją dostarczy, ale dla szybszego UX)
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) {
            return prev
          }
          return [...prev, data.message]
        })
        setDraft('')
      } else {
        const data = await response.json()
        setError(data.error || 'Błąd wysyłania')
      }
    } catch (err) {
      setError('Błąd połączenia')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        Ładowanie...
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Nagłówek */}
      <div className="pb-3 border-b border-white/10 mb-3">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
          Wiadomości
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Napisz do nas, odpowiemy najszybciej jak to możliwe
        </p>
      </div>

      {/* Lista wiadomości */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-3" style={{ maxHeight: '350px' }}>
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            Brak wiadomości. Napisz pierwszą wiadomość!
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                  message.sender === 'user'
                    ? 'bg-primary-600 text-white rounded-br-md'
                    : 'bg-gray-700 text-white rounded-bl-md'
                }`}
              >
                <div className="break-words">{message.text}</div>
                <div className="text-[10px] opacity-60 mt-1 text-right">
                  {formatTime(message.createdAt)}
                  {message.sender === 'user' && (
                    <span className="ml-1">
                      {message.status === 'read' ? '✓✓' : '✓'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Błąd */}
      {error && (
        <div className="text-red-400 text-xs mb-2 text-center">{error}</div>
      )}

      {/* Pole wejścia */}
      <div className="flex items-center gap-2 pt-3 border-t border-white/10">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Napisz wiadomość..."
          className="flex-1 px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder-gray-500 text-sm"
          disabled={sending}
        />
        <button
          onClick={sendMessage}
          disabled={sending || !draft.trim()}
          className="p-2 btn-primary-elegant rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Wyślij"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}


