'use client'

import { useState, useEffect } from 'react'
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
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [currentUploadId, setCurrentUploadId] = useState<string | null>(uploadId || null)
  const [uploadUrl, setUploadUrl] = useState<string | null>(null)

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

  if (!isPageAllowed) {
    return (
      <div className="relative w-full h-full flex flex-col p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col items-center justify-center text-center text-gray-600">
          <h2 className="text-2xl font-serif text-gray-900 mb-4">Przesyłanie zdjęć</h2>
          <p>Ta strona nie posiada sekcji postępów. Wysyłanie zdjęć jest dostępne tylko dla stron: 7, 15, 20, 29, 35, 40 oraz 49.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center p-8 bg-white">
      <div className="w-full max-w-md text-center space-y-6">
        <h2 className="text-2xl md:text-3xl font-serif text-gray-900">
          Prześlij zdjęcie z postępami
        </h2>
        
        {uploadError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {uploadError}
          </div>
        )}

        {uploadedImage ? (
          <div className="space-y-4">
            <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden border-2 border-green-500">
              <Image
                src={uploadedImage}
                alt="Przesłane zdjęcie"
                fill
                className="object-contain"
              />
            </div>
            <p className="text-green-600 font-semibold">Zdjęcie zostało przesłane pomyślnie!</p>
            <p className="text-sm text-gray-600">
              Aby zamienić zdjęcie, zeskanuj ponownie kod QR telefonem.
            </p>
          </div>
        ) : qrCodeUrl ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <a
                href={uploadUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-primary-400 transition-colors inline-block"
              >
                <Image
                  src={qrCodeUrl}
                  alt="QR kod do uploadu"
                  width={300}
                  height={300}
                  className="rounded"
                />
              </a>
            </div>
            <p className="text-sm text-gray-600">
              Zeskanuj kod QR telefonem, aby przesłać zdjęcie z postępami.
              <br />
              Nowe zdjęcie zawsze zastąpi poprzednie na tej stronie.
            </p>
          </div>
        ) : (
          <div className="text-gray-500">Ładowanie...</div>
        )}
      </div>
    </div>
  )
}

