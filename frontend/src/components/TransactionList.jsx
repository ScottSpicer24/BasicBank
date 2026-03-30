export default function TransactionList({ transactions }) {
  return (
    <div className="transaction-list">
      <h2>Transactions</h2>
      {!transactions || transactions.length === 0 ? (
        <p className="empty-state">No transactions yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Amount</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((txn, idx) => (
              <tr key={idx}>
                <td>{txn.txn_type}</td>
                <td className={txn.txn_type === 'deposit' ? 'positive' : 'negative'}>
                  {txn.txn_type === 'deposit' ? '+' : '-'}${txn.amount?.toFixed(2)}
                </td>
                <td>
                  {txn.created_at
                    ? new Date(txn.created_at).toLocaleString()
                    : '\u2014'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
