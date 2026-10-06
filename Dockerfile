FROM node:24-alpine
WORKDIR /app
COPY . .
ENV DB_PATH=/data/recomp.db COOKIE_SECURE=1
EXPOSE 3000
CMD ["node", "--no-warnings", "server.js"]

