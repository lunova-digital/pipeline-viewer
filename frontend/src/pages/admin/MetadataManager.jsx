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

  // Site settings
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [settingsSaving, setSettingsSaving] = useState(false)

  // Inline editing state
  const [editingCat, setEditingCat]   = useState(null) // { id, label, color }
  const [editingStat, setEditingStat] = useState(null) // { id, label }
  const [editingType, setEditingType] = useState(null) // { id, label, color }

  // Add form state — categories
  const [catId, setCatId]     = useState('')
  const [catLabel, setCatLabel] = useState('')
  const [catColor, setCatColor] = useState('#FF9900')

  // Add form state — statuses
  const [statId, setStatId]     = useState('')
  const [statLabel, setStatLabel] = useState('')

  // Add form state — station types
  const [typeId, setTypeId]     = useState('')
  const [typeLabel, setTypeLabel] = useState('')
  const [typeColor, setTypeColor] = useState('#FF6600')

  useEffect(() => { fetchMeta(); fetchSettings() }, [])

  function fetchMeta() {
    api.get('/meta').then(res => { setMeta(res.data); setLoading(false) })
  }

  function fetchSettings() {
    api.get('/meta/settings').then(res => setSettings(s => ({ ...s, ...res.data })))
  }

  // ── Site settings ────────────────────────────────
  async function handleSaveSettings(e) {
    e.preventDefault()
    setSettingsSaving(true)
    try {
      await api.put('/admin/meta/settings', settings)
      if (settings.site_title) document.title = settings.site_title
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save settings')
    } finally {
      setSettingsSaving(false)
    }
  }

  // ── Categories ───────────────────────────────────
  async function handleAddCategory(e) {
    e.preventDefault()
    if (!catId || !catLabel || !catColor) return
    try {
      await api.post('/admin/meta/categories', { id: catId, label: catLabel, color: catColor })
      setCatId(''); setCatLabel('')
      fetchMeta()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add category')
    }
  }

  async function handleSaveCategory(id) {
    try {
      await api.put(`/admin/meta/categories/${id}`, { label: editingCat.label, color: editingCat.color })
      setEditingCat(null)
      fetchMeta()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save')
    }
  }

  async function handleDeleteCategory(id) {
    if (!window.confirm('Delete this category? Pipelines using it may lose their filter.')) return
    try {
      await api.delete(`/admin/meta/categories/${id}`)
      fetchMeta()
    } catch { alert('Failed to delete category') }
  }

  // ── Statuses ─────────────────────────────────────
  async function handleAddStatus(e) {
    e.preventDefault()
    if (!statId || !statLabel) return
    try {
      await api.post('/admin/meta/statuses', { id: statId, label: statLabel })
      setStatId(''); setStatLabel('')
      fetchMeta()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add status')
    }
  }

  async function handleSaveStatus(id) {
    try {
      await api.put(`/admin/meta/statuses/${id}`, { label: editingStat.label })
      setEditingStat(null)
      fetchMeta()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save')
    }
  }

  async function handleDeleteStatus(id) {
    if (!window.confirm('Delete this status?')) return
    try {
      await api.delete(`/admin/meta/statuses/${id}`)
      fetchMeta()
    } catch { alert('Failed to delete status') }
  }

  // ── Station types ────────────────────────────────
  async function handleAddStationType(e) {
    e.preventDefault()
    if (!typeId || !typeLabel || !typeColor) return
    try {
      await api.post('/admin/meta/station_types', { id: typeId, label: typeLabel, color: typeColor })
      setTypeId(''); setTypeLabel('')
      fetchMeta()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add station type')
    }
  }

  async function handleSaveStationType(id) {
    try {
      await api.put(`/admin/meta/station_types/${id}`, { label: editingType.label, color: editingType.color })
      setEditingType(null)
      fetchMeta()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save')
    }
  }

  async function handleDeleteStationType(id) {
    if (!window.confirm('Delete this station type? Stations using it may lose styling.')) return
    try {
      await api.delete(`/admin/meta/station_types/${id}`)
      fetchMeta()
    } catch { alert('Failed to delete station type') }
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div className="metadata-manager-page">
      <h1 className="page-title">Manage Settings</h1>

      {/* ── Site Identity ──────────────────────────── */}
      <form className="site-settings-card" onSubmit={handleSaveSettings}>
        <h2>Site Identity</h2>
        <p className="settings-hint">Controls the browser tab title and social sharing previews (Open Graph / Twitter Card).</p>
        <div className="settings-fields">
          <div className="form-group">
            <label>Site Name</label>
            <input type="text" value={settings.site_name}
              onChange={e => setSettings(s => ({ ...s, site_name: e.target.value }))}
              placeholder="Station Map" />
          </div>
          <div className="form-group">
            <label>Page Title</label>
            <input type="text" value={settings.site_title}
              onChange={e => setSettings(s => ({ ...s, site_title: e.target.value }))}
              placeholder="Station Map — Global Pipeline Infrastructure" />
          </div>
          <div className="form-group settings-full-width">
            <label>Description</label>
            <textarea value={settings.site_description} rows={2}
              onChange={e => setSettings(s => ({ ...s, site_description: e.target.value }))}
              placeholder="Interactive world map of gas pipelines and infrastructure stations worldwide." />
          </div>
          <div className="form-group settings-full-width">
            <label>Social Image URL <span className="hint-inline">(og:image — full https:// URL)</span></label>
            <input type="url" value={settings.og_image_url}
              onChange={e => setSettings(s => ({ ...s, og_image_url: e.target.value }))}
              placeholder="https://yourdomain.com/preview.png" />
          </div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={settingsSaving}>
          {settingsSaving ? 'Saving…' : 'Save Settings'}
        </button>
      </form>

      {/* ── Categories / Statuses / Station Types ─── */}
      <div className="metadata-grid">

        {/* Categories */}
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
              <input type="color" value={catColor} onChange={e => setCatColor(e.target.value)}
                style={{ padding: 2, height: 38, width: 48, cursor: 'pointer' }} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ height: 38 }}>Add</button>
          </form>

          <div className="meta-list">
            {meta.categories.map(c => (
              editingCat?.id === c.id ? (
                <div key={c.id} className="meta-item meta-item-editing">
                  <input className="meta-edit-input" value={editingCat.label} autoFocus
                    onChange={e => setEditingCat(v => ({ ...v, label: e.target.value }))}
                    onKeyDown={e => e.key === 'Escape' && setEditingCat(null)} />
                  <input type="color" value={editingCat.color}
                    onChange={e => setEditingCat(v => ({ ...v, color: e.target.value }))}
                    style={{ width: 36, height: 36, padding: 2, cursor: 'pointer', border: '1px solid var(--border-solid)', borderRadius: 4, background: 'none', flexShrink: 0 }} />
                  <div className="meta-edit-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => handleSaveCategory(c.id)}>Save</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setEditingCat(null)}>✕</button>
                  </div>
                </div>
              ) : (
                <div key={c.id} className="meta-item">
                  <div className="meta-item-info">
                    <span className="color-dot" style={{ background: c.color }} />
                    <span>{c.label}</span>
                    <span className="meta-item-id">{c.id}</span>
                  </div>
                  <div className="meta-item-actions">
                    <button className="btn-edit-sm" onClick={() => setEditingCat({ id: c.id, label: c.label, color: c.color })}>Edit</button>
                    <button className="btn-danger-sm" onClick={() => handleDeleteCategory(c.id)}>Delete</button>
                  </div>
                </div>
              )
            ))}
            {meta.categories.length === 0 && <p className="empty-state">No categories</p>}
          </div>
        </div>

        {/* Statuses */}
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
              editingStat?.id === s.id ? (
                <div key={s.id} className="meta-item meta-item-editing">
                  <input className="meta-edit-input" value={editingStat.label} autoFocus
                    onChange={e => setEditingStat(v => ({ ...v, label: e.target.value }))}
                    onKeyDown={e => e.key === 'Escape' && setEditingStat(null)} />
                  <div className="meta-edit-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => handleSaveStatus(s.id)}>Save</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setEditingStat(null)}>✕</button>
                  </div>
                </div>
              ) : (
                <div key={s.id} className="meta-item">
                  <div className="meta-item-info">
                    <span>{s.label}</span>
                    <span className="meta-item-id">{s.id}</span>
                  </div>
                  <div className="meta-item-actions">
                    <button className="btn-edit-sm" onClick={() => setEditingStat({ id: s.id, label: s.label })}>Edit</button>
                    <button className="btn-danger-sm" onClick={() => handleDeleteStatus(s.id)}>Delete</button>
                  </div>
                </div>
              )
            ))}
            {meta.statuses.length === 0 && <p className="empty-state">No statuses</p>}
          </div>
        </div>

        {/* Station Types */}
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
              <input type="color" value={typeColor} onChange={e => setTypeColor(e.target.value)}
                style={{ padding: 2, height: 38, width: 48, cursor: 'pointer' }} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ height: 38 }}>Add</button>
          </form>

          <div className="meta-list">
            {(meta.station_types || []).map(t => (
              editingType?.id === t.id ? (
                <div key={t.id} className="meta-item meta-item-editing">
                  <input className="meta-edit-input" value={editingType.label} autoFocus
                    onChange={e => setEditingType(v => ({ ...v, label: e.target.value }))}
                    onKeyDown={e => e.key === 'Escape' && setEditingType(null)} />
                  <input type="color" value={editingType.color}
                    onChange={e => setEditingType(v => ({ ...v, color: e.target.value }))}
                    style={{ width: 36, height: 36, padding: 2, cursor: 'pointer', border: '1px solid var(--border-solid)', borderRadius: 4, background: 'none', flexShrink: 0 }} />
                  <div className="meta-edit-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => handleSaveStationType(t.id)}>Save</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setEditingType(null)}>✕</button>
                  </div>
                </div>
              ) : (
                <div key={t.id} className="meta-item">
                  <div className="meta-item-info">
                    <span className="color-dot" style={{ background: t.color, borderRadius: '50%' }} />
                    <span>{t.label}</span>
                    <span className="meta-item-id">{t.id}</span>
                  </div>
                  <div className="meta-item-actions">
                    <button className="btn-edit-sm" onClick={() => setEditingType({ id: t.id, label: t.label, color: t.color })}>Edit</button>
                    <button className="btn-danger-sm" onClick={() => handleDeleteStationType(t.id)}>Delete</button>
                  </div>
                </div>
              )
            ))}
            {(!meta.station_types || meta.station_types.length === 0) && <p className="empty-state">No station types</p>}
          </div>
        </div>

      </div>
    </div>
  )
}
