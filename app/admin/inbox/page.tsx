'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Pusher from 'pusher-js'

interface User {
  id: string
  email: string
  name?: string
}

interface Conversation {
  id: string
  userId: string
  user: User
  subject?: string
  lastMessage: string
  lastMessageAt: string
  unreadByAdmin: boolean
}

interface Message {
  id: string
  text: string
  sender: 'user' | 'admin'
  createdAt: string
}

const ADMIN_EMAIL = 'peter.twarog@cirrenz.com'

export default function AdminInboxPage() {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pusherRef = useRef<Pusher | null>(null)
  const chatChannelRef = useRef<ReturnType<Pusher['subscribe']> | null>(null)

  // Sprawdź autoryzację admina
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    fetch('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error || data.email !== ADMIN_EMAIL) {
          router.push('/course')
          return
        }
        setIsAuthorized(true)
      })
      .catch(() => {
        router.push('/login')
      })
  }, [router])

  useEffect(() => {
    if (!isAuthorized) return
    fetchConversations()
    setupAdminInboxPusher()

    return () => {
      pusherRef.current?.disconnect()
    }
  }, [isAuthorized])

  // Setup Pusher for admin-inbox channel (new conversations/updates)
  const setupAdminInboxPusher = () => {
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER

    if (!pusherKey || !pusherCluster) return

    pusherRef.current = new Pusher(pusherKey, {
      cluster: pusherCluster,
    })

    const channel = pusherRef.current.subscribe('admin-inbox')
    
    channel.bind('conversation:updated', (data: { conversationId: string; lastMessage: string; unreadByAdmin: boolean }) => {
      setConversations(prev => 
        prev.map(c => 
          c.id === data.conversationId 
            ? { ...c, lastMessage: data.lastMessage, unreadByAdmin: data.unreadByAdmin, lastMessageAt: new Date().toISOString() }
            : c
        )
      )
    })
  }

  // Subscribe to specific chat channel when conversation is selected
  useEffect(() => {
    if (!selectedConversation || !pusherRef.current) return

    // Unsubscribe from previous channel
    if (chatChannelRef.current) {
      chatChannelRef.current.unbind_all()
      chatChannelRef.current.unsubscribe()
    }

    chatChannelRef.current = pusherRef.current.subscribe(`chat-${selectedConversation.id}`)
    
    chatChannelRef.current.bind('message:new', (message: Message) => {
      // Tylko dodaj wiadomości od użytkownika (własne dodajemy optymistycznie)
      if (message.sender === 'user') {
        setMessages(prev => {
          if (prev.some(m => m.id === message.id)) return prev
          return [...prev, message]
        })
      }
    })

    return () => {
      chatChannelRef.current?.unbind_all()
      chatChannelRef.current?.unsubscribe()
    }
  }, [selectedConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/chat/conversations', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setConversations(data)
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation)
    setLoadingMessages(true)
    
    // Natychmiast usuń highlight z lokalnego stanu
    if (conversation.unreadByAdmin) {
      setConversations(prev => 
        prev.map(c => 
          c.id === conversation.id ? { ...c, unreadByAdmin: false } : c
        )
      )
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/chat/messages?conversationId=${conversation.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    } finally {
      setLoadingMessages(false)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation || sending) return

    const messageText = newMessage.trim()
    setNewMessage('')
    setSending(true)

    // Optymistycznie dodaj wiadomość
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      text: messageText,
      sender: 'admin',
      createdAt: new Date().toISOString()
    }
    setMessages(prev => [...prev, tempMessage])

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          text: messageText
        })
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(prev => 
          prev.map(msg => msg.id === tempMessage.id ? data : msg)
        )
        
        // Aktualizuj ostatnią wiadomość w liście konwersacji
        setConversations(prev =>
          prev.map(c =>
            c.id === selectedConversation.id
              ? { ...c, lastMessage: messageText, lastMessageAt: new Date().toISOString() }
              : c
          )
        )
      } else {
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id))
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id))
    } finally {
      setSending(false)
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return 'Wczoraj'
    } else if (diffDays < 7) {
      return date.toLocaleDateString('pl-PL', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })
    }
  }

  if (!isAuthorized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#1a1d24' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#1a1d24' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Inbox</h1>
          <Link href="/admin" className="btn-elegant px-4 py-2 text-sm">
            ← Panel Admin
          </Link>
        </div>

        <div className="flex gap-6 h-[calc(100vh-200px)]">
          {/* Conversations list */}
          <div className="w-80 flex-shrink-0 panel-elegant panel-glow rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                Konwersacje ({conversations.length})
              </h2>
            </div>
            <div className="overflow-y-auto h-[calc(100%-60px)]">
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  Brak konwersacji
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv)}
                    className={`w-full p-4 text-left border-b border-white/5 transition-colors ${
                      selectedConversation?.id === conv.id
                        ? 'bg-primary-600/20'
                        : conv.unreadByAdmin
                        ? 'bg-yellow-500/10 hover:bg-white/5'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-medium ${conv.unreadByAdmin ? 'text-white' : 'text-gray-300'}`}>
                        {conv.user.name || conv.user.email}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(conv.lastMessageAt)}
                      </span>
                    </div>
                    <p className={`text-sm truncate ${conv.unreadByAdmin ? 'text-gray-300' : 'text-gray-500'}`}>
                      {conv.lastMessage || 'Brak wiadomości'}
                    </p>
                    {conv.unreadByAdmin && (
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 panel-elegant panel-glow rounded-2xl overflow-hidden flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat header */}
                <div className="p-4 border-b border-white/10">
                  <h3 className="font-medium text-white">
                    {selectedConversation.user.name || selectedConversation.user.email}
                  </h3>
                  <p className="text-sm text-gray-500">{selectedConversation.user.email}</p>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      Brak wiadomości w tej konwersacji
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] px-4 py-2 rounded-lg ${
                            message.sender === 'admin'
                              ? 'bg-primary-600 text-white'
                              : 'bg-white/10 text-gray-200'
                          }`}
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
                <form onSubmit={sendMessage} className="p-4 border-t border-white/10">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Napisz odpowiedź..."
                      className="flex-1 px-4 py-3 bg-white/5 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder-gray-500"
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sending}
                      className="px-6 py-3 btn-primary-elegant rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Wyślij
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p>Wybierz konwersację z listy</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

