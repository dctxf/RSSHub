const got = require('@/utils/got');
const cheerio = require('cheerio');
const path = require('path');

const DOMAIN_URL = 'http://www.gov.cn';
const BASE_DIR = '/zhengce/wenjian/zhongyang.htm';

const isHttp = (url) => {
    const reg = /^https?:\/\//;
    return reg.test(url);
};

module.exports = async (ctx) => {

    const link = `${DOMAIN_URL}${BASE_DIR}`;

    // 获取响应
    const response = await got({
        method: 'get',
        url: link,
    });

    const $ = cheerio.load(response.data);


    const title = `政策文件-中共中央`;

    // 解析列表
    const item = $('.news_box .list ul > li').toArray().map((i) => {
        const $i = $(i).find('a').first();

        const title = $i.attr('title');
        const href = $i.attr('href');
        if (href) {
            const url = isHttp(href) ? href : path.resolve(String(BASE_DIR), href);
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

                    const desc = $('.pages_content').first().html();
                    item.description = desc;
                    return item;
                } catch (error) {
                    return item;
                }

            })
        )
    );

};
