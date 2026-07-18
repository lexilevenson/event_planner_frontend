'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { getProposedTimes, computeTimes, finalizeTime } from '@/lib/api'
import { formatHour } from '@/lib/utils'
import confetti from 'canvas-confetti'

export default function ResultsPage() {
  const { plan_id } = useParams<{ plan_id: string }>()
  const [times, setTimes] = useState<any[]>([])
  const [totalParticipants, setTotalParticipants] = useState(0)
  const [loading, setLoading] = useState(true)
  const [computing, setComputing] = useState(false)
  const [finalizing, setFinalizing] = useState<string | null>(null)
  const [error, setError] = useState('')

  const fetchTimes = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getProposedTimes(plan_id)
      setTimes(data.times)
      setTotalParticipants(data.total_participants)
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
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#FF6B47', '#4CAF50', '#FFD700', '#87CEEB'],
      })
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
    <main className="min-h-screen px-4 py-16" style={{ background: 'linear-gradient(135deg, #FAFAF8 0%, #FFF0ED 100%)' }}>
      <div className="max-w-md mx-auto fade-in">

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
          <div className="rounded-2xl p-6 mb-6 text-center" style={{ background: 'linear-gradient(135deg, #F0FFF4, #DCFCE7)', border: '2px solid #4CAF50', boxShadow: '0 4px 20px rgba(76,175,80,0.15)' }}>
            <p className="text-2xl mb-2">🎉</p>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#4CAF50' }}>
              Event confirmed!
            </p>
            <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{finalized.date}</p>
            <p className="text-base mt-1" style={{ color: 'var(--gray-mid)' }}>
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
          <>
            {totalParticipants > 0 && times[0]?.vote_count < totalParticipants && (
              <div className="rounded-2xl px-4 py-3 mb-4 text-sm"
                style={{ background: '#FFF8ED', border: '1px solid #F5C842', color: '#9A6E00' }}>
                No time works for everyone. Here's the best we could find:
              </div>
            )}
            <ul className="space-y-3 mb-5">
              {times.map(t => {
                const isPartial = totalParticipants > 0 && t.vote_count < totalParticipants
                return (
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
                      {isPartial && (
                        <p className="text-xs mt-1" style={{ color: '#9A6E00' }}>
                          Works for {t.vote_count} of {totalParticipants} people
                        </p>
                      )}
                    </div>
                    {t.is_finalized ? (
                      <span className="text-xs font-semibold" style={{ color: '#4CAF50' }}>Confirmed ✓</span>
                    ) : (
                      <button
                        onClick={() => handleFinalize(t.proposed_time_id)}
                        disabled={!!finalizing}
                        className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white disabled:opacity-50 btn-bounce"
                        style={{ background: 'var(--coral)' }}
                      >
                        {finalizing === t.proposed_time_id ? '...' : 'Finalize'}
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          </>
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
