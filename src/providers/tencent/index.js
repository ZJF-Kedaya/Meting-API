import { get_playlist } from "./playlist.js";
import { get_song_url, get_song_info, get_pic } from "./song.js";
import { get_lyric } from "./lyric.js"

const support_type = ['url', 'pic', 'lrc', 'song', 'playlist']
// 假Cookie示例（实际使用时替换为你的真实会员Cookie）
const DEFAULT_COOKIE = 'ptcz=300a9eb8a419c18cbfd4e1ff750ff6192c692d43270305c071bbeb7fbf480c98; qq_domain_video_guid_verify=5ef7f930c14d970b; _qimei_uuid42=1951215362b1006092ec0c0271e78599b838c64929; pgv_pvid=3380147430; eas_sid=01m7E4M9g398c8A6S7Q0B8K7c5; _qimei_fingerprint=2e9a978ae3cf9e3dbf0686bfc9218104; pac_uid=0_cxGCB9TafnGWA; _qimei_i_3=23dd45d6975253dec3c4fe325ad726e6febbf0a7135b0b81bcdc7c5a24c77665303562943c89e283889d; RK=wKOJDLD7YS; yyb_muid=2D997222F85D62BA0CB36693F97363B1; fqm_pvqid=216b1cba-be7f-4cd9-b7a3-3408ab12d0f3; ts_uid=7598539200; ts_refer=cn.bing.com/; fqm_sessionid=9816b290-1465-4cbc-ae5d-a2950df06c0c; pgv_info=ssid=s2253547604; _qpsvr_localtk=0.7607145448843016; login_type=1; psrf_access_token_expiresAt=1766819457; tmeLoginType=2; psrf_qqrefresh_token=39D46B63DCD47DC92638ECF408B9E9D3; psrf_qqopenid=5C1EC3874B231BCEDEED176C5A743A1F; qqmusic_key=Q_H_L_63k3N6o6RX3oxZq9eI1w4ApQtTq38WHBPQ7FWfeXiFspEyfqWqDDUBGtOafIIdABElDzI79t0yIGpJJcQT8TjAao3; wxunionid=; wxrefresh_token=; wxopenid=; euin=oiC5NKnloKSl; psrf_musickey_createtime=1761635457; qm_keyst=Q_H_L_63k3N6o6RX3oxZq9eI1w4ApQtTq38WHBPQ7FWfeXiFspEyfqWqDDUBGtOafIIdABElDzI79t0yIGpJJcQT8TjAao3; music_ignore_pskey=202306271436Hn@vBj; uin=361907177; psrf_qqunionid=F08F9C0E67A44B6961B8BDFD75577892; psrf_qqaccess_token=5947CDA343D783874C167ABEF5726790; ts_last=y.qq.com/n/ryqq/songDetail/003TX94D2atlxl';

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
