require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { runMigrations, seedDemo } = require('./db')
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
