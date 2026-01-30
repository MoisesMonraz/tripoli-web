# SEO Setup Guide - Tripoli Media

## ✅ Implementación Completada (Automática)

Los siguientes archivos se han creado y están listos para producción:

### 1. Sitemap Dinámico
**Archivo**: [app/sitemap.ts](app/sitemap.ts)
- ✅ Genera automáticamente `sitemap.xml` en la raíz del dominio
- ✅ Incluye todas las rutas estáticas (26 URLs)
- ✅ Incluye todas las categorías y subcategorías
- ✅ Actualización automática de `lastModified`
- ✅ Prioridades y frecuencias de cambio optimizadas

**Acceso**: https://tripolimedia.com/sitemap.xml

### 2. Robots.txt Optimizado
**Archivo**: [app/robots.ts](app/robots.ts)
- ✅ Permite rastreo completo del sitio
- ✅ Bloquea endpoints sensibles (`/api/*`, `/_next/*`)
- ✅ Reglas específicas para Googlebot y Bingbot
- ✅ Bloquea bots scrapers (AhrefsBot, SemrushBot, etc.)
- ✅ Referencia automática al sitemap

**Acceso**: https://tripolimedia.com/robots.txt

### 3. Web App Manifest (PWA)
**Archivo**: [app/manifest.ts](app/manifest.ts)
- ✅ Configuración completa para instalación como PWA
- ✅ Definición de iconos y colores de tema
- ✅ Shortcuts para servicios y contacto
- ✅ Soporte para screenshots (desktop y mobile)
- ✅ Optimizado para App Stores

**Acceso**: https://tripolimedia.com/manifest.json

### 4. Metadata Completa
**Archivo**: [app/layout.js](app/layout.js)
- ✅ Open Graph tags completos
- ✅ Twitter Card metadata
- ✅ Canonical URLs
- ✅ Multi-idioma (ES/EN)
- ✅ Robot directives optimizadas
- ✅ Apple touch icons
- ✅ Template de títulos dinámicos

### 5. Structured Data (JSON-LD)
**Archivo**: [components/seo/StructuredData.jsx](components/seo/StructuredData.jsx)
- ✅ Organization schema
- ✅ Website schema
- ✅ Breadcrumb schema
- ✅ Local Business schema
- ✅ Integrado en homepage

---

## ⚠️ ACCIONES REQUERIDAS (Manual)

### 1. Crear Imágenes Open Graph

Necesitas crear las siguientes imágenes para compartir en redes sociales:

#### Imagen Principal (OG:Image)
**Archivo**: `public/og-image.jpg`
- **Dimensiones**: 1200x630px
- **Formato**: JPG o PNG
- **Tamaño máximo**: 8MB (recomendado <300KB)
- **Contenido sugerido**:
  - Logo de Tripoli Media
  - Tagline: "Plataforma de Medios Profesionales"
  - Colores de los 6 sectores
  - Fondo profesional con gradiente

#### Twitter Image
**Archivo**: `public/twitter-image.jpg`
- **Dimensiones**: 1200x675px (16:9)
- **Formato**: JPG o PNG
- **Similar a OG image** pero optimizado para Twitter

#### Favicon y App Icons
**Archivos necesarios**:
```
public/
├── favicon.ico (16x16, 32x32, 48x48)
├── apple-touch-icon.png (180x180)
├── icon-192.png (192x192)
└── icon-512.png (512x512)
```

**Herramientas recomendadas**:
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- [Favicon.io](https://favicon.io/)
- Figma/Canva para diseño de OG images

---

### 2. Screenshots para PWA (Opcional)

Para que la PWA se vea profesional al instalar:

**Archivos**:
```
public/
├── screenshot-desktop.png (1280x720)
└── screenshot-mobile.png (750x1334)
```

**Cómo crearlos**:
1. Abre https://tripolimedia.com en producción
2. Toma screenshot en escritorio (full viewport)
3. Toma screenshot en móvil (iPhone 8 size)
4. Guarda en `public/`

---

### 3. Google Search Console

#### Paso 1: Verificar Propiedad
1. Ir a [Google Search Console](https://search.google.com/search-console)
2. Agregar propiedad: `tripolimedia.com`
3. Método de verificación: **HTML tag**
4. Copiar código de verificación
5. Actualizar en [app/layout.js:91](app/layout.js#L91):

```javascript
verification: {
  google: 'tu-codigo-aqui', // Reemplazar
},
```

#### Paso 2: Enviar Sitemap
1. Una vez verificado, ir a **Sitemaps**
2. Agregar sitemap: `https://tripolimedia.com/sitemap.xml`
3. Enviar

#### Paso 3: Solicitar Indexación
1. Ir a **Inspección de URLs**
2. Ingresar: `https://tripolimedia.com`
3. Click en **Solicitar indexación**
4. Repetir para:
   - `/servicios`
   - `/contacto`
   - `/conocenos`

---

### 4. Actualizar Datos de Contacto

Varios archivos tienen datos placeholder que deben actualizarse:

#### En [components/seo/StructuredData.jsx](components/seo/StructuredData.jsx):

**Líneas a actualizar**:
```javascript
// Línea 16
telephone: '+52-55-XXXX-XXXX', // ← TU NÚMERO REAL

// Líneas 31-36 - Dirección física
streetAddress: 'Calle Ejemplo 123, Col. Centro',
addressLocality: 'Ciudad de México',
addressRegion: 'CDMX',
postalCode: '06000',

// Líneas 90-91 - Coordenadas GPS (Google Maps)
latitude: 19.4326,  // ← TU LATITUD
longitude: -99.1332, // ← TU LONGITUD
```

**Cómo obtener coordenadas**:
1. Abre Google Maps
2. Click derecho en tu ubicación
3. Copia las coordenadas (primer valor = latitud, segundo = longitud)

#### En [app/layout.js](app/layout.js):

**Twitter handle**:
```javascript
// Línea 61
creator: '@tripolimedia', // ← TU HANDLE REAL
```

---

### 5. Bing Webmaster Tools (Opcional)

1. Ir a [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. Agregar sitio: `tripolimedia.com`
3. Verificar con código en `<head>` o XML file
4. Enviar sitemap: `https://tripolimedia.com/sitemap.xml`

---

### 6. Schema.org Validator

Después de actualizar datos de contacto, validar:

1. Ir a [Schema.org Validator](https://validator.schema.org/)
2. Ingresar URL: `https://tripolimedia.com`
3. Verificar que no hay errores en JSON-LD
4. Corregir warnings si los hay

---

### 7. Open Graph Debugger

Verificar que las imágenes OG se muestran correctamente:

#### Facebook OG Debugger
1. Ir a [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
2. Ingresar: `https://tripolimedia.com`
3. Click **Scrape Again**
4. Verificar preview

#### Twitter Card Validator
1. Ir a [Twitter Card Validator](https://cards-dev.twitter.com/validator)
2. Ingresar: `https://tripolimedia.com`
3. Verificar preview

#### LinkedIn Post Inspector
1. Ir a [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)
2. Ingresar: `https://tripolimedia.com`
3. Verificar preview

---

## 📊 Testing Post-Deploy

### 1. Verificar Sitemap
```bash
curl https://tripolimedia.com/sitemap.xml
```
**Esperado**: XML con todas las URLs

### 2. Verificar Robots.txt
```bash
curl https://tripolimedia.com/robots.txt
```
**Esperado**: Rules y referencia a sitemap

### 3. Verificar Manifest
```bash
curl https://tripolimedia.com/manifest.json
```
**Esperado**: JSON con configuración PWA

### 4. Lighthouse SEO Audit
1. Abrir Chrome DevTools (F12)
2. Tab **Lighthouse**
3. Seleccionar **SEO**
4. **Generate report**
5. **Target**: Score > 95

### 5. Structured Data Testing
1. Abrir [Rich Results Test](https://search.google.com/test/rich-results)
2. Ingresar: `https://tripolimedia.com`
3. Verificar que detecta:
   - Organization
   - Website
   - Breadcrumb
   - Local Business

---

## 🚀 Optimizaciones Avanzadas (Futuro)

### 1. Core Web Vitals
Monitorear y optimizar:
- **LCP** (Largest Contentful Paint): <2.5s
- **FID** (First Input Delay): <100ms
- **CLS** (Cumulative Layout Shift): <0.1

**Herramientas**:
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [Web Vitals Extension](https://chrome.google.com/webstore/detail/web-vitals/)

### 2. Google Analytics 4
Ya tienes Firebase Analytics configurado (`G-S6QMRLJFLC`), pero considera:
- Configurar eventos personalizados
- Tracking de conversiones (Cal.com bookings)
- Funnels de navegación por categoría

### 3. Google Tag Manager
Para gestionar tags sin tocar código:
1. Crear cuenta GTM
2. Instalar container en `<head>`
3. Migrar GA4 a GTM
4. Configurar triggers para eventos

### 4. Canonical Tags Dinámicos
Para páginas de categorías con paginación:
```typescript
export async function generateMetadata({ params, searchParams }) {
  const page = searchParams.page || 1;
  const canonical = page > 1
    ? `https://tripolimedia.com/categoria/${params.slug}?page=${page}`
    : `https://tripolimedia.com/categoria/${params.slug}`;

  return {
    alternates: { canonical },
  };
}
```

### 5. AMP (Accelerated Mobile Pages)
Para posts individuales (futuro con Contentful):
- Crear versión AMP de artículos
- Link rel="amphtml" en versión regular

---

## 📝 Checklist de SEO

### Pre-Deploy
- [x] Sitemap.xml generado dinámicamente
- [x] Robots.txt configurado
- [x] Manifest.json para PWA
- [x] Metadata en layout.js
- [x] Open Graph tags
- [x] Twitter Cards
- [x] Structured Data (JSON-LD)
- [ ] Imágenes OG creadas y subidas
- [ ] Favicon y app icons generados
- [ ] Datos de contacto actualizados en schemas

### Post-Deploy
- [ ] Google Search Console verificado
- [ ] Sitemap enviado a GSC
- [ ] URLs principales indexadas
- [ ] Bing Webmaster Tools configurado
- [ ] Schema validator sin errores
- [ ] OG Debugger (Facebook) validado
- [ ] Twitter Card Validator sin errores
- [ ] Lighthouse SEO score > 95
- [ ] Core Web Vitals en verde

### Mantenimiento Mensual
- [ ] Revisar Google Search Console errores
- [ ] Verificar posiciones de keywords
- [ ] Analizar tráfico orgánico en GA4
- [ ] Actualizar contenido obsoleto
- [ ] Revisar broken links
- [ ] Monitorear backlinks (Google Search Console)

---

## 🔍 Keywords Target

Basado en tu contenido, enfócate en:

**Keywords principales**:
- "medios profesionales méxico"
- "noticias empresariales méxico"
- "análisis sectorial méxico"
- "agencias de medios"

**Keywords por categoría**:
- **Consumo**: "noticias retail méxico", "sector consumo"
- **Entretenimiento**: "industria entretenimiento méxico"
- **TI**: "noticias tecnología méxico", "industria ti"
- **Infraestructura**: "desarrollo inmobiliario méxico"
- **Política**: "análisis político méxico"
- **Salud**: "sector salud méxico", "noticias salud"

**Long-tail keywords**:
- "plataforma de noticias para agencias"
- "análisis de datos sector retail"
- "servicios editoriales profesionales"

---

## 📚 Recursos Adicionales

- [Next.js SEO Guide](https://nextjs.org/learn/seo/introduction-to-seo)
- [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Schema.org Documentation](https://schema.org/docs/documents.html)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [PWA Checklist](https://web.dev/pwa-checklist/)

---

## 🆘 Soporte

Si necesitas ayuda con alguno de estos pasos, puedo:
1. Generar los schemas específicos para tus datos reales
2. Crear templates de imágenes OG en Figma
3. Optimizar metadata para keywords específicos
4. Configurar eventos personalizados en GA4
5. Implementar tracking de conversiones

**¿Necesitas asistencia con alguna tarea específica?**
