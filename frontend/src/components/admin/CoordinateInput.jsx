import { useState, useRef } from 'react'
import './CoordinateInput.css'

export default function CoordinateInput({ value, onChange }) {
  const [tab, setTab] = useState('paste')
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef(null)

  function handleFile(file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target.result
      // CSV with lng,lat columns OR just raw coordinate text
      // Try to detect if it's a proper CSV with headers
      const lines = text.trim().split('\n')
      const firstLine = lines[0].toLowerCase()
      if (firstLine.includes('lng') && firstLine.includes('lat')) {
        // CSV with header row: extract lng,lat columns
        const headers = firstLine.split(',').map(h => h.trim())
        const lngIdx = headers.findIndex(h => h.includes('lng') || h.includes('lon'))
        const latIdx = headers.findIndex(h => h.includes('lat'))
        if (lngIdx >= 0 && latIdx >= 0) {
          const pairs = lines.slice(1).filter(l => l.trim()).map(line => {
            const cols = line.split(',')
            return `${cols[lngIdx]?.trim()},${cols[latIdx]?.trim()}`
          })
          onChange(pairs.join('\n'))
          setTab('paste')
          return
        }
      }
      // Otherwise treat the file content as raw coordinate text
      onChange(text.trim())
      setTab('paste')
    }
    reader.readAsText(file)
  }

  return (
    <div className="coord-input">
      <div className="coord-tabs">
        <button className={`coord-tab ${tab === 'paste' ? 'active' : ''}`} type="button" onClick={() => setTab('paste')}>
          Paste Coordinates
        </button>
        <button className={`coord-tab ${tab === 'upload' ? 'active' : ''}`} type="button" onClick={() => setTab('upload')}>
          Upload CSV
        </button>
      </div>

      {tab === 'paste' && (
        <div>
          <textarea
            className="coord-textarea"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={`Enter coordinates (one pair per line):\n13.4050,52.5200\n14.0000,53.0000\n14.5000,53.5000\n\nOr comma-separated: 13.4050,52.5200,14.0000,53.0000\n\nFormat: lng,lat  (longitude first)`}
            rows={8}
            spellCheck={false}
          />
          <p className="coord-hint">
            Format: <code>lng,lat</code> per line • Longitude first • Auto-detects if swapped
          </p>
        </div>
      )}

      {tab === 'upload' && (
        <div
          className={`coord-dropzone ${dragOver ? 'drag-over' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt"
            style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files[0])}
          />
          <div className="dropzone-icon">📄</div>
          <p>Drag & drop a CSV or TXT file here</p>
          <p className="coord-hint">or click to browse</p>
          <p className="coord-hint">Columns: <code>lng,lat</code> per row — or any CSV with <code>lng</code>/<code>lat</code> headers</p>
        </div>
      )}
    </div>
  )
}
