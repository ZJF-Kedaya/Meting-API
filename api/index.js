// Vercel Serverless Function 入口
// 使用 Node.js 运行时（cookie 读取依赖 node:fs，且 @meting/core 需要完整的 Node 能力）
// 环境变量方式配置 QQ 音乐 Cookie：METING_COOKIE_TENCENT
import { handle } from '@hono/node-server/vercel'
import app from '../src/app.js'

export const config = {
  runtime: 'nodejs',
  // 免费版最大 60s，可自行调整（上限受套餐限制）
  maxDuration: 60
}

export default handle(app)
