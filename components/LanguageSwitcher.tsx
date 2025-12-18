'use client'

import { useLanguage } from '@/lib/LanguageContext'
import { Language } from '@/lib/translations'

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  const languages: { code: Language; label: string }[] = [
    { code: 'PL', label: 'Polski' },
    { code: 'DE', label: 'Deutsch' },
  ]

  return (
    <div className="flex items-center gap-1">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLanguage(lang.code)}
          className={`px-3 py-1.5 text-sm font-medium rounded transition-all ${
            language === lang.code
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
              : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
          }`}
          title={lang.label}
        >
          {lang.code}
        </button>
      ))}
    </div>
  )
}

