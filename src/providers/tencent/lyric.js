import { changeUrlQuery } from "./util.js"
import config from "../../config.js"

// 带代理和cookie的请求工具函数
const fetchWithProxy = async (url, cookie = '') => {
    const fetchUrl = config.QQ_MUSIC_PROXY ? `${config.QQ_MUSIC_PROXY}${url}` : url;
    const headers = {
        'Cookie': cookie,
        'Referer': 'https://y.qq.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36'
    };
    return fetch(fetchUrl, { headers });
}

const get_lyric = async (songmid, cookie = '') => {
    const data = {
        songmid,
        pcachetime: new Date().getTime(),
        g_tk: 5381,
        loginUin: cookie.match(/uin=(\d+)/)?.[1] || 0,  // 从cookie获取uin
        hostUin: 0,
        inCharset: 'utf8',
        outCharset: 'utf-8',
        notice: 0,
        platform: 'yqq',
        needNewCode: 0,
        format: "json"
    }

    const url = changeUrlQuery(data, 'http://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg')
    let result = await fetchWithProxy(url, cookie);  // 使用代理请求并传递cookie
    result = await result.json()

    result.lyric = decodeURIComponent(escape(atob(result.lyric || '')));
    result.trans = decodeURIComponent(escape(atob(result.trans || '')));

    const res = { lyric: result.lyric, tlyric: result.trans }
    return res;
}

export { get_lyric }
