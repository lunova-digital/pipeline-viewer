import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'

export default function StationList() {
  const [stations, setStations] = useState([])
  const [categories, setCategories] = useState({})
  const [types, setTypes] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/admin/stations'),
      api.get('/meta')
    ]).then(([stationsRes, metaRes]) => {
      setStations(stationsRes.data)
      const catMap = {}
      const typeMap = {}
      if (metaRes.data && metaRes.data.station_categories) {
        metaRes.data.station_categories.forEach(c => {
          catMap[c.id] = c.color
        })
      }
      if (metaRes.data && metaRes.data.station_types) {
        metaRes.data.station_types.forEach(t => {
          typeMap[t.id] = t.color
        })
      }
      setCategories(catMap)
      setTypes(typeMap)
    }).finally(() => setLoading(false))
  }, [])

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete station "${name}"?`)) return
    try {
      await api.delete(`/admin/stations/${id}`)
      setStations(prev => prev.filter(s => s.id !== id))
    } catch {
      alert('Failed to delete station')
    }
  }

  if (loading) return <div className="loading">Loading stations...</div>

  return (
    <div>
      <div className="section-header" style={{ marginBottom: 20 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Stations</h1>
        <Link to="/admin/stations/new" className="btn btn-primary btn-sm">+ New Station</Link>
      </div>

      {stations.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '60px 0' }}>
          No stations yet. <Link to="/admin/stations/new">Create one →</Link>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Pipeline</th>
              <th>Coordinates</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {stations.map(s => (
              <tr key={s.id}>
                 <td>
                  <span className="color-dot" style={{ background: categories[s.category] || types[s.type] || '#888' }} />
                  {s.name}
                </td>
                <td style={{ textTransform: 'capitalize' }}>{s.type}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{s.pipeline_name || '—'}</td>
                <td style={{ fontFamily: 'monospace', fontSize: 12 }}>
                  {s.lat?.toFixed(4)}, {s.lng?.toFixed(4)}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Link to={`/admin/stations/${s.id}/edit`} className="btn btn-secondary btn-sm">Edit</Link>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id, s.name)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
