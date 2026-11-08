# Album de Figuritas - Mundial (PWA Vue 3 + Supabase + Docker)

Despliegue Público (Producción): [https://album-figuritas-mpvw.onrender.com](https://album-figuritas-mpvw.onrender.com)

---

## Credenciales de Prueba para Evaluación

Para facilitar la corrección y prueba de la plataforma sin necesidad de registrar nuevas cuentas, se disponen los siguientes usuarios de prueba preconfigurados en la base de datos de Supabase:

### 1. Usuario Administrador (Acceso al Panel CRUD y ABM)
* **Email:** `admin@test.com`
* **Contraseña:** `123456`
* **Rol:** Administrador (`admin`)
* **Acceso:** Gestión completa de usuarios, administración del catálogo maestro de figuritas, creación y edición de cartas, subida de imágenes y asignación de roles.

### 2. Usuario Estándar / Coleccionista (Acceso a Álbum y Dashboard)
* **Email:** `usuario@test.com`
* **Contraseña:** `123456`
* **Rol:** Usuario Default (`user`)
* **Acceso:** Dashboard con métricas de progreso en tiempo real, vista del álbum personal, reclamo de sobre diario (con temporizador de cooldown) y marcado de figuritas obtenidas o repetidas.

---

## Stack Tecnológico
* **Frontend:** Vue 3 (Composition API script setup), Vue Router, Pinia (Estado Global).
* **Backend y Base de Datos:** Supabase (PostgreSQL, Auth, RLS).
* **Infraestructura y Contenedores:** Docker (Multi-stage build), NGINX Alpine, Vite PWA (vite-plugin-pwa).
* **Hosting:** Render Web Services (HTTPS Automático).

---

## Características Principales del Proyecto
* **PWA Instalable:** Aplicación Web Progresiva con Service Worker automático y manifiesto web configurado.
* **Autenticación y Control de Accesos:** Rutas protegidas por roles (admin y user) mediante Vue Router guards e integración con Supabase Auth.
* **Métricas en Tiempo Real:** Dashboard interactivo con porcentaje de progreso, contador de figuritas obtenidas, faltantes y repetidas totales centralizado en Pinia.
* **Mecánica de Sobre Diario:** Botón con temporizador de recarga (cooldown) persistido en localStorage que otorga tiradas aleatorias de figuritas.
* **Diseño Adaptativo (Responsive):** Menú lateral tipo hamburguesa con overlay para dispositivos móviles.
* **Contenedorización Multi-Stage:** Servidor NGINX optimizado en Alpine Linux con manejo de SPA (try_files) listo para despliegues continuos.

---

## Guía de Instalación y Configuración Local

### 1. Clonar el repositorio
```bash
git clone https://github.com/TuUsuario/album-figuritas-vue.git
cd album-figuritas-vue
```

### 2. Instalar dependencias
```bash
npm install --legacy-peer-deps
```

### 3. Configurar Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto con las credenciales de tu proyecto en Supabase:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-publica-anon
```

### 4. Ejecutar en Entorno de Desarrollo
```bash
npm run dev
```

### 5. Compilar y Previsualizar la PWA Localmente
```bash
npm run build
npm run preview
```

---

## Configuración de Docker Local
Para levantar el proyecto localmente mediante el contenedor de NGINX:

```bash
docker build --build-arg VITE_SUPABASE_URL=https://tu-proyecto.supabase.co --build-arg VITE_SUPABASE_ANON_KEY=tu-clave-anon -t album-figuritas-app .
docker run -d -p 8080:80 --name album-pwa-container album-figuritas-app
```

Acceso desde el navegador: `http://localhost:8080`