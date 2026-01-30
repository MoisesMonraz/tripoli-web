# Integración de Contentful CMS - Tripoli Media

## Estado Actual

**Dependencia instalada**: `contentful@11.9.0` ✓
**Sistema actual**: Placeholder posts (`lib/posts.js`)
**Objetivo**: Migrar contenido editorial a Contentful CMS

---

## Prerequisitos

### 1. Cuenta de Contentful
- Crear cuenta en [contentful.com](https://www.contentful.com/)
- Crear un nuevo Space para "Tripoli Media"
- Obtener credenciales:
  - `CONTENTFUL_SPACE_ID`
  - `CONTENTFUL_ACCESS_TOKEN` (Content Delivery API)
  - `CONTENTFUL_PREVIEW_ACCESS_TOKEN` (opcional, para preview)
  - `CONTENTFUL_MANAGEMENT_TOKEN` (opcional, para escribir contenido)

### 2. Variables de Entorno
Agregar a `.env.local`:

```env
# Contentful CMS
CONTENTFUL_SPACE_ID=your_space_id_here
CONTENTFUL_ACCESS_TOKEN=your_access_token_here
CONTENTFUL_PREVIEW_ACCESS_TOKEN=your_preview_token_here
CONTENTFUL_MANAGEMENT_TOKEN=your_management_token_here
CONTENTFUL_ENVIRONMENT=master
```

---

## Modelo de Contenido Recomendado

### Content Model: **Post**

```typescript
{
  // System Fields
  sys: {
    id: string,
    createdAt: string,
    updatedAt: string,
    contentType: { sys: { id: 'post' } }
  },

  // Content Fields
  fields: {
    // Identificación
    title: string,           // Título (ES)
    titleEn: string,         // Título (EN)
    slug: string,            // URL-friendly identifier

    // Metadata
    publishDate: Date,       // Fecha de publicación
    author: string,          // Autor
    featured: boolean,       // ¿Destacado en home?

    // Categorización
    category: string,        // consumo-y-retail | entretenimiento-y-cultura | etc.
    subcategory: string,     // fabricantes-y-proveedores | etc.
    tags: string[],          // ["tecnología", "innovación"]

    // Contenido
    excerpt: string,         // Resumen corto (ES)
    excerptEn: string,       // Resumen corto (EN)
    body: RichText,          // Contenido principal (ES)
    bodyEn: RichText,        // Contenido principal (EN)

    // Media
    coverImage: Asset,       // Imagen principal
    gallery: Asset[],        // Galería de imágenes

    // SEO
    metaTitle: string,       // SEO Title
    metaDescription: string, // SEO Description
    metaKeywords: string[],  // SEO Keywords
  }
}
```

### Content Model: **Category**

```typescript
{
  fields: {
    name: string,            // "Consumo y Retail"
    nameEn: string,          // "Consumer & Retail"
    slug: string,            // "consumo-y-retail"
    color: string,           // "#f39200"
    gradientFrom: string,    // "#f39200"
    gradientMid: string,     // "#fdc652"
    gradientLight: string,   // "#fee5c8"
    description: RichText,   // Descripción
    icon: Asset,             // Icono
  }
}
```

### Content Model: **Subcategory**

```typescript
{
  fields: {
    name: string,            // "Fabricantes y Proveedores"
    nameEn: string,          // "Manufacturers & Suppliers"
    slug: string,            // "fabricantes-y-proveedores"
    category: Reference,     // Link to Category
    description: RichText,   // Descripción
  }
}
```

---

## Implementación

### Paso 1: Crear Cliente de Contentful

**Archivo**: `lib/contentful/client.ts`

```typescript
import { createClient } from 'contentful';

if (!process.env.CONTENTFUL_SPACE_ID) {
  throw new Error('CONTENTFUL_SPACE_ID is not defined');
}

if (!process.env.CONTENTFUL_ACCESS_TOKEN) {
  throw new Error('CONTENTFUL_ACCESS_TOKEN is not defined');
}

export const contentfulClient = createClient({
  space: process.env.CONTENTFUL_SPACE_ID,
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN,
  environment: process.env.CONTENTFUL_ENVIRONMENT || 'master',
});

// Preview client (opcional)
export const previewClient = createClient({
  space: process.env.CONTENTFUL_SPACE_ID,
  accessToken: process.env.CONTENTFUL_PREVIEW_ACCESS_TOKEN || '',
  host: 'preview.contentful.com',
  environment: process.env.CONTENTFUL_ENVIRONMENT || 'master',
});
```

### Paso 2: Crear Funciones de Query

**Archivo**: `lib/contentful/posts.ts`

```typescript
import { contentfulClient } from './client';
import { Entry } from 'contentful';

export interface PostFields {
  title: string;
  titleEn: string;
  slug: string;
  publishDate: string;
  author: string;
  featured: boolean;
  category: string;
  subcategory: string;
  tags: string[];
  excerpt: string;
  excerptEn: string;
  body: any; // RichText
  bodyEn: any; // RichText
  coverImage: any; // Asset
  metaTitle?: string;
  metaDescription?: string;
}

export type Post = Entry<PostFields>;

/**
 * Get all posts by subcategory
 */
export async function getPostsBySubcategory(
  categorySlug: string,
  subcategorySlug: string,
  limit: number = 20,
  skip: number = 0
): Promise<{ posts: Post[]; total: number }> {
  try {
    const response = await contentfulClient.getEntries<PostFields>({
      content_type: 'post',
      'fields.category': categorySlug,
      'fields.subcategory': subcategorySlug,
      order: ['-fields.publishDate'],
      limit,
      skip,
    });

    return {
      posts: response.items,
      total: response.total,
    };
  } catch (error) {
    console.error('Error fetching posts from Contentful:', error);
    throw new Error('Failed to fetch posts');
  }
}

/**
 * Get a single post by slug
 */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const response = await contentfulClient.getEntries<PostFields>({
      content_type: 'post',
      'fields.slug': slug,
      limit: 1,
    });

    return response.items[0] || null;
  } catch (error) {
    console.error('Error fetching post from Contentful:', error);
    return null;
  }
}

/**
 * Get featured posts for homepage
 */
export async function getFeaturedPosts(limit: number = 6): Promise<Post[]> {
  try {
    const response = await contentfulClient.getEntries<PostFields>({
      content_type: 'post',
      'fields.featured': true,
      order: ['-fields.publishDate'],
      limit,
    });

    return response.items;
  } catch (error) {
    console.error('Error fetching featured posts:', error);
    return [];
  }
}

/**
 * Get posts by category
 */
export async function getPostsByCategory(
  categorySlug: string,
  limit: number = 20
): Promise<Post[]> {
  try {
    const response = await contentfulClient.getEntries<PostFields>({
      content_type: 'post',
      'fields.category': categorySlug,
      order: ['-fields.publishDate'],
      limit,
    });

    return response.items;
  } catch (error) {
    console.error('Error fetching posts by category:', error);
    return [];
  }
}
```

### Paso 3: Reemplazar Sistema Placeholder

**Archivo a reemplazar**: `lib/posts.js`

```javascript
// Eliminar esta función:
export function getPostsBySubcategory(categorySlug, subcategorySlug) {
  // ... código placeholder actual
}

// Reemplazar con:
export { getPostsBySubcategory, getPostBySlug, getFeaturedPosts } from './contentful/posts';
```

### Paso 4: Renderizar Rich Text

**Archivo**: `components/post/PostBody.tsx`

```typescript
import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
import { BLOCKS, INLINES } from '@contentful/rich-text-types';

const renderOptions = {
  renderNode: {
    [BLOCKS.PARAGRAPH]: (node: any, children: any) => (
      <p className="mb-4 text-gray-700 dark:text-gray-300">{children}</p>
    ),
    [BLOCKS.HEADING_1]: (node: any, children: any) => (
      <h1 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">{children}</h1>
    ),
    [BLOCKS.HEADING_2]: (node: any, children: any) => (
      <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">{children}</h2>
    ),
    [BLOCKS.EMBEDDED_ASSET]: (node: any) => {
      const { file, title } = node.data.target.fields;
      return (
        <img
          src={file.url}
          alt={title || 'Post image'}
          className="rounded-lg my-6 w-full"
        />
      );
    },
  },
};

export function PostBody({ body }: { body: any }) {
  return (
    <div className="prose dark:prose-invert max-w-none">
      {documentToReactComponents(body, renderOptions)}
    </div>
  );
}
```

### Paso 5: Actualizar Componentes

**Archivo**: `components/category/SubcategoryListPage.jsx`

```jsx
// Cambiar de:
const posts = fetchPosts(categorySlug, subcategorySlug);

// A:
import { getPostsBySubcategory } from '@/lib/contentful/posts';

export default async function SubcategoryListPage({ categorySlug, subcategorySlug }) {
  const { posts, total } = await getPostsBySubcategory(categorySlug, subcategorySlug, 20);

  // Renderizar posts reales
}
```

---

## Configuración en Contentful Dashboard

### 1. Crear Content Models

1. Ir a **Content model** en Contentful
2. Crear modelo "Post" con los campos especificados
3. Crear modelo "Category" (opcional)
4. Crear modelo "Subcategory" (opcional)

### 2. Configurar Validaciones

**Slug field**:
- Type: Short text
- Validation: Unique, Required, Matches pattern: `^[a-z0-9-]+$`

**Category field**:
- Type: Short text
- Validation: Required, Accepts only values:
  - `consumo-y-retail`
  - `entretenimiento-y-cultura`
  - `industria-ti`
  - `infraestructura-social`
  - `politica-y-leyes`
  - `sector-salud`

### 3. Configurar Media

- Crear carpeta "Posts" en Assets
- Optimizar imágenes (WebP recomendado)
- Tamaños recomendados:
  - Cover: 1200x630px
  - Gallery: 800x600px

---

## Migración de Datos

### Script de Migración (opcional)

**Archivo**: `scripts/migrate-to-contentful.ts`

```typescript
import { createClient } from 'contentful-management';

const client = createClient({
  accessToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN!,
});

async function migratePosts() {
  const space = await client.getSpace(process.env.CONTENTFUL_SPACE_ID!);
  const environment = await space.getEnvironment('master');

  // Ejemplo de creación de post
  const post = await environment.createEntry('post', {
    fields: {
      title: { 'es-MX': 'Título del post' },
      titleEn: { 'en-US': 'Post title' },
      slug: { 'es-MX': 'titulo-del-post' },
      category: { 'es-MX': 'consumo-y-retail' },
      subcategory: { 'es-MX': 'fabricantes-y-proveedores' },
      // ... más campos
    },
  });

  await post.publish();
  console.log('Post created:', post.sys.id);
}

migratePosts().catch(console.error);
```

---

## Next.js Integration Best Practices

### 1. ISR (Incremental Static Regeneration)

```typescript
// app/categoria/[category]/[subcategory]/page.tsx
export const revalidate = 3600; // Revalidar cada hora

export async function generateStaticParams() {
  // Generar rutas estáticas en build time
  return [
    { category: 'consumo-y-retail', subcategory: 'fabricantes-y-proveedores' },
    // ... todas las combinaciones
  ];
}
```

### 2. Webhook para Revalidación

**Archivo**: `app/api/revalidate/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');

  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  const { slug, category, subcategory } = await request.json();

  // Revalidar rutas específicas
  revalidatePath(`/categoria/${category}/${subcategory}`);
  if (slug) {
    revalidatePath(`/post/${slug}`);
  }

  return NextResponse.json({ revalidated: true });
}
```

**Configurar Webhook en Contentful**:
1. Settings → Webhooks → Add webhook
2. URL: `https://tripolimedia.com/api/revalidate?secret=YOUR_SECRET`
3. Triggers: Entry publish, unpublish, delete

---

## Testing

### 1. Crear Posts de Prueba

En Contentful Dashboard:
1. Content → Add entry → Post
2. Llenar campos obligatorios
3. Publish

### 2. Verificar en Local

```bash
npm run dev
# Navegar a /categoria/consumo-y-retail/fabricantes-y-proveedores
```

### 3. Verificar Rich Text Rendering

```typescript
// Test component
import { PostBody } from '@/components/post/PostBody';

const testRichText = {
  nodeType: 'document',
  content: [
    {
      nodeType: 'paragraph',
      content: [{ nodeType: 'text', value: 'Test content' }],
    },
  ],
};

<PostBody body={testRichText} />
```

---

## Troubleshooting

### Error: "CONTENTFUL_SPACE_ID is not defined"
- Verificar que `.env.local` está configurado
- Reiniciar servidor de desarrollo

### Error: "Access token is invalid"
- Verificar que usas el token correcto (Delivery API, no Management)
- Generar nuevo token en Contentful Settings

### Posts no se muestran
- Verificar que los posts están publicados (no en draft)
- Verificar que `category` y `subcategory` coinciden exactamente
- Verificar en Contentful API explorer: `https://app.contentful.com/spaces/YOUR_SPACE_ID/api`

### Rich Text no renderiza correctamente
- Instalar `@contentful/rich-text-react-renderer`
- Verificar que el campo es tipo "Rich text" en Contentful
- Revisar renderOptions en componente

---

## Recursos

- [Contentful JavaScript SDK](https://contentful.github.io/contentful.js/)
- [Rich Text Rendering](https://www.contentful.com/developers/docs/javascript/tutorials/rendering-contentful-rich-text-with-javascript/)
- [Next.js + Contentful Guide](https://www.contentful.com/blog/render-contentful-content-in-nextjs/)
- [Contentful Management API](https://www.contentful.com/developers/docs/references/content-management-api/)

---

## Estimación de Esfuerzo

1. **Configurar Contentful Space**: 30 min
2. **Crear Content Models**: 1 hora
3. **Implementar cliente y queries**: 2 horas
4. **Actualizar componentes**: 3 horas
5. **Migrar posts existentes** (si aplica): Variable (depende de cantidad)
6. **Testing y ajustes**: 2 horas

**Total**: ~8-10 horas (sin contar migración de contenido)

---

## Checklist de Implementación

- [ ] Crear cuenta en Contentful
- [ ] Obtener credenciales y agregarlas a `.env.local`
- [ ] Crear Content Models en Contentful
- [ ] Implementar `lib/contentful/client.ts`
- [ ] Implementar `lib/contentful/posts.ts`
- [ ] Crear componente `PostBody.tsx` para Rich Text
- [ ] Actualizar `SubcategoryListPage.jsx`
- [ ] Actualizar `CategorySection.jsx`
- [ ] Configurar ISR y revalidación
- [ ] Crear webhook de Contentful
- [ ] Testing en local
- [ ] Crear posts de prueba en Contentful
- [ ] Deploy a staging
- [ ] Testing en staging
- [ ] Migrar contenido real
- [ ] Deploy a producción
