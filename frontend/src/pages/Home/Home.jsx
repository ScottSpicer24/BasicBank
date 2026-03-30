import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { API } from '../../api/api'
import AccountList from '../../components/AccountList'
import AccountDetails from '../../components/AccountDetails'
import TransactionList from '../../components/TransactionList'
import DepositForm from '../../components/DepositForm'
import WithdrawForm from '../../components/WithdrawForm'
import CreateAccountModal from '../../components/CreateAccountModal'
import './Home.css'

export default function Home() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState([])
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  const loadAccounts = useCallback(async () => {
    setLoading(true)
    try {
      const listRes = await API.get('/api/accounts/')
      const ids = listRes.data.map(a => a.account_id)
      if (ids.length === 0) {
        setAccounts([])
        return
      }
      const results = await Promise.allSettled(
        ids.map(id => API.get(`/api/accounts/${id}`))
      )
      const loaded = []
      results.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          loaded.push({ ...result.value.data, id: ids[idx] })
        }
      })
      setAccounts(loaded)
    } catch {
      setError('Failed to load accounts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAccounts()
  }, [loadAccounts])

  const handleCreateAccount = async (accountData) => {
    await API.post('/api/accounts/', accountData)
    await loadAccounts()
  }

  const handleSelectAccount = async (account) => {
    setSelectedAccount(account)
    setTransactions([])
    setError('')
    try {
      const res = await API.get(`/api/accounts/${account.id}/transactions`)
      setTransactions(res.data)
    } catch {
      // transactions may simply be empty
    }
  }

  const refreshSelectedAccount = useCallback(async (accountId) => {
    try {
      const [accountRes, txnRes] = await Promise.all([
        API.get(`/api/accounts/${accountId}`),
        API.get(`/api/accounts/${accountId}/transactions`),
      ])
      setSelectedAccount({ ...accountRes.data, id: accountId })
      setTransactions(txnRes.data)
      await loadAccounts()
    } catch {
      setError('Failed to refresh account')
    }
  }, [loadAccounts])

  const handleDeposit = async (amount) => {
    setError('')
    await API.put(`/api/accounts/${selectedAccount.id}/deposit`, { amount })
    await refreshSelectedAccount(selectedAccount.id)
  }

  const handleWithdraw = async (amount) => {
    setError('')
    await API.put(`/api/accounts/${selectedAccount.id}/withdraw`, { amount })
    await refreshSelectedAccount(selectedAccount.id)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="home-page">
      <header className="home-header">
        <h1>BasicBank</h1>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </header>

      {error && <p className="error-message home-error">{error}</p>}

      <div className="home-content">
        <section className="sidebar">
          <AccountList
            accounts={accounts}
            loading={loading}
            selectedId={selectedAccount?.id}
            onSelect={handleSelectAccount}
            onCreateClick={() => setShowCreateModal(true)}
          />
        </section>

        <section className="main-panel">
          {selectedAccount ? (
            <>
              <AccountDetails account={selectedAccount} />
              <div className="forms-row">
                <DepositForm onDeposit={handleDeposit} />
                <WithdrawForm onWithdraw={handleWithdraw} />
              </div>
              <TransactionList transactions={transactions} />
            </>
          ) : (
            <div className="no-selection">
              <p>Select an account or create a new one to get started.</p>
            </div>
          )}
        </section>
      </div>

      {showCreateModal && (
        <CreateAccountModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateAccount}
        />
      )}
    </div>
  )
}
