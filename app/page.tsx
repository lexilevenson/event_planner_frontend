'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPlan } from '@/lib/api'

export default function Home() {
  const router = useRouter()
  const [form, setForm] = useState({
    title: '',
    description: '',
    message_text: '',
    participant_count: 2,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await createPlan({ ...form, participant_count: form.participant_count + 1 })
      const [hostToken, ...guestTokens] = data.participant_tokens

      localStorage.setItem('host_plan', JSON.stringify({
        plan_id: data.plan.plan_id,
        host_token: hostToken,
        guest_tokens: guestTokens,
      }))

      router.push(`/participate/${hostToken}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
      style={{ background: 'linear-gradient(135deg, #FAFAF8 0%, #FFF0ED 100%)' }}>

      {/* Header */}
      <div className="mb-10 text-center fade-in">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
          style={{ background: 'var(--coral)', boxShadow: '0 4px 20px rgba(255,107,71,0.35)' }}>
          <span className="text-white text-2xl">📅</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
          Event Planner
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--gray-mid)' }}>
          Let's find a time that works for everyone
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md rounded-3xl p-8 shadow-sm fade-in"
        style={{ background: '#fff', border: '1px solid var(--gray-soft)', animationDelay: '0.1s' }}>

        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
              Event name
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Summer Dinner"
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition focus:ring-2"
              style={{
                background: 'var(--background)',
                border: '1.5px solid var(--gray-soft)',
                color: 'var(--foreground)',
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
              Description <span style={{ color: 'var(--gray-mid)' }}>(optional)</span>
            </label>
            <input
              type="text"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="A little more context..."
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition focus:ring-2"
              style={{
                background: 'var(--background)',
                border: '1.5px solid var(--gray-soft)',
                color: 'var(--foreground)',
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
              What are you planning?
            </label>
            <textarea
              required
              value={form.message_text}
              onChange={e => setForm({ ...form, message_text: e.target.value })}
              placeholder="e.g. dinner sometime in the next two weeks"
              rows={3}
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition focus:ring-2 resize-none"
              style={{
                background: 'var(--background)',
                border: '1.5px solid var(--gray-soft)',
                color: 'var(--foreground)',
              }}
            />
            <p className="mt-1.5 text-xs" style={{ color: 'var(--gray-mid)' }}>
              We'll use this to figure out the event type and scheduling window.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
              Number of guests
            </label>
            <input
              type="number"
              required
              min={1}
              max={19}
              value={form.participant_count}
              onChange={e => setForm({ ...form, participant_count: parseInt(e.target.value) })}
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition focus:ring-2"
              style={{
                background: 'var(--background)',
                border: '1.5px solid var(--gray-soft)',
                color: 'var(--foreground)',
              }}
            />
            <p className="mt-1.5 text-xs" style={{ color: 'var(--gray-mid)' }}>
              Not including yourself.
            </p>
          </div>

          {error && (
            <p className="text-sm rounded-xl px-4 py-2.5"
              style={{ background: '#FFF0ED', color: 'var(--coral-dark)' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white disabled:opacity-50 btn-bounce"
            style={{ background: 'var(--coral)' }}
          >
            {loading ? 'Creating your plan...' : 'Create Plan →'}
          </button>

        </form>
      </div>
    </main>
  )
}
