import api from './api'

const ENDPOINT = '/figuritas'

// Extrae el nombre del archivo al final de la URL publica
export function obtenerNombreArchivoDeUrl(url) {
  if (!url || typeof url !== 'string') return null
  const partes = url.split('/')
  return partes[partes.length - 1] || null
}

export const figuritasService = {
  async listar(filtros = {}) {
    const params = {
      select: '*',
      order: 'numero.asc'
    }

    if (filtros.pais) {
      params.pais = `eq.${filtros.pais}`
    }

    const texto = filtros.busqueda?.trim().replace(/[*%]/g, '')
    if (texto) {
      params.nombre_jugador = `ilike.*${texto}*`
    }

    const { data } = await api.get(ENDPOINT, { params })
    return data
  },

  async crear(datos) {
    const { data } = await api.post(ENDPOINT, datos, {
      headers: { Prefer: 'return=representation' }
    })
    return data[0]
  },

  async actualizar(id, datos) {
    const { data } = await api.patch(ENDPOINT, datos, {
      params: { id: `eq.${id}` },
      headers: { Prefer: 'return=representation' }
    })
    return data[0]
  },

  async eliminar(id) {
    const { data } = await api.delete(ENDPOINT, {
      params: { id: `eq.${id}` },
      headers: { Prefer: 'return=representation' }
    })
    return data
  },

  async subirImagen(archivo) {
    const extension = archivo.name.split('.').pop()
    const nombreArchivo = `${Date.now()}_${Math.random().toString(36).substring(2)}.${extension}`

    const urlSubida = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/figuritas/${nombreArchivo}`

    const response = await fetch(urlSubida, {
      method: 'POST',
      headers: {
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': archivo.type,
        'x-upsert': 'true'
      },
      body: archivo
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Error ${response.status} al subir la imagen`)
    }

    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/figuritas/${nombreArchivo}`
  },

  // Elimina un archivo fisico del bucket en Supabase Storage
  async borrarImagen(nombreArchivo) {
    if (!nombreArchivo) return

    const urlBorrado = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/figuritas`

    const response = await fetch(urlBorrado, {
      method: 'DELETE',
      headers: {
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prefixes: [nombreArchivo] })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Error al eliminar imagen de Storage:', errorData)
    }
  }
}