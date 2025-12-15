'use client'

import { useState, useEffect } from 'react'

interface GlossaryTerm {
  id: string
  term: string
  definition: string
}

export function DictionaryInline() {
  const [terms, setTerms] = useState<GlossaryTerm[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch glossary terms
    fetch('/api/glossary')
      .then((res) => res.json())
      .then((data) => {
        if (data.terms) {
          setTerms(data.terms)
        }
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [])

  const filteredTerms = terms.filter(
    (term) =>
      term.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      term.definition.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Szukaj pojęcia..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder-gray-500"
        />
      </div>

      {/* Terms list */}
      <div className="flex-1 overflow-y-auto max-h-[400px] pr-2">
        {loading ? (
          <div className="text-center py-8 text-gray-400">Ładowanie...</div>
        ) : filteredTerms.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'Nie znaleziono pojęć' : 'Brak pojęć w słowniku'}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTerms.map((term) => (
              <div key={term.id} className="border-b border-white/10 pb-4 last:border-0">
                <h3 className="font-semibold text-base mb-2 text-white">{term.term}</h3>
                <p className="text-gray-400 text-sm">{term.definition}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
