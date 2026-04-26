import { useState } from 'react'
import './FilterPanel.css'

export default function FilterPanel({ filters, onChange, metaOptions }) {
  const { categories = [], statuses = [], station_types = [], station_categories = [] } = metaOptions || {}
  const [open, setOpen] = useState(() => window.innerWidth > 640)

  function toggle(key, id) {
    const current = filters[key] || []
    const next = current.includes(id) ? current.filter(v => v !== id) : [...current, id]
    onChange({ ...filters, [key]: next })
  }

  return (
    <div className="filter-panel">
      <button className="filter-toggle" onClick={() => setOpen(o => !o)}>
        <span>⚙ Filters</span>
        <span className="toggle-arrow">{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <div className="filter-body">

          <p className="filter-group-header">Pipelines</p>

          <div className="filter-section">
            <p className="filter-label">Category</p>
            {categories.map(c => (
              <label key={c.id} className="check-item">
                <input type="checkbox"
                  checked={filters.categories.includes(c.id)}
                  onChange={() => toggle('categories', c.id)}
                />
                <span className="check-dot" style={{ background: c.color }} />
                {c.label}
              </label>
            ))}
          </div>

          <div className="filter-section">
            <p className="filter-label">Status</p>
            {statuses.map(s => (
              <label key={s.id} className="check-item">
                <input type="checkbox"
                  checked={filters.statuses.includes(s.id)}
                  onChange={() => toggle('statuses', s.id)}
                />
                {s.label}
              </label>
            ))}
          </div>

          <p className="filter-group-header">Stations</p>

          <div className="filter-section">
            <p className="filter-label">Type</p>
            {station_types.map(t => (
              <label key={t.id} className="check-item">
                <input type="checkbox"
                  checked={(filters.station_types || []).includes(t.id)}
                  onChange={() => toggle('station_types', t.id)}
                />
                <span className="check-dot" style={{ background: t.color }} />
                {t.label}
              </label>
            ))}
          </div>

          <div className="filter-section">
            <p className="filter-label">Category</p>
            {station_categories.map(c => (
              <label key={c.id} className="check-item">
                <input type="checkbox"
                  checked={(filters.station_categories || []).includes(c.id)}
                  onChange={() => toggle('station_categories', c.id)}
                />
                <span className="check-dot" style={{ background: c.color }} />
                {c.label}
              </label>
            ))}
          </div>

        </div>
      )}
    </div>
  )
}
