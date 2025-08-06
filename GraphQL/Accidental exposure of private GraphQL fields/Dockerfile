# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install compatible dependencies
RUN npm install \
    express@4.18.2 \
    express-graphql@0.12.0 \
    graphql@15.8.0 \
    body-parser@1.20.2 \
    cookie-parser@1.4.6 \
    express-session@1.17.3

# Copy application files
COPY . .

EXPOSE 4000
CMD ["node", "server.js"]