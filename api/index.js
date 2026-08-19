// Vercel Serverless Function 入口（Node.js 运行时）
// 与 Docker / 本地部署共用同一个 Hono 应用（src/app.js）
import { handle } from '@hono/node-server/vercel'
import app from '../src/app.js'

// 使用 Node.js 运行时：
// - 支持 fs（src/utils/cookie.js 的 cookie 文件读取 / 监听）
// - 支持 @meting/core 等依赖 Node 内置 API 的包
// - 最大执行时长 60s（Vercel 免费版上限）
export const config = {
  runtime: 'nodejs',
  maxDuration: 60
}

export default handle(app)
