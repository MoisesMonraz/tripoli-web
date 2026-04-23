'use client';

import React, { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  generateSimulation, fmtNum, fmtPct, fmtTime,
  type SimulationResult, type Period,
} from '../../../lib/analytics-simulation';
import { useRouter } from 'next/navigation';

const OWNER_EMAIL = 'monrazescoto@gmail.com';

// GA4 color palette
const GA_BLUE = '#1a73e8';
const GA_GREEN = '#34a853';
const GA_RED = '#ea4335';
const GA_YELLOW = '#fbbc04';
const GA_TEXT = '#202124';
const GA_SUB = '#5f6368';
const GA_BORDER = '#e0e0e0';
const GA_BG = '#f8f9fa';
const GA_BLUE_SOFT = '#e8f0fe';

const CHANNEL_COLORS = [GA_BLUE, GA_GREEN, GA_YELLOW, GA_RED, '#9c27b0'];

type Tab = 'resumen' | 'adquisicion' | 'engagement' | 'demografia';

// ─── Trend badge ───────────────────────────────────────────────────────────────
function Trend({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium px-1.5 py-0.5 rounded-full ${up ? 'text-[#34a853] bg-[#e6f4ea]' : 'text-[#ea4335] bg-[#fce8e6]'}`}>
      {up ? '▲' : '▼'} {Math.abs(value).toFixed(1)}%
    </span>
  );
}

// ─── KPI Card with sparkline ───────────────────────────────────────────────────
function KpiCard({ label, value, change, sparkData, dataKey, color = GA_BLUE }: {
  label: string; value: string; change: number;
  sparkData: any[]; dataKey: string; color?: string;
}) {
  const uid = `spark-${dataKey}-${label.replace(/\s/g, '')}`;
  return (
    <div className="bg-white rounded-lg border border-[#e0e0e0] p-5 flex flex-col gap-2 hover:shadow-sm transition-shadow">
      <p className="text-[13px] text-[#5f6368] leading-tight">{label}</p>
      <div className="flex items-baseline gap-2 flex-wrap">
        <p className="text-[28px] font-normal text-[#202124] leading-none">{value}</p>
        <Trend value={change} />
      </div>
      <div className="mt-1">
        <ResponsiveContainer width="100%" height={44}>
          <AreaChart data={sparkData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={1.5} fill={`url(#${uid})`} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Tab button ───────────────────────────────────────────────────────────────
function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-4 py-3 text-[13px] font-medium border-b-2 transition-colors whitespace-nowrap ${
        active
          ? 'text-[#1a73e8] border-[#1a73e8]'
          : 'text-[#5f6368] border-transparent hover:text-[#202124] hover:border-[#dadce0]'
      }`}>
      {label}
    </button>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-[#e0e0e0] p-6">
      <h2 className="text-[14px] font-medium text-[#202124] mb-4">{title}</h2>
      {children}
    </div>
  );
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────
const gaTooltip = {
  contentStyle: { borderRadius: 8, border: `1px solid ${GA_BORDER}`, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: 12, color: GA_TEXT },
};

// ─── Tab: Resumen ─────────────────────────────────────────────────────────────
function TabResumen({ data, period }: { data: SimulationResult; period: Period }) {
  const { summary, timeSeries } = data;
  const interval = period === '90d' ? 8 : period === '30d' ? 4 : 0;
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Usuarios" value={fmtNum(summary.uniqueUsers)} change={summary.vsLastPeriod.users} sparkData={timeSeries} dataKey="uniqueUsers" color={GA_BLUE} />
        <KpiCard label="Sesiones" value={fmtNum(summary.totalSessions)} change={summary.vsLastPeriod.sessions} sparkData={timeSeries} dataKey="sessions" color={GA_GREEN} />
        <KpiCard label="Páginas vistas" value={fmtNum(summary.pageViews)} change={summary.vsLastPeriod.pageViews} sparkData={timeSeries} dataKey="sessions" color={GA_YELLOW} />
        <KpiCard label="Sesiones nuevas" value={fmtNum(summary.newSessions)} change={summary.vsLastPeriod.newSessions} sparkData={timeSeries} dataKey="uniqueUsers" color={GA_RED} />
      </div>

      <SectionCard title="Usuarios y sesiones en el tiempo">
        <ResponsiveContainer width="100%" height={264}>
          <AreaChart data={timeSeries} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="gSessions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={GA_BLUE} stopOpacity={0.18} />
                <stop offset="95%" stopColor={GA_BLUE} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={GA_GREEN} stopOpacity={0.18} />
                <stop offset="95%" stopColor={GA_GREEN} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f4" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: GA_SUB }} interval={interval} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: GA_SUB }} tickFormatter={v => fmtNum(v)} axisLine={false} tickLine={false} width={52} />
            <Tooltip {...gaTooltip} formatter={(v: number) => fmtNum(v)} />
            <Area type="monotone" dataKey="sessions" stroke={GA_BLUE} strokeWidth={2} fill="url(#gSessions)" name="Sesiones" dot={false} />
            <Area type="monotone" dataKey="uniqueUsers" stroke={GA_GREEN} strokeWidth={2} fill="url(#gUsers)" name="Usuarios" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex gap-5 mt-2 justify-end">
          <span className="flex items-center gap-1.5 text-[11px] text-[#5f6368]">
            <span className="w-3 h-0.5 rounded inline-block" style={{ backgroundColor: GA_BLUE }} /> Sesiones
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-[#5f6368]">
            <span className="w-3 h-0.5 rounded inline-block" style={{ backgroundColor: GA_GREEN }} /> Usuarios
          </span>
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Tab: Adquisición ─────────────────────────────────────────────────────────
function TabAdquisicion({ data }: { data: SimulationResult }) {
  const { trafficSources } = data;
  const maxSessions = Math.max(...trafficSources.rows.map(r => r.sessions));
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Donut */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-[#e0e0e0] p-6">
          <h2 className="text-[14px] font-medium text-[#202124] mb-3">Sesiones por canal</h2>
          <div className="flex justify-center">
            <ResponsiveContainer width={230} height={200}>
              <PieChart>
                <Pie data={trafficSources.donut} cx="50%" cy="50%" innerRadius={60} outerRadius={98}
                  dataKey="value" labelLine={false}
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                    const R = Math.PI / 180;
                    const r = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + r * Math.cos(-midAngle * R);
                    const y = cy + r * Math.sin(-midAngle * R);
                    return percent > 0.05 ? (
                      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="600">
                        {`${(percent * 100).toFixed(0)}%`}
                      </text>
                    ) : null;
                  }}>
                  {trafficSources.donut.map((_, i) => <Cell key={i} fill={CHANNEL_COLORS[i % CHANNEL_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => `${v}%`} {...gaTooltip} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-2 mt-1">
            {trafficSources.donut.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-[13px]">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm inline-block shrink-0" style={{ backgroundColor: CHANNEL_COLORS[i % CHANNEL_COLORS.length] }} />
                  <span className="text-[#202124]">{d.name}</span>
                </span>
                <span className="text-[#5f6368] font-medium">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="lg:col-span-3 bg-white rounded-lg border border-[#e0e0e0] p-6">
          <h2 className="text-[14px] font-medium text-[#202124] mb-3">Fuente / Canal</h2>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[#e0e0e0]">
                {['Fuente', 'Sesiones', 'T. prom.', 'Rebote'].map(h => (
                  <th key={h} className={`pb-2.5 text-[11px] font-medium text-[#5f6368] uppercase tracking-wide ${h === 'Fuente' ? 'text-left' : 'text-right'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trafficSources.rows.map((row, i) => (
                <tr key={i} className="border-b border-[#f1f3f4] hover:bg-[#f8f9fa] transition-colors">
                  <td className="py-2.5">
                    <span className="text-[#1a73e8] font-medium">{row.source}</span>
                    <span className="ml-1.5 text-[10px] text-[#5f6368] bg-[#f1f3f4] rounded px-1.5 py-0.5">{row.group}</span>
                  </td>
                  <td className="py-2.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 bg-[#e8f0fe] rounded-full overflow-hidden">
                        <div className="h-full bg-[#1a73e8] rounded-full transition-all" style={{ width: `${(row.sessions / maxSessions) * 100}%` }} />
                      </div>
                      <span className="text-[#202124] font-medium w-14 text-right">{fmtNum(row.sessions)}</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-right text-[#5f6368]">{row.avgTime}</td>
                  <td className="py-2.5 text-right text-[#5f6368]">{fmtPct(row.bounce)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Engagement ──────────────────────────────────────────────────────────
function TabEngagement({ data }: { data: SimulationResult }) {
  const { engagement, urlStats } = data;
  const maxVisits = Math.max(...urlStats.map(u => u.visits));
  const rows = urlStats.slice(0, 10);
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tiempo de interacción prom.', value: engagement.avgTime },
          { label: 'Tasa de rebote', value: fmtPct(engagement.bounceRate) },
          { label: 'Páginas por sesión', value: engagement.pagesPerSession.toFixed(1) },
          { label: 'Conversión a contacto', value: fmtPct(engagement.conversionRate) },
        ].map((m, i) => (
          <div key={i} className="bg-white rounded-lg border border-[#e0e0e0] p-5 hover:shadow-sm transition-shadow">
            <p className="text-[12px] text-[#5f6368] leading-snug">{m.label}</p>
            <p className="text-[28px] font-normal text-[#202124] mt-2 leading-none">{m.value}</p>
          </div>
        ))}
      </div>

      <SectionCard title="Páginas y pantallas">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-[#e0e0e0]">
              {['Página', 'Vistas', 'T. promedio', 'Rebote'].map(h => (
                <th key={h} className={`pb-2.5 text-[11px] font-medium text-[#5f6368] uppercase tracking-wide ${h === 'Página' ? 'text-left' : 'text-right'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-[#f1f3f4] hover:bg-[#f8f9fa] transition-colors">
                <td className="py-2.5 max-w-[320px]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-20 h-1.5 bg-[#e8f0fe] rounded-full overflow-hidden shrink-0">
                      <div className="h-full bg-[#1a73e8] rounded-full" style={{ width: `${(row.visits / maxVisits) * 100}%` }} />
                    </div>
                    <span className="font-mono text-[11px] text-[#5f6368] truncate">{row.url}</span>
                  </div>
                </td>
                <td className="py-2.5 text-right font-medium text-[#202124]">{fmtNum(row.visits)}</td>
                <td className={`py-2.5 text-right font-medium ${row.avgTimeSeconds >= 180 ? 'text-[#34a853]' : row.avgTimeSeconds >= 90 ? 'text-[#fbbc04]' : 'text-[#ea4335]'}`}>{row.avgTime}</td>
                <td className="py-2.5 text-right text-[#5f6368]">{fmtPct(row.bounce)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex gap-4 mt-3 text-[11px] text-[#5f6368]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block bg-[#34a853]" /> &gt; 3:00</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block bg-[#fbbc04]" /> 1:30–3:00</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block bg-[#ea4335]" /> &lt; 1:30</span>
        </div>
      </SectionCard>

      <SectionCard title="Tiempo promedio por sección">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={engagement.sectionTimes.map(s => ({ name: s.section, seg: s.avgSeconds }))} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f4" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: GA_SUB }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: GA_SUB }} tickFormatter={v => fmtTime(v)} axisLine={false} tickLine={false} width={44} />
            <Tooltip {...gaTooltip} formatter={(v: number) => fmtTime(v)} />
            <Bar dataKey="seg" name="Tiempo promedio" radius={[4, 4, 0, 0]}>
              {engagement.sectionTimes.map((_, i) => <Cell key={i} fill={CHANNEL_COLORS[i % CHANNEL_COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>

      <SectionCard title="Conclusiones">
        <div className="flex flex-col gap-2.5">
          {engagement.insights.map((txt, i) => (
            <div key={i} className="flex items-start gap-3 bg-[#e8f0fe] rounded-lg p-3.5">
              <span className="text-[#1a73e8] font-bold shrink-0 text-[14px]">ℹ</span>
              <p className="text-[13px] text-[#202124]">{txt}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Tab: Demografía ──────────────────────────────────────────────────────────
function TabDemografia({ data }: { data: SimulationResult }) {
  const { cities, countries } = data;
  const maxCountry = Math.max(...countries.map(c => c.visits));
  return (
    <div className="flex flex-col gap-5">
      <SectionCard title="Usuarios por país">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-[#e0e0e0]">
              {['País', 'Visitas', '% del total'].map(h => (
                <th key={h} className={`pb-2.5 text-[11px] font-medium text-[#5f6368] uppercase tracking-wide ${h === 'País' ? 'text-left' : 'text-right'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {countries.map((row, i) => (
              <tr key={i} className="border-b border-[#f1f3f4] hover:bg-[#f8f9fa] transition-colors">
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-1.5 bg-[#e8f0fe] rounded-full overflow-hidden">
                      <div className="h-full bg-[#1a73e8] rounded-full" style={{ width: `${(row.visits / maxCountry) * 100}%` }} />
                    </div>
                    <span className="text-[#202124]">{row.country}</span>
                  </div>
                </td>
                <td className="py-3 text-right font-medium text-[#202124]">{fmtNum(row.visits)}</td>
                <td className="py-3 text-right text-[#5f6368]">{fmtPct(row.pct)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>

      <SectionCard title="Usuarios por ciudad">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={cities.slice(0, 12).map(c => ({ name: c.city, pct: parseFloat(c.pct.toFixed(1)) }))} layout="vertical" margin={{ top: 0, right: 50, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f3f4" />
            <XAxis type="number" tick={{ fontSize: 11, fill: GA_SUB }} tickFormatter={v => `${v}%`} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" width={162} tick={{ fontSize: 11, fill: GA_SUB }} axisLine={false} tickLine={false} />
            <Tooltip {...gaTooltip} formatter={(v: number) => `${v}%`} />
            <Bar dataKey="pct" name="% visitas" fill={GA_BLUE} radius={[0, 4, 4, 0]} maxBarSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [visits, setVisits] = useState(10000);
  const [period, setPeriod] = useState<Period>('30d');
  const [simData, setSimData] = useState<SimulationResult | null>(null);
  const [tab, setTab] = useState<Tab>('resumen');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/status');
        setSession(res.ok ? await res.json() : null);
      } catch { setSession(null); }
      finally { setIsChecking(false); }
    })();
  }, []);

  useEffect(() => {
    if (!isChecking && (!session?.ok || session?.email !== OWNER_EMAIL)) {
      router.push('/admin');
    }
  }, [isChecking, session, router]);

  const handleGenerate = () => {
    setSimData(generateSimulation({ totalVisits: Math.max(100, visits), period }));
    setTab('resumen');
  };

  const handleExport = () => {
    if (!simData) return;
    const { summary, engagement, trafficSources, urlStats, config } = simData;
    const PERIOD_LABEL: Record<Period, string> = { '7d': 'Últimos 7 días', '30d': 'Últimos 30 días', '90d': 'Últimos 90 días', '12m': 'Últimos 12 meses' };
    const lines = [
      'REPORTE ANALYTICS — TRIPOLI MEDIA',
      `Período: ${PERIOD_LABEL[config.period]}`,
      `Generado: ${new Date().toLocaleString('es-MX')}`,
      '', '=== RESUMEN ===',
      `Sesiones: ${fmtNum(summary.totalSessions)}`, `Usuarios: ${fmtNum(summary.uniqueUsers)}`,
      `Páginas vistas: ${fmtNum(summary.pageViews)}`, `Sesiones nuevas: ${fmtNum(summary.newSessions)}`,
      '', '=== ENGAGEMENT ===',
      `Tiempo promedio: ${engagement.avgTime}`, `Tasa de rebote: ${fmtPct(engagement.bounceRate)}`,
      `Páginas/sesión: ${engagement.pagesPerSession.toFixed(1)}`, `Conversión: ${fmtPct(engagement.conversionRate)}`,
      '', '=== FUENTES ===',
      ...trafficSources.rows.map(r => `${r.source}: ${fmtNum(r.sessions)} sesiones (${fmtPct(r.pct)})`),
      '', '=== PÁGINAS TOP ===',
      ...urlStats.slice(0, 10).map(u => `${u.url}: ${fmtNum(u.visits)} visitas (${fmtPct(u.pct)})`),
      '', '=== INSIGHTS ===',
      ...engagement.insights,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `tripoli-analytics-${config.period}-${Date.now()}.txt`;
    a.click();
  };

  if (isChecking) {
    return (
      <main className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
        <p className="text-[#5f6368] text-[13px]">Verificando sesión...</p>
      </main>
    );
  }
  if (!session?.ok || session?.email !== OWNER_EMAIL) return null;

  return (
    <main className="min-h-screen bg-[#f8f9fa]">

      {/* Top navigation bar */}
      <div className="bg-white border-b border-[#e0e0e0] px-6 py-0 flex items-center justify-between h-[48px]">
        <div className="flex items-center gap-2 h-full">
          <a href="/admin" className="text-[#5f6368] hover:text-[#202124] text-[13px] transition-colors">
            ← Admin
          </a>
          <span className="text-[#e0e0e0] mx-1">/</span>
          <span className="text-[13px] text-[#202124]">Analytics</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-[#5f6368] border border-[#dadce0] rounded-full px-3 py-1 bg-[#f8f9fa]">
            tripoli.media
          </span>
          {simData && (
            <button type="button" onClick={handleExport}
              className="text-[13px] text-[#1a73e8] font-medium hover:bg-[#e8f0fe] px-3 py-1 rounded transition-colors">
              ↓ Exportar
            </button>
          )}
        </div>
      </div>

      {/* Property + config header */}
      <div className="bg-white border-b border-[#e0e0e0] px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-end gap-4 justify-between">
          <div>
            <p className="text-[11px] text-[#5f6368] mb-0.5 uppercase tracking-wide">Simulación de métricas</p>
            <h1 className="text-[22px] font-normal text-[#202124]">Resumen del informe</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 border border-[#dadce0] rounded px-3 py-1.5 bg-white focus-within:border-[#1a73e8] focus-within:ring-1 focus-within:ring-[#1a73e8]">
              <span className="text-[11px] text-[#5f6368] whitespace-nowrap">Visitas:</span>
              <input type="number" min="100" value={visits}
                onChange={e => setVisits(Math.max(100, parseInt(e.target.value) || 100))}
                className="w-20 text-[13px] text-[#202124] focus:outline-none ml-1" />
            </div>
            <select value={period} onChange={e => setPeriod(e.target.value as Period)}
              className="border border-[#dadce0] rounded px-3 py-1.5 text-[13px] text-[#202124] bg-white focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]">
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="90d">Últimos 90 días</option>
              <option value="12m">Últimos 12 meses</option>
            </select>
            <button type="button" onClick={handleGenerate}
              className="bg-[#1a73e8] text-white text-[13px] font-medium px-5 py-1.5 rounded hover:bg-[#1765cc] transition-colors shadow-sm">
              Aplicar
            </button>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      {simData && (
        <div className="bg-white border-b border-[#e0e0e0] px-6">
          <div className="max-w-7xl mx-auto flex overflow-x-auto">
            {([
              ['resumen', 'Resumen'],
              ['adquisicion', 'Adquisición'],
              ['engagement', 'Engagement'],
              ['demografia', 'Demografía'],
            ] as [Tab, string][]).map(([t, label]) => (
              <TabBtn key={t} label={label} active={tab === t} onClick={() => setTab(t)} />
            ))}
          </div>
        </div>
      )}

      {/* Page content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {!simData && (
          <div className="bg-white rounded-lg border border-[#e0e0e0] p-16 text-center">
            <p className="text-[15px] text-[#5f6368]">
              Configura los parámetros y haz clic en{' '}
              <strong className="text-[#1a73e8] font-medium">Aplicar</strong>{' '}
              para generar el informe.
            </p>
          </div>
        )}
        {simData && mounted && (
          <>
            {tab === 'resumen' && <TabResumen data={simData} period={period} />}
            {tab === 'adquisicion' && <TabAdquisicion data={simData} />}
            {tab === 'engagement' && <TabEngagement data={simData} />}
            {tab === 'demografia' && <TabDemografia data={simData} />}
          </>
        )}
      </div>
    </main>
  );
}
