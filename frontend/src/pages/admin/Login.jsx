import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setAdminKey } from '../../api/client'
import { api } from '../../api/client'
import './Login.css'

export default function Login() {
  const [key, setKey] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!key.trim()) return

    setLoading(true)
    setError('')

    try {
      setAdminKey(key.trim())
      await api.get('/admin/pipelines')
      navigate('/admin')
    } catch (err) {
      setAdminKey(null)
      setError(err.response?.status === 401 ? 'Invalid admin key' : 'Connection error — is the server running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-logo">⛽</div>
        <h1>Station Map</h1>
        <p className="login-subtitle">Admin Panel</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Admin Key</label>
            <input
              type="password"
              value={key}
              onChange={e => setKey(e.target.value)}
              placeholder="Enter your admin key"
              autoFocus
            />
          </div>

          {error && <p className="error-msg" style={{ marginBottom: 12 }}>{error}</p>}

          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '10px' }} disabled={loading}>
            {loading ? 'Checking...' : 'Sign In'}
          </button>
        </form>

        <a href="/" className="login-map-link">← Back to Map</a>
      </div>
    </div>
  )
}
