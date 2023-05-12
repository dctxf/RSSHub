const got = require('@/utils/got');
const cheerio = require('cheerio');
const path = require('path');

const DOMAIN_URL = 'http://www.profluming.com';

module.exports = async (ctx) => {

    const link = String(DOMAIN_URL);

    // 获取响应
    const response = await got({
        method: 'get',
        url: link,
    });

    const $ = cheerio.load(response.data);


    const title = `陆铭-上海交通大学教授`;

    // 解析列表
    const item = $('#page01-list p').toArray().map((i) => {
        const $i = $(i).find('a').first();

        const [title, pubDate] = $i.text().split('/').map((i) => i.replace(' ', '').replace(/^\|/, '').trim());
        const aid = $i.attr('aid');
        // const rel = $i.attr('rel');

        const link = `${DOMAIN_URL}/article/?aid=${aid}`;
        return ({
            title,
            link,
            pubDate
        });
    }).filter((i) => !!i);


    ctx.state.data = {
        title,
        link,
        item,
    };


};
