/**
 * Special authors registry for Tripoli Media.
 * Authors listed here get their own profile page at /[slug]
 * and have their names linked in article cards.
 */

export interface Author {
    slug: string;
    name: string;
    role: string;
    bio: string;
    photoUrl: string;
    email?: string;
    social?: {
        twitter?: string;
        linkedin?: string;
        instagram?: string;
    };
}

export const specialAuthors: Author[] = [
    {
        slug: "juan-ignacio-armenta",
        name: "Juan Ignacio Armenta",
        role: "Autor",
        bio: "Presentación de Juan Ignacio Armenta. Este texto debe ser reemplazado con la biografía real del autor.",
        photoUrl: "/authors/juan-ignacio-armenta.jpg",
    },
    {
        slug: "emiliano-mendez-alonso",
        name: "Emiliano Méndez Alonso",
        role: "Autor",
        bio: "Presentación de Emiliano Méndez Alonso. Este texto debe ser reemplazado con la biografía real del autor.",
        photoUrl: "/authors/emiliano-mendez-alonso.jpg",
    },
];

/** Look up an author by their URL slug. */
export function getAuthorBySlug(slug: string): Author | undefined {
    return specialAuthors.find((a) => a.slug === slug);
}

/** Returns true if the slug matches a known special author. */
export function isSpecialAuthor(slug: string): boolean {
    return specialAuthors.some((a) => a.slug === slug);
}

/**
 * Given an author display name, return their page slug if they are a special author.
 * Returns null for "Tripoli Publishing House" and other default authors.
 */
export function getAuthorSlugByName(name: string): string | null {
    const found = specialAuthors.find(
        (a) => a.name.toLowerCase() === name.toLowerCase()
    );
    return found ? found.slug : null;
}
