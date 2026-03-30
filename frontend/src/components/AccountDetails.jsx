export default function AccountDetails({ account }) {
  return (
    <div className="account-details">
      <h2>Account Details</h2>
      <div className="details-grid">
        <div className="detail-item">
          <span className="detail-label">Account ID</span>
          <span className="detail-value">{account.id}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Type</span>
          <span className="detail-value">{account.account_type}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Balance</span>
          <span className="detail-value balance">${account.balance?.toFixed(2)}</span>
        </div>
        {account.created_at && (
          <div className="detail-item">
            <span className="detail-label">Created</span>
            <span className="detail-value">
              {new Date(account.created_at).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
