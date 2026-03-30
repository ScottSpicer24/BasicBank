import { useState } from 'react'

export default function DepositForm({ onDeposit }) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    const value = parseFloat(amount)
    if (!value || value <= 0) {
      setError('Enter a valid amount')
      return
    }
    setError('')
    setLoading(true)
    try {
      await onDeposit(value)
      setAmount('')
    } catch (err) {
      setError(err.response?.data?.detail || 'Deposit failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="deposit-form">
      <h3>Deposit</h3>
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          aria-label="Deposit amount"
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : 'Deposit'}
        </button>
      </form>
    </div>
  )
}
