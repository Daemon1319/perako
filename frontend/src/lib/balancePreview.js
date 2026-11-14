// Work in integer centavos so previews do not accumulate floating-point errors.
export function cents(value) {
  if (value === null || value === undefined || String(value).trim() === '') return null
  const match = String(value).trim().match(/^(-?)(\d*)(?:\.(\d{0,2}))?$/)
  if (!match || (!match[2] && !match[3])) return null
  const amount = Number(match[2] || '0') * 100 + Number((match[3] || '').padEnd(2, '0'))
  return Number.isSafeInteger(amount) ? (match[1] ? -amount : amount) : null
}

function changesFor(wallets, effects) {
  const changes = new Map()
  for (const [id, effect] of effects) {
    const wallet = wallets.find((item) => String(item.id) === String(id))
    const before = cents(wallet?.balance)
    if (!wallet || before === null) return []
    const change = changes.get(wallet.id) || { id: wallet.id, name: wallet.name, before, after: before }
    change.after += effect
    changes.set(wallet.id, change)
  }
  return [...changes.values()]
}

export function transactionPreview(wallets, fields, type, original) {
  const amount = cents(fields.amount)
  if (!fields.wallet_id || amount === null || amount <= 0) return []
  const effects = []
  if (original) {
    const previousAmount = cents(original.amount)
    if (previousAmount === null) return []
    effects.push([original.wallet_id, original.transaction_type === 'income' ? -previousAmount : previousAmount])
  }
  effects.push([fields.wallet_id, type === 'income' ? amount : -amount])
  return changesFor(wallets, effects)
}

export function transferPreview(wallets, fields) {
  const amount = cents(fields.amount)
  const fee = cents(fields.fee || '0')
  if (!fields.source_wallet_id || !fields.destination_wallet_id || fields.source_wallet_id === fields.destination_wallet_id || amount === null || amount <= 0 || fee === null || fee < 0) return []
  return changesFor(wallets, [[fields.source_wallet_id, -amount - fee], [fields.destination_wallet_id, amount]])
}
