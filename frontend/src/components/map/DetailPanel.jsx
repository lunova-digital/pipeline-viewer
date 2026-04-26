import './DetailPanel.css'

const STATUS_COLORS = {
  operational:       '#3fb950',
  planned:           '#d29922',
  under_construction:'#FF9900',
  decommissioned:    '#f85149'
}

export default function DetailPanel({ pipeline, station, onClose, onShare, onSharePoint, metaOptions }) {
  const data = pipeline || station
  if (!data) return null

  const isPipeline = !!pipeline

  const stationTypes      = metaOptions?.station_types      || []
  const statuses          = metaOptions?.statuses           || []
  const categories        = metaOptions?.categories         || []
  const stationCategories = metaOptions?.station_categories || []

  function resolveStationType(id) {
    const found = stationTypes.find(t => t.id === id)
    return found ? found.label : (id || 'Station')
  }

  function resolveStatus(id) {
    const found = statuses.find(s => s.id === id)
    return found ? found.label : (id || '')
  }

  function resolveCategory(id) {
    const found = categories.find(c => c.id === id)
    return found ? found.label : (id || '')
  }

  function handleDownload() {
    if (!isPipeline) return
    window.open(`/api/v1/pipelines/${data.id}/geojson`, '_blank')
  }

  return (
    <div className="detail-panel">
      <div className="detail-header">
        <div>
          <div className="detail-type">
            {isPipeline ? 'Pipeline' : resolveStationType(data.type)}
          </div>
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
              <span className="detail-val">{resolveCategory(data.category)}</span>
            </div>

            {data.status && (
              <div className="detail-row">
                <span className="detail-key">Status</span>
                <span className="detail-badge" style={{ color: STATUS_COLORS[data.status] || 'inherit' }}>
                  {resolveStatus(data.status)}
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
              <span className="detail-val">{resolveStationType(data.type)}</span>
            </div>

            {data.category && (
              <div className="detail-row">
                <span className="detail-key">Category</span>
                <span className="detail-val">
                  {(() => { const sc = stationCategories.find(c => c.id === data.category); return sc ? sc.label : data.category })()}
                </span>
              </div>
            )}

            {data.status && (
              <div className="detail-row">
                <span className="detail-key">Status</span>
                <span className="detail-badge" style={{ color: STATUS_COLORS[data.status] || 'inherit' }}>
                  {resolveStatus(data.status)}
                </span>
              </div>
            )}

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
        {data._clickedAt && (
          <div className="detail-coord-section">
            <div className="detail-coord-header">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              Clicked Point
            </div>
            <div className="detail-coord-row">
              <span className="detail-coord-value">
                {data._clickedAt.lat.toFixed(6)}, {data._clickedAt.lng.toFixed(6)}
              </span>
              <button className="detail-coord-share-btn" onClick={onSharePoint} title="Share this point">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                Share point
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
