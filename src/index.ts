import dotenv from 'dotenv';
dotenv.config();
import express, { Request } from 'express';
// eslint-disable-next-line node/no-unpublished-import
import { ApolloServer } from '@apollo/server';
// eslint-disable-next-line node/no-unpublished-import
import { expressMiddleware } from '@apollo/server/express4';
import { schema } from './graphql/schema';
import http from 'http';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import apiRoutes from './routes/index';
import jwt from 'jsonwebtoken';
import { prisma } from './utils/prismaClient';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger.json';
import helmet from 'helmet';
import compression from 'compression';
import expressRateLimit from 'express-rate-limit';
import cors from 'cors';

async function startServer() {
  const app = express();

  app.use(express.json());

  // Apply security-related middleware
  // Use helmet but disable certain features that interfere with Apollo Sandbox
  app.use(
    helmet({
      contentSecurityPolicy: false, // Disable CSP or customize it
    }),
  );
  app.use(compression());

  // CORS configuration
  app.use(cors());

  // Rate limiter
  const limiter = expressRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window`
  });
  app.use(limiter);

  const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

  // Apollo Server 4 setup
  const apolloServer = new ApolloServer({
    schema,
    introspection: true, // Enable introspection for GraphQL schema exploration
  });

  // Define the context to validate JWT and attach the user to the context
  const context = async ({ req }: { req: Request }) => {
    const token = req.headers.authorization || '';
    let user = null;

    if (token) {
      try {
        user = jwt.verify(token.replace('Bearer ', ''), JWT_SECRET);
      } catch (err) {
        console.error('Invalid token:', err);
      }
    }

    return { user, prisma, req }; // Pass the user and prisma into the context
  };

  await apolloServer.start();

  // Create an HTTP server for GraphQL Subscriptions
  const httpServer = http.createServer(app);
  const wsServer = new WebSocketServer({
    server: httpServer,
  });

  // Set up WebSocket server with GraphQL Subscriptions
  useServer({ schema }, wsServer);

  // Serve Swagger docs
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  // Use Apollo middleware for Express and pass context
  app.use(
    '/graphql',
    expressMiddleware(apolloServer, {
      context,
    }),
  );

  // Add the REST routes for Express
  app.use('/api', apiRoutes);

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(
      `GraphQL Playground available at http://localhost:${PORT}/graphql`,
    );
  });
}

startServer();
