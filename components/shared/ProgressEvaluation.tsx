'use client'

import { useState, useEffect } from 'react'

interface ProgressEvaluationProps {
  pageNumber: number
  language?: 'PL' | 'DE' | 'EN'
}

const translations = {
  PL: {
    title: 'Czy widzisz postęp w odniesieniu do Twojego poprzedniego zdjęcia?',
    worse: 'Jest gorzej',
    same: 'Tak samo',
    better: 'Jest lepiej',
    loading: 'Ładowanie...',
    saving: 'Zapisuję...',
    saved: '✓ Zapisano',
    currentPosition: 'Aktualna pozycja na skali:',
    referencePoint: '(punkt odniesienia)',
  },
  DE: {
    title: 'Siehst du einen Fortschritt im Vergleich zu deinem vorherigen Foto?',
    worse: 'Es ist schlechter',
    same: 'Gleich',
    better: 'Es ist besser',
    loading: 'Laden...',
    saving: 'Speichern...',
    saved: '✓ Gespeichert',
    currentPosition: 'Aktuelle Position auf der Skala:',
    referencePoint: '(Referenzpunkt)',
  },
  EN: {
    title: 'Do you see progress compared to your previous photo?',
    worse: "It's worse",
    same: 'The same',
    better: "It's better",
    loading: 'Loading...',
    saving: 'Saving...',
    saved: '✓ Saved',
    currentPosition: 'Current position on the scale:',
    referencePoint: '(reference point)',
  },
}

const evaluationPages = [16, 21, 30, 36, 41, 50]
const STORAGE_KEY = 'progressEvaluations'

type StoredEvaluation = {
  pageNumber: number
  evaluation: number
}

function loadLocalEvaluations(): StoredEvaluation[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function saveLocalEvaluation(newEntry: StoredEvaluation) {
  if (typeof window === 'undefined') return
  const stored = loadLocalEvaluations().filter(
    (item) => item.pageNumber !== newEntry.pageNumber
  )
  stored.push(newEntry)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
}

function calculateCumulative(
  evaluations: Array<{ pageNumber: number; evaluation: number }>,
  currentPageNumber: number
) {
  const currentPageIndex = evaluationPages.indexOf(currentPageNumber)
  let cumulative = 0

  for (let i = 0; i < currentPageIndex; i++) {
    const prevPage = evaluationPages[i]
    const prevEvaluation = evaluations.find(
      (e) => e.pageNumber === prevPage
    )
    if (prevEvaluation) {
      cumulative += prevEvaluation.evaluation
    }
  }

  return cumulative
}

export function ProgressEvaluation({ pageNumber, language = 'PL' }: ProgressEvaluationProps) {
  const [value, setValue] = useState(0) // -1 = gorzej, 0 = tak samo, 1 = lepiej
  const [cumulativeScore, setCumulativeScore] = useState(0) // Skumulowany wynik
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  
  const t = translations[language]

  // Pobierz poprzednie oceny i oblicz skumulowany wynik
  useEffect(() => {
    const token = localStorage.getItem('token')

    const applyEvaluations = (
      evaluations: Array<{ pageNumber: number; evaluation: number }>
    ) => {
      const cumulative = calculateCumulative(evaluations, pageNumber)
      setCumulativeScore(cumulative)

      const currentEvaluation = evaluations.find(
        (e) => e.pageNumber === pageNumber
      )
      if (currentEvaluation) {
        setValue(currentEvaluation.evaluation)
        setSaved(true)
      } else {
        setValue(0)
        setSaved(false)
      }
    }

    const fetchEvaluations = async () => {
      try {
        if (!token) {
          const localEvaluations = loadLocalEvaluations()
          applyEvaluations(localEvaluations)
          setLoading(false)
          return
        }

        const response = await fetch('/api/progress-evaluations', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          const localEvaluations = loadLocalEvaluations()
          applyEvaluations(localEvaluations)
          setLoading(false)
          return
        }

        const data = await response.json()
        applyEvaluations(data.evaluations || [])
        setLoading(false)
      } catch (error) {
        console.error('Error fetching evaluations:', error)
        const localEvaluations = loadLocalEvaluations()
        applyEvaluations(localEvaluations)
        setLoading(false)
      }
    }

    fetchEvaluations()
  }, [pageNumber])

  const handleChange = async (newValue: number) => {
    setValue(newValue)
    setSaved(false)

    // Oblicz nowy skumulowany wynik TYLKO z poprzednich stron
    let previousEvaluations: Array<{ pageNumber: number; evaluation: number }> =
      []

    try {
      const token = localStorage.getItem('token')

      if (token) {
        const response = await fetch('/api/progress-evaluations', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          previousEvaluations = data.evaluations || []
        } else {
          previousEvaluations = loadLocalEvaluations()
        }
      } else {
        previousEvaluations = loadLocalEvaluations()
      }
    } catch (error) {
      console.error('Error calculating cumulative:', error)
      previousEvaluations = loadLocalEvaluations()
    }

    // Oblicz cumulative TYLKO z poprzednich stron (bez aktualnej)
    const cumulativeFromPrevious = calculateCumulative(previousEvaluations, pageNumber)
    setCumulativeScore(cumulativeFromPrevious)

    // Zapisz ocenę
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      if (token) {
        const response = await fetch('/api/progress-evaluations', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pageNumber,
            evaluation: newValue,
            cumulativeScore: cumulativeFromPrevious + newValue, // Zapisz łączny wynik z aktualną oceną
          }),
        })

        if (response.ok) {
          setSaved(true)
        }
      }

      // Zawsze zapisuj lokalnie, aby zachować stan również bez tokenu
      saveLocalEvaluation({ pageNumber, evaluation: newValue })
    } catch (error) {
      console.error('Error saving evaluation:', error)
    } finally {
      setSaving(false)
    }
  }

  // Pozycja suwaka na skali (0 = środek, -6 do +6)
  const sliderPosition = cumulativeScore + value

  if (loading) {
    return (
      <div className="relative w-full h-full flex items-center justify-center p-8" style={{ background: '#1a1a1a' }}>
        <div className="text-gray-400">{t.loading}</div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center p-8 overflow-y-auto" style={{ background: '#1a1a1a' }}>
      <div className="w-full max-w-3xl space-y-8">
        <h2 className="text-2xl md:text-3xl font-serif text-white text-center">
          {t.title}
        </h2>

        {/* Skala z suwakiem */}
        <div className="space-y-6">
          {/* Etykiety */}
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>{t.worse}</span>
            <span>{t.same}</span>
            <span>{t.better}</span>
          </div>

          {/* Kontener skali */}
          <div className="relative">
            {/* Linia skali */}
            <div className="h-2 bg-gray-700 rounded-full relative">
              {/* Segmenty skali (13 pozycji: -6 do +6) */}
              {Array.from({ length: 13 }, (_, i) => {
                const position = i - 6 // -6 do +6
                const isCenter = position === 0
                return (
                  <div
                    key={i}
                    className={`absolute top-0 h-2 ${
                      isCenter ? 'w-1 bg-white' : 'w-0.5 bg-gray-500'
                    }`}
                    style={{ left: `${(i / 12) * 100}%` }}
                  />
                )
              })}

              {/* Suwak */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-primary-600 rounded-full shadow-lg cursor-pointer transition-all z-10"
                style={{
                  left: `${((sliderPosition + 6) / 12) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            </div>

            {/* Przyciski wyboru */}
            <div className="flex justify-center gap-6 mt-8">
              <button
                onClick={() => handleChange(-1)}
                disabled={saving}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  value === -1
                    ? 'bg-red-500 text-white shadow-lg'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {t.worse}
              </button>
              <button
                onClick={() => handleChange(0)}
                disabled={saving}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  value === 0
                    ? 'bg-gray-500 text-white shadow-lg'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {t.same}
              </button>
              <button
                onClick={() => handleChange(1)}
                disabled={saving}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  value === 1
                    ? 'bg-green-500 text-white shadow-lg'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {t.better}
              </button>
            </div>

            {/* Status zapisu */}
            {saving && (
              <div className="text-center mt-4 text-sm text-gray-400">
                {t.saving}
              </div>
            )}
            {saved && !saving && (
              <div className="text-center mt-4 text-sm text-green-400">
                {t.saved}
              </div>
            )}

            {/* Informacja o aktualnej pozycji */}
            <div className="text-center mt-6 text-sm text-gray-400">
              {t.currentPosition} {sliderPosition > 0 ? '+' : ''}{sliderPosition}
              {sliderPosition === 0 && ` ${t.referencePoint}`}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

