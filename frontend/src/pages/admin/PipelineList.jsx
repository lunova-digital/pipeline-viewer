import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'

export default function PipelineList() {
  const [pipelines, setPipelines] = useState([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const fileRef = useRef(null)

  function load() {
    setLoading(true)
    api.get('/admin/pipelines')
      .then(r => setPipelines(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return
    try {
      await api.delete(`/admin/pipelines/${id}`)
      setPipelines(prev => prev.filter(p => p.id !== id))
    } catch {
      alert('Failed to delete pipeline')
    }
  }

  async function handleImport(file) {
    if (!file) return
    setImporting(true)
    setImportResult(null)
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await api.post('/admin/pipelines/import-csv', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setImportResult(res.data)
      load()
    } catch (err) {
      setImportResult({ error: err.response?.data?.error || 'Import failed' })
    } finally {
      setImporting(false)
    }
  }

  if (loading) return <div className="loading">Loading pipelines...</div>

  return (
    <div>
      <div className="section-header" style={{ marginBottom: 20 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Pipelines</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()} disabled={importing}>
            {importing ? 'Importing...' : '⬆ Bulk CSV'}
          </button>
          <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={e => handleImport(e.target.files[0])} />
          <Link to="/admin/pipelines/new" className="btn btn-primary btn-sm">+ New Pipeline</Link>
        </div>
      </div>

      {importResult && (
        <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 8, background: importResult.error ? 'rgba(248,81,73,0.1)' : 'rgba(63,185,80,0.1)', border: `1px solid ${importResult.error ? '#f85149' : '#3fb950'}`, fontSize: 13 }}>
          {importResult.error
            ? `❌ ${importResult.error}`
            : `✅ Imported ${importResult.succeeded} / ${importResult.total} pipelines`}
          {importResult.results?.filter(r => !r.success).map((r, i) => (
            <div key={i} style={{ color: '#f85149', marginTop: 4 }}>↳ {r.name}: {r.error}</div>
          ))}
        </div>
      )}

      {pipelines.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '60px 0' }}>
          No pipelines yet. <Link to="/admin/pipelines/new">Create one →</Link>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Status</th>
              <th>Length</th>
              <th>Countries</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pipelines.map(p => (
              <tr key={p.id}>
                <td>
                  <span className="color-dot" style={{ background: p.color }} />
                  {p.name}
                </td>
                <td style={{ textTransform: 'capitalize' }}>{p.category}</td>
                <td><StatusBadge status={p.status} /></td>
                <td>{p.length_km ? `${Math.round(p.length_km).toLocaleString()} km` : '—'}</td>
                <td>{p.countries?.join(', ') || '—'}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Link to={`/admin/pipelines/${p.id}/edit`} className="btn btn-secondary btn-sm">Edit</Link>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id, p.name)}>Delete</button>
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

function StatusBadge({ status }) {
  const colors = { operational: '#3fb950', planned: '#d29922', under_construction: '#FF9900', decommissioned: '#f85149' }
  return <span style={{ color: colors[status] || '#8b949e', fontSize: 12, fontWeight: 600 }}>{status?.replace(/_/g, ' ')}</span>
}
