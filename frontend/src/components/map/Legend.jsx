import './Legend.css'

const ITEMS = [
  { label: 'Gas Pipeline', color: '#FF9900' },
  { label: 'Oil Pipeline', color: '#AA44FF' },
  { label: 'LNG Pipeline', color: '#00CCAA' },
  { label: 'Other', color: '#888888' }
]

const STATIONS = [
  { label: 'Compressor', letter: 'C', color: '#FF6600' },
  { label: 'Terminal', letter: 'T', color: '#0099FF' },
  { label: 'Valve', letter: 'V', color: '#00BB44' },
  { label: 'Metering', letter: 'M', color: '#AA00FF' }
]

export default function Legend() {
  return (
    <div className="legend">
      <p className="legend-title">Legend</p>
      <div className="legend-section">
        {ITEMS.map(item => (
          <div key={item.label} className="legend-item">
            <div className="legend-line" style={{ background: item.color }} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
      <div className="legend-divider" />
      <div className="legend-section">
        {STATIONS.map(s => (
          <div key={s.label} className="legend-item">
            <div className="legend-dot" style={{ background: s.color }}>{s.letter}</div>
            <span>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
