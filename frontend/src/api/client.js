import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || '/api/v1'

export const api = axios.create({ baseURL: BASE })

export function setAdminKey(key) {
  if (key) {
    api.defaults.headers.common['x-admin-key'] = key
    localStorage.setItem('sm_admin_key', key)
  } else {
    delete api.defaults.headers.common['x-admin-key']
    localStorage.removeItem('sm_admin_key')
  }
}

export function loadAdminKey() {
  const key = localStorage.getItem('sm_admin_key')
  if (key) api.defaults.headers.common['x-admin-key'] = key
  return key
}

export function isAuthenticated() {
  return !!localStorage.getItem('sm_admin_key')
}
