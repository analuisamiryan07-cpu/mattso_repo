# Qué necesito de ti para que el Aula Virtual quede funcionando

Checklist en orden. Cada punto dice exactamente dónde hacer clic o qué
comando correr. Nada de esto lo puedo hacer yo por ti — necesito acceso a
Supabase/Render/Vercel/Cloudflare/GitHub que no tengo en este entorno.

## 1. Base de datos (Supabase) — lo primero, todo lo demás depende de esto

1. Abre el **SQL Editor** de tu proyecto en supabase.com.
2. Pega y corre completo `db_scripts/11_lms_schema.sql` (ya está en el repo,
   generado automáticamente comparando el schema real — no escrito a mano).
   Crea el schema `lms` completo y la tabla `access_codes`. No toca ninguna
   tabla existente.
3. Confirma que no haya errores rojos al final de la ejecución.

## 2. Backend en Render

Ve a tu servicio `matsso-backend` en render.com → **Environment**:

| Variable | Valor |
|---|---|
| `LMS_M2M_API_KEY` | Nueva. Generar con `openssl rand -hex 32` (o pídemelo y te doy una). Guárdala también para el paso 5 — tiene que ser **idéntica** en los dos lados. |

Después de guardar la variable, Render redespliega solo. Si el despliegue lo
disparas manualmente (Manual Deploy), asegúrate de que sea desde la rama que
tenga este trabajo (ver punto 6, todavía no está en `main`).

## 3. Sitio público en Vercel (el proyecto que ya existe)

Ve a tu proyecto del sitio público en vercel.com → **Settings → Environment
Variables**:

| Variable | Valor |
|---|---|
| `VITE_AULA_VIRTUAL_URL` | La URL del subdominio que vas a crear en el paso 4, ej. `https://aula.sapper-industries.com`. **No actives el botón "Aula Virtual" en producción hasta tener esto** — mientras tanto puede quedar apuntando a un valor de prueba. |

## 4. Subdominio en Cloudflare + proyecto nuevo en Vercel

1. En **Vercel**: "Add New… → Project" → importa el mismo repositorio de
   GitHub, pero con **Root Directory = `aula-virtual`** (no la raíz). Esto lo
   convierte en un proyecto de Vercel separado del sitio público, apuntando a
   la misma carpeta del mismo repo.
2. En ese proyecto nuevo, agrega las variables de entorno:

   | Variable | Valor |
   |---|---|
   | `VITE_API_URL` | El mismo backend: `https://tikky-hg4n.onrender.com/api` (o el que uses). |
   | `VITE_SITIO_PUBLICO_URL` | `https://sapper-industries.com` (o tu dominio real). |

3. En **Vercel → ese proyecto → Settings → Domains**, agrega
   `aula.sapper-industries.com` (o el subdominio que prefieras). Vercel te va
   a mostrar un valor de CNAME (algo como `cname.vercel-dns.com`).
4. En **Cloudflare → tu dominio → DNS**, agrega:
   - Tipo: `CNAME`
   - Nombre: `aula`
   - Destino: el valor exacto que te dio Vercel en el paso 3
   - Proxy: puedes dejarlo en "DNS only" (nube gris) las primeras horas para
     confirmar que funciona, y pasarlo a proxied (nube naranja) después si
     quieres el CDN/protección de Cloudflare.
5. Espera a que el dominio quede verificado en Vercel (unos minutos a unas
   horas según la propagación de DNS).
6. Vuelve al punto 3 y pon la URL real en `VITE_AULA_VIRTUAL_URL` del sitio
   público, y redespliega ese proyecto.

## 5. Sistema interno (Laravel) — para tu compañero, no para ti

Ver `Moodles/lms/docs/REQUISITOS_SISTEMA_INTERNO.md` — tiene el código PHP
listo para copiar y pegar. Necesita la **misma** `LMS_M2M_API_KEY` del
punto 2.

## 6. Git — todavía no subí nada a GitHub

Todo este trabajo vive en la rama local `lms/aula-virtual` de este
checkout — nunca hice `git push`, y **no tengo credenciales configuradas
para GitHub en este entorno** (lo verifiqué: no hay usuario/token/llave SSH
guardados acá). Dos formas de resolverlo, tú eliges:

**Opción A — lo subes tú (más simple, recomendado):**
```bash
cd "ruta/a/tu/checkout"
git push origin lms/aula-virtual
```
Y luego abres el Pull Request en GitHub tú mismo, o me pides que te arme la
descripción del PR (puedo hacerlo sin necesitar push).

**Opción B — me das acceso para que lo suba yo:**
Necesitaría un **Personal Access Token** de GitHub (Settings → Developer
settings → Personal access tokens → Fine-grained, con permiso `contents:
write` solo sobre este repositorio) que me pegues en el chat. Lo uso una
vez para el push y no queda guardado en ningún archivo del repo. Si
prefieres no compartir un token, la Opción A es igual de rápida.

**Importante en cualquiera de los dos casos:** esto se sube como Pull
Request contra `main`, **no** con push directo ni force-push — la rama
local `main` de este checkout tiene un historial roto y desconectado de
`origin/main` (ver la auditoría previa), así que cualquier comparación o
merge debe hacerse contra `origin/main` real, nunca contra esa `main` local.

## 7. Cuando todo lo anterior esté listo

Avísame y hago una verificación final: reviso que las variables coincidan,
que el subdominio resuelva, y preparamos el primer curso de prueba real
(usando `POST /api/lms/admin/professors` para crearte a ti o a alguien como
profesor de prueba).
