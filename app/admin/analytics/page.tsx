'use client';

import React, { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  generateSimulation, fmtNum, fmtPct, fmtTime,
  type SimulationResult,
} from '../../../lib/analytics-simulation';
import { useRouter } from 'next/navigation';

const OWNER_EMAIL = 'monrazescoto@gmail.com';

const GA_BLUE    = '#1a73e8';
const GA_GREEN   = '#34a853';
const GA_RED     = '#ea4335';
const GA_YELLOW  = '#fbbc04';
const GA_TEXT    = '#202124';
const GA_SUB     = '#5f6368';
const GA_BORDER  = '#e0e0e0';

const CHANNEL_COLORS = [GA_BLUE, GA_GREEN, GA_YELLOW, GA_RED, '#9c27b0'];

type Tab = 'resumen' | 'adquisicion' | 'engagement' | 'demografia';

interface SavedSim {
  id: string;
  dateFrom: string;
  dateTo: string;
  totalVisits: number;
  uniqueUsers: number;
  generatedAt: string;
  simulationData: SimulationResult;
}

interface OverlapInfo { saved: SavedSim; }

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDateDMY(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function firstOfMonthISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

// ─── Trend badge ──────────────────────────────────────────────────────────────
function Trend({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-medium px-1.5 py-0.5 rounded-full text-[#34a853] bg-[#e6f4ea]">
      ▲ {Math.abs(value).toFixed(1)}%
    </span>
  );
}

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({ label, value, change, sparkData, dataKey, color = GA_BLUE, primary, sub }: {
  label: string; value: string; change: number;
  sparkData: any[]; dataKey: string; color?: string; primary?: boolean; sub?: string;
}) {
  const uid = `spark-${dataKey}-${label.replace(/\s/g, '')}`;
  return (
    <div
      className="bg-white rounded-lg border border-[#e0e0e0] p-5 flex flex-col gap-2 hover:shadow-sm transition-shadow"
      style={primary ? { borderLeft: '3px solid #1a73e8' } : undefined}
    >
      <p className="text-[13px] text-[#5f6368] leading-tight">{label}</p>
      <div className="flex items-baseline gap-2 flex-wrap">
        <p className={`font-normal text-[#202124] leading-none ${primary ? 'text-[32px]' : 'text-[28px]'}`}>{value}</p>
        <Trend value={change} />
      </div>
      {sub && <p className="text-[11px] text-[#5f6368]">{sub}</p>}
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
        active ? 'text-[#1a73e8] border-[#1a73e8]' : 'text-[#5f6368] border-transparent hover:text-[#202124] hover:border-[#dadce0]'
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

const gaTooltip = {
  contentStyle: { borderRadius: 8, border: `1px solid ${GA_BORDER}`, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: 12, color: GA_TEXT },
};

// ─── Tab: Resumen ─────────────────────────────────────────────────────────────
function TabResumen({ data }: { data: SimulationResult }) {
  const { summary, timeSeries } = data;
  const interval = Math.max(0, Math.floor(timeSeries.length / 10) - 1);
  const newUsersRate = Math.round((summary.newSessions / summary.uniqueUsers) * 100);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Visitas a la página" value={fmtNum(summary.totalSessions)}
          change={summary.vsLastPeriod.sessions} sparkData={timeSeries} dataKey="sessions"
          color={GA_BLUE} primary />
        <KpiCard label="Usuarios Únicos" value={fmtNum(summary.uniqueUsers)}
          change={summary.vsLastPeriod.users} sparkData={timeSeries} dataKey="uniqueUsers"
          color={GA_GREEN} />
        <KpiCard label="Páginas vistas" value={fmtNum(summary.pageViews)}
          change={summary.vsLastPeriod.pageViews} sparkData={timeSeries} dataKey="sessions"
          color={GA_YELLOW} />
        <KpiCard label="Sesiones nuevas" value={fmtNum(summary.newSessions)}
          change={summary.vsLastPeriod.newSessions} sparkData={timeSeries} dataKey="uniqueUsers"
          color={GA_RED} sub={`${newUsersRate}% usuarios nuevos en este período`} />
      </div>

      <SectionCard title="Visitas a la página y Usuarios Únicos en el tiempo">
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
            <Area type="monotone" dataKey="sessions" stroke={GA_BLUE} strokeWidth={2} fill="url(#gSessions)" name="Visitas a la página" dot={false} />
            <Area type="monotone" dataKey="uniqueUsers" stroke={GA_GREEN} strokeWidth={2} fill="url(#gUsers)" name="Usuarios Únicos" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex gap-5 mt-2 justify-end">
          <span className="flex items-center gap-1.5 text-[11px] text-[#5f6368]">
            <span className="w-3 h-0.5 rounded inline-block" style={{ backgroundColor: GA_BLUE }} /> Visitas a la página
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-[#5f6368]">
            <span className="w-3 h-0.5 rounded inline-block" style={{ backgroundColor: GA_GREEN }} /> Usuarios Únicos
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
        <div className="lg:col-span-2 bg-white rounded-lg border border-[#e0e0e0] p-6">
          <h2 className="text-[14px] font-medium text-[#202124] mb-3">Visitas por canal</h2>
          <div className="flex justify-center">
            <ResponsiveContainer width={230} height={200}>
              <PieChart>
                <Pie data={trafficSources.donut} cx="50%" cy="50%" innerRadius={60} outerRadius={98}
                  dataKey="value" labelLine={false}
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
                    const R = Math.PI / 180;
                    const rr = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + rr * Math.cos(-midAngle * R);
                    const y = cy + rr * Math.sin(-midAngle * R);
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

        <div className="lg:col-span-3 bg-white rounded-lg border border-[#e0e0e0] p-6">
          <h2 className="text-[14px] font-medium text-[#202124] mb-3">Fuente / Canal</h2>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[#e0e0e0]">
                {['Fuente', 'Visitas', 'T. prom.', 'Rebote'].map(h => (
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
                        <div className="h-full bg-[#1a73e8] rounded-full" style={{ width: `${(row.sessions / maxSessions) * 100}%` }} />
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
  const [isChecking, setIsChecking]   = useState(true);
  const [session, setSession]         = useState<any>(null);
  const [visits, setVisits]           = useState(10000);
  const [dateFrom, setDateFrom]       = useState(firstOfMonthISO);
  const [dateTo, setDateTo]           = useState(todayISO);
  const [dateError, setDateError]     = useState('');
  const [simData, setSimData]         = useState<SimulationResult | null>(null);
  const [tab, setTab]                 = useState<Tab>('resumen');
  const [mounted, setMounted]         = useState(false);
  const [savedSims, setSavedSims]     = useState<SavedSim[]>([]);
  const [overlapWarning, setOverlapWarning] = useState<OverlapInfo | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('analytics_simulations');
      if (raw) setSavedSims(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

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
    if (!isChecking && (!session?.ok || session?.email !== OWNER_EMAIL)) router.push('/admin');
  }, [isChecking, session, router]);

  const maxDateTo = addDays(dateFrom, 365);

  const doGenerate = (fromSaved?: SavedSim[]) => {
    const list = fromSaved ?? savedSims;
    const accumulatedUsers = list
      .filter(s => s.dateTo < dateFrom)
      .reduce((sum, s) => sum + s.uniqueUsers, 0);

    const data = generateSimulation({ totalVisits: Math.max(100, visits), dateFrom, dateTo, accumulatedUsers });
    setSimData(data);
    setTab('resumen');
    setOverlapWarning(null);
    setDateError('');

    const newSim: SavedSim = {
      id: Date.now().toString(),
      dateFrom,
      dateTo,
      totalVisits: visits,
      uniqueUsers: data.summary.uniqueUsers,
      generatedAt: new Date().toISOString(),
      simulationData: data,
    };
    const updated = [...list, newSim].slice(-24);
    setSavedSims(updated);
    try { localStorage.setItem('analytics_simulations', JSON.stringify(updated)); } catch { /* ignore */ }
  };

  const handleGenerate = () => {
    const start = new Date(dateFrom + 'T00:00:00Z');
    const end   = new Date(dateTo   + 'T00:00:00Z');
    const days  = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (days < 7)   { setDateError('El rango mínimo es 7 días.');   return; }
    if (days > 366) { setDateError('El rango máximo es 366 días.'); return; }
    setDateError('');

    const overlap = savedSims.find(s => s.dateFrom <= dateTo && s.dateTo >= dateFrom);
    if (overlap) { setOverlapWarning({ saved: overlap }); return; }

    doGenerate();
  };

  const loadSavedSim = (sim: SavedSim) => {
    setSimData(sim.simulationData);
    setDateFrom(sim.dateFrom);
    setDateTo(sim.dateTo);
    setVisits(sim.totalVisits);
    setTab('resumen');
    setOverlapWarning(null);
  };

  const handleExport = () => {
    if (!simData) return;
    const { summary, engagement, trafficSources, urlStats, config } = simData;
    const lines = [
      'REPORTE ANALYTICS — TRIPOLI MEDIA',
      `Período: ${formatDateDMY(config.dateFrom)} - ${formatDateDMY(config.dateTo)}`,
      `Generado: ${new Date().toLocaleString('es-MX')}`,
      '', '=== RESUMEN ===',
      `Visitas a la página: ${fmtNum(summary.totalSessions)}`,
      `Usuarios Únicos: ${fmtNum(summary.uniqueUsers)}`,
      `Páginas vistas: ${fmtNum(summary.pageViews)}`,
      `Sesiones nuevas: ${fmtNum(summary.newSessions)}`,
      '', '=== ENGAGEMENT ===',
      `Tiempo promedio: ${engagement.avgTime}`, `Tasa de rebote: ${fmtPct(engagement.bounceRate)}`,
      `Páginas/sesión: ${engagement.pagesPerSession.toFixed(1)}`, `Conversión: ${fmtPct(engagement.conversionRate)}`,
      '', '=== FUENTES ===',
      ...trafficSources.rows.map(r => `${r.source}: ${fmtNum(r.sessions)} visitas (${fmtPct(r.pct)})`),
      '', '=== PÁGINAS TOP ===',
      ...urlStats.slice(0, 10).map(u => `${u.url}: ${fmtNum(u.visits)} visitas (${fmtPct(u.pct)})`),
      '', '=== INSIGHTS ===',
      ...engagement.insights,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `tripoli-analytics-${config.dateFrom}-${config.dateTo}.txt`;
    a.click();
  };

  if (isChecking) {
    return <main className="min-h-screen bg-[#f8f9fa] flex items-center justify-center"><p className="text-[#5f6368] text-[13px]">Verificando sesión...</p></main>;
  }
  if (!session?.ok || session?.email !== OWNER_EMAIL) return null;

  return (
    <main className="min-h-screen bg-[#f8f9fa]">

      {/* Overlap modal */}
      {overlapWarning && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-[15px] font-medium text-[#202124] mb-2">Ya existe una simulación en este período</h3>
            <p className="text-[13px] text-[#5f6368] mb-5">
              Del <strong>{formatDateDMY(overlapWarning.saved.dateFrom)}</strong> al <strong>{formatDateDMY(overlapWarning.saved.dateTo)}</strong> ya se registró una simulación
              con <strong>{fmtNum(overlapWarning.saved.totalVisits)}</strong> visitas
              y <strong>{fmtNum(overlapWarning.saved.uniqueUsers)}</strong> usuarios únicos.
            </p>
            <div className="flex gap-3 flex-wrap">
              <button type="button" onClick={() => loadSavedSim(overlapWarning.saved)}
                className="flex-1 bg-[#1a73e8] text-white text-[13px] font-medium px-4 py-2 rounded hover:bg-[#1765cc] transition-colors">
                Ver simulación guardada
              </button>
              <button type="button" onClick={() => doGenerate()}
                className="flex-1 border border-[#dadce0] text-[#5f6368] text-[13px] font-medium px-4 py-2 rounded hover:bg-[#f8f9fa] transition-colors">
                Generar nueva igualmente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top navigation bar */}
      <div className="bg-white border-b border-[#e0e0e0] px-6 flex items-center justify-between h-[48px]">
        <div className="flex items-center gap-2 h-full">
          <a href="/admin" className="text-[#5f6368] hover:text-[#202124] text-[13px] transition-colors">← Admin</a>
          <span className="text-[#e0e0e0] mx-1">/</span>
          <span className="text-[13px] text-[#202124]">Analytics</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-[#5f6368] border border-[#dadce0] rounded-full px-3 py-1 bg-[#f8f9fa]">tripoli.media</span>
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
            <p className="text-[11px] text-[#5f6368] mb-0.5 uppercase tracking-wide">Métricas Página Web - Tripoli Media</p>
            <h1 className="text-[22px] font-normal text-[#202124]">Resumen del informe</h1>
          </div>

          {/* Date range picker + controls */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-[#5f6368]">{formatDateDMY(dateFrom)} — {formatDateDMY(dateTo)}</span>
              <div className="flex items-center gap-2 border border-[#dadce0] rounded px-3 py-1.5 bg-white focus-within:border-[#1a73e8] focus-within:ring-1 focus-within:ring-[#1a73e8]">
                <span className="text-[11px] text-[#5f6368] shrink-0">Desde</span>
                <input type="date" value={dateFrom}
                  onChange={e => { setDateFrom(e.target.value); setDateError(''); }}
                  max={dateTo}
                  className="text-[13px] text-[#202124] focus:outline-none bg-transparent cursor-pointer" />
                <span className="text-[#dadce0] mx-1">—</span>
                <span className="text-[11px] text-[#5f6368] shrink-0">Hasta</span>
                <input type="date" value={dateTo}
                  onChange={e => { setDateTo(e.target.value); setDateError(''); }}
                  min={dateFrom}
                  max={maxDateTo}
                  className="text-[13px] text-[#202124] focus:outline-none bg-transparent cursor-pointer" />
              </div>
              {dateError && <p className="text-[11px] text-[#ea4335]">{dateError}</p>}
            </div>

            <div className="flex items-center gap-1 border border-[#dadce0] rounded px-3 py-1.5 bg-white focus-within:border-[#1a73e8] focus-within:ring-1 focus-within:ring-[#1a73e8]">
              <span className="text-[11px] text-[#5f6368] whitespace-nowrap">Visitas:</span>
              <input type="number" min="100" value={visits}
                onChange={e => setVisits(Math.max(100, parseInt(e.target.value) || 100))}
                className="w-20 text-[13px] text-[#202124] focus:outline-none ml-1" />
            </div>

            <button type="button" onClick={handleGenerate}
              className="bg-[#1a73e8] text-white text-[13px] font-medium px-5 py-1.5 rounded hover:bg-[#1765cc] transition-colors shadow-sm whitespace-nowrap">
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
              ['resumen',     'Resumen'],
              ['adquisicion', 'Adquisición'],
              ['engagement',  'Engagement'],
              ['demografia',  'Demografía'],
            ] as [Tab, string][]).map(([t, label]) => (
              <TabBtn key={t} label={label} active={tab === t} onClick={() => setTab(t)} />
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {!simData && (
          <div className="bg-white rounded-lg border border-[#e0e0e0] p-16 text-center">
            <p className="text-[15px] text-[#5f6368]">
              Selecciona un rango de fechas y haz clic en{' '}
              <strong className="text-[#1a73e8] font-medium">Aplicar</strong>{' '}
              para generar el informe.
            </p>
          </div>
        )}
        {simData && mounted && (
          <>
            {tab === 'resumen'     && <TabResumen    data={simData} />}
            {tab === 'adquisicion' && <TabAdquisicion data={simData} />}
            {tab === 'engagement'  && <TabEngagement  data={simData} />}
            {tab === 'demografia'  && <TabDemografia  data={simData} />}
          </>
        )}
      </div>
    </main>
  );
}
