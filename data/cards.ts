export interface BusinessCard {
    id: string;
    name: string;
    position: string;
    department: string;
    email: string;
    phone: string;
    whatsapp?: string;
    linkedin?: string;
    photo?: string;
    accentColor: string;
}

export const sampleCards: BusinessCard[] = [
    {
        id: "card-001",
        name: "Contacto",
        position: "Contacto General",
        department: "Tripoli Media",
        email: "contacto@tripoli.media",
        phone: "+52 33 2817 5756",
        linkedin: "https://www.linkedin.com/company/tripoli-media/",
        accentColor: "#009fe3",
    },
    {
        id: "card-002",
        name: "Moisés Monraz",
        position: "Director General",
        department: "Dirección General",
        email: "m.monraz@tripoli.media",
        phone: "+52 33 1804 5788",
        linkedin: "https://www.linkedin.com/in/mois%C3%A9s-monraz-escoto-b0a5812b2/",
        accentColor: "#8fabb6",
    },
    {
        id: "card-003",
        name: "J. Ignacio Armenta",
        position: "Coordinador Servicios Contables",
        department: "Contabilidad",
        email: "j.armenta@tripoli.media",
        phone: "+52 33 1413 3453",
        linkedin: "https://www.linkedin.com/in/juan-ignacio-armenta-reynoso/",
        accentColor: "#009a93",
    },
    {
        id: "card-004",
        name: "J. Ricardo Núñez",
        position: "Coordinador Servicios Audiovisuales",
        department: "Audiovisual",
        email: "r.nunez@tripoli.media",
        phone: "+52 33 1704 2340",
        linkedin: "https://www.linkedin.com/in/ricardo-nunez-magenta/",
        accentColor: "#951b81",
    },
    {
        id: "card-005",
        name: "Emiliano Méndez",
        position: "Coordinador Política y Leyes",
        department: "Política y Leyes",
        email: "e.mendez@tripoli.media",
        phone: "+52 33 1843 5513",
        linkedin: "https://www.linkedin.com/in/emiliano-mendez-alonso-519531227/",
        accentColor: "#312783",
    },
];
