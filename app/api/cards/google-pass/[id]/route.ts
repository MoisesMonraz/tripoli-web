import { NextRequest, NextResponse } from "next/server";

/*
 * ═══════════════════════════════════════════════════════════════════════
 * Google Wallet Pass Generation API Route
 * ═══════════════════════════════════════════════════════════════════════
 *
 * This route generates a Google Wallet "Add to Wallet" link/JWT.
 *
 * REQUIRED ENVIRONMENT VARIABLES:
 * ───────────────────────────────
 * GOOGLE_SERVICE_ACCOUNT_EMAIL — Google Cloud service account email
 *                                 Format: name@project-id.iam.gserviceaccount.com
 *                                 Create at: Google Cloud Console → IAM → Service Accounts
 *
 * GOOGLE_SERVICE_ACCOUNT_KEY   — PEM-encoded private key for the service account
 *                                 Download the JSON key file from Google Cloud Console,
 *                                 extract the "private_key" field
 *
 * GOOGLE_ISSUER_ID             — Google Wallet Issuer ID
 *                                 Obtain from: Google Pay & Wallet Console
 *                                 (https://pay.google.com/business/console)
 *                                 Navigate to Google Wallet API → Issuer ID
 *
 * SETUP INSTRUCTIONS:
 * See CARDS-SETUP.md in the project root for detailed step-by-step instructions.
 *
 * Until these credentials are configured, this route will return a JSON error
 * with status 501 and instructions to set up the credentials.
 * The client-side fallback will offer a vCard download instead.
 * ═══════════════════════════════════════════════════════════════════════
 */

import { sampleCards } from "@/data/cards";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    // ── Check environment variables ──
    const GOOGLE_SA_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const GOOGLE_SA_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    const GOOGLE_ISSUER_ID = process.env.GOOGLE_ISSUER_ID;

    const missingVars: string[] = [];
    if (!GOOGLE_SA_EMAIL) missingVars.push("GOOGLE_SERVICE_ACCOUNT_EMAIL");
    if (!GOOGLE_SA_KEY) missingVars.push("GOOGLE_SERVICE_ACCOUNT_KEY");
    if (!GOOGLE_ISSUER_ID) missingVars.push("GOOGLE_ISSUER_ID");

    if (missingVars.length > 0) {
        return NextResponse.json(
            {
                error: "Google Wallet no configurado",
                message:
                    "Las credenciales de Google Wallet no están configuradas. " +
                    "Consulta CARDS-SETUP.md para las instrucciones de configuración.",
                missing: missingVars,
                fallback: "vcard",
            },
            { status: 501 }
        );
    }

    // ── Find the card ──
    const card = sampleCards.find((c) => c.id === id);
    if (!card) {
        return NextResponse.json(
            { error: "Tarjeta no encontrada", message: `No se encontró la tarjeta con id "${id}".` },
            { status: 404 }
        );
    }

    // ── Generate Google Wallet pass ──
    try {
        /*
         * NOTE: Google Wallet integration requires:
         * 1. A Google Cloud project with the Wallet API enabled
         * 2. A service account with the Wallet API role
         * 3. An issuer account at pay.google.com/business/console
         *
         * The flow is:
         * 1. Create a GenericClass (template) for business cards
         * 2. Create a GenericObject (instance) for this specific card
         * 3. Sign a JWT with the service account key
         * 4. Return the "Add to Google Wallet" URL with the signed JWT
         *
         * Reference implementation below — uncomment when credentials are ready.
         */

        // const jwt = require("jsonwebtoken");
        //
        // const classId = `${GOOGLE_ISSUER_ID}.tripoli_business_card`;
        // const objectId = `${GOOGLE_ISSUER_ID}.${card.id}`;
        //
        // const genericObject = {
        //   id: objectId,
        //   classId: classId,
        //   genericType: "GENERIC_TYPE_UNSPECIFIED",
        //   hexBackgroundColor: card.accentColor,
        //   logo: {
        //     sourceUri: { uri: "https://tripoli.media/Imagenes/Logos/01.png" },
        //   },
        //   cardTitle: { defaultValue: { language: "es", value: "Tripoli Media" } },
        //   header: { defaultValue: { language: "es", value: card.name } },
        //   subheader: { defaultValue: { language: "es", value: card.position } },
        //   textModulesData: [
        //     { id: "department", header: "Departamento", body: card.department },
        //     { id: "email", header: "Email", body: card.email },
        //     { id: "phone", header: "Teléfono", body: card.phone },
        //   ],
        //   linksModuleData: {
        //     uris: [
        //       { uri: "https://tripoli.media", description: "Sitio web", id: "website" },
        //       ...(card.linkedin ? [{ uri: card.linkedin, description: "LinkedIn", id: "linkedin" }] : []),
        //     ],
        //   },
        // };
        //
        // const claims = {
        //   iss: GOOGLE_SA_EMAIL,
        //   aud: "google",
        //   origins: ["https://tripoli.media"],
        //   typ: "savetowallet",
        //   payload: { genericObjects: [genericObject] },
        // };
        //
        // const token = jwt.sign(claims, GOOGLE_SA_KEY, { algorithm: "RS256" });
        // const saveUrl = `https://pay.google.com/gp/v/save/${token}`;
        //
        // return NextResponse.json({ url: saveUrl });

        // Placeholder until Google Wallet credentials are configured
        return NextResponse.json(
            {
                error: "Google Wallet en desarrollo",
                message:
                    "La integración con Google Wallet está preparada pero requiere " +
                    "configurar las credenciales del servicio. " +
                    "Consulta CARDS-SETUP.md para más detalles.",
                fallback: "vcard",
            },
            { status: 501 }
        );
    } catch (error) {
        console.error("Google Wallet pass generation failed:", error);
        return NextResponse.json(
            {
                error: "Error al generar el pase",
                message: "Ocurrió un error al generar el pase de Google Wallet.",
                fallback: "vcard",
            },
            { status: 500 }
        );
    }
}
