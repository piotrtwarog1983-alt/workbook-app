'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslation, useLanguage } from '@/lib/LanguageContext'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'

export default function ForgotPasswordPage() {
  const { t, language } = useTranslation()
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
        body: JSON.stringify({ email, language })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
      } else {
        setError(data.error || t.errors.generic)
      }
    } catch {
      setError(t.errors.network)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(180deg, #FAF8F5 0%, #F5F0E8 100%)' }}>
        {/* Language switcher */}
        <div className="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>

        <div className="max-w-md w-full panel-elegant panel-glow p-8 rounded-2xl">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#2D2A26] mb-4">{t.common.success}</h1>
            <p className="text-[#6B6560] mb-6">
              {t.forgotPassword.successMessage}
            </p>
            <Link
              href="/login"
              className="inline-block btn-primary-elegant px-6 py-3 font-semibold rounded-lg"
            >
              {t.forgotPassword.backToLogin}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(180deg, #FAF8F5 0%, #F5F0E8 100%)' }}>
      {/* Language switcher */}
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <div className="max-w-md w-full panel-elegant panel-glow p-8 rounded-2xl">
        <h1 className="text-2xl font-bold mb-2 text-center text-[#2D2A26]">{t.forgotPassword.title}</h1>
        <p className="text-[#6B6560] text-center mb-8">
          {t.forgotPassword.subtitle}
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#6B6560] mb-2">
              {t.forgotPassword.email}
            </label>
            <input
              type="email"
              id="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-[#C9A962]/25 text-[#2D2A26] rounded-lg focus:ring-2 focus:ring-[#C9A962]/30 focus:border-[#C9A962] placeholder-[#8B7355]/50 transition-all"
              placeholder={t.forgotPassword.emailPlaceholder}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary-elegant py-3 font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t.forgotPassword.sending : t.forgotPassword.sendButton}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-[#8B7355] hover:text-[#C9A962] transition-colors text-sm">
            ← {t.forgotPassword.backToLogin}
          </Link>
        </div>
      </div>
    </div>
  )
}










































