const express = require('express')
const router = express.Router()
const multer = require('multer')
const { parse } = require('csv-parse/sync')
const { pool } = require('../db')
const { parseCoordinates, buildLineStringWKT } = require('../services/coordinateParser')

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

// ─── Pipelines ─────────────────────────────────────────────────────────────

router.get('/pipelines', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, color, category, status, countries, length_km, source, created_at
       FROM pipelines ORDER BY created_at DESC`
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/pipelines', async (req, res) => {
  try {
    const { name, color, category, status, countries, description, coordinates } = req.body

    if (!name?.trim()) return res.status(400).json({ error: 'name is required' })
    if (!coordinates?.trim()) return res.status(400).json({ error: 'coordinates are required' })

    const parsed = parseCoordinates(coordinates)
    if (!parsed.valid) return res.status(400).json({ error: parsed.error })

    const wkt = buildLineStringWKT(parsed.points)

    const result = await pool.query(
      `INSERT INTO pipelines (name, color, category, status, countries, description, geometry, length_km)
       VALUES ($1, $2, $3, $4, $5, $6,
               ST_GeomFromText($7, 4326),
               ST_Length(ST_GeomFromText($7, 4326)::geography) / 1000)
       RETURNING id, name, color, category, status, countries, description, length_km, created_at`,
      [
        name.trim(),
        color || '#FF6600',
        category || 'gas',
        status || 'operational',
        countries || [],
        description || null,
        wkt
      ]
    )

    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.patch('/pipelines/:id', async (req, res) => {
  try {
    const { name, color, category, status, countries, description, coordinates } = req.body
    const sets = []
    const params = []
    let idx = 1

    if (name !== undefined) { sets.push(`name = $${idx++}`); params.push(name) }
    if (color !== undefined) { sets.push(`color = $${idx++}`); params.push(color) }
    if (category !== undefined) { sets.push(`category = $${idx++}`); params.push(category) }
    if (status !== undefined) { sets.push(`status = $${idx++}`); params.push(status) }
    if (countries !== undefined) { sets.push(`countries = $${idx++}`); params.push(countries) }
    if (description !== undefined) { sets.push(`description = $${idx++}`); params.push(description) }

    if (coordinates !== undefined) {
      const parsed = parseCoordinates(coordinates)
      if (!parsed.valid) return res.status(400).json({ error: parsed.error })
      const wkt = buildLineStringWKT(parsed.points)
      sets.push(`geometry = ST_GeomFromText($${idx}, 4326)`)
      sets.push(`length_km = ST_Length(ST_GeomFromText($${idx}, 4326)::geography) / 1000`)
      params.push(wkt)
      idx++
    }

    if (!sets.length) return res.status(400).json({ error: 'No fields to update' })

    sets.push(`updated_at = NOW()`)
    params.push(req.params.id)

    const result = await pool.query(
      `UPDATE pipelines SET ${sets.join(', ')} WHERE id = $${idx} RETURNING id, name, color, category, status, countries, length_km, updated_at`,
      params
    )

    if (!result.rows.length) return res.status(404).json({ error: 'Not found' })
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/pipelines/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM pipelines WHERE id = $1 RETURNING id', [req.params.id])
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' })
    res.json({ deleted: result.rows[0].id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /admin/pipelines/import-csv
// CSV columns: name,color,category,status,countries,description,coordinates
// coordinates: pipe-separated "lng,lat|lng,lat|..." OR newline-separated (in a quoted cell)
router.post('/pipelines/import-csv', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

    const records = parse(req.file.buffer.toString('utf8'), {
      columns: true,
      skip_empty_lines: true,
      trim: true
    })

    const results = []
    for (const row of records) {
      try {
        const { name, color, category, status, countries, description, coordinates } = row
        if (!name || !coordinates) {
          results.push({ name: name || '?', success: false, error: 'Missing name or coordinates' })
          continue
        }

        const parsed = parseCoordinates(coordinates)
        if (!parsed.valid) {
          results.push({ name, success: false, error: parsed.error })
          continue
        }

        const wkt = buildLineStringWKT(parsed.points)
        const countriesArr = countries ? countries.split('|').map(c => c.trim()).filter(Boolean) : []

        await pool.query(
          `INSERT INTO pipelines (name, color, category, status, countries, description, geometry, length_km)
           VALUES ($1, $2, $3, $4, $5, $6,
                   ST_GeomFromText($7, 4326),
                   ST_Length(ST_GeomFromText($7, 4326)::geography) / 1000)`,
          [
            name.trim(),
            color || '#FF6600',
            category || 'gas',
            status || 'operational',
            countriesArr,
            description || null,
            wkt
          ]
        )
        results.push({ name, success: true })
      } catch (rowErr) {
        results.push({ name: row.name || '?', success: false, error: rowErr.message })
      }
    }

    const succeeded = results.filter(r => r.success).length
    res.json({ total: records.length, succeeded, failed: records.length - succeeded, results })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ─── Stations ─────────────────────────────────────────────────────────────

router.get('/stations', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.id, s.name, s.type, s.category, s.status, s.pipeline_id, s.description, s.source, s.created_at,
              p.name as pipeline_name,
              ST_X(s.geometry) as lng, ST_Y(s.geometry) as lat
       FROM stations s
       LEFT JOIN pipelines p ON s.pipeline_id = p.id
       ORDER BY s.created_at DESC`
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/stations', async (req, res) => {
  try {
    const { name, type, category, status, pipeline_id, description, lat, lng } = req.body

    if (!name?.trim()) return res.status(400).json({ error: 'name is required' })
    const latitude = parseFloat(lat)
    const longitude = parseFloat(lng)
    if (isNaN(latitude) || isNaN(longitude)) return res.status(400).json({ error: 'Valid lat and lng are required' })
    if (latitude < -90 || latitude > 90) return res.status(400).json({ error: 'Latitude must be between -90 and 90' })
    if (longitude < -180 || longitude > 180) return res.status(400).json({ error: 'Longitude must be between -180 and 180' })

    const result = await pool.query(
      `INSERT INTO stations (name, type, category, status, pipeline_id, description, geometry)
       VALUES ($1, $2, $3, $4, $5, $6, ST_SetSRID(ST_MakePoint($7, $8), 4326))
       RETURNING id, name, type, category, status, pipeline_id, description, created_at,
                 ST_X(geometry) as lng, ST_Y(geometry) as lat`,
      [name.trim(), type || 'compressor', category || null, status || null, pipeline_id || null, description || null, longitude, latitude]
    )

    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.patch('/stations/:id', async (req, res) => {
  try {
    const { name, type, category, status, pipeline_id, description, lat, lng } = req.body
    const sets = []
    const params = []
    let idx = 1

    if (name !== undefined) { sets.push(`name = $${idx++}`); params.push(name) }
    if (type !== undefined) { sets.push(`type = $${idx++}`); params.push(type) }
    if (category !== undefined) { sets.push(`category = $${idx++}`); params.push(category || null) }
    if (status !== undefined) { sets.push(`status = $${idx++}`); params.push(status || null) }
    if (pipeline_id !== undefined) { sets.push(`pipeline_id = $${idx++}`); params.push(pipeline_id || null) }
    if (description !== undefined) { sets.push(`description = $${idx++}`); params.push(description) }

    if (lat !== undefined || lng !== undefined) {
      const currentRes = await pool.query('SELECT ST_X(geometry) as lng, ST_Y(geometry) as lat FROM stations WHERE id = $1', [req.params.id])
      if (!currentRes.rows.length) return res.status(404).json({ error: 'Not found' })
      const curLng = lng !== undefined ? parseFloat(lng) : currentRes.rows[0].lng
      const curLat = lat !== undefined ? parseFloat(lat) : currentRes.rows[0].lat
      sets.push(`geometry = ST_SetSRID(ST_MakePoint($${idx}, $${idx + 1}), 4326)`)
      params.push(curLng, curLat)
      idx += 2
    }

    if (!sets.length) return res.status(400).json({ error: 'No fields to update' })

    sets.push(`updated_at = NOW()`)
    params.push(req.params.id)

    const result = await pool.query(
      `UPDATE stations SET ${sets.join(', ')} WHERE id = $${idx} RETURNING id, name, type, category, status, pipeline_id, description, updated_at, ST_X(geometry) as lng, ST_Y(geometry) as lat`,
      params
    )

    if (!result.rows.length) return res.status(404).json({ error: 'Not found' })
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/stations/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM stations WHERE id = $1 RETURNING id', [req.params.id])
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' })
    res.json({ deleted: result.rows[0].id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
