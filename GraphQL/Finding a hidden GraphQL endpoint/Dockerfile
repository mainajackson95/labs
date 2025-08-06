FROM node:18-alpine
WORKDIR /app
RUN echo '{\
    "name": "graphql-lab",\
    "version": "1.0.0",\
    "dependencies": {\
    "express": "^4.18.2",\
    "express-graphql": "^0.12.0",\
    "graphql": "15.8.0"\
    }\
    }' > package.json
RUN npm install --legacy-peer-deps
COPY server.js .
EXPOSE 3000
CMD ["node", "server.js"]