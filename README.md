# Inclumap

Plataforma web de accesibilidad que permite a usuarios con discapacidades encontrar y calificar negocios según sus características de accesibilidad.

## 🚀 Estado del Proyecto

![CI Backend](https://github.com/Directorio-para-Discapacitados/Inclumap/workflows/CI%20de%20Backend%20(NestJS%20con%20Postgres)/badge.svg)
![CI Frontend](https://github.com/Directorio-para-Discapacitados/Inclumap/workflows/CI%2FCD%20Frontend%20(React)/badge.svg)

## 📋 Tabla de Contenidos

- [Características](#características)
- [Tecnologías](#tecnologías)
- [Requisitos Previos](#requisitos-previos)
- [Instalación y Configuración](#instalación-y-configuración)
- [Scripts Disponibles](#scripts-disponibles)
- [Despliegue](#despliegue)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Contribuir](#contribuir)
- [Equipo](#equipo)

## ✨ Características

- 🗺️ Mapa interactivo con negocios accesibles
- ♿ Sistema de calificación de accesibilidad
- 🔍 Búsqueda avanzada por tipo de accesibilidad
- 👤 Autenticación con Google OAuth
- 📸 Reconocimiento de imágenes con Google Vision
- ⭐ Sistema de reviews y calificaciones
- 🤖 Chatbot de asistencia
- 📧 Sistema de notificaciones por email
- 🌐 API RESTful documentada con Swagger

## 🛠️ Tecnologías

### Backend
- **Framework**: NestJS (Node.js)
- **Base de Datos**: PostgreSQL 15
- **ORM**: TypeORM
- **Autenticación**: Passport.js + JWT + Google OAuth
- **Cloud Storage**: Cloudinary
- **Email**: NodeMailer
- **AI**: Google Vision API, Sentiment Analysis

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Routing**: React Router v7
- **Maps**: React Leaflet
- **UI**: Custom components + Tabler Icons
- **HTTP Client**: Axios

### DevOps
- **Containerización**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Registry**: GitHub Container Registry (GHCR)
- **Deployment**: Automated via SSH

## 📦 Requisitos Previos

- Node.js 20 o superior
- Docker y Docker Compose
- PostgreSQL 15 (si no usas Docker)
- Cuenta de Google Cloud (para OAuth y Vision API)
- Cuenta de Cloudinary

## 🚀 Instalación y Configuración

### Desarrollo Local

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/Directorio-para-Discapacitados/Inclumap.git
   cd Inclumap
   ```

2. **Configurar variables de entorno**
   ```bash
   # Backend
   cd backend
   cp .env.example .env
   # Editar .env con tus credenciales

   # Frontend
   cd ../frontend
   cp .env.example .env
   # Editar .env con tus credenciales
   ```

3. **Iniciar con Docker Compose**
   ```bash
   cd ..
   docker-compose up -d
   ```

   O manualmente:

   ```bash
   # Backend
   cd backend
   npm install
   npm run start:dev

   # Frontend (en otra terminal)
   cd frontend
   npm install
   npm run dev
   ```

4. **Acceder a la aplicación**
   - Frontend: http://localhost:80
   - Backend API: http://localhost:9080
   - API Docs (Swagger): http://localhost:9080/api

## 📜 Scripts Disponibles

### Backend
```bash
npm run start:dev    # Modo desarrollo con hot-reload
npm run build        # Compilar para producción
npm run start:prod   # Ejecutar en producción
npm run test         # Ejecutar tests unitarios
npm run test:e2e     # Ejecutar tests e2e
npm run lint         # Linter
```

### Frontend
```bash
npm run dev          # Servidor de desarrollo
npm run build        # Compilar para producción
npm run preview      # Previsualizar build de producción
npm run lint         # Linter
```

## 🚢 Despliegue

Este proyecto implementa **Continuous Deployment (CD)** automático.

### Proceso Automático

1. Haz push o merge a `main`
2. CI se ejecuta automáticamente (tests, lint, build)
3. Si CI es exitoso, CD se ejecuta automáticamente
4. La aplicación se despliega en producción

### Documentación Completa

Ver [README-DEPLOYMENT.md](./README-DEPLOYMENT.md) para:
- Configuración de secretos en GitHub
- Setup del servidor de producción
- Scripts de despliegue manual
- Rollback y troubleshooting
- Monitoreo y health checks

### Scripts de Despliegue

```bash
# En el servidor de producción
cd ~/inclumap

# Desplegar/actualizar
./scripts/deploy.sh

# Verificar estado
./scripts/health-check.sh

# Rollback si es necesario
./scripts/rollback.sh [tag]
```

Ver [scripts/README.md](./scripts/README.md) para más detalles.

## 📁 Estructura del Proyecto

```
Inclumap/
├── .github/
│   ├── workflows/           # GitHub Actions workflows
│   │   ├── backend-ci.yml  # CI para backend
│   │   ├── backend-cd.yml  # CD para backend
│   │   ├── frontend-ci.yml # CI para frontend
│   │   ├── frontend-cd.yml # CD para frontend
│   │   └── deploy-full.yml # CD completo
│   └── SECRETS.md          # Documentación de secretos
├── backend/
│   ├── src/                # Código fuente
│   │   ├── auth/          # Módulo de autenticación
│   │   ├── business/      # Módulo de negocios
│   │   ├── user/          # Módulo de usuarios
│   │   ├── review/        # Módulo de reviews
│   │   ├── maps/          # Integración con mapas
│   │   └── ...
│   ├── Dockerfile         # Dockerfile optimizado
│   ├── .env.example       # Ejemplo de variables de entorno
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── Components/    # Componentes React
│   │   ├── pages/         # Páginas
│   │   ├── services/      # Servicios API
│   │   └── ...
│   ├── Dockerfile         # Dockerfile multi-stage
│   ├── nginx.conf         # Configuración de Nginx
│   ├── .env.example       # Ejemplo de variables de entorno
│   └── package.json
├── scripts/
│   ├── deploy.sh          # Script de despliegue
│   ├── rollback.sh        # Script de rollback
│   ├── health-check.sh    # Script de verificación
│   └── README.md          # Documentación de scripts
├── docker-compose.yml     # Para desarrollo
├── docker-compose.prod.yml # Para producción
└── README-DEPLOYMENT.md   # Guía completa de despliegue
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

Los workflows de CI/CD se ejecutarán automáticamente en tu PR.

## 👥 Equipo

### Integrantes:
- Marlon Jhair Moncayo ([Jhair7474](https://github.com/Jhair7474))
- Michael Stiven Valencia ([MichaelVale97](https://github.com/MichaelVale97))
- Breiner Santiago Romo Ruales ([SantiagoRuales](https://github.com/SantiagoRuales))
- Jhon Alexander Ruales Bolaños ([AlexRuales2](https://github.com/AlexRuales2))
- Steven Moreno Moriano ([Morenosteven](https://github.com/Morenosteven))

## 📄 Licencia

Este proyecto está bajo la licencia UNLICENSED - ver el archivo LICENSE para más detalles.

## 📞 Soporte

Para problemas o preguntas:
- Abre un [Issue](https://github.com/Directorio-para-Discapacitados/Inclumap/issues)
- Consulta la [documentación de despliegue](./README-DEPLOYMENT.md)
- Revisa los [workflows de CI/CD](./.github/workflows/)

---

**Desarrollado con ❤️ por el equipo de Inclumap**