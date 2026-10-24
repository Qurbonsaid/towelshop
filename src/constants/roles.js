export const ROLES = {
  ADMIN: "admin",
  DELIVERY: "delivery",
  MANAGER: "manager",
  BARBER: "barber",
};

export const isDeliveryRole = (role) => role === ROLES.DELIVERY;
export const isManagerRole = (role) => role === ROLES.MANAGER;
export const isAdminRole = (role) => role === ROLES.ADMIN;
