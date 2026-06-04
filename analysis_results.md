# Auditoría Técnica del Proyecto React — Campus Matsso

> **Fecha:** 2026-04-28 | **Versión auditada:** V1 13 04 2026 con react  
> **Veredicto general:** Prototipo en estado inicial con deuda técnica severa. No es producción-ready.

---

## 1. Visión General

Este proyecto es una migración **parcial e incompleta** de un sitio WordPress/Elementor estático hacia React (Vite). El esfuerzo es correcto en intención: separar la capa de datos, usar componentes, centralizar estilos. Sin embargo, la ejecución tiene problemas estructurales graves que deben resolverse antes de continuar agregando funcionalidades.

---

## 2. Problemas Críticos (Bloquean producción)

### 🔴 Bug 1: Carrito completamente roto

**Archivo:** `src/pages/Carrito.jsx` vs `src/context/CartContext.jsx`

`Carrito.jsx` importa `useCart` (línea 1):
```js
import { useCart } from '../context/CartContext';
```

Pero `CartContext.jsx` **nunca exporta un hook `useCart`**. Solo exporta `CartContext` (el contexto crudo) y `CartProvider`. El hook personalizado simplemente no existe.

Resultado: la página `/carrito` lanzará un **TypeError** en runtime al primer render. El carrito es inutilizable.

**Adicionalmente**, `Carrito.jsx` llama a `updateQty` y `clearCart` (línea 5), funciones que **tampoco están definidas** en el contexto. El contexto solo tiene `addToCart`, `removeFromCart`, `getCartTotal`, `getCartCount`.

---

### 🔴 Bug 2: Duplicado de componentes Header y Footer con versiones incompatibles

Existen **dos Header y dos Footer**:

| Archivo | Estado |
|---|---|
| `src/components/Header.jsx` | Versión legacy con clases Elementor, links a `.html`, usa `useCart()` que no existe |
| `src/components/layout/Header.jsx` | Versión moderna, funcional |
| `src/components/Footer.jsx` | Versión inline sin estructura |
| `src/components/layout/Footer.jsx` | Versión moderna |

`App.jsx` importa correctamente los de `layout/`, pero los archivos legacy en `components/` **siguen existiendo** y causarán confusión. El Header legacy en `components/Header.jsx` usa `href` de HTML puro (`/carrito.html`, `/login.html`) en lugar de React Router `<Link>`, rompiendo la SPA.

---

### 🔴 Bug 3: `CartContext` no expone `useCart`, pero `CourseCard.jsx` y `Carrito.jsx` lo usan

`CourseCard.jsx` (línea 1) y `Carrito.jsx` también hacen:
```js
import { useCart } from '../context/CartContext';
```

Esto fallará en **cualquier página que use CourseCard**. Si `Carrito.jsx` o cualquier página que use `CourseCard` se monta, la app explota.

**Solución mínima necesaria:** Agregar al contexto:
```js
export const useCart = () => useContext(CartContext);
```

---

### 🔴 Bug 4: Rutas declaradas en el Header que no existen en `App.jsx`

El Header navega hacia `/capacitaciones`, `/certificaciones`, `/contacto`, `/login`, y `/carrito`. En `App.jsx` solo existen dos rutas:
- `/` → `<Home />`
- `/certificacion/limpieza` → `<CertificationDetail />`

Todo lo demás produce una página en blanco (sin 404 handler). El usuario hace clic en "Capacitaciones" y no pasa nada visible.

---

### 🔴 Bug 5: `Carrito.jsx` mezcla dos modelos de datos inconsistentes

El código accede a `item.precio` y también a `item.inversion` (que es string como `"$90.00"`):
```js
// Línea 73
item.precio || parseFloat(item.inversion.replace('$', ''))
```

Esto es una señal de que se están mezclando dos fuentes de datos con esquemas distintos (los mocks de Home.jsx usan `price` en inglés, no `precio`; los de la versión legacy usan `inversion`). El carrito fallará en cálculo de totales según qué curso se agregue.

---

## 3. Problemas Arquitecturales (Deuda técnica severa)

### 🟠 El proyecto es una migración a medias — convive código legacy con código React

Dentro de `src/styles/global.css` (que **no se importa en ningún lado** actualmente) hay:
```css
@import '../../recursos/estilos/inicio.css';
@import '../../recursos/estilos/estilos_extraidos.css';
@import '../../recursos/estilos/carrito_pagina.css';
```

Esto importa `estilos_extraidos.css` que pesa **182 KB** — un dump completo de los estilos de WordPress/Elementor. Esto es el equivalente a pegar el motor de un camión dentro de un coche eléctrico. Introduce miles de reglas globales de Elementor que colisionarán con los estilos React.

**Por suerte**, este `global.css` no se importa desde `main.jsx`, así que no está activo. Pero sigue existiendo como trampa para quien lo active accidentalmente.

---

### 🟠 Carpetas vacías declaradas pero sin contenido

| Carpeta | Estado |
|---|---|
| `src/hooks/` | Completamente vacía |
| `src/utils/` | Completamente vacía |
| `src/models/` | Completamente vacía |
| `src/components/ui/` | Completamente vacía |

La estructura existe en el papel pero no en la realidad. `useCountUp` (un hook personalizado no trivial) está incrustado directamente en `Home.jsx` en vez de estar en `src/hooks/`. Esto contradice la estructura declarada.

---

### 🟠 Datos hardcodeados directamente en los componentes de página

`Home.jsx` tiene los datos de cursos como constantes internas:
```js
const featuredCourses = [{ id: 233, title: 'Prevención de Riesgos...', price: 90.00, ... }]
```

`CertificationDetail.jsx` tiene el contenido completo de la certificación (2 páginas de texto) incrustado como objeto en el componente.

Esto **no es escalable**. Cualquier cambio de contenido requiere tocar el componente. En un proyecto real, esto debería venir de la API o al menos de archivos de datos separados en `src/models/` o `src/data/`.

---

### 🟠 `CertificationDetail` es hardcoded para una sola certificación

La ruta es literalmente `/certificacion/limpieza`. No hay enrutamiento dinámico (`/certificacion/:slug`). Para agregar una segunda certificación, hay que duplicar el componente completo. Esto es un anti-patrón fundamental en React.

---

### 🟠 Inconsistencia grave de nomenclatura de campos

El modelo de datos no es consistente en todo el proyecto:

| Campo | En `Home.jsx` | En `Carrito.jsx` | En `CourseCard.jsx` |
|---|---|---|---|
| Título | `title` | `titulo` | `titulo` |
| Precio | `price` | `precio` / `inversion` | `inversion` |
| Imagen | `image` | `img` / `imagen` | `img` / `imagen` |
| Cantidad | `quantity` | `cantidad` | — |

Esto indica que el carrito fue escrito esperando el esquema de datos de la versión legacy JS, mientras que Home fue escrito con un esquema diferente. No funcionan juntos.

---

## 4. Calidad del Código

### 🟡 Comentarios pedagógicos sobreabundantes en código de producción

`Home.jsx` tiene comentarios como:
```js
// 2. RENDERIZADO DINÁMICO
// Aquí usamos .map() para recorrer el arreglo benefitsData...
```

Esto indica que el código fue escrito con fines de aprendizaje, no de producción. En un codebase real, los comentarios deben explicar el *por qué*, no el *qué*. Estos comentarios deben eliminarse antes de cualquier despliegue.

---

### 🟡 `Carrito.jsx` manipula el DOM directamente (anti-patrón React)

```js
// Línea 20
const name = document.getElementById('billing-name').value;

// Línea 129
document.getElementById('hidden-submit-btn').click();
```

En React, el acceso directo al DOM con `getElementById` existe para casos muy específicos. Aquí se usa simplemente para leer un campo de formulario (que debería manejarse con `useState` o `useRef`) y para simular un click en un botón oculto (un hack innecesario). Este patrón rompe el flujo declarativo de React.

---

### 🟡 `window.location.href = "/"` en vez de `navigate('/')`

```js
// Carrito.jsx, línea 23
window.location.href = "/";
```

Esto causa una **recarga completa del navegador**, perdiendo todo el estado de React. En una SPA, se debe usar el hook `useNavigate()` de react-router-dom.

---

### 🟡 Uso de `alert()` como UI de feedback

```js
// CourseCard.jsx
alert(`${course.titulo} ha sido añadido al carrito.`);

// Carrito.jsx
alert(`¡Gracias por tu compra, ${name}!...`);
alert("No tienes cursos en el carrito...");
```

`alert()` es bloqueante, bloquea el hilo principal, no se puede estilizar y da una experiencia de usuario de los años 2000. Debe reemplazarse por un sistema de notificaciones (toast/snackbar).

---

### 🟡 `useCountUp` hook en el lugar equivocado

El hook `useCountUp` y el componente `StatItem` están definidos **dentro del mismo archivo** `Home.jsx`. Un hook reutilizable debería estar en `src/hooks/useCountUp.js`, y un subcomponente que puede reutilizarse en `src/components/StatItem.jsx`.

---

### 🟡 Fuga de memoria potencial en `useCountUp`

```js
// Home.jsx, línea 24-26
return () => {
  if (countRef.current) observer.unobserve(countRef.current);
};
```

El cleanup del `useEffect` solo hace `unobserve`, pero no llama a `observer.disconnect()`. Para múltiples `StatItem` esto acumula observers activos.

---

### 🟡 `key={index}` en listas

```js
certificationData.about.map((paragraph, index) => <p key={index}>...)
certificationData.requirements.map((req, index) => <div key={index}>...)
```

Usar el índice como `key` es un anti-patrón conocido en React cuando los elementos pueden reordenarse. Debe usarse un ID único o el contenido hashado.

---

## 5. CSS — Problemas de Estilo

### 🟠 `.benefits-section` declarada DOS veces en `Home.css`

```css
/* Línea 132 */
.benefits-section { padding: 40px 0 60px; background-color: #f8f9fa; }

/* Línea 336 */
.benefits-section { padding: 80px 0; background-color: var(--bg-color); }
```

La segunda declaración sobreescribe la primera. Esto significa que la sección de beneficios visual (con imagen y fondo azul) tiene un padding y color equivocado. Esto es un bug CSS directo por nombrado duplicado.

**Solución:** Renombrar una de las dos a `.benefits-section-cards` o similar.

---

### 🟠 `.benefit-item` tiene estilos incompatibles en el mismo archivo

```css
/* Contexto 1: Dentro de benefits-wrapper (fondo azul, flex) */
.benefit-item { display: flex; align-items: center; gap: 20px; color: white; }

/* Contexto 2: Dentro de benefits-grid (tarjetas blancas, text-center) */
.benefit-item { padding: 30px; background: var(--color-white); border-radius: 12px; }
```

Ambas declaraciones comparten el mismo selector `.benefit-item`, causando que ambas secciones hereden estilos incorrectos del otro contexto.

---

### 🟡 Tipografía inconsistente entre archivos

- `index.css`: `font-family: 'Inter', sans-serif` (importada desde Google Fonts en index.html)
- `CertificationDetail.css`: `font-family: 'Arial', sans-serif` (hardcodeado)
- `styles/global.css`: `font-family: 'Montserrat', sans-serif` (diferente fuente)
- `stat-title` en `Home.css`: `font-family: 'Georgia', serif`

El sitio no tiene una tipografía unificada. Cada archivo usa la que quiere.

---

### 🟡 CSS en `vite.config.js` sin configuración alguna

```js
export default defineConfig({
  plugins: [react()],
})
```

No hay alias de paths, no hay `resolve`, no hay configuración de assets. Para un proyecto de esta complejidad, al menos deberían configurarse alias (`@/` → `src/`) para evitar los imports relativos profundos como `'../../../recursos/...'`.

---

## 6. Archivos Huérfanos / Basura de Proyecto

Los siguientes archivos existen en la raíz del proyecto y **no tienen ningún rol en la aplicación React**:

| Archivo | Descripción |
|---|---|
| `extract.js` | Script de migración WordPress con rutas hardcodeadas a `C:\Users\melan\...` |
| `fix_css.js` | Script utilitario de migración |
| `fix_html.js` | Script utilitario de migración |
| `migrate.ps1` | Script PowerShell de migración |
| `update.ps1` | Script PowerShell |
| `first_lines.txt` | Archivo de texto de trabajo |
| `header1.txt` | Archivo de texto de trabajo |
| `header2.txt` | Archivo de texto (15 KB) |
| `search_header.txt` | Archivo de texto de trabajo |
| `test.txt` | Archivo de texto vacío |
| `raw_pages/` | Directorio con HTML crudo de WordPress |
| `Campus Matsso – E-Learn_files/` | Directorio de archivos del site scrapeado |
| `recursos/scripts/` | 9 scripts JavaScript legacy de la versión HTML pura |

Estos archivos son **basura de proceso de migración** que no deben estar en el repositorio. Deben ir a `.gitignore` o eliminarse.

---

## 7. Seguridad

### 🟡 Token JWT en localStorage
```js
const token = localStorage.getItem('token');
```
`localStorage` es vulnerable a XSS. Para tokens de sesión, la práctica recomendada actual es usar `httpOnly cookies`. Este es un punto a considerar cuando la autenticación esté implementada.

---

## 8. Lo que Funciona Correctamente

Para ser justo, hay elementos bien implementados:

- ✅ **`CartContext` con persistencia en `localStorage`** — La lógica de `useState` inicializado desde localStorage y el `useEffect` para persistir es correcta.
- ✅ **Header con scroll detection y transparencia** — La lógica de `scrolled` y `isHomePage` es elegante y funcional.
- ✅ **Hero con video de fondo** — Bien implementado con overlay y z-index correctos.
- ✅ **`useCountUp` con IntersectionObserver** — La idea es correcta y la animación easeOut es un buen detalle.
- ✅ **`React.StrictMode` activado** — Correcto para detectar side effects.
- ✅ **Estructura de carpetas declarada es buena** — La intención de separar `api/`, `context/`, `hooks/`, `utils/`, `models/` es la correcta, simplemente no se ha ejecutado todavía.
- ✅ **Responsive básico en Header y páginas** — Los media queries existen.

---

## 9. Prioridades de Acción (Ordenadas por Impacto)

### Prioridad 1 — Arreglar bugs que rompen la app ahora mismo

1. Exportar `useCart` desde `CartContext.jsx`
2. Implementar `clearCart` y `updateQty` en el contexto
3. Unificar el modelo de datos del curso (`id`, `title`/`titulo`, `price`/`precio`, `image`/`imagen`)
4. Agregar todas las rutas faltantes en `App.jsx` (`/capacitaciones`, `/certificaciones`, `/carrito`, `/login`, `/contacto`)
5. Eliminar `src/components/Header.jsx` y `src/components/Footer.jsx` legacy

### Prioridad 2 — Deuda técnica urgente

6. Reemplazar `alert()` por un sistema de toast
7. Reemplazar `window.location.href` por `useNavigate()`
8. Reemplazar `document.getElementById` por `useRef`/`useState`
9. Corregir los selectores CSS duplicados (`.benefits-section`, `.benefit-item`)
10. Hacer la ruta de certificación dinámica (`/certificacion/:slug`)

### Prioridad 3 — Limpieza estructural

11. Mover `useCountUp` a `src/hooks/useCountUp.js`
12. Mover `StatItem` a `src/components/StatItem.jsx`
13. Mover datos de cursos y certificaciones a `src/data/` o `src/models/`
14. Unificar tipografía en `index.css`
15. Agregar alias de paths en `vite.config.js`
16. Agregar `.gitignore` y excluir archivos de migración legacy

### Prioridad 4 — Funcionalidades pendientes (están vacías)

17. Implementar página `/capacitaciones` con listado real usando `CourseCard`
18. Implementar página `/certificaciones` con listado real
19. Implementar página `/login` con lógica real
20. Implementar página `/contacto`
21. Conectar `src/api/client.js` con endpoints reales del backend .NET

---

## 10. Resumen Final

| Área | Calificación |
|---|---|
| Arquitectura (intención) | 7/10 — Bien pensada en papel |
| Arquitectura (ejecución) | 3/10 — Incompleta y con bugs críticos |
| Calidad del código | 4/10 — Anti-patrones frecuentes |
| CSS | 4/10 — Duplicados y tipografía inconsistente |
| Funcionalidad real | 2/10 — Solo Home y CertificationDetail son navegables |
| Limpieza del proyecto | 2/10 — Lleno de archivos huérfanos de migración |
| Preparación para producción | 1/10 — No puede ir a producción en este estado |

**Diagnóstico:** El proyecto tiene una buena base conceptual y algunas partes bien ejecutadas (el header, el hero). El problema principal es que es una migración a medias que mezcla dos paradigmas (JS legacy vs React) sin haber terminado de cruzar la línea. Los bugs críticos (carrito roto, rutas inexistentes, modelos de datos inconsistentes) deben resolverse antes de continuar agregando features.
