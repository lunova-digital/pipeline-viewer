require('dotenv').config()
const fs = require('fs')
const path = require('path')
const express = require('express')
const cors = require('cors')
const { pool, runMigrations, seedDemo } = require('./db')
const adminAuth = require('./middleware/adminAuth')
const pipelinesRouter = require('./routes/pipelines')
const stationsRouter = require('./routes/stations')
const metaRouter = require('./routes/meta')
const adminRouter = require('./routes/admin')
const adminMetaRouter = require('./routes/adminMeta')

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }))
app.use(express.json({ limit: '10mb' }))

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

app.use('/api/v1/pipelines', pipelinesRouter)
app.use('/api/v1/stations', stationsRouter)
app.use('/api/v1/meta', metaRouter)
app.use('/api/v1/admin', adminAuth, adminRouter)
app.use('/api/v1/admin/meta', adminAuth, adminMetaRouter)

// Load index.html template for OG tag injection
const templatePath = path.join(__dirname, '../public/index.html')
let indexTemplate = null
try {
  indexTemplate = fs.readFileSync(templatePath, 'utf8')
} catch (e) {
  console.warn('[api] No public/index.html found — OG injection disabled (dev mode)')
}

// Simple 60s in-memory cache for site settings
let settingsCache = null
let settingsCacheAt = 0

async function getSiteSettings() {
  if (settingsCache && Date.now() - settingsCacheAt < 60000) return settingsCache
  const result = await pool.query(
    "SELECT key, value FROM site_settings WHERE key IN ('site_title', 'site_description', 'og_image_url')"
  )
  settingsCache = {}
  result.rows.forEach(r => { settingsCache[r.key] = r.value })
  settingsCacheAt = Date.now()
  return settingsCache
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Catch-all: serve index.html with OG tags injected from DB
app.get('*', async (req, res) => {
  if (!indexTemplate) return res.status(404).send('Not found')

  let html = indexTemplate
  try {
    const s = await getSiteSettings()
    const title = escapeHtml(s.site_title || 'Station Map — Global Pipeline Infrastructure')
    const desc = escapeHtml(s.site_description || 'Interactive world map of gas pipelines and infrastructure stations')
    const img = escapeHtml(s.og_image_url || '')

    html = html
      .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
      .replace(/(<meta name="description" content=")[^"]*(")/g, `$1${desc}$2`)
      .replace(/(<meta property="og:title" content=")[^"]*(")/g, `$1${title}$2`)
      .replace(/(<meta property="og:description" content=")[^"]*(")/g, `$1${desc}$2`)
      .replace(/(<meta property="og:image" content=")[^"]*(")/g, `$1${img}$2`)
      .replace(/(<meta name="twitter:title" content=")[^"]*(")/g, `$1${title}$2`)
      .replace(/(<meta name="twitter:description" content=")[^"]*(")/g, `$1${desc}$2`)
      .replace(/(<meta name="twitter:image" content=")[^"]*(")/g, `$1${img}$2`)
  } catch (err) {
    console.error('[api] OG injection failed:', err.message)
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.send(html)
})

async function start() {
  try {
    await runMigrations()
    await seedDemo()
    app.listen(PORT, () => console.log(`[api] Running on http://localhost:${PORT}`))
  } catch (err) {
    console.error('[api] Failed to start:', err.message)
    process.exit(1)
  }
}

start()
