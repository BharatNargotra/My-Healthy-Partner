import { useState, useEffect } from 'react';
import api from '../services/api.js';
import toast from 'react-hot-toast';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';
import { format } from 'date-fns';
import CalendarView from '../components/CalendarView.jsx';

const TT = ({ active, payload, label, unit = '' }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '10px 14px', fontFamily: 'DM Sans' }}>
      <div style={{ color: 'var(--muted)', fontSize: '12px', marginBottom: '4px' }}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color, fontSize: '13px', fontWeight: 600 }}>
          {p.name}: {p.value ?? '—'}{unit}
        </div>
      ))}
    </div>
  );
};

const SectionHead = ({ children }) => (
  <h3 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '13px', color: 'var(--muted)', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: '14px' }}>
    {children}
  </h3>
);

export default function Progress() {
  const [period, setPeriod] = useState('1m');
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [selDay, setSelDay]   = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data: res } = await api.get(`/progress?period=${period}`);
        setData(res);
      } catch { toast.error('Failed to load progress'); }
      finally { setLoading(false); }
    })();
  }, [period]);

  const chartData = data?.rawLogs?.map((l) => ({
    date:     format(new Date(l.date), 'MMM d'),
    weight:   l.weight   || null,
    burned:   l.caloriesBurned   || 0,
    consumed: l.caloriesConsumed || 0,
    sleep:    l.sleep    || null,
    exercises:l.exerciseCount,
    protein:  l.protein  || 0,
    carbs:    l.carbs    || 0,
    fat:      l.fat      || 0,
  })) || [];

  // Mood distribution for radar
  const moodOrder = ['great', 'good', 'okay', 'bad', 'terrible'];
  const moodData  = moodOrder.map((m) => ({ mood: m.charAt(0).toUpperCase() + m.slice(1), count: data?.moodDist?.[m] || 0 }));

  const axisStyle = { fill: 'var(--muted)', fontSize: 11, fontFamily: 'DM Sans' };

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '26px', letterSpacing: '-0.02em', marginBottom: '3px' }}>Progress</h1>
          <p style={{ color: 'var(--muted)', fontSize: '13px' }}>Your health journey at a glance</p>
        </div>
        <div style={{ display: 'flex', gap: '5px', background: 'var(--surface)', border: '1px solid var(--border)', padding: '4px', borderRadius: 'var(--radius)' }}>
          {[{ v: '1m', l: '1 Month' }, { v: '3m', l: '3 Months' }, { v: '6m', l: '6 Months' }].map((o) => (
            <button key={o.v} onClick={() => setPeriod(o.v)} style={{
              padding: '7px 16px', borderRadius: '8px', border: 'none',
              background: period === o.v ? 'var(--lime)' : 'transparent',
              color: period === o.v ? '#0a0a0a' : 'var(--muted)',
              fontFamily: 'Syne', fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'all .18s',
            }}>{o.l}</button>
          ))}
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', paddingTop: '60px' }}>
          <span className="spinner" style={{ width: 28, height: 28 }} />
        </div>
      )}

      {!loading && data && (
        <>
          {/* Summary stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: '10px', marginBottom: '24px' }}>
            {[
              { label: 'Active Days',     value: `${data.activeDays}/${data.totalDays}`, color: '#a3e635', icon: '📅' },
              { label: 'Avg Cal Burned',  value: data.avgCaloriesBurned,  unit: '/day', color: '#f59e0b', icon: '🔥' },
              { label: 'Avg Cal Intake',  value: data.avgCaloriesConsumed, unit: '/day', color: '#60a5fa', icon: '🍽️' },
              { label: 'Weight Change',   value: data.weightChange !== null ? (data.weightChange > 0 ? `+${data.weightChange}` : `${data.weightChange}`) : '—', unit: data.weightChange !== null ? ' kg' : '', color: data.weightChange < 0 ? '#a3e635' : '#f87171', icon: '⚖️' },
              { label: 'Avg Sleep',       value: data.avgSleep || '—', unit: data.avgSleep ? ' hrs' : '', color: '#a78bfa', icon: '😴' },
            ].map((s) => (
              <div key={s.label} className="stat-card">
                <div style={{ fontSize: '20px', marginBottom: '8px' }}>{s.icon}</div>
                <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '20px', color: s.color, marginBottom: '4px' }}>{s.value}{s.unit || ''}</div>
                <div style={{ color: 'var(--muted)', fontSize: '10px', fontWeight: 600, letterSpacing: '.07em', textTransform: 'uppercase', fontFamily: 'Syne' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {chartData.length > 0 ? (
            <>
              {/* Row 1: Weight + Calories */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px,1fr))', gap: '16px', marginBottom: '16px' }}>

                {chartData.some((d) => d.weight) && (
                  <div className="card">
                    <SectionHead>Weight Trend</SectionHead>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#a3e635" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#a3e635" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                        <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false} />
                        <YAxis tick={axisStyle} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                        <Tooltip content={<TT unit=" kg" />} />
                        <Area type="monotone" dataKey="weight" name="Weight" stroke="#a3e635" fill="url(#wg)" strokeWidth={2} dot={{ fill: '#a3e635', r: 3 }} connectNulls />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div className="card">
                  <SectionHead>Calories In vs Out</SectionHead>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                      <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false} />
                      <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
                      <Tooltip content={<TT unit=" kcal" />} />
                      <Line type="monotone" dataKey="consumed" name="Consumed" stroke="#f59e0b" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="burned"   name="Burned"   stroke="#a3e635" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                    {[{ c: '#f59e0b', l: 'Consumed' }, { c: '#a3e635', l: 'Burned' }].map((x) => (
                      <div key={x.l} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: 12, height: 2, background: x.c, borderRadius: 1 }} />
                        <span style={{ color: 'var(--muted)', fontSize: '12px' }}>{x.l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 2: Workout freq + Sleep */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px,1fr))', gap: '16px', marginBottom: '16px' }}>
                <div className="card">
                  <SectionHead>Workout Sessions</SectionHead>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                      <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false} />
                      <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<TT />} />
                      <Bar dataKey="exercises" name="Exercises" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {chartData.some((d) => d.sleep) && (
                  <div className="card">
                    <SectionHead>Sleep Duration</SectionHead>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#a78bfa" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                        <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false} />
                        <YAxis tick={axisStyle} axisLine={false} tickLine={false} domain={[0, 12]} />
                        <Tooltip content={<TT unit=" hrs" />} />
                        <ReferenceLine y={8} stroke="#a78bfa" strokeDasharray="3 3" strokeOpacity={0.5} label={{ value: '8h goal', fill: '#a78bfa', fontSize: 11 }} />
                        <Area type="monotone" dataKey="sleep" name="Sleep" stroke="#a78bfa" fill="url(#sg)" strokeWidth={2} connectNulls />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Row 3: Macros stacked + Mood radar */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px,1fr))', gap: '16px', marginBottom: '16px' }}>
                <div className="card">
                  <SectionHead>Daily Macros (g)</SectionHead>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                      <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false} />
                      <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
                      <Tooltip content={<TT unit=" g" />} />
                      <Bar dataKey="protein" name="Protein" stackId="m" fill="#60a5fa" />
                      <Bar dataKey="carbs"   name="Carbs"   stackId="m" fill="#a3e635" />
                      <Bar dataKey="fat"     name="Fat"     stackId="m" fill="#f87171" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', gap: '14px', marginTop: '8px' }}>
                    {[{ c: '#60a5fa', l: 'Protein' }, { c: '#a3e635', l: 'Carbs' }, { c: '#f87171', l: 'Fat' }].map((x) => (
                      <div key={x.l} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: x.c }} />
                        <span style={{ color: 'var(--muted)', fontSize: '12px' }}>{x.l}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {Object.keys(data.moodDist || {}).length > 0 && (
                  <div className="card">
                    <SectionHead>Mood Distribution</SectionHead>
                    <ResponsiveContainer width="100%" height={200}>
                      <RadarChart data={moodData} outerRadius={70}>
                        <PolarGrid stroke="#2a2a2a" />
                        <PolarAngleAxis dataKey="mood" tick={{ fill: 'var(--muted)', fontSize: 11, fontFamily: 'DM Sans' }} />
                        <Radar name="Mood" dataKey="count" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.2} />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Weekly breakdown */}
              {data.weeklyData?.length > 1 && (
                <div className="card" style={{ marginBottom: '16px' }}>
                  <SectionHead>Weekly Breakdown</SectionHead>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={data.weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                      <XAxis dataKey="weekStart" tick={axisStyle} axisLine={false} tickLine={false}
                        tickFormatter={(v) => format(new Date(v), 'MMM d')} />
                      <YAxis yAxisId="l" tick={axisStyle} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="r" orientation="right" tick={axisStyle} axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Bar yAxisId="l" dataKey="workoutDays" name="Workout Days" fill="#a3e635" radius={[4,4,0,0]} />
                      <Bar yAxisId="r" dataKey="avgCalories"  name="Avg Cal"      fill="#f59e0b" radius={[4,4,0,0]} opacity={0.7} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          ) : (
            <div style={{ background: 'var(--surface)', border: '1px dashed var(--border2)', borderRadius: 'var(--radius-lg)', padding: '48px', textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>📊</div>
              <p style={{ color: 'var(--muted)', fontSize: '14px' }}>No data yet — start logging!</p>
            </div>
          )}

          {/* Activity calendar */}
          <div className="card">
            <SectionHead>Activity Calendar</SectionHead>
            <CalendarView calendarData={data.calendarData} onDayClick={(day, d) => setSelDay({ day, ...d })} />
            {selDay && (
              <div style={{ marginTop: '16px', padding: '14px 18px', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 'var(--radius)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '14px' }}>{format(selDay.day, 'EEEE, MMMM d')}</span>
                  <button onClick={() => setSelDay(null)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '18px' }}>×</button>
                </div>
                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                  {selDay.caloriesConsumed > 0 && <span style={{ color: '#f59e0b', fontSize: '13px' }}>🔥 {selDay.caloriesConsumed} kcal in</span>}
                  {selDay.caloriesBurned > 0   && <span style={{ color: '#a3e635', fontSize: '13px' }}>⚡ {selDay.caloriesBurned} kcal burned</span>}
                  {selDay.weight                && <span style={{ color: '#60a5fa', fontSize: '13px' }}>⚖️ {selDay.weight} kg</span>}
                  {selDay.sleep                 && <span style={{ color: '#a78bfa', fontSize: '13px' }}>😴 {selDay.sleep} hrs</span>}
                  {selDay.mood                  && <span style={{ color: 'var(--muted)', fontSize: '13px', textTransform: 'capitalize' }}>Mood: {selDay.mood}</span>}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
