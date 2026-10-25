import axios from 'axios'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const api = axios.create({
  baseURL: `${SUPABASE_URL}/rest/v1`,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use((config) => {
  config.headers.apikey = ANON_KEY

  try {
    const rawSession = localStorage.getItem('album_session')
    if (rawSession) {
      const session = JSON.parse(rawSession)
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`
        return config
      }
    }
  } catch (e) {
    // Si falla la lectura, se continúa con la llave anónima
  }

  config.headers.Authorization = `Bearer ${ANON_KEY}`
  return config
})

export default api