import { useState, useEffect, useCallback } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { save, load } from './storage.js'

/* ─── Design tokens ──────────────────────────────────────────────── */
const C = {
  bg:     '#07070f',
  card:   '#0f0f1e',
  dim:    '#1a1a2e',
  border: 'rgba(255,255,255,0.07)',
  text:   '#e2e8f0',
  muted:  '#4a5568',
  sleep:  '#818cf8',
  gym:    '#34d399',
  money:  '#fbbf24',
  habits: '#f472b6',
  mood:   '#38bdf8',
}

const cardStyle = {
  background: C.card,
  border: `1px solid ${C.border}`,
  borderRadius: 16,
  padding: '20px 22px',
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
}

/* ─── Date helpers ───────────────────────────────────────────────── */
const todayStr = () => new Date().toISOString().split('T')[0]

const last7 = () =>
  Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })

const dayLabel = (iso) =>
  ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][new Date(iso + 'T12:00:00').getDay()]

/* ─── Streak helper ──────────────────────────────────────────────── */
function computeStreak(data, filterFn) {
  let streak = 0
  const d = new Date()
  for (let i = 0; i < 365; i++) {
    const iso = d.toISOString().split('T')[0]
    const entry = data.find((e) => e.date === iso)
    if (entry && filterFn(entry)) {
      streak++
      d.setDate(d.getDate() - 1)
    } else break
  }
  return streak
}

/* ─── Life score ─────────────────────────────────────────────────── */
function computeScore(sleep, gym, txns, habitData, moodLog) {
  const days = last7()

  const sleepHours = days.map((d) => sleep.find((s) => s.date === d)?.hours || 0)
  const sleepScore = Math.min(100, (sleepHours.reduce((a, b) => a + b, 0) / 7 / 8) * 100)

  const gymDays = days.filter((d) => gym.some((g) => g.date === d)).length
  const gymScore = Math.min(100, (gymDays / 4) * 100)

  const balance = txns.reduce(
    (s, t) => (t.type === 'income' ? s + t.amount : s - t.amount), 0
  )
  const moneyScore =
    balance >= 0 ? Math.min(100, 70 + Math.log1p(balance) * 2) : Math.max(0, 50 + balance / 500)

  const habitsScore =
    days
      .map((d) => {
        const logs = habitData.logs[d] || []
        return habitData.list.length > 0 ? (logs.length / habitData.list.length) * 100 : 0
      })
      .reduce((a, b) => a + b, 0) / 7

  const moodsW = days.map((d) => moodLog.find((m) => m.date === d)?.score).filter(Boolean)
  const moodScore = moodsW.length
    ? (moodsW.reduce((a, b) => a + b, 0) / moodsW.length / 5) * 100
    : 50

  return Math.round((sleepScore + gymScore + moneyScore + habitsScore + moodScore) / 5)
}

/* ─── Default habits ─────────────────────────────────────────────── */
const DEF_HABITS = [
  { id: 'h1', name: 'Morning walk' },
  { id: 'h2', name: 'Read 30 min' },
  { id: 'h3', name: 'No junk food' },
  { id: 'h4', name: 'Drink 2L water' },
  { id: 'h5', name: 'Meditate' },
]

/* ═══════════════════════════════════════════════════════════════════
   ROOT APP
═══════════════════════════════════════════════════════════════════ */
export default function App() {
  const [sleep,     setSleep]     = useState(() => load('life:sleep',  []))
  const [gym,       setGym]       = useState(() => load('life:gym',    []))
  const [txns,      setTxns]      = useState(() => load('life:money',  []))
  const [habitData, setHabitData] = useState(() => load('life:habits', { list: DEF_HABITS, logs: {} }))
  const [moodLog,   setMoodLog]   = useState(() => load('life:mood',   []))

  /* Persist on every change */
  const updateSleep     = useCallback((v) => { setSleep(v);     save('life:sleep',  v) }, [])
  const updateGym       = useCallback((v) => { setGym(v);       save('life:gym',    v) }, [])
  const updateTxns      = useCallback((v) => { setTxns(v);      save('life:money',  v) }, [])
  const updateHabitData = useCallback((v) => { setHabitData(v); save('life:habits', v) }, [])
  const updateMoodLog   = useCallback((v) => { setMoodLog(v);   save('life:mood',   v) }, [])

  const score = computeScore(sleep, gym, txns, habitData, moodLog)
  const scoreColor =
    score >= 80 ? C.gym : score >= 60 ? C.money : score >= 40 ? C.habits : '#ef4444'

  const greeting =
    new Date().getHours() < 12
      ? 'Good morning'
      : new Date().getHours() < 17
      ? 'Good afternoon'
      : 'Good evening'

  return (
    <div style={{
      background: C.bg,
      minHeight: '100dvh',
      padding: 'env(safe-area-inset-top, 0px) 0 env(safe-area-inset-bottom, 0px)',
      fontFamily: "'DM Sans', system-ui, sans-serif",
      color: C.text,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@500;700&display=swap');
        * { box-sizing: border-box; }
        input, button, select, textarea { font-family: inherit; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }

        /* Safe area padding for notched phones */
        .safe-inner { padding: 20px 18px 48px; }
      `}</style>

      <div className="safe-inner">
        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>
              {greeting} 👋
            </div>
            <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
              Your life as data. What will you improve today?
            </div>
          </div>

          <div style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: '14px 22px',
            textAlign: 'center',
            minWidth: 110,
          }}>
            <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>
              Life Score
            </div>
            <div style={{ fontSize: 44, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: scoreColor, lineHeight: 1 }}>
              {score}
            </div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 6 }}>/ 100 · 7-day avg</div>
          </div>
        </div>

        {/* ── Grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: 14 }}>
          <SleepCard   data={sleep}     update={updateSleep}     />
          <GymCard     data={gym}       update={updateGym}       />
          <MoneyCard   data={txns}      update={updateTxns}      />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: 14, marginTop: 14 }}>
          <HabitsCard  data={habitData} update={updateHabitData} />
          <MoodCard    data={moodLog}   update={updateMoodLog}   />
        </div>

        <div style={{ textAlign: 'center', fontSize: 11, color: C.muted, marginTop: 32, letterSpacing: '0.05em' }}>
          All data stored locally on your device · LifeOS v1.0
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   SLEEP CARD
═══════════════════════════════════════════════════════════════════ */
function SleepCard({ data, update }) {
  const [hours,   setHours]   = useState(7.5)
  const [quality, setQuality] = useState(3)
  const [open,    setOpen]    = useState(false)

  const today      = todayStr()
  const todayEntry = data.find((s) => s.date === today)
  const days       = last7()
  const chartData  = days.map((d) => ({ day: dayLabel(d), hours: data.find((s) => s.date === d)?.hours || 0 }))
  const logged     = chartData.filter((d) => d.hours > 0)
  const avg        = logged.length ? (logged.reduce((a, d) => a + d.hours, 0) / logged.length).toFixed(1) : '—'
  const streak     = computeStreak(data, (d) => d.hours >= 7)

  const log = () => {
    update([...data.filter((s) => s.date !== today), { date: today, hours, quality }])
    setOpen(false)
  }

  return (
    <div style={cardStyle}>
      <SectionHead icon="🌙" label="Sleep" color={C.sleep} />

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end' }}>
        <Mono size={36} color={C.sleep}>{todayEntry ? todayEntry.hours + 'h' : '—'}</Mono>
        <div style={{ paddingBottom: 4 }}>
          <KV k="7-day avg" v={avg !== '—' ? avg + 'h' : '—'} />
          <KV k="streak ≥7h" v={streak + 'd'} color={C.sleep} />
          {todayEntry && (
            <KV k="quality" v={'★'.repeat(todayEntry.quality) + '☆'.repeat(5 - todayEntry.quality)} color={C.sleep} />
          )}
        </div>
      </div>

      <div style={{ height: 72 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barSize={16} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <Bar dataKey="hours" radius={[3, 3, 0, 0]}>
              {chartData.map((e, i) => (
                <Cell key={i} fill={e.hours >= 7 ? C.sleep : e.hours > 0 ? C.sleep + '55' : C.dim} />
              ))}
            </Bar>
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, color: C.text }}
              cursor={false}
              formatter={(v) => [v + 'h', 'sleep']}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {open ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.muted }}>
            <span>Hours slept</span>
            <Mono size={13} color={C.sleep}>{hours}h</Mono>
          </div>
          <input
            type="range" min="2" max="12" step="0.5" value={hours}
            onChange={(e) => setHours(+e.target.value)}
            style={{ accentColor: C.sleep, width: '100%' }}
          />
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: C.muted }}>Quality</span>
            {[1, 2, 3, 4, 5].map((q) => (
              <button key={q} onClick={() => setQuality(q)} style={{
                width: 28, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12,
                background: q <= quality ? C.sleep : C.dim,
                color: q <= quality ? '#fff' : C.muted,
              }}>{q}</button>
            ))}
          </div>
          <Row>
            <Btn color={C.sleep} onClick={log}>{todayEntry ? 'Update' : 'Log sleep'}</Btn>
            <Ghost onClick={() => setOpen(false)} />
          </Row>
        </div>
      ) : (
        <Btn color={C.sleep} onClick={() => setOpen(true)}>
          {todayEntry ? '↺ Update today' : '+ Log sleep'}
        </Btn>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   GYM CARD
═══════════════════════════════════════════════════════════════════ */
function GymCard({ data, update }) {
  const [type, setType] = useState('Strength')
  const [mins, setMins] = useState(45)
  const [open, setOpen] = useState(false)

  const today      = todayStr()
  const todayEntry = data.find((g) => g.date === today)
  const days       = last7()
  const streak     = computeStreak(data, () => true)
  const weekCount  = days.filter((d) => data.some((g) => g.date === d)).length
  const TYPES      = ['Strength', 'Cardio', 'HIIT', 'Yoga', 'Run', 'Swim', 'Other']

  const log = () => {
    update([...data.filter((g) => g.date !== today), { date: today, type, mins }])
    setOpen(false)
  }

  return (
    <div style={cardStyle}>
      <SectionHead icon="💪" label="Gym" color={C.gym} />

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end' }}>
        <Mono size={36} color={C.gym}>{streak}d</Mono>
        <div style={{ paddingBottom: 4 }}>
          <KV k="streak" v="" />
          <KV k="this week" v={weekCount + '/7 days'} color={C.gym} />
          {todayEntry && <KV k="today" v={todayEntry.type + ' · ' + todayEntry.mins + 'min'} color={C.gym} />}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 5 }}>
        {days.map((d, i) => {
          const done    = data.some((g) => g.date === d)
          const isToday = d === today
          return (
            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{
                height: 32, borderRadius: 8,
                background: done ? C.gym : C.dim,
                border: isToday ? `1px solid ${C.gym}60` : '1px solid transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, color: done ? '#000' : 'transparent',
              }}>✓</div>
              <div style={{ fontSize: 9, color: C.muted, marginTop: 4 }}>{dayLabel(d)}</div>
            </div>
          )
        })}
      </div>

      {open ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {TYPES.map((t) => (
              <button key={t} onClick={() => setType(t)} style={{
                padding: '5px 11px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12,
                background: type === t ? C.gym : C.dim,
                color: type === t ? '#000' : C.muted,
              }}>{t}</button>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.muted }}>
            <span>Duration</span>
            <Mono size={13} color={C.gym}>{mins} min</Mono>
          </div>
          <input
            type="range" min="15" max="120" step="5" value={mins}
            onChange={(e) => setMins(+e.target.value)}
            style={{ accentColor: C.gym, width: '100%' }}
          />
          <Row>
            <Btn color={C.gym} onClick={log}>{todayEntry ? 'Update' : 'Log workout'}</Btn>
            <Ghost onClick={() => setOpen(false)} />
          </Row>
        </div>
      ) : (
        <Btn color={C.gym} onClick={() => setOpen(true)}>
          {todayEntry ? `✓ ${todayEntry.type} done — update?` : '+ Log workout'}
        </Btn>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   MONEY CARD
═══════════════════════════════════════════════════════════════════ */
function MoneyCard({ data, update }) {
  const [type,   setType]   = useState('expense')
  const [amount, setAmount] = useState('')
  const [label,  setLabel]  = useState('')
  const [open,   setOpen]   = useState(false)

  const today      = todayStr()
  const balance    = data.reduce((s, t) => (t.type === 'income' ? s + t.amount : s - t.amount), 0)
  const todaySpent = data
    .filter((t) => t.date === today && t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0)

  const days      = last7()
  const chartData = days.map((d) => {
    const inc = data.filter((t) => t.date === d && t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const exp = data.filter((t) => t.date === d && t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    return { day: dayLabel(d), inc, exp }
  })

  const fmtAmt = (n) => '₹' + Math.abs(n).toLocaleString('en-IN')

  const log = () => {
    if (!amount || isNaN(+amount) || +amount <= 0) return
    update([...data, { date: today, type, amount: +amount, label: label || type }])
    setAmount('')
    setLabel('')
    setOpen(false)
  }

  const removeLatest = () => {
    if (data.length === 0) return
    update(data.slice(0, -1))
  }

  return (
    <div style={cardStyle}>
      <SectionHead icon="💰" label="Money" color={C.money} />

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end' }}>
        <Mono size={28} color={balance >= 0 ? C.money : '#ef4444'}>
          {(balance >= 0 ? '+' : '-') + fmtAmt(balance)}
        </Mono>
        <div style={{ paddingBottom: 4 }}>
          <KV k="net balance" v="" />
          <KV k="today spent" v={todaySpent > 0 ? fmtAmt(todaySpent) : '₹0'} color={todaySpent > 0 ? '#ef4444' : C.muted} />
          <KV k="entries" v={data.length + ' total'} />
        </div>
      </div>

      <div style={{ height: 72 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barSize={12} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <Bar dataKey="inc"  fill={C.money + '70'} radius={[3, 3, 0, 0]} />
            <Bar dataKey="exp"  fill={'#ef4444' + '70'} radius={[3, 3, 0, 0]} />
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, color: C.text }}
              cursor={false}
              formatter={(v, n) => [fmtAmt(v), n === 'inc' ? 'income' : 'expense']}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {data.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 80, overflowY: 'auto' }}>
          {[...data].reverse().slice(0, 3).map((t, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0', borderBottom: `1px solid ${C.border}` }}>
              <span style={{ color: C.muted }}>{t.label}</span>
              <span style={{ color: t.type === 'income' ? C.money : '#ef4444', fontFamily: 'monospace' }}>
                {t.type === 'income' ? '+' : '-'}{fmtAmt(t.amount)}
              </span>
            </div>
          ))}
        </div>
      )}

      {open ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Row>
            {['income', 'expense'].map((t) => (
              <button key={t} onClick={() => setType(t)} style={{
                flex: 1, padding: '7px 0', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12,
                background: type === t ? (t === 'income' ? C.money : '#ef4444') : C.dim,
                color: type === t ? '#000' : C.muted,
              }}>{t === 'income' ? '↑ Income' : '↓ Expense'}</button>
            ))}
          </Row>
          <input
            type="number"
            placeholder="Amount (₹)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={inputStyle}
          />
          <input
            type="text"
            placeholder="Label (e.g. Salary, Coffee…)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && log()}
            style={inputStyle}
          />
          <Row>
            <Btn color={C.money} onClick={log}>Add entry</Btn>
            <Ghost onClick={() => setOpen(false)} />
          </Row>
          {data.length > 0 && (
            <button onClick={removeLatest} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 11, cursor: 'pointer', textDecoration: 'underline', textAlign: 'left' }}>
              undo last entry
            </button>
          )}
        </div>
      ) : (
        <Btn color={C.money} onClick={() => setOpen(true)}>+ Log transaction</Btn>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   HABITS CARD
═══════════════════════════════════════════════════════════════════ */
function HabitsCard({ data, update }) {
  const [editing,  setEditing]  = useState(false)
  const [newHabit, setNewHabit] = useState('')

  const today     = todayStr()
  const todayLogs = data.logs[today] || []
  const pct       = data.list.length > 0 ? Math.round((todayLogs.length / data.list.length) * 100) : 0
  const days      = last7()

  const toggle = (id) => {
    const logs    = data.logs[today] || []
    const updated = logs.includes(id) ? logs.filter((i) => i !== id) : [...logs, id]
    update({ ...data, logs: { ...data.logs, [today]: updated } })
  }

  const addHabit = () => {
    if (!newHabit.trim()) return
    update({ ...data, list: [...data.list, { id: 'h' + Date.now(), name: newHabit.trim() }] })
    setNewHabit('')
  }

  const removeHabit = (id) =>
    update({ ...data, list: data.list.filter((h) => h.id !== id) })

  const getStreak = (id) => {
    let streak = 0
    const d = new Date()
    for (let i = 0; i < 365; i++) {
      const iso = d.toISOString().split('T')[0]
      if (data.logs[iso]?.includes(id)) {
        streak++
        d.setDate(d.getDate() - 1)
      } else break
    }
    return streak
  }

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <SectionHead icon="✅" label="Habits" color={C.habits} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Mono size={13} color={C.habits}>{todayLogs.length}/{data.list.length}</Mono>
          <button onClick={() => setEditing(!editing)} style={{
            background: 'none', border: `1px solid ${C.border}`, borderRadius: 6,
            padding: '3px 9px', color: C.muted, fontSize: 11, cursor: 'pointer',
          }}>{editing ? 'done' : 'edit'}</button>
        </div>
      </div>

      <div style={{ height: 4, background: C.dim, borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: pct + '%',
          background: C.habits, borderRadius: 2, transition: 'width 0.4s ease',
        }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.list.map((h) => {
          const done   = todayLogs.includes(h.id)
          const streak = getStreak(h.id)
          return (
            <div key={h.id} onClick={() => toggle(h.id)} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
              borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
              background: done ? C.habits + '18' : C.dim,
              border: `1px solid ${done ? C.habits + '50' : 'transparent'}`,
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: 6, flexShrink: 0, display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: 12,
                background: done ? C.habits : 'transparent',
                border: `2px solid ${done ? C.habits : C.muted}`,
                color: '#fff', transition: 'all 0.15s',
              }}>{done ? '✓' : ''}</div>
              <span style={{ flex: 1, fontSize: 14, color: done ? C.text : C.muted }}>{h.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', gap: 2 }}>
                  {days.map((d, i) => (
                    <div key={i} style={{
                      width: 6, height: 6, borderRadius: 2,
                      background: data.logs[d]?.includes(h.id) ? C.habits : C.border,
                    }} />
                  ))}
                </div>
                {streak > 0 && (
                  <span style={{ fontSize: 11, color: C.habits, fontFamily: 'monospace' }}>{streak}🔥</span>
                )}
              </div>
              {editing && (
                <button onClick={(e) => { e.stopPropagation(); removeHabit(h.id) }} style={{
                  background: 'none', border: 'none', color: '#ef4444',
                  cursor: 'pointer', fontSize: 18, padding: '0 2px', lineHeight: 1,
                }}>×</button>
              )}
            </div>
          )
        })}
      </div>

      {editing && (
        <Row>
          <input
            value={newHabit}
            onChange={(e) => setNewHabit(e.target.value)}
            placeholder="New habit…"
            onKeyDown={(e) => e.key === 'Enter' && addHabit()}
            style={{ ...inputStyle, flex: 1 }}
          />
          <Btn color={C.habits} onClick={addHabit}>Add</Btn>
        </Row>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   MOOD CARD
═══════════════════════════════════════════════════════════════════ */
const MOODS = [
  { score: 1, emoji: '😔', label: 'Rough' },
  { score: 2, emoji: '😕', label: 'Low'   },
  { score: 3, emoji: '😐', label: 'Meh'   },
  { score: 4, emoji: '🙂', label: 'Good'  },
  { score: 5, emoji: '😄', label: 'Great' },
]

function MoodCard({ data, update }) {
  const today      = todayStr()
  const todayEntry = data.find((m) => m.date === today)
  const days       = last7()
  const chartData  = days.map((d) => ({ day: dayLabel(d), score: data.find((m) => m.date === d)?.score || null }))
  const valid      = chartData.filter((d) => d.score)
  const avg        = valid.length
    ? (valid.reduce((s, d) => s + d.score, 0) / valid.length).toFixed(1)
    : '—'

  const logMood = (score) =>
    update([...data.filter((m) => m.date !== today), { date: today, score }])

  const current = MOODS.find((m) => m.score === todayEntry?.score)

  return (
    <div style={cardStyle}>
      <SectionHead icon="🧠" label="Mood" color={C.mood} />

      <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
        <div style={{ fontSize: 44, lineHeight: 1 }}>{current?.emoji || '—'}</div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 500, color: current ? C.text : C.muted }}>
            {current?.label || 'Not logged yet'}
          </div>
          <KV k="7-day avg" v={avg !== '—' ? avg + '/5' : '—'} color={C.mood} />
          <KV k="days logged" v={data.length + ' total'} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        {MOODS.map((m) => (
          <button key={m.score} onClick={() => logMood(m.score)} style={{
            flex: 1, padding: '10px 4px', borderRadius: 10, fontSize: 22, cursor: 'pointer',
            border: `1px solid ${todayEntry?.score === m.score ? C.mood : 'transparent'}`,
            background: todayEntry?.score === m.score ? C.mood + '25' : C.dim,
            transition: 'all 0.15s',
          }}>{m.emoji}</button>
        ))}
      </div>

      <div style={{ height: 72 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
            <Line
              type="monotone" dataKey="score"
              stroke={C.mood} strokeWidth={2.5}
              dot={{ fill: C.mood, strokeWidth: 0, r: 3.5 }}
              connectNulls
            />
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, color: C.text }}
              cursor={false}
              formatter={(v) => [MOODS.find((m) => m.score === v)?.label || v, 'mood']}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   SHARED UI PRIMITIVES
═══════════════════════════════════════════════════════════════════ */
function SectionHead({ icon, label, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 15 }}>{icon}</span>
      <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color }}>
        {label}
      </span>
    </div>
  )
}

function Mono({ size, color, children }) {
  return (
    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: size, fontWeight: 700, color, lineHeight: 1 }}>
      {children}
    </span>
  )
}

function KV({ k, v, color }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'baseline', marginBottom: 2 }}>
      <span style={{ fontSize: 11, color: C.muted }}>{k}</span>
      {v && <span style={{ fontSize: 11, color: color || C.text, fontFamily: 'monospace' }}>{v}</span>}
    </div>
  )
}

function Btn({ color, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      background: color + '18', border: `1px solid ${color + '55'}`, color,
      borderRadius: 9, padding: '9px 16px', fontSize: 13, cursor: 'pointer',
      flex: 1, fontFamily: 'inherit', transition: 'background 0.15s',
    }}>{children}</button>
  )
}

function Ghost({ onClick }) {
  return (
    <button onClick={onClick} style={{
      background: C.dim, border: `1px solid ${C.border}`, color: C.muted,
      borderRadius: 9, padding: '9px 16px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
    }}>Cancel</button>
  )
}

function Row({ children }) {
  return <div style={{ display: 'flex', gap: 8 }}>{children}</div>
}

const inputStyle = {
  background: C.dim, border: `1px solid ${C.border}`, borderRadius: 8,
  padding: '9px 12px', color: C.text, fontSize: 13, outline: 'none', width: '100%',
}
