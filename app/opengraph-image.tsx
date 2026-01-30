import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Tripoli Media - Plataforma de Medios Profesionales';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          position: 'relative',
          backgroundColor: '#ffffff',
        }}
      >
        {/* Patrón de cuadrados de fondo - Esquina superior derecha */}
        <div
          style={{
            position: 'absolute',
            top: -40,
            right: -40,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
            width: 280,
            opacity: 0.08,
            transform: 'rotate(15deg)',
          }}
        >
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              style={{
                width: 60,
                height: 60,
                backgroundColor: '#0EA5E9',
                borderRadius: 8,
              }}
            />
          ))}
        </div>

        {/* Patrón de cuadrados de fondo - Esquina inferior izquierda */}
        <div
          style={{
            position: 'absolute',
            bottom: -40,
            left: -40,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
            width: 280,
            opacity: 0.08,
            transform: 'rotate(-15deg)',
          }}
        >
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              style={{
                width: 60,
                height: 60,
                backgroundColor: '#22D3EE',
                borderRadius: 8,
              }}
            />
          ))}
        </div>

        {/* Container principal */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px 60px',
            width: '100%',
            height: '100%',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Logo - 4 cuadrados */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              width: 120,
              height: 120,
              gap: 6,
              marginBottom: 48,
            }}
          >
            {/* Cuadrado 1 - Top Left */}
            <div
              style={{
                width: 57,
                height: 57,
                backgroundColor: '#0EA5E9',
                borderRadius: 6,
              }}
            />
            {/* Cuadrado 2 - Top Right */}
            <div
              style={{
                width: 57,
                height: 57,
                backgroundColor: '#38BDF8',
                borderRadius: 6,
              }}
            />
            {/* Cuadrado 3 - Bottom Left */}
            <div
              style={{
                width: 57,
                height: 57,
                backgroundColor: '#22D3EE',
                borderRadius: 6,
              }}
            />
            {/* Cuadrado 4 - Bottom Right */}
            <div
              style={{
                width: 57,
                height: 57,
                backgroundColor: '#0284C7',
                borderRadius: 6,
              }}
            />
          </div>

          {/* Título */}
          <div
            style={{
              fontSize: 68,
              fontWeight: 800,
              color: '#0f172a',
              textAlign: 'center',
              letterSpacing: '-0.03em',
              marginBottom: 24,
            }}
          >
            TRIPOLI MEDIA
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: 32,
              fontWeight: 500,
              color: '#475569',
              textAlign: 'center',
              marginBottom: 56,
              maxWidth: 800,
            }}
          >
            Plataforma de Medios Profesionales
          </div>

          {/* Sectores - 6 cuadrados pequeños de colores */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: 12,
            }}
          >
            {/* Consumo y Retail - Naranja */}
            <div
              style={{
                width: 32,
                height: 32,
                backgroundColor: '#f39200',
                borderRadius: 6,
              }}
            />
            {/* Entretenimiento y Cultura - Verde */}
            <div
              style={{
                width: 32,
                height: 32,
                backgroundColor: '#009640',
                borderRadius: 6,
              }}
            />
            {/* Industria TI - Azul */}
            <div
              style={{
                width: 32,
                height: 32,
                backgroundColor: '#0069b4',
                borderRadius: 6,
              }}
            />
            {/* Infraestructura Social - Café */}
            <div
              style={{
                width: 32,
                height: 32,
                backgroundColor: '#5d514c',
                borderRadius: 6,
              }}
            />
            {/* Política y Leyes - Morado */}
            <div
              style={{
                width: 32,
                height: 32,
                backgroundColor: '#312783',
                borderRadius: 6,
              }}
            />
            {/* Sector Salud - Magenta */}
            <div
              style={{
                width: 32,
                height: 32,
                backgroundColor: '#e6007e',
                borderRadius: 6,
              }}
            />
          </div>

          {/* Subtítulo */}
          <div
            style={{
              fontSize: 18,
              color: '#94a3b8',
              textAlign: 'center',
              marginTop: 32,
              fontWeight: 400,
            }}
          >
            6 Sectores • Análisis Profesional • Cobertura Especializada
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
