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

  const loadAccounts = useCallback(async () => { // useCallback is used to memoize the loadAccounts function so that it is not recreated on every render
    setLoading(true)
    try {
      // API: get the list of accounts
      const listRes = await API.get('/api/accounts/')
      const ids = listRes.data.map(a => a.account_id)
      if (ids.length === 0) {
        setAccounts([])
        return
      }

      // API: get the details of each account
      const results = await Promise.allSettled(
        ids.map(id => API.get(`/api/accounts/${id}`))
      )

      // for each account, add the details to the accounts list
      const loaded = []
      results.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          loaded.push({ ...result.value.data, id: ids[idx] }) 
        }
      })

      // set the accounts list when all the accounts are loaded
      setAccounts(loaded)
    } catch {
      setError('Failed to load accounts')
    } finally {
      setLoading(false)
    }
  }, [])

  // load the accounts when the component is mounted
  useEffect(() => {
    loadAccounts()
  }, [loadAccounts])

  // API: create a new account
  const handleCreateAccount = async (accountData) => {
    await API.post('/api/accounts/', accountData)
    await loadAccounts()
  }

  // select an account and load the transactions for that account
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

  // refresh the Ui after a deposit or a withdrawal
  const refreshSelectedAccount = useCallback(async (accountId) => {
    try {
      // API: get the details of the account and the transactions for the updated account
      const [accountRes, txnRes] = await Promise.all([
        API.get(`/api/accounts/${accountId}`),
        API.get(`/api/accounts/${accountId}/transactions`),
      ])
      // set the selected account and the transactions for the updated account
      setSelectedAccount({ ...accountRes.data, id: accountId })
      setTransactions(txnRes.data)
      // reload the accounts list
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
