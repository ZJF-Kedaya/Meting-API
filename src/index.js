import { serve } from '@hono/node-server'
import { createServer } from 'node:https'
import { readFileSync } from 'node:fs'
import { logger } from './middleware/logger.js'
import app from './app.js'
import config from './config.js'

serve({
  fetch: app.fetch,
  port: config.http.port
})

logger.info({ port: config.http.port }, 'HTTP server started')

if (config.https.enabled) {
  if (!config.https.keyPath || !config.https.certPath) {
    logger.error('HTTPS_ENABLED is true but SSL_KEY_PATH or SSL_CERT_PATH is not configured')
    process.exit(1)
  }

  let key
  let cert

  try {
    key = readFileSync(config.https.keyPath)
    cert = readFileSync(config.https.certPath)
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to read SSL certificate files')
    process.exit(1)
  }

  serve({
    fetch: app.fetch,
    port: config.https.port,
    createServer,
    serverOptions: { key, cert }
  })

  logger.info({ port: config.https.port }, 'HTTPS server started')
} else {
  logger.info('HTTPS server is disabled')
}
