import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { requestLogger } from './middleware/logger.js'
import errors from './middleware/errors.js'
import apiService from './service/api.js'
import demoService from './service/demo.js'
import config from './config.js'

// 应用实例：只组装路由与中间件，不启动服务。
// - 本地 / Docker 由 src/index.js 调用 serve() 启动
// - Vercel 由 api/index.js 通过 @hono/node-server/vercel 适配
// strict: false —— 让 /api 与 /api/（尾斜杠）等价，兼容 Vercel 上访问 /api/?xxx 的形式
const app = new Hono({ strict: false })
  .use(requestLogger)
  .use(cors())
  .use(errors)

app.get(`${config.http.prefix}/api`, apiService)
app.get(`${config.http.prefix}/demo`, demoService)

// Vercel 兼容：Serverless 函数挂在 /api 下，/api/demo 供 vercel.json 的 rewrite 使用，
// 使根路径 /demo 在 Vercel 上同样可用
app.get('/api/demo', demoService)

export default app
