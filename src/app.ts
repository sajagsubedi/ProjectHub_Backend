import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http';
import cors from 'cors';
import typeDefs from './typeDefs/index';
import resolvers from './resolvers/index';
import connectDB from "./db/connectDB"
import dotenv from "dotenv"

dotenv.config({
  path:"./.env"
})
const app = express();
const PORT = process.env.PORT || 3000;
const httpServer = http.createServer(app);

const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});

// Start the server
const startServer = async () => {
  await server.start();

  app.use(
    '/graphql',
    cors(),
    express.json(),
    expressMiddleware(server, {
      context: async() => ({}),
    })
  );

  connectDB()
  .then(()=>{
    httpServer.listen({ port: PORT }, () =>
      console.log(`🚀 Server ready at http://localhost:${PORT}/`)
    );
  })
};

startServer();