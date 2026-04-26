import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import authRoutes from './routes/auth';
import { setupWebSocket } from './websocket';
import { setupProxy } from './proxy';

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

const server = http.createServer(app);
setupWebSocket(server);
setupProxy();

server.listen(port, () => {
  console.log(`Rock or Bust Gateway listening on port ${port}`);
});
