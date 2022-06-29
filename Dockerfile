from node:16

workdir /usr/src/app

copy . .

cmd [ "node", "./dist/app.js" ]