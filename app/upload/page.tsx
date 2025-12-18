'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'

function UploadContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pageNumber = searchParams.get('page')
  const uploadId = searchParams.get('uploadId')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!pageNumber || !uploadId) {
      setError('Brak wymaganych parametrów w linku')
    }
  }, [pageNumber, uploadId])

  useEffect(() => {
    if (selectedFile) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
    } else {
      setPreview(null)
    }
  }, [selectedFile])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Proszę wybrać plik graficzny')
        return
      }
      setSelectedFile(file)
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !pageNumber || !uploadId) {
      setError('Brak wymaganych danych')
      return
    }

    setIsUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('image', selectedFile)
    formData.append('pageNumber', pageNumber)
    formData.append('uploadId', uploadId)

    try {
      const response = await fetch('/api/upload-photo', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Błąd podczas przesyłania zdjęcia')
      }

      setUploadSuccess(true)
      
      // Po 2 sekundach zamknij okno (jeśli otwarte w nowym oknie) lub przekieruj
      setTimeout(() => {
        // Sprawdź, czy okno zostało otwarte przez window.open
        if (window.opener || window.history.length <= 1) {
          // Zamknij okno, jeśli zostało otwarte przez QR kod
          window.close()
        } else {
          // Jeśli nie można zamknąć, przekieruj
          router.push('/course')
        }
      }, 2000)
    } catch (error: any) {
      setError(error.message || 'Nie udało się przesłać zdjęcia. Spróbuj ponownie.')
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }

  if (!pageNumber || !uploadId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md text-center">
          <p className="text-red-600">Błąd: Nieprawidłowy link</p>
          <p className="text-sm text-gray-600 mt-2">
            Link do uploadu jest nieprawidłowy. Sprawdź kod QR ponownie.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">
          Prześlij zdjęcie
        </h1>

        {uploadSuccess ? (
          <div className="text-center space-y-4">
            <div className="text-green-500 text-5xl mb-4">✓</div>
            <p className="text-lg font-semibold text-gray-900">
              Zdjęcie zostało przesłane pomyślnie!
            </p>
            <p className="text-sm text-gray-600">
              Możesz zamknąć to okno.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {preview ? (
                <div className="space-y-4">
                  <div className="relative w-full h-64 rounded-lg overflow-hidden border-2 border-gray-200">
                    <Image
                      src={preview}
                      alt="Podgląd"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFile(null)
                      setPreview(null)
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ''
                      }
                    }}
                    className="w-full text-sm text-gray-600 underline"
                  >
                    Wybierz inne zdjęcie
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors"
                >
                  <div className="space-y-2">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
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
                    <p className="text-gray-700 font-medium">
                      Wybierz zdjęcie z galerii
                    </p>
                    <p className="text-sm text-gray-500">
                      JPG, PNG, WEBP
                    </p>
                  </div>
                </button>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {error}
              </div>
            )}

            {selectedFile && (
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? 'Przesyłanie...' : 'Prześlij zdjęcie'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Ładowanie...</p>
      </div>
    </div>
  )
}

export default function UploadPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <UploadContent />
    </Suspense>
  )
}
