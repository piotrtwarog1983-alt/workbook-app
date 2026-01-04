'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { PhotoEditor } from './PhotoEditor'

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
  
  // Grid overlay - siatka 3x3 zawsze widoczna
  // Odczytaj zapisane ustawienie Fokus z localStorage
  const [sepiaEnabled, setSepiaEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cameraFocusEnabled')
      return saved === 'true'
    }
    return false
  })
  
  // Poziomnica
  const [tiltX, setTiltX] = useState(0) // lewo-prawo
  const [tiltY, setTiltY] = useState(0) // przód-tył
  const [isLevelSupported, setIsLevelSupported] = useState(false)
  
  // Wizualne potwierdzenie zdjęcia
  const [photoFlash, setPhotoFlash] = useState(false)
  const [photoCount, setPhotoCount] = useState(0)
  
  // Edytor zdjęć
  const [showEditor, setShowEditor] = useState(false)
  
  // Bokeh na żywo (rozmycie górnej części kadru)
  const [bokehEnabled, setBokehEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cameraBokehEnabled')
      return saved === 'true'
    }
    return false
  })
  const [bokehIntensity, setBokehIntensity] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cameraBokehIntensity')
      return saved ? parseInt(saved) : 8
    }
    return 8
  })
  
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
          // Autofokus ciągły - domyślnie fokusuje w centrum kadru
          focusMode: 'continuous',
        } as MediaTrackConstraints,
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
          
          // Wymuś ustawienie zoom na minimum (1:1) przy starcie
          try {
            const constraints = { advanced: [{ zoom: deviceMinZoom }] } as any
            await track.applyConstraints(constraints)
          } catch (zoomErr) {
            console.warn('Nie udało się ustawić zoom:', zoomErr)
          }
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

  // Funkcja box blur dla pojedynczego obszaru
  const boxBlurRegion = useCallback((
    pixels: Uint8ClampedArray, 
    width: number, 
    height: number,
    startY: number,
    endY: number,
    radius: number
  ): Uint8ClampedArray => {
    const result = new Uint8ClampedArray(pixels.length)
    // Kopiuj wszystkie piksele
    result.set(pixels)
    
    // Blur tylko dla określonego regionu
    for (let y = startY; y < endY; y++) {
      // Oblicz siłę blur - płynne przejście przy końcu regionu
      const transitionStart = endY - (endY - startY) * 0.3 // Ostatnie 30% to przejście
      let blurStrength = 1
      if (y > transitionStart) {
        blurStrength = 1 - ((y - transitionStart) / (endY - transitionStart))
      }
      const effectiveRadius = Math.round(radius * blurStrength)
      if (effectiveRadius < 1) continue
      
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, count = 0
        
        for (let ky = -effectiveRadius; ky <= effectiveRadius; ky++) {
          for (let kx = -effectiveRadius; kx <= effectiveRadius; kx++) {
            const nx = Math.min(width - 1, Math.max(0, x + kx))
            const ny = Math.min(height - 1, Math.max(0, y + ky))
            const i = (ny * width + nx) * 4
            r += pixels[i]
            g += pixels[i + 1]
            b += pixels[i + 2]
            count++
          }
        }
        
        const i = (y * width + x) * 4
        result[i] = r / count
        result[i + 1] = g / count
        result[i + 2] = b / count
      }
    }
    
    return result
  }, [])

  // Robienie zdjęcia i zapisywanie na telefonie
  const capturePhoto = useCallback(async () => {
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

    // Jeśli bokeh jest włączone - nałóż blur na górną 1/3 zdjęcia
    if (bokehEnabled && bokehIntensity > 0) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const blurredPixels = boxBlurRegion(
        imageData.data,
        canvas.width,
        canvas.height,
        0, // startY - od góry
        Math.floor(canvas.height / 3), // endY - do 1/3 wysokości
        bokehIntensity // radius blur
      )
      const blurredImageData = new ImageData(blurredPixels, canvas.width, canvas.height)
      ctx.putImageData(blurredImageData, 0, 0)
    }

    // Pobierz dane obrazu jako base64
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9)
    
    // Nazwa pliku z datą i numerem strony
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const fileName = pageNumber 
      ? `TheOne-strona${pageNumber}-${timestamp}.jpg`
      : `TheOne-${timestamp}.jpg`

    // Konwertuj base64 na blob
    const base64Response = await fetch(imageDataUrl)
    const blob = await base64Response.blob()

    // Pobierz plik bezpośrednio do folderu Downloads
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    
    // Poczekaj chwilę przed usunięciem linku (dla pewności pobrania)
    setTimeout(() => {
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }, 100)

    // Krótka wizualna informacja o zapisaniu (flash ekranu)
    setPhotoFlash(true)
    setTimeout(() => setPhotoFlash(false), 200)
    
    // Zwiększ licznik zdjęć
    setPhotoCount(prev => prev + 1)
  }, [pageNumber, bokehEnabled, bokehIntensity, boxBlurRegion])

  // Przełączanie efektu sepii (zapisuje do localStorage)
  const toggleSepia = useCallback(() => {
    setSepiaEnabled(prev => {
      const newValue = !prev
      localStorage.setItem('cameraFocusEnabled', String(newValue))
      return newValue
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

  // Renderowanie grid overlay - siatka 3x3 zawsze widoczna
  // Środkowy prostokąt = sygnalizator pozycji (czerwona sepia gdy nieprawidłowa)
  const renderGridOverlay = () => {
    // Sprawdzenie prawidłowości pozycji
    // pitchAngle: 0° = pionowo, 90° = poziomo, >90° = przechylony za bardzo
    const rawPitchAngle = Math.abs(Math.round(tiltY))
    const pitchAngle = Math.min(90, rawPitchAngle) // Dla wyświetlania (max 90)
    
    // Prawidłowe kąty: 0-40° (lekko pochylony) lub 87-93° (flat lay)
    // Nieprawidłowe: 40-87° oraz >93°
    const isPitchOk = (rawPitchAngle >= 0 && rawPitchAngle <= 40) || (rawPitchAngle >= 87 && rawPitchAngle <= 93)
    const isLevelOk = Math.abs(tiltX) <= 5
    const isPositionOk = !isLevelSupported || (isPitchOk && isLevelOk)
    
    return (
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div 
          className="relative w-full h-full max-w-[80vw]"
          style={{ aspectRatio: '4/5', maxHeight: '70vh' }}
        >
          {/* Efekt bokeh - tylko górna 1/3 kadru z płynnym gradientem */}
          {bokehEnabled && (
            <div 
              className="absolute inset-0"
              style={{ 
                backdropFilter: `blur(${bokehIntensity}px)`,
                WebkitBackdropFilter: `blur(${bokehIntensity}px)`,
                // Liniowy gradient - pełny blur na górze, przechodzi płynnie do 0 przy 1/3 wysokości
                maskImage: `linear-gradient(to bottom, black 0%, black 20%, rgba(0,0,0,0.7) 25%, rgba(0,0,0,0.3) 30%, transparent 33.33%)`,
                WebkitMaskImage: `linear-gradient(to bottom, black 0%, black 20%, rgba(0,0,0,0.7) 25%, rgba(0,0,0,0.3) 30%, transparent 33.33%)`
              }} 
            />
          )}
          
          {/* Efekt sepii na zewnętrznych prostokątach (jeśli włączony) - bez górnego rzędu gdy bokeh aktywne */}
          {sepiaEnabled && (
            <>
              {/* Górny rząd - tylko gdy bokeh wyłączone (bokeh ma własne warstwy) */}
              {!bokehEnabled && (
                <>
                  <div className="absolute top-0 left-0 w-1/3 h-1/3" style={{ backdropFilter: 'sepia(0.8) brightness(0.9)' }} />
                  <div className="absolute top-0 left-1/3 w-1/3 h-1/3" style={{ backdropFilter: 'sepia(0.8) brightness(0.9)' }} />
                  <div className="absolute top-0 left-2/3 w-1/3 h-1/3" style={{ backdropFilter: 'sepia(0.8) brightness(0.9)' }} />
                </>
              )}
              {/* Środkowy rząd - tylko boki */}
              <div className="absolute top-1/3 left-0 w-1/3 h-1/3" style={{ backdropFilter: 'sepia(0.8) brightness(0.9)' }} />
              <div className="absolute top-1/3 left-2/3 w-1/3 h-1/3" style={{ backdropFilter: 'sepia(0.8) brightness(0.9)' }} />
              {/* Dolny rząd */}
              <div className="absolute top-2/3 left-0 w-1/3 h-1/3" style={{ backdropFilter: 'sepia(0.8) brightness(0.9)' }} />
              <div className="absolute top-2/3 left-1/3 w-1/3 h-1/3" style={{ backdropFilter: 'sepia(0.8) brightness(0.9)' }} />
              <div className="absolute top-2/3 left-2/3 w-1/3 h-1/3" style={{ backdropFilter: 'sepia(0.8) brightness(0.9)' }} />
            </>
          )}
          
          {/* ŚRODKOWY PROSTOKĄT = SYGNALIZATOR POZYCJI */}
          {/* Czerwona sepia gdy pozycja nieprawidłowa */}
          {!isPositionOk && isLevelSupported && (
            <div 
              className="absolute top-1/3 left-1/3 w-1/3 h-1/3 transition-opacity duration-300" 
              style={{ backdropFilter: 'sepia(1) saturate(3) hue-rotate(-50deg) brightness(0.9)' }} 
            />
          )}

          {/* Linie siatki 3x3 - zawsze widoczne */}
          <div className={`absolute top-0 bottom-0 left-1/3 w-px transition-colors ${isPositionOk ? 'bg-white/40' : 'bg-red-500/60'}`} />
          <div className={`absolute top-0 bottom-0 left-2/3 w-px transition-colors ${isPositionOk ? 'bg-white/40' : 'bg-red-500/60'}`} />
          <div className={`absolute left-0 right-0 top-1/3 h-px transition-colors ${isPositionOk ? 'bg-white/40' : 'bg-red-500/60'}`} />
          <div className={`absolute left-0 right-0 top-2/3 h-px transition-colors ${isPositionOk ? 'bg-white/40' : 'bg-red-500/60'}`} />
          {/* Ramka zewnętrzna */}
          <div className={`absolute inset-0 border transition-colors ${isPositionOk ? 'border-white/30' : 'border-red-500/60'}`} />
        </div>
      </div>
    )
  }

  // Renderowanie kąta przechyłu (tylko na górze ekranu) - uproszczony wskaźnik
  const renderLevel = () => {
    if (!showLevel || !isLevelSupported) return null

    // Kąt przechyłu (pitch)
    const pitchAngle = Math.min(90, Math.max(0, Math.abs(Math.round(tiltY))))

    return (
      <>
        {/* Kąt przechyłu - minimalistyczny wskaźnik */}
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2">
          <div className="px-4 py-2 bg-black/60 rounded-xl backdrop-blur-sm border border-white/20 flex items-center gap-2">
            <span className="text-white/60 text-sm">Kąt:</span>
            <span className="text-white text-lg font-bold min-w-[3ch] text-center">
              {pitchAngle}°
            </span>
          </div>
        </div>
      </>
    )
  }
  
  // Renderowanie poziomicy (w dolnym panelu)
  const renderLevelIndicator = () => {
    if (!isLevelSupported) return null
    
    // Odchylenie poziomicy: -5 do 5° = OK, poza tym = ŹLE
    const isLevelOk = Math.abs(tiltX) <= 5
    
    return (
      <div className="flex justify-center mb-4">
        <div className="relative w-40 h-8 bg-black/40 rounded-full overflow-hidden border border-white/20">
          {/* Środkowe znaczniki (cel) */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-0.5 h-5 bg-white/40" />
          <div className="absolute top-1/2 left-1/4 transform -translate-y-1/2 w-0.5 h-2 bg-white/30" />
          <div className="absolute top-1/2 left-3/4 transform -translate-y-1/2 w-0.5 h-2 bg-white/30" />
          
          {/* Bańka poziomu (oczko) - zmienia kolor na czerwony gdy odchylenie > 5° */}
          <div 
            className={`absolute top-1/2 transform -translate-y-1/2 w-4 h-4 rounded-full transition-all duration-100 shadow-lg ${
              isLevelOk 
                ? 'bg-green-500 shadow-green-500/50' 
                : 'bg-red-500 shadow-red-500/50'
            }`}
            style={{ 
              left: `calc(50% + ${Math.max(-60, Math.min(60, tiltX * 1.5))}px - 8px)` 
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col">
      {/* Flash przy robieniu zdjęcia */}
      {photoFlash && (
        <div className="absolute inset-0 z-50 bg-white pointer-events-none animate-pulse" />
      )}
      
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

        {/* Informacja o stronie lub licznik zdjęć */}
        <span className="text-white text-sm opacity-70">
          {pageNumber ? `Strona ${pageNumber}` : ''}
          {photoCount > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-green-500/30 rounded-full text-green-400">
              📷 {photoCount}
            </span>
          )}
        </span>

        {/* Pusty element dla wyrównania */}
        <div className="w-10 h-10" />
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
        {/* Zoom: wskaźnik cyfrowy bezpośrednio nad suwakiem */}
        {maxZoom > minZoom && (
          <div className="mb-2.5">
            {/* Aktualne przybliżenie - bezpośrednio NAD suwakiem */}
            <div className="flex justify-center">
              <span className="text-yellow-400 text-lg font-bold">{zoom.toFixed(1)}x</span>
            </div>
            {/* Suwak zoom */}
            <div className="flex items-center justify-center gap-4 -mt-0.5">
              <span className="text-white text-sm">1x</span>
              <div className="relative">
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
              </div>
              <span className="text-white text-sm">3x</span>
            </div>
          </div>
        )}
        
        {/* Suwak Bokeh (gdy włączony) */}
        {bokehEnabled && (
          <div className="mb-2">
            <div className="flex items-center justify-center gap-3">
              <span className="text-white/60 text-xs">Bokeh:</span>
              <input
                type="range"
                min={2}
                max={20}
                value={bokehIntensity}
                onChange={(e) => {
                  const value = parseInt(e.target.value)
                  setBokehIntensity(value)
                  localStorage.setItem('cameraBokehIntensity', String(value))
                }}
                className="w-32 h-1 bg-white/30 rounded-full appearance-none cursor-pointer"
              />
              <span className="text-purple-400 text-sm font-bold w-8">{bokehIntensity}px</span>
            </div>
          </div>
        )}
        
        {/* Poziomnica - między zoomem a przyciskami */}
        {renderLevelIndicator()}

        {/* Główne przyciski */}
        <div className="flex items-center justify-center gap-6">
          {/* Przycisk sepii - podświetla środek siatki */}
          <button
            onClick={toggleSepia}
            className={`w-11 h-11 flex items-center justify-center rounded-full ${sepiaEnabled ? 'bg-amber-600/60' : 'bg-white/10'}`}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" fill={sepiaEnabled ? "currentColor" : "none"} />
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
            </svg>
          </button>

          {/* Przycisk bokeh - rozmycie tła */}
          <button
            onClick={() => {
              const newValue = !bokehEnabled
              setBokehEnabled(newValue)
              localStorage.setItem('cameraBokehEnabled', String(newValue))
            }}
            className={`w-11 h-11 flex items-center justify-center rounded-full ${bokehEnabled ? 'bg-purple-600/60' : 'bg-white/10'}`}
          >
            <span className="text-lg">🔮</span>
          </button>

          {/* Przycisk zdjęcia */}
          <button
            onClick={capturePhoto}
            disabled={!isActive}
            className="w-20 h-20 flex items-center justify-center rounded-full bg-white border-4 border-white/30 active:scale-95 transition-transform disabled:opacity-50"
          >
            <div className="w-16 h-16 rounded-full bg-white" />
          </button>

          {/* Przycisk edycji zdjęć */}
          <button
            onClick={() => setShowEditor(true)}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-white/10"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="6" x2="20" y2="6" />
              <circle cx="8" cy="6" r="2" fill="currentColor" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <circle cx="14" cy="12" r="2" fill="currentColor" />
              <line x1="4" y1="18" x2="20" y2="18" />
              <circle cx="10" cy="18" r="2" fill="currentColor" />
            </svg>
          </button>
        </div>

        {/* Etykiety */}
        <div className="flex items-center justify-center gap-6 mt-2">
          <span className={`text-xs w-11 text-center ${sepiaEnabled ? 'text-amber-400' : 'text-white/60'}`}>
            Fokus
          </span>
          <span className={`text-xs w-11 text-center ${bokehEnabled ? 'text-purple-400' : 'text-white/60'}`}>
            Bokeh
          </span>
          <span className="text-white/60 text-xs w-20 text-center">Zdjęcie</span>
          <span className="text-white/60 text-xs w-11 text-center">Edycja</span>
        </div>
      </div>

      {/* Ukryty canvas do robienia zdjęć */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Edytor zdjęć */}
      {showEditor && (
        <PhotoEditor 
          onClose={() => setShowEditor(false)}
        />
      )}
    </div>
  )
}

