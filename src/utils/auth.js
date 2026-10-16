export function normalizePhone(phone) {

  if (!phone) return ''
  return String(phone).replace(/\D/g, '')
}

export function isValidPhone(phone) {
  return /^\d{9}$/.test(normalizePhone(phone))
}

export function mapPhoneToEmail(phone) {
  return `${normalizePhone(phone)}@towelshop.local`
}

export function formatPhoneDisplay(phone) {
  const digits = normalizePhone(phone)
  if (!digits) return ''
  if (digits.length <= 2) return digits
  if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`
  if (digits.length <= 7) return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`
  return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`
}

export function resolveDefaultRoute() {
  return '/sartaroshxonalar'
}

