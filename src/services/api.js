import axios from 'axios'

const api = axios.create({
  baseURL: `${import.meta.env.VITE_SUPABASE_URL}/rest/v1`,
  headers: {
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  }
})

export default api