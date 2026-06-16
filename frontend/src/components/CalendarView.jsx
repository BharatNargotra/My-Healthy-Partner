import { useState } from 'react';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, startOfWeek, endOfWeek, isToday } from 'date-fns';

export default function CalendarView({ calendarData = {}, onDayClick }) {
  const [month, setMonth] = useState(new Date());

  const start = startOfWeek(startOfMonth(month));
  const end   = endOfWeek(endOfMonth(month));
  const days  = eachDayOfInterval({ start, end });

  const dot = (d) => {
    if (!d) return null;
    const dots = [];
    if (d.hasWorkout)  dots.push(<span key="w" style={{ width: 5, height: 5, borderRadius: '50%', background: '#a3e635', display: 'inline-block' }} />);
    if (d.hasMeal)     dots.push(<span key="m" style={{ width: 5, height: 5, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />);
    return dots;
  };

  return (
    <div>
      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <button onClick={() => setMonth((m) => { const n = new Date(m); n.setMonth(n.getMonth() - 1); return n; })}
          style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--muted)', padding: '6px 12px', cursor: 'pointer', fontSize: '14px' }}>
          ←
        </button>
        <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '15px' }}>{format(month, 'MMMM yyyy')}</span>
        <button onClick={() => setMonth((m) => { const n = new Date(m); n.setMonth(n.getMonth() + 1); return n; })}
          style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--muted)', padding: '6px 12px', cursor: 'pointer', fontSize: '14px' }}>
          →
        </button>
      </div>

      {/* Day-of-week headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '4px' }}>
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <div key={d} style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '11px', fontWeight: 600, fontFamily: 'Syne', letterSpacing: '.06em', padding: '4px 0' }}>{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
        {days.map((day) => {
          const key     = format(day, 'yyyy-MM-dd');
          const dayData = calendarData[key];
          const inMonth = isSameMonth(day, month);
          const today   = isToday(day);

          return (
            <div key={key} onClick={() => dayData && onDayClick?.(day, dayData)}
              style={{
                minHeight: '46px', borderRadius: '8px', padding: '6px',
                background: today ? 'rgba(163,230,53,.12)' : dayData ? 'var(--surface2)' : 'transparent',
                border: `1px solid ${today ? 'rgba(163,230,53,.4)' : dayData ? 'var(--border)' : 'transparent'}`,
                cursor: dayData ? 'pointer' : 'default',
                opacity: inMonth ? 1 : 0.3,
                transition: 'all .12s',
              }}>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '12px', color: today ? 'var(--lime)' : inMonth ? 'var(--text)' : 'var(--muted)', fontWeight: today ? 600 : 400, marginBottom: '4px' }}>
                {format(day, 'd')}
              </div>
              {dayData && (
                <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap' }}>
                  {dot(dayData)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
        {[{ color: '#a3e635', label: 'Workout' }, { color: '#f59e0b', label: 'Meal logged' }].map((l) => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: l.color, display: 'inline-block' }} />
            <span style={{ color: 'var(--muted)', fontSize: '12px' }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
