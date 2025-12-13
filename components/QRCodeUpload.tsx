'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface QRCodeUploadProps {
  pageNumber: number
  uploadId?: string
}

export function QRCodeUpload({ pageNumber, uploadId }: QRCodeUploadProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [uploadUrl, setUploadUrl] = useState<string | null>(null)
  const [currentUploadId, setCurrentUploadId] = useState<string | null>(uploadId || null)
  const [loading, setLoading] = useState(true)

  // Pobierz uploadId użytkownika, jeśli nie został przekazany
  useEffect(() => {
    const fetchUploadId = async () => {
      if (currentUploadId) {
        generateQRCode(currentUploadId)
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
          generateQRCode(data.uploadId)
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

  // Generuj QR kod
  const generateQRCode = (uploadIdValue: string) => {
    const url = `${window.location.origin}/upload?page=${pageNumber}&uploadId=${uploadIdValue}`
    setUploadUrl(url)
    setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`)
    setLoading(false)
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center p-8 bg-white">
      <div className="w-full max-w-md text-center space-y-6">
        <h2 className="text-2xl md:text-3xl font-serif text-gray-900">
          Prześlij zdjęcie z postępami
        </h2>
        
        {loading ? (
          <div className="text-gray-500">Ładowanie...</div>
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
              Zeskanuj kod QR telefonem, aby przesłać zdjęcie z postępami
            </p>
          </div>
        ) : (
          <div className="text-red-600 text-sm">
            Nie udało się wygenerować kodu QR. Odśwież stronę.
          </div>
        )}
      </div>
    </div>
  )
}

