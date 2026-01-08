'use client'

import { useState, useEffect } from 'react'

/**
 * WERSJA DLA KLIENTÓW - zmień tylko przy aktualizacjach widocznych dla użytkowników!
 * 
 * Kiedy zmieniać:
 * ✅ Zmiany w wyglądzie aplikacji
 * ✅ Nowe funkcje dla użytkowników
 * ✅ Poprawki błędów widocznych dla klientów
 * ✅ Zmiany w kursie, treściach
 * 
 * NIE zmieniaj przy:
 * ❌ Zmiany w panelu admina
 * ❌ Zmiany w API wewnętrznym
 * ❌ Zmiany w webhookach
 * ❌ Poprawki backendowe niewidoczne dla użytkowników
 * 
 * Format: YYYY.MM.DD lub 1.0.0
 */
const CLIENT_VERSION = '2026.01.07'

// Fallback do BUILD_TIME tylko jeśli CLIENT_VERSION nie jest ustawiona
const APP_VERSION = CLIENT_VERSION || process.env.NEXT_PUBLIC_BUILD_TIME || 'dev'

export function useAppUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false)

  useEffect(() => {
    // Sprawdź TYLKO RAZ przy starcie aplikacji
    // Zero dodatkowych zapytań HTTP - wszystko w localStorage
    const storedVersion = localStorage.getItem('app_version')
    
    if (storedVersion && storedVersion !== APP_VERSION) {
      // Nowa wersja dostępna - stary kod wykrył zmianę
      setUpdateAvailable(true)
    } else if (!storedVersion) {
      // Pierwsze uruchomienie - zapisz wersję
      localStorage.setItem('app_version', APP_VERSION)
    }
  }, [])

  const handleUpdate = () => {
    // Zaktualizuj wersję i odśwież stronę
    localStorage.setItem('app_version', APP_VERSION)
    window.location.reload()
  }

  const dismissUpdate = () => {
    // Ukryj powiadomienie bez odświeżania (użytkownik wybiera "Później")
    setUpdateAvailable(false)
  }

  return { updateAvailable, handleUpdate, dismissUpdate }
}

/**
 * Aktualna wersja dla klientów - do użycia w innych miejscach
 */
export const currentClientVersion = APP_VERSION


