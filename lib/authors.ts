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
        role: "Director de Tripoli Media",
        bio: "Licenciado en Ciencias de la Comunicación por el ITESO, especializado en crear narrativas y estructuras comunicativas, así como servicios de analítica de datos y administrativos. Con experiencia en industrias de cadenas de suministro, entretenimiento y tecnología. Actualmente dirige el ecosistema de servicios de Tripoli Media y su área editorial.",
        photoUrl: "/authors/moises-monraz.png",
    },
    {
        slug: "juan-ignacio-armenta",
        name: "Juan Ignacio Armenta",
        role: "Coordinador Servicios Contables",
        bio: "Licenciado en Contaduría y Gobierno Corporativo, especializado en estructura financiera, cumplimiento fiscal y generación de información estratégica. Actualmente colabora en EisnerAmper en la elaboración de estados financieros bajo estándares internacionales y en la gestión operativa y seguimiento financiero de clientes.",
        photoUrl: "/authors/juan-ignacio-armenta.png",
    },
    {
        slug: "ricardo-nunez-esparza",
        name: "Ricardo Núñez Esparza",
        role: "Coordinador Servicios Audiovisuales",
        bio: "Licenciado en Comunicación Audiovisual, especializado en producción y dirección audiovisual, dirección creativa y ejecución de proyectos. Director de Noema Estudio.",
        photoUrl: "/authors/ricardo-nunez.png",
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
        slug: "gonzalo-sanchez-patino",
        name: "Gonzalo Sánchez Patiño",
        role: "Coordinador de Aceleración Digital en Tripoli",
        bio: "Especialista en transformación digital con enfoque en ejecución, adopción y resultados de negocio. Actualmente consultor en London Consulting Group, liderando proyectos de analítica, ciberseguridad, automatización e inteligencia artificial.",
        photoUrl: "/authors/izcoatl-sanchez.png",
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
        bio: "Abogado patronal especializado en derecho corporativo y relaciones laborales individuales y colectivas. Conductor del programa Legalmente Hablado y asociado en el despacho Barbosa & Huerga.",
        photoUrl: "/authors/emiliano-mendez-alonso.png",
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
    if (!name) return null;
    const lowerName = name.toLowerCase().trim();
    
    // Alias for Moisés Monraz (standardizing to the full slug)
    if (lowerName === "moises monraz" || lowerName === "moisés monraz") {
        return "moises-monraz-escoto";
    }

    // Alias for Gonzalo Sánchez Patiño (formerly Izcóatl Sánchez)
    if (lowerName === "izcoatl sanchez" || lowerName === "izcóatl sánchez" ||
        lowerName === "izcoatl sanchez patino" || lowerName === "izcóatl sánchez patiño") {
        return "gonzalo-sanchez-patino";
    }

    const found = specialAuthors.find(
        (a) => a.name.toLowerCase() === lowerName
    );
    return found ? found.slug : null;
}
