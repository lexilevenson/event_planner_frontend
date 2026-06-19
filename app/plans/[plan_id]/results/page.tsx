'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { getProposedTimes, computeTimes, finalizeTime } from '@/lib/api'
import { formatHour } from '@/lib/utils'

export default function ResultsPage() {
  const { plan_id } = useParams<{ plan_id: string }>()
  const [times, setTimes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [computing, setComputing] = useState(false)
  const [finalizing, setFinalizing] = useState<string | null>(null)
  const [error, setError] = useState('')

  const fetchTimes = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getProposedTimes(plan_id)
      setTimes(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [plan_id])

  useEffect(() => {
    fetchTimes()
  }, [fetchTimes])

  async function handleComputeTimes() {
    setComputing(true)
    setError('')
    try {
      await computeTimes(plan_id)
      await fetchTimes()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setComputing(false)
    }
  }

  async function handleFinalize(proposedTimeId: string) {
    setFinalizing(proposedTimeId)
    setError('')
    try {
      await finalizeTime(plan_id, proposedTimeId)
      setTimes(times.map(t =>
        t.proposed_time_id === proposedTimeId ? { ...t, is_finalized: true } : t
      ))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setFinalizing(null)
    }
  }

  const finalized = times.find(t => t.is_finalized)

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <p className="text-sm" style={{ color: 'var(--gray-mid)' }}>Loading...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen px-4 py-16" style={{ background: 'var(--background)' }}>
      <div className="max-w-md mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight mb-1" style={{ color: 'var(--foreground)' }}>
            Results
          </h1>
          <p className="text-sm" style={{ color: 'var(--gray-mid)' }}>
            {finalized ? 'A time has been finalized.' : 'Pick a time that works for everyone.'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-2xl px-4 py-3 mb-5 text-sm"
            style={{ background: '#FFF0ED', color: 'var(--coral-dark)' }}>
            {error}
          </div>
        )}

        {/* Finalized banner */}
        {finalized && (
          <div className="rounded-2xl p-5 mb-6" style={{ background: '#F0FFF4', border: '1.5px solid #4CAF50' }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#4CAF50' }}>
              Event confirmed!
            </p>
            <p className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>{finalized.date}</p>
            <p className="text-sm mt-0.5" style={{ color: 'var(--gray-mid)' }}>
              {formatHour(finalized.time_start)} – {formatHour(finalized.time_end)}
            </p>
          </div>
        )}

        {/* Times list */}
        {times.length === 0 ? (
          <div className="rounded-2xl p-5 mb-5 text-center"
            style={{ background: '#fff', border: '1px solid var(--gray-soft)' }}>
            <p className="text-sm mb-1" style={{ color: 'var(--foreground)' }}>No overlapping times yet</p>
            <p className="text-xs" style={{ color: 'var(--gray-mid)' }}>
              Make sure all participants have responded first.
            </p>
          </div>
        ) : (
          <ul className="space-y-3 mb-5">
            {times.map(t => (
              <li key={t.proposed_time_id}
                className="rounded-2xl p-4 flex justify-between items-center"
                style={{
                  background: t.is_finalized ? '#F0FFF4' : '#fff',
                  border: `1.5px solid ${t.is_finalized ? '#4CAF50' : 'var(--gray-soft)'}`,
                }}>
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{t.date}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--gray-mid)' }}>
                    {formatHour(t.time_start)} – {formatHour(t.time_end)}
                  </p>
                </div>
                {t.is_finalized ? (
                  <span className="text-xs font-semibold" style={{ color: '#4CAF50' }}>Confirmed ✓</span>
                ) : (
                  <button
                    onClick={() => handleFinalize(t.proposed_time_id)}
                    disabled={!!finalizing}
                    className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white disabled:opacity-50"
                    style={{ background: 'var(--coral)' }}
                  >
                    {finalizing === t.proposed_time_id ? '...' : 'Finalize'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Compute / Recompute button */}
        {!finalized && (
          <button
            onClick={handleComputeTimes}
            disabled={computing}
            className="w-full py-3 rounded-2xl text-sm font-semibold disabled:opacity-50 transition"
            style={{
              background: times.length === 0 ? 'var(--coral)' : '#fff',
              color: times.length === 0 ? '#fff' : 'var(--gray-mid)',
              border: times.length === 0 ? 'none' : '1.5px solid var(--gray-soft)',
            }}
          >
            {computing ? 'Computing...' : times.length === 0 ? 'Compute Times →' : 'Recompute Times'}
          </button>
        )}
      </div>
    </main>
  )
}
