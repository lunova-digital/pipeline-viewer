import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1'

// Hit tolerance in pixels — the invisible wider layer used for click detection
const HIT_WEIGHT = 20

export default function PipelineLayer({ filters, onSelect, showLabels }) {
  const map = useMap()
  const layerRef = useRef(null)   // visible styled layer
  const hitLayerRef = useRef(null) // invisible wide hit-area layer
  const onSelectRef = useRef(onSelect)
  const showLabelsRef = useRef(showLabels)

  useEffect(() => { onSelectRef.current = onSelect }, [onSelect])

  // When showLabels changes, rebind tooltips on visible layer without re-fetching
  useEffect(() => {
    showLabelsRef.current = showLabels
    if (!layerRef.current) return
    layerRef.current.eachLayer(layer => {
      layer.unbindTooltip()
      const name = layer.feature?.properties?.name || ''
      if (showLabels) {
        layer.bindTooltip(name, { permanent: true, direction: 'center', className: 'pipeline-label' })
      } else {
        layer.bindTooltip(name, { sticky: true, direction: 'top' })
      }
    })
  }, [showLabels])

  // Fetch ALL pipelines once on mount and when filters change — no bbox restriction
  useEffect(() => {
    const fetchAndRender = async () => {
      const params = new URLSearchParams()
      if (filters.categories.length) {
        params.set('category', filters.categories.join(','))
      }
      if (filters.statuses.length) {
        params.set('status', filters.statuses.join(','))
      }

      try {
        const res = await fetch(`${API_BASE}/pipelines?${params}`)
        const data = await res.json()

        // Remove old layers
        if (layerRef.current) { map.removeLayer(layerRef.current); layerRef.current = null }
        if (hitLayerRef.current) { map.removeLayer(hitLayerRef.current); hitLayerRef.current = null }

        if (!data.features?.length) return

        // ── Visible styled layer ─────────────────────────────────────────────
        layerRef.current = L.geoJSON(data, {
          style: feature => ({
            color: feature.properties.color || '#FF6600',
            weight: 3,
            opacity: 0.9,
            lineJoin: 'round',
            lineCap: 'round',
            interactive: false   // clicks handled by hit layer below
          }),
          onEachFeature: (feature, layer) => {
            const name = feature.properties.name
            if (showLabelsRef.current) {
              layer.bindTooltip(name, { permanent: true, direction: 'center', className: 'pipeline-label' })
            } else {
              layer.bindTooltip(name, { sticky: true, direction: 'top' })
            }
          }
        })

        // ── Invisible wide hit-area layer ────────────────────────────────────
        // Same geometry, fully transparent, wide enough to be easy to click
        hitLayerRef.current = L.geoJSON(data, {
          style: feature => ({
            color: feature.properties.color || '#FF6600',
            weight: HIT_WEIGHT,
            opacity: 0,          // invisible
            lineJoin: 'round',
            lineCap: 'round'
          }),
          onEachFeature: (feature, layer) => {
            const name = feature.properties.name

            // Tooltip bound to the hit layer for hover feedback
            layer.bindTooltip(name, { sticky: true, direction: 'top' })

            layer.on('click', (e) => onSelectRef.current(feature.properties, e.latlng))

            // On hover: highlight the *visible* layer beneath
            layer.on('mouseover', () => {
              layerRef.current?.eachLayer(vl => {
                if (vl.feature?.properties?.id === feature.properties.id) {
                  vl.setStyle({ weight: 5, opacity: 1 })
                }
              })
            })
            layer.on('mouseout', () => {
              layerRef.current?.eachLayer(vl => {
                if (vl.feature?.properties?.id === feature.properties.id) {
                  vl.setStyle({ weight: 3, opacity: 0.9 })
                }
              })
            })
          }
        })

        // Add visible layer first, then hit layer on top
        map.addLayer(layerRef.current)
        map.addLayer(hitLayerRef.current)
      } catch (err) {
        console.error('[PipelineLayer] fetch error:', err)
      }
    }

    fetchAndRender()

    return () => {
      if (layerRef.current) { map.removeLayer(layerRef.current); layerRef.current = null }
      if (hitLayerRef.current) { map.removeLayer(hitLayerRef.current); hitLayerRef.current = null }
    }
  }, [map, filters]) // eslint-disable-line

  return null
}
