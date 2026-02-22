FROM node:18-slim

# Install dependencies required for Puppeteer
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    procps \
    libxss1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libnss3 \
    libx11-xcb1 \
    libxtst6 \
    libgbm1 \
    lsb-release \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000
CMD ["npm", "start"]