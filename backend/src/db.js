require('dotenv').config()
const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function runMigrations() {
  const migrationsDir = path.join(__dirname, 'migrations')
  const files = fs.readdirSync(migrationsDir).sort()
  
  for (const file of files) {
    if (file.endsWith('.sql')) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
      await pool.query(sql)
      console.log(`[db] Migration applied: ${file}`)
    }
  }
}

async function seedDemo() {
  const res = await pool.query('SELECT COUNT(*) FROM pipelines')
  if (parseInt(res.rows[0].count) > 0) return

  const pipelines = [
    {
      name: 'Nord Stream',
      color: '#0099FF',
      category: 'gas',
      status: 'operational',
      countries: ['RU', 'FI', 'SE', 'DK', 'DE'],
      description: 'Offshore natural gas pipeline from Russia to Germany via the Baltic Sea',
      wkt: 'LINESTRING(32.5 59.5, 28.0 59.0, 22.0 58.5, 16.0 57.5, 13.5 54.5)'
    },
    {
      name: 'Trans-Anatolian Pipeline (TANAP)',
      color: '#FF9900',
      category: 'gas',
      status: 'operational',
      countries: ['AZ', 'TR'],
      description: 'Natural gas pipeline from Azerbaijan through Turkey to Europe',
      wkt: 'LINESTRING(49.5 40.0, 45.0 40.5, 41.0 40.0, 37.0 39.5, 33.0 38.5, 28.5 38.0, 26.5 41.5)'
    },
    {
      name: 'West-East Gas Pipeline (China)',
      color: '#FF3300',
      category: 'gas',
      status: 'operational',
      countries: ['CN'],
      description: 'Largest natural gas pipeline in China, from Xinjiang to Shanghai',
      wkt: 'LINESTRING(79.5 39.5, 85.0 42.0, 91.0 43.5, 96.0 40.5, 100.0 38.0, 104.0 35.5, 108.0 34.0, 112.0 32.5, 116.5 31.5, 121.5 31.2)'
    },
    {
      name: 'Trans-Alaska Pipeline',
      color: '#AA44FF',
      category: 'oil',
      status: 'operational',
      countries: ['US'],
      description: 'Oil pipeline running from Prudhoe Bay to Valdez, Alaska',
      wkt: 'LINESTRING(-148.5 70.3, -149.0 68.5, -150.0 66.5, -149.5 64.5, -147.7 64.8, -146.5 62.0, -146.3 61.1)'
    },
    {
      name: 'Yamal-Europe Pipeline',
      color: '#00CCAA',
      category: 'gas',
      status: 'operational',
      countries: ['RU', 'BY', 'PL', 'DE'],
      description: 'Gas pipeline from Siberia to Western Europe via Belarus and Poland',
      wkt: 'LINESTRING(68.0 68.0, 60.0 65.0, 50.0 57.0, 40.0 53.5, 32.0 52.5, 24.0 52.0, 18.5 52.0, 13.5 52.5)'
    }
  ]

  for (const p of pipelines) {
    await pool.query(
      `INSERT INTO pipelines (name, color, category, status, countries, description, geometry, length_km)
       VALUES ($1, $2, $3, $4, $5, $6,
               ST_GeomFromText($7, 4326),
               ST_Length(ST_GeomFromText($7, 4326)::geography) / 1000)`,
      [p.name, p.color, p.category, p.status, p.countries, p.description, p.wkt]
    )
  }

  // Get the Nord Stream id for linking stations
  const ns = await pool.query("SELECT id FROM pipelines WHERE name = 'Nord Stream' LIMIT 1")
  const nsId = ns.rows[0]?.id || null

  const stations = [
    {
      name: 'Portovaya Compressor Station',
      type: 'compressor',
      pipeline_id: nsId,
      description: 'Main compression facility for Nord Stream at the Russian end',
      point: 'POINT(32.5 59.5)'
    },
    {
      name: 'Lubmin Receiving Terminal',
      type: 'terminal',
      pipeline_id: nsId,
      description: 'Onshore receiving terminal in Germany for Nord Stream',
      point: 'POINT(13.8 54.1)'
    },
    {
      name: 'Baku Compressor Station',
      type: 'compressor',
      pipeline_id: null,
      description: 'Main pumping station for TANAP at the Azerbaijan origin',
      point: 'POINT(49.85 40.4)'
    },
    {
      name: 'Eskisehir Metering Station',
      type: 'metering',
      pipeline_id: null,
      description: 'Gas metering point along the TANAP route in Turkey',
      point: 'POINT(30.5 39.8)'
    },
    {
      name: 'Valdez Marine Terminal',
      type: 'terminal',
      pipeline_id: null,
      description: 'End point of the Trans-Alaska Pipeline — tanker loading terminal',
      point: 'POINT(-146.3 61.1)'
    }
  ]

  for (const s of stations) {
    await pool.query(
      `INSERT INTO stations (name, type, pipeline_id, description, geometry)
       VALUES ($1, $2, $3, $4, ST_GeomFromText($5, 4326))`,
      [s.name, s.type, s.pipeline_id, s.description, s.point]
    )
  }

  console.log('[db] Demo data seeded')
}

module.exports = { pool, runMigrations, seedDemo }
