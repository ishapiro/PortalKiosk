const STORAGE_KEY = 'portal_kiosk_admin_authed'

export function useAdminAuth() {
  function isAuthenticated(): boolean {
    if (import.meta.server) return false
    return !!localStorage.getItem(STORAGE_KEY)
  }

  function setAuthenticated() {
    if (import.meta.server) return
    localStorage.setItem(STORAGE_KEY, '1')
  }

  function clearAuthenticated() {
    if (import.meta.server) return
    localStorage.removeItem(STORAGE_KEY)
  }

  return { isAuthenticated, setAuthenticated, clearAuthenticated }
}
