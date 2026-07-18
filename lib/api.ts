const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function handleError(res: Response): Promise<never> {
  let detail: string | undefined
  try {
    const data = await res.json()
    detail = data?.detail
  } catch {
    // ignore JSON parse error
  }
  throw new Error(detail || 'Something went wrong')
}

export async function createPlan(data: {
  title: string
  description?: string
  message_text: string
  participant_count: number
}) {
  const res = await fetch(`${API_URL}/plans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) await handleError(res)
  return res.json()
}

export async function getParticipantPlan(token: string) {
  const res = await fetch(`${API_URL}/participate/${token}`)
  if (!res.ok) await handleError(res)
  return res.json()
}

export async function getParticipantAvailability(token: string) {
  const res = await fetch(`${API_URL}/participate/${token}/availability`)
  if (!res.ok) await handleError(res)
  return res.json()
}

export async function submitAvailability(token: string, slots: Array<{
  date: string
  time_start: string
  time_end: string
}>) {
  const res = await fetch(`${API_URL}/participate/${token}/availability`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slots }),
  })
  if (!res.ok) await handleError(res)
  return res.json()
}

export async function computeTimes(planId: string) {
  const res = await fetch(`${API_URL}/plans/${planId}/compute-times`, {
    method: 'POST',
  })
  if (!res.ok) await handleError(res)
  return res.json()
}

export async function getProposedTimes(planId: string): Promise<{ times: any[]; total_participants: number }> {
  const res = await fetch(`${API_URL}/plans/${planId}/proposed-times`)
  if (!res.ok) await handleError(res)
  return res.json()
}

export async function finalizeTime(planId: string, proposedTimeId: string) {
  const res = await fetch(`${API_URL}/plans/${planId}/finalize?proposed_time_id=${proposedTimeId}`, {
    method: 'POST',
  })
  if (!res.ok) await handleError(res)
  return res.json()
}
