import { useState } from 'react'

export default function WithdrawForm({ onWithdraw }) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault() // prevent the default form submission, reloading the page
    const value = parseFloat(amount)
    if (!value || value <= 0) {
      setError('Enter a valid amount')
      return
    }
    setError('')
    setLoading(true)
    try {
      await onWithdraw(value)
      setAmount('')
    } catch (err) {
      setError(err.response?.data?.detail || 'Withdrawal failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="withdraw-form">
      <h3>Withdraw</h3>
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          aria-label="Withdraw amount"
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : 'Withdraw'}
        </button>
      </form>
    </div>
  )
}
