"use client";

const content = {
  ES: [
    "1. ACEPTACIÓN DE LOS TÉRMINOS",
    "Al ingresar y utilizar este portal de Internet, cuyo nombre de dominio es tripoli.media, propiedad de TRIPOLI MEDIA, con domicilio en Av. Juan Palomar y Arias 1180, C.P. 45110, Zapopan, Jalisco, el usuario está aceptando los Términos y Condiciones de Uso contenidos en este convenio y declara expresamente su aceptación utilizando para tal efecto medios electrónicos, en términos de lo dispuesto por el artículo 1803 del Código Civil Federal.",
    "2. USO DEL SITIO Y CUENTAS DE USUARIO",
    "El usuario se compromete a utilizar el contenido del sitio de forma lícita y sin fines contrarios a la moral o al orden público. TRIPOLI MEDIA se reserva el derecho de retirar el acceso o cancelar la cuenta de cualquier usuario que realice comentarios ofensivos, spam, o intente vulnerar la seguridad del sitio.",
    "3. PROPIEDAD INTELECTUAL (DERECHOS DE AUTOR)",
    "Todo el contenido publicado en este sitio, incluyendo artículos, reportajes, análisis, logotipos, imágenes, código fuente y diseño, son propiedad exclusiva de TRIPOLI MEDIA o de sus licenciantes, y están protegidos por la Ley Federal del Derecho de Autor y la Ley Federal de Protección a la Propiedad Industrial.",
    "Prohibición de Reproducción: Queda estrictamente prohibida la reproducción total o parcial, traducción, transformación, distribución o extracción de datos (data scraping) de los contenidos de este sitio sin la autorización previa y por escrito de TRIPOLI MEDIA. El uso no autorizado será perseguido legalmente.",
    "4. LIMITACIÓN DE RESPONSABILIDAD",
    "Las opiniones expresadas por los autores, colaboradores y columnistas en este sitio web son responsabilidad exclusiva de ellos y no necesariamente reflejan la postura oficial de TRIPOLI MEDIA. La información se proporciona \"tal cual\" con fines informativos; TRIPOLI MEDIA no garantiza la exactitud o integridad de la información para la toma de decisiones financieras, legales o de inversión por parte del usuario.",
    "5. MODIFICACIONES",
    "TRIPOLI MEDIA podrá en cualquier momento y cuando lo considere conveniente, sin necesidad de avisar al usuario, realizar correcciones, adiciones, mejoras o modificaciones al contenido, presentación, información, servicios, áreas, bases de datos y demás elementos de dicho sitio, sin que ello de lugar ni derecho a ninguna reclamación o indemnización.",
    "6. LEGISLACIÓN APLICABLE Y JURISDICCIÓN",
    "Este convenio estará sujeto y será interpretado de acuerdo con las leyes federales vigentes en México. En caso de controversia, las partes aceptan someterse a la jurisdicción de los tribunales competentes de la ciudad de Zapopan, Jalisco, renunciando a cualquier otro fuero que pudiera corresponderles por razón de sus domicilios presentes o futuros.",
    "7. CONTACTO",
    "Para cualquier duda, aclaración o reclamación relacionada con los servicios o el uso del sitio web, el usuario puede contactar a TRIPOLI MEDIA a través del correo electrónico: contacto@tripoli.media.",
    "Última actualización: Febrero 2026.",
  ],
};

export default function TermsBody() {
  const paragraphs = content.ES;

  return (
    <main className="flex flex-col gap-8 sm:gap-10 pb-12 sm:pb-16 pt-8 sm:pt-12 font-raleway bg-white dark:bg-slate-950">
      <section className="max-w-[70rem] mx-auto w-full px-5 sm:px-7 md:px-5">
        <div className="flex flex-col gap-2 sm:gap-3">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">
            Términos y Condiciones
          </p>
          <h1 className="text-xl sm:text-2xl lg:text-[28px] font-semibold uppercase bg-gradient-to-r from-[#0082b9] via-[#00b6ed] to-[#0082b9] bg-[length:200%_100%] bg-clip-text text-transparent animate-servicesTitleSweep">
            Término legal
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
