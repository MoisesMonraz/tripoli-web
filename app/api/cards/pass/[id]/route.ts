import { NextRequest, NextResponse } from "next/server";

/*
 * ═══════════════════════════════════════════════════════════════════════
 * Apple Wallet Pass (pkpass) Generation API Route
 * ═══════════════════════════════════════════════════════════════════════
 *
 * This route generates a .pkpass file for Apple Wallet.
 *
 * REQUIRED ENVIRONMENT VARIABLES:
 * ───────────────────────────────
 * APPLE_CERT           — PEM-encoded pass signing certificate
 *                         Obtain from Apple Developer Portal → Certificates,
 *                         Identifiers & Profiles → Pass Type IDs
 *
 * APPLE_KEY            — PEM-encoded private key for the certificate
 *                         Generated when you created the CSR for the certificate
 *
 * APPLE_WWDR           — Apple Worldwide Developer Relations (WWDR) certificate
 *                         Download from: https://www.apple.com/certificateauthority/
 *                         Use the G4 certificate for new passes
 *
 * APPLE_PASS_TYPE_ID   — Your Pass Type Identifier (e.g., "pass.media.tripoli.cards")
 *                         Register at Apple Developer Portal → Identifiers → Pass Type IDs
 *
 * APPLE_TEAM_ID        — Your Apple Developer Team ID
 *                         Found in Apple Developer Portal → Membership
 *
 * SETUP INSTRUCTIONS:
 * See CARDS-SETUP.md in the project root for detailed step-by-step instructions.
 *
 * Until these credentials are configured, this route will return a JSON error
 * with status 501 and instructions to set up the credentials.
 * The client-side fallback will offer a vCard download instead.
 * ═══════════════════════════════════════════════════════════════════════
 */

// Import the card data to find the card by ID
import { sampleCards } from "@/data/cards";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    // ── Check environment variables ──
    const APPLE_CERT = process.env.APPLE_CERT;
    const APPLE_KEY = process.env.APPLE_KEY;
    const APPLE_WWDR = process.env.APPLE_WWDR;
    const APPLE_PASS_TYPE_ID = process.env.APPLE_PASS_TYPE_ID;
    const APPLE_TEAM_ID = process.env.APPLE_TEAM_ID;

    const missingVars: string[] = [];
    if (!APPLE_CERT) missingVars.push("APPLE_CERT");
    if (!APPLE_KEY) missingVars.push("APPLE_KEY");
    if (!APPLE_WWDR) missingVars.push("APPLE_WWDR");
    if (!APPLE_PASS_TYPE_ID) missingVars.push("APPLE_PASS_TYPE_ID");
    if (!APPLE_TEAM_ID) missingVars.push("APPLE_TEAM_ID");

    if (missingVars.length > 0) {
        return NextResponse.json(
            {
                error: "Apple Wallet no configurado",
                message:
                    "Los certificados de Apple Wallet no están configurados. " +
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

    // ── Generate pass ──
    try {
        /*
         * NOTE: passkit-generator requires additional setup:
         * 1. Install: npm install passkit-generator
         * 2. Create a pass model directory with pass.json, icon.png, etc.
         * 3. Configure the pass template
         *
         * The code below is a reference implementation.
         * Uncomment and adapt once certificates are configured.
         */

        // const { PKPass } = await import("passkit-generator");
        //
        // const pass = new PKPass(
        //   {}, // pass model buffers
        //   {
        //     wwdr: APPLE_WWDR,
        //     signerCert: APPLE_CERT,
        //     signerKey: APPLE_KEY,
        //   },
        //   {
        //     serialNumber: card.id,
        //     passTypeIdentifier: APPLE_PASS_TYPE_ID,
        //     teamIdentifier: APPLE_TEAM_ID,
        //     organizationName: "Tripoli Media",
        //     description: `Tarjeta de ${card.name}`,
        //     foregroundColor: "rgb(255, 255, 255)",
        //     backgroundColor: card.accentColor,
        //   }
        // );
        //
        // pass.type = "generic";
        // pass.primaryFields.push({ key: "name", label: "Nombre", value: card.name });
        // pass.secondaryFields.push({ key: "position", label: "Puesto", value: card.position });
        // pass.auxiliaryFields.push({ key: "department", label: "Departamento", value: card.department });
        // pass.backFields.push(
        //   { key: "email", label: "Email", value: card.email },
        //   { key: "phone", label: "Teléfono", value: card.phone },
        //   { key: "website", label: "Sitio web", value: "tripoli.media" }
        // );
        //
        // const buffer = pass.getAsBuffer();
        //
        // return new NextResponse(buffer, {
        //   status: 200,
        //   headers: {
        //     "Content-Type": "application/vnd.apple.pkpass",
        //     "Content-Disposition": `attachment; filename="${card.name.replace(/\s+/g, "_")}.pkpass"`,
        //   },
        // });

        // Placeholder until passkit-generator is installed and configured
        return NextResponse.json(
            {
                error: "Apple Wallet en desarrollo",
                message:
                    "La generación de pases está preparada pero requiere " +
                    "instalar passkit-generator y configurar el modelo de pase. " +
                    "Consulta CARDS-SETUP.md para más detalles.",
                fallback: "vcard",
            },
            { status: 501 }
        );
    } catch (error) {
        console.error("Apple Wallet pass generation failed:", error);
        return NextResponse.json(
            {
                error: "Error al generar el pase",
                message: "Ocurrió un error al generar el pase de Apple Wallet.",
                fallback: "vcard",
            },
            { status: 500 }
        );
    }
}
