import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { LanguageProvider } from "../components/LanguageProvider";
import ScrollToTop from "../components/ScrollToTop";
import AIChatWidget from "../components/ai/AIChatWidget";

export const metadata = {
  title: "Tripoli Media",
  description: "Sitio principal de Tripoli Media.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-white text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-50">
        <LanguageProvider>
          <ScrollToTop />
          <Header />
          {children}
          <Footer />
          <AIChatWidget />
        </LanguageProvider>
      </body>
    </html>
  );
}
