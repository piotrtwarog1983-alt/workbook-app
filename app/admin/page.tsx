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

    // Pobierz dane użytkownika
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
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Panel Administratora</h1>
            <Link
              href="/course"
              className="text-primary-600 hover:underline"
            >
              Wróć do kursu
            </Link>
          </div>

          <div className="mb-4 text-sm text-gray-600">
            Zalogowany jako: <strong>{user?.email}</strong>
          </div>

          {/* Formularz tworzenia tokenu */}
          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">
              Utwórz nowy token rejestracyjny
            </h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4 break-all">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="expiresInDays"
                  className="block text-sm font-medium text-gray-700 mb-1"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Po tym czasie token wygaśnie i nie będzie można go użyć do rejestracji.
                </p>
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {creating ? 'Tworzenie...' : 'Utwórz token rejestracyjny'}
              </button>
            </form>
          </div>

          {/* Lista tokenów */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Istniejące tokeny rejestracyjne
              </h2>
              <button
                onClick={loadTokens}
                className="text-sm text-primary-600 hover:underline"
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
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Utworzony
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ważny do
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Akcje
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tokens.map((token) => {
                      const appUrl = typeof window !== 'undefined' 
                        ? window.location.origin 
                        : ''
                      const registrationUrl = `${appUrl}/signup?token=${token.token}`
                      const isExpired = new Date(token.expiresAt) < new Date()

                      return (
                        <tr key={token.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {token.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {token.used ? (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-200 text-gray-800">
                                Użyty
                              </span>
                            ) : isExpired ? (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-200 text-red-800">
                                Wygasł
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-200 text-green-800">
                                Aktywny
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(token.createdAt).toLocaleDateString('pl-PL')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(token.expiresAt).toLocaleDateString('pl-PL')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {!token.used && !isExpired && (
                              <button
                                onClick={() => copyToClipboard(registrationUrl)}
                                className="text-primary-600 hover:underline"
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

