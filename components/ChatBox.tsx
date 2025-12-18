'use client'

import { useState, useEffect, useRef } from 'react'

interface Message {
  id: string
  text: string
  sender: 'user' | 'admin'
  createdAt: string
  status?: string
}

export function ChatBox() {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    initializeConversation()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const initializeConversation = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        return
      }

      // Pobierz lub utwórz konwersację
      const response = await fetch('/api/chat/conversation', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setConversationId(data.id)
        
        // Pobierz wiadomości
        const messagesResponse = await fetch(`/api/chat/messages?conversationId=${data.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json()
          setMessages(messagesData.messages || [])
        }
      }
    } catch (error) {
      console.error('Failed to initialize chat:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !conversationId || sending) return

    const messageText = newMessage.trim()
    setNewMessage('')
    setSending(true)

    // Optymistycznie dodaj wiadomość
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      text: messageText,
      sender: 'user',
      createdAt: new Date().toISOString(),
      status: 'sending'
    }
    setMessages(prev => [...prev, tempMessage])

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          conversationId,
          text: messageText
        })
      })

      if (response.ok) {
        const data = await response.json()
        // Zamień tymczasową wiadomość na prawdziwą
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempMessage.id ? { ...data, status: 'sent' } : msg
          )
        )
      } else {
        // Usuń tymczasową wiadomość w przypadku błędu
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id))
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id))
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
        Wiadomości
      </h3>

      {/* Messages container */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="text-sm">Brak wiadomości</p>
            <p className="text-xs mt-1">Napisz do nas jeśli masz pytania</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                  message.sender === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white/10 text-gray-200'
                } ${message.status === 'sending' ? 'opacity-60' : ''}`}
              >
                <p className="whitespace-pre-wrap">{message.text}</p>
                <span className="text-[10px] opacity-60 mt-1 block">
                  {new Date(message.createdAt).toLocaleTimeString('pl-PL', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Napisz wiadomość..."
          className="flex-1 px-3 py-2 bg-white/5 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder-gray-500 text-sm"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  )
}
