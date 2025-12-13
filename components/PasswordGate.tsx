'use client'

import { useState, useEffect } from 'react'

// Funkcja do hashowania hasła (SHA-256)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

interface PasswordGateProps {
  children: React.ReactNode
}

export function PasswordGate({ children }: PasswordGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Sprawdź, czy użytkownik jest już zalogowany
    const authStatus = sessionStorage.getItem('app_authenticated')
    if (authStatus === 'true') {
      setIsAuthenticated(true)
    }
    setLoading(false)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!password.trim()) {
      setError('Wprowadź hasło')
      return
    }

    try {
      // Hashuj wprowadzone hasło
      const hashedPassword = await hashPassword(password)
      
      // Porównaj z poprawnym hashem
      // Dla bezpieczeństwa użyjemy prostego porównania
      // W produkcji lepiej użyć API endpoint
      const correctHash = await hashPassword('Kkntyw2025')
      
      if (hashedPassword === correctHash) {
        // Zalogowano pomyślnie
        sessionStorage.setItem('app_authenticated', 'true')
        setIsAuthenticated(true)
        setPassword('')
      } else {
        setError('Nieprawidłowe hasło')
        setPassword('')
      }
    } catch (err) {
      setError('Wystąpił błąd. Spróbuj ponownie.')
      console.error('Password hash error:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Ładowanie...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Dostęp do aplikacji
            </h1>
            <p className="text-gray-600">
              Wprowadź hasło, aby kontynuować
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Hasło
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Wprowadź hasło"
                autoFocus
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Zaloguj się
            </button>
          </form>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

