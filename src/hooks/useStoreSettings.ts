import { useEffect, useState } from 'react'
import {
  loadStoreSettings,
  STORE_SETTINGS_UPDATED,
  type StoreSettings,
} from '../lib/storeSettings'

export function useStoreSettings() {
  const [settings, setSettings] = useState<StoreSettings>(() => loadStoreSettings())

  useEffect(() => {
    const syncSettings = () => setSettings(loadStoreSettings())

    window.addEventListener('storage', syncSettings)
    window.addEventListener(STORE_SETTINGS_UPDATED, syncSettings)

    return () => {
      window.removeEventListener('storage', syncSettings)
      window.removeEventListener(STORE_SETTINGS_UPDATED, syncSettings)
    }
  }, [])

  return settings
}
