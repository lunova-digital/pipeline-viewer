import { useState, useEffect } from 'react'
import { api } from '../../api/client'
import './MetadataManager.css'

const DEFAULT_SETTINGS = {
  site_name: '',
  site_title: '',
  site_description: '',
  og_image_url: '',
}

export default function MetadataManager() {
  const [meta, setMeta] = useState({ categories: [], statuses: [], station_types: [] })
  const [loading, setLoading] = useState(true)

  // Site settings state
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [settingsSaving, setSettingsSaving] = useState(false)

  // Category form state
  const [catId, setCatId] = useState('')
  const [catLabel, setCatLabel] = useState('')
  const [catColor, setCatColor] = useState('#FF9900')

  // Status form state
  const [statId, setStatId] = useState('')
  const [statLabel, setStatLabel] = useState('')

  // Station Type form state
  const [typeId, setTypeId] = useState('')
  const [typeLabel, setTypeLabel] = useState('')
  const [typeColor, setTypeColor] = useState('#FF6600')

  useEffect(() => {
    fetchMeta()
    fetchSettings()
  }, [])

  function fetchMeta() {
    api.get('/meta').then(res => {
      setMeta(res.data)
      setLoading(false)
    })
  }

  function fetchSettings() {
    api.get('/meta/settings').then(res => {
      setSettings(s => ({ ...s, ...res.data }))
    })
  }

  async function handleSaveSettings(e) {
    e.preventDefault()
    setSettingsSaving(true)
    try {
      await api.put('/admin/meta/settings', settings)
      // Apply to current page immediately
      if (settings.site_title) document.title = settings.site_title
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save settings')
    } finally {
      setSettingsSaving(false)
    }
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

  async function handleAddStationType(e) {
    e.preventDefault()
    if (!typeId || !typeLabel || !typeColor) return
    try {
      await api.post('/admin/meta/station_types', { id: typeId, label: typeLabel, color: typeColor })
      setTypeId('')
      setTypeLabel('')
      fetchMeta()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add station type')
    }
  }

  async function handleDeleteStationType(id) {
    if (!window.confirm('Are you sure you want to delete this station type? Stations using it might lose their styling and filter.')) return
    try {
      await api.delete(`/admin/meta/station_types/${id}`)
      fetchMeta()
    } catch (err) {
      alert('Failed to delete station type')
    }
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div className="metadata-manager-page">
      <h1 className="page-title">Manage Settings</h1>

      <form className="site-settings-card" onSubmit={handleSaveSettings}>
        <h2>Site Identity</h2>
        <p className="settings-hint">These values update the browser tab title and social media sharing previews (Open Graph / Twitter Card).</p>
        <div className="settings-fields">
          <div className="form-group">
            <label>Site Name</label>
            <input
              type="text"
              value={settings.site_name}
              onChange={e => setSettings(s => ({ ...s, site_name: e.target.value }))}
              placeholder="Station Map"
            />
          </div>
          <div className="form-group">
            <label>Page Title</label>
            <input
              type="text"
              value={settings.site_title}
              onChange={e => setSettings(s => ({ ...s, site_title: e.target.value }))}
              placeholder="Station Map — Global Pipeline Infrastructure"
            />
          </div>
          <div className="form-group settings-full-width">
            <label>Description</label>
            <textarea
              value={settings.site_description}
              onChange={e => setSettings(s => ({ ...s, site_description: e.target.value }))}
              placeholder="Interactive world map of gas pipelines and infrastructure stations worldwide."
              rows={2}
            />
          </div>
          <div className="form-group settings-full-width">
            <label>Social Image URL <span className="hint-inline">(og:image — paste a full https:// URL)</span></label>
            <input
              type="url"
              value={settings.og_image_url}
              onChange={e => setSettings(s => ({ ...s, og_image_url: e.target.value }))}
              placeholder="https://yourdomain.com/preview.png"
            />
          </div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={settingsSaving}>
          {settingsSaving ? 'Saving…' : 'Save Settings'}
        </button>
      </form>

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

        <div className="meta-card">
          <h2>Station Types</h2>
          
          <form className="meta-form" onSubmit={handleAddStationType}>
            <div className="form-group">
              <label>ID (e.g. 'compressor')</label>
              <input type="text" value={typeId} onChange={e => setTypeId(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Label</label>
              <input type="text" value={typeLabel} onChange={e => setTypeLabel(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Color</label>
              <input type="color" value={typeColor} onChange={e => setTypeColor(e.target.value)} style={{ padding: 2, height: 38, width: 48, cursor: 'pointer' }} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ height: 38 }}>Add</button>
          </form>

          <div className="meta-list">
            {(meta.station_types || []).map(t => (
              <div key={t.id} className="meta-item">
                <div className="meta-item-info">
                  <span className="color-dot" style={{ background: t.color }}></span>
                  <span>{t.label}</span>
                  <span className="meta-item-id">{t.id}</span>
                </div>
                <button className="btn-danger-sm" onClick={() => handleDeleteStationType(t.id)}>Delete</button>
              </div>
            ))}
            {(!meta.station_types || meta.station_types.length === 0) && <p className="empty-state">No station types found</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
