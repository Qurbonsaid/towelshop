import { ROLES } from '../constants/roles'

const TWELVE_HOURS_IN_MS = 12 * 60 * 60 * 1000

export function canEditSale({ role, ownerUid, currentUid, createdAt }) {
  if (role === ROLES.ADMIN) {
    return true
  }

  if (role !== ROLES.STAFF || ownerUid !== currentUid || !createdAt) {
    return false
  }

  return Date.now() - createdAt.toMillis() <= TWELVE_HOURS_IN_MS
}
