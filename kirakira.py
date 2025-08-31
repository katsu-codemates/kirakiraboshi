from flask import Flask, render_template_string, redirect, url_for, request
from selenium import webdriver
from selenium.webdriver.common.by import By
from bs4 import BeautifulSoup
import time
import os

app = Flask(__name__)

# グローバルでキャッシュ（初回または更新時に取得）
table_html_cache = "<p>まだデータが取得されていません。</p>"

def fetch_table_html():
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')  
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')

    driver = webdriver.Chrome(options=options)

    try:
        # 本番では環境変数からメールアドレスとパスワードを取得する
        email = os.getenv("AUTOSNS_EMAIL", "test@example.com")
        password = os.getenv("AUTOSNS_PASS", "password123")

        driver.get('https://autosns.jp/login?uid=aitjvh&e=' + email)
        driver.find_element(By.NAME,"password").send_keys(password)
        driver.find_element(By.NAME,"send").click()
        time.sleep(2)
        
        driver.get('https://autosns.jp/reserve-history')
        time.sleep(2)

        html = driver.page_source
        soup = BeautifulSoup(html, 'html.parser')
        tables = soup.select('table')

        if tables:
            return str(tables[0])
        else:
            return "<p>テーブルが見つかりませんでした。</p>"
    finally:
        driver.quit()


HTML_TEMPLATE = """
<!doctype html>
<html>
<head>
    <title>テーブルビューア</title>
</head>
<body>
    <h1>現在のテーブル</h1>
    <form method="post">
        <button type="submit">テーブルを更新</button>
    </form>
    <div style="margin-top: 20px;">
        {{ table_html|safe }}
    </div>
</body>
</html>
"""

@app.route('/', methods=['GET', 'POST'])
def index():
    global table_html_cache
    if request.method == 'POST':
        table_html_cache = fetch_table_html()
        return redirect(url_for('index'))
    return render_template_string(HTML_TEMPLATE, table_html=table_html_cache)


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
