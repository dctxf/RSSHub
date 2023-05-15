const got = require('@/utils/got');
const cheerio = require('cheerio');
const { parseDate } = require('@/utils/parse-date');
const timezone = require('@/utils/timezone');
const baseUrl = 'https://zrzyhghj.zhengzhou.gov.cn';

const categoryMap = {
    tdgyjh: '土地供应计划',
    yssfa: '一书四方案',
    zytdfa: '征收土地通告',
    zdbcfa: '征地补偿安置方案公告',
    csgh: '城市规划',
    hbgd: '划拨供地结果',
    xztd: '闲置土地情况',
    xycrjg: '土地协议出让结果',
    xycrgg: '土地协议出让公告',
    tdcr: '土地招标拍卖挂牌出让结果',
    jzdj: '基准地价',
    bddj: '标定地价',
    zzydzzgk: '住宅用地信息公开',
};

module.exports = async (ctx) => {
    const category = ctx.params.category || 'tdgyjh';
    const categoryTitle = categoryMap[category] || '土地供应计划';
    const link = `${baseUrl}/${category}/index.jhtml`;
    const listData = await got(link);
    const $ = cheerio.load(listData.data);

    const list = $('.news-list a')
        .toArray()
        .map((elem) => {
            elem = $(elem);
            return {
                title: elem.find('span').text(),
                link: elem.attr('href'),
                pubDate: timezone(parseDate(elem.find('em').text()), 8),
            };
        });

    const items = await Promise.all(
        list.map((item) =>
            ctx.cache.tryGet(item.link, async () => {
                const contentData = await got(item.link);
                const $ = cheerio.load(contentData.data);
                item.description = $('.sub-content').html();
                return item;
            })
        )
    );

    ctx.state.data = {
        title: `${categoryTitle} - 郑州市自然资源和规划局`,
        link,
        item: items,
    };
};
