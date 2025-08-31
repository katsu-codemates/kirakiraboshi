# ベースイメージ
FROM python:3.11-slim

# 必要パッケージのインストール
RUN apt-get update && apt-get install -y \
    wget \
    unzip \
    curl \
    gnupg2 \
    apt-transport-https \
    ca-certificates \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

# Google Chrome のインストール
RUN wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - && \
    echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" \
        > /etc/apt/sources.list.d/google-chrome.list && \
    apt-get update && apt-get install -y google-chrome-stable && \
    rm -rf /var/lib/apt/lists/*

# Chrome のバージョンに合わせた ChromeDriver をインストール
RUN CHROME_VERSION=$(google-chrome --version | awk '{print $3}' | cut -d. -f1) && \
    DRIVER_VERSION=$(curl -s "https://chromedriver.storage.googleapis.com/LATEST_RELEASE_${CHROME_VERSION}") && \
    wget -O /tmp/chromedriver.zip "https://chromedriver.storage.googleapis.com/${DRIVER_VERSION}/chromedriver_linux64.zip" && \
    unzip /tmp/chromedriver.zip -d /usr/local/bin/ && \
    rm /tmp/chromedriver.zip

# Python ライブラリのインストール
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションのコピー
COPY . .

# Flask / FastAPI / Streamlit などに応じて修正
CMD ["python", "app.py"]
