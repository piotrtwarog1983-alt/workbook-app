'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface RegistrationToken {
  id: string
  token: string
  email: string
  used: boolean
  expiresAt: string
  createdAt: string
}

const ADMIN_EMAIL = 'peter.twarog@cirrenz.com'

export default function AdminPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tokens, setTokens] = useState<RegistrationToken[]>([])
  const [formData, setFormData] = useState({
    email: '',
    expiresInDays: 7,
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [creating, setCreating] = useState(false)
  const [loadingTokens, setLoadingTokens] = useState(false)

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
      })
      .catch(() => {
        router.push('/login')
      })
  }, [router])

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

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#1a1d24' }}>
        <div className="text-gray-400">Ładowanie...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: '#1a1d24' }}>
      <div className="max-w-6xl mx-auto">
        <div className="panel-elegant panel-glow rounded-2xl p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8 pb-6 border-b border-white/10">
            <div>
              <h1 className="text-2xl font-bold text-white">Panel Administratora</h1>
              <p className="text-sm text-gray-400 mt-1">
                Zalogowany jako: <span className="text-white">{user?.email}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/admin/inbox"
                className="btn-elegant px-4 py-2 text-white flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Inbox
              </Link>
              <Link
                href="/course"
                className="btn-elegant px-4 py-2 text-white"
              >
                Wróć do kursu
              </Link>
              <button
                onClick={handleLogout}
                className="btn-elegant px-4 py-2 text-red-400 hover:text-red-300"
              >
                Wyloguj
              </button>
            </div>
          </div>

          {/* Formularz tworzenia tokenu */}
          <div className="mb-8 p-6 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h2 className="text-lg font-semibold mb-4 text-white">
              Utwórz nowy token rejestracyjny
            </h2>

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-500/20 border border-green-500/30 text-green-300 px-4 py-3 rounded-lg mb-4 break-all">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Email klienta
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder-gray-500"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="expiresInDays"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Ważność tokenu (dni)
                </label>
                <input
                  type="number"
                  id="expiresInDays"
                  required
                  min="1"
                  max="365"
                  value={formData.expiresInDays}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      expiresInDays: parseInt(e.target.value) || 7,
                    })
                  }
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Po tym czasie token wygaśnie i nie będzie można go użyć do rejestracji.
                </p>
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full btn-primary-elegant py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Tworzenie...' : 'Utwórz token rejestracyjny'}
              </button>
            </form>
          </div>

          {/* Lista tokenów */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white">
                Istniejące tokeny rejestracyjne
              </h2>
              <button
                onClick={loadTokens}
                className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
              >
                Odśwież
              </button>
            </div>

            {loadingTokens ? (
              <div className="text-center py-8 text-gray-500">
                Ładowanie tokenów...
              </div>
            ) : tokens.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Brak tokenów rejestracyjnych. Utwórz pierwszy token powyżej.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Utworzony
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Ważny do
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Akcje
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {tokens.map((token) => {
                      const appUrl = typeof window !== 'undefined' 
                        ? window.location.origin 
                        : ''
                      const registrationUrl = `${appUrl}/signup?token=${token.token}`
                      const isExpired = new Date(token.expiresAt) < new Date()

                      return (
                        <tr key={token.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                            {token.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {token.used ? (
                              <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-500/20 text-gray-400">
                                Użyty
                              </span>
                            ) : isExpired ? (
                              <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-500/20 text-red-400">
                                Wygasł
                              </span>
                            ) : (
                              <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-400">
                                Aktywny
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            {new Date(token.createdAt).toLocaleDateString('pl-PL')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            {new Date(token.expiresAt).toLocaleDateString('pl-PL')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {!token.used && !isExpired && (
                              <button
                                onClick={() => copyToClipboard(registrationUrl)}
                                className="text-primary-400 hover:text-primary-300 transition-colors"
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
      </div>
    </div>
  )
}
