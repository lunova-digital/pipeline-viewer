import './BaseLayerSwitcher.css'

const LAYERS = [
  { id: 'dark', label: 'Dark' },
  { id: 'satellite', label: 'Satellite' },
  { id: 'osm', label: 'Street' }
]

export default function BaseLayerSwitcher({ active, onChange }) {
  return (
    <div className="layer-switcher">
      {LAYERS.map(l => (
        <button
          key={l.id}
          className={`layer-btn ${active === l.id ? 'active' : ''}`}
          onClick={() => onChange(l.id)}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}
