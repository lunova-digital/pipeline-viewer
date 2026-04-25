import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { api } from '../../api/client'
import CoordinateInput from '../../components/admin/CoordinateInput'
import './PipelineForm.css'

function PreviewLine({ coordinates }) {
  const map = useMap()
  useEffect(() => {
    if (!coordinates?.length) return
    const latlngs = coordinates.map(([lng, lat]) => [lat, lng])
    const poly = L.polyline(latlngs, { color: '#FF6600', weight: 3, opacity: 0.9 })
    poly.addTo(map)
    try { map.fitBounds(poly.getBounds(), { padding: [20, 20], maxZoom: 10 }) } catch {}
    return () => map.removeLayer(poly)
  }, [map, coordinates])
  return null
}

function parsePreviewCoords(text) {
  if (!text?.trim()) return []
  const lines = text.trim().split('\n').filter(l => l.trim())
  const points = []
  for (const line of lines) {
    const parts = line.split(/[,\s]+/).map(Number)
    if (parts.length >= 2 && !parts.some(isNaN)) {
      const [a, b] = parts
      // Simple lat/lng heuristic for preview
      points.push(Math.abs(a) > 90 ? [a, b] : [b, a])
    }
  }
  return points.length >= 2 ? points : []
}

export default function PipelineForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [form, setForm] = useState({
    name: '', color: '#FF6600', category: 'gas', status: 'operational',
    countries: '', description: '', coordinates: ''
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [previewCoords, setPreviewCoords] = useState([])
  const [metaOptions, setMetaOptions] = useState({ categories: [], statuses: [] })

  useEffect(() => {
    // Fetch meta options
    api.get('/meta').then(res => setMetaOptions(res.data)).catch(err => console.error(err))

    if (!isEdit) return
    api.get(`/pipelines/${id}`).then(r => {
      const p = r.data
      const coords = p.geometry?.coordinates?.map(([lng, lat]) => `${lng},${lat}`).join('\n') || ''
      setForm({
        name: p.name, color: p.color, category: p.category, status: p.status,
        countries: p.countries?.join(', ') || '',
        description: p.description || '', coordinates: coords
      })
      setPreviewCoords(p.geometry?.coordinates || [])
    })
  }, [id, isEdit])

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: typeof e === 'string' ? e : e.target.value }))
  }

  function handleCoordChange(val) {
    setForm(f => ({ ...f, coordinates: val }))
    setPreviewCoords(parsePreviewCoords(val))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)

    const payload = {
      name: form.name,
      color: form.color,
      category: form.category,
      status: form.status,
      countries: form.countries.split(',').map(c => c.trim()).filter(Boolean),
      description: form.description,
      coordinates: form.coordinates
    }

    try {
      if (isEdit) {
        await api.patch(`/admin/pipelines/${id}`, payload)
      } else {
        await api.post('/admin/pipelines', payload)
      }
      navigate('/admin/pipelines')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save pipeline')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="pipeline-form-page">
      <h1 className="page-title">{isEdit ? 'Edit Pipeline' : 'New Pipeline'}</h1>

      <form onSubmit={handleSubmit} className="pipeline-form">
        <div className="form-cols">
          <div className="form-col">
            <div className="form-group">
              <label>Pipeline Name *</label>
              <input type="text" value={form.name} onChange={set('name')} placeholder="e.g. Nord Stream 2" required />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Color</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="color" value={form.color} onChange={set('color')} style={{ width: 48, height: 38, padding: 2, cursor: 'pointer', flex: 'none' }} />
                  <input type="text" value={form.color} onChange={set('color')} placeholder="#FF6600" style={{ flex: 1 }} />
                </div>
              </div>
              <div className="form-group">
                <label>Category</label>
                <select value={form.category} onChange={set('category')}>
                  {metaOptions.categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Status</label>
                <select value={form.status} onChange={set('status')}>
                  {metaOptions.statuses.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Countries (comma-separated)</label>
                <input type="text" value={form.countries} onChange={set('countries')} placeholder="RU, DE, TR" />
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea value={form.description} onChange={set('description')} rows={3} placeholder="Optional description..." />
            </div>

            <div className="form-group">
              <label>Coordinates *</label>
              <CoordinateInput value={form.coordinates} onChange={handleCoordChange} />
            </div>

            {error && <p className="error-msg">{error}</p>}

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/pipelines')}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Pipeline'}
              </button>
            </div>
          </div>

          <div className="form-col">
            <label>Live Preview</label>
            <div className="preview-map-wrap">
              <MapContainer center={[25, 20]} zoom={2} style={{ height: '100%', borderRadius: 8 }} zoomControl={true} scrollWheelZoom={true}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                <PreviewLine coordinates={previewCoords} />
              </MapContainer>
              {previewCoords.length < 2 && (
                <div className="preview-hint">Enter at least 2 coordinates to see the line</div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
