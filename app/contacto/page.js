"use client";

import { useLanguage } from "../../components/LanguageProvider";
import AnimatedServiceBorderBox from "../../components/ui/AnimatedServiceBorderBox";
import CalBookingEmbed from "../../components/contact/CalBookingEmbed";

// Icons
const MapPin = ({ className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`h-6 w-6 ${className}`}
  >
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const Mail = ({ className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`h-6 w-6 text-slate-500 dark:text-white transition-colors ${className}`}
  >
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const Phone = ({ className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`h-6 w-6 text-slate-500 dark:text-white ${className}`}
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

export default function ContactoPage() {
  const { language } = useLanguage();
  const isEN = language === "EN";
  const copy = isEN
    ? {
        contactLabel: "Contact",
        contactTitle: "Get in touch with us",
        whatsappAria: "Send message via WhatsApp",
        emailAria: "Send email to contacto@tripoli.media (Gmail)",
        mapTitle: "Tripoli Media location",
        mapLinkAria: "Open address in Google Maps",
        addressLabel: "P. de los Virreyes 45, Puerta de Hierro, 45116 Zapopan, Jal.",
      }
    : {
        contactLabel: "Contacto",
        contactTitle: "Ponte en contacto con nosotros",
        whatsappAria: "Enviar mensaje por WhatsApp",
        emailAria: "Enviar correo a contacto@tripoli.media (Gmail)",
        mapTitle: "Ubicacion Tripoli Media",
        mapLinkAria: "Abrir direccion en Google Maps",
        addressLabel: "P. de los Virreyes 45, Puerta de Hierro, 45116 Zapopan, Jal.",
      };

  return (
    <main
      className="max-w-[70rem] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-10 pb-16 pt-12 dark:bg-transparent"
      style={{ fontFamily: "'Roboto', sans-serif" }}
    >
      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-x-8 lg:gap-y-0.5">
        <section className="flex flex-col gap-3 lg:col-start-1">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500 font-raleway">
              {copy.contactLabel}
            </p>
            <h1 className="contact-title text-2xl lg:text-[28px] font-semibold uppercase font-raleway">
              {copy.contactTitle}
            </h1>
          </div>
          <div className="flex w-full flex-col gap-3">
            <AnimatedServiceBorderBox className="flex w-full flex-col gap-1.5 rounded-none border border-transparent bg-white/90 px-3 py-2 shadow-sm shadow-slate-900/5 transition hover:shadow-md hover:shadow-slate-900/10 dark:bg-slate-900/80 dark:shadow-black/20">
              <div className="flex flex-wrap items-center justify-start gap-5 text-[20px] font-medium tracking-[0.02em] leading-snug text-[#009fe3] dark:text-[#009fe3]">
                <a
                  href="https://api.whatsapp.com/send/?phone=523328175756&text&type=phone_number&app_absent=0"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 transition-colors hover:text-[#00628b] dark:hover:text-[#83d0f5]"
                  aria-label={copy.whatsappAria}
                >
                  <Phone className="h-[26px] w-[26px] text-[#009fe3] dark:text-[#009fe3] group-hover:text-[#00628b] dark:group-hover:text-[#83d0f5]" />
                  <span className="group-hover:text-[#00628b] dark:group-hover:text-[#83d0f5]">+52 33 2817 5756</span>
                </a>
                <span className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-slate-700" />
                <a
                  href="https://mail.google.com/mail/?view=cm&fs=1&to=contacto@tripoli.media"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 transition-colors hover:text-[#00628b] dark:hover:text-[#83d0f5]"
                  aria-label={copy.emailAria}
                >
                  <Mail className="h-[26px] w-[26px] text-[#009fe3] dark:text-[#009fe3] group-hover:text-[#00628b] dark:group-hover:text-[#83d0f5]" />
                  <span className="group-hover:text-[#00628b] dark:group-hover:text-[#83d0f5]">contacto@tripoli.media</span>
                </a>
              </div>
              <a
                href="https://www.google.com/maps/search/?api=1&query=P.%C2%BA%20de%20los%20Virreyes%2045%2C%20Puerta%20de%20Hierro%2C%2045116%20Zapopan%2C%20Jal."
                target="_blank"
                rel="noopener noreferrer"
                aria-label={copy.mapLinkAria}
                className="group flex w-full items-start justify-start gap-3 text-[15.5px] sm:text-[16.5px] lg:text-[17px] font-medium tracking-[0.01em] leading-relaxed text-[#009fe3] dark:text-[#009fe3] transition-colors hover:text-[#00628b] dark:hover:text-[#83d0f5]"
              >
                <span className="group-hover:text-[#00628b] dark:group-hover:text-[#83d0f5] transition-colors">
                  <MapPin className="mt-0.5 h-[26px] w-[26px] text-[#009fe3] dark:text-[#009fe3] transition-colors group-hover:text-[#00628b] dark:group-hover:text-[#83d0f5]" />
                </span>
                <span className="group-hover:text-[#00628b] dark:group-hover:text-[#83d0f5]">{copy.addressLabel}</span>
              </a>
            </AnimatedServiceBorderBox>
            <div className="w-full rounded-none overflow-hidden shadow-md border border-slate-200 h-[160px] sm:h-[180px] lg:h-[210px]">
              <iframe
                title={copy.mapTitle}
                src="https://www.google.com/maps?q=P.%C2%BA%20de%20los%20Virreyes%2045%2C%20Puerta%20de%20Hierro%2C%2045116%20Zapopan%2C%20Jal.&output=embed"
                className="h-full w-full"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </section>

        <section className="flex flex-col mt-[3px] lg:col-start-2 lg:pt-[72px]">
          <CalBookingEmbed />
        </section>
      </div>
      <style jsx>{`
        @keyframes contactTitleSweep {
          0% {
            background-position: 0% 0;
          }
          50% {
            background-position: 100% 0;
          }
          100% {
            background-position: 0% 0;
          }
        }

        .contact-title {
          background: linear-gradient(90deg, #0082b9, #00b6ed, #0082b9);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: contactTitleSweep 10s ease-in-out infinite;
        }

        :global(.dark) .contact-title {
          background: linear-gradient(90deg, #1c90d4, #5aceff, #1c90d4);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
        }
      `}</style>
    </main>
  );
}











