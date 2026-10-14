export enum Role {
  Admin = 'admin',
  WorkshopStaff = 'workshop_staff',
  Customer = 'customer',
}

// DB mein role "Admin", "Workshop Staff", "user" jaise alag likha ho sakta hai.
// Isse hum sab ko ek hi form mein le aate hain taake comparison hamesha sahi chale.
export function normalizeRole(raw?: string): Role {
  const value = (raw ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (value === Role.Admin) return Role.Admin;
  if (value === Role.WorkshopStaff || value === 'staff') {
    return Role.WorkshopStaff;
  }
  // 'customer', 'user' ya koi bhi aur value = normal customer
  return Role.Customer;
}
