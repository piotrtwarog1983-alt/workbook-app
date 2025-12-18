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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
      } else {
        setError(data.error || 'Wystąpił błąd')
      }
    } catch {
      setError('Błąd połączenia z serwerem')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#1a1d24' }}>
        <div className="max-w-md w-full panel-elegant panel-glow p-8 rounded-2xl">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">Sprawdź swoją skrzynkę</h1>
            <p className="text-gray-400 mb-6">
              Jeśli podany adres email jest zarejestrowany, wysłaliśmy link do resetowania hasła.
            </p>
            <Link
              href="/login"
              className="inline-block btn-primary-elegant px-6 py-3 font-semibold rounded-lg"
            >
              Wróć do logowania
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#1a1d24' }}>
      <div className="max-w-md w-full panel-elegant panel-glow p-8 rounded-2xl">
        <h1 className="text-2xl font-bold mb-2 text-center text-white">Zapomniałeś hasła?</h1>
        <p className="text-gray-400 text-center mb-8">
          Podaj swój adres email, a wyślemy Ci link do resetowania hasła.
        </p>

        {error && (
          <div className="bg-red-900/30 border border-red-700/50 text-red-300 px-4 py-3 rounded-lg mb-6 backdrop-blur-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">
              Email
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
            className="w-full btn-primary-elegant py-3 font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Wysyłanie...' : 'Wyślij link resetujący'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-gray-400 hover:text-gray-300 transition-colors text-sm">
            ← Wróć do logowania
          </Link>
        </div>
      </div>
    </div>
  )
}
