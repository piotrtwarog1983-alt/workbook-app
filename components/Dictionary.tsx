'use client'

import { useState, useEffect } from 'react'

interface GlossaryTerm {
  id: string
  term: string
  definition: string
}

interface DictionaryProps {
  onClose: () => void
}

export function Dictionary({ onClose }: DictionaryProps) {
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">Słownik pojęć</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
            aria-label="Zamknij"
          >
            ×
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b">
          <input
            type="text"
            placeholder="Szukaj pojęcia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Terms list */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8">Ładowanie...</div>
          ) : filteredTerms.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'Nie znaleziono pojęć' : 'Brak pojęć w słowniku'}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTerms.map((term) => (
                <div key={term.id} className="border-b pb-4 last:border-0">
                  <h3 className="font-semibold text-lg mb-2">{term.term}</h3>
                  <p className="text-gray-700">{term.definition}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

