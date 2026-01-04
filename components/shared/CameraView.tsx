'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'

interface CameraViewProps {
  onCapture?: (imageData: string) => void
  onClose?: () => void
  pageNumber?: number
  showGridOverlay?: boolean
  showLevel?: boolean
}

export function CameraView({ 
  onCapture, 
  onClose, 
  pageNumber,
  showGridOverlay = true,
  showLevel = true 
}: CameraViewProps) {
  // Stan kamery
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  
  // Zoom
  const [zoom, setZoom] = useState(1)
  const [minZoom, setMinZoom] = useState(1)
  const [maxZoom, setMaxZoom] = useState(1)
  
  // Grid overlay
  const [gridType, setGridType] = useState<'none' | 'thirds' | 'fibonacci'>('thirds')
  
  // Poziomnica
  const [tiltX, setTiltX] = useState(0) // lewo-prawo
  const [tiltY, setTiltY] = useState(0) // przód-tył
  const [isLevelSupported, setIsLevelSupported] = useState(false)
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  
  // Pinch-to-zoom
  const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null)
  const [initialZoom, setInitialZoom] = useState(1)

  // Sprawdź czy jesteśmy w bezpiecznym kontekście (HTTPS lub localhost)
  const isSecureContext = typeof window !== 'undefined' && (
    window.isSecureContext || 
    window.location.protocol === 'https:' || 
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  )

  // Uruchomienie kamery
  const startCamera = useCallback(async () => {
    try {
      setError(null)
      
      // Sprawdź czy mamy bezpieczny kontekst
      if (!isSecureContext) {
        setError('Kamera wymaga HTTPS. Użyj aplikacji przez https:// lub localhost.')
        return
      }

      // Sprawdź czy API jest dostępne
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Twoja przeglądarka nie obsługuje dostępu do kamery.')
        return
      }
      
      // Zatrzymaj poprzedni stream jeśli istnieje
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setIsActive(true)

        // Sprawdź możliwości zoom - ograniczamy do max 3x
        const track = stream.getVideoTracks()[0]
        const capabilities = track.getCapabilities() as any
        
        if (capabilities.zoom) {
          const deviceMinZoom = capabilities.zoom.min || 1
          const deviceMaxZoom = capabilities.zoom.max || 1
          setMinZoom(deviceMinZoom)
          setMaxZoom(Math.min(deviceMaxZoom, 3)) // Maksymalnie 3x zoom
          setZoom(deviceMinZoom)
        }
      }
    } catch (err: any) {
      console.error('Camera error:', err)
      if (err.name === 'NotAllowedError') {
        setError('Brak uprawnień do kamery. Włącz dostęp w ustawieniach przeglądarki.')
      } else if (err.name === 'NotFoundError') {
        setError('Nie znaleziono kamery na tym urządzeniu.')
      } else if (err.name === 'NotSupportedError' || err.name === 'SecurityError') {
        setError('Kamera wymaga HTTPS. Użyj aplikacji przez https:// lub localhost.')
      } else {
        setError(`Błąd kamery: ${err.message}`)
      }
    }
  }, [facingMode, isSecureContext])

  // Zatrzymanie kamery
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsActive(false)
  }, [])

  // Zmiana zoom
  const handleZoomChange = useCallback((newZoom: number) => {
    const clampedZoom = Math.min(Math.max(newZoom, minZoom), maxZoom)
    setZoom(clampedZoom)

    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0]
      const capabilities = track.getCapabilities() as any
      
      if (capabilities.zoom) {
        const constraints = { advanced: [{ zoom: clampedZoom }] } as any
        track.applyConstraints(constraints).catch(console.error)
      }
    }
  }, [minZoom, maxZoom])

  // Robienie zdjęcia
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return

    // Ustaw rozmiar canvas na rozmiar video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Rysuj video na canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Pobierz dane obrazu jako base64
    const imageData = canvas.toDataURL('image/jpeg', 0.9)
    
    if (onCapture) {
      onCapture(imageData)
    }
  }, [onCapture])

  // Przełączanie kamery (przód/tył)
  const toggleCamera = useCallback(() => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')
  }, [])

  // Przełączanie grid overlay
  const toggleGrid = useCallback(() => {
    setGridType(prev => {
      if (prev === 'none') return 'thirds'
      if (prev === 'thirds') return 'fibonacci'
      return 'none'
    })
  }, [])

  // Inicjalizacja DeviceOrientation dla poziomicy
  useEffect(() => {
    if (!showLevel || typeof window === 'undefined') return

    const handleOrientation = (event: Event) => {
      const orientationEvent = event as DeviceOrientationEvent
      if (orientationEvent.gamma !== null && orientationEvent.beta !== null) {
        setIsLevelSupported(true)
        // gamma: obrót wokół osi Y (-90 do 90) - przechył lewo/prawo
        // beta: obrót wokół osi X (-180 do 180) - przechył przód/tył
        setTiltX(orientationEvent.gamma)
        setTiltY(orientationEvent.beta - 90) // Normalizacja dla trzymania pionowego
      }
    }

    // Sprawdź czy potrzebna jest zgoda (iOS 13+)
    if (typeof window !== 'undefined') {
      const DeviceOrientationEvent = (window as any).DeviceOrientationEvent
      if (DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
          .then((response: string) => {
            if (response === 'granted') {
              window.addEventListener('deviceorientation', handleOrientation)
            }
          })
          .catch(console.error)
      } else {
        window.addEventListener('deviceorientation', handleOrientation as EventListener)
      }
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation as EventListener)
    }
  }, [showLevel])

  // Uruchomienie kamery przy montowaniu
  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [startCamera, stopCamera])

  // Restart kamery przy zmianie facingMode
  useEffect(() => {
    if (isActive) {
      startCamera()
    }
  }, [facingMode])

  // Obsługa pinch-to-zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      setInitialPinchDistance(distance)
      setInitialZoom(zoom)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDistance !== null) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      const scale = distance / initialPinchDistance
      const newZoom = initialZoom * scale
      handleZoomChange(newZoom)
    }
  }

  const handleTouchEnd = () => {
    setInitialPinchDistance(null)
  }

  // Renderowanie grid overlay
  const renderGridOverlay = () => {
    if (gridType === 'none') return null

    if (gridType === 'thirds') {
      // Siatka thirds (reguła trójpodziału)
      return (
        <div className="absolute inset-0 pointer-events-none">
          {/* Linie pionowe */}
          <div className="absolute top-0 bottom-0 left-1/3 w-px bg-white/40" />
          <div className="absolute top-0 bottom-0 left-2/3 w-px bg-white/40" />
          {/* Linie poziome */}
          <div className="absolute left-0 right-0 top-1/3 h-px bg-white/40" />
          <div className="absolute left-0 right-0 top-2/3 h-px bg-white/40" />
        </div>
      )
    }

    if (gridType === 'fibonacci') {
      // Spirala Fibonacci (złota spirala)
      return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <svg 
            viewBox="0 0 100 100" 
            className="w-full h-full"
            style={{ maxWidth: '100%', maxHeight: '100%' }}
          >
            {/* Złota spirala przybliżona */}
            <path
              d="M 61.8 38.2 
                 A 23.6 23.6 0 0 1 38.2 61.8
                 A 14.6 14.6 0 0 1 23.6 47.2
                 A 9 9 0 0 1 32.6 38.2
                 A 5.6 5.6 0 0 1 38.2 43.8
                 A 3.4 3.4 0 0 1 34.8 47.2
                 A 2.1 2.1 0 0 1 32.7 45.1"
              fill="none"
              stroke="rgba(255, 215, 0, 0.6)"
              strokeWidth="0.5"
            />
            {/* Prostokąty złotego podziału */}
            <rect x="38.2" y="0" width="61.8" height="61.8" fill="none" stroke="rgba(255, 215, 0, 0.3)" strokeWidth="0.3" />
            <rect x="0" y="0" width="38.2" height="38.2" fill="none" stroke="rgba(255, 215, 0, 0.3)" strokeWidth="0.3" />
            <rect x="0" y="38.2" width="23.6" height="23.6" fill="none" stroke="rgba(255, 215, 0, 0.3)" strokeWidth="0.3" />
            <rect x="23.6" y="47.2" width="14.6" height="14.6" fill="none" stroke="rgba(255, 215, 0, 0.3)" strokeWidth="0.3" />
          </svg>
        </div>
      )
    }

    return null
  }

  // Renderowanie poziomicy i kąta przechyłu
  const renderLevel = () => {
    if (!showLevel || !isLevelSupported) return null

    // Określ czy telefon jest wypoziomowany (lewo-prawo)
    const isLevelX = Math.abs(tiltX) < 3 // Zwiększony próg tolerancji
    
    // Kąt przechyłu (pitch) - jak bardzo telefon jest przechylony do przodu/tyłu
    // tiltY = 0 oznacza telefon trzymany pionowo
    // tiltY = -90 oznacza telefon trzymany poziomo (ekran do góry)
    const pitchAngle = Math.round(tiltY + 90) // Normalizacja: 0° = poziomo, 90° = pionowo

    return (
      <>
        {/* Poziomnica - tylko oczko, na dole ekranu */}
        <div className="absolute bottom-28 left-1/2 transform -translate-x-1/2">
          <div className="relative w-40 h-10 bg-black/60 rounded-full overflow-hidden backdrop-blur-sm border border-white/20">
            {/* Środkowe znaczniki (cel) */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-0.5 h-6 bg-green-500/60" />
            <div className="absolute top-1/2 left-1/4 transform -translate-y-1/2 w-0.5 h-3 bg-white/30" />
            <div className="absolute top-1/2 left-3/4 transform -translate-y-1/2 w-0.5 h-3 bg-white/30" />
            
            {/* Bańka poziomu (oczko) - zmniejszona czułość (mnożnik 1.5 zamiast 3) */}
            <div 
              className={`absolute top-1/2 transform -translate-y-1/2 w-5 h-5 rounded-full transition-all duration-100 shadow-lg ${isLevelX ? 'bg-green-500 shadow-green-500/50' : 'bg-white shadow-white/30'}`}
              style={{ 
                left: `calc(50% + ${Math.max(-60, Math.min(60, tiltX * 1.5))}px - 10px)` 
              }}
            />
          </div>
        </div>

        {/* Kąt przechyłu przód-tył - w górnej części ekranu, pod nagłówkiem */}
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2">
          <div className="px-4 py-2 bg-black/60 rounded-xl backdrop-blur-sm border border-white/20 flex items-center gap-2">
            <span className="text-white/60 text-sm">Kąt:</span>
            <span className="text-yellow-400 text-lg font-bold min-w-[3ch] text-center">{pitchAngle}°</span>
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col">
      {/* Nagłówek */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/70 to-transparent">
        {/* Przycisk zamknięcia */}
        <button
          onClick={() => {
            stopCamera()
            onClose?.()
          }}
          className="w-10 h-10 flex items-center justify-center text-white text-2xl"
        >
          ✕
        </button>

        {/* Informacja o stronie */}
        {pageNumber && (
          <span className="text-white text-sm opacity-70">
            Strona {pageNumber}
          </span>
        )}

        {/* Przycisk przełączania kamery */}
        <button
          onClick={toggleCamera}
          className="w-10 h-10 flex items-center justify-center"
        >
          <Image
            src="/course/ikony/rotate-camera.png"
            alt="Przełącz kamerę"
            width={28}
            height={28}
            className="invert"
            onError={(e) => {
              // Fallback jeśli ikona nie istnieje
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
          <span className="text-white text-xl">🔄</span>
        </button>
      </div>

      {/* Podgląd kamery */}
      <div 
        className="flex-1 relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="text-center">
              <p className="text-red-400 text-lg mb-4">{error}</p>
              
              {/* Przycisk do ponownej próby */}
              <button
                onClick={startCamera}
                className="px-6 py-3 bg-white/20 rounded-full text-white mb-4"
              >
                Spróbuj ponownie
              </button>
              
              {/* Fallback - użyj natywnego aparatu */}
              <div className="mt-4">
                <p className="text-white/60 text-sm mb-3">lub użyj natywnego aparatu:</p>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file && onCapture) {
                      const reader = new FileReader()
                      reader.onloadend = () => {
                        onCapture(reader.result as string)
                      }
                      reader.readAsDataURL(file)
                    }
                  }}
                  className="hidden"
                  id="camera-fallback-input"
                />
                <label
                  htmlFor="camera-fallback-input"
                  className="inline-block px-6 py-3 bg-blue-500 rounded-full text-white cursor-pointer hover:bg-blue-600 transition-colors"
                >
                  📷 Otwórz aparat
                </label>
              </div>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ 
                transform: facingMode === 'user' ? 'scaleX(-1)' : 'none'
              }}
            />
            
            {/* Grid overlay */}
            {renderGridOverlay()}
            
            {/* Poziomnica */}
            {renderLevel()}
          </>
        )}
      </div>

      {/* Dolny panel z kontrolkami */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6 pb-8">
        {/* Zoom slider (jeśli dostępny) - skala 1-3x */}
        {maxZoom > minZoom && (
          <div className="flex items-center justify-center gap-4 mb-6">
            <span className="text-white text-sm">1x</span>
            <input
              type="range"
              min={minZoom}
              max={maxZoom}
              step={0.1}
              value={zoom}
              onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
              className="w-48 h-1 bg-white/30 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #fff ${((zoom - minZoom) / (maxZoom - minZoom)) * 100}%, rgba(255,255,255,0.3) ${((zoom - minZoom) / (maxZoom - minZoom)) * 100}%)`
              }}
            />
            <span className="text-white text-sm">3x</span>
          </div>
        )}

        {/* Główne przyciski */}
        <div className="flex items-center justify-center gap-8">
          {/* Przycisk grid */}
          <button
            onClick={toggleGrid}
            className={`w-12 h-12 flex items-center justify-center rounded-full ${gridType !== 'none' ? 'bg-white/30' : 'bg-white/10'}`}
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
              <line x1="15" y1="3" x2="15" y2="21" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="3" y1="15" x2="21" y2="15" />
            </svg>
          </button>

          {/* Przycisk zdjęcia */}
          <button
            onClick={capturePhoto}
            disabled={!isActive}
            className="w-20 h-20 flex items-center justify-center rounded-full bg-white border-4 border-white/30 active:scale-95 transition-transform disabled:opacity-50"
          >
            <div className="w-16 h-16 rounded-full bg-white" />
          </button>

          {/* Przycisk poziomicy */}
          <button
            onClick={() => {
              // Żądanie uprawnień dla iOS
              if (typeof window !== 'undefined') {
                const DeviceOrientationEvent = (window as any).DeviceOrientationEvent
                if (DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
                  DeviceOrientationEvent.requestPermission()
                    .then((response: string) => {
                      if (response === 'granted') {
                        setIsLevelSupported(true)
                      }
                    })
                    .catch(console.error)
                }
              }
            }}
            className={`w-12 h-12 flex items-center justify-center rounded-full ${isLevelSupported ? 'bg-white/30' : 'bg-white/10'}`}
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>

        {/* Etykiety */}
        <div className="flex items-center justify-center gap-8 mt-2">
          <span className="text-white/60 text-xs w-12 text-center">
            {gridType === 'none' ? 'Siatka' : gridType === 'thirds' ? '3x3' : 'Fibonacci'}
          </span>
          <span className="text-white/60 text-xs w-20 text-center">Zdjęcie</span>
          <span className="text-white/60 text-xs w-12 text-center">Poziom</span>
        </div>
      </div>

      {/* Ukryty canvas do robienia zdjęć */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}

