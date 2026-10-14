import { ROLES } from '../constants/roles'

export function normalizePhone(phone) {
  return phone.replace(/\D/g, '')
}

export function isValidPhone(phone) {
  return /^\d{9}$/.test(normalizePhone(phone))
}

export function mapPhoneToEmail(phone) {
  return `${normalizePhone(phone)}@towelshop.local`
}

export function resolveDefaultRoute(role) {
  if (role === ROLES.ADMIN) {
    return '/admin'
  }

  return '/staff'
}
