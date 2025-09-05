// index.js (root server)
const express = require('express');
const app = express();

app.use(express.json());

const aiRoutes = require('./src/api/v1/routes/ai.routes');
const healthRoutes = require('./src/api/v1/routes/health.routes');

app.use('/ai', aiRoutes);
app.use('/ai', healthRoutes);
