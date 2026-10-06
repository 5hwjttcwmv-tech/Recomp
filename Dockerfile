FROM node:24-alpine
WORKDIR /app
COPY package.json server.js index.html style.css app.js ./
ENV PORT=3000 DB_PATH=/data/recomp.db COOKIE_SECURE=1
EXPOSE 3000
CMD ["node", "--no-warnings", "server.js"]
