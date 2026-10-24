import { ROLES } from '../constants/roles'

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

export function getRemainingTimeMs(_createdAt) {
  return 999999999
}

export function formatRemainingTime(_ms) {
  return ""
}

/**
 * Check if the user can edit a sale transaction.
 * Admin can edit any transaction.
 * Staff can edit transactions without arbitrary time limits.
 */
export function canEditSale({ role, staffId, currentUid }) {
  if (role === ROLES.ADMIN) {
    return true
  }

  if (role === ROLES.STAFF || role === ROLES.DELIVERY) {
    return !staffId || !currentUid || staffId === currentUid
  }

  return false
}

/**
 * Only admin can delete data (barbershop, barber, sale, user).
 */
export function canDelete(role) {
  return role === ROLES.ADMIN
}
