import config from "../../config.js"
import { get_song_url } from "./song.js"
import { changeUrlQuery } from "./util.js"

// 带代理和cookie的请求工具函数
const fetchWithProxy = async (url, cookie = '') => {
    const fetchUrl = config.QQ_MUSIC_PROXY ? `${config.QQ_MUSIC_PROXY}${url}` : url;
    const headers = {
        'Cookie': cookie,
        'Referer': 'https://y.qq.com/n/yqq/playlist',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36'
    };
    return fetch(fetchUrl, { headers });
}

const get_playlist = async (id, cookie = '') => {
    const data = {
        type: 1,
        utf8: 1,
        disstid: id,
        loginUin: cookie.match(/uin=(\d+)/)?.[1] || 0,  // 从cookie获取uin
        format: 'json'
    }

    const url = changeUrlQuery(data, 'http://c.y.qq.com/qzone/fcg-bin/fcg_ucc_getcdinfo_byids_cp.fcg')
    let result = await fetchWithProxy(url, cookie);  // 使用代理请求并传递cookie
    result = await result.json()
    result = result.cdlist[0].songlist

    let jsonp
    if (config.OVERSEAS) {
        const ids = result.map(song => song.songmid)
        jsonp = await get_song_url(ids.join(','), cookie)  // 传递cookie
    }
    const res = await Promise.all(result.map(async song => {
        let song_info = {
            author: song.singer.reduce((i, v) => ((i ? i + " / " : i) + v.name), ''),
            title: song.songname,
            pic: `https://y.gtimg.cn/music/photo_new/T002R300x300M000${song.albummid}.jpg`,
            url: config.OVERSEAS ? '' : song.songmid,
            lrc: song.songmid,
            songmid: song.songmid,
        }
        return song_info
    }));

    if (config.OVERSEAS) res[0].url = jsonp
    return res;
}

export { get_playlist }
