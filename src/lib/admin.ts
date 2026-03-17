// src/lib/admin.ts
// Central admin auth check — swap this one function when moving to role-based auth later.

const ADMIN_EMAIL = 'kylejaymaxwell@gmail.com'

export function isAdminEmail(email: string | undefined | null): boolean {
  return email === ADMIN_EMAIL
}
