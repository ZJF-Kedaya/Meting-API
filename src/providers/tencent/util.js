function getQueryFromUrl(key, search) {
    try {
        const sArr = search.split('?');
        let s = '';
        if (sArr.length > 1) {
            s = sArr[1];
        } else {
            return key ? undefined : {};
        }
        const querys = s.split('&');
        const result = {};
        querys.forEach((item) => {
            const temp = item.split('=');
            result[temp[0]] = decodeURIComponent(temp[1]);
        });
        return key ? result[key] : result;
    } catch (err) {
        return key ? '' : {};
    }
}

function changeUrlQuery(obj, baseUrl) {
    const query = getQueryFromUrl(null, baseUrl);
    let url = baseUrl.split('?')[0];

    const newQuery = { ...query, ...obj };
    let queryArr = [];
    Object.keys(newQuery).forEach((key) => {
        if (newQuery[key] !== undefined && newQuery[key] !== '') {
            queryArr.push(`${key}=${encodeURIComponent(newQuery[key])}`);
        }
    });
    return `${url}?${queryArr.join('&')}`.replace(/\?$/, '');
}

export { changeUrlQuery }
