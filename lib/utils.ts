export function formatHour(time: string): string {
  const hour = parseInt(time.split(':')[0])
  if (hour === 0) return '12am'
  if (hour < 12) return `${hour}am`
  if (hour === 12) return '12pm'
  return `${hour - 12}pm`
}
