import { useState, useRef, useEffect, useCallback } from 'react'
import './SearchBar.css'

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1'

function parseCoord(q) {
  const cleaned = q.trim().replace(/[°'"]/g, '')
  const m = cleaned.match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/)
  if (!m) return null
  const lat = parseFloat(m[1])
  const lng = parseFloat(m[2])
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
  return { lat, lng }
}

const TYPE_ICON  = { coordinate: '📍', station: '⚙', place: '🌐' }
const TYPE_LABEL = { coordinate: 'Coordinate', station: 'Station', place: 'Place' }

export default function SearchBar({ map, onCoordinate }) {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(false)
  const debounceRef           = useRef(null)
  const inputRef              = useRef(null)

  const search = useCallback(async (q) => {
    const trimmed = q.trim()
    if (!trimmed) { setResults([]); setOpen(false); return }

    const coord = parseCoord(trimmed)
    if (coord) {
      setResults([{ _type: 'coordinate', lat: coord.lat, lng: coord.lng }])
      setOpen(true)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const enc = encodeURIComponent(trimmed)
      const [pipes, stations, places] = await Promise.all([
        fetch(`${API_BASE}/pipelines/search?q=${enc}`).then(r => r.json()).catch(() => []),
        fetch(`${API_BASE}/stations/search?q=${enc}`).then(r => r.json()).catch(() => []),
        fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=3&q=${enc}`)
          .then(r => r.json()).catch(() => []),
      ])

      const combined = [
        ...pipes.map(p => ({ _type: 'pipeline', ...p })),
        ...stations.map(s => ({ _type: 'station', ...s })),
        ...places.map(p => ({
          _type: 'place',
          name: p.display_name,
          lat: parseFloat(p.lat),
          lng: parseFloat(p.lon),
          bbox: p.boundingbox,
        })),
      ]
      setResults(combined)
      setOpen(combined.length > 0)
    } finally {
      setLoading(false)
    }
  }, [])

  function handleInput(e) {
    const q = e.target.value
    setQuery(q)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(q), 300)
  }

  function handleSelect(item) {
    setOpen(false)
    if (!map) return

    if (item._type === 'coordinate') {
      setQuery(`${item.lat.toFixed(6)}, ${item.lng.toFixed(6)}`)
      map.flyTo([item.lat, item.lng], Math.max(map.getZoom(), 10), { animate: true })
      onCoordinate?.({ lat: item.lat, lng: item.lng })

    } else if (item._type === 'pipeline') {
      setQuery(item.name)
      if (item.envelope?.type === 'Polygon') {
        const coords = item.envelope.coordinates[0]
        const lngs = coords.map(c => c[0])
        const lats = coords.map(c => c[1])
        map.fitBounds(
          [[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]],
          { padding: [60, 60] }
        )
      }

    } else if (item._type === 'station') {
      setQuery(item.name)
      map.flyTo([parseFloat(item.lat), parseFloat(item.lng)], 12, { animate: true })

    } else if (item._type === 'place') {
      setQuery(item.name.split(',')[0].trim())
      if (item.bbox) {
        const [minLat, maxLat, minLng, maxLng] = item.bbox.map(parseFloat)
        map.fitBounds([[minLat, minLng], [maxLat, maxLng]], { padding: [40, 40] })
      } else {
        map.flyTo([item.lat, item.lng], 10, { animate: true })
      }
    }
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur() }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="search-bar">
      <div className="search-input-wrap">
        <span className="search-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </span>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search pipelines, stations, places or coords…"
          value={query}
          onChange={handleInput}
          onFocus={() => results.length && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
        {loading && <span className="search-spinner" />}
        {query && !loading && (
          <button
            className="search-clear"
            onMouseDown={e => e.preventDefault()}
            onClick={() => { setQuery(''); setResults([]); setOpen(false); inputRef.current?.focus() }}
          >✕</button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="search-results">
          {results.map((item, i) => (
            <div
              key={i}
              className="search-result-item"
              onMouseDown={e => { e.preventDefault(); handleSelect(item) }}
            >
              {item._type === 'pipeline'
                ? <span className="result-dot" style={{ background: item.color }} />
                : <span className="result-icon">{TYPE_ICON[item._type]}</span>
              }
              <span className="result-name">
                {item._type === 'coordinate'
                  ? `${item.lat.toFixed(6)}, ${item.lng.toFixed(6)}`
                  : item._type === 'place'
                    ? item.name.split(',').slice(0, 2).join(',').trim()
                    : item.name}
              </span>
              <span className="result-tag">
                {item._type === 'pipeline'
                  ? (item.category || 'Pipeline')
                  : item._type === 'station'
                    ? (item.type || 'Station')
                    : TYPE_LABEL[item._type]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
