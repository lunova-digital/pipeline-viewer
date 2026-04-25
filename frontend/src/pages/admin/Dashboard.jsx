import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import './Dashboard.css'

export default function Dashboard() {
  const [stats, setStats] = useState({ pipelines: 0, stations: 0 })
  const [pipelines, setPipelines] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/admin/pipelines'),
      api.get('/admin/stations')
    ]).then(([p, s]) => {
      setPipelines(p.data.slice(0, 5))
      setStats({ pipelines: p.data.length, stations: s.data.length })
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>

      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-icon">🛢</div>
          <div className="stat-num">{stats.pipelines}</div>
          <div className="stat-label">Pipelines</div>
          <Link to="/admin/pipelines" className="stat-link">Manage →</Link>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📍</div>
          <div className="stat-num">{stats.stations}</div>
          <div className="stat-label">Stations</div>
          <Link to="/admin/stations" className="stat-link">Manage →</Link>
        </div>
        <div className="stat-card" style={{ background: '#161b22', border: '1px solid #30363d' }}>
          <div className="stat-icon">⚙️</div>
          <div className="stat-num">—</div>
          <div className="stat-label">Settings</div>
          <Link to="/admin/settings" className="stat-link">Manage →</Link>
        </div>
      </div>

      <div className="section-header">
        <h2>Recent Pipelines</h2>
        <Link to="/admin/pipelines/new" className="btn btn-primary btn-sm">+ New Pipeline</Link>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Status</th>
            <th>Length</th>
          </tr>
        </thead>
        <tbody>
          {pipelines.map(p => (
            <tr key={p.id}>
              <td>
                <span className="color-dot" style={{ background: p.color }} />
                <Link to={`/admin/pipelines/${p.id}/edit`}>{p.name}</Link>
              </td>
              <td style={{ textTransform: 'capitalize' }}>{p.category}</td>
              <td><StatusBadge status={p.status} /></td>
              <td>{p.length_km ? `${Math.round(p.length_km).toLocaleString()} km` : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StatusBadge({ status }) {
  const colors = {
    operational: '#3fb950',
    planned: '#d29922',
    under_construction: '#FF9900',
    decommissioned: '#f85149'
  }
  return (
    <span style={{ color: colors[status] || '#8b949e', fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>
      {status?.replace(/_/g, ' ')}
    </span>
  )
}
