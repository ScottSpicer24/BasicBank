import { useState } from 'react'

export default function CreateAccountModal({ onClose, onCreate }) {
  const [accountType, setAccountType] = useState('checking')
  const [initialBalance, setInitialBalance] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setCreating(true)
    try {
      await onCreate({
        balance: parseFloat(initialBalance) || 0,
        account_type: accountType,
      })
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create account')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Account</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="accountType">Account Type</label>
            <select
              id="accountType"
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
            >
              <option value="checking">Checking</option>
              <option value="savings">Savings</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="initialBalance">Initial Balance</label>
            <input
              id="initialBalance"
              type="number"
              min="0"
              step="0.01"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <button type="submit" disabled={creating}>
            {creating ? 'Creating...' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  )
}
