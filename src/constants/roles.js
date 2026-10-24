export const ROLES = {
  ADMIN: "admin",
  DELIVERY: "delivery",
  MANAGER: "manager",
  STAFF: "staff", // legacy fallback for backward compatibility
  BARBER: "barber",
};

export const isDeliveryRole = (role) =>
  role === ROLES.DELIVERY || role === ROLES.STAFF;
export const isManagerRole = (role) => role === ROLES.MANAGER;
export const isAdminRole = (role) => role === ROLES.ADMIN;
