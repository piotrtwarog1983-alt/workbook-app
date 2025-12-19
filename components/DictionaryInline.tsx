'use client'

import { useState, useEffect } from 'react'

interface GlossaryTerm {
  id: string
  term: string
  definition: string
}

export function DictionaryInline() {
  const [terms, setTerms] = useState<GlossaryTerm[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchTerms()
  }, [])

  const fetchTerms = async () => {
    try {
      const response = await fetch('/api/glossary')
      if (response.ok) {
        const data = await response.json()
        // API zwraca { terms: [...] }
        setTerms(data.terms || [])
      }
    } catch (error) {
      console.error('Failed to fetch glossary:', error)
      setTerms([])
    } finally {
      setLoading(false)
    }
  }

  const filteredTerms = terms.filter(term =>
    term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
    term.definition.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Szukaj pojęcia..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder-gray-500 text-sm"
        />
        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Terms list */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
        {filteredTerms.length === 0 ? (
          <p className="text-gray-500 text-center py-4 text-sm">
            {searchQuery ? 'Nie znaleziono pojęć' : 'Brak pojęć w słowniku'}
          </p>
        ) : (
          filteredTerms.map((term) => (
            <div
              key={term.id}
              className="p-3 bg-white/5 border border-white/10 rounded-lg"
            >
              <h4 className="font-semibold text-white text-sm mb-1">{term.term}</h4>
              <p className="text-gray-400 text-xs leading-relaxed">{term.definition}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}





