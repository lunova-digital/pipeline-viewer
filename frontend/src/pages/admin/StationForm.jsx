import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import { api } from '../../api/client'

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1'
function ClickMarker({ lat, lng, onChange }) {
  useMapEvents({
    click(e) { onChange(e.latlng.lat, e.latlng.lng) }
  })
  if (!lat || !lng) return null
  return <Marker position={[lat, lng]} />
}

export default function StationForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [form, setForm] = useState({ name: '', type: 'compressor', pipeline_id: '', description: '', lat: '', lng: '' })
  const [pipelines, setPipelines] = useState([])
  const [metaOptions, setMetaOptions] = useState({ station_types: [] })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/admin/pipelines').then(r => setPipelines(r.data))
    api.get('/meta').then(r => setMetaOptions(r.data))
    if (!isEdit) return
    api.get(`/stations/${id}`).then(r => {
      const s = r.data
      setForm({
        name: s.name, type: s.type, pipeline_id: s.pipeline_id || '',
        description: s.description || '',
        lat: String(s.geometry?.coordinates?.[1] ?? ''),
        lng: String(s.geometry?.coordinates?.[0] ?? '')
      })
    })
  }, [id, isEdit])

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  function handleMapClick(lat, lng) {
    setForm(f => ({ ...f, lat: lat.toFixed(6), lng: lng.toFixed(6) }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)

    const payload = {
      name: form.name, type: form.type,
      pipeline_id: form.pipeline_id || null,
      description: form.description,
      lat: form.lat, lng: form.lng
    }

    try {
      if (isEdit) {
        await api.patch(`/admin/stations/${id}`, payload)
      } else {
        await api.post('/admin/stations', payload)
      }
      navigate('/admin/stations')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save station')
    } finally {
      setSaving(false)
    }
  }

  const mapLat = parseFloat(form.lat)
  const mapLng = parseFloat(form.lng)
  const hasCoords = !isNaN(mapLat) && !isNaN(mapLng)

  return (
    <div style={{ maxWidth: 900 }}>
      <h1 className="page-title">{isEdit ? 'Edit Station' : 'New Station'}</h1>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          <div>
            <div className="form-group">
              <label>Station Name *</label>
              <input type="text" value={form.name} onChange={set('name')} placeholder="e.g. Portovaya Compressor Station" required />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Type</label>
                <select value={form.type} onChange={set('type')}>
                  {(metaOptions.station_types || []).map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Linked Pipeline</label>
                <select value={form.pipeline_id} onChange={set('pipeline_id')}>
                  <option value="">— None —</option>
                  {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Latitude</label>
                <input type="number" step="any" value={form.lat} onChange={set('lat')} placeholder="52.5200" required />
              </div>
              <div className="form-group">
                <label>Longitude</label>
                <input type="number" step="any" value={form.lng} onChange={set('lng')} placeholder="13.4050" required />
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea value={form.description} onChange={set('description')} rows={3} placeholder="Optional description..." />
            </div>

            {error && <p className="error-msg">{error}</p>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/stations')}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Station'}
              </button>
            </div>
          </div>

          <div>
            <label>Click map to set location</label>
            <div style={{ height: 400, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-solid)' }}>
              <MapContainer
                center={hasCoords ? [mapLat, mapLng] : [25, 20]}
                zoom={hasCoords ? 8 : 2}
                style={{ height: '100%' }}
                zoomControl={true}
              >
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                <ClickMarker lat={hasCoords ? mapLat : null} lng={hasCoords ? mapLng : null} onChange={handleMapClick} />
              </MapContainer>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
              Click anywhere on the map to set coordinates, or type them manually above.
            </p>
          </div>
        </div>
      </form>
    </div>
  )
}
