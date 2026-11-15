import fs from 'node:fs'

// Ajustá numeroActual al siguiente número libre en tu tabla figuritas
let numeroActual = 13

const planteles = [
  // ARGENTINA
  { nombre: 'Emiliano Martínez', pais: 'Argentina', posicion: 'Arquero', especial: true },
  { nombre: 'Gerónimo Rulli', pais: 'Argentina', posicion: 'Arquero', especial: false },
  { nombre: 'Cristian Romero', pais: 'Argentina', posicion: 'Defensor', especial: false },
  { nombre: 'Nicolás Otamendi', pais: 'Argentina', posicion: 'Defensor', especial: false },
  { nombre: 'Lisandro Martínez', pais: 'Argentina', posicion: 'Defensor', especial: false },
  { nombre: 'Nahuel Molina', pais: 'Argentina', posicion: 'Defensor', especial: false },
  { nombre: 'Nicolás Tagliafico', pais: 'Argentina', posicion: 'Defensor', especial: false },
  { nombre: 'Rodrigo De Paul', pais: 'Argentina', posicion: 'Mediocampista', especial: false },
  { nombre: 'Enzo Fernández', pais: 'Argentina', posicion: 'Mediocampista', especial: false },
  { nombre: 'Alexis Mac Allister', pais: 'Argentina', posicion: 'Mediocampista', especial: false },
  { nombre: 'Leandro Paredes', pais: 'Argentina', posicion: 'Mediocampista', especial: false },
  { nombre: 'Giovani Lo Celso', pais: 'Argentina', posicion: 'Mediocampista', especial: false },
  { nombre: 'Lionel Messi', pais: 'Argentina', posicion: 'Delantero', especial: true },
  { nombre: 'Julián Álvarez', pais: 'Argentina', posicion: 'Delantero', especial: true },
  { nombre: 'Lautaro Martínez', pais: 'Argentina', posicion: 'Delantero', especial: false },
  { nombre: 'Ángel Di María', pais: 'Argentina', posicion: 'Delantero', especial: true },

  // BRASIL
  { nombre: 'Alisson Becker', pais: 'Brasil', posicion: 'Arquero', especial: false },
  { nombre: 'Ederson (footballer, born 1993)', nombreDisplay: 'Ederson', pais: 'Brasil', posicion: 'Arquero', especial: false },
  { nombre: 'Marquinhos', pais: 'Brasil', posicion: 'Defensor', especial: false },
  { nombre: 'Éder Militão', pais: 'Brasil', posicion: 'Defensor', especial: false },
  { nombre: 'Gabriel Magalhães', pais: 'Brasil', posicion: 'Defensor', especial: false },
  { nombre: 'Danilo (footballer, born July 1991)', nombreDisplay: 'Danilo', pais: 'Brasil', posicion: 'Defensor', especial: false },
  { nombre: 'Bruno Guimarães', pais: 'Brasil', posicion: 'Mediocampista', especial: false },
  { nombre: 'Lucas Paquetá', pais: 'Brasil', posicion: 'Mediocampista', especial: false },
  { nombre: 'Casemiro', pais: 'Brasil', posicion: 'Mediocampista', especial: false },
  { nombre: 'Douglas Luiz', pais: 'Brasil', posicion: 'Mediocampista', especial: false },
  { nombre: 'Vinícius Júnior', pais: 'Brasil', posicion: 'Delantero', especial: true },
  { nombre: 'Rodrygo', pais: 'Brasil', posicion: 'Delantero', especial: false },
  { nombre: 'Raphinha', pais: 'Brasil', posicion: 'Delantero', especial: false },
  { nombre: 'Neymar', pais: 'Brasil', posicion: 'Delantero', especial: true },
  { nombre: 'Endrick', pais: 'Brasil', posicion: 'Delantero', especial: false },

  // FRANCIA
  { nombre: 'Mike Maignan', pais: 'Francia', posicion: 'Arquero', especial: false },
  { nombre: 'Brice Samba', pais: 'Francia', posicion: 'Arquero', especial: false },
  { nombre: 'William Saliba', pais: 'Francia', posicion: 'Defensor', especial: false },
  { nombre: 'Ibrahima Konaté', pais: 'Francia', posicion: 'Defensor', especial: false },
  { nombre: 'Dayot Upamecano', pais: 'Francia', posicion: 'Defensor', especial: false },
  { nombre: 'Theo Hernandez', pais: 'Francia', posicion: 'Defensor', especial: false },
  { nombre: 'Jules Koundé', pais: 'Francia', posicion: 'Defensor', especial: false },
  { nombre: 'Aurélien Tchouaméni', pais: 'Francia', posicion: 'Mediocampista', especial: false },
  { nombre: 'Eduardo Camavinga', pais: 'Francia', posicion: 'Mediocampista', especial: false },
  { nombre: 'Antoine Griezmann', pais: 'Francia', posicion: 'Mediocampista', especial: true },
  { nombre: 'Adrien Rabiot', pais: 'Francia', posicion: 'Mediocampista', especial: false },
  { nombre: 'Kylian Mbappé', pais: 'Francia', posicion: 'Delantero', especial: true },
  { nombre: 'Ousmane Dembélé', pais: 'Francia', posicion: 'Delantero', especial: false },
  { nombre: 'Marcus Thuram', pais: 'Francia', posicion: 'Delantero', especial: false },
  { nombre: 'Randal Kolo Muani', pais: 'Francia', posicion: 'Delantero', especial: false }
]

const esperar = (ms) => new Promise((r) => setTimeout(r, ms))
const headers = {
  'User-Agent': 'AlbumFiguritasApp/1.0 (https://github.com/album-figuritas; contacto@ejemplo.com)'
}

async function obtenerFotosEnLote(nombres) {
  const mapaFotos = new Map()
  // Wikipedia permite hasta 50 títulos separados por '|' en una sola petición
  const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(nombres.join('|'))}&redirects=1&prop=pageimages&format=json&pithumbsize=500`
  const res = await fetch(url, { headers })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${await res.text()}`)
  }
  const data = await res.json()

  // Mapear redirecciones y normalizaciones para asociar cada nombre buscado con su página final
  const normalizados = new Map((data.query?.normalized || []).map(n => [n.from, n.to]))
  const redirecciones = new Map((data.query?.redirects || []).map(r => [r.from, r.to]))
  const paginasPorTitulo = new Map(
    Object.values(data.query?.pages || {}).map(p => [p.title, p.thumbnail?.source || ''])
  )

  for (const original of nombres) {
    let titulo = normalizados.get(original) || original
    titulo = redirecciones.get(titulo) || titulo
    mapaFotos.set(original, paginasPorTitulo.get(titulo) || '')
  }

  return mapaFotos
}

async function buscarIndividualConPausa(nombre) {
  await esperar(1200)
  const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(nombre + ' footballer')}&gsrlimit=1&prop=pageimages&format=json&pithumbsize=500`
  const res = await fetch(url, { headers })
  if (!res.ok) return ''
  const data = await res.json()
  const pages = Object.values(data.query?.pages || {})
  return pages[0]?.thumbnail?.source || ''
}

async function main() {
  console.log('Consultando fotos en Wikipedia en una única petición por lote...\n')
  const todosLosNombres = planteles.map(j => j.nombre)
  const mapaFotos = await obtenerFotosEnLote(todosLosNombres)

  const filas = []
  for (const j of planteles) {
    let foto = mapaFotos.get(j.nombre) || ''
    if (!foto) {
      foto = await buscarIndividualConPausa(j.nombre)
    }
    const nombreFinal = j.nombreDisplay || j.nombre
    console.log(`#${numeroActual} ${nombreFinal} (${j.pais}) -> ${foto ? 'OK' : 'SIN FOTO'}`)
    filas.push(`  (${numeroActual}, '${nombreFinal.replace(/'/g, "''")}', '${j.pais}', '${j.posicion}', ${j.especial}, '${foto}')`)
    numeroActual++
  }

  const sql = `INSERT INTO public.figuritas (numero, nombre_jugador, pais, posicion, es_especial, imagen_url)\nVALUES\n${filas.join(',\n')};\n`
  fs.writeFileSync('planteles.sql', sql, 'utf-8')
  console.log('\nListo. Archivo planteles.sql generado correctamente.')
}

main()