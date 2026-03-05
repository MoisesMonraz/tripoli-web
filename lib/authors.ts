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
        slug: "moises-monraz-escoto",
        name: "Moisés Monraz Escoto",
        role: "Director General",
        bio: "Director General de Tripoli Media.",
        photoUrl: "/authors/moises-monraz.jpg",
    },
    {
        slug: "juan-ignacio-armenta",
        name: "Juan Ignacio Armenta",
        role: "Coordinador Servicios Contables",
        bio: "Especialista en contabilidad y gestión financiera.",
        photoUrl: "/authors/juan-ignacio-armenta.jpg",
    },
    {
        slug: "ricardo-nunez-esparza",
        name: "Ricardo Núñez Esparza",
        role: "Coordinador Servicios Audiovisuales",
        bio: "Especialista en producción audiovisual y contenido multimedia.",
        photoUrl: "/authors/ricardo-nunez.jpg",
    },
    {
        slug: "camila-aceves",
        name: "Cámila Aceves",
        role: "Coordinadora Consumo y Retail",
        bio: "Especialista en tendencias de consumo y mercado retail.",
        photoUrl: "/authors/camila-aceves.jpg",
    },
    {
        slug: "manuela-piza",
        name: "Manuela Piza",
        role: "Coordinadora Entretenimiento y Cultura",
        bio: "Especialista en gestión cultural y entretenimiento.",
        photoUrl: "/authors/manuela-piza.jpg",
    },
    {
        slug: "izcoatl-sanchez",
        name: "Izcóatl Sánchez",
        role: "Coordinador Industria TI",
        bio: "Especialista en tecnología de la información y transformación digital.",
        photoUrl: "/authors/izcoatl-sanchez.jpg",
    },
    {
        slug: "pablo-diaz-del-castillo",
        name: "Pablo Díaz del Castillo",
        role: "Coordinador Infraestructura Social",
        bio: "Especialista en desarrollo de infraestructura y proyectos sociales.",
        photoUrl: "/authors/pablo-diaz-del-castillo.jpg",
    },
    {
        slug: "emiliano-mendez-alonso",
        name: "Emiliano Méndez Alonso",
        role: "Coordinador Política y Leyes",
        bio: "Abogado patronal especializado en materia laboral. Actualmente se desempeña como conductor del programa Legalmente Hablado y es asociado en el despacho Barbosa & Huerga. Cuenta con experiencia en derecho corporativo y en la gestión estratégica de relaciones laborales, tanto individuales como colectivas.",
        photoUrl: "/authors/emiliano-mendez-alonso.jpg",
    },
    {
        slug: "sofia-pelayo",
        name: "Sofía Pelayo",
        role: "Coordinadora Sector Salud",
        bio: "Especialista en gestión de servicios de salud.",
        photoUrl: "/authors/sofia-pelayo.jpg",
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
