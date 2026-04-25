import { useState } from 'react'
import './FilterPanel.css'

export default function FilterPanel({ filters, onChange, metaOptions }) {
  const { categories = [], statuses = [] } = metaOptions || {}
  const [open, setOpen] = useState(true)

  function toggleCategory(id) {
    const cats = filters.categories.includes(id)
      ? filters.categories.filter(c => c !== id)
      : [...filters.categories, id]
    onChange({ ...filters, categories: cats })
  }

  function toggleStatus(id) {
    const statuses = filters.statuses.includes(id)
      ? filters.statuses.filter(s => s !== id)
      : [...filters.statuses, id]
    onChange({ ...filters, statuses })
  }

  return (
    <div className="filter-panel">
      <button className="filter-toggle" onClick={() => setOpen(o => !o)}>
        <span>⚙ Filters</span>
        <span className="toggle-arrow">{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <div className="filter-body">
          <div className="filter-section">
            <p className="filter-label">Category</p>
            {categories.map(c => (
              <label key={c.id} className="check-item">
                <input
                  type="checkbox"
                  checked={filters.categories.includes(c.id)}
                  onChange={() => toggleCategory(c.id)}
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
                <input
                  type="checkbox"
                  checked={filters.statuses.includes(s.id)}
                  onChange={() => toggleStatus(s.id)}
                />
                {s.label}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
