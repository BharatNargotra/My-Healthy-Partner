import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import toast from 'react-hot-toast';

const goalLabels = {
  lose_weight:       '🔥 Lose Weight',
  gain_muscle:       '💪 Gain Muscle',
  maintain:          '⚖️ Maintain',
  improve_endurance: '🏃 Endurance',
  eat_healthier:     '🥗 Eat Healthier',
};
const activityLabels = {
  sedentary:   'Sedentary',
  light:       'Lightly Active',
  moderate:    'Moderately Active',
  active:      'Active',
  very_active: 'Very Active',
};

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRec, setAiRec]         = useState(null);
  const [profile, setProfile]     = useState({
    name: '', age: '', gender: '', height: '', weight: '',
    targetWeight: '', activityLevel: 'moderate', primaryGoal: 'maintain',
    dailyCalorieGoal: 2000, dailyWaterGoal: 8,
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/users/profile');
        setProfile({
          name:             data.name || '',
          age:              data.age || '',
          gender:           data.gender || '',
          height:           data.height || '',
          weight:           data.weight || '',
          targetWeight:     data.targetWeight || '',
          activityLevel:    data.activityLevel || 'moderate',
          primaryGoal:      data.primaryGoal || 'maintain',
          dailyCalorieGoal: data.dailyCalorieGoal || 2000,
          dailyWaterGoal:   data.dailyWaterGoal || 8,
        });
        if (data.aiRecommendation?.dailyCalories) setAiRec(data.aiRecommendation);
      } catch { toast.error('Failed to load profile'); }
      finally { setLoading(false); }
    })();
  }, []);

  const h = (k) => (e) => setProfile((p) => ({ ...p, [k]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/users/profile', profile);
      updateUser(data);
      toast.success('Profile saved!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleAiRecommend = async () => {
    if (!profile.height || !profile.weight || !profile.age) {
      toast.error('Fill in age, height, and weight first'); return;
    }
    setAiLoading(true);
    try {
      // Save profile first so AI has latest data
      await api.put('/users/profile', profile);
      const { data } = await api.post('/ai/recommend');
      setAiRec(data);
      // Auto-apply calorie goal
      setProfile((p) => ({ ...p, dailyCalorieGoal: data.dailyCalories }));
      toast.success('AI targets applied!');
    } catch { toast.error('AI service error'); }
    finally { setAiLoading(false); }
  };

  const bmi = profile.height && profile.weight
    ? (profile.weight / ((profile.height / 100) ** 2)).toFixed(1)
    : null;
  const bmiCat = bmi
    ? bmi < 18.5 ? { label: 'Underweight', color: '#60a5fa' }
    : bmi < 25   ? { label: 'Normal',      color: '#a3e635' }
    : bmi < 30   ? { label: 'Overweight',  color: '#f59e0b' }
    :              { label: 'Obese',        color: '#ef4444' }
    : null;

  if (loading) return (
    <div style={{ textAlign: 'center', paddingTop: '80px', color: 'var(--muted)' }}>
      <span className="spinner" style={{ width: 28, height: 28 }} />
    </div>
  );

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '26px', letterSpacing: '-0.02em', marginBottom: '4px' }}>
          Your Profile
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Health data, goals & AI-powered targets</p>
      </div>

      {/* BMI bar */}
      {bmi && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px,1fr))', gap: '12px', marginBottom: '28px' }}>
          {[
            { label: 'Current Weight', value: profile.weight ? `${profile.weight} kg` : '—' },
            { label: 'Target Weight',  value: profile.targetWeight ? `${profile.targetWeight} kg` : '—' },
            { label: 'Height',         value: profile.height ? `${profile.height} cm` : '—' },
            { label: 'BMI', value: bmi, sub: bmiCat?.label, color: bmiCat?.color },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div style={{ color: 'var(--muted)', fontSize: '11px', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '8px', fontFamily: 'Syne' }}>
                {s.label}
              </div>
              <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '20px', color: s.color || 'var(--text)' }}>{s.value}</div>
              {s.sub && <div style={{ fontSize: '12px', color: s.color, marginTop: '2px' }}>{s.sub}</div>}
            </div>
          ))}
        </div>
      )}

      {/* AI Recommendation card */}
      {aiRec && (
        <div style={{ marginBottom: '24px', padding: '20px', background: 'rgba(139,92,246,.08)', border: '1px solid rgba(139,92,246,.25)', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <span className="ai-badge">✦ AI Targets</span>
            {aiRec.generatedAt && (
              <span style={{ color: 'var(--muted)', fontSize: '12px' }}>
                Generated {new Date(aiRec.generatedAt).toLocaleDateString()}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {[
              { label: 'Daily Calories', value: aiRec.dailyCalories, unit: 'kcal', color: '#f59e0b' },
              { label: 'Protein',  value: aiRec.macros?.protein, unit: 'g', color: '#60a5fa' },
              { label: 'Carbs',    value: aiRec.macros?.carbs,   unit: 'g', color: '#a3e635' },
              { label: 'Fat',      value: aiRec.macros?.fat,     unit: 'g', color: '#f87171' },
            ].map((m) => (
              <div key={m.label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'JetBrains Mono', fontWeight: 600, fontSize: '20px', color: m.color }}>
                  {m.value}<span style={{ fontSize: '12px' }}>{m.unit}</span>
                </div>
                <div style={{ color: 'var(--muted)', fontSize: '11px', fontFamily: 'Syne', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' }}>
                  {m.label}
                </div>
              </div>
            ))}
          </div>
          {aiRec.advice && <p style={{ color: '#c4b5fd', fontSize: '13px', lineHeight: '1.6' }}>{aiRec.advice}</p>}
        </div>
      )}

      <form onSubmit={handleSave}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px,1fr))', gap: '20px' }}>

          {/* Personal Info */}
          <div className="card">
            <h2 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '15px', marginBottom: '20px' }}>Personal Info</h2>
            <div style={{ display: 'grid', gap: '14px' }}>
              <div>
                <label className="label">Full Name</label>
                <input className="input-field" value={profile.name} onChange={h('name')} placeholder="Your name" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="label">Age</label>
                  <input className="input-field" type="number" value={profile.age} onChange={h('age')} placeholder="25" min="1" max="120" />
                </div>
                <div>
                  <label className="label">Gender</label>
                  <select className="input-field" value={profile.gender} onChange={h('gender')}>
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="label">Height (cm)</label>
                  <input className="input-field" type="number" value={profile.height} onChange={h('height')} placeholder="170" />
                </div>
                <div>
                  <label className="label">Weight (kg)</label>
                  <input className="input-field" type="number" step="0.1" value={profile.weight} onChange={h('weight')} placeholder="70" />
                </div>
              </div>
              <div>
                <label className="label">Target Weight (kg)</label>
                <input className="input-field" type="number" step="0.1" value={profile.targetWeight} onChange={h('targetWeight')} placeholder="65" />
              </div>
            </div>
          </div>

          {/* Goals */}
          <div className="card">
            <h2 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '15px', marginBottom: '20px' }}>Goals & Activity</h2>
            <div style={{ display: 'grid', gap: '14px' }}>
              <div>
                <label className="label">Primary Goal</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '6px' }}>
                  {Object.entries(goalLabels).map(([val, label]) => (
                    <button key={val} type="button"
                      onClick={() => setProfile((p) => ({ ...p, primaryGoal: val }))}
                      style={{
                        padding: '9px 12px', borderRadius: '10px', border: `1.5px solid ${profile.primaryGoal === val ? 'var(--lime)' : 'var(--border2)'}`,
                        background: profile.primaryGoal === val ? 'var(--lime-dim)' : 'var(--surface2)',
                        color: profile.primaryGoal === val ? 'var(--lime)' : 'var(--muted)',
                        fontSize: '12px', fontWeight: 600, cursor: 'pointer', textAlign: 'left', transition: 'all .15s',
                      }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Activity Level</label>
                <select className="input-field" value={profile.activityLevel} onChange={h('activityLevel')}>
                  {Object.entries(activityLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="label">Daily Calorie Goal</label>
                  <input className="input-field" type="number" value={profile.dailyCalorieGoal} onChange={h('dailyCalorieGoal')} placeholder="2000" />
                </div>
                <div>
                  <label className="label">Daily Water (glasses)</label>
                  <input className="input-field" type="number" value={profile.dailyWaterGoal} onChange={h('dailyWaterGoal')} placeholder="8" min="1" max="20" />
                </div>
              </div>

              {/* AI button */}
              <button type="button" onClick={handleAiRecommend} disabled={aiLoading}
                style={{
                  padding: '10px 16px', borderRadius: '10px', border: '1px solid rgba(139,92,246,.4)',
                  background: 'rgba(139,92,246,.1)', color: '#a78bfa',
                  fontFamily: 'Syne', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '8px', transition: 'all .18s',
                  opacity: aiLoading ? .6 : 1,
                }}>
                {aiLoading ? <span className="spinner" style={{ borderColor: 'rgba(167,139,250,.3)', borderTopColor: '#a78bfa' }} /> : '✦'}
                {aiLoading ? 'Calculating...' : 'Get AI Calorie & Macro Targets'}
              </button>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '20px' }}>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? <span className="spinner" /> : '✓ Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
