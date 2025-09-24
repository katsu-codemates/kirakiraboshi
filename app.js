const express = require('express');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const path = require('path');

const app = express();

// ミドルウェアの設定
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// グローバルでキャッシュ（初回または更新時に取得）
let tableHtmlCache = "<p>まだデータが取得されていません。</p>";

async function fetchTableHtml() {
    let browser;
    
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage'
            ]
        });

        const page = await browser.newPage();

        // 本番では環境変数からメールアドレスとパスワードを取得する
        const email = process.env.AUTOSNS_EMAIL || "katsudonburi.2005@gmail.com";
        const password = process.env.AUTOSNS_PASS || "katsu_s2005";

        // ログインページにアクセス
        await page.goto(`https://autosns.jp/login?uid=aitjvh&e=${email}`);
        
        // パスワードを入力してログイン
        await page.type('input[name="password"]', password);
        await page.click('button[name="send"]');
        await page.waitForTimeout(2000);
        
        // 予約履歴ページにアクセス
        await page.goto('https://autosns.jp/reserve-history');
        await page.waitForTimeout(2000);

        // ページのHTMLを取得
        const html = await page.content();
        
        // Cheerioでパース
        const $ = cheerio.load(html);
        const tables = $('table');

        if (tables.length > 0) {
            return $.html(tables.first());
        } else {
            return "<p>テーブルが見つかりませんでした。</p>";
        }

    } catch (error) {
        console.error('Error fetching table:', error);
        return "<p>エラーが発生しました。</p>";
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

const HTML_TEMPLATE = `
<!doctype html>
<html>
<head>
    <title>テーブルビューア</title>
    <meta charset="UTF-8">
</head>
<body>
    <h1>現在のテーブル</h1>
    <form method="post">
        <button type="submit">テーブルを更新</button>
    </form>
    <div style="margin-top: 20px;">
        {{TABLE_HTML}}
    </div>
</body>
</html>
`;

// ルートハンドラー
app.get('/', (req, res) => {
    const html = HTML_TEMPLATE.replace('{{TABLE_HTML}}', tableHtmlCache);
    res.send(html);
});

app.post('/', async (req, res) => {
    try {
        tableHtmlCache = await fetchTableHtml();
        res.redirect('/');
    } catch (error) {
        console.error('Error updating table:', error);
        res.redirect('/');
    }
});

const port = parseInt(process.env.PORT || '3000');
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
});

module.exports = app;