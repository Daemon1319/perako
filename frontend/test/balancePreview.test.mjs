import test from 'node:test'
import assert from 'node:assert/strict'
import { cents, transactionPreview, transferPreview } from '../src/lib/balancePreview.js'

const wallets = [{ id: 1, name: 'Cash', balance: '1000.00' }, { id: 2, name: 'GCash', balance: '500.00' }]

test('centavos are exact and incomplete invalid inputs are ignored', () => {
  assert.equal(cents('0.29'), 29)
  assert.equal(cents('.5'), 50)
  assert.equal(cents('-0.01'), -1)
  assert.equal(cents('9999999999.99'), 999999999999)
  for (const value of ['', '.', 'abc', '1.001', null]) assert.equal(cents(value), null)
})

test('income and expense previews add and deduct from the selected wallet', () => {
  assert.equal(transactionPreview(wallets, { wallet_id: '1', amount: '150' }, 'expense')[0].after, 85000)
  assert.equal(transactionPreview(wallets, { wallet_id: '2', amount: '0.29' }, 'income')[0].after, 50029)
  assert.equal(transactionPreview(wallets, { wallet_id: '1', amount: '1001' }, 'expense')[0].after, -100)
  assert.deepEqual(transactionPreview(wallets, { wallet_id: '', amount: '150' }, 'expense'), [])
})

test('editing reverses the original effect before applying the new amount', () => {
  const original = { wallet_id: 1, amount: '150', transaction_type: 'expense' }
  const [preview] = transactionPreview(wallets, { wallet_id: '1', amount: '200' }, 'expense', original)
  assert.equal(preview.before, 100000)
  assert.equal(preview.after, 95000)
  assert.equal(transactionPreview(wallets, { wallet_id: '1', amount: '150' }, 'expense', original)[0].after, 100000)
})

test('moving a transaction previews both wallets and detects insufficient original funds', () => {
  const expense = { wallet_id: 1, amount: '150', transaction_type: 'expense' }
  assert.deepEqual(transactionPreview(wallets, { wallet_id: '2', amount: '200' }, 'expense', expense).map((item) => item.after), [115000, 30000])
  const income = { wallet_id: 1, amount: '1200', transaction_type: 'income' }
  assert.deepEqual(transactionPreview(wallets, { wallet_id: '2', amount: '100' }, 'income', income).map((item) => item.after), [-20000, 60000])
})

test('transfer fees deduct only from the source and empty fees default to zero', () => {
  const fields = { source_wallet_id: '1', destination_wallet_id: '2', amount: '500', fee: '10' }
  assert.deepEqual(transferPreview(wallets, fields).map((item) => item.after), [49000, 100000])
  assert.deepEqual(transferPreview(wallets, { ...fields, fee: '' }).map((item) => item.after), [50000, 100000])
  assert.deepEqual(transferPreview(wallets, { ...fields, destination_wallet_id: '1' }), [])
  assert.deepEqual(transferPreview(wallets, { ...fields, fee: '-1' }), [])
  assert.equal(transferPreview(wallets, { ...fields, amount: '1000' })[0].after, -1000)
})
