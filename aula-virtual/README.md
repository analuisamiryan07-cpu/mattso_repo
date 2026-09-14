# Aula Virtual — proyecto y dominio aparte

Frontend React/Vite independiente del sitio público (`src/` en la raíz del
repo). Comparte el mismo backend NestJS (`backend-matsso/`) — no tiene
backend propio — pero es su propio deploy, con su propio dominio.

## Por qué está separado

El botón "Aula Virtual" del sitio público debe llevar a "una página
totalmente distinta, que no pertenece a la página web, solo está enlazada" —
un subdominio real (ej. `aula.sapper-industries.com`) en el mismo dominio de
Cloudflare del sitio principal, apuntando a un deploy distinto en Vercel.

## Desarrollo local

```bash
cd aula-virtual
npm install
cp .env.example .env.local   # ajustar VITE_API_URL si el backend corre local
npm run dev
```

## Desplegar

1. **Vercel**: crear un proyecto nuevo apuntando a la carpeta `aula-virtual/`
   de este repo (Root Directory = `aula-virtual`). Variables de entorno:
   `VITE_API_URL`, `VITE_SITIO_PUBLICO_URL` (ver `.env.example`).
2. **Cloudflare DNS**: en el dominio ya comprado, agregar un registro
   `CNAME aula → cname.vercel-dns.com` (Vercel indica el valor exacto al
   agregar el dominio personalizado en el proyecto).
3. En Vercel, agregar `aula.sapper-industries.com` (o el subdominio elegido)
   como dominio del proyecto.
4. En el sitio público (raíz del repo), configurar `VITE_AULA_VIRTUAL_URL`
   con esa misma URL y volver a desplegar — el botón del header ya apunta
   ahí (`src/components/layout/Header.jsx`).

## Backend

No hay nada que desplegar aparte — todos los endpoints que usa este
proyecto (`/lms/gate/login`, `/lms/access-codes/*`, `/lms/courses`,
`/lms/professor/*`, etc.) ya están en `backend-matsso/src/lms/`, dentro del
mismo backend que usa el sitio público. Ver `Moodles/lms/docs/API_CONTRACT.md`.

## Estructura

```
aula-virtual/src/
├── App.jsx                 → portón (login+pago → clave) y enrutado por rol
├── api/                     client.js, authService.js (gateLogin), lmsService.js
├── layout/AulaLayout.jsx    barra superior propia (sin el Header del sitio)
├── pages/
│   ├── Login.jsx             paso 1: credenciales + términos + bloqueo si no pagó
│   ├── Clave.jsx              paso 2: clave del sistema interno
│   ├── MisCursos.jsx          lista de cursos inscritos (estudiante)
│   ├── CursoVOD.jsx           look Coursera — delivery_mode=ASINCRONO_VOD
│   ├── CursoTradicional.jsx   look Moodle — delivery_mode=TRADICIONAL
│   └── profesor/               MisCursosProfesor.jsx, CursoProfesor.jsx
└── components/                VideoPlayer, QuizRunner, EntregaTarea (compartidos)
```
