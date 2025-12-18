'use client'

import { useState, useEffect } from 'react'

interface QRCodeUploadProps {
  pageNumber: number
  uploadId?: string
}

export function QRCodeUpload({ pageNumber, uploadId }: QRCodeUploadProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [uploadUrl, setUploadUrl] = useState<string | null>(null)
  const [currentUploadId, setCurrentUploadId] = useState<string | null>(uploadId || null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
          setError('Brak tokenu - zaloguj się ponownie')
          setLoading(false)
          return
        }

        console.log('Fetching uploadId...')
        const response = await fetch('/api/user/upload-id', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        const data = await response.json()
        console.log('Upload ID response:', data)

        if (!response.ok) {
          setError(data.error || 'Błąd pobierania ID')
          setLoading(false)
          return
        }

        if (data.uploadId) {
          setCurrentUploadId(data.uploadId)
          generateQRCode(data.uploadId)
        } else {
          setError('Brak uploadId w odpowiedzi')
          setLoading(false)
        }
      } catch (err) {
        console.error('Error fetching upload ID:', err)
        setError('Błąd połączenia z serwerem')
        setLoading(false)
      }
    }

    fetchUploadId()
  }, [currentUploadId, pageNumber])

  // Generuj QR kod
  const generateQRCode = (uploadIdValue: string) => {
    const url = `${window.location.origin}/upload?page=${pageNumber}&uploadId=${uploadIdValue}`
    setUploadUrl(url)
    // Użyj większego rozmiaru i dodaj margines dla lepszego skanowania
    setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(url)}`)
    setLoading(false)
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center p-8" style={{ background: '#1a1d24' }}>
      <div className="w-full max-w-md text-center space-y-6">
        <h2 className="text-2xl md:text-3xl font-serif text-white">
          Prześlij zdjęcie z postępami
        </h2>
        
        {loading ? (
          <div className="text-gray-400">
            <div className="animate-pulse">Ładowanie kodu QR...</div>
          </div>
        ) : error ? (
          <div className="space-y-4">
            <div className="text-red-400 text-sm p-4 bg-red-900/20 rounded-lg border border-red-800">
              {error}
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Odśwież stronę
            </button>
          </div>
        ) : qrCodeUrl ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <a
                href={uploadUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 bg-white rounded-lg border-2 border-gray-600 hover:border-green-400 transition-colors inline-block"
              >
                {/* Używamy zwykłego img dla zewnętrznego API QR */}
                <img
                  src={qrCodeUrl}
                  alt="QR kod do uploadu"
                  width={300}
                  height={300}
                  className="rounded"
                  style={{ display: 'block' }}
                />
              </a>
            </div>
            <p className="text-sm text-gray-400">
              Zeskanuj kod QR telefonem, aby przesłać zdjęcie z postępami
            </p>
            <p className="text-xs text-gray-500">
              Lub <a href={uploadUrl || '#'} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300">kliknij tutaj</a> aby otworzyć stronę uploadu
            </p>
          </div>
        ) : (
          <div className="text-red-400 text-sm">
            Nie udało się wygenerować kodu QR. Odśwież stronę.
          </div>
        )}
      </div>
    </div>
  )
}

