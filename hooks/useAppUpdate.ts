'use client'

import { useState, useEffect } from 'react'

// Wersja wbudowana w kod - automatycznie zmienia się przy każdym buildzie
const APP_VERSION = process.env.NEXT_PUBLIC_BUILD_TIME || 'dev'

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

