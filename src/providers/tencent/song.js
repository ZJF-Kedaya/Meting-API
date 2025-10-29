import { changeUrlQuery } from "./util.js"
import config from "../../config.js"

// 带代理和cookie的请求工具函数
const fetchWithProxy = async (url, cookie = '') => {
    // 若配置了代理，使用代理地址拼接请求URL
    const fetchUrl = config.QQ_MUSIC_PROXY ? `${config.QQ_MUSIC_PROXY}${url}` : url;
    const headers = {
        'Cookie': cookie,
        'Referer': 'https://y.qq.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36'
    };
    return fetch(fetchUrl, { headers });
}

export const get_song_url = async (id, cookie = '') => {
    id = id.split(',')
    let uin = ''
    let qqmusic_key = ''
    
    // 从cookie中提取uin和qqmusic_key（会员验证关键参数）
    if (cookie) {
        const uinMatch = cookie.match(/uin=(\d+)/);
        if (uinMatch) uin = uinMatch[1];
        const keyMatch = cookie.match(/qqmusic_key=([^;]+)/);
        if (keyMatch) qqmusic_key = keyMatch[1];
    }

    const typeObj = {
        s: 'M500',
        e: '.mp3',
    }

    const file = id.map(e => `${typeObj.s}${e}${e}${typeObj.e}`)
    const guid = (Math.random() * 10000000).toFixed(0);

    let purl = '';

    let data = {
        req_0: {
            module: 'vkey.GetVkeyServer',
            method: 'CgiGetVkey',
            param: {
                filename: file,  // 恢复filename参数（关键）
                guid: guid,
                songmid: id,
                songtype: [0],
                uin: uin,        // 使用cookie中的uin
                loginflag: cookie ? 1 : 0,  // 登录状态标记
                platform: '20',
            },
        },
        comm: {
            uin: uin,
            format: 'json',
            ct: 19,
            cv: 0,
            authst: qqmusic_key,  // 使用cookie中的验证key
        },
    }

    let params = {
        '-': 'getplaysongvkey',
        g_tk: 5381,
        loginUin: uin,  // 传递uin
        hostUin: 0,
        format: 'json',
        inCharset: 'utf8',
        outCharset: 'utf-8¬ice=0',
        platform: 'yqq.json',
        needNewCode: 0,
        data: JSON.stringify(data),
    }

    if (config.OVERSEAS || id.length > 1) {
        params.format = 'jsonp'
        const callback_function_name = 'callback'
        const callback_name = "callback"
        const parse_function = "qq_get_url_from_json"
        const url = changeUrlQuery(params, 'https://u.y.qq.com/cgi-bin/musicu.fcg')
        return "@" + parse_function + '@' + callback_name + '@' + callback_function_name + '@' + url
    }

    const url = changeUrlQuery(params, 'https://u.y.qq.com/cgi-bin/musicu.fcg')
    let result = await fetchWithProxy(url, cookie);  // 使用代理请求并传递cookie
    result = await result.json()

    if (result.req_0 && result.req_0.data && result.req_0.data.midurlinfo) {
        purl = result.req_0.data.midurlinfo[0].purl;
    }

    const domain =
        result.req_0.data.sip.find(i => !i.startsWith('http://ws')) ||
        result.req_0.data.sip[0];

    const res = `${domain}${purl}`.replace('http://', 'https://')
    return res;
}

export const get_song_info = async (id, cookie = '') => {
    const data = {
        data: JSON.stringify({
            songinfo: {
                method: 'get_song_detail_yqq',
                module: 'music.pf_song_detail_svr',
                param: {
                    song_mid: id,
                },
            },
        }),
    };

    const url = changeUrlQuery(data, 'http://u.y.qq.com/cgi-bin/musicu.fcg');
    let result = await fetchWithProxy(url, cookie);  // 使用代理请求并传递cookie
    result = await result.json()
    result = result.songinfo.data

    let song_info = {
        author: result.track_info.singer.reduce((i, v) => ((i ? i + " / " : i) + v.name), ''),
        title: result.track_info.name,
        pic: `https://y.gtimg.cn/music/photo_new/T002R300x300M000${result.track_info.album.mid}.jpg`,
        url: config.OVERSEAS ? await get_song_url(id, cookie) : id,  // 传递cookie
        lrc: id,
        songmid: id,
    }
    return [song_info]
}

export const get_pic = async (id, cookie = '') => {
    const info = await get_song_info(id, cookie)  // 传递cookie
    return info[0].pic
}
