"use client";

import { useMemo } from "react";
import { useLanguage } from "../../components/LanguageProvider";

const content = {
  ES: [
    "I. IDENTIDAD Y DOMICILIO DEL RESPONSABLE",
    "TRIPOLI MEDIA (en adelante \"El Responsable\"), con domicilio para oír y recibir notificaciones en P.º de los Virreyes 45, Puerta de Hierro, C.P. 45116, Zapopan, Jalisco, es el responsable del uso y protección de sus datos personales, y al respecto le informa lo siguiente:",
    "II. FINALIDADES DEL TRATAMIENTO",
    "Los datos personales que recabamos de usted, los utilizaremos para las siguientes finalidades que son necesarias para el servicio que solicita:",
    "- Verificar su identidad y permitir el registro de su cuenta de usuario.",
    "- Proveer los servicios informativos, envío de newsletters y contenido editorial.",
    "- Gestionar su acceso como suscriptor o invitado a la plataforma.",
    "De manera adicional, utilizaremos su información personal para las siguientes finalidades secundarias que nos permiten brindarle una mejor atención:",
    "- Prospección comercial, análisis estadístico y mercadotecnia.",
    "En caso de que no desee que sus datos personales sean tratados para estos fines secundarios, usted puede presentar desde este momento un escrito vía correo electrónico.",
    "III. DATOS RECABADOS",
    "Para llevar a cabo las finalidades descritas, utilizaremos: Nombre completo, correo electrónico, datos de navegación (Cookies, dirección IP, ubicación aproximada) y datos de autenticación a través de redes sociales (Google Auth) cuando usted elija esa vía de registro.",
    "IV. DERECHOS ARCO Y REVOCACIÓN DEL CONSENTIMIENTO",
    "Usted tiene derecho a conocer qué datos personales tenemos de usted, para qué los utilizamos y las condiciones del uso que les damos (Acceso). Asimismo, es su derecho solicitar la corrección de su información personal en caso de que esté desactualizada, sea inexacta o incompleta (Rectificación); que la eliminemos de nuestros registros o bases de datos cuando considere que la misma no está siendo utilizada adecuadamente (Cancelación); así como oponerse al uso de sus datos personales para fines específicos (Oposición).",
    "Para el ejercicio de cualquiera de los derechos ARCO, usted deberá presentar la solicitud respectiva enviando un correo electrónico a: contacto@tripoli.media.",
    "V. USO DE COOKIES Y RASTREADORES",
    "Le informamos que en nuestra página de Internet utilizamos cookies, web beacons y otras tecnologías a través de las cuales es posible monitorear su comportamiento como usuario de Internet, para brindarle un mejor servicio y experiencia de usuario al navegar en nuestra página.",
    "VI. CAMBIOS AL AVISO DE PRIVACIDAD",
    "El presente aviso de privacidad puede sufrir modificaciones, cambios o actualizaciones derivadas de nuevos requerimientos legales; de nuestras propias necesidades por los productos o servicios que ofrecemos; de nuestras prácticas de privacidad; de cambios en nuestro modelo de negocio, o por otras causas. Nos comprometemos a mantenerlo informado sobre los cambios que pueda sufrir el presente aviso de privacidad a través de nuestro sitio web: tripoli.media.",
    "Última actualización: Febrero 2026.",
  ],
  EN: [
    "Tripoli Media, a digital project in the process of incorporation, informs that any personal data collected through this website will be treated confidentially and used solely for contact, handling requests, service delivery, sending information, and commercial follow-up, in accordance with the applicable personal data protection laws.",
    "We may also automatically collect technical data such as IP address and approximate location (when authorized by the user) for security, analytics, and service improvement.",
    "The owner of the personal data may exercise at any time their rights of access, rectification, cancellation, or opposition (ARCO rights), as well as revoke consent granted for data processing, by sending a request to Tripoli Media's official contact channels. Use of this website implies acceptance of this Privacy Notice.",
  ],
};

export default function PrivacyBody() {
  const { language } = useLanguage();
  const isEN = language === "EN";
  const paragraphs = useMemo(() => (isEN ? content.EN : content.ES), [isEN]);

  return (
    <main className="flex flex-col gap-8 sm:gap-10 pb-12 sm:pb-16 pt-8 sm:pt-12 font-raleway bg-white dark:bg-slate-950">
      <section className="max-w-[70rem] mx-auto w-full px-5 sm:px-7 md:px-5">
        <div className="flex flex-col gap-2 sm:gap-3">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">{isEN ? "Privacy Notice" : "Aviso de Privacidad"}</p>
          <h1 className="text-xl sm:text-2xl lg:text-[28px] font-semibold uppercase bg-gradient-to-r from-[#0082b9] via-[#00b6ed] to-[#0082b9] bg-[length:200%_100%] bg-clip-text text-transparent animate-servicesTitleSweep">
            {isEN ? "Legal notice" : "Aviso legal"}
          </h1>
          <div className="text-[10px] sm:text-[15px] leading-relaxed text-slate-600 dark:text-slate-300 space-y-3 sm:space-y-4">
            {paragraphs.map((paragraph, idx) => (
              <p key={idx} className="text-justify">{paragraph}</p>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
