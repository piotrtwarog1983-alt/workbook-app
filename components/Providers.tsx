'use client'

import { LanguageProvider } from '@/lib/LanguageContext'
import { DeviceProvider } from '@/lib/DeviceContext'
import { useViewportHeight } from '@/hooks/useViewportHeight'
import { useAppUpdate } from '@/hooks/useAppUpdate'
import { UpdateNotification } from '@/components/shared/UpdateNotification'
import { ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  // Inicjalizuje dynamiczne zarządzanie wysokością viewportu
  useViewportHeight()
  
  // Sprawdza dostępność aktualizacji (tylko raz przy starcie, zero kosztów transferu)
  const { updateAvailable, handleUpdate, dismissUpdate } = useAppUpdate()
  
  return (
    <LanguageProvider>
      <DeviceProvider>
        {/* Powiadomienie o aktualizacji - pokazuje się tylko gdy dostępna nowa wersja */}
        {updateAvailable && (
          <UpdateNotification 
            onUpdate={handleUpdate}
            onDismiss={dismissUpdate}
          />
        )}
        {children}
      </DeviceProvider>
    </LanguageProvider>
  )
}










































