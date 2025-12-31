'use client'

import Image from 'next/image'
import { CoursePage } from './types'

interface MobilePageRendererProps {
  page: CoursePage
  pageIdx: number
  pageContent: any
  imageUrl: string | null
  hasText: boolean
  hasImage: boolean
  mobileTexts: Record<number, string>
  mobileQRTexts: Record<number, string>
  qrUploading: boolean
  qrUploadStatus: 'idle' | 'success' | 'error'
  userUploadId: string | null
  language: 'PL' | 'DE' | 'EN'
  totalPages: number
  onUploadSuccess: (pageNumber: number) => void
  onSetUserUploadId: (id: string) => void
  onSetQrUploading: (uploading: boolean) => void
  onSetQrUploadStatus: (status: 'idle' | 'success' | 'error') => void
  onSetCompletedPages: (updater: (prev: number[]) => number[]) => void
}

export function MobilePageRenderer({
  page,
  pageIdx,
  pageContent,
  imageUrl,
  hasText,
  hasImage,
  mobileTexts,
  mobileQRTexts,
  qrUploading,
  qrUploadStatus,
  userUploadId,
  language,
  totalPages,
  onUploadSuccess,
  onSetUserUploadId,
  onSetQrUploadStatus,
  onSetQrUploading,
  onSetCompletedPages
}: MobilePageRendererProps) {
  const isPageQRUpload = pageContent?.type === 'qr-upload'

  const handleCameraUpload = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Musisz być zalogowany')
        return
      }

      onSetQrUploading(true)
      onSetQrUploadStatus('idle')

      let uploadId = userUploadId
      if (!uploadId) {
        const response = await fetch('/api/user/upload-id', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await response.json()
        if (!data.uploadId) {
          alert('Nie udało się pobrać ID użytkownika')
          onSetQrUploading(false)
          return
        }
        uploadId = data.uploadId
        onSetUserUploadId(uploadId!)
      }

      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.capture = 'environment'
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file) {
          try {
            const formData = new FormData()
            formData.append('image', file)
            formData.append('pageNumber', page.pageNumber.toString())
            formData.append('uploadId', uploadId!)

            const uploadResponse = await fetch('/api/upload-photo', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` },
              body: formData
            })

            if (uploadResponse.ok) {
              onSetQrUploadStatus('success')
              onSetCompletedPages(prev => [...new Set([...prev, page.pageNumber])])
              onUploadSuccess(page.pageNumber)
              setTimeout(() => onSetQrUploadStatus('idle'), 3000)
            } else {
              onSetQrUploadStatus('error')
              setTimeout(() => onSetQrUploadStatus('idle'), 3000)
            }
          } catch (err) {
            console.error('Upload error:', err)
            onSetQrUploadStatus('error')
            setTimeout(() => onSetQrUploadStatus('idle'), 3000)
          } finally {
            onSetQrUploading(false)
          }
        } else {
          onSetQrUploading(false)
        }
      }
      input.click()
    } catch (err) {
      console.error('Error:', err)
      alert('Wystąpił błąd')
      onSetQrUploading(false)
    }
  }

  const handleGalleryUpload = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Musisz być zalogowany')
        return
      }

      onSetQrUploading(true)
      onSetQrUploadStatus('idle')

      let uploadId = userUploadId
      if (!uploadId) {
        const response = await fetch('/api/user/upload-id', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await response.json()
        if (!data.uploadId) {
          alert('Nie udało się pobrać ID użytkownika')
          onSetQrUploading(false)
          return
        }
        uploadId = data.uploadId
        onSetUserUploadId(uploadId!)
      }

      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file) {
          try {
            const formData = new FormData()
            formData.append('image', file)
            formData.append('pageNumber', page.pageNumber.toString())
            formData.append('uploadId', uploadId!)

            const uploadResponse = await fetch('/api/upload-photo', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` },
              body: formData
            })

            if (uploadResponse.ok) {
              onSetQrUploadStatus('success')
              onSetCompletedPages(prev => [...new Set([...prev, page.pageNumber])])
              onUploadSuccess(page.pageNumber)
              setTimeout(() => onSetQrUploadStatus('idle'), 3000)
            } else {
              onSetQrUploadStatus('error')
              setTimeout(() => onSetQrUploadStatus('idle'), 3000)
            }
          } catch (err) {
            console.error('Upload error:', err)
            onSetQrUploadStatus('error')
            setTimeout(() => onSetQrUploadStatus('idle'), 3000)
          } finally {
            onSetQrUploading(false)
          }
        } else {
          onSetQrUploading(false)
        }
      }
      input.click()
    } catch (err) {
      console.error('Error:', err)
      alert('Wystąpił błąd')
      onSetQrUploading(false)
    }
  }

  return (
    <div
      className="bg-white relative"
      style={{
        minHeight: hasImage && !hasText ? 'calc(100vh - 120px)' : 'auto',
        width: '100%'
      }}
    >
      {isPageQRUpload ? (
        // Strona QR upload - pokaż przyciski kamery i galerii
        <div className="w-full flex flex-col items-center justify-center px-4 py-6 bg-white" style={{ minHeight: 'calc(100vh - 120px)' }}>
          {/* Nagłówek */}
          {mobileQRTexts[page.pageNumber] && (
            <h2 className="text-xl font-serif text-gray-900 text-center mb-6">
              {mobileQRTexts[page.pageNumber]}
            </h2>
          )}
          
          {/* Kontener na przyciski */}
          <div className="flex flex-col gap-4 w-full max-w-xs">
            {/* Przycisk aparatu */}
            <button
              onClick={handleCameraUpload}
              disabled={qrUploading}
              className={`inline-flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold text-lg rounded-full shadow-lg active:scale-95 transition-all ${qrUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {qrUploading ? (
                <>
                  <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {language === 'DE' ? 'Wird hochgeladen...' : 'Przesyłanie...'}
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {language === 'DE' ? 'Foto aufnehmen' : 'Zrób zdjęcie'}
                </>
              )}
            </button>

            {/* Przycisk galerii */}
            <button
              onClick={handleGalleryUpload}
              disabled={qrUploading}
              className={`inline-flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold text-lg rounded-full shadow-lg active:scale-95 transition-all ${qrUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {language === 'DE' ? 'Aus Galerie wählen' : 'Wybierz z galerii'}
            </button>
          </div>

          {/* Status uploadu */}
          {qrUploadStatus === 'success' && (
            <div className="mt-4 text-green-600 text-base font-semibold animate-pulse flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {language === 'DE' ? 'Foto wurde hochgeladen!' : 'Zdjęcie zostało przesłane!'}
            </div>
          )}
          {qrUploadStatus === 'error' && (
            <div className="mt-4 text-red-600 text-base font-semibold flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              {language === 'DE' ? 'Fehler beim Hochladen' : 'Błąd podczas przesyłania'}
            </div>
          )}
        </div>
      ) : (
        <div className="w-full flex flex-col" style={{ minHeight: hasImage && !hasText ? 'calc(100vh - 120px)' : 'auto' }}>
          {/* Obraz */}
          {hasImage && (
            <div className="relative w-full" style={{ 
              minHeight: hasText ? '40vh' : 'calc(100vh - 120px)',
              height: hasText ? '40vh' : 'calc(100vh - 120px)'
            }}>
              <Image
                src={imageUrl!.startsWith('/') ? imageUrl! : `/course/strona ${page.pageNumber}/Foto/${imageUrl}`}
                alt={page.title || `Strona ${page.pageNumber}`}
                fill
                className="object-contain"
                sizes="100vw"
                priority={pageIdx < 3}
              />
            </div>
          )}
          {/* Tekst */}
          {hasText && (
            <div className={`w-full flex items-center justify-center px-4 py-3 bg-white ${!hasImage ? 'min-h-[40vh]' : ''}`}>
              <div className="text-center text-gray-900 max-w-lg w-full">
                <div className="text-sm sm:text-base whitespace-pre-line leading-relaxed">
                  {mobileTexts[page.pageNumber] || pageContent?.text}
                </div>
              </div>
            </div>
          )}
          {/* Placeholder jeśli brak treści */}
          {!hasImage && !hasText && (
            <div className="w-full flex items-center justify-center px-4 py-6 bg-white" style={{ minHeight: 'calc(100vh - 120px)' }}>
              <div className="text-center text-gray-900">
                {page.title && <h2 className="text-2xl mb-4">{page.title}</h2>}
                <p className="text-lg">Strona {page.pageNumber}</p>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Numer strony */}
      <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded z-10">
        {page.pageNumber} / {totalPages}
      </div>
    </div>
  )
}
