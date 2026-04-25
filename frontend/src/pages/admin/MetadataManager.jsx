import { useState, useEffect } from 'react'
import { api } from '../../api/client'
import './MetadataManager.css'

export default function MetadataManager() {
  const [meta, setMeta] = useState({ categories: [], statuses: [] })
  const [loading, setLoading] = useState(true)

  // Category form state
  const [catId, setCatId] = useState('')
  const [catLabel, setCatLabel] = useState('')
  const [catColor, setCatColor] = useState('#FF9900')

  // Status form state
  const [statId, setStatId] = useState('')
  const [statLabel, setStatLabel] = useState('')

  useEffect(() => {
    fetchMeta()
  }, [])

  function fetchMeta() {
    api.get('/meta').then(res => {
      setMeta(res.data)
      setLoading(false)
    })
  }

  async function handleAddCategory(e) {
    e.preventDefault()
    if (!catId || !catLabel || !catColor) return
    try {
      await api.post('/admin/meta/categories', { id: catId, label: catLabel, color: catColor })
      setCatId('')
      setCatLabel('')
      fetchMeta()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add category')
    }
  }

  async function handleDeleteCategory(id) {
    if (!window.confirm('Are you sure you want to delete this category? Pipelines using it might lose their filter.')) return
    try {
      await api.delete(`/admin/meta/categories/${id}`)
      fetchMeta()
    } catch (err) {
      alert('Failed to delete category')
    }
  }

  async function handleAddStatus(e) {
    e.preventDefault()
    if (!statId || !statLabel) return
    try {
      await api.post('/admin/meta/statuses', { id: statId, label: statLabel })
      setStatId('')
      setStatLabel('')
      fetchMeta()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add status')
    }
  }

  async function handleDeleteStatus(id) {
    if (!window.confirm('Are you sure you want to delete this status?')) return
    try {
      await api.delete(`/admin/meta/statuses/${id}`)
      fetchMeta()
    } catch (err) {
      alert('Failed to delete status')
    }
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div className="metadata-manager-page">
      <h1 className="page-title">Manage Categories & Statuses</h1>

      <div className="metadata-grid">
        <div className="meta-card">
          <h2>Categories</h2>
          
          <form className="meta-form" onSubmit={handleAddCategory}>
            <div className="form-group">
              <label>ID (e.g. 'water')</label>
              <input type="text" value={catId} onChange={e => setCatId(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Label</label>
              <input type="text" value={catLabel} onChange={e => setCatLabel(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Color</label>
              <input type="color" value={catColor} onChange={e => setCatColor(e.target.value)} style={{ padding: 2, height: 38, width: 48, cursor: 'pointer' }} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ height: 38 }}>Add</button>
          </form>

          <div className="meta-list">
            {meta.categories.map(c => (
              <div key={c.id} className="meta-item">
                <div className="meta-item-info">
                  <span className="color-dot" style={{ background: c.color }}></span>
                  <span>{c.label}</span>
                  <span className="meta-item-id">{c.id}</span>
                </div>
                <button className="btn-danger-sm" onClick={() => handleDeleteCategory(c.id)}>Delete</button>
              </div>
            ))}
            {meta.categories.length === 0 && <p className="empty-state">No categories found</p>}
          </div>
        </div>

        <div className="meta-card">
          <h2>Statuses</h2>
          
          <form className="meta-form" style={{ gridTemplateColumns: '1fr 1fr auto' }} onSubmit={handleAddStatus}>
            <div className="form-group">
              <label>ID (e.g. 'maintenance')</label>
              <input type="text" value={statId} onChange={e => setStatId(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Label</label>
              <input type="text" value={statLabel} onChange={e => setStatLabel(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ height: 38 }}>Add</button>
          </form>

          <div className="meta-list">
            {meta.statuses.map(s => (
              <div key={s.id} className="meta-item">
                <div className="meta-item-info">
                  <span>{s.label}</span>
                  <span className="meta-item-id">{s.id}</span>
                </div>
                <button className="btn-danger-sm" onClick={() => handleDeleteStatus(s.id)}>Delete</button>
              </div>
            ))}
            {meta.statuses.length === 0 && <p className="empty-state">No statuses found</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
