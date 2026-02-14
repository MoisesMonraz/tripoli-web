# Guía de Despliegue - Tripoli Media

## Pasos Críticos Post-Implementación

### 1. Desplegar Firestore Rules

**Archivo creado**: [firestore.rules](firestore.rules)

#### Opción A: Firebase Console (Recomendado)
1. Ir a [Firebase Console](https://console.firebase.google.com/)
2. Seleccionar proyecto `tripolimedia-f9812`
3. **Firestore Database** → **Rules**
4. Copiar contenido de `firestore.rules`
5. **Publish**

#### Opción B: Firebase CLI
```bash
# Instalar Firebase CLI (si no lo tienes)
npm install -g firebase-tools

# Login
firebase login

# Inicializar (solo primera vez)
firebase init firestore
# Seleccionar proyecto: tripolimedia-f9812
# Rules file: firestore.rules (ya existe)
# Indexes file: firestore.indexes.json

# Desplegar rules
firebase deploy --only firestore:rules
```

#### Verificar Rules Desplegadas:
1. Firebase Console → Firestore → Rules
2. Verificar que incluye las validaciones de email, phone, etc.
3. Test con:
```bash
curl -X POST https://tripolimedia.com/api/leads?test=1 \
  -H "Content-Type: application/json"
```

---

### 2. Variables de Entorno en Vercel

Asegurar que todas las variables están configuradas en Vercel Dashboard:

```env
# Firebase (Configuración pública segura)
NEXT_PUBLIC_FIREBASE_API_KEY=<tu_firebase_api_key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tripolimedia-f9812.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tripolimedia-f9812
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tripolimedia-f9812.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<tu_sender_id>
NEXT_PUBLIC_FIREBASE_APP_ID=<tu_app_id>
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=<tu_measurement_id>

# Gemini AI (CRÍTICO: MANTENER SECRETA)
GOOGLE_GEMINI_API_KEY=<tu_google_api_key_secreta>

# Firebase Admin (CRÍTICO: MANTENER SECRETO)
FIREBASE_PROJECT_ID=tripolimedia-f9812
FIREBASE_CLIENT_EMAIL=<service_account_email>
FIREBASE_PRIVATE_KEY="<service_account_private_key>"

# Contentful (cuando esté listo)
CONTENTFUL_SPACE_ID=<tu_space_id>
CONTENTFUL_ACCESS_TOKEN=<tu_access_token>
CONTENTFUL_PREVIEW_ACCESS_TOKEN=<tu_preview_token>
CONTENTFUL_ENVIRONMENT=master
```

#### Cómo obtener Firebase Admin credentials:

1. Firebase Console → Project Settings → Service Accounts
2. **Generate new private key**
3. Descargar JSON
4. Extraer:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (incluir saltos de línea: `"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"`)

---

### 3. Verificar Integración Cal.com

**Componente**: [components/contact/CalBookingEmbed.tsx](components/contact/CalBookingEmbed.tsx)

El agendamiento de citas está completamente delegado a Cal.com. Verifica:

1. **Cal.com Dashboard**: https://cal.com/dashboard
2. **Event Type configurado** con duración de 1 hora
3. **Disponibilidad** configurada según horarios de atención
4. **Notificaciones** activadas para recibir alertas de nuevas citas

**Widget en producción**:
- Página de contacto: `/contacto`
- Integración automática sin backend adicional
- Los leads se capturan vía `/api/leads` si el formulario lo envía

---

### 4. Testing Post-Deploy

#### Test 1: Leads Endpoint
```bash
curl -X POST https://tripolimedia.com/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "María González",
    "email": "maria@empresa.com",
    "phone": "+52 55 1234 5678",
    "service": "Editorial",
    "date": "2026-02-15",
    "time": "14:00"
  }'
```

**Esperado**:
- Status 200
- Lead guardado en Firestore
- Console log visible en Vercel logs

#### Test 2: Firestore Rules Validation
Intentar escribir sin validación:
```bash
curl -X POST https://tripolimedia.com/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "X",
    "email": "invalid-email"
  }'
```

**Esperado**: Status 400 con error de validación

#### Test 3: AI Chat Widget
1. Abrir sitio web
2. Click en botón flotante 🤖
3. Enviar mensaje: "¿Qué servicios ofrecen?"
4. Verificar respuesta con fuentes

#### Test 4: Cal.com Booking
1. Ir a `/contacto`
2. Verificar que Cal.com widget carga correctamente
3. Probar selección de fecha/hora
4. Completar booking de prueba
5. Verificar notificación recibida

---

### 5. Monitoreo Post-Deploy

#### Vercel Logs
```bash
vercel logs --follow
```

#### Firebase Console
- Firestore → Data → Verificar colección `leads`
- Authentication → Usage (si se implementa auth)
- Analytics → Dashboard

#### Cal.com Analytics
- Dashboard → Analytics
- Verificar tasa de conversión de bookings
- Revisar cancelaciones

---

### 6. Rollback Plan (Si algo falla)

#### Revertir Firestore Rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /leads/{leadId} {
      allow create: if true;
      allow read, update, delete: if false;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

#### Revertir Deployment Vercel:
```bash
vercel rollback
```

---

## Checklist de Despliegue

### Pre-Deploy
- [ ] Testing local de `/api/leads`
- [ ] Firestore rules probadas localmente (Firebase emulator)
- [ ] Variables de entorno verificadas
- [ ] Cal.com widget funcionando en local

### Deploy
- [ ] `git commit` y `push` a main
- [ ] Vercel auto-deploy completado
- [ ] Variables de entorno en Vercel configuradas
- [ ] Firestore rules desplegadas vía Console/CLI

### Post-Deploy
- [ ] Test endpoint `/api/leads` en producción
- [ ] Test validaciones (emails inválidos, campos faltantes)
- [ ] Test AI Chat widget
- [ ] Test Cal.com booking widget
- [ ] Verificar Firestore data en Console
- [ ] Verificar Vercel logs sin errores críticos
- [ ] Test responsive en mobile
- [ ] Test dark mode
- [ ] Test multi-idioma (ES/EN)

---

## Problemas Comunes y Soluciones

### Error: "Firestore permission denied"
**Causa**: Rules no desplegadas o incorrectas
**Solución**: Verificar en Firebase Console → Firestore → Rules

### Cal.com widget no carga
**Checklist**:
1. Verificar URL de Cal.com en componente
2. Revisar console del navegador para errores CORS
3. Verificar que el event type está público
4. Limpiar caché del navegador

### Error: "Invalid email format"
**Causa**: Validación estricta de regex
**Solución**: Verificar que el email cumple formato RFC 5322

### Rate limiting en AI Chat
**Causa**: >12 mensajes por minuto desde misma IP
**Solución**: Esperar 1 minuto o ajustar límite en [app/api/ai/chat/route.ts](app/api/ai/chat/route.ts)

### Leads no se guardan en Firestore
**Checklist**:
1. Verificar Firebase Admin credentials en Vercel
2. Verificar Firestore rules desplegadas
3. Revisar logs de Vercel para errores específicos
4. Probar endpoint de test: `/api/leads?test=1`

---

## Performance Optimization (Futuro)

### CDN para Imágenes
```typescript
// next.config.mjs
export default {
  images: {
    domains: ['images.ctfassets.net'], // Contentful
    formats: ['image/avif', 'image/webp'],
  },
};
```

### Edge Functions para AI Chat
Considerar mover `/api/ai/chat` a Vercel Edge:
```typescript
export const runtime = 'edge';
```

### Database Indexes
Crear índices en Firestore:
```
Collection: leads
Fields: createdAt (Descending), source (Ascending)
```

---

## Seguridad Adicional

### Rate Limiting Global
Considerar implementar rate limiting en middleware:
```typescript
// middleware.ts
import { ratelimit } from '@/lib/ratelimit';

export async function middleware(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return new Response('Too Many Requests', { status: 429 });
  }
}
```

### CORS Headers
Para APIs públicas:
```typescript
export async function POST(request: Request) {
  const response = NextResponse.json({ ... });
  response.headers.set('Access-Control-Allow-Origin', 'https://tripolimedia.com');
  return response;
}
```

### Input Sanitization
Ya implementado en:
- [app/api/leads/route.ts](app/api/leads/route.ts:39-44) - Sanitización XSS y validación completa

---

## Cal.com Configuration Best Practices

### Event Type Setup
1. **Duración**: 1 hora (configurable según necesidad)
2. **Buffer Time**: 15 min antes/después para preparación
3. **Límite diario**: Considerar máximo de reuniones por día
4. **Preguntas personalizadas**: Agregar campos relevantes (empresa, objetivo de la reunión)

### Notificaciones
1. **Email confirmación** al cliente
2. **Email reminder** 24h antes
3. **SMS reminder** (opcional, requiere integración)
4. **Webhook a Firestore** (futuro): Guardar bookings automáticamente

### Integración con Calendar
1. Conectar Google Calendar o Outlook
2. Verificar zona horaria (America/Mexico_City)
3. Configurar disponibilidad recurrente
4. Bloquear slots ocupados automáticamente

---

## Contacto para Issues

- **Firebase**: https://console.firebase.google.com/project/tripolimedia-f9812
- **Vercel**: https://vercel.com/dashboard
- **Cal.com**: https://cal.com/dashboard
- **Contentful** (futuro): https://app.contentful.com/
