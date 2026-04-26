import './DetailPanel.css'

const STATUS_LABELS = {
  operational: { label: 'Operational', color: '#3fb950' },
  planned: { label: 'Planned', color: '#d29922' },
  under_construction: { label: 'Under Construction', color: '#FF9900' },
  decommissioned: { label: 'Decommissioned', color: '#f85149' }
}

const STATION_TYPES = {
  compressor: 'Compressor Station',
  terminal: 'Terminal',
  valve: 'Valve Station',
  metering: 'Metering Station',
  other: 'Other'
}

export default function DetailPanel({ pipeline, station, onClose, onShare }) {
  const data = pipeline || station
  if (!data) return null

  const isPipeline = !!pipeline

  function handleDownload() {
    if (!isPipeline) return
    window.open(`/api/v1/pipelines/${data.id}/geojson`, '_blank')
  }

  return (
    <div className="detail-panel">
      <div className="detail-header">
        <div>
          <div className="detail-type">{isPipeline ? 'Pipeline' : STATION_TYPES[data.type] || 'Station'}</div>
          <h2 className="detail-name">{data.name}</h2>
        </div>
        <div className="detail-header-actions">
          {onShare && (
            <button className="detail-share" onClick={onShare} title="Copy share link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
            </button>
          )}
          <button className="detail-close" onClick={onClose} title="Close">✕</button>
        </div>
      </div>

      <div className="detail-body">
        {isPipeline && (
          <>
            <div className="detail-color-bar" style={{ background: data.color }} />

            <div className="detail-row">
              <span className="detail-key">Category</span>
              <span className="detail-val" style={{ textTransform: 'capitalize' }}>{data.category}</span>
            </div>

            {data.status && (
              <div className="detail-row">
                <span className="detail-key">Status</span>
                <span className="detail-badge" style={{ color: STATUS_LABELS[data.status]?.color }}>
                  {STATUS_LABELS[data.status]?.label || data.status}
                </span>
              </div>
            )}

            {data.countries?.length > 0 && (
              <div className="detail-row">
                <span className="detail-key">Countries</span>
                <span className="detail-val">{data.countries.join(', ')}</span>
              </div>
            )}

            {data.length_km && (
              <div className="detail-row">
                <span className="detail-key">Length</span>
                <span className="detail-val">{Math.round(data.length_km).toLocaleString()} km</span>
              </div>
            )}

            {data.description && (
              <div className="detail-description">
                <span className="detail-key">Description</span>
                <p>{data.description}</p>
              </div>
            )}

            <button className="detail-download" onClick={handleDownload}>
              ⬇ Download GeoJSON
            </button>
          </>
        )}

        {!isPipeline && (
          <>
            <div className="detail-row">
              <span className="detail-key">Type</span>
              <span className="detail-val">{STATION_TYPES[data.type] || data.type}</span>
            </div>

            {data.pipeline_name && (
              <div className="detail-row">
                <span className="detail-key">Pipeline</span>
                <span className="detail-val">
                  <span className="detail-color-dot" style={{ background: data.pipeline_color || '#888' }} />
                  {data.pipeline_name}
                </span>
              </div>
            )}

            {data.description && (
              <div className="detail-description">
                <span className="detail-key">Description</span>
                <p>{data.description}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
