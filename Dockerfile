# --------------------------------------------------------
# ETAPA 1: Compilación con Node.js
# --------------------------------------------------------
FROM node:20-alpine AS build-stage

WORKDIR /app

# Copiar manifiestos de dependencias
COPY package*.json ./

# Instalación de dependencias (respetando dependencias entre pares si fuera necesario)
RUN npm install --legacy-peer-deps

# Copiar el código fuente completo
COPY . .

# Variables de entorno en tiempo de build para Supabase (Reemplazar con tus credenciales)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Compilar la app para producción (genera la carpeta dist/)
RUN npm run build

# --------------------------------------------------------
# ETAPA 2: Servidor NGINX para Producción
# --------------------------------------------------------
FROM nginx:alpine AS production-stage

# Copiar la configuración personalizada de NGINX
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar la compilación estática desde la etapa 1 al directorio público de NGINX
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Exponer el puerto 80 del contenedor
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]