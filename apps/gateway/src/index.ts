import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import authRoutes from './routes/auth';
import cliRoutes from './routes/cli';
import { setupWebSocket } from './websocket';
import { setupProxy } from './proxy';
import { startUpdater } from './lib/updater';

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'gateway' });
});

// Routes
app.use('/auth', authRoutes);
app.use('/api/cli', cliRoutes);

const server = http.createServer(app);
setupWebSocket(server);
setupProxy(server);

// Start background tasks
startUpdater();

server.listen(port, () => {
  console.log(`Rock or Bust Gateway listening on port ${port}`);
});
