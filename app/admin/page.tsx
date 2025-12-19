'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Pusher from 'pusher-js'

interface RegistrationToken {
  id: string
  token: string
  email: string
  used: boolean
  expiresAt: string
  createdAt: string
}

interface UserAccount {
  id: string
  email: string
  name: string | null
  createdAt: string
  _count: {
    conversations: number
    progressEvaluations: number
  }
}

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

type TabType = 'tokens' | 'users' | 'chat'

export default function AdminPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('tokens')
  
  // Token state
  const [tokens, setTokens] = useState<RegistrationToken[]>([])
  const [formData, setFormData] = useState({
    email: '',
    expiresInDays: 7,
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [creating, setCreating] = useState(false)
  const [loadingTokens, setLoadingTokens] = useState(false)
  
  // Users state
  const [users, setUsers] = useState<UserAccount[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  
  // Chat state
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loadingConversations, setLoadingConversations] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pusherRef = useRef<Pusher | null>(null)
  const chatChannelRef = useRef<ReturnType<Pusher['subscribe']> | null>(null)

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
        setUser(data)
        setLoading(false)
        loadTokens()
        loadUsers()
        loadConversations()
        setupPusher()
      })
      .catch(() => {
        router.push('/login')
      })

    return () => {
      pusherRef.current?.disconnect()
    }
  }, [router])

  const setupPusher = () => {
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

    if (chatChannelRef.current) {
      chatChannelRef.current.unbind_all()
      chatChannelRef.current.unsubscribe()
    }

    chatChannelRef.current = pusherRef.current.subscribe(`chat-${selectedConversation.id}`)
    
    chatChannelRef.current.bind('message:new', (message: Message) => {
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadTokens = async () => {
    setLoadingTokens(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/tokens', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (response.ok) {
        setTokens(data.tokens || [])
      }
    } catch (error) {
      console.error('Error loading tokens:', error)
    } finally {
      setLoadingTokens(false)
    }
  }

  const loadUsers = async () => {
    setLoadingUsers(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (response.ok) {
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const loadConversations = async () => {
    setLoadingConversations(true)
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
      setLoadingConversations(false)
    }
  }

  const deleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Czy na pewno chcesz usunąć konto użytkownika ${userEmail}? Ta operacja jest nieodwracalna.`)) {
      return
    }

    setDeletingUserId(userId)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Błąd usuwania użytkownika')
        return
      }

      setSuccess(`Konto ${userEmail} zostało usunięte`)
      loadUsers()
    } catch (error) {
      setError('Wystąpił błąd podczas usuwania użytkownika')
      console.error('Error deleting user:', error)
    } finally {
      setDeletingUserId(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setCreating(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/create-registration-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Błąd tworzenia tokenu')
        setCreating(false)
        return
      }

      setSuccess(`Token utworzony! Link: ${data.registrationUrl}`)
      setFormData({ email: '', expiresInDays: 7 })
      loadTokens()
    } catch (err) {
      setError('Wystąpił błąd. Spróbuj ponownie.')
    } finally {
      setCreating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setSuccess('Link skopiowany do schowka!')
    setTimeout(() => setSuccess(''), 3000)
  }

  const selectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation)
    setLoadingMessages(true)
    
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

  const unreadCount = conversations.filter(c => c.unreadByAdmin).length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#1a1d24' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#1a1d24' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Panel Administratora</h1>
            <p className="text-gray-500 text-sm">Zalogowany jako: {user?.email}</p>
          </div>
          <Link
            href="/course"
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white transition-all"
          >
            ← Wróć do kursu
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('tokens')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'tokens'
                ? 'bg-cyan-600 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Tokeny
            </span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'users'
                ? 'bg-cyan-600 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Użytkownicy
            </span>
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-6 py-3 rounded-lg font-medium transition-all relative ${
              activeTab === 'chat'
                ? 'bg-cyan-600 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Wiadomości
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 text-black text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </span>
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 break-all">
            {success}
          </div>
        )}

        {/* Tokens Tab */}
        {activeTab === 'tokens' && (
          <div className="space-y-6">
            {/* Create Token Form */}
            <div className="panel-elegant panel-glow rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Utwórz nowy token rejestracyjny
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">
                    Email klienta
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent placeholder-gray-500"
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="expiresInDays" className="block text-sm font-medium text-gray-400 mb-2">
                    Ważność tokenu (dni)
                  </label>
                  <input
                    type="number"
                    id="expiresInDays"
                    required
                    min="1"
                    max="365"
                    value={formData.expiresInDays}
                    onChange={(e) => setFormData({ ...formData, expiresInDays: parseInt(e.target.value) || 7 })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Po tym czasie token wygaśnie i nie będzie można go użyć do rejestracji.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={creating}
                  className="w-full py-3 rounded-lg font-semibold bg-cyan-600 text-white hover:bg-cyan-500 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                  {creating ? 'Tworzenie...' : 'Utwórz token rejestracyjny'}
                </button>
              </form>
            </div>

            {/* Tokens List */}
            <div className="panel-elegant panel-glow rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">
                  Istniejące tokeny
                </h2>
                <button
                  onClick={loadTokens}
                  className="text-sm text-cyan-400 hover:text-cyan-300"
                >
                  Odśwież
                </button>
              </div>

              {loadingTokens ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto"></div>
                </div>
              ) : tokens.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Brak tokenów rejestracyjnych
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utworzony</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ważny do</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Akcje</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {tokens.map((token) => {
                        const appUrl = typeof window !== 'undefined' ? window.location.origin : ''
                        const registrationUrl = `${appUrl}/signup?token=${token.token}`
                        const isExpired = new Date(token.expiresAt) < new Date()

                        return (
                          <tr key={token.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-4 py-4 text-sm text-gray-300">{token.email}</td>
                            <td className="px-4 py-4">
                              {token.used ? (
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-500/20 text-gray-400">
                                  Użyty
                                </span>
                              ) : isExpired ? (
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-500/20 text-red-400">
                                  Wygasł
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-400">
                                  Aktywny
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500">
                              {new Date(token.createdAt).toLocaleDateString('pl-PL')}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500">
                              {new Date(token.expiresAt).toLocaleDateString('pl-PL')}
                            </td>
                            <td className="px-4 py-4 text-sm">
                              {!token.used && !isExpired && (
                                <button
                                  onClick={() => copyToClipboard(registrationUrl)}
                                  className="text-cyan-400 hover:text-cyan-300"
                                >
                                  Kopiuj link
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="panel-elegant panel-glow rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">
                Konta użytkowników ({users.length})
              </h2>
              <button
                onClick={loadUsers}
                className="text-sm text-cyan-400 hover:text-cyan-300"
              >
                Odśwież
              </button>
            </div>

            {loadingUsers ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto"></div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Brak zarejestrowanych użytkowników
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nazwa</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rejestracja</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Postępy</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wiadomości</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Akcje</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.map((userAccount) => {
                      const isAdmin = userAccount.email === ADMIN_EMAIL

                      return (
                        <tr key={userAccount.id} className={`hover:bg-white/5 transition-colors ${isAdmin ? 'bg-cyan-500/5' : ''}`}>
                          <td className="px-4 py-4 text-sm text-gray-300">
                            {userAccount.email}
                            {isAdmin && (
                              <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-cyan-500/20 text-cyan-400">
                                Admin
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-500">
                            {userAccount.name || '-'}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-500">
                            {new Date(userAccount.createdAt).toLocaleDateString('pl-PL')}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-500">
                            {userAccount._count.progressEvaluations} ocen
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-500">
                            {userAccount._count.conversations} konwersacji
                          </td>
                          <td className="px-4 py-4 text-sm">
                            {!isAdmin && (
                              <button
                                onClick={() => deleteUser(userAccount.id, userAccount.email)}
                                disabled={deletingUserId === userAccount.id}
                                className="text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {deletingUserId === userAccount.id ? 'Usuwanie...' : 'Usuń'}
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="flex gap-6 h-[calc(100vh-280px)]">
            {/* Conversations list */}
            <div className="w-80 flex-shrink-0 panel-elegant panel-glow rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                  Konwersacje ({conversations.length})
                </h2>
              </div>
              <div className="overflow-y-auto h-[calc(100%-60px)]">
                {loadingConversations ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
                  </div>
                ) : conversations.length === 0 ? (
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
                          ? 'bg-cyan-600/20'
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
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
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
                                ? 'bg-cyan-600 text-white'
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
                        className="flex-1 px-4 py-3 bg-white/5 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent placeholder-gray-500"
                        disabled={sending}
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className="px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
        )}
      </div>
    </div>
  )
}
