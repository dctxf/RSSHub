const got = require('@/utils/got');
const cheerio = require('cheerio');
const path = require('path');

const DOMAIN_URL = 'https://www.ndrc.gov.cn';
const BASE_DIR = '/xxgk/zcfb';

const isHttp = (url) => {
    const reg = /^https?:\/\//;
    return reg.test(url);
};

module.exports = async (ctx) => {
    const category = ctx.params.category ?? 'fzggwl';

    const link = `${DOMAIN_URL}${BASE_DIR}/${category}`;

    // 获取响应
    const response = await got({
        method: 'get',
        url: link,
    });

    const $ = cheerio.load(response.data);

    let categoryTitle = '发展改革委令';

    if (category === 'fzggwl') { categoryTitle = '发展改革委令'; }
    if (category === 'ghxwj') { categoryTitle = '规范性文件'; }
    if (category === 'ghwb') { categoryTitle = '规划文本'; }
    if (category === 'gg') { categoryTitle = '公告'; }
    if (category === 'tz') { categoryTitle = '通知'; }
    if (category === 'pifu') { categoryTitle = '批复'; }
    if (category === 'qt') { categoryTitle = '其他'; }

    const title = `${categoryTitle}-发改委`;

    // 解析列表
    const item = $('.list .u-list > li').toArray().map((i) => {
        const $i = $(i).find('a').first();

        const title = $i.attr('title');
        const href = $i.attr('href');
        if (href) {
            const url = isHttp(href) ? href : path.resolve(`${BASE_DIR}/${category}`, href);
            const link = isHttp(href) ? url : `${DOMAIN_URL}${url}`;

            const pubDate = $(i).find('span').last().text();

            return ({
                title,
                link,
                pubDate
            });
        }
        return null;
    }).filter((i) => !!i);


    ctx.state.data = {
        title,
        link,
        item,
    };

    // 获取详情
    await Promise.all(
        ctx.state.data.item.map((item) =>
            ctx.cache.tryGet(item.link, async () => {
                try {
                    const { data } = await got(item.link);
                    const $ = cheerio.load(data);

                    const desc = $('.article_con').first().html() + $('.attachment').first().html();
                    item.description = desc;
                    return item;
                } catch (error) {
                    console.log(item.link);
                    return item;
                }

            })
        )
    );

};
