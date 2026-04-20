FROM node:25-alpine3.22 as builder

WORKDIR '/app'
COPY ./package.json ./
RUN npm install
COPY . .

# The result of this command will be a folder 'build' inside the /app folder. This needs to be copied, see blow
RUN npm run build

FROM nginx
EXPOSE 3000
COPY ./nginx/default.conf etc/nginx/conf.d/default.conf
COPY --from=builder /app/build /usr/share/nginx/html