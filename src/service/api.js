import Meting from '@meting/core'
import hashjs from 'hash.js'
import { HTTPException } from 'hono/http-exception'
import config from '../config.js'
import { format as lyricFormat } from '../utils/lyric.js'
import { readCookieFile, isAllowedHost } from '../utils/cookie.js'
import { LRUCache } from 'lru-cache'

const cache = new LRUCache({
  max: 1000,
  ttl: 1000 * 30
})
const METING_METHODS = {
  search: 'search',
  song: 'song',
  album: 'album',
  artist: 'artist',
  playlist: 'playlist',
  lrc: 'lyric',
  url: 'url',
  pic: 'pic'
}

// QQ 音乐搜索：@meting/core 仍用已废弃的 client_search_cp(GET)，现返回 500。
// 改用 musicu.fcg 的 DoSearchForQQMusicDesktop(POST)，返回原生 songmid，
// 后续 type=url/pic/lrc 仍走 tencent（带 VIP cookie），拿到可播放的 QQ 音乐链接。
// 注意：请求里的 uin/searchid 必须每次随机——QQ 风控按该维度限流(code 2001)，
// 固定值连发必被拉黑；随机化后稳定返回 code 0（2026-09 实测）。
const rndDigits = n => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join('')

const TENCENT_SEARCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  Referer: 'https://y.qq.com/',
  'Content-Type': 'application/json'
}

async function tencentSearch (keyword, page = 1, limit = 30) {
  const body = {
    comm: {
      g_tk: 5381,
      uin: rndDigits(10),
      format: 'json',
      inCharset: 'utf-8',
      outCharset: 'utf-8',
      notice: 0,
      platform: 'h5',
      needNewCode: 1,
      ct: 23,
      cv: 0
    },
    req_0: {
      method: 'DoSearchForQQMusicDesktop',
      module: 'music.search.SearchCgiService',
      param: {
        remoteplace: 'txt.mqq.all',
        searchid: rndDigits(18),
        search_type: 0,
        query: keyword,
        page_num: page,
        num_per_page: limit
      }
    }
  }
  // _webcgikey + 时间戳参数为 PC 客户端请求形态，风控通过率更高
  const url = `https://u.y.qq.com/cgi-bin/musicu.fcg?_webcgikey=DoSearchForQQMusicDesktop&_=${Date.now()}`
  let lastErr
  // 上游偶发限流(code 2001)/网络抖动，轻量重试 3 次
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: TENCENT_SEARCH_HEADERS,
        body: JSON.stringify(body)
      })
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`)
      }
      const j = await resp.json()
      const svc = j.req_0
      if (!svc || svc.code !== 0) {
        throw new Error(`code ${svc ? svc.code : 'unknown'}`)
      }
      const list = (svc.data && svc.data.body && svc.data.body.song && svc.data.body.song.list) || []
      return list.map(item => ({
        name: item.title || item.name,
        artist: (item.singer || []).map(s => s.name),
        // url/lyric 用 songmid；pic 走 T002R 专辑封面，需 album mid
        url_id: item.mid,
        pic_id: item.album && item.album.mid ? item.album.mid : item.mid,
        lyric_id: item.mid,
        source: 'tencent'
      }))
    } catch (e) {
      lastErr = e
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, 300 * (attempt + 1)))
      }
    }
  }
  throw lastErr
}

export default async (c) => {
  // 1. 初始化参数
  const query = c.req.query()
  const server = query.server || 'netease'
  const type = query.type || 'search'
  const id = query.id || 'hello'
  const token = query.token || query.auth || 'token'

  // 2. 校验参数
  if (!['netease', 'tencent', 'kugou', 'baidu', 'kuwo'].includes(server)) {
    throw new HTTPException(400, { message: 'server 参数不合法' })
  }
  if (!['song', 'album', 'search', 'artist', 'playlist', 'lrc', 'url', 'pic'].includes(type)) {
    throw new HTTPException(400, { message: 'type 参数不合法' })
  }

  // 3. 鉴权
  if (['lrc', 'url', 'pic'].includes(type)) {
    if (auth(server, type, id) !== token) {
      throw new HTTPException(401, { message: '鉴权失败,非法调用' })
    }
  }

  // 4. 调用 API
  const page = Number(query.page) || 1
  const limit = Number(query.limit) || 30
  // tencent 搜索单独缓存（带分页），其余按 server/type/id 缓存
  const cacheKey = type === 'search' && server === 'tencent'
    ? `${server}/${type}/${id}/${page}/${limit}`
    : `${server}/${type}/${id}`
  let data = cache.get(cacheKey)
  if (data === undefined) {
    c.header('x-cache', 'miss')
    let response
    if (type === 'search' && server === 'tencent') {
      // QQ 音乐原生搜索：返回 songmid，后续播放走 tencent(VIP) 链路
      try {
        response = await tencentSearch(id, page, limit)
      } catch (error) {
        throw new HTTPException(500, { message: `QQ音乐搜索接口调用失败: ${(error && error.message) || error}` })
      }
    } else {
      const meting = new Meting(server)
      meting.format(true)

      // 检查 referrer 并配置 cookie
      const referrer = c.req.header('referer')
      if (isAllowedHost(referrer)) {
        const cookie = await readCookieFile(server)
        if (cookie) {
          meting.cookie(cookie)
        }
      }

      const method = METING_METHODS[type]
      try {
        response = await meting[method](id)
      } catch (error) {
        throw new HTTPException(500, { message: '上游 API 调用失败' })
      }
      try {
        response = JSON.parse(response)
      } catch (error) {
        throw new HTTPException(500, { message: '上游 API 返回格式异常' })
      }
    }

    data = response
    cache.set(cacheKey, data, {
      ttl: type === 'url' ? 1000 * 60 * 10 : 1000 * 60 * 60
    })
  }

  // 5. 组装结果
  if (type === 'url') {
    let url = data.url
    // 空结果返回 404
    if (!url) {
      return c.body(null, 404)
    }
    // 链接转换
    if (server === 'netease') {
      url = url
        .replace('://m7c.', '://m7.')
        .replace('://m8c.', '://m8.')
        .replace('http://', 'https://')
      if (url.includes('vuutv=')) {
        const tempUrl = new URL(url)
        tempUrl.search = ''
        url = tempUrl.toString()
      }
    }
    if (server === 'tencent') {
      url = url
        .replace('http://', 'https://')
        .replace('://ws.stream.qqmusic.qq.com', '://dl.stream.qqmusic.qq.com')
    }
    if (server === 'baidu') {
      url = url
        .replace('http://zhangmenshiting.qianqian.com', 'https://gss3.baidu.com/y0s1hSulBw92lNKgpU_Z2jR7b2w6buu')
    }
    return c.redirect(url)
  }

  if (type === 'pic') {
    const url = data.url
    // 空结果返回 404
    if (!url) {
      return c.body(null, 404)
    }
    return c.redirect(url)
  }

  if (type === 'lrc') {
    return c.text(lyricFormat(data.lyric, data.tlyric || ''))
  }

  return c.json(data.map(x => {
    return {
      title: x.name,
      author: x.artist.join(' / '),
      url: `${config.meting.url}/api?server=${server}&type=url&id=${x.url_id}&auth=${auth(server, 'url', x.url_id)}`,
      pic: `${config.meting.url}/api?server=${server}&type=pic&id=${x.pic_id}&auth=${auth(server, 'pic', x.pic_id)}`,
      lrc: `${config.meting.url}/api?server=${server}&type=lrc&id=${x.lyric_id}&auth=${auth(server, 'lrc', x.lyric_id)}`
    }
  }))
}

const auth = (server, type, id) => {
  return hashjs.hmac(hashjs.sha1, config.meting.token).update(`${server}${type}${id}`).digest('hex')
}
