import FavoritosClient from "./FavoritosClient";

export const metadata = {
    title: "Favoritos",
    description: "Artículos que has guardado como favoritos en Tripoli Media.",
};

export default function FavoritosPage() {
    return <FavoritosClient />;
}
