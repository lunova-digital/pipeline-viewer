import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.markercluster'

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1'

function makeStationIcon(props, metaOptions) {
  const metaType = metaOptions.station_types?.find(t => t.id === props.type)
  const metaCategory = metaOptions.station_categories?.find(c => c.id === props.category)
  const color = metaCategory ? metaCategory.color : '#888888'
  const letter = metaType && metaType.label ? metaType.label.charAt(0).toUpperCase() : 'O'
  
  return L.divIcon({
    className: '',
    html: `<div style="
      width:28px;height:28px;border-radius:50%;
      background:${color};border:2px solid rgba(255,255,255,0.8);
      display:flex;align-items:center;justify-content:center;
      font-size:11px;font-weight:700;color:#fff;
      box-shadow:0 2px 6px rgba(0,0,0,0.5);
    ">${letter}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    tooltipAnchor: [0, -14]
  })
}

export default function StationLayer({ filters, metaOptions, onSelect, showLabels }) {
  const map = useMap()
  const clusterRef = useRef(null)
  const markersRef = useRef([])
  const onSelectRef = useRef(onSelect)
  const showLabelsRef = useRef(showLabels)

  useEffect(() => { onSelectRef.current = onSelect }, [onSelect])

  // Set up cluster group once
  useEffect(() => {
    const cluster = L.markerClusterGroup({
      maxClusterRadius: 40,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false
    })
    clusterRef.current = cluster
    map.addLayer(cluster)
    return () => { map.removeLayer(cluster); clusterRef.current = null; markersRef.current = [] }
  }, [map])

  // When showLabels changes, rebind tooltips on all markers
  useEffect(() => {
    showLabelsRef.current = showLabels
    markersRef.current.forEach(({ marker, tooltipContent }) => {
      marker.unbindTooltip()
      if (showLabels) {
        marker.bindTooltip(tooltipContent, { permanent: true, direction: 'top', offset: [0, -14], className: 'station-label' })
      } else {
        marker.bindTooltip(tooltipContent, { direction: 'top', offset: [0, -14] })
      }
    })
  }, [showLabels])

  // Fetch ALL stations once on mount — no bbox restriction
  useEffect(() => {
    const fetchAndRender = async () => {
      if (!clusterRef.current) return

      try {
        const res = await fetch(`${API_BASE}/stations`)
        const data = await res.json()

        clusterRef.current.clearLayers()
        markersRef.current = []

        const allowedTypes = filters?.station_types || []
        const allowedCats  = filters?.station_categories || []
        const stationTypes = metaOptions?.station_types || []

        data.features?.forEach(feature => {
          const props = feature.properties
          if (allowedTypes.length > 0 && !allowedTypes.includes(props.type)) return
          // Only filter by category when the station has one set
          if (props.category && allowedCats.length > 0 && !allowedCats.includes(props.category)) return

          const [lng, lat] = feature.geometry.coordinates
          const marker = L.marker([lat, lng], { icon: makeStationIcon(props, metaOptions) })

          const tooltipContent = props.pipeline_name
            ? `${props.name}<br><small style="color:#8b949e">↳ ${props.pipeline_name}</small>`
            : props.name

          if (showLabelsRef.current) {
            marker.bindTooltip(tooltipContent, { permanent: true, direction: 'top', offset: [0, -14], className: 'station-label' })
          } else {
            marker.bindTooltip(tooltipContent, { direction: 'top', offset: [0, -14] })
          }

          marker.on('click', (e) => onSelectRef.current({ ...props, _type: 'station' }, e.latlng))
          clusterRef.current.addLayer(marker)
          markersRef.current.push({ marker, tooltipContent })
        })
      } catch (err) {
        console.error('[StationLayer] fetch error:', err)
      }
    }

    // Wait for cluster to be ready
    const timer = setTimeout(fetchAndRender, 0)
    return () => clearTimeout(timer)
  }, [map, filters, metaOptions]) // Re-run when filters or metaOptions change

  return null
}
