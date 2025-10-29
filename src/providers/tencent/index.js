import { get_playlist } from "./playlist.js";
import { get_song_url, get_song_info, get_pic } from "./song.js";
import { get_lyric } from "./lyric.js"

const support_type = ['url', 'pic', 'lrc', 'song', 'playlist']
// 假Cookie示例（实际使用时替换为你的真实会员Cookie）
const DEFAULT_COOKIE = 'uin=361907177; qqmusic_key=Q_H_L_63k3N6o6RX3oxZq9eI1w4ApQtTq38WHBPQ7FWfeXiFspEyfqWqDDUBGtOafIIdABElDzI79t0yIGpJJcQT8TjAao3; pgv_pvid=3380147430; pgv_info=ssid=s2253547604; _qpsvr_localtk=0.7607145448843016';

const handle = async (type, id, cookie = DEFAULT_COOKIE) => {
    let result;
    switch (type) {
        case 'lrc':
            result = await get_lyric(id, cookie)  // 传递cookie
            break
        case 'pic':
            result = await get_pic(id, cookie)    // 传递cookie
            break
        case 'url':
            result = await get_song_url(id, cookie)  // 传递cookie
            break
        case 'song':
            result = await get_song_info(id, cookie)  // 传递cookie
            break
        case 'playlist':
            result = await get_playlist(id, cookie)  // 传递cookie
            break
        default:
            return -1;
    }
    return result
}

export default {
    register: (ctx) => {
        ctx.register('tencent', { handle, support_type })
    }
}
