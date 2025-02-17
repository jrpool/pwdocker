FROM mcr.microsoft.com/playwright:v1.50.1-noble

COPY . /app
WORKDIR /app

RUN npm install
RUN npx playwright install --with-deps

CMD ["npx", "playwright", "test"]
