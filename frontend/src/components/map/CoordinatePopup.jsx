import { useState } from 'react'
import { useMapEvents, Popup, useMap } from 'react-leaflet'
import './CoordinatePopup.css'

function copyText(text) {
  if (navigator.clipboard) return navigator.clipboard.writeText(text)
  const el = document.createElement('textarea')
  el.value = text
  document.body.appendChild(el)
  el.select()
  document.execCommand('copy')
  document.body.removeChild(el)
  return Promise.resolve()
}

export default function CoordinatePopup({ featureClickedRef, onToast }) {
  const [pos, setPos] = useState(null)
  const map = useMap()

  useMapEvents({
    click(e) {
      // Ignore clicks that originated from a pipeline/station feature
      if (featureClickedRef?.current) return
      setPos(e.latlng)
    }
  })

  if (!pos) return null

  const lat = pos.lat.toFixed(6)
  const lng = pos.lng.toFixed(6)

  function handleCopyCoords() {
    copyText(`${lat}, ${lng}`).then(() => {
      onToast?.('Coordinates copied')
      setPos(null)
    })
  }

  function handleShareLink() {
    const zoom = Math.round(map.getZoom())
    const url = `${window.location.origin}/?lat=${lat}&lng=${lng}&zoom=${zoom}`
    copyText(url).then(() => {
      onToast?.('Location link copied')
      setPos(null)
    })
  }

  return (
    <Popup
      position={pos}
      onClose={() => setPos(null)}
      closeButton={false}
      className="coord-popup-container"
    >
      <div className="coord-popup">
        <p className="coord-label">Coordinates</p>
        <p className="coord-value">{lat}, {lng}</p>
        <div className="coord-actions">
          <button className="coord-btn" onClick={handleCopyCoords}>Copy</button>
          <button className="coord-btn coord-btn-primary" onClick={handleShareLink}>Share Link</button>
        </div>
      </div>
    </Popup>
  )
}
