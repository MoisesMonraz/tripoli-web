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

const GA_BLUE   = '#1a73e8';
const GA_GREEN  = '#34a853';
const GA_RED    = '#ea4335';
const GA_YELLOW = '#fbbc04';
const GA_TEXT   = '#202124';
const GA_SUB    = '#5f6368';
const GA_BORDER = '#e0e0e0';
const CHANNEL_COLORS = [GA_BLUE, GA_GREEN, GA_YELLOW, GA_RED, '#9c27b0'];

const LS_KEY = 'tm_periods';
const SS_KEY = 'tm_active';

type Screen = 'loading' | 'modal' | 'manager';
type Tab = 'resumen' | 'adquisicion' | 'engagement' | 'demografia';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Period {
  id: string;
  dateFrom: string;
  dateTo: string;
  totalVisits: number;
  createdAt: string;
}

interface RealChanges {
  sessions: number | null;
  users: number | null;
  pageViews: number | null;
  newSessions: number | null;
  prevDateFrom: string | null;
  prevDateTo: string | null;
}

const NULL_CHANGES: RealChanges = {
  sessions: null, users: null, pageViews: null,
  newSessions: null, prevDateFrom: null, prevDateTo: null,
};

// ─── Storage ──────────────────────────────────────────────────────────────────
function loadPeriods(): Period[] {
  try { const r = localStorage.getItem(LS_KEY); return r ? JSON.parse(r) : []; }
  catch { return []; }
}
function savePeriods(list: Period[]): void {
  try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch { /* ignore */ }
}
function loadActiveId(): string | null {
  try { return sessionStorage.getItem(SS_KEY); } catch { return null; }
}
function saveActiveId(id: string | null): void {
  try {
    if (id) sessionStorage.setItem(SS_KEY, id);
    else sessionStorage.removeItem(SS_KEY);
  } catch { /* ignore */ }
}
function clearAll(): void {
  try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
  saveActiveId(null);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MONTHS_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function formatDMY(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function periodLabel(dateFrom: string, dateTo: string): string {
  const [fy, fm] = dateFrom.split('-').map(Number);
  const [ty, tm] = dateTo.split('-').map(Number);
  if (fy === ty && fm === tm) return `${MONTHS_ES[fm - 1]} ${fy}`;
  if (fy === ty && tm - fm === 1) return `${MONTHS_ES[fm - 1]}–${MONTHS_ES[tm - 1]} ${fy}`;
  return `${formatDMY(dateFrom)} — ${formatDMY(dateTo)}`;
}

function calcChange(current: number, previous: number | null): number | null {
  if (!previous || previous === 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function deriveUsers(v: number)       { return Math.round(v * 0.72); }
function derivePageViews(v: number)   { return Math.round(v * 2.8); }
function deriveNewSessions(v: number) { return Math.round(v * 0.55); }

// ─── Micro components ─────────────────────────────────────────────────────────
function VsAnterior({ change }: { change: number | null }) {
  if (change === null) return <span className="text-[#9aa0a6] text-[12px]">—</span>;
  if (change > 0) return <span className="text-[#34a853] font-medium text-[12px]">▲ +{change.toFixed(1)}%</span>;
  if (change < 0) return <span className="text-[#ea4335] font-medium text-[12px]">▼ {change.toFixed(1)}%</span>;
  return <span className="text-[#5f6368] text-[12px]">→ 0%</span>;
}

function Trend({ value, prevDateFrom, prevDateTo }: {
  value: number | null;
  prevDateFrom?: string | null;
  prevDateTo?: string | null;
}) {
  if (value === null) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-medium px-1.5 py-0.5 rounded-full text-[#5f6368] bg-[#f1f3f4]">
        — Sin período anterior
      </span>
    );
  }
  const cls = value > 0 ? 'text-[#34a853] bg-[#e6f4ea]' : value < 0 ? 'text-[#ea4335] bg-[#fce8e6]' : 'text-[#5f6368] bg-[#f1f3f4]';
  const arrow = value > 0 ? '▲' : value < 0 ? '▼' : '→';
  const sign = value > 0 ? '+' : '';
  return (
    <div className="flex flex-col gap-0.5">
      <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium px-1.5 py-0.5 rounded-full ${cls}`}>
        {arrow} {sign}{value.toFixed(1)}%
      </span>
      {prevDateFrom && prevDateTo && (
        <span className="text-[9px] text-[#5f6368]">vs {formatDMY(prevDateFrom)} – {formatDMY(prevDateTo)}</span>
      )}
    </div>
  );
}

function KpiCard({ label, value, change, prevDateFrom, prevDateTo, sparkData, dataKey, color = GA_BLUE, primary, sub }: {
  label: string; value: string; change: number | null;
  prevDateFrom?: string | null; prevDateTo?: string | null;
  sparkData: object[]; dataKey: string; color?: string; primary?: boolean; sub?: string;
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
        <Trend value={change} prevDateFrom={prevDateFrom} prevDateTo={prevDateTo} />
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
function TabResumen({ data, realChanges }: { data: SimulationResult; realChanges: RealChanges }) {
  const { summary, timeSeries } = data;
  const interval = Math.max(0, Math.floor(timeSeries.length / 10) - 1);
  const newUsersRate = Math.round((summary.newSessions / summary.uniqueUsers) * 100);
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Visitas a la página" value={fmtNum(summary.totalSessions)}
          change={realChanges.sessions} prevDateFrom={realChanges.prevDateFrom} prevDateTo={realChanges.prevDateTo}
          sparkData={timeSeries} dataKey="sessions" color={GA_BLUE} primary />
        <KpiCard label="Usuarios Únicos" value={fmtNum(summary.uniqueUsers)}
          change={realChanges.users} prevDateFrom={realChanges.prevDateFrom} prevDateTo={realChanges.prevDateTo}
          sparkData={timeSeries} dataKey="uniqueUsers" color={GA_GREEN} />
        <KpiCard label="Páginas vistas" value={fmtNum(summary.pageViews)}
          change={realChanges.pageViews} prevDateFrom={realChanges.prevDateFrom} prevDateTo={realChanges.prevDateTo}
          sparkData={timeSeries} dataKey="sessions" color={GA_YELLOW} />
        <KpiCard label="Sesiones nuevas" value={fmtNum(summary.newSessions)}
          change={realChanges.newSessions} prevDateFrom={realChanges.prevDateFrom} prevDateTo={realChanges.prevDateTo}
          sparkData={timeSeries} dataKey="uniqueUsers" color={GA_RED}
          sub={`${newUsersRate}% usuarios nuevos en este período`} />
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
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const router = useRouter();
  const [authChecking, setAuthChecking] = useState(true);
  const [session, setSession]           = useState<{ ok: boolean; email?: string } | null>(null);

  const [screen, setScreen]               = useState<Screen>('loading');
  const [periods, setPeriods]             = useState<Period[]>([]);
  const [activePeriodId, setActivePeriodId] = useState<string | null>(null);
  const [simData, setSimData]             = useState<SimulationResult | null>(null);
  const [realChanges, setRealChanges]     = useState<RealChanges>(NULL_CHANGES);
  const [tab, setTab]                     = useState<Tab>('resumen');

  // Sidebar form
  const [showAddForm, setShowAddForm]     = useState(false);
  const [formFrom, setFormFrom]           = useState('');
  const [formTo, setFormTo]               = useState('');
  const [formVisits, setFormVisits]       = useState<number | ''>('');
  const [formError, setFormError]         = useState('');

  // Sidebar visibility
  const [showSidebar, setShowSidebar]     = useState(true);

  // Confirmations
  const [showDeleteAll, setShowDeleteAll] = useState(false);

  // Auth check
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/status');
        setSession(res.ok ? await res.json() : null);
      } catch { setSession(null); }
      finally { setAuthChecking(false); }
    })();
  }, []);

  useEffect(() => {
    if (!authChecking && (!session?.ok || session?.email !== OWNER_EMAIL)) router.push('/admin');
  }, [authChecking, session, router]);

  // Init: decide which screen to show
  useEffect(() => {
    const saved = loadPeriods();
    if (saved.length > 0) {
      setPeriods(saved);
      setScreen('modal');
    } else {
      setScreen('manager');
    }
  }, []);

  // ── Sorted periods ───────────────────────────────────────────────────────────
  const sorted = [...periods].sort((a, b) => new Date(a.dateFrom).getTime() - new Date(b.dateFrom).getTime());

  // ── Core: load period + generate simulation ──────────────────────────────────
  function runLoad(period: Period, allPeriods: Period[]) {
    const sortedAll = [...allPeriods].sort((a, b) => new Date(a.dateFrom).getTime() - new Date(b.dateFrom).getTime());
    const idx  = sortedAll.findIndex(p => p.id === period.id);
    const prev = idx > 0 ? sortedAll[idx - 1] : null;

    const accumulatedUsers = allPeriods
      .filter(p => p.dateTo < period.dateFrom)
      .reduce((sum, p) => sum + deriveUsers(p.totalVisits), 0);

    const data = generateSimulation({
      totalVisits: Math.max(1, period.totalVisits),
      dateFrom: period.dateFrom,
      dateTo: period.dateTo,
      accumulatedUsers,
    });

    setRealChanges(prev ? {
      sessions:    calcChange(period.totalVisits,             prev.totalVisits),
      users:       calcChange(deriveUsers(period.totalVisits),    deriveUsers(prev.totalVisits)),
      pageViews:   calcChange(derivePageViews(period.totalVisits), derivePageViews(prev.totalVisits)),
      newSessions: calcChange(data.summary.newSessions,           deriveNewSessions(prev.totalVisits)),
      prevDateFrom: prev.dateFrom,
      prevDateTo:   prev.dateTo,
    } : NULL_CHANGES);

    setSimData(data);
    setActivePeriodId(period.id);
    saveActiveId(period.id);
    setTab('resumen');
  }

  // ── Welcome modal actions ────────────────────────────────────────────────────
  const handleContinue = () => {
    setScreen('manager');
    const activeId = loadActiveId();
    if (activeId) {
      const found = periods.find(p => p.id === activeId);
      if (found) runLoad(found, periods);
    }
  };

  const handleReset = () => {
    clearAll();
    setPeriods([]);
    setActivePeriodId(null);
    setSimData(null);
    setRealChanges(NULL_CHANGES);
    setScreen('manager');
  };

  // ── Add period ───────────────────────────────────────────────────────────────
  const handleAdd = () => {
    const visits = typeof formVisits === 'number' ? formVisits : parseInt(String(formVisits));
    if (!formFrom || !formTo)   { setFormError('Completa todos los campos.'); return; }
    if (formTo <= formFrom)     { setFormError('"Hasta" debe ser posterior a "Desde".'); return; }
    if (!visits || visits < 1) { setFormError('Las visitas deben ser al menos 1.'); return; }

    const newPeriod: Period = {
      id: Date.now().toString(),
      dateFrom: formFrom, dateTo: formTo,
      totalVisits: visits,
      createdAt: new Date().toISOString(),
    };
    const updated = [...periods, newPeriod];
    setPeriods(updated);
    savePeriods(updated);
    setFormFrom(''); setFormTo(''); setFormVisits(''); setFormError('');
    setShowAddForm(false);
    runLoad(newPeriod, updated);
  };

  // ── Delete all ───────────────────────────────────────────────────────────────
  const handleDeleteAll = () => {
    clearAll();
    setPeriods([]);
    setActivePeriodId(null);
    setSimData(null);
    setRealChanges(NULL_CHANGES);
    setShowDeleteAll(false);
    setShowAddForm(false);
  };

  // ── Clear session ────────────────────────────────────────────────────────────
  const handleClearSession = () => {
    saveActiveId(null);
    setActivePeriodId(null);
    setSimData(null);
    setRealChanges(NULL_CHANGES);
  };

  // ── Export ───────────────────────────────────────────────────────────────────
  const handleExport = () => {
    if (!simData) return;
    const { summary, engagement, trafficSources, urlStats, config } = simData;
    const lines = [
      'REPORTE ANALYTICS — TRIPOLI MEDIA',
      `Período: ${formatDMY(config.dateFrom)} - ${formatDMY(config.dateTo)}`,
      `Generado: ${new Date().toLocaleString('es-MX')}`,
      '', '=== RESUMEN ===',
      `Visitas a la página: ${fmtNum(summary.totalSessions)}`,
      `Usuarios Únicos: ${fmtNum(summary.uniqueUsers)}`,
      `Páginas vistas: ${fmtNum(summary.pageViews)}`,
      `Sesiones nuevas: ${fmtNum(summary.newSessions)}`,
      '', '=== ENGAGEMENT ===',
      `Tiempo promedio: ${engagement.avgTime}`,
      `Tasa de rebote: ${fmtPct(engagement.bounceRate)}`,
      `Páginas/sesión: ${engagement.pagesPerSession.toFixed(1)}`,
      `Conversión: ${fmtPct(engagement.conversionRate)}`,
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

  // ── Auth / loading guards ─────────────────────────────────────────────────
  if (authChecking || screen === 'loading') {
    return (
      <main className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
        <p className="text-[#5f6368] text-[13px]">Verificando sesión...</p>
      </main>
    );
  }
  if (!session?.ok || session?.email !== OWNER_EMAIL) return null;

  // ── SCREEN 1: Welcome modal ───────────────────────────────────────────────
  if (screen === 'modal') {
    const lastPeriod = [...periods].sort((a, b) => b.dateFrom.localeCompare(a.dateFrom))[0];
    return (
      <main className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4">
        {/* Dimmed backdrop */}
        <div className="fixed inset-0 bg-black/30" />
        {/* Modal card */}
        <div className="relative z-10 bg-white rounded-xl border border-[#e0e0e0] shadow-xl p-8 w-full max-w-md flex flex-col gap-6">
          <div>
            <p className="text-[11px] text-[#5f6368] uppercase tracking-wide mb-1">Tripoli Media</p>
            <h1 className="text-[22px] font-normal text-[#202124] leading-snug">Métricas Página Web</h1>
          </div>

          <div className="flex flex-col gap-3">
            <button type="button" onClick={handleContinue}
              className="w-full bg-[#1a73e8] text-white text-[14px] font-medium py-2.5 rounded-lg hover:bg-[#1765cc] transition-colors shadow-sm">
              Continuar sesión
            </button>
            <button type="button" onClick={handleReset}
              className="w-full border border-[#ea4335] text-[#ea4335] text-[14px] font-medium py-2.5 rounded-lg hover:bg-[#fce8e6] transition-colors">
              Empezar de cero
            </button>
          </div>

          <p className="text-[13px] text-[#5f6368] border-t border-[#f1f3f4] pt-4">
            Tienes <strong className="text-[#202124]">{periods.length}</strong> período{periods.length !== 1 ? 's' : ''} guardado{periods.length !== 1 ? 's' : ''}.
            {lastPeriod && (
              <> Último: <strong className="text-[#202124]">{formatDMY(lastPeriod.dateFrom)} — {formatDMY(lastPeriod.dateTo)}</strong></>
            )}
          </p>
        </div>
      </main>
    );
  }

  // ── SCREEN 2: Period Manager + Dashboard ──────────────────────────────────
  return (
    <main className="min-h-screen bg-[#f8f9fa] flex flex-col">

      {/* Nav bar */}
      <div className="bg-white border-b border-[#e0e0e0] px-6 flex items-center justify-between h-[48px] shrink-0">
        <div className="flex items-center gap-2 h-full">
          <a href="/admin" className="text-[#5f6368] hover:text-[#202124] text-[13px] transition-colors">← Admin</a>
          <span className="text-[#e0e0e0] mx-1">/</span>
          <span className="text-[13px] text-[#202124]">Analytics</span>
          <button
            type="button"
            onClick={() => setShowSidebar(v => !v)}
            title={showSidebar ? 'Ocultar períodos' : 'Mostrar períodos'}
            className={`ml-2 w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
              showSidebar
                ? 'bg-[#1a73e8] text-white hover:bg-[#1765cc]'
                : 'bg-white text-[#1a73e8] border border-[#dadce0] hover:bg-[#e8f0fe]'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="1" y="10" width="3" height="5" rx="0.5" />
              <rect x="6" y="6"  width="3" height="9" rx="0.5" />
              <rect x="11" y="2" width="3" height="13" rx="0.5" />
            </svg>
          </button>
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

      {/* Body: sidebar + main — flex row on desktop, column on mobile */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0">

        {/* ── SIDEBAR (desktop: fixed 280px, mobile: horizontal pill scroll) ── */}

        {/* Mobile pills */}
        <div className={`lg:hidden bg-white border-b border-[#e0e0e0] px-4 py-3 ${showSidebar ? '' : 'hidden'}`}>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {sorted.map((p, idx) => {
              const prev = idx > 0 ? sorted[idx - 1] : null;
              const change = prev ? calcChange(p.totalVisits, prev.totalVisits) : null;
              const isActive = p.id === activePeriodId;
              return (
                <button key={p.id} type="button"
                  onClick={() => runLoad(p, periods)}
                  className={`flex-shrink-0 flex flex-col items-start px-3 py-2 rounded-lg border text-left transition-colors ${
                    isActive ? 'border-[#1a73e8] bg-[#e8f0fe]' : 'border-[#e0e0e0] bg-white hover:bg-[#f8f9fa]'
                  }`}>
                  <span className="text-[12px] font-medium text-[#202124] whitespace-nowrap">{periodLabel(p.dateFrom, p.dateTo)}</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] text-[#5f6368]">{fmtNum(p.totalVisits)}</span>
                    <VsAnterior change={change} />
                  </div>
                </button>
              );
            })}
            <button type="button" onClick={() => setShowAddForm(v => !v)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-[#dadce0] text-[#1a73e8] text-[12px] font-medium hover:bg-[#e8f0fe] transition-colors whitespace-nowrap">
              + Agregar
            </button>
          </div>

          {/* Mobile add form */}
          {showAddForm && (
            <div className="mt-3 p-4 bg-[#f8f9fa] rounded-lg border border-[#e0e0e0]">
              <MobileAddForm
                formFrom={formFrom} formTo={formTo} formVisits={formVisits} formError={formError}
                setFormFrom={v => { setFormFrom(v); setFormError(''); }}
                setFormTo={v => { setFormTo(v); setFormError(''); }}
                setFormVisits={v => { setFormVisits(v); setFormError(''); }}
                onSave={handleAdd}
                onCancel={() => { setShowAddForm(false); setFormError(''); }}
              />
            </div>
          )}
        </div>

        {/* Desktop sidebar */}
        <aside className={`flex-col w-[280px] shrink-0 bg-white border-r border-[#e0e0e0] overflow-y-auto ${showSidebar ? 'hidden lg:flex' : 'hidden'}`}>
          <div className="p-5 border-b border-[#f1f3f4]">
            <p className="text-[11px] text-[#5f6368] uppercase tracking-wide mb-0.5">Métricas — Tripoli Media</p>
            <h1 className="text-[16px] font-normal text-[#202124]">Períodos</h1>
          </div>

          {/* Period list */}
          <div className="flex flex-col flex-1">
            {sorted.length === 0 && !showAddForm && (
              <p className="text-[13px] text-[#9aa0a6] px-5 py-6">No hay períodos aún.</p>
            )}

            {sorted.map((p, idx) => {
              const prev = idx > 0 ? sorted[idx - 1] : null;
              const change = prev ? calcChange(p.totalVisits, prev.totalVisits) : null;
              const isActive = p.id === activePeriodId;
              return (
                <button key={p.id} type="button"
                  onClick={() => runLoad(p, periods)}
                  className={`w-full text-left px-5 py-3.5 border-l-2 transition-colors hover:bg-[#f8f9fa] ${
                    isActive ? 'border-[#1a73e8] bg-[#e8f0fe] hover:bg-[#dce9fb]' : 'border-transparent'
                  }`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-medium text-[#202124] leading-snug">
                      {periodLabel(p.dateFrom, p.dateTo)}
                      {isActive && (
                        <span className="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#1a73e8] text-white tracking-wide align-middle">
                          Activo
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[12px] text-[#5f6368]">{fmtNum(p.totalVisits)} visitas</span>
                    <VsAnterior change={change} />
                  </div>
                </button>
              );
            })}

            {/* Add period form (toggleable) */}
            {showAddForm && (
              <div className="px-5 py-4 border-t border-[#f1f3f4] flex flex-col gap-3">
                <p className="text-[11px] font-medium text-[#5f6368] uppercase tracking-wide">Nuevo período</p>
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-[#5f6368]">Desde</label>
                    <input type="date" value={formFrom} max={formTo || undefined}
                      onChange={e => { setFormFrom(e.target.value); setFormError(''); }}
                      className="border border-[#dadce0] rounded px-2.5 py-1.5 text-[13px] text-[#202124] focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] w-full" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-[#5f6368]">Hasta</label>
                    <input type="date" value={formTo} min={formFrom || undefined}
                      onChange={e => { setFormTo(e.target.value); setFormError(''); }}
                      className="border border-[#dadce0] rounded px-2.5 py-1.5 text-[13px] text-[#202124] focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] w-full" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-[#5f6368]">Visitas totales</label>
                    <input type="number" min="1" value={formVisits} placeholder="ej. 10000"
                      onChange={e => { setFormVisits(e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 1)); setFormError(''); }}
                      className="border border-[#dadce0] rounded px-2.5 py-1.5 text-[13px] text-[#202124] focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] w-full" />
                  </div>
                </div>
                {formError && <p className="text-[11px] text-[#ea4335]">{formError}</p>}
                <div className="flex gap-2">
                  <button type="button" onClick={handleAdd}
                    className="flex-1 bg-[#1a73e8] text-white text-[13px] font-medium py-1.5 rounded hover:bg-[#1765cc] transition-colors">
                    Guardar
                  </button>
                  <button type="button" onClick={() => { setShowAddForm(false); setFormError(''); setFormFrom(''); setFormTo(''); setFormVisits(''); }}
                    className="flex-1 border border-[#dadce0] text-[#5f6368] text-[13px] font-medium py-1.5 rounded hover:bg-[#f8f9fa] transition-colors">
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar actions */}
          <div className="p-4 border-t border-[#f1f3f4] flex flex-col gap-2">
            {!showAddForm && (
              <button type="button" onClick={() => setShowAddForm(true)}
                className="w-full bg-[#1a73e8] text-white text-[13px] font-medium py-2 rounded hover:bg-[#1765cc] transition-colors shadow-sm">
                + Agregar período
              </button>
            )}
            <button type="button" onClick={handleClearSession}
              className="w-full border border-[#dadce0] text-[#5f6368] text-[13px] font-medium py-1.5 rounded hover:bg-[#f8f9fa] transition-colors">
              Limpiar sesión
            </button>
            {periods.length > 0 && !showDeleteAll && (
              <button type="button" onClick={() => setShowDeleteAll(true)}
                className="w-full text-[#ea4335] text-[13px] font-medium py-1.5 rounded hover:bg-[#fce8e6] transition-colors">
                Borrar todo
              </button>
            )}
            {showDeleteAll && (
              <div className="bg-[#fff8f7] border border-[#ea4335] rounded-lg p-3 flex flex-col gap-2">
                <p className="text-[12px] text-[#202124] font-medium">¿Borrar todos los períodos?</p>
                <p className="text-[11px] text-[#5f6368]">Esta acción no se puede deshacer.</p>
                <div className="flex gap-1.5">
                  <button type="button" onClick={handleDeleteAll}
                    className="flex-1 bg-[#ea4335] text-white text-[12px] font-medium py-1.5 rounded hover:bg-[#c5221f] transition-colors">
                    Sí, borrar
                  </button>
                  <button type="button" onClick={() => setShowDeleteAll(false)}
                    className="flex-1 border border-[#dadce0] text-[#5f6368] text-[12px] font-medium py-1.5 rounded hover:bg-[#f8f9fa] transition-colors">
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col overflow-y-auto">

          {/* No period selected */}
          {!simData && (
            <div className="flex-1 flex items-center justify-center p-12">
              <div className="text-center">
                <p className="text-[15px] text-[#5f6368]">
                  {sorted.length === 0
                    ? 'Agrega un período para comenzar.'
                    : <>Selecciona un período para ver las métricas.</>
                  }
                </p>
              </div>
            </div>
          )}

          {/* Dashboard */}
          {simData && (
            <div className="flex flex-col flex-1">
              {/* Tab bar */}
              <div className="bg-white border-b border-[#e0e0e0] px-4 lg:px-6 overflow-x-auto shrink-0">
                <div className="flex">
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

              {/* Tab content */}
              <div className="flex-1 p-4 lg:p-6">
                {tab === 'resumen'     && <TabResumen     data={simData} realChanges={realChanges} />}
                {tab === 'adquisicion' && <TabAdquisicion data={simData} />}
                {tab === 'engagement'  && <TabEngagement  data={simData} />}
                {tab === 'demografia'  && <TabDemografia  data={simData} />}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

// ── Mobile Add Form (extracted to avoid prop drilling in the JSX) ─────────────
function MobileAddForm({ formFrom, formTo, formVisits, formError, setFormFrom, setFormTo, setFormVisits, onSave, onCancel }: {
  formFrom: string; formTo: string; formVisits: number | '';
  formError: string;
  setFormFrom: (v: string) => void;
  setFormTo: (v: string) => void;
  setFormVisits: (v: number | '') => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3 flex-wrap">
        <div className="flex flex-col gap-1 flex-1 min-w-[130px]">
          <label className="text-[11px] text-[#5f6368]">Desde</label>
          <input type="date" value={formFrom} max={formTo || undefined}
            onChange={e => setFormFrom(e.target.value)}
            className="border border-[#dadce0] rounded px-2.5 py-1.5 text-[13px] text-[#202124] focus:outline-none focus:border-[#1a73e8] w-full" />
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-[130px]">
          <label className="text-[11px] text-[#5f6368]">Hasta</label>
          <input type="date" value={formTo} min={formFrom || undefined}
            onChange={e => setFormTo(e.target.value)}
            className="border border-[#dadce0] rounded px-2.5 py-1.5 text-[13px] text-[#202124] focus:outline-none focus:border-[#1a73e8] w-full" />
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-[130px]">
          <label className="text-[11px] text-[#5f6368]">Visitas totales</label>
          <input type="number" min="1" value={formVisits} placeholder="ej. 10000"
            onChange={e => setFormVisits(e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 1))}
            className="border border-[#dadce0] rounded px-2.5 py-1.5 text-[13px] text-[#202124] focus:outline-none focus:border-[#1a73e8] w-full" />
        </div>
      </div>
      {formError && <p className="text-[12px] text-[#ea4335]">{formError}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={onSave}
          className="flex-1 bg-[#1a73e8] text-white text-[13px] font-medium py-1.5 rounded hover:bg-[#1765cc] transition-colors">
          Guardar
        </button>
        <button type="button" onClick={onCancel}
          className="flex-1 border border-[#dadce0] text-[#5f6368] text-[13px] font-medium py-1.5 rounded hover:bg-[#f8f9fa] transition-colors">
          Cancelar
        </button>
      </div>
    </div>
  );
}
