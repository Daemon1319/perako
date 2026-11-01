const currency = new Intl.NumberFormat('en-PH', {
  style: 'currency', currency: 'PHP', minimumFractionDigits: 2,
})

export function money(value = 0) {
  return currency.format(Number(value))
}

export function today() {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date())
  const part = (type) => parts.find((item) => item.type === type).value
  return `${part('year')}-${part('month')}-${part('day')}`
}

export function monthLabel(month, short = false) {
  return new Intl.DateTimeFormat('en-PH', {
    month: short ? 'short' : 'long', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(`${month}-01T00:00:00Z`))
}

export function monthRange(month) {
  const [year, number] = month.split('-').map(Number)
  return {
    start_date: `${month}-01`,
    end_date: new Date(Date.UTC(year, number, 0)).toISOString().slice(0, 10),
  }
}

export function shiftMonth(month, amount) {
  const [year, number] = month.split('-').map(Number)
  return new Date(Date.UTC(year, number - 1 + amount, 1)).toISOString().slice(0, 7)
}

export function dateLabel(date) {
  if (date === today()) return 'Today'
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`))
}
