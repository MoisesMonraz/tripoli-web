'use client';

import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  generateSimulation, fmtNum, fmtPct, fmtTime,
  type SimulationResult, type Period,
} from '../../../lib/analytics-simulation';
import { useRouter } from 'next/navigation';

const OWNER_EMAIL = 'monrazescoto@gmail.com';
const COLORS = ['#1E3A5F','#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6'];

// ─── Sub-components ────────────────────────────────────────────────────────────

function SummaryCard({ label, value, change }: { label: string; value: string; change: number }) {
  const up = change >= 0;
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
      <p className={`text-xs mt-1 font-semibold ${up ? 'text-emerald-600' : 'text-red-500'}`}>
        {up ? '↑' : '↓'} {Math.abs(change).toFixed(1)}% vs período anterior
      </p>
    </div>
  );
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-3xl font-bold text-[#1E3A5F] mt-2">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

function timeColor(sec: number) {
  if (sec >= 180) return 'text-emerald-600';
  if (sec >= 90) return 'text-amber-500';
  return 'text-red-500';
}

function Dashboard1({ data, period }: { data: SimulationResult; period: Period }) {
  const interval = period === '90d' ? 8 : period === '30d' ? 4 : 0;
  const { summary, timeSeries } = data;
  return (
    <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-base font-bold text-[#1E3A5F] mb-5 uppercase tracking-wide">1. Visitas en el tiempo</h2>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={timeSeries} margin={{ top:5, right:20, left:0, bottom:5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="label" tick={{ fontSize:10 }} interval={interval} />
          <YAxis tick={{ fontSize:10 }} tickFormatter={v => fmtNum(v)} />
          <Tooltip formatter={(v: number) => fmtNum(v)} />
          <Legend />
          <Line type="monotone" dataKey="sessions" stroke="#1E3A5F" name="Sesiones totales" dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="uniqueUsers" stroke="#3B82F6" name="Usuarios únicos" dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <SummaryCard label="Total sesiones" value={fmtNum(summary.totalSessions)} change={summary.vsLastPeriod.sessions} />
        <SummaryCard label="Usuarios únicos" value={fmtNum(summary.uniqueUsers)} change={summary.vsLastPeriod.users} />
        <SummaryCard label="Páginas vistas" value={fmtNum(summary.pageViews)} change={summary.vsLastPeriod.pageViews} />
        <SummaryCard label="Sesiones nuevas" value={fmtNum(summary.newSessions)} change={summary.vsLastPeriod.newSessions} />
      </div>
    </section>
  );
}

function Dashboard2({ data, showAll, setShowAll }: { data: SimulationResult; showAll: boolean; setShowAll: (v: boolean) => void }) {
  const rows = showAll ? data.urlStats : data.urlStats.slice(0, 15);
  return (
    <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-base font-bold text-[#1E3A5F] mb-5 uppercase tracking-wide">2. Páginas más visitadas</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-slate-200">
              {['URL','Visitas','% total','T. promedio','Rebote'].map(h => (
                <th key={h} className={`py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest ${h==='URL'?'text-left pr-4':'text-right px-3'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-2.5 pr-4 font-mono text-[11px] text-slate-600 max-w-[260px] truncate">{row.url}</td>
                <td className="py-2.5 px-3 text-right font-semibold text-slate-900">{fmtNum(row.visits)}</td>
                <td className="py-2.5 px-3 text-right text-slate-500">{fmtPct(row.pct)}</td>
                <td className={`py-2.5 px-3 text-right font-medium ${timeColor(row.avgTimeSeconds)}`}>{row.avgTime}</td>
                <td className="py-2.5 pl-3 text-right text-slate-500">{fmtPct(row.bounce)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.urlStats.length > 15 && (
        <button type="button" onClick={() => setShowAll(!showAll)}
          className="mt-4 text-sm text-[#1E3A5F] hover:underline font-medium">
          {showAll ? 'Ver menos ↑' : `Ver todas (${data.urlStats.length}) ↓`}
        </button>
      )}
      <div className="mt-4 flex gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-emerald-500" /> T. promedio {'>'} 3:00</span>
        <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-amber-400" /> 1:30 – 3:00</span>
        <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-red-400" /> {'<'} 1:30</span>
      </div>
    </section>
  );
}

function Dashboard3({ data, view, setView }: { data: SimulationResult; view: 'cities'|'countries'; setView: (v:'cities'|'countries')=>void }) {
  const chartData = view === 'countries'
    ? data.countries.map(c => ({ name: c.country, pct: parseFloat(c.pct.toFixed(1)) }))
    : data.cities.map(c => ({ name: c.city, pct: parseFloat(c.pct.toFixed(1)) }));
  return (
    <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <h2 className="text-base font-bold text-[#1E3A5F] uppercase tracking-wide">3. Distribución geográfica</h2>
        <div className="flex rounded-lg border border-slate-200 overflow-hidden text-sm">
          {(['cities','countries'] as const).map(v => (
            <button key={v} type="button" onClick={() => setView(v)}
              className={`px-4 py-1.5 font-medium transition ${view===v ? 'bg-[#1E3A5F] text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
              {v === 'cities' ? 'Por ciudad' : 'Por país'}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={view==='countries' ? 110 : 460}>
        <BarChart data={chartData} layout="vertical" margin={{ top:0, right:40, left:0, bottom:0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
          <XAxis type="number" tick={{ fontSize:10 }} tickFormatter={v => `${v}%`} />
          <YAxis type="category" dataKey="name" width={165} tick={{ fontSize:11 }} />
          <Tooltip formatter={(v: number) => `${v}%`} />
          <Bar dataKey="pct" name="% de visitas" fill="#1E3A5F" radius={[0,4,4,0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
      {view === 'cities' && (
        <div className="mt-4 bg-blue-50 rounded-lg p-4 border border-blue-100">
          <p className="text-sm text-[#1E3A5F] font-medium">
            💡 El 65% del tráfico mexicano proviene de las 3 principales áreas metropolitanas del país.
          </p>
        </div>
      )}
    </section>
  );
}

function Dashboard4({ data }: { data: SimulationResult }) {
  const { engagement } = data;
  const chartData = engagement.sectionTimes.map((s, i) => ({ name: s.section, segundos: s.avgSeconds, color: COLORS[i] }));
  return (
    <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-base font-bold text-[#1E3A5F] mb-5 uppercase tracking-wide">4. Engagement y comportamiento</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Tiempo promedio en página" value={engagement.avgTime} sub="min:seg" />
        <MetricCard label="Tasa de rebote" value={fmtPct(engagement.bounceRate)} />
        <MetricCard label="Páginas por sesión" value={engagement.pagesPerSession.toFixed(1)} />
        <MetricCard label="Conversión a contacto" value={fmtPct(engagement.conversionRate)} />
      </div>
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Tiempo promedio por sección</h3>
      <ResponsiveContainer width="100%" height={210}>
        <BarChart data={chartData} margin={{ top:0, right:20, left:0, bottom:0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fontSize:10 }} />
          <YAxis tick={{ fontSize:10 }} tickFormatter={v => fmtTime(v)} />
          <Tooltip formatter={(v: number) => fmtTime(v)} />
          <Bar dataKey="segundos" name="Tiempo promedio" radius={[4,4,0,0]}>
            {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-6 space-y-2.5">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Insights</h3>
        {engagement.insights.map((txt, i) => (
          <div key={i} className="flex items-start gap-3 bg-slate-50 rounded-lg p-3 border border-slate-100">
            <span className="text-[#1E3A5F] font-bold text-sm shrink-0 mt-0.5">→</span>
            <p className="text-sm text-slate-700">{txt}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Dashboard5({ data }: { data: SimulationResult }) {
  const { trafficSources } = data;
  return (
    <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-base font-bold text-[#1E3A5F] mb-5 uppercase tracking-wide">5. Fuentes de tráfico</h2>
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="w-full lg:w-64 shrink-0 flex justify-center">
          <ResponsiveContainer width={260} height={260}>
            <PieChart>
              <Pie data={trafficSources.donut} cx="50%" cy="50%" innerRadius={72} outerRadius={115} dataKey="value" labelLine={false}
                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                  const RADIAN = Math.PI / 180;
                  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
                  return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">{`${(percent * 100).toFixed(0)}%`}</text>;
                }}>
                {trafficSources.donut.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v: number) => `${v}%`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 w-full overflow-x-auto">
          <table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr className="border-b border-slate-200">
                {['Fuente','Sesiones','%','T. promedio','Rebote'].map(h => (
                  <th key={h} className={`py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest ${h==='Fuente'?'text-left pr-4':'text-right px-3'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trafficSources.rows.map((row, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2.5 pr-4">
                    <span className="font-medium text-slate-900">{row.source}</span>
                    <span className="ml-2 text-[10px] text-slate-400 bg-slate-100 rounded px-1.5 py-0.5">{row.group}</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold text-slate-900">{fmtNum(row.sessions)}</td>
                  <td className="py-2.5 px-3 text-right text-slate-500">{fmtPct(row.pct)}</td>
                  <td className="py-2.5 px-3 text-right text-slate-500">{row.avgTime}</td>
                  <td className="py-2.5 pl-3 text-right text-slate-500">{fmtPct(row.bounce)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
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
  const [geoView, setGeoView] = useState<'cities'|'countries'>('cities');
  const [showAllUrls, setShowAllUrls] = useState(false);
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
    setShowAllUrls(false);
  };

  const handleExport = () => {
    if (!simData) return;
    const { summary, engagement, trafficSources, urlStats, config } = simData;
    const PERIOD_LABEL: Record<Period, string> = { '7d':'Últimos 7 días','30d':'Últimos 30 días','90d':'Últimos 90 días','12m':'Últimos 12 meses' };
    const lines = [
      'REPORTE ANALYTICS — TRIPOLI MEDIA',
      `Período: ${PERIOD_LABEL[config.period]}`,
      `Generado: ${new Date().toLocaleString('es-MX')}`,
      '',
      '=== RESUMEN ===',
      `Sesiones totales: ${fmtNum(summary.totalSessions)}`,
      `Usuarios únicos: ${fmtNum(summary.uniqueUsers)}`,
      `Páginas vistas: ${fmtNum(summary.pageViews)}`,
      `Sesiones nuevas: ${fmtNum(summary.newSessions)}`,
      '',
      '=== ENGAGEMENT ===',
      `Tiempo promedio en página: ${engagement.avgTime}`,
      `Tasa de rebote: ${fmtPct(engagement.bounceRate)}`,
      `Páginas por sesión: ${engagement.pagesPerSession.toFixed(1)}`,
      `Tasa de conversión: ${fmtPct(engagement.conversionRate)}`,
      '',
      '=== FUENTES DE TRÁFICO ===',
      ...trafficSources.rows.map(r => `${r.source}: ${fmtNum(r.sessions)} sesiones (${fmtPct(r.pct)})`),
      '',
      '=== PÁGINAS MÁS VISITADAS ===',
      ...urlStats.slice(0, 10).map(u => `${u.url}: ${fmtNum(u.visits)} visitas (${fmtPct(u.pct)})`),
      '',
      '=== INSIGHTS ===',
      ...engagement.insights,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `tripoli-analytics-${config.period}-${Date.now()}.txt`;
    a.click();
  };

  if (isChecking) {
    return <main className="min-h-screen bg-slate-50 flex items-center justify-center"><p className="text-slate-400 text-sm">Verificando sesión...</p></main>;
  }
  if (!session?.ok || session?.email !== OWNER_EMAIL) return null;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl flex flex-col gap-6">

        {/* Header */}
        <header className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <a href="/admin" className="text-xs text-[#1E3A5F] hover:underline mb-3 block">← Volver al panel</a>
          <h1 className="text-2xl font-bold text-[#1E3A5F]">Analytics — Tripoli Media</h1>
          <p className="text-sm text-slate-400 mt-1">Simulación de métricas del sitio</p>

          {/* Config panel */}
          <div className="mt-6 bg-slate-50 rounded-xl p-5 border border-slate-200">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Configurar simulación</p>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-600">Visitas totales</label>
                <input type="number" min="100" value={visits}
                  onChange={e => setVisits(Math.max(100, parseInt(e.target.value) || 100))}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-600">Período</label>
                <select value={period} onChange={e => setPeriod(e.target.value as Period)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]">
                  <option value="7d">Últimos 7 días</option>
                  <option value="30d">Últimos 30 días</option>
                  <option value="90d">Últimos 90 días</option>
                  <option value="12m">Últimos 12 meses</option>
                </select>
              </div>
              <button type="button" onClick={handleGenerate}
                className="rounded-lg bg-[#1E3A5F] px-5 py-2 text-sm font-semibold text-white hover:bg-[#162d4a] transition">
                Generar simulación
              </button>
            </div>
          </div>
        </header>

        {/* Dashboards */}
        {simData && mounted && (
          <>
            <Dashboard1 data={simData} period={period} />
            <Dashboard2 data={simData} showAll={showAllUrls} setShowAll={setShowAllUrls} />
            <Dashboard3 data={simData} view={geoView} setView={setGeoView} />
            <Dashboard4 data={simData} />
            <Dashboard5 data={simData} />
            <div className="flex justify-end pb-4">
              <button type="button" onClick={handleExport}
                className="rounded-lg border border-[#1E3A5F] px-5 py-2.5 text-sm font-semibold text-[#1E3A5F] hover:bg-[#1E3A5F] hover:text-white transition">
                ↓ Exportar reporte (.txt)
              </button>
            </div>
          </>
        )}

        {!simData && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
            <p className="text-lg font-medium">Configura los parámetros y haz clic en <strong className="text-[#1E3A5F]">Generar simulación</strong></p>
          </div>
        )}
      </div>
    </main>
  );
}
