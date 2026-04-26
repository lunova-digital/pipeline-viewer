import { useState, useRef, useEffect } from 'react'
import { useMapEvents, Popup, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import './CoordinatePopup.css'

const PIN_ICON = L.divIcon({
  className: '',
  html: `<div class="coord-pin-icon">
    <svg width="30" height="40" viewBox="0 0 30 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <filter id="pin-shadow">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.5)"/>
      </filter>
      <path d="M15 0C6.72 0 0 6.72 0 15C0 23.5 15 40 15 40C15 40 30 23.5 30 15C30 6.72 23.28 0 15 0Z"
            fill="#FF6600" style="filter:url(#pin-shadow)"/>
      <circle cx="15" cy="15" r="7" fill="white" opacity="0.95"/>
      <circle cx="15" cy="15" r="3.5" fill="#FF6600"/>
    </svg>
  </div>`,
  iconSize: [30, 40],
  iconAnchor: [15, 40],
  popupAnchor: [0, -42]
})

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

export default function CoordinatePopup({ featureClickedRef, onToast, initialPos, pinnedPos }) {
  const [pos, setPos] = useState(initialPos ? L.latLng(initialPos.lat, initialPos.lng) : null)
  const markerRef = useRef(null)
  const map = useMap()

  // Allow external callers (e.g. SearchBar) to pin a coordinate
  useEffect(() => {
    if (pinnedPos) setPos(L.latLng(pinnedPos.lat, pinnedPos.lng))
  }, [pinnedPos])

  // Auto-open popup when marker renders (for both initial and clicked pins)
  useEffect(() => {
    if (markerRef.current && pos) {
      markerRef.current.openPopup()
    }
  }, [pos])

  useMapEvents({
    click(e) {
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
    })
  }

  function handleShareLink() {
    const zoom = Math.round(map.getZoom())
    const url = `${window.location.origin}/?lat=${lat}&lng=${lng}&zoom=${zoom}`
    copyText(url).then(() => {
      onToast?.('Location link copied')
    })
  }

  return (
    <Marker
      position={pos}
      icon={PIN_ICON}
      ref={markerRef}
      eventHandlers={{
        click(e) {
          L.DomEvent.stopPropagation(e)
        },
        popupclose() {
          setPos(null)
        }
      }}
    >
      <Popup closeButton={false} className="coord-popup-container">
        <div className="coord-popup">
          <p className="coord-label">Coordinates</p>
          <p className="coord-value">{lat}, {lng}</p>
          <div className="coord-actions">
            <button className="coord-btn" onClick={handleCopyCoords}>Copy</button>
            <button className="coord-btn coord-btn-primary" onClick={handleShareLink}>Share Link</button>
          </div>
        </div>
      </Popup>
    </Marker>
  )
}
