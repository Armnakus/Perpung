export const formatBaht = (value: number | null | undefined) =>
  new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0))

export const formatNumber = (value: number | null | undefined, digits = 0) =>
  new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number(value ?? 0))

export const formatDateThai = (date: string | Date) =>
  new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(typeof date === 'string' ? new Date(`${date}T00:00:00`) : date)

export const formatShortDate = (date: string | Date) =>
  new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'short',
  }).format(typeof date === 'string' ? new Date(`${date}T00:00:00`) : date)

export const formatMonthThai = (monthValue: string) => {
  const [year, month] = monthValue.split('-').map(Number)
  return new Intl.DateTimeFormat('th-TH', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1))
}

export const toInputDate = (date = new Date()) => {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 10)
}

export const toInputMonth = (date = new Date()) => toInputDate(date).slice(0, 7)

export const getMonthRange = (monthValue: string) => {
  const [year, month] = monthValue.split('-').map(Number)
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0)
  return {
    start: toInputDate(start),
    end: toInputDate(end),
  }
}

export const getLastDays = (days: number) =>
  Array.from({ length: days }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (days - 1 - index))
    return toInputDate(date)
  })
