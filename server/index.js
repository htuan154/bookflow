// server/index.js
const express = require('express');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8080; // Cổng cho server

app.get('/', (req, res) => {
  res.send('API Server is running! 🚀');
});

app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});