import './LabelToggle.css'

export default function LabelToggle({ showLabels, onChange }) {
  return (
    <button
      id="label-toggle-btn"
      className={`label-toggle-btn ${showLabels ? 'active' : ''}`}
      onClick={() => onChange(!showLabels)}
      title={showLabels ? 'Hide location labels' : 'Show location labels'}
    >
      <span className="label-toggle-icon">🏷</span>
      <span className="label-toggle-text">{showLabels ? 'Labels ON' : 'Labels OFF'}</span>
    </button>
  )
}
