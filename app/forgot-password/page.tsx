'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Wystąpił błąd')
        setLoading(false)
        return
      }

      setSuccess(true)
    } catch (err) {
      setError('Wystąpił błąd. Spróbuj ponownie.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#1a1d24' }}>
        <div className="max-w-md w-full panel-elegant panel-glow p-8 text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-4 text-white">Sprawdź email</h1>
          <p className="text-gray-400 mb-6">
            Jeśli podany adres email istnieje w naszej bazie, otrzymasz wiadomość z linkiem do resetowania hasła.
          </p>
          <p className="text-gray-500 text-sm mb-6">
            Link będzie ważny przez 1 godzinę.
          </p>
          <Link
            href="/login"
            className="text-primary-400 hover:text-primary-300 transition-colors"
          >
            Wróć do logowania
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#1a1d24' }}>
      <div className="max-w-md w-full panel-elegant panel-glow p-8">
        <h1 className="text-2xl font-bold mb-2 text-center text-white">Zapomniałeś hasła?</h1>
        <p className="text-gray-400 text-center mb-8">
          Podaj swój email, a wyślemy Ci link do zresetowania hasła.
        </p>

        {error && (
          <div className="bg-red-900/30 border border-red-700/50 text-red-300 px-4 py-3 rounded-lg mb-6 backdrop-blur-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">
              Adres email
            </label>
            <input
              type="email"
              id="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder-gray-500 transition-all"
              placeholder="twoj@email.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary-elegant py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Wysyłanie...' : 'Wyślij link resetowania'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-gray-400 hover:text-gray-300 transition-colors text-sm">
            Wróć do logowania
          </Link>
        </div>
      </div>
    </div>
  )
}


