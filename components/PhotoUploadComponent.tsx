'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Image from 'next/image'
import Pusher from 'pusher-js'
import { PROGRESS_PAGES_SET } from '@/lib/progress-pages'

interface PhotoUploadComponentProps {
  pageNumber: number
  userId?: string
  uploadId?: string
}

export function PhotoUploadComponent({ pageNumber, userId, uploadId }: PhotoUploadComponentProps) {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [currentUploadId, setCurrentUploadId] = useState<string | null>(uploadId || null)
  const [uploadUrl, setUploadUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isPageAllowed = PROGRESS_PAGES_SET.has(pageNumber)

  // Pobierz uploadId użytkownika, jeśli nie został przekazany
  useEffect(() => {
    if (!isPageAllowed) {
      setUploadError('Ta strona nie obsługuje przesyłania zdjęć w sekcji "Twoje postępy".')
      return
    }

    const fetchUploadId = async () => {
      if (currentUploadId) {
        // uploadId już jest dostępny
        generateQRCode(currentUploadId)
        return
      }

      try {
        const token = localStorage.getItem('token')
        if (!token) {
          setUploadError('Musisz być zalogowany, aby przesłać zdjęcie')
          return
        }

        const response = await fetch('/api/user/upload-id', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Nie udało się pobrać identyfikatora uploadu')
        }

        const data = await response.json()
        if (data.uploadId) {
          setCurrentUploadId(data.uploadId)
          generateQRCode(data.uploadId)
        }
      } catch (error) {
        console.error('Error fetching upload ID:', error)
        setUploadError('Nie udało się załadować danych użytkownika')
      }
    }

    fetchUploadId()
  }, [isPageAllowed])

  // Generuj QR kod
  const generateQRCode = (uploadIdValue: string) => {
    if (!isPageAllowed) return
    // Link otwiera się w nowym oknie
    const url = `${window.location.origin}/upload?page=${pageNumber}&uploadId=${uploadIdValue}`
    setUploadUrl(url)
    setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`)
  }

  // Pusher - nasłuchuj na event z telefonu (real-time, bez pollingu)
  useEffect(() => {
    if (!isPageAllowed || !currentUploadId || uploadedImage) return

    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER

    // Sprawdź czy Pusher jest skonfigurowany
    if (!pusherKey || !pusherCluster) {
      console.warn('Pusher nie skonfigurowany - brak NEXT_PUBLIC_PUSHER_KEY lub NEXT_PUBLIC_PUSHER_CLUSTER')
      return
    }

    console.log('PhotoUpload: Inicjalizacja Pusher...')

    // Inicjalizacja Pusher
    const pusher = new Pusher(pusherKey, {
      cluster: pusherCluster,
    })

    // Subskrybuj kanał dla tego uploadId
    const channel = pusher.subscribe(`upload-${currentUploadId}`)
    console.log('PhotoUpload: Subskrybowano kanał upload-' + currentUploadId)

    // Nasłuchuj na event przesłania zdjęcia
    channel.bind('photo-uploaded', (data: { pageNumber: number; imageUrl: string }) => {
      console.log('PhotoUpload: Otrzymano event photo-uploaded:', data)
      // Sprawdź czy to zdjęcie dla tej strony
      if (data.pageNumber === pageNumber) {
        setUploadedImage(data.imageUrl)
        console.log('PhotoUpload: Ustawiono zdjęcie')
      }
    })

    // Cleanup przy odmontowaniu
    return () => {
      console.log('PhotoUpload: Rozłączanie Pusher...')
      channel.unbind_all()
      channel.unsubscribe()
      pusher.disconnect()
    }
  }, [currentUploadId, pageNumber, uploadedImage, isPageAllowed])

  const handleFile = useCallback(async (file: File) => {
    if (!isPageAllowed) {
      setUploadError('Ta strona nie obsługuje przesyłania zdjęć.')
      return
    }

    if (!file.type.startsWith('image/')) {
      setUploadError('Proszę wybrać plik graficzny')
      return
    }

    if (!currentUploadId) {
      setUploadError('Brak identyfikatora uploadu. Odśwież stronę.')
      return
    }

    setIsUploading(true)
    setUploadError(null)

    const formData = new FormData()
    formData.append('image', file)
    formData.append('pageNumber', pageNumber.toString())
    formData.append('uploadId', currentUploadId)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/upload-photo', {
        method: 'POST',
        headers: token ? {
          'Authorization': `Bearer ${token}`,
        } : {},
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Błąd podczas przesyłania zdjęcia')
      }

      const data = await response.json()
      setUploadedImage(data.imageUrl)
    } catch (error: any) {
      setUploadError(error.message || 'Nie udało się przesłać zdjęcia. Spróbuj ponownie.')
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }, [pageNumber, currentUploadId])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFile(file)
    }
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }, [handleFile])

  const handleClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  if (!isPageAllowed) {
    return (
      <div className="relative w-full h-full flex flex-col p-8 bg-black overflow-y-auto">
        <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col items-center justify-center text-center text-gray-400">
          <h2 className="text-2xl font-serif text-white mb-4">Przesyłanie zdjęć</h2>
          <p>Ta strona nie posiada sekcji postępów. Wysyłanie zdjęć jest dostępne tylko dla stron: 7, 15, 20, 29, 35, 40 oraz 49.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full flex flex-col p-8 bg-black overflow-y-auto">
      <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col">
        <h2 className="text-2xl md:text-3xl font-serif text-white text-center mb-6">
          Prześlij swoje zdjęcie
        </h2>

        {/* Kontener do uploadu - Desktop */}
        <div className="hidden lg:block flex-1 flex items-center justify-center">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={handleClick}
            className={`
              relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer w-full
              transition-all duration-200
              ${isDragging 
                ? 'border-primary-500 bg-primary-900/30' 
                : 'border-gray-700 hover:border-primary-400 hover:bg-gray-900/50'
              }
              ${uploadedImage ? 'border-green-500 bg-green-900/20' : ''}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
            />

            {uploadedImage ? (
              <div className="space-y-4">
                <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden">
                  <Image
                    src={uploadedImage}
                    alt="Przesłane zdjęcie"
                    fill
                    className="object-contain"
                  />
                </div>
                <p className="text-green-400 font-semibold">Zdjęcie zostało przesłane pomyślnie!</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setUploadedImage(null)
                  }}
                  className="text-primary-400 hover:text-primary-300 underline"
                >
                  Prześlij inne zdjęcie
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {isUploading ? (
                  <div className="space-y-2">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="text-gray-400">Przesyłanie zdjęcia...</p>
                  </div>
                ) : (
                  <>
                    <svg
                      className="mx-auto h-16 w-16 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div>
                      <p className="text-lg font-semibold text-gray-300">
                        Przeciągnij zdjęcie tutaj lub kliknij, aby wybrać
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Obsługiwane formaty: JPG, PNG, WEBP
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {uploadError && (
              <div className="mt-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-200 text-sm">
                {uploadError}
              </div>
            )}
          </div>
        </div>

        {/* QR kod do przesłania z telefonu - na dole kontenera */}
        <div className="border-t border-gray-800 pt-6 mt-6">
          <h3 className="text-lg font-semibold text-white text-center mb-4">
            Lub prześlij z telefonu:
          </h3>
          <div className="flex flex-col items-center space-y-4">
                {qrCodeUrl ? (
              <>
                <a
                  href={uploadUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 bg-gray-800 rounded-lg border-2 border-gray-700 hover:border-primary-400 transition-colors"
                >
                  <Image
                    src={qrCodeUrl}
                    alt="QR kod do uploadu"
                    width={300}
                    height={300}
                    className="rounded"
                  />
                </a>
                <p className="text-sm text-gray-400 text-center max-w-md">
                  Zeskanuj kod QR telefonem, aby otworzyć stronę do przesłania zdjęcia bezpośrednio z urządzenia mobilnego.
                  Nowe zdjęcie zawsze zastąpi poprzednie na tej stronie.
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-500 text-center">
                Ładowanie...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

