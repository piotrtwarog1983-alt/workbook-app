'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
  userId: string
  userEmail: string
  userName: string | null
  subject: string | null
  lastMessage: string
  lastMessageAt: string
  lastMessageSender: string | null
  unreadByAdmin: boolean
  createdAt: string
}

interface ConversationDetail {
  id: string
  user: {
    id: string
    email: string
    name: string | null
  }
  messages: Message[]
}

const ADMIN_EMAIL = 'peter.twarog@cirrenz.com'

export default function AdminInboxPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<ConversationDetail | null>(null)
  const [loadingConversations, setLoadingConversations] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Autoryzacja
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error || data.email !== ADMIN_EMAIL) {
          router.push('/course')
          return
        }
        setUser(data)
        setLoading(false)
        loadConversations()
      })
      .catch(() => {
        router.push('/login')
      })
  }, [router])

  // Pusher dla nowych wiadomości
  useEffect(() => {
    if (!selectedConversation?.id) return

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || '', {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu',
    })

    const channel = pusher.subscribe(`chat-${selectedConversation.id}`)

    channel.bind('message:new', (data: { message: Message }) => {
      setSelectedConversation((prev) => {
        if (!prev) return prev
        if (prev.messages.some((m) => m.id === data.message.id)) {
          return prev
        }
        return {
          ...prev,
          messages: [...prev.messages, data.message],
        }
      })
    })

    return () => {
      channel.unbind_all()
      pusher.unsubscribe(`chat-${selectedConversation.id}`)
    }
  }, [selectedConversation?.id])

  // Pusher dla aktualizacji listy konwersacji
  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || '', {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu',
    })

    const channel = pusher.subscribe('admin-inbox')

    channel.bind('conversation:updated', () => {
      loadConversations()
    })

    return () => {
      channel.unbind_all()
      pusher.unsubscribe('admin-inbox')
    }
  }, [])

  // Przewiń do ostatniej wiadomości
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedConversation?.messages])

  const loadConversations = async () => {
    setLoadingConversations(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/chat/conversations', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
      }
    } catch (err) {
      console.error('Error loading conversations:', err)
    } finally {
      setLoadingConversations(false)
    }
  }

  const selectConversation = async (convId: string) => {
    setLoadingMessages(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/chat/conversations/${convId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setSelectedConversation(data.conversation)
        // Odśwież listę (oznaczenie jako przeczytane)
        loadConversations()
      }
    } catch (err) {
      console.error('Error loading conversation:', err)
      setError('Błąd ładowania konwersacji')
    } finally {
      setLoadingMessages(false)
    }
  }

  const sendMessage = async () => {
    if (!draft.trim() || sending || !selectedConversation) return

    setSending(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          text: draft,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSelectedConversation((prev) => {
          if (!prev) return prev
          if (prev.messages.some((m) => m.id === data.message.id)) {
            return prev
          }
          return {
            ...prev,
            messages: [...prev.messages, data.message],
          }
        })
        setDraft('')
        loadConversations()
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Ładowanie...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b">
            <div>
              <h1 className="text-2xl font-bold">Inbox - Wiadomości</h1>
              <p className="text-sm text-gray-500 mt-1">
                Zalogowany jako: {user?.email}
              </p>
            </div>
            <div className="flex gap-4">
              <Link href="/admin" className="text-primary-600 hover:underline">
                Panel Admin
              </Link>
              <Link href="/course" className="text-primary-600 hover:underline">
                Wróć do kursu
              </Link>
            </div>
          </div>

          {/* Content - 2 kolumny */}
          <div className="flex" style={{ height: '600px' }}>
            {/* Lista konwersacji */}
            <div className="w-1/3 border-r overflow-y-auto">
              {loadingConversations ? (
                <div className="p-4 text-center text-gray-500">Ładowanie...</div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  Brak konwersacji
                </div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => selectConversation(conv.id)}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedConversation?.id === conv.id ? 'bg-primary-50' : ''
                    } ${conv.unreadByAdmin ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-sm truncate flex-1">
                        {conv.userName || conv.userEmail}
                      </span>
                      <span className="text-xs text-gray-400 ml-2">
                        {formatDate(conv.lastMessageAt)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-600 truncate flex-1">
                        {conv.lastMessageSender === 'admin' && (
                          <span className="text-gray-400">Ty: </span>
                        )}
                        {conv.lastMessage || 'Brak wiadomości'}
                      </p>
                      {conv.unreadByAdmin && (
                        <span className="w-2 h-2 bg-primary-600 rounded-full ml-2"></span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Szczegóły konwersacji */}
            <div className="flex-1 flex flex-col">
              {!selectedConversation ? (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  Wybierz konwersację z listy
                </div>
              ) : loadingMessages ? (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  Ładowanie...
                </div>
              ) : (
                <>
                  {/* Header konwersacji */}
                  <div className="p-4 border-b bg-gray-50">
                    <div className="font-medium">
                      {selectedConversation.user.name || selectedConversation.user.email}
                    </div>
                    <div className="text-sm text-gray-500">
                      {selectedConversation.user.email}
                    </div>
                  </div>

                  {/* Wiadomości */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {selectedConversation.messages.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        Brak wiadomości
                      </div>
                    ) : (
                      selectedConversation.messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.sender === 'admin' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${
                              message.sender === 'admin'
                                ? 'bg-primary-600 text-white rounded-br-md'
                                : 'bg-gray-200 text-gray-900 rounded-bl-md'
                            }`}
                          >
                            <div className="break-words">{message.text}</div>
                            <div
                              className={`text-[10px] mt-1 text-right ${
                                message.sender === 'admin' ? 'opacity-60' : 'text-gray-500'
                              }`}
                            >
                              {formatTime(message.createdAt)}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Błąd */}
                  {error && (
                    <div className="px-4 py-2 text-red-600 text-sm text-center">
                      {error}
                    </div>
                  )}

                  {/* Pole wejścia */}
                  <div className="p-4 border-t flex gap-2">
                    <input
                      type="text"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Napisz odpowiedź..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      disabled={sending}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={sending || !draft.trim()}
                      className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {sending ? '...' : 'Wyślij'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
