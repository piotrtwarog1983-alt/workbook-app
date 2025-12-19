'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { useTranslation } from '@/lib/LanguageContext'

interface PhotoUploadComponentProps {
  pageNumber: number
  userId?: string
  uploadId?: string
}

export function PhotoUploadComponent({ pageNumber, userId, uploadId }: PhotoUploadComponentProps) {
  const { t } = useTranslation()
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [currentUploadId, setCurrentUploadId] = useState<string | null>(uploadId || null)
  const [uploadUrl, setUploadUrl] = useState<string | null>(null)
  const [checkInterval, setCheckInterval] = useState<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const currentUploadIdRef = useRef<string | null>(uploadId || null)

  // Pobierz uploadId użytkownika, jeśli nie został przekazany
  useEffect(() => {
    const fetchUploadId = async () => {
      if (currentUploadId) {
        // uploadId już jest dostępny
        currentUploadIdRef.current = currentUploadId
        generateQRCode(currentUploadId)
        return
      }

      try {
        const token = localStorage.getItem('token')
        if (!token) {
          setUploadError(t.course.mustBeLoggedIn)
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
          currentUploadIdRef.current = data.uploadId
          generateQRCode(data.uploadId)
        }
      } catch (error) {
        console.error('Error fetching upload ID:', error)
        setUploadError(t.course.failedToLoadUserData)
      }
    }

    fetchUploadId()
  }, [])

  // Generuj QR kod
  const generateQRCode = (uploadIdValue: string) => {
    // Link otwiera się w nowym oknie
    const url = `${window.location.origin}/upload?page=${pageNumber}&uploadId=${uploadIdValue}`
    setUploadUrl(url)
    setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`)

    // Sprawdzaj co 2 sekundy, czy zdjęcie zostało przesłane z telefonu
    if (checkInterval) {
      clearInterval(checkInterval)
    }

    const interval = setInterval(async () => {
      const uploadIdToCheck = currentUploadIdRef.current
      if (!uploadedImage && uploadIdToCheck) {
        try {
          const token = localStorage.getItem('token')
          const response = await fetch(`/api/check-upload?page=${pageNumber}&uploadId=${uploadIdToCheck}`, {
            headers: token ? {
              'Authorization': `Bearer ${token}`,
            } : {},
          })
          const data = await response.json()
          if (data.uploaded && data.imageUrl) {
            setUploadedImage(data.imageUrl)
            clearInterval(interval)
            setCheckInterval(null)
          }
        } catch (error) {
          console.error('Error checking upload:', error)
        }
      } else if (uploadedImage) {
        // Jeśli zdjęcie już jest, zatrzymaj sprawdzanie
        clearInterval(interval)
        setCheckInterval(null)
      }
    }, 2000)

    setCheckInterval(interval)
  }

  useEffect(() => {
    return () => {
      if (checkInterval) {
        clearInterval(checkInterval)
      }
    }
  }, [checkInterval])

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError(t.course.pleaseSelectImage)
      return
    }

    if (!currentUploadId) {
      setUploadError(t.course.noUploadId)
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
        throw new Error(errorData.error || t.course.uploadError)
      }

      const data = await response.json()
      setUploadedImage(data.imageUrl)
      
      // Zatrzymaj sprawdzanie
      if (checkInterval) {
        clearInterval(checkInterval)
        setCheckInterval(null)
      }
    } catch (error: any) {
      setUploadError(error.message || t.course.uploadFailed)
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }, [pageNumber, currentUploadId, checkInterval, t])

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

  return (
    <div className="relative w-full h-full flex flex-col p-8 bg-white overflow-y-auto">
      <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col">
        <h2 className="text-2xl md:text-3xl font-serif text-gray-900 text-center mb-6">
          {t.course.submitPhoto}
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
                ? 'border-primary-500 bg-primary-50' 
                : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
              }
              ${uploadedImage ? 'border-green-500 bg-green-50' : ''}
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
                    alt={t.course.photoUploaded}
                    fill
                    className="object-contain"
                  />
                </div>
                <p className="text-green-600 font-semibold">{t.course.photoUploaded}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setUploadedImage(null)
                  }}
                  className="text-primary-600 hover:text-primary-700 underline"
                >
                  {t.course.uploadOther}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {isUploading ? (
                  <div className="space-y-2">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="text-gray-600">{t.course.uploading}</p>
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
                      <p className="text-lg font-semibold text-gray-700">
                        {t.course.dragOrClick}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        {t.course.supportedFormats}
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {uploadError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {uploadError}
              </div>
            )}
          </div>
        </div>

        {/* QR kod do przesłania z telefonu - na dole kontenera */}
        <div className="border-t pt-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 text-center mb-4">
            {t.course.uploadFromPhone}
          </h3>
          <div className="flex flex-col items-center space-y-4">
            {qrCodeUrl ? (
              <>
                <a
                  href={uploadUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-primary-400 transition-colors"
                >
                  <Image
                    src={qrCodeUrl}
                    alt="QR kod do uploadu"
                    width={300}
                    height={300}
                    className="rounded"
                  />
                </a>
                <p className="text-sm text-gray-600 text-center max-w-md">
                  {t.course.scanQRToUpload}
                </p>
                {!uploadedImage && (
                  <p className="text-xs text-gray-500 text-center">
                    {t.course.waitingForUpload}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-500 text-center">
                {t.common.loading}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

