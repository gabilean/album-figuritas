# Álbum de Figuritas - Mundial (PWA Vue 3 + Supabase + Docker)

Despliegue Público (Producción): [https://album-figuritas-mpvw.onrender.com](https://album-figuritas-mpvw.onrender.com)

## Descripción del Proyecto

Esta aplicación web progresiva (PWA) es una plataforma interactiva de coleccionismo digital inspirada en el álbum de figuritas del Mundial de Fútbol. Permite a los usuarios gestionar su colección personal, abrir sobres diarios validados en servidor, intercambiar cartas repetidas 1x1 con otros coleccionistas en tiempo real, reciclar excedentes en una mesa de crafteo para fabricar figuritas faltantes y desbloquear curiosidades históricas mediante Inteligencia Artificial (**TrivIA**).

Además, cuenta con un módulo de administración (ABM) protegido por roles que permite gestionar el catálogo maestro de cartas, subir imágenes a la nube y administrar los perfiles de usuario.

---

## Credenciales de Prueba para Evaluación

Para facilitar la corrección y prueba de la plataforma sin necesidad de registrar nuevas cuentas, se disponen los siguientes usuarios de prueba preconfigurados en la base de datos de Supabase:

### 1. Usuario Administrador (Acceso al Panel CRUD y ABM)
- **Email:** `admin@test.com`
- **Contraseña:** `123456`
- **Rol:** Administrador (`admin`)
- **Acceso:** Gestión completa de usuarios, administración del catálogo maestro de figuritas, creación y edición de cartas, subida de imágenes a Supabase Storage y asignación de roles.

### 2. Usuario Estándar / Coleccionista (Acceso a Álbum y Dashboard)
- **Email:** `usuario@test.com`
- **Contraseña:** `123456`
- **Rol:** Usuario Default (`user`)
- **Acceso:** Dashboard con métricas y asesor táctico IA, vista del álbum personal con TrivIA por carta, reclamo de sobre diario, tablón de intercambios 1x1 y mesa de crafteo.

---

## Stack Tecnológico
- **Frontend:** Vue 3 (Composition API `<script setup>`), Vue Router, Pinia (Estado Global).
- **Backend y Base de Datos:** Supabase (PostgreSQL, Auth, Row Level Security, RPC transaccionales, Storage y Edge Functions).
- **Inteligencia Artificial:** Groq API (`qwen/qwen3.8-27b` / `openai/gpt-oss-120b`) integrada mediante Supabase Edge Functions con RAG / Context Stuffing.
- **Testing:** Vitest (Pruebas unitarias de estado reactivo, lógica de crafteo y capa de servicios).
- **Infraestructura y Contenedores:** Docker (Multi-stage build), NGINX Alpine, Vite PWA (`vite-plugin-pwa`).
- **Hosting:** Render Web Services (HTTPS Automático).

---

## Características Principales del Proyecto
- **PWA Instalable:** Aplicación Web Progresiva con Service Worker automático y manifiesto web configurado.
- **Autenticación y Control de Accesos:** Rutas protegidas por roles (`admin` y `user`) mediante Vue Router guards, validación de perfiles en PostgreSQL y políticas RLS en Supabase.
- **Dashboard Analítico + Asistente IA:** Métricas en tiempo real (porcentaje de progreso, obtenidas, faltantes y repetidas) junto a un analizador táctico con IA que sugiere jugadas reales cruzando inventario, puntos de crafteo y oportunidades del tablón.
- **Sobre Diario Blindado en Servidor:** Apertura de sobres aleatorios con cooldown validado directamente en la base de datos mediante funciones RPC (`reclamar_sobre_diario`) para evitar manipulaciones desde el cliente.
- **Tablón de Intercambios 1x1:** Publicación, aceptación y cancelación de canjes entre usuarios con validación de stock y autocancelación si el usuario obtiene la carta buscada por otro medio.
- **Mesa de Crafteo:** Economía interna basada en funciones RPC transaccionales (`reciclar_repetidas` y `canjear_crafteo`) para convertir cartas repetidas en puntos (Común +10 pts, Especial +40 pts) y canjearlos por sobres extra (60 pts) o figuritas faltantes puntuales (Común 100 pts, Especial 250 pts).
- **TrivIA por Carta:** Sistema de consultas enciclopédicas con IA en cada figurita del álbum, gestionado mediante créditos desbloqueables por copias excedentes obtenidas.
- **Contenedorización Multi-Stage:** Servidor NGINX optimizado en Alpine Linux con manejo de SPA (`try_files`) listo para despliegues continuos.

---

## Guía de Instalación y Configuración Local

### 1. Clonar el repositorio
```bash
git clone [https://github.com/TuUsuario/album-figuritas-vue.git](https://github.com/TuUsuario/album-figuritas-vue.git)
cd album-figuritas-vue
```

### 2. Instalar dependencias
```bash
npm install --legacy-peer-deps
```

### 3. Configurar Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto con las credenciales de tu proyecto en Supabase:
```env
VITE_SUPABASE_URL=[https://tu-proyecto.supabase.co](https://tu-proyecto.supabase.co)
VITE_SUPABASE_ANON_KEY=tu-clave-publica-anon
```

*(Nota: Para habilitar las funcionalidades de IA en la Edge Function `asistente-album`, se debe configurar el secreto `GROQ_API_KEY` en Supabase).*

### 4. Ejecutar en Entorno de Desarrollo
```bash
npm run dev
```

### 5. Ejecutar Pruebas Unitarias (Vitest)
```bash
npm test
```

### 6. Compilar y Previsualizar la PWA Localmente
```bash
npm run build
npm run preview
```

---

## Configuración de Docker Local
Para levantar el proyecto localmente mediante el contenedor de NGINX:

```bash
docker build --build-arg VITE_SUPABASE_URL=[https://tu-proyecto.supabase.co](https://tu-proyecto.supabase.co) --build-arg VITE_SUPABASE_ANON_KEY=tu-clave-anon -t album-figuritas-app .
docker run -d -p 8080:80 --name album-pwa-container album-figuritas-app
```

Acceso desde el navegador: `http://localhost:8080`