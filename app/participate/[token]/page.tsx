'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { getParticipantPlan, submitAvailability, computeTimes, getProposedTimes, getParticipantAvailability } from '@/lib/api'
import { formatHour } from '@/lib/utils'

interface Slot {
  date: string
  time_start: string
  time_end: string
}

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const label = i === 0 ? '12am' : i < 12 ? `${i}am` : i === 12 ? '12pm' : `${i - 12}pm`
  const value = `${String(i).padStart(2, '0')}:00:00`
  return { label, value }
})

function HourSelect({ value, onChange, placeholder, minHour }: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  minHour?: number
}) {
  const hours = minHour !== undefined ? HOURS.filter(h => parseInt(h.value) > minHour) : HOURS
  return (
    <select
      required
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none appearance-none"
      style={{
        background: 'var(--background)',
        border: '1.5px solid var(--gray-soft)',
        color: value ? 'var(--foreground)' : 'var(--gray-mid)',
      }}
    >
      <option value="" disabled>{placeholder}</option>
      {hours.map(h => (
        <option key={h.value} value={h.value}>{h.label}</option>
      ))}
    </select>
  )
}

function EventStatus({ plan, respondedCount, totalCount, proposedTimes, isHost, guestTokens, onEdit }: {
  plan: any
  respondedCount: number
  totalCount: number
  proposedTimes: any[]
  isHost: boolean
  guestTokens: string[]
  onEdit: () => void
}) {
  const finalized = proposedTimes.find(t => t.is_finalized)
  const allResponded = respondedCount === totalCount
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <main className="min-h-screen px-4 py-16" style={{ background: 'var(--background)' }}>
      <div className="max-w-md mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight mb-1" style={{ color: 'var(--foreground)' }}>
            {plan?.title}
          </h1>
          {plan?.description && (
            <p className="text-sm" style={{ color: 'var(--gray-mid)' }}>{plan.description}</p>
          )}
        </div>

        {/* Response status */}
        <div className="rounded-2xl p-4 mb-6" style={{ background: '#fff', border: '1px solid var(--gray-soft)' }}>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full" style={{ background: allResponded ? '#4CAF50' : 'var(--coral)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              {respondedCount} of {totalCount} people have responded
            </p>
          </div>
          {!allResponded && (
            <p className="text-xs mt-1 ml-5" style={{ color: 'var(--gray-mid)' }}>
              Waiting for {totalCount - respondedCount} more...
            </p>
          )}
        </div>

        {/* Finalized or proposed times */}
        {finalized ? (
          <div className="rounded-2xl p-5 mb-6" style={{ background: '#F0FFF4', border: '1.5px solid #4CAF50' }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#4CAF50' }}>
              Event confirmed!
            </p>
            <p className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>{finalized.date}</p>
            <p className="text-sm mt-0.5" style={{ color: 'var(--gray-mid)' }}>
              {formatHour(finalized.time_start)} – {formatHour(finalized.time_end)}
            </p>
          </div>
        ) : proposedTimes.length > 0 ? (
          <div className="mb-6">
            <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
              Times that work for everyone
            </h2>
            <ul className="space-y-2">
              {proposedTimes.map(t => (
                <li key={t.proposed_time_id} className="rounded-2xl p-4"
                  style={{ background: '#fff', border: '1px solid var(--gray-soft)' }}>
                  <p className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>{t.date}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--gray-mid)' }}>
                    {formatHour(t.time_start)} – {formatHour(t.time_end)}
                  </p>
                </li>
              ))}
            </ul>
            {!isHost && (
              <p className="text-xs mt-3" style={{ color: 'var(--gray-mid)' }}>
                Waiting for the organizer to finalize a time.
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm mb-6" style={{ color: 'var(--gray-mid)' }}>
            Proposed times will appear here once everyone responds.
          </p>
        )}

        {/* Host section */}
        {!finalized && (
          <button
            onClick={onEdit}
            className="w-full py-3 rounded-2xl text-sm font-medium mb-4"
            style={{ border: '1.5px solid var(--gray-soft)', color: 'var(--gray-mid)', background: 'transparent' }}
          >
            Edit my availability
          </button>
        )}

        {isHost && (
          <div className="mt-2">
            <a
              href={`/plans/${plan?.plan_id}/results`}
              className="block text-center w-full py-3 rounded-2xl text-sm font-semibold text-white mb-5"
              style={{ background: 'var(--coral)' }}
            >
              View Results & Finalize →
            </a>
            <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid var(--gray-soft)' }}>
              <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
                Share with your guests
              </h2>
              <ul className="space-y-3">
                {guestTokens.map((t, i) => (
                  <li key={t}>
                    <p className="text-xs font-medium mb-1" style={{ color: 'var(--gray-mid)' }}>Guest {i + 1}</p>
                    <a
                      href={`${baseUrl}/participate/${t}`}
                      className="text-xs break-all"
                      style={{ color: 'var(--coral)' }}
                    >
                      {baseUrl}/participate/{t}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default function ParticipatePage() {
  const { token } = useParams<{ token: string }>()
  const [plan, setPlan] = useState<any>(null)
  const [planId, setPlanId] = useState<string>('')
  const [hasResponded, setHasResponded] = useState(false)
  const [slots, setSlots] = useState<Slot[]>([{ date: '', time_start: '', time_end: '' }])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [statusData, setStatusData] = useState<{
    respondedCount: number
    totalCount: number
    proposedTimes: any[]
  } | null>(null)
  const [hostData, setHostData] = useState<{ plan_id: string; host_token: string; guest_tokens: string[] } | null>(null)

  useEffect(() => {
    getParticipantPlan(token)
      .then(async (data: any) => {
        setPlan(data.plan)
        setPlanId(data.plan.plan_id)
        setHasResponded(data.has_responded)

        const stored = localStorage.getItem('host_plan')
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed.plan_id === data.plan.plan_id && parsed.host_token === token) {
            setHostData(parsed)
          }
        }

        if (data.has_responded) {
          const proposed = await getProposedTimes(data.plan.plan_id)
          setStatusData({
            respondedCount: data.responded_count,
            totalCount: data.total_count,
            proposedTimes: proposed,
          })
        }
      })
      .catch((err: any) => setError(err.message))
      .finally(() => setLoading(false))
  }, [token])

  function addSlot() {
    setSlots([...slots, { date: '', time_start: '', time_end: '' }])
  }

  function removeSlot(i: number) {
    setSlots(slots.filter((_, idx) => idx !== i))
  }

  function updateSlot(i: number, field: keyof Slot, value: string) {
    setSlots(slots.map((s, idx) => {
      if (idx !== i) return s
      const updated = { ...s, [field]: value }
      if (field === 'time_start' && updated.time_end && updated.time_end <= value) {
        updated.time_end = ''
      }
      return updated
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const result = await submitAvailability(token, slots)

      let proposed: any[] = []
      if (result.all_responded) {
        await computeTimes(planId)
        proposed = await getProposedTimes(planId)
      }

      setStatusData({
        respondedCount: result.responded_count,
        totalCount: result.total_count,
        proposedTimes: proposed,
      })
      setHasResponded(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <p className="text-sm" style={{ color: 'var(--gray-mid)' }}>Loading...</p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <p className="text-sm" style={{ color: 'var(--coral)' }}>{error}</p>
      </main>
    )
  }

  async function handleEdit() {
    try {
      const existing = await getParticipantAvailability(token)
      if (existing.length > 0) setSlots(existing)
    } catch {
      // if fetch fails just show empty form
    }
    setHasResponded(false)
    setStatusData(null)
  }

  if (hasResponded && statusData) {
    return (
      <EventStatus
        plan={plan}
        respondedCount={statusData.respondedCount}
        totalCount={statusData.totalCount}
        proposedTimes={statusData.proposedTimes}
        isHost={!!hostData}
        guestTokens={hostData?.guest_tokens ?? []}
        onEdit={handleEdit}
      />
    )
  }

  return (
    <main className="min-h-screen px-4 py-16" style={{ background: 'var(--background)' }}>
      <div className="max-w-md mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight mb-1" style={{ color: 'var(--foreground)' }}>
            {plan?.title}
          </h1>
          {plan?.description && (
            <p className="text-sm mb-2" style={{ color: 'var(--gray-mid)' }}>{plan.description}</p>
          )}
          <p className="text-sm font-semibold mt-1" style={{ color: 'var(--foreground)' }}>
            {plan?.poll_window_start?.slice(0, 10)} – {plan?.poll_window_end?.slice(0, 10)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            When are you available?
          </h2>

          {slots.map((slot, i) => (
            <div key={i} className="rounded-2xl p-4 space-y-3"
              style={{ background: '#fff', border: '1px solid var(--gray-soft)' }}>
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--gray-mid)' }}>
                  Slot {i + 1}
                </span>
                {slots.length > 1 && (
                  <button type="button" onClick={() => removeSlot(i)}
                    className="text-xs" style={{ color: 'var(--coral)' }}>
                    Remove
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--gray-mid)' }}>Date</label>
                <input
                  type="date"
                  required
                  value={slot.date}
                  min={plan?.poll_window_start?.slice(0, 10)}
                  max={plan?.poll_window_end?.slice(0, 10)}
                  onChange={e => updateSlot(i, 'date', e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                  style={{
                    background: 'var(--background)',
                    border: '1.5px solid var(--gray-soft)',
                    color: 'var(--foreground)',
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--gray-mid)' }}>From</label>
                  <HourSelect
                    value={slot.time_start}
                    onChange={v => updateSlot(i, 'time_start', v)}
                    placeholder="Start time"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--gray-mid)' }}>To</label>
                  <HourSelect
                    value={slot.time_end}
                    onChange={v => updateSlot(i, 'time_end', v)}
                    placeholder="End time"
                    minHour={slot.time_start ? parseInt(slot.time_start.split(':')[0]) : undefined}
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addSlot}
            className="w-full py-3 rounded-2xl text-sm transition"
            style={{
              border: '1.5px dashed var(--gray-soft)',
              color: 'var(--gray-mid)',
              background: 'transparent',
            }}
          >
            + Add another time slot
          </button>

          {error && (
            <p className="text-sm rounded-xl px-4 py-2.5" style={{ background: '#FFF0ED', color: 'var(--coral-dark)' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-2xl text-sm font-semibold text-white transition-opacity disabled:opacity-50"
            style={{ background: 'var(--coral)' }}
          >
            {submitting ? 'Submitting...' : 'Submit Availability →'}
          </button>
        </form>
      </div>
    </main>
  )
}
