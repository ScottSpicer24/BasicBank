export default function AccountList({ accounts, loading, selectedId, onSelect, onCreateClick }) {
  return (
    <div className="account-list">
      <h2>Your Accounts</h2>
      {loading ? (
        <p>Loading accounts...</p>
      ) : accounts.length === 0 ? (
        <p className="empty-state">No accounts yet.</p>
      ) : (
        <ul>
          {accounts.map((account) => (
            <li
              key={account.id}
              className={`account-item ${account.id === selectedId ? 'selected' : ''}`}
              onClick={() => onSelect(account)}
            >
              <span className="account-type">{account.account_type}</span>
              <span className="account-balance">${account.balance?.toFixed(2)}</span>
            </li>
          ))}
        </ul>
      )}
      <button className="create-account-btn" onClick={onCreateClick}>
        + Create Account
      </button>
    </div>
  )
}
