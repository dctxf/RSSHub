const got = require('@/utils/got');
const cheerio = require('cheerio');

const ROOT_URL = 'http://yss.mof.gov.cn';

module.exports = async (ctx) => {
    const category = ctx.params.category ?? 'sjtj';

    const link = `${ROOT_URL}/zhuantilanmu/dfzgl/${category}/index.htm`;

    // 获取响应
    const response = await got({
        method: 'get',
        url: link,
    });

    const $ = cheerio.load(response.data);


    let categoryTitle = '数据统计';

    if (category === 'sjtj') { categoryTitle = '数据统计'; }

    const title = `地方债-${categoryTitle}-中华人民共和国财政部`;


    // 解析列表
    const item = $('.listBox .liBox li').find('a').toArray().map((i) => {
        const $i = $(i);

        const title = $i.attr('title');
        const link = `${ROOT_URL}/zhuantilanmu/dfzgl/${category}/${$i.attr('href').replace('./', '/')}`;


        return ({
            title,
            link
        });
    });


    ctx.state.data = {
        title,
        link,
        item,
    };

    // 获取详情
    await Promise.all(
        ctx.state.data.item.map((item) =>
            ctx.cache.tryGet(item.link, async () => {

                const { data } = await got(item.link);
                const $ = cheerio.load(data);

                const pubDate = $('.conbottom .docreltime span').first().text().replace('发布日期:', '').trim().replace(/年|月/g, '-').replace('日', '');
                item.description = $('.my_conboxzw').first().html();
                item.pubDate = pubDate;
                return item;
            })
        )
    );

};
