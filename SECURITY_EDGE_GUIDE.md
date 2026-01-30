# Guía de WAF/Edge Rules (Cloudflare / Vercel)

Esta guía describe reglas recomendadas para bloquear abuso **antes** de llegar a la app.

## 1) Cloudflare (recomendado)

### 1.1 Rate Limiting (WAF)
- Ruta: `/api/ai/chat` → 30 req/min por IP
- Ruta: `/api/leads` → 20 req/min por IP
- Ruta: `/api/email` → 20 req/min por IP
- Ruta: `/api/access-gate/guest-lead` → 20 req/min por IP

### 1.2 Bot Fight Mode
- Actívalo en el dominio principal.
- Agrega excepción para `/api/*` si usas webhooks legítimos (con token).

### 1.3 Firewall Rules
Bloqueos sugeridos:
- Países no objetivo (si aplica).
- ASN problemáticos (si detectas abuso).
- User-Agents vacíos o sospechosos.

## 2) Vercel (Edge Config + Firewall)

### 2.1 Vercel Firewall
- Limita `/api/*` por IP.
- Activa protección contra DDoS.

### 2.2 Edge Middleware (opcional)
Si deseas más control, añade middleware para bloquear:
- Requests sin `Origin` en rutas públicas.
- Requests sin tokens en webhooks.

## 3) Buenas prácticas
- Mantén `ALLOWED_ORIGINS` configurado.
- Usa `TURNSTILE` o `reCAPTCHA` en formularios públicos.
- Usa `UPSTASH` para rate limit distribuido.
- Revisa logs y ajusta límites según tráfico real.

