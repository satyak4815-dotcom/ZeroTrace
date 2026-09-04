const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const signalRoutes = require('./routes/signalRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/signals', signalRoutes);

app.get('/', (req, res) => {
  res.send('ZeroTrace Backend API is Running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});