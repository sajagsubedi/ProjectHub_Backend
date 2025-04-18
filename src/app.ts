import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import express from "express";
import http from "http";
import cors from "cors";
import typeDefs from "./typeDefs/index";
import resolvers from "./resolvers/index";
import connectDB from "./db/connectDB";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { verifyAuth } from "./middlewares/verifyAuth";
import { graphqlUploadExpress } from "graphql-upload-minimal";

dotenv.config({
  path: "./.env",
});

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const httpServer = http.createServer(app);

// Apollo Server Setup
const server = new ApolloServer({
  typeDefs,
  resolvers,
  csrfPrevention: true,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});

const startServer = async () => {
  await server.start();

  // File upload middleware - must come before expressMiddleware
  app.use(
    graphqlUploadExpress({
      maxFileSize: 30000000, // 30MB limit
    })
  );

  app.use(
    "/graphql",
    cookieParser(),
    cors({
      origin: process.env.CORS_ORIGIN,
      credentials: true,
    }),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req, res }) => {
        const user = await verifyAuth(req);
        return { req, res, user };
      },
    })
  );

  await connectDB();
  httpServer.listen({ port: PORT }, () =>
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`)
  );
};

startServer().catch((error) => {
  console.error("Server startup error:", error);
});
