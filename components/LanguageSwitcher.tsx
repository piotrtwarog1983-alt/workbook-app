'use client'

import { useLanguage } from '@/lib/LanguageContext'
import { Language } from '@/lib/translations'

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'PL', label: 'Polski', flag: '🇵🇱' },
    { code: 'DE', label: 'Deutsch', flag: '🇩🇪' },
  ]

  return (
    <div className="flex items-center gap-1">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLanguage(lang.code)}
          className={`px-2 py-1 text-sm rounded transition-all ${
            language === lang.code
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
              : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
          }`}
          title={lang.label}
        >
          <span className="mr-1">{lang.flag}</span>
          <span className="hidden sm:inline">{lang.code}</span>
        </button>
      ))}
    </div>
  )
}

