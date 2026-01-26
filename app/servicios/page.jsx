import ServicesIntro from "../../components/servicios/ServicesIntro";
import ServicesList from "../../components/servicios/ServicesList";

export const metadata = {
  title: "Servicios | Tripoli Media",
};

export default function ServiciosPage() {
  return (
    <main className="flex flex-col gap-2.5 pb-16 pt-12 font-raleway">
      <ServicesIntro />
      <ServicesList />
    </main>
  );
}
