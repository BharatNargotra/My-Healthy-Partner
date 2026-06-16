import { useState, useEffect, useCallback } from 'react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const moodEmoji    = { great: '😄', good: '😊', okay: '😐', bad: '😔', terrible: '😞' };
const catEmoji     = { cardio: '🏃', strength: '🏋️', flexibility: '🧘', sports: '⚽', other: '💪' };
const mealEmoji    = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' };

// Small inline progress bar
const CalBar = ({ value, goal, color }) => {
  const pct = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;
  return (
    <div style={{ marginTop: '6px' }}>
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '3px' }}>
        {value} / {goal} {pct >= 100 ? '✓' : ''}
      </div>
    </div>
  );
};

export default function DailyLog() {
  const { user } = useAuth();
  const [log, setLog]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]       = useState('workout');
  const [addingEx, setAddingEx]   = useState(false);
  const [addingMeal, setAddingMeal] = useState(false);
  const [insight, setInsight]     = useState('');
  const [insightLoading, setInsightLoading] = useState(false);
  const [aiMealLoading, setAiMealLoading]   = useState(false);
  const [aiExLoading, setAiExLoading]       = useState(false);

  const [exForm, setEx] = useState({ name: '', category: 'strength', duration: '', sets: '', reps: '', weight: '', caloriesBurned: '', notes: '' });
  const [mealForm, setMeal] = useState({ name: '', mealType: 'lunch', calories: '', protein: '', carbs: '', fat: '', quantity: '', notes: '' });
  const [vitals, setVitals] = useState({ waterIntake: 0, weight: '', mood: 'good', sleep: '', notes: '' });

  const fetchLog = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/logs/today');
      setLog(data);
      setVitals({ waterIntake: data.waterIntake || 0, weight: data.weight || '', mood: data.mood || 'good', sleep: data.sleep || '', notes: data.notes || '' });
    } catch { toast.error('Failed to load today's log'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchLog(); }, [fetchLog]);

  // AI: fetch daily insight once log is loaded and has some data
  useEffect(() => {
    if (!log) return;
    if (log.meals?.length === 0 && log.exercises?.length === 0) return;
    const timer = setTimeout(async () => {
      setInsightLoading(true);
      try {
        const { data } = await api.get('/ai/daily-insight');
        setInsight(data.insight);
      } catch { /* silent fail */ }
      finally { setInsightLoading(false); }
    }, 800);
    return () => clearTimeout(timer);
  }, [log]);

  // AI: auto-fill meal macros
  const handleAiMealAnalyze = async () => {
    if (!mealForm.name) { toast.error('Enter a food name first'); return; }
    setAiMealLoading(true);
    try {
      const { data } = await api.post('/ai/analyze-meal', { name: mealForm.name, quantity: mealForm.quantity });
      setMeal((f) => ({ ...f, calories: data.calories || '', protein: data.protein || '', carbs: data.carbs || '', fat: data.fat || '' }));
      toast.success('Macros filled by AI!');
    } catch { toast.error('AI unavailable'); }
    finally { setAiMealLoading(false); }
  };

  // AI: estimate calories burned
  const handleAiCalEstimate = async () => {
    if (!exForm.name || !exForm.duration) { toast.error('Enter exercise name and duration first'); return; }
    setAiExLoading(true);
    try {
      const { data } = await api.post('/ai/estimate-exercise', { name: exForm.name, duration: Number(exForm.duration) });
      setEx((f) => ({ ...f, caloriesBurned: data.caloriesBurned || '' }));
      toast.success('Calories estimated!');
    } catch { toast.error('AI unavailable'); }
    finally { setAiExLoading(false); }
  };

  const addExercise = async (e) => {
    e.preventDefault();
    if (!exForm.name) { toast.error('Exercise name required'); return; }
    try {
      const { data } = await api.post('/logs/exercise', exForm);
      setLog(data); setAddingEx(false);
      setEx({ name: '', category: 'strength', duration: '', sets: '', reps: '', weight: '', caloriesBurned: '', notes: '' });
      toast.success('Exercise logged!');
    } catch { toast.error('Failed to log exercise'); }
  };

  const addMeal = async (e) => {
    e.preventDefault();
    if (!mealForm.name) { toast.error('Meal name required'); return; }
    try {
      const { data } = await api.post('/logs/meal', mealForm);
      setLog(data); setAddingMeal(false);
      setMeal({ name: '', mealType: 'lunch', calories: '', protein: '', carbs: '', fat: '', quantity: '', notes: '' });
      toast.success('Meal logged!');
    } catch { toast.error('Failed to log meal'); }
  };

  const saveVitals = async () => {
    try {
      const { data } = await api.put('/logs/today', vitals);
      setLog(data); toast.success('Vitals saved!');
    } catch { toast.error('Failed to save'); }
  };

  const delExercise = async (id) => {
    try { const { data } = await api.delete(`/logs/exercise/${log._id}/${id}`); setLog(data); } catch { toast.error('Failed'); }
  };
  const delMeal = async (id) => {
    try { const { data } = await api.delete(`/logs/meal/${log._id}/${id}`); setLog(data); } catch { toast.error('Failed'); }
  };
  const handleWater = async (delta) => {
    const v = Math.max(0, (vitals.waterIntake || 0) + delta);
    setVitals((prev) => ({ ...prev, waterIntake: v }));
    try { await api.put('/logs/today', { waterIntake: v }); } catch {}
  };

  if (loading) return (
    <div style={{ textAlign: 'center', paddingTop: '80px' }}>
      <span className="spinner" style={{ width: 28, height: 28 }} />
    </div>
  );

  const macros = (log?.meals || []).reduce((a, m) => ({
    calories: a.calories + (Number(m.calories) || 0),
    protein:  a.protein  + (Number(m.protein)  || 0),
    carbs:    a.carbs    + (Number(m.carbs)     || 0),
    fat:      a.fat      + (Number(m.fat)       || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const calorieGoal = user?.dailyCalorieGoal || 2000;
  const waterGoal   = user?.dailyWaterGoal   || 8;
  const netCal      = macros.calories - (log?.totalCaloriesBurned || 0);

  const tabs = [
    { id: 'workout', label: '🏋️ Workout', count: log?.exercises?.length || 0 },
    { id: 'diet',    label: '🥗 Diet',    count: log?.meals?.length || 0 },
    { id: 'vitals',  label: '💊 Vitals',  count: null },
  ];

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '26px', letterSpacing: '-0.02em', marginBottom: '3px' }}>Today's Log</h1>
          <p style={{ color: 'var(--muted)', fontSize: '13px' }}>{format(new Date(), 'EEEE, MMMM do yyyy')}</p>
        </div>

        {/* Quick stats */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {[
            { label: 'Cal In',  value: log?.totalCaloriesConsumed || 0, color: '#f59e0b', icon: '🔥' },
            { label: 'Cal Out', value: log?.totalCaloriesBurned   || 0, color: '#a3e635', icon: '⚡' },
            { label: 'Net',     value: netCal,  color: netCal <= calorieGoal ? '#a3e635' : '#f87171', icon: '⚖️' },
            { label: 'Water',   value: `${vitals.waterIntake}/${waterGoal}`, color: '#60a5fa', icon: '💧' },
          ].map((s) => (
            <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '16px' }}>{s.icon}</span>
              <div>
                <div style={{ fontFamily: 'JetBrains Mono', fontWeight: 600, fontSize: '14px', color: s.color }}>{s.value}</div>
                <div style={{ color: 'var(--muted)', fontSize: '10px', fontFamily: 'Syne', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Calorie goal bar */}
      <div style={{ marginBottom: '20px', padding: '14px 18px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'Syne', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' }}>Daily Calorie Goal</span>
          <span style={{ fontSize: '12px', color: 'var(--text)', fontFamily: 'JetBrains Mono' }}>{macros.calories} / {calorieGoal} kcal</span>
        </div>
        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{ width: `${Math.min((macros.calories / calorieGoal) * 100, 100)}%`, background: macros.calories > calorieGoal ? '#f87171' : 'var(--lime)' }} />
        </div>
      </div>

      {/* AI Insight */}
      {(insight || insightLoading) && (
        <div style={{ marginBottom: '20px', padding: '16px 18px', background: 'rgba(139,92,246,.08)', border: '1px solid rgba(139,92,246,.2)', borderRadius: 'var(--radius)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="ai-badge">✦ Daily Insight</span>
          </div>
          {insightLoading
            ? <div style={{ height: '16px', background: 'rgba(139,92,246,.1)', borderRadius: '4px', width: '80%' }} />
            : <p style={{ color: '#c4b5fd', fontSize: '13px', lineHeight: '1.65', margin: 0 }}>{insight}</p>}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'var(--surface)', padding: '4px', borderRadius: 'var(--radius)', width: 'fit-content', border: '1px solid var(--border)' }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '8px 18px', borderRadius: '8px', border: 'none',
            background: tab === t.id ? 'var(--lime)' : 'transparent',
            color: tab === t.id ? '#0a0a0a' : 'var(--muted)',
            fontFamily: 'Syne', fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'all .18s',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            {t.label}
            {t.count !== null && t.count > 0 && (
              <span style={{ background: tab === t.id ? 'rgba(0,0,0,.2)' : 'var(--border2)', borderRadius: '100px', padding: '1px 7px', fontSize: '11px' }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── WORKOUT TAB ── */}
      {tab === 'workout' && (
        <div>
          {(log?.exercises || []).length === 0 && !addingEx && (
            <div style={{ background: 'var(--surface)', border: '1px dashed var(--border2)', borderRadius: 'var(--radius-lg)', padding: '48px', textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>🏋️</div>
              <p style={{ color: 'var(--muted)', margin: '0 0 16px', fontSize: '14px' }}>No exercises logged yet</p>
              <button className="btn-primary" onClick={() => setAddingEx(true)}>+ Log Exercise</button>
            </div>
          )}
          {(log?.exercises || []).map((ex) => (
            <div key={ex._id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '14px 18px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: 38, height: 38, borderRadius: '10px', background: 'rgba(163,230,53,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px' }}>
                  {catEmoji[ex.category] || '💪'}
                </div>
                <div>
                  <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '14px', marginBottom: '3px' }}>{ex.name}</div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {ex.duration && <span style={{ color: 'var(--muted)', fontSize: '12px' }}>⏱ {ex.duration} min</span>}
                    {ex.sets && <span style={{ color: 'var(--muted)', fontSize: '12px' }}>× {ex.sets} sets</span>}
                    {ex.reps && <span style={{ color: 'var(--muted)', fontSize: '12px' }}>× {ex.reps} reps</span>}
                    {ex.weight && <span style={{ color: 'var(--muted)', fontSize: '12px' }}>⚖️ {ex.weight} kg</span>}
                    {ex.caloriesBurned > 0 && <span style={{ color: 'var(--lime)', fontSize: '12px', fontWeight: 600 }}>🔥 {ex.caloriesBurned} kcal</span>}
                  </div>
                </div>
              </div>
              <button onClick={() => delExercise(ex._id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '18px', opacity: .7 }}>×</button>
            </div>
          ))}

          {addingEx && (
            <div className="card" style={{ marginTop: '12px' }}>
              <h3 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '15px', marginBottom: '18px' }}>Log Exercise</h3>
              <form onSubmit={addExercise}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label className="label">Exercise Name *</label>
                    <input className="input-field" value={exForm.name} onChange={(e) => setEx((f) => ({ ...f, name: e.target.value }))} placeholder="Bench Press" />
                  </div>
                  <div>
                    <label className="label">Category</label>
                    <select className="input-field" value={exForm.category} onChange={(e) => setEx((f) => ({ ...f, category: e.target.value }))}>
                      {Object.keys(catEmoji).map((c) => <option key={c} value={c}>{catEmoji[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Duration (min)</label>
                    <input className="input-field" type="number" value={exForm.duration} onChange={(e) => setEx((f) => ({ ...f, duration: e.target.value }))} placeholder="30" />
                  </div>
                  <div>
                    <label className="label">Calories Burned</label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input className="input-field" type="number" value={exForm.caloriesBurned} onChange={(e) => setEx((f) => ({ ...f, caloriesBurned: e.target.value }))} placeholder="200" />
                      <button type="button" onClick={handleAiCalEstimate} disabled={aiExLoading}
                        title="Estimate with AI"
                        style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(139,92,246,.4)', background: 'rgba(139,92,246,.1)', color: '#a78bfa', cursor: 'pointer', fontWeight: 700, fontSize: '12px', whiteSpace: 'nowrap', opacity: aiExLoading ? .6 : 1 }}>
                        {aiExLoading ? '…' : '✦ AI'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="label">Sets</label>
                    <input className="input-field" type="number" value={exForm.sets} onChange={(e) => setEx((f) => ({ ...f, sets: e.target.value }))} placeholder="3" />
                  </div>
                  <div>
                    <label className="label">Reps</label>
                    <input className="input-field" type="number" value={exForm.reps} onChange={(e) => setEx((f) => ({ ...f, reps: e.target.value }))} placeholder="10" />
                  </div>
                  <div>
                    <label className="label">Weight (kg)</label>
                    <input className="input-field" type="number" step="0.5" value={exForm.weight} onChange={(e) => setEx((f) => ({ ...f, weight: e.target.value }))} placeholder="50" />
                  </div>
                  <div>
                    <label className="label">Notes</label>
                    <input className="input-field" value={exForm.notes} onChange={(e) => setEx((f) => ({ ...f, notes: e.target.value }))} placeholder="Optional" />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="btn-primary">Add Exercise</button>
                  <button type="button" className="btn-ghost" onClick={() => setAddingEx(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}
          {!addingEx && (log?.exercises || []).length > 0 && (
            <button className="btn-secondary" style={{ marginTop: '12px' }} onClick={() => setAddingEx(true)}>+ Add More</button>
          )}
        </div>
      )}

      {/* ── DIET TAB ── */}
      {tab === 'diet' && (
        <div>
          {/* Macro summary */}
          {(log?.meals || []).length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
              {[
                { label: 'Calories', value: macros.calories, unit: 'kcal', color: '#f59e0b' },
                { label: 'Protein',  value: macros.protein,  unit: 'g',    color: '#60a5fa' },
                { label: 'Carbs',    value: macros.carbs,    unit: 'g',    color: '#a3e635' },
                { label: 'Fat',      value: macros.fat,      unit: 'g',    color: '#f87171' },
              ].map((m) => (
                <div key={m.label} style={{ background: `${m.color}12`, border: `1px solid ${m.color}28`, borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'JetBrains Mono', fontWeight: 600, fontSize: '18px', color: m.color }}>
                    {m.value}<span style={{ fontSize: '11px' }}>{m.unit}</span>
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: '11px', marginTop: '4px', fontFamily: 'Syne', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' }}>{m.label}</div>
                </div>
              ))}
            </div>
          )}

          {(log?.meals || []).length === 0 && !addingMeal && (
            <div style={{ background: 'var(--surface)', border: '1px dashed var(--border2)', borderRadius: 'var(--radius-lg)', padding: '48px', textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>🥗</div>
              <p style={{ color: 'var(--muted)', margin: '0 0 16px', fontSize: '14px' }}>No meals logged yet</p>
              <button className="btn-primary" onClick={() => setAddingMeal(true)}>+ Log Meal</button>
            </div>
          )}

          {(log?.meals || []).map((meal) => (
            <div key={meal._id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '14px 18px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: 38, height: 38, borderRadius: '10px', background: 'rgba(245,158,11,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px' }}>
                  {mealEmoji[meal.mealType] || '🍽️'}
                </div>
                <div>
                  <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '14px', marginBottom: '3px' }}>{meal.name}</div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--muted)', fontSize: '12px', textTransform: 'capitalize' }}>{meal.mealType}</span>
                    {meal.calories > 0 && <span style={{ color: '#f59e0b', fontSize: '12px', fontWeight: 600 }}>🔥 {meal.calories} kcal</span>}
                    {meal.protein > 0 && <span style={{ color: '#60a5fa', fontSize: '12px' }}>P:{meal.protein}g</span>}
                    {meal.carbs > 0   && <span style={{ color: '#a3e635', fontSize: '12px' }}>C:{meal.carbs}g</span>}
                    {meal.fat > 0     && <span style={{ color: '#f87171', fontSize: '12px' }}>F:{meal.fat}g</span>}
                    {meal.quantity    && <span style={{ color: 'var(--muted)', fontSize: '12px' }}>{meal.quantity}</span>}
                  </div>
                </div>
              </div>
              <button onClick={() => delMeal(meal._id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '18px', opacity: .7 }}>×</button>
            </div>
          ))}

          {addingMeal && (
            <div className="card" style={{ marginTop: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <h3 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '15px', margin: 0 }}>Log Meal</h3>
                <span style={{ color: 'var(--muted)', fontSize: '12px' }}>Enter food name & use ✦ AI to fill macros</span>
              </div>
              <form onSubmit={addMeal}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label className="label">Food Name *</label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input className="input-field" value={mealForm.name} onChange={(e) => setMeal((f) => ({ ...f, name: e.target.value }))} placeholder="Grilled Chicken" />
                      <button type="button" onClick={handleAiMealAnalyze} disabled={aiMealLoading}
                        title="Fill macros with AI"
                        style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(139,92,246,.4)', background: 'rgba(139,92,246,.1)', color: '#a78bfa', cursor: 'pointer', fontWeight: 700, fontSize: '12px', whiteSpace: 'nowrap', opacity: aiMealLoading ? .6 : 1 }}>
                        {aiMealLoading ? '…' : '✦ AI'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="label">Meal Type</label>
                    <select className="input-field" value={mealForm.mealType} onChange={(e) => setMeal((f) => ({ ...f, mealType: e.target.value }))}>
                      {Object.keys(mealEmoji).map((m) => <option key={m} value={m}>{mealEmoji[m]} {m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Calories (kcal)</label>
                    <input className="input-field" type="number" value={mealForm.calories} onChange={(e) => setMeal((f) => ({ ...f, calories: e.target.value }))} placeholder="400" />
                  </div>
                  <div>
                    <label className="label">Quantity</label>
                    <input className="input-field" value={mealForm.quantity} onChange={(e) => setMeal((f) => ({ ...f, quantity: e.target.value }))} placeholder="200g / 1 cup" />
                  </div>
                  <div>
                    <label className="label">Protein (g)</label>
                    <input className="input-field" type="number" value={mealForm.protein} onChange={(e) => setMeal((f) => ({ ...f, protein: e.target.value }))} placeholder="30" />
                  </div>
                  <div>
                    <label className="label">Carbs (g)</label>
                    <input className="input-field" type="number" value={mealForm.carbs} onChange={(e) => setMeal((f) => ({ ...f, carbs: e.target.value }))} placeholder="45" />
                  </div>
                  <div>
                    <label className="label">Fat (g)</label>
                    <input className="input-field" type="number" value={mealForm.fat} onChange={(e) => setMeal((f) => ({ ...f, fat: e.target.value }))} placeholder="12" />
                  </div>
                  <div>
                    <label className="label">Notes</label>
                    <input className="input-field" value={mealForm.notes} onChange={(e) => setMeal((f) => ({ ...f, notes: e.target.value }))} placeholder="Optional" />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="btn-primary">Add Meal</button>
                  <button type="button" className="btn-ghost" onClick={() => setAddingMeal(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}
          {!addingMeal && (log?.meals || []).length > 0 && (
            <button className="btn-secondary" style={{ marginTop: '12px' }} onClick={() => setAddingMeal(true)}>+ Add More</button>
          )}
        </div>
      )}

      {/* ── VITALS TAB ── */}
      {tab === 'vitals' && (
        <div className="card">
          <h3 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '16px', marginBottom: '24px' }}>Daily Vitals</h3>
          <div style={{ display: 'grid', gap: '20px' }}>

            {/* Water */}
            <div>
              <label className="label">Water Intake</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
                <button onClick={() => handleWater(-1)} style={{ width: 34, height: 34, borderRadius: '8px', background: 'var(--surface2)', border: '1px solid var(--border2)', color: 'var(--muted)', fontSize: '18px', cursor: 'pointer' }}>−</button>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  {Array.from({ length: waterGoal }).map((_, i) => (
                    <div key={i}
                      onClick={() => handleWater(i + 1 - vitals.waterIntake)}
                      style={{ width: 26, height: 26, borderRadius: '6px', cursor: 'pointer', background: i < vitals.waterIntake ? '#3b82f6' : 'var(--surface2)', border: `1px solid ${i < vitals.waterIntake ? '#60a5fa' : 'var(--border2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', transition: 'all .12s' }}>
                      {i < vitals.waterIntake ? '💧' : ''}
                    </div>
                  ))}
                </div>
                <button onClick={() => handleWater(1)} style={{ width: 34, height: 34, borderRadius: '8px', background: 'var(--surface2)', border: '1px solid var(--border2)', color: 'var(--muted)', fontSize: '18px', cursor: 'pointer' }}>+</button>
                <span style={{ color: '#60a5fa', fontFamily: 'JetBrains Mono', fontWeight: 600, fontSize: '14px' }}>{vitals.waterIntake}/{waterGoal}</span>
              </div>
            </div>

            {/* Mood */}
            <div>
              <label className="label">Mood</label>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                {Object.entries(moodEmoji).map(([mood, emoji]) => (
                  <button key={mood} type="button" onClick={() => setVitals((v) => ({ ...v, mood }))}
                    style={{ padding: '8px 14px', borderRadius: '10px', border: `1.5px solid ${vitals.mood === mood ? 'var(--lime)' : 'var(--border2)'}`, background: vitals.mood === mood ? 'var(--lime-dim)' : 'var(--surface2)', cursor: 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {emoji}
                    <span style={{ color: vitals.mood === mood ? 'var(--lime)' : 'var(--muted)', fontSize: '12px', fontFamily: 'DM Sans', fontWeight: 500, textTransform: 'capitalize' }}>{mood}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Weight & Sleep */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="label">Today's Weight (kg)</label>
                <input className="input-field" type="number" step="0.1" placeholder="70.5" value={vitals.weight} onChange={(e) => setVitals((v) => ({ ...v, weight: e.target.value }))} />
              </div>
              <div>
                <label className="label">Sleep Last Night (hrs)</label>
                <input className="input-field" type="number" step="0.5" placeholder="7.5" min="0" max="24" value={vitals.sleep} onChange={(e) => setVitals((v) => ({ ...v, sleep: e.target.value }))} />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="label">Notes</label>
              <textarea className="input-field" rows={3} placeholder="How are you feeling today?" value={vitals.notes} onChange={(e) => setVitals((v) => ({ ...v, notes: e.target.value }))} style={{ resize: 'vertical' }} />
            </div>

            <button className="btn-primary" onClick={saveVitals}>✓ Save Vitals</button>
          </div>
        </div>
      )}
    </div>
  );
}
