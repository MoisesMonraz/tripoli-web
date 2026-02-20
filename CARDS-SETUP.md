# Configuración de Tarjetas Digitales — Wallet Integrations

Guía paso a paso para configurar Apple Wallet y Google Wallet con las tarjetas digitales de Tripoli Media.

## Estado actual

| Feature | Estado | Requisitos |
|---------|--------|------------|
| Tarjetas digitales | ✅ Funcional | Ninguno |
| vCard (.vcf) | ✅ Funcional | Ninguno |
| Imagen PNG | ✅ Funcional | Ninguno |
| Copiar / Compartir | ✅ Funcional | Ninguno |
| Códigos QR | ✅ Funcional | Ninguno |
| Apple Wallet | ⏳ Requiere configuración | Cuenta de Apple Developer ($99/año) |
| Google Wallet | ⏳ Requiere configuración | Google Cloud Project + Wallet API |

---

## Apple Wallet (.pkpass)

### Prerequisitos

- Cuenta de **Apple Developer Program** ($99 USD/año)
- macOS con Keychain Access (para generar certificados)

### Paso 1 — Crear un Pass Type ID

1. Ir a [Apple Developer Portal](https://developer.apple.com/account)
2. Navegar a **Certificates, Identifiers & Profiles** → **Identifiers**
3. Click en **+** → seleccionar **Pass Type IDs**
4. Descripción: `Tripoli Media Business Cards`
5. Identifier: `pass.media.tripoli.cards`
6. Registrar

### Paso 2 — Crear el certificado de firma

1. En el mismo portal, ir a **Certificates** → **+**
2. Seleccionar **Pass Type ID Certificate**
3. Elegir el Pass Type ID creado en Paso 1
4. Seguir las instrucciones para generar un CSR desde Keychain Access
5. Subir el CSR y descargar el certificado (.cer)
6. Doble click para instalar en Keychain Access

### Paso 3 — Exportar las llaves

Desde Keychain Access:

1. Encontrar el certificado del pass → click derecho → **Export**
2. Exportar como `.p12` (incluye llave privada)
3. Convertir a PEM:
   ```bash
   # Extraer certificado
   openssl pkcs12 -in pass.p12 -clcerts -nokeys -out pass-cert.pem

   # Extraer llave privada
   openssl pkcs12 -in pass.p12 -nocerts -out pass-key.pem
   ```

4. Descargar el certificado WWDR G4 de Apple:
   ```bash
   curl -o wwdr.pem https://www.apple.com/certificateauthority/AppleWWDRCAG4.pem
   ```

### Paso 4 — Configurar variables de entorno

Agregar a `.env.local`:

```env
APPLE_PASS_TYPE_ID=pass.media.tripoli.cards
APPLE_TEAM_ID=TU_TEAM_ID_AQUI
APPLE_CERT="-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"
APPLE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
APPLE_WWDR="-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"
```

> **Nota:** El Team ID se encuentra en Apple Developer Portal → Membership.

### Paso 5 — Instalar passkit-generator

```bash
npm install passkit-generator
```

### Paso 6 — Crear el modelo de pase

Crear la carpeta `pass-models/tripoli-card.pass/` con:

- `pass.json` — Definición del pase
- `icon.png` — Logo 29×29 px
- `icon@2x.png` — Logo 58×58 px
- `logo.png` — Logo para el pase 160×50 px
- `logo@2x.png` — Logo 320×100 px

---

## Google Wallet

### Prerequisitos

- Cuenta de Google Cloud con facturación habilitada
- Acceso a [Google Pay & Wallet Console](https://pay.google.com/business/console)

### Paso 1 — Habilitar la API

1. Ir a [Google Cloud Console](https://console.cloud.google.com)
2. Crear o seleccionar un proyecto
3. Navegar a **APIs & Services** → **Library**
4. Buscar **Google Wallet API** y habilitarla

### Paso 2 — Crear una cuenta de servicio

1. En Google Cloud Console → **IAM & Admin** → **Service Accounts**
2. Click **Create Service Account**
3. Nombre: `tripoli-wallet`
4. Rol: no es necesario asignar roles del proyecto
5. Click **Create Key** → seleccionar **JSON**
6. Descargar el archivo JSON

### Paso 3 — Configurar el Issuer ID

1. Ir a [Google Pay & Wallet Console](https://pay.google.com/business/console)
2. Navegar a **Google Wallet API**
3. Copiar el **Issuer ID** (número)
4. En **Manage** → agregar el email de la cuenta de servicio como usuario

### Paso 4 — Configurar variables de entorno

Del archivo JSON descargado, extraer `client_email` y `private_key`.

Agregar a `.env.local`:

```env
GOOGLE_ISSUER_ID=1234567890
GOOGLE_SERVICE_ACCOUNT_EMAIL=tripoli-wallet@project-id.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
```

### Paso 5 — Instalar jsonwebtoken

```bash
npm install jsonwebtoken @types/jsonwebtoken
```

---

## Verificación

### Probar Apple Wallet (después de configurar)

```bash
curl http://localhost:3000/api/cards/pass/card-001
```

Debe retornar un archivo `.pkpass` descargable.

### Probar Google Wallet (después de configurar)

```bash
curl http://localhost:3000/api/cards/google-pass/card-001
```

Debe retornar un JSON con `{ url: "https://pay.google.com/gp/v/save/..." }`.

### Sin configurar

Ambas rutas retornarán un JSON con `status: 501` indicando qué variables faltan. El cliente mostrará automáticamente la opción de guardar como vCard en su lugar.

---

## Rutas API

| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/cards/pass/[id]` | GET | Genera .pkpass para Apple Wallet |
| `/api/cards/google-pass/[id]` | GET | Genera URL para Google Wallet |
