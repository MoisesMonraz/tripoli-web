import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

const CATEGORY_PATHS = [
  "/categoria/consumo-y-retail",
  "/categoria/entretenimiento-y-cultura",
  "/categoria/industria-ti",
  "/categoria/infraestructura-social",
  "/categoria/politica-y-leyes",
  "/categoria/sector-salud",
];

function revalidateRevistas() {
  revalidatePath("/revistas");
  revalidatePath("/revistas/[slug]", "page");
  revalidatePath("/[category]/[subcategory]/revista/[slug]", "page");
  revalidateTag("revistas");
  for (const p of CATEGORY_PATHS) revalidatePath(p);
  revalidatePath("/calendario");
  console.log("[revalidate] Revalidated revista paths:", [
    "/revistas",
    "/revistas/[slug]",
    "/[category]/[subcategory]/revista/[slug]",
    ...CATEGORY_PATHS,
    "/calendario",
  ]);
}

function revalidateBlogPosts() {
  revalidateTag("articles");
  for (const p of CATEGORY_PATHS) revalidatePath(p);
  revalidatePath("/calendario");
  console.log("[revalidate] Revalidated blogPost paths:", [
    ...CATEGORY_PATHS,
    "/calendario",
  ]);
}

export async function POST(request: NextRequest) {
  console.log("[revalidate] Incoming request from:", request.headers.get("x-forwarded-for") ?? "unknown");

  // Log all incoming headers
  const headersObj: Record<string, string> = {};
  request.headers.forEach((value, key) => { headersObj[key] = value; });
  console.log("[revalidate] Headers:", JSON.stringify(headersObj));

  // Secret check — optional when REVALIDATION_SECRET is not set (dev mode)
  const secret = request.headers.get("x-revalidation-secret")
    ?? request.nextUrl.searchParams.get("secret");
  const expectedSecret = process.env.REVALIDATION_SECRET;

  console.log("[revalidate] Secret received:", secret ?? "(none)");
  console.log("[revalidate] Secret expected:", expectedSecret ? "(set)" : "(not configured)");

  if (expectedSecret && secret !== expectedSecret) {
    console.log("[revalidate] Secret mismatch — rejecting request");
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  // Parse body
  let body: unknown;
  let rawBody = "";
  try {
    rawBody = await request.text();
    console.log("[revalidate] Raw body:", rawBody.slice(0, 500));
    body = rawBody ? JSON.parse(rawBody) : {};
  } catch (err) {
    console.log("[revalidate] Body parse error:", err);
    // Fallback: still revalidate revistas so the webhook isn't wasted
    revalidateRevistas();
    return NextResponse.json({ revalidated: true, note: "body parse failed, revalidated /revistas as fallback" });
  }

  const contentType = (body as { sys?: { contentType?: { sys?: { id?: string } } } })
    ?.sys?.contentType?.sys?.id;

  console.log("[revalidate] Contentful contentType:", contentType ?? "(not found in payload)");

  if (contentType === "revista") {
    revalidateRevistas();
  } else if (contentType === "blogPost") {
    revalidateBlogPosts();
  } else {
    // Unknown or missing content type — revalidate everything as fallback
    console.log("[revalidate] Unknown contentType, revalidating all as fallback");
    revalidateRevistas();
    revalidateBlogPosts();
  }

  const response = { revalidated: true, contentType: contentType ?? "unknown" };
  console.log("[revalidate] Done:", response);
  return NextResponse.json(response);
}
