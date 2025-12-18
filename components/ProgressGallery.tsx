'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Pusher from 'pusher-js'
import { PROGRESS_PAGES } from '@/lib/progress-pages'

interface ProgressGalleryProps {
  uploadId?: string
  onProgressUpdate?: (completedPages: number[]) => void
}

export function ProgressGallery({ uploadId, onProgressUpdate }: ProgressGalleryProps) {
  const [progressImages, setProgressImages] = useState<{url: string, page: number}[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUploadId, setCurrentUploadId] = useState<string | null>(uploadId || null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const pusherRef = useRef<Pusher | null>(null)

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
      const images: {url: string, page: number}[] = []
      const completedPages: number[] = []
      const previousLength = progressImages.length

      // Sprawdź każdą stronę z postępami
      for (const pageNumber of PROGRESS_PAGES) {
        try {
          const response = await fetch(`/api/check-upload?page=${pageNumber}&uploadId=${uploadIdValue}`, {
            headers: token ? {
              'Authorization': `Bearer ${token}`,
            } : {},
          })
          const data = await response.json()
          if (data.uploaded && data.imageUrl) {
            images.push({ url: data.imageUrl, page: pageNumber })
            completedPages.push(pageNumber)
          }
        } catch (error) {
          console.error(`Error checking upload for page ${pageNumber}:`, error)
        }
      }

      setProgressImages(images)
      setLoading(false)
      
      // Powiadom o ukończonych stronach
      if (onProgressUpdate) {
        onProgressUpdate(completedPages)
      }
      
      // Jeśli dodano nowe zdjęcie, przejdź do ostatniego
      if (images.length > previousLength && images.length > 0) {
        setCurrentIndex(images.length - 1)
      }
    } catch (error) {
      console.error('Error fetching progress images:', error)
      setLoading(false)
    }
  }

  // Pusher real-time updates
  useEffect(() => {
    if (!currentUploadId) return

    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER

    if (pusherKey && pusherCluster) {
      // Użyj Pusher dla real-time updates
      pusherRef.current = new Pusher(pusherKey, {
        cluster: pusherCluster,
      })

      const channel = pusherRef.current.subscribe(`progress-${currentUploadId}`)
      
      channel.bind('photo:uploaded', (data: { pageNumber: number; imageUrl: string }) => {
        console.log('Received photo:uploaded event:', data)
        // Odśwież galerię po otrzymaniu nowego zdjęcia
        fetchProgressImages(currentUploadId)
      })

      return () => {
        channel.unbind_all()
        channel.unsubscribe()
        pusherRef.current?.disconnect()
      }
    } else {
      // Fallback: polling co 5 sekund jeśli Pusher nie jest skonfigurowany
      const interval = setInterval(() => {
        fetchProgressImages(currentUploadId)
      }, 5000)

      return () => clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUploadId])

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
      <div className="w-full lg:w-[32rem] h-full p-4 panel-elegant panel-glow rounded-2xl">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Twoje postępy</h3>
        <div className="text-center py-8 text-gray-500">Ładowanie...</div>
      </div>
    )
  }

  if (progressImages.length === 0) {
    return (
      <div className="w-full lg:w-[32rem] h-full p-4 panel-elegant panel-glow rounded-2xl">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Twoje postępy</h3>
        <div className="text-center py-8 text-gray-500 text-sm">
          Brak zdjęć z postępami.<br />
          Prześlij zdjęcia używając kodów QR.
        </div>
      </div>
    )
  }

  return (
    <div className="w-full lg:w-[32rem] h-full p-4 panel-elegant panel-glow rounded-2xl flex flex-col">
      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Twoje postępy</h3>
      
      {/* Kontener ze zdjęciem */}
      <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-black/20 flex-shrink-0">
        <Image
          src={progressImages[currentIndex].url}
          alt={`Zdjęcie postępu ${currentIndex + 1}`}
          fill
          className="object-contain"
          sizes="(max-width: 1024px) 100vw, 512px"
        />

        {/* Strzałka w lewo */}
        {currentIndex > 0 && (
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 rounded-full p-2 transition-all z-10"
            aria-label="Poprzednie zdjęcie"
          >
            <svg
              className="w-5 h-5 text-white"
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
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 rounded-full p-2 transition-all z-10"
            aria-label="Następne zdjęcie"
          >
            <svg
              className="w-5 h-5 text-white"
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

        {/* Numer strony */}
        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
          Strona {progressImages[currentIndex].page}
        </div>
      </div>

      {/* Wskaźnik (np. 1/7) */}
      <div className="mt-3 text-center text-sm text-gray-400">
        {currentIndex + 1} / {progressImages.length}
      </div>

      {/* Miniaturki pod zdjęciem */}
      {progressImages.length > 1 && (
        <div className="mt-3 flex gap-2 justify-center overflow-x-auto pb-2 flex-wrap">
          {progressImages.map((img, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`relative w-14 h-14 rounded overflow-hidden border-2 flex-shrink-0 transition-all ${
                index === currentIndex
                  ? 'border-primary-500 ring-2 ring-primary-500/30'
                  : 'border-white/20 opacity-60 hover:opacity-100'
              }`}
            >
              <Image
                src={img.url}
                alt={`Miniatura ${index + 1}`}
                fill
                className="object-cover"
                sizes="56px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
