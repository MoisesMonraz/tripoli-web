"use client";

import { useMemo } from "react";
import { useLanguage } from "../../components/LanguageProvider";

const content = {
  ES: [
    "Tripoli Media, proyecto digital en proceso de constitución, informa que los datos personales que, en su caso, sean recabados a través de este sitio web serán tratados de manera confidencial y utilizados únicamente para fines de contacto, atención a solicitudes, prestación de servicios, envío de información y seguimiento comercial, conforme a la legislación aplicable en materia de protección de datos personales.",
    "Asimismo, podemos recopilar de forma automática datos técnicos como dirección IP y ubicación aproximada (cuando el usuario lo autoriza) para fines de seguridad, analítica y mejora del servicio.",
    "El titular de los datos personales podrá ejercer en todo momento sus derechos de acceso, rectificación, cancelación u oposición (derechos ARCO), así como revocar el consentimiento otorgado para el tratamiento de sus datos, mediante solicitud enviada a los medios de contacto oficiales de Tripoli Media. El uso de este sitio web implica la aceptación del presente Aviso de Privacidad.",
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
