import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { requestLogger } from './middleware/logger.js'
import errors from './middleware/errors.js'
import apiService from './service/api.js'
import demoService from './service/demo.js'
import config from './config.js'

// 构建 Hono 应用实例（不含服务器启动逻辑）
// 该模块被 src/index.js（Docker / 本地 Node 服务）与 api/index.js（Vercel 函数）共用
const app = new Hono()
  .use(requestLogger)
  .use(cors())
  .use(errors)

app.get(`${config.http.prefix}/api`, apiService)
app.get(`${config.http.prefix}/demo`, demoService)

// Vercel 兼容：将 demo 页同时挂在 /api/demo 下，
// 配合 vercel.json 的 rewrite（/demo -> /api/demo）使 Vercel 上也能访问演示页
app.get('/api/demo', demoService)

export default app
