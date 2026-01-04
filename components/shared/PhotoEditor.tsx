'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface PhotoEditorProps {
  onClose: () => void
  onSave?: (imageData: string) => void
}

type EditorTab = 'adjust' | 'crop'

export function PhotoEditor({ onClose, onSave }: PhotoEditorProps) {
  // Stan edytora
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeTab, setActiveTab] = useState<EditorTab>('adjust')
  
  // Parametry edycji
  const [brightness, setBrightness] = useState(100) // 0-200, 100 = normalne
  const [temperature, setTemperature] = useState(0) // -100 do 100, 0 = neutralne
  const [tint, setTint] = useState(0) // -100 do 100, 0 = neutralne
  
  // Kadrowanie
  const [cropActive, setCropActive] = useState(false)
  const [cropBox, setCropBox] = useState({ x: 10, y: 10, width: 80, height: 80 }) // w procentach
  const [isDragging, setIsDragging] = useState<string | null>(null) // 'move' | 'resize-*'
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [initialCropBox, setInitialCropBox] = useState({ x: 10, y: 10, width: 80, height: 80 })
  
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const displayCanvasRef = useRef<HTMLCanvasElement>(null)
  const originalImageRef = useRef<HTMLImageElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cropAreaRef = useRef<HTMLDivElement>(null)

  // Otwórz selektor plików
  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  // Obsługa wyboru pliku
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setSelectedImage(reader.result as string)
        // Reset parametrów
        setBrightness(100)
        setTemperature(0)
        setTint(0)
        setCropBox({ x: 10, y: 10, width: 80, height: 80 })
        setCropActive(false)
        setActiveTab('adjust')
      }
      reader.readAsDataURL(file)
    }
  }, [])

  // Zastosuj filtry do canvas
  const applyFilters = useCallback(() => {
    if (!canvasRef.current || !originalImageRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = originalImageRef.current

    // Ustaw rozmiar canvas
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight

    // Narysuj oryginalne zdjęcie
    ctx.drawImage(img, 0, 0)

    // Pobierz dane pikseli
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    // Zastosuj filtry pixel po pikselu
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i]
      let g = data[i + 1]
      let b = data[i + 2]

      // Jasność (brightness)
      const brightnessFactor = brightness / 100
      r = Math.min(255, r * brightnessFactor)
      g = Math.min(255, g * brightnessFactor)
      b = Math.min(255, b * brightnessFactor)

      // Temperatura (ciepłe/zimne kolory)
      if (temperature > 0) {
        // Cieplejsze - więcej czerwonego/żółtego
        r = Math.min(255, r + temperature * 0.5)
        b = Math.max(0, b - temperature * 0.3)
      } else if (temperature < 0) {
        // Zimniejsze - więcej niebieskiego
        r = Math.max(0, r + temperature * 0.3)
        b = Math.min(255, b - temperature * 0.5)
      }

      // Odcień (tint) - zielony/magenta
      if (tint > 0) {
        // Więcej magenty
        g = Math.max(0, g - tint * 0.3)
      } else if (tint < 0) {
        // Więcej zieleni
        g = Math.min(255, g - tint * 0.3)
      }

      data[i] = r
      data[i + 1] = g
      data[i + 2] = b
    }

    ctx.putImageData(imageData, 0, 0)
    
    // Zaktualizuj display canvas
    updateDisplayCanvas()
  }, [brightness, temperature, tint])

  // Aktualizuj podgląd (display canvas)
  const updateDisplayCanvas = useCallback(() => {
    if (!canvasRef.current || !displayCanvasRef.current) return
    
    const srcCanvas = canvasRef.current
    const displayCanvas = displayCanvasRef.current
    const displayCtx = displayCanvas.getContext('2d')
    if (!displayCtx) return
    
    // Zachowaj proporcje oryginalnego obrazu
    const maxWidth = Math.min(window.innerWidth - 32, 400)
    const maxHeight = window.innerHeight - 400
    
    const ratio = Math.min(maxWidth / srcCanvas.width, maxHeight / srcCanvas.height)
    displayCanvas.width = srcCanvas.width * ratio
    displayCanvas.height = srcCanvas.height * ratio
    
    displayCtx.drawImage(srcCanvas, 0, 0, displayCanvas.width, displayCanvas.height)
  }, [])

  // Załaduj obraz gdy zostanie wybrany
  useEffect(() => {
    if (selectedImage) {
      const img = new Image()
      img.onload = () => {
        originalImageRef.current = img
        applyFilters()
      }
      img.src = selectedImage
    }
  }, [selectedImage])

  // Aktualizuj filtry gdy się zmienią
  useEffect(() => {
    if (originalImageRef.current) {
      applyFilters()
    }
  }, [applyFilters])

  // Zastosuj kadrowanie
  const applyCrop = useCallback(() => {
    if (!canvasRef.current || !originalImageRef.current) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const img = originalImageRef.current
    
    // Oblicz współrzędne kadrowania w pikselach
    const srcX = (cropBox.x / 100) * img.naturalWidth
    const srcY = (cropBox.y / 100) * img.naturalHeight
    const srcWidth = (cropBox.width / 100) * img.naturalWidth
    const srcHeight = (cropBox.height / 100) * img.naturalHeight
    
    // Stwórz nowy obraz z obszaru kadrowania
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = srcWidth
    tempCanvas.height = srcHeight
    const tempCtx = tempCanvas.getContext('2d')
    if (!tempCtx) return
    
    // Narysuj wycięty fragment
    tempCtx.drawImage(img, srcX, srcY, srcWidth, srcHeight, 0, 0, srcWidth, srcHeight)
    
    // Utwórz nowy obraz z wyciętego fragmentu
    const croppedImage = new Image()
    croppedImage.onload = () => {
      originalImageRef.current = croppedImage
      setCropBox({ x: 10, y: 10, width: 80, height: 80 })
      setCropActive(false)
      setActiveTab('adjust')
      applyFilters()
    }
    croppedImage.src = tempCanvas.toDataURL('image/jpeg', 0.95)
  }, [cropBox, applyFilters])

  // Zapisz zdjęcie
  const savePhoto = useCallback(async () => {
    if (!canvasRef.current) return
    
    setIsProcessing(true)
    
    try {
      const imageData = canvasRef.current.toDataURL('image/jpeg', 0.9)
      
      // Nazwa pliku
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      const fileName = `TheOne-edited-${timestamp}.jpg`

      // Konwertuj na blob i pobierz
      const base64Response = await fetch(imageData)
      const blob = await base64Response.blob()

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      
      setTimeout(() => {
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }, 100)

      // Callback
      onSave?.(imageData)
      
    } catch (err) {
      console.error('Błąd zapisywania:', err)
    } finally {
      setIsProcessing(false)
    }
  }, [onSave])

  // Reset do oryginału
  const resetFilters = useCallback(() => {
    setBrightness(100)
    setTemperature(0)
    setTint(0)
  }, [])

  // Obsługa przeciągania obszaru kadrowania
  const handleCropTouchStart = (e: React.TouchEvent, action: string) => {
    e.stopPropagation()
    const touch = e.touches[0]
    setIsDragging(action)
    setDragStart({ x: touch.clientX, y: touch.clientY })
    setInitialCropBox({ ...cropBox })
  }

  const handleCropTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !cropAreaRef.current) return
    
    const touch = e.touches[0]
    const rect = cropAreaRef.current.getBoundingClientRect()
    
    const deltaX = ((touch.clientX - dragStart.x) / rect.width) * 100
    const deltaY = ((touch.clientY - dragStart.y) / rect.height) * 100
    
    if (isDragging === 'move') {
      setCropBox({
        ...initialCropBox,
        x: Math.max(0, Math.min(100 - initialCropBox.width, initialCropBox.x + deltaX)),
        y: Math.max(0, Math.min(100 - initialCropBox.height, initialCropBox.y + deltaY))
      })
    } else if (isDragging === 'resize-br') {
      setCropBox({
        ...initialCropBox,
        width: Math.max(20, Math.min(100 - initialCropBox.x, initialCropBox.width + deltaX)),
        height: Math.max(20, Math.min(100 - initialCropBox.y, initialCropBox.height + deltaY))
      })
    } else if (isDragging === 'resize-tl') {
      const newX = Math.max(0, Math.min(initialCropBox.x + initialCropBox.width - 20, initialCropBox.x + deltaX))
      const newY = Math.max(0, Math.min(initialCropBox.y + initialCropBox.height - 20, initialCropBox.y + deltaY))
      setCropBox({
        x: newX,
        y: newY,
        width: initialCropBox.width + (initialCropBox.x - newX),
        height: initialCropBox.height + (initialCropBox.y - newY)
      })
    }
  }, [isDragging, dragStart, initialCropBox])

  const handleCropTouchEnd = () => {
    setIsDragging(null)
  }

  // Renderowanie zakładki kadrowania
  const renderCropUI = () => {
    if (!selectedImage) return null
    
    return (
      <div className="space-y-4">
        <p className="text-white/70 text-sm text-center">
          Przeciągnij rogi lub środek, aby wybrać obszar
        </p>
        
        {/* Obszar kadrowania */}
        <div 
          ref={cropAreaRef}
          className="relative mx-auto overflow-hidden rounded-lg"
          style={{ 
            maxWidth: '100%',
            aspectRatio: displayCanvasRef.current 
              ? `${displayCanvasRef.current.width}/${displayCanvasRef.current.height}` 
              : '4/5'
          }}
          onTouchMove={handleCropTouchMove}
          onTouchEnd={handleCropTouchEnd}
        >
          {/* Obraz w tle */}
          <canvas
            ref={displayCanvasRef}
            className="w-full h-full object-contain"
          />
          
          {/* Ciemna warstwa poza obszarem kadrowania */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Górna ciemna część */}
            <div 
              className="absolute left-0 right-0 top-0 bg-black/60"
              style={{ height: `${cropBox.y}%` }}
            />
            {/* Dolna ciemna część */}
            <div 
              className="absolute left-0 right-0 bottom-0 bg-black/60"
              style={{ height: `${100 - cropBox.y - cropBox.height}%` }}
            />
            {/* Lewa ciemna część */}
            <div 
              className="absolute left-0 bg-black/60"
              style={{ 
                top: `${cropBox.y}%`, 
                height: `${cropBox.height}%`,
                width: `${cropBox.x}%`
              }}
            />
            {/* Prawa ciemna część */}
            <div 
              className="absolute right-0 bg-black/60"
              style={{ 
                top: `${cropBox.y}%`, 
                height: `${cropBox.height}%`,
                width: `${100 - cropBox.x - cropBox.width}%`
              }}
            />
          </div>
          
          {/* Ramka obszaru kadrowania */}
          <div 
            className="absolute border-2 border-white"
            style={{
              left: `${cropBox.x}%`,
              top: `${cropBox.y}%`,
              width: `${cropBox.width}%`,
              height: `${cropBox.height}%`
            }}
            onTouchStart={(e) => handleCropTouchStart(e, 'move')}
          >
            {/* Siatka 3x3 */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="border border-white/30" />
              ))}
            </div>
            
            {/* Uchwyt górny-lewy */}
            <div 
              className="absolute -top-2 -left-2 w-5 h-5 bg-white rounded-full shadow-lg"
              onTouchStart={(e) => handleCropTouchStart(e, 'resize-tl')}
            />
            
            {/* Uchwyt dolny-prawy */}
            <div 
              className="absolute -bottom-2 -right-2 w-5 h-5 bg-white rounded-full shadow-lg"
              onTouchStart={(e) => handleCropTouchStart(e, 'resize-br')}
            />
          </div>
        </div>
        
        {/* Przyciski kadrowania */}
        <div className="flex gap-4">
          <button
            onClick={() => {
              setCropBox({ x: 10, y: 10, width: 80, height: 80 })
              setActiveTab('adjust')
            }}
            className="flex-1 py-3 bg-white/10 rounded-xl text-white font-medium active:scale-95 transition-transform"
          >
            Anuluj
          </button>
          <button
            onClick={applyCrop}
            className="flex-1 py-3 bg-green-600 rounded-xl text-white font-medium active:scale-95 transition-transform"
          >
            ✂️ Przytnij
          </button>
        </div>
      </div>
    )
  }

  // Renderowanie zakładki dostosowań
  const renderAdjustUI = () => {
    if (!selectedImage) return null
    
    return (
      <div className="space-y-4">
        {/* Jasność */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-white/70">☀️ Jasność</span>
            <span className="text-yellow-400 font-mono">{brightness}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={200}
            value={brightness}
            onChange={(e) => setBrightness(parseInt(e.target.value))}
            className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer"
          />
        </div>

        {/* Temperatura */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-white/70">🌡️ Temperatura</span>
            <span className="text-yellow-400 font-mono">{temperature > 0 ? '+' : ''}{temperature}</span>
          </div>
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-white to-orange-500 opacity-30" />
            <input
              type="range"
              min={-100}
              max={100}
              value={temperature}
              onChange={(e) => setTemperature(parseInt(e.target.value))}
              className="relative w-full h-2 bg-transparent rounded-full appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Odcień */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-white/70">🎨 Odcień</span>
            <span className="text-yellow-400 font-mono">{tint > 0 ? '+' : ''}{tint}</span>
          </div>
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-500 via-white to-pink-500 opacity-30" />
            <input
              type="range"
              min={-100}
              max={100}
              value={tint}
              onChange={(e) => setTint(parseInt(e.target.value))}
              className="relative w-full h-2 bg-transparent rounded-full appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Przyciski akcji */}
        <div className="flex gap-4 pt-2">
          <button
            onClick={openFilePicker}
            className="flex-1 py-3 bg-white/10 rounded-xl text-white font-medium active:scale-95 transition-transform"
          >
            Inne zdjęcie
          </button>
          <button
            onClick={savePhoto}
            disabled={isProcessing}
            className="flex-1 py-3 bg-green-600 rounded-xl text-white font-medium active:scale-95 transition-transform disabled:opacity-50"
          >
            {isProcessing ? 'Zapisuję...' : '💾 Zapisz'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col">
      {/* Nagłówek */}
      <div className="flex items-center justify-between p-4 bg-black/80">
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center text-white text-2xl"
        >
          ✕
        </button>
        <span className="text-white font-medium">Edycja zdjęcia</span>
        <button
          onClick={resetFilters}
          className="text-white/70 text-sm px-3 py-1"
        >
          Reset
        </button>
      </div>

      {/* Obszar podglądu */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        {selectedImage ? (
          activeTab === 'crop' ? (
            // W trybie kadrowania renderujemy cropUI
            null
          ) : (
            <canvas
              ref={displayCanvasRef}
              className="max-w-full max-h-full object-contain rounded-lg"
              style={{ maxHeight: 'calc(100vh - 400px)' }}
            />
          )
        ) : (
          <div className="text-center">
            <button
              onClick={openFilePicker}
              className="w-32 h-32 rounded-2xl bg-white/10 flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform"
            >
              <svg viewBox="0 0 24 24" className="w-12 h-12 text-white/60" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              <span className="text-white/60 text-sm">Wybierz zdjęcie</span>
            </button>
          </div>
        )}
      </div>

      {/* Panel kontrolek */}
      {selectedImage && (
        <div className="bg-black/90 p-4 pb-8">
          {/* Zakładki */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('adjust')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'adjust' 
                  ? 'bg-white/20 text-white' 
                  : 'bg-white/5 text-white/60'
              }`}
            >
              ☀️ Dostosuj
            </button>
            <button
              onClick={() => setActiveTab('crop')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'crop' 
                  ? 'bg-white/20 text-white' 
                  : 'bg-white/5 text-white/60'
              }`}
            >
              ✂️ Kadruj
            </button>
          </div>
          
          {/* Zawartość zakładki */}
          {activeTab === 'adjust' ? renderAdjustUI() : renderCropUI()}
        </div>
      )}

      {/* Ukryty canvas do przetwarzania */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Ukryty input do wyboru plików */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}
