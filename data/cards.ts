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
        name: "Emiliano Méndez Alonso",
        position: "Director General",
        department: "Dirección Ejecutiva",
        email: "emiliano@tripoli.media",
        phone: "+52 33 1234 5678",
        whatsapp: "+52 33 1234 5678",
        linkedin: "https://linkedin.com/in/emiliano-mendez",
        accentColor: "#00BFFF",
    },
    {
        id: "card-002",
        name: "Juan Ignacio Armenta",
        position: "Editor en Jefe",
        department: "Editorial",
        email: "juan.armenta@tripoli.media",
        phone: "+52 33 9876 5432",
        whatsapp: "+52 33 9876 5432",
        linkedin: "https://linkedin.com/in/juan-armenta",
        accentColor: "#009640",
    },
    {
        id: "card-003",
        name: "Sofía Castillo Reyes",
        position: "Directora de Estrategia Digital",
        department: "Estrategia y Analítica",
        email: "sofia.castillo@tripoli.media",
        phone: "+52 33 5555 1234",
        linkedin: "https://linkedin.com/in/sofia-castillo",
        accentColor: "#e6007e",
    },
];
