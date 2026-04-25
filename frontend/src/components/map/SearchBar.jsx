import { useState, useRef, useEffect, useCallback } from 'react'
import './SearchBar.css'

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1'

export default function SearchBar({ map }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const debounceRef = useRef(null)
  const inputRef = useRef(null)

  const search = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); setOpen(false); return }
    try {
      const res = await fetch(`${API_BASE}/pipelines/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data)
      setOpen(data.length > 0)
    } catch {
      setResults([])
    }
  }, [])

  function handleInput(e) {
    const q = e.target.value
    setQuery(q)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(q), 300)
  }

  function handleSelect(item) {
    setQuery(item.name)
    setOpen(false)
    if (!map || !item.envelope) return
    const env = item.envelope
    if (env.type === 'Polygon') {
      const coords = env.coordinates[0]
      const lngs = coords.map(c => c[0])
      const lats = coords.map(c => c[1])
      map.fitBounds([
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)]
      ], { padding: [60, 60] })
    }
  }

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur() } }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="search-bar">
      <div className="search-input-wrap">
        <span className="search-icon">🔍</span>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search pipelines..."
          value={query}
          onChange={handleInput}
          onFocus={() => results.length && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
        {query && (
          <button className="search-clear" onClick={() => { setQuery(''); setResults([]); setOpen(false) }}>✕</button>
        )}
      </div>

      {open && (
        <div className="search-results">
          {results.map(item => (
            <div key={item.id} className="search-result-item" onMouseDown={() => handleSelect(item)}>
              <span className="result-dot" style={{ background: item.color }} />
              <span className="result-name">{item.name}</span>
              <span className="result-cat">{item.category}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
