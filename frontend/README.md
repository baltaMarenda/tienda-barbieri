# Barbieri — Frontend

Tienda web de materiales de construcción, aberturas y artículos para la
remodelación del hogar. React 19 + Vite + TypeScript, consumiendo la API FastAPI
de `../backend`.

## Puesta en marcha

```bash
npm install
cp .env.example .env    # opcional: sólo si el backend no está en localhost:8000
npm run dev             # http://localhost:5173
```

El backend tiene el CORS restringido a `http://localhost:5173`
(`backend/app/main.py`), así que el dev server tiene que quedar en ese puerto.

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Typecheck (`tsc -b`) + build de producción a `dist/` |
| `npm run preview` | Sirve el build de producción |
| `npm run lint` | ESLint sobre todo el proyecto |

## Rutas

| Ruta | Pantalla |
|---|---|
| `/` | Home: rubros y productos destacados |
| `/productos` | Catálogo con filtros, búsqueda, orden y paginación en la URL |
| `/productos/:id` | Ficha de producto con galería, stock y relacionados |
| `/contacto` | Datos de contacto y formulario |
| `/login` | Acceso al panel |
| `/admin/productos` · `/admin/categorias` · `/admin/imagenes` | ABM, sólo rol `admin` |

Todo el estado del catálogo vive en el query string (`?search=&category=&sort=&page=`),
así que los filtros se pueden compartir y el botón Atrás funciona.

## Diseño

Dirección clásica y sobria, tipo catálogo impreso: grilla estricta, esquinas casi
rectas (`--radius-md: 2px`), sombras mínimas, sin texturas ni degradados, un solo
color de acento. El peso visual lo llevan la tipografía y los bordes, no los
efectos. Punto de partida generado con la skill
[ui-ux-pro-max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill).

Los dos colores de marca están muestreados pixel a pixel del logo original:

| Token | Valor | Uso |
|---|---|---|
| `--brand-400` | `#049EE3` | Azul exacto del isotipo. Color gráfico: barras de acento, bordes, isotipo. Tiene 3.0:1 contra blanco, así que **no** se usa para texto ni como fondo de texto blanco. |
| `--brand-600` | `#0270A2` | Fondo de botones primarios (blanco encima: 5.47:1 ✓ AA) |
| `--brand-700` | `#015B84` | Enlaces y estados activos sobre blanco (7.42:1 ✓ AAA) |
| `--gray-500` | `#7F7F7F` | Gris exacto del logotipo |
| `--gray-600` | `#6B6B6B` | Texto secundario (5.33:1 ✓ AA) |

Tipografía (`--font-heading` / `--font-body` / `--font-logo`):

- **Roboto Slab** — títulos, nombres de producto y precios. Slab serif de remates
  rectos: letras cuadradas y peso de imprenta. Es la voz editorial del sitio.
- **Roboto** — texto corrido y todos los controles de interfaz (botones, nav,
  etiquetas, tablas), donde a tamaño chico se lee mejor que la slab.
- **Roboto** también para el logotipo, con su propio token: el logo original es
  una grotesca y no debe heredar la slab de los títulos.

Los tokens viven en `src/styles/tokens.css`; el resto de las hojas sólo los consume.

El logo se reconstruyó como SVG (`src/components/ui/Logo.tsx`) para que escale
nítido, no arrastre el fondo blanco del JPG y funcione sobre el footer oscuro.
El original queda en `public/logo-barbieri.jpg` y recortado en `logo-barbieri.png`
(se usa como `og:image`).

Checklist aplicado: contraste ≥ 4.5:1 en todo el texto, área táctil de 44×44 px,
foco visible en todo lo interactivo, `prefers-reduced-motion` respetado, íconos
SVG (nunca emojis), estados vacíos con salida concreta, y `aspect-ratio` fijo en
las imágenes para no generar saltos de layout.

## Estructura

```
src/
  api/        cliente HTTP (Bearer, normalización de errores) + un módulo por recurso
  components/ layout/ (header, footer, carrito) · product/ · ui/ (primitivas)
  context/    Auth, Cart y Toast — el objeto Context separado del Provider
  hooks/      useAuth, useCart, useToast, useProducts, useProduct, useCategories…
  lib/        formato es-AR, localStorage tolerante a fallos, datos del sitio
  pages/      públicas + admin/
  styles/     tokens · base · components · layout
  types/      espejo de los schemas Pydantic del backend
```

## Notas sobre la API

- **Imágenes**: `ProductResponse` no incluye las imágenes y `GET /images/` no
  acepta filtro por producto, así que el front trae el listado completo una vez,
  lo cachea y lo agrupa en memoria (`src/api/images.ts`). Si algún día
  `ProductResponse` devuelve `images`, se puede borrar ese agrupamiento.
- **Editar una imagen**: el `PUT /images/{id}` del backend hace
  `product_repository.get_by_id(db, image_data.product_id)` sin chequear `None`,
  así que responde 404 si el campo viene ausente. El cliente manda siempre
  `product_id`, incluso cuando no cambió.
- **Carrito**: no hay endpoints de carrito ni de pedidos, así que vive en
  `localStorage`. El total se calcula en el cliente y la consulta sale por correo
  desde `/contacto`. Cuando exista `POST /orders/` sólo hay que enviar `lines`.
- **Datos de la empresa**: teléfono, dirección y horarios son de ejemplo y están
  centralizados en `src/lib/site.ts`.
