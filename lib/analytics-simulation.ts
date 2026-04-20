export type Period = '7d' | '30d' | '90d' | '12m';

export interface SimConfig { totalVisits: number; period: Period; }
export interface TimePoint { label: string; sessions: number; uniqueUsers: number; }
export interface UrlStat { url: string; visits: number; pct: number; avgTime: string; avgTimeSeconds: number; bounce: number; }
export interface CityStat { city: string; visits: number; pct: number; }
export interface CountryStat { country: string; visits: number; pct: number; }
export interface SectionTime { section: string; avgSeconds: number; }
export interface SourceRow { source: string; group: string; sessions: number; pct: number; avgTime: string; bounce: number; }
export interface DonutSlice { name: string; value: number; color: string; }

export interface SimulationResult {
  config: SimConfig;
  timeSeries: TimePoint[];
  urlStats: UrlStat[];
  cities: CityStat[];
  countries: CountryStat[];
  engagement: {
    avgTime: string; avgTimeSeconds: number; bounceRate: number;
    pagesPerSession: number; conversionRate: number;
    sectionTimes: SectionTime[]; insights: string[];
  };
  trafficSources: { donut: DonutSlice[]; rows: SourceRow[]; };
  summary: {
    totalSessions: number; uniqueUsers: number; pageViews: number; newSessions: number;
    vsLastPeriod: { sessions: number; users: number; pageViews: number; newSessions: number; };
  };
}

// --- Helpers ---
function r(min: number, max: number) { return min + Math.random() * (max - min); }

export function fmtTime(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}
export function fmtNum(n: number): string { return Math.round(n).toLocaleString('es-MX'); }
export function fmtPct(n: number): string { return `${n.toFixed(1)}%`; }

function distribute(total: number, weights: number[]): number[] {
  const wSum = weights.reduce((a, b) => a + b, 0);
  const result = weights.map(w => Math.round(total * w / wSum));
  result[result.length - 1] += total - result.reduce((a, b) => a + b, 0);
  return result;
}

// --- Time Series ---
export function generateTimeSeries(config: SimConfig): TimePoint[] {
  const { totalVisits, period } = config;
  const today = new Date();

  if (period === '12m') {
    const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const SEASON =  [0.80,0.85,0.95,1.00,1.05,0.90,0.85,0.90,1.05,1.10,1.00,0.95];
    const items = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth() - (11 - i), 1);
      return { label: `${MONTHS[d.getMonth()]} '${d.getFullYear().toString().slice(2)}`, weight: SEASON[d.getMonth()] * r(0.88, 1.12) };
    });
    const sessions = distribute(totalVisits, items.map(m => m.weight));
    return items.map((m, i) => ({ label: m.label, sessions: sessions[i], uniqueUsers: Math.round(sessions[i] * r(0.72, 0.85)) }));
  }

  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const DAY = ['D','L','M','X','J','V','S'];
  const dates = Array.from({ length: days }, (_, i) => { const d = new Date(today); d.setDate(d.getDate() - (days - 1 - i)); return d; });
  const weights = dates.map(d => { const we = d.getDay()===0||d.getDay()===6; return (we ? 0.25/2 : 0.75/5) * r(we ? 0.8 : 0.85, we ? 1.2 : 1.15); });
  const sessions = distribute(totalVisits, weights);
  return dates.map((d, i) => ({
    label: period === '7d' ? `${DAY[d.getDay()]} ${d.getDate()}` : `${d.getDate()}/${d.getMonth()+1}`,
    sessions: sessions[i],
    uniqueUsers: Math.round(sessions[i] * r(0.72, 0.85)),
  }));
}

// --- URL Stats ---
const URL_DEFS = [
  { url: '/', p1:18,p2:25, t1:90,t2:165, b1:55,b2:72 },
  { url: '/categoria/consumo-y-retail', p1:8,p2:12, t1:120,t2:210, b1:45,b2:62 },
  { url: '/categoria/industria-ti', p1:7,p2:11, t1:120,t2:210, b1:42,b2:60 },
  { url: '/categoria/entretenimiento-y-cultura', p1:6,p2:10, t1:120,t2:210, b1:45,b2:63 },
  { url: '/categoria/infraestructura-social', p1:5,p2:9, t1:120,t2:210, b1:45,b2:63 },
  { url: '/categoria/politica-y-leyes', p1:5,p2:8, t1:120,t2:210, b1:45,b2:63 },
  { url: '/categoria/sector-salud', p1:4,p2:7, t1:120,t2:210, b1:45,b2:63 },
  { url: '/servicios', p1:3,p2:6, t1:150,t2:240, b1:38,b2:55 },
  { url: '/conocenos', p1:2,p2:4, t1:90,t2:165, b1:48,b2:65 },
  { url: '/contacto', p1:1,p2:3, t1:60,t2:120, b1:35,b2:52 },
  { url: '/consumo-y-retail/negocios-de-conveniencia/articulo/kiosko-expansion-regional-pacifico-2026', p1:2,p2:5, t1:180,t2:330, b1:35,b2:52 },
  { url: '/industria-ti/fabricantes-de-tecnologia/articulo/transformacion-digital-empresas-mexico-2026', p1:2,p2:5, t1:180,t2:330, b1:35,b2:52 },
  { url: '/politica-y-leyes/servicios-juridicos/articulo/reforma-laboral-40-horas-impacto-pymes', p1:2,p2:4, t1:180,t2:330, b1:35,b2:52 },
  { url: '/sector-salud/fabricantes-equipos-insumos/articulo/fabricantes-equipos-insumos-medicos-mexico-ranking-2026', p1:2,p2:4, t1:180,t2:330, b1:35,b2:52 },
  { url: '/infraestructura-social/desarrolladores-de-proyectos/articulo/desarrollo-inmobiliario-monterrey-2026', p1:1,p2:3, t1:180,t2:330, b1:35,b2:52 },
];

export function generateUrlStats(totalVisits: number): UrlStat[] {
  const rawPcts = URL_DEFS.map(d => r(d.p1, d.p2));
  const rawSum = rawPcts.reduce((a, b) => a + b, 0);
  const share = r(0.83, 0.91);
  const definedVisits = rawPcts.map(p => Math.round(totalVisits * (p / rawSum) * share));
  const otherVisits = Math.max(0, totalVisits - definedVisits.reduce((a, b) => a + b, 0));
  const stats: UrlStat[] = URL_DEFS.map((d, i) => {
    const t = Math.round(r(d.t1, d.t2));
    return { url: d.url, visits: definedVisits[i], pct: definedVisits[i] / totalVisits * 100, avgTime: fmtTime(t), avgTimeSeconds: t, bounce: r(d.b1, d.b2) };
  });
  stats.push({ url: 'Otras páginas', visits: otherVisits, pct: otherVisits / totalVisits * 100, avgTime: fmtTime(Math.round(r(60,150))), avgTimeSeconds: Math.round(r(60,150)), bounce: r(45,70) });
  return stats.sort((a, b) => b.visits - a.visits);
}

// --- Geographic ---
export function generateGeo(totalVisits: number): { cities: CityStat[]; countries: CountryStat[] } {
  const mxVisits = Math.round(totalVisits * 0.95);
  const usaVisits = totalVisits - mxVisits;
  const top3Total = Math.round(mxVisits * 0.65);
  const secTotal = mxVisits - top3Total;
  const w1 = r(0.32,0.35), w2 = r(0.32,0.35);
  const topVisits = distribute(top3Total, [w1, w2, 1 - w1 - w2]);
  const secVisits = distribute(secTotal, [r(4,6),r(3,5),r(3,5),r(3,4),r(2,4),r(2,3),r(1,3),r(1,2)]);
  const usaV = distribute(usaVisits, [1.5,1.2,0.9,0.8]);
  const SEC = ['Puebla','Tijuana','León','Querétaro','Mérida','San Luis Potosí','Aguascalientes','Hermosillo'];
  const USA = ['Nueva York (EUA)','Los Ángeles (EUA)','Houston (EUA)','Chicago (EUA)'];
  const cities: CityStat[] = [
    { city:'CDMX (AM)', visits:topVisits[0], pct:topVisits[0]/totalVisits*100 },
    { city:'Monterrey (AM)', visits:topVisits[1], pct:topVisits[1]/totalVisits*100 },
    { city:'Guadalajara (AM)', visits:topVisits[2], pct:topVisits[2]/totalVisits*100 },
    ...SEC.map((city,i) => ({ city, visits:secVisits[i], pct:secVisits[i]/totalVisits*100 })),
    ...USA.map((city,i) => ({ city, visits:usaV[i], pct:usaV[i]/totalVisits*100 })),
  ];
  return {
    cities: cities.sort((a,b) => b.visits - a.visits),
    countries: [{ country:'México 🇲🇽', visits:mxVisits, pct:95 },{ country:'EUA 🇺🇸', visits:usaVisits, pct:5 }],
  };
}

// --- Engagement ---
export function generateEngagement(totalVisits: number): SimulationResult['engagement'] {
  const avgTimeSec = Math.round(r(150, 285));
  const sectionTimes: SectionTime[] = [
    { section:'Artículos', avgSeconds: Math.round(r(180,330)) },
    { section:'Inicio', avgSeconds: Math.round(r(90,165)) },
    { section:'Categorías', avgSeconds: Math.round(r(120,210)) },
    { section:'Servicios', avgSeconds: Math.round(r(150,240)) },
    { section:'Contacto', avgSeconds: Math.round(r(60,150)) },
  ];
  const tiPct = Math.round(r(18,42));
  const retPct = Math.round(r(22,38));
  const hour = Math.round(r(9,12));
  return {
    avgTime: fmtTime(avgTimeSec), avgTimeSeconds: avgTimeSec,
    bounceRate: r(42,68), pagesPerSession: r(2.1,3.6), conversionRate: r(0.8,2.4),
    sectionTimes,
    insights: [
      `Los artículos de Industria TI retienen a los usuarios ${tiPct}% más que el promedio del sitio.`,
      `El horario de mayor tráfico es entre las ${hour}:00 y las ${hour+4}:00 hrs entre semana.`,
      `El ${retPct}% de los usuarios regresan al sitio en los siguientes 7 días.`,
    ],
  };
}

// --- Traffic Sources ---
export function generateTrafficSources(totalVisits: number): SimulationResult['trafficSources'] {
  const enlPct = r(72,78), gPct = r(17,23), otPct = 100 - enlPct - gPct;
  const enlVisits = Math.round(totalVisits * enlPct / 100);
  const gVisits = Math.round(totalVisits * gPct / 100);
  const otVisits = totalVisits - enlVisits - gVisits;
  const fbP=r(25,35),liP=r(15,20),twP=r(10,15),waP=r(8,12);
  const socialVisits = distribute(enlVisits, [fbP,liP,twP,waP,100-fbP-liP-twP-waP]);
  const SOCIAL = ['Facebook','LinkedIn','X / Twitter','WhatsApp','Otros referrals'];
  const rows: SourceRow[] = [
    ...SOCIAL.map((source,i) => ({ source, group:'Enlaces', sessions:socialVisits[i], pct:socialVisits[i]/totalVisits*100, avgTime:fmtTime(Math.round(r(120,270))), bounce:r(38,65) })),
    { source:'Google orgánico', group:'Búsqueda', sessions:Math.round(gVisits*0.85), pct:gPct*0.85, avgTime:fmtTime(Math.round(r(150,300))), bounce:r(35,58) },
    { source:'Google directo', group:'Búsqueda', sessions:Math.round(gVisits*0.15), pct:gPct*0.15, avgTime:fmtTime(Math.round(r(120,240))), bounce:r(40,62) },
    { source:'Otros externos', group:'Otros', sessions:otVisits, pct:otPct, avgTime:fmtTime(Math.round(r(90,180))), bounce:r(45,70) },
  ].sort((a,b) => b.sessions - a.sessions);
  return {
    donut: [
      { name:'Enlaces', value: Math.round(enlPct*10)/10, color:'#1E3A5F' },
      { name:'Google orgánico', value: Math.round(gPct*10)/10, color:'#3B82F6' },
      { name:'Otros externos', value: Math.round(otPct*10)/10, color:'#93C5FD' },
    ],
    rows,
  };
}

// --- Summary ---
export function generateSummary(totalVisits: number): SimulationResult['summary'] {
  const vsChange = () => r(-25, 25);
  return {
    totalSessions: totalVisits,
    uniqueUsers: Math.round(totalVisits * r(0.72,0.85)),
    pageViews: Math.round(totalVisits * r(2.1,3.4)),
    newSessions: Math.round(totalVisits * r(0.55,0.70)),
    vsLastPeriod: { sessions:vsChange(), users:vsChange(), pageViews:vsChange(), newSessions:vsChange() },
  };
}

// --- Main ---
export function generateSimulation(config: SimConfig): SimulationResult {
  return {
    config,
    timeSeries: generateTimeSeries(config),
    urlStats: generateUrlStats(config.totalVisits),
    ...generateGeo(config.totalVisits),
    engagement: generateEngagement(config.totalVisits),
    trafficSources: generateTrafficSources(config.totalVisits),
    summary: generateSummary(config.totalVisits),
  };
}
