export type StoreSettings = {
  shopName: string
  ownerName: string
  dailyPieceTarget: number
  monthlyRevenueTarget: number
}

export const defaultStoreSettings: StoreSettings = {
  shopName: 'per.pung',
  ownerName: '',
  dailyPieceTarget: 30,
  monthlyRevenueTarget: 30000,
}

export const STORE_SETTINGS_UPDATED = 'perpung-store-settings-updated'

const storageKey = 'perpung-store-settings'

export function loadStoreSettings(): StoreSettings {
  if (typeof window === 'undefined') return defaultStoreSettings

  try {
    const rawSettings = window.localStorage.getItem(storageKey)
    if (!rawSettings) return defaultStoreSettings

    const parsedSettings = JSON.parse(rawSettings) as Partial<StoreSettings>

    return {
      shopName: parsedSettings.shopName?.trim() || defaultStoreSettings.shopName,
      ownerName: parsedSettings.ownerName?.trim() || defaultStoreSettings.ownerName,
      dailyPieceTarget: toPositiveNumber(parsedSettings.dailyPieceTarget, defaultStoreSettings.dailyPieceTarget),
      monthlyRevenueTarget: toPositiveNumber(
        parsedSettings.monthlyRevenueTarget,
        defaultStoreSettings.monthlyRevenueTarget,
      ),
    }
  } catch {
    return defaultStoreSettings
  }
}

export function saveStoreSettings(settings: StoreSettings) {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(storageKey, JSON.stringify(settings))
  window.dispatchEvent(new Event(STORE_SETTINGS_UPDATED))
}

function toPositiveNumber(value: unknown, fallback: number) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) && numberValue >= 0 ? numberValue : fallback
}
