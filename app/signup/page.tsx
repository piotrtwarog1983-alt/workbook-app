'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/lib/LanguageContext'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

// Wykryj język przeglądarki bezpośrednio
function detectBrowserLanguage(): 'PL' | 'DE' {
  if (typeof window === 'undefined') return 'PL'
  
  const browserLang = navigator.language || (navigator as any).userLanguage || ''
  const langCode = browserLang.toLowerCase().split('-')[0]
  
  // Mapowanie kodów języków
  if (langCode === 'de') return 'DE'
  if (langCode === 'pl') return 'PL'
  
  // Dla innych języków (np. angielski) - domyślnie niemiecki jako bardziej międzynarodowy
  return 'DE'
}

function SignupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const { t, language, setLanguage } = useLanguage()
  
  // Dla strony rejestracji - zawsze wykryj język przeglądarki (nowy użytkownik)
  useEffect(() => {
    const browserLang = detectBrowserLanguage()
    if (language !== browserLang) {
      setLanguage(browserLang)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Uruchom tylko raz przy montowaniu

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  useEffect(() => {
    if (!token) {
      setError(t.signup.tokenRequired)
    }
  }, [token, t.signup.tokenRequired])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!acceptedTerms) {
      setError(t.signup.termsRequired)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t.signup.passwordMismatch)
      return
    }

    if (formData.password.length < 8) {
      setError(t.signup.passwordTooShort)
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          email: formData.email,
          password: formData.password,
          name: formData.name,
          consents: {
            terms: true,
            privacy: true,
            termsVersion: new Date().toISOString().split('T')[0]
          }
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Mapuj błędy API na przetłumaczone komunikaty
        if (data.error?.includes('token') || data.error?.includes('Token')) {
          setError(t.signup.invalidToken)
        } else if (data.error?.includes('email') || data.error?.includes('Email')) {
          setError(t.signup.emailExists)
        } else {
          setError(data.error || t.signup.registrationError)
        }
        setLoading(false)
        return
      }

      // Save token and redirect
      localStorage.setItem('token', data.token)
      router.push('/course')
    } catch (err) {
      setError(t.errors.generic)
      setLoading(false)
    }
  }

  const EyeIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )

  const EyeOffIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  )

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#1a1d24' }}>
      {/* Language switcher w górnym prawym rogu */}
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <div className="max-w-md w-full panel-elegant panel-glow p-8 rounded-2xl">
        <h1 className="text-2xl font-bold mb-2 text-center text-white">{t.signup.title}</h1>
        <p className="text-gray-400 text-center mb-8">{t.signup.subtitle}</p>

        {error && (
          <div className="bg-red-900/30 border border-red-700/50 text-red-300 px-4 py-3 rounded-lg mb-6 backdrop-blur-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">
              {t.signup.email}
            </label>
            <input
              type="email"
              id="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder-gray-500 transition-all"
              placeholder={t.signup.emailPlaceholder}
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-2">
              {t.signup.name}
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder-gray-500 transition-all"
              placeholder={t.signup.namePlaceholder}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-2">
              {t.signup.password}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder-gray-500 transition-all"
                placeholder={t.signup.passwordPlaceholder}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-400 mb-2">
              {t.signup.confirmPassword}
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder-gray-500 transition-all"
                placeholder={t.signup.confirmPasswordPlaceholder}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {/* Checkbox zgód */}
          <div className="flex items-start gap-3 pt-2">
            <input
              type="checkbox"
              id="terms"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1 w-4 h-4 accent-primary-500 bg-white/5 border-white/20 rounded"
            />
            <label htmlFor="terms" className="text-sm text-gray-400 leading-relaxed">
              {t.signup.termsAccept}{' '}
              <a 
                href="https://eulaliafotografia.com/regulamin" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-300 underline"
              >
                {t.signup.termsOfService}
              </a>
              {' '}{t.signup.and}{' '}
              <a 
                href="https://eulaliafotografia.com/polityka-prywatnosci" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-300 underline"
              >
                {t.signup.privacyPolicy}
              </a>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !token || !acceptedTerms}
            className="w-full btn-primary-elegant py-3 font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t.signup.registering : t.signup.registerButton}
          </button>
        </form>

        <div className="mt-6 text-center">
          <span className="text-gray-400 text-sm">{t.signup.haveAccount} </span>
          <Link href="/login" className="text-cyan-400 hover:text-cyan-300 transition-colors text-sm">
            {t.signup.loginHere}
          </Link>
        </div>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#1a1d24' }}>
      <div className="max-w-md w-full panel-elegant panel-glow p-8 text-center rounded-2xl">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
        <p className="text-gray-400">...</p>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SignupContent />
    </Suspense>
  )
}
