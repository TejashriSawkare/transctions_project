// app.js
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

const host = "http://localhost:5000"
const port = 5000;

app.use(express.json());

mongoose.connect('mongodb://localhost:27017/productsDB', {})
.then(() => console.log('MongoDB connected...'))
.catch(err => console.log('MongoDB connection error:', err));

const productRouter = require('./routes/productRoutes');
app.use('/api/products', productRouter); 

app.get('/api/products-summary', async (req, res) => {
  try {
    const productStatsApiUrl = `${host}/api/products/product-stats`;
    const salesApiUrl = `${host}/api/products/product-price-ranges`;
    const categoryApiUrl = `${host}/api/products/product-category`;

    const [productsResponse, salesResponse, categoriesResponse] = await Promise.all([
      axios.get(productStatsApiUrl, { params:{month:req.query.month}}),
      axios.get(salesApiUrl, { params:{month:req.query.month}}),
      axios.get(categoryApiUrl, { params:{month:req.query.month}})
    ]);

    const combinedResults = {
      productStats: productsResponse.data,
      totalSales: salesResponse.data,
      categories: categoriesResponse.data,
    };

    res.status(200).json(combinedResults);
  } catch (error) {
    console.error('Error fetching combined data:', error);
    res.status(500).json({ error: 'An error occurred while fetching data.' });
  }
});

app.listen(port, () => {
  console.log(`Server running at ${host}`);
});
