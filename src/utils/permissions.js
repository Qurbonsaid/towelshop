import { ROLES } from '../constants/roles'

export const TWELVE_HOURS_IN_MS = 12 * 60 * 60 * 1000

export function getTimestampMillis(timestamp) {
  if (!timestamp) return 0
  if (typeof timestamp.toMillis === 'function') {
    return timestamp.toMillis()
  }
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate().getTime()
  }
  if (timestamp instanceof Date) {
    return timestamp.getTime()
  }
  if (typeof timestamp === 'number') {
    return timestamp
  }
  if (typeof timestamp === 'string') {
    return new Date(timestamp).getTime()
  }
  return 0
}

export function getRemainingTimeMs(createdAt) {
  const createdMs = getTimestampMillis(createdAt)
  if (!createdMs) return 0
  const deadlineMs = createdMs + TWELVE_HOURS_IN_MS
  return Math.max(0, deadlineMs - Date.now())
}

export function formatRemainingTime(remainingMs) {
  if (remainingMs <= 0) {
    return "Muddati tugagan"
  }
  const totalMinutes = Math.floor(remainingMs / (60 * 1000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours > 0) {
    return `${hours} soat ${minutes} daqiqa qoldi`
  }
  return `${minutes} daqiqa qoldi`
}

export function canEditSale({ role, staffId, currentUid, createdAt }) {
  if (role === ROLES.ADMIN) {
    return true
  }

  if (role !== ROLES.STAFF || !currentUid || staffId !== currentUid || !createdAt) {
    return false
  }

  return getRemainingTimeMs(createdAt) > 0
}
