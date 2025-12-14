'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Pusher from 'pusher-js'

interface ProgressGalleryProps {
  uploadId?: string
}

export function ProgressGallery({ uploadId }: ProgressGalleryProps) {
  const [progressImages, setProgressImages] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUploadId, setCurrentUploadId] = useState<string | null>(uploadId || null)
  const [currentIndex, setCurrentIndex] = useState(-1) // -1 oznacza "jeszcze nie ustawiono"
  const [isFirstLoad, setIsFirstLoad] = useState(true)

  // Strony, z których pobieramy zdjęcia z postępami
  const progressPages = [7, 15, 20, 29, 35, 40, 49]

  // Pobierz uploadId użytkownika, jeśli nie został przekazany
  useEffect(() => {
    const fetchUploadId = async () => {
      if (currentUploadId) {
        fetchProgressImages(currentUploadId)
        return
      }

      try {
        const token = localStorage.getItem('token')
        if (!token) {
          setLoading(false)
          return
        }

        const response = await fetch('/api/user/upload-id', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          setLoading(false)
          return
        }

        const data = await response.json()
        if (data.uploadId) {
          setCurrentUploadId(data.uploadId)
          fetchProgressImages(data.uploadId)
        } else {
          setLoading(false)
        }
      } catch (error) {
        console.error('Error fetching upload ID:', error)
        setLoading(false)
      }
    }

    fetchUploadId()
  }, [])

  // Pobierz zdjęcia z postępami
  const fetchProgressImages = async (uploadIdValue: string) => {
    try {
      const token = localStorage.getItem('token')
      const images: string[] = []
      const previousLength = progressImages.length

      // Sprawdź każdą stronę z postępami
      for (const pageNumber of progressPages) {
        try {
          const response = await fetch(`/api/check-upload?page=${pageNumber}&uploadId=${uploadIdValue}`, {
            headers: token ? {
              'Authorization': `Bearer ${token}`,
            } : {},
          })
          const data = await response.json()
          if (data.uploaded && data.imageUrl) {
            images.push(data.imageUrl)
          }
        } catch (error) {
          console.error(`Error checking upload for page ${pageNumber}:`, error)
        }
      }

      setProgressImages(images)
      setLoading(false)
      
      // Przy pierwszym załadowaniu lub gdy dodano nowe zdjęcie - pokaż ostatnie
      if (images.length > 0) {
        if (isFirstLoad) {
          // Pierwsze załadowanie - zawsze pokaż ostatnie zdjęcie
          setCurrentIndex(images.length - 1)
          setIsFirstLoad(false)
        } else if (images.length > previousLength) {
          // Dodano nowe zdjęcie - przejdź do niego
          setCurrentIndex(images.length - 1)
        }
      }
    } catch (error) {
      console.error('Error fetching progress images:', error)
      setLoading(false)
    }
  }

  // Pusher - nasłuchuj na nowe zdjęcia z telefonu (real-time, bez pollingu)
  useEffect(() => {
    if (!currentUploadId) return

    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER

    // Sprawdź czy Pusher jest skonfigurowany
    if (!pusherKey || !pusherCluster) {
      console.warn('Pusher nie skonfigurowany - brak NEXT_PUBLIC_PUSHER_KEY lub NEXT_PUBLIC_PUSHER_CLUSTER')
      return
    }

    console.log('ProgressGallery: Inicjalizacja Pusher...')
    
    // Inicjalizacja Pusher
    const pusher = new Pusher(pusherKey, {
      cluster: pusherCluster,
    })

    // Subskrybuj kanał dla tego uploadId
    const channel = pusher.subscribe(`upload-${currentUploadId}`)
    console.log('ProgressGallery: Subskrybowano kanał upload-' + currentUploadId)

    // Nasłuchuj na event przesłania zdjęcia
    channel.bind('photo-uploaded', (data: { pageNumber: number; imageUrl: string }) => {
      console.log('ProgressGallery: Otrzymano event photo-uploaded:', data)
      // Sprawdź czy to strona z postępami
      if (progressPages.includes(data.pageNumber)) {
        // Dodaj nowe zdjęcie do galerii
        setProgressImages(prev => {
          // Unikaj duplikatów
          if (prev.includes(data.imageUrl)) return prev
          const newImages = [...prev, data.imageUrl]
          // Przejdź do nowego zdjęcia
          setCurrentIndex(newImages.length - 1)
          console.log('ProgressGallery: Dodano nowe zdjęcie, łącznie:', newImages.length)
          return newImages
        })
      }
    })

    // Cleanup przy odmontowaniu
    return () => {
      console.log('ProgressGallery: Rozłączanie Pusher...')
      channel.unbind_all()
      channel.unsubscribe()
      pusher.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUploadId])

  // UWAGA: Usunięto visibility API polling - używamy tylko Pusher
  // Zdjęcia są ładowane raz przy pierwszym renderze (fetchProgressImages w pierwszym useEffect)

  // Nawigacja klawiszami
  useEffect(() => {
    if (progressImages.length === 0) return

    const handleKeyPress = (e: KeyboardEvent) => {
      // Sprawdź, czy użytkownik nie jest w polu tekstowym
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        e.preventDefault()
        setCurrentIndex(currentIndex - 1)
      } else if (e.key === 'ArrowRight' && currentIndex < progressImages.length - 1) {
        e.preventDefault()
        setCurrentIndex(currentIndex + 1)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentIndex, progressImages.length])

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const goToNext = () => {
    if (currentIndex < progressImages.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  if (loading) {
    return (
      <div className="w-full lg:w-[32rem] bg-white border-2 border-gray-200 rounded-lg p-4 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Twoje postępy</h3>
        <div className="text-center py-8 text-gray-500">Ładowanie...</div>
      </div>
    )
  }

  if (progressImages.length === 0) {
    return (
      <div className="w-full lg:w-[32rem] bg-white border-2 border-gray-200 rounded-lg p-4 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Twoje postępy</h3>
        <div className="text-center py-8 text-gray-500 text-sm">
          Brak zdjęć z postępami.<br />
          Prześlij zdjęcia używając kodów QR.
        </div>
      </div>
    )
  }

  return (
    <div className="w-full lg:w-[32rem] bg-white border-2 border-gray-200 rounded-lg p-4 shadow-lg">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Twoje postępy</h3>
      
      {/* Kontener ze zdjęciem */}
      <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-100">
        {currentIndex >= 0 && progressImages[currentIndex] && (
          <Image
            src={progressImages[currentIndex]}
            alt={`Zdjęcie postępu ${currentIndex + 1}`}
            fill
            className="object-contain"
            sizes="(max-width: 1024px) 100vw, 256px"
          />
        )}

        {/* Strzałka w lewo */}
        {currentIndex > 0 && progressImages.length > 1 && (
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all z-10"
            aria-label="Poprzednie zdjęcie"
          >
            <svg
              className="w-6 h-6 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}

        {/* Strzałka w prawo */}
        {currentIndex < progressImages.length - 1 && (
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all z-10"
            aria-label="Następne zdjęcie"
          >
            <svg
              className="w-6 h-6 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Wskaźnik (np. 1/7) */}
      {currentIndex >= 0 && (
        <div className="mt-3 text-center text-sm text-gray-600">
          {currentIndex + 1} / {progressImages.length}
        </div>
      )}

      {/* Miniaturki pod zdjęciem (opcjonalnie) */}
      {progressImages.length > 1 && (
        <div className="mt-3 flex gap-2 justify-center overflow-x-auto pb-2">
          {progressImages.map((imageUrl, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`relative w-12 h-12 rounded overflow-hidden border-2 flex-shrink-0 transition-all ${
                index === currentIndex
                  ? 'border-primary-500 ring-2 ring-primary-200'
                  : 'border-gray-300 opacity-60 hover:opacity-100'
              }`}
            >
              <Image
                src={imageUrl}
                alt={`Miniatura ${index + 1}`}
                fill
                className="object-cover"
                sizes="48px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
