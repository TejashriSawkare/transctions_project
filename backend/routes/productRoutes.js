const express = require('express');
const axios = require('axios');
const Product = require('../models/Product');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        // Pagination
        let page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 10;
        let month = parseInt(req.query.month) || 3;

        let constQuery = {
            $expr: {
                $eq: [{ $month: "$dateOfSale" }, parseInt(month)]
            }
        }
        let searchQuery = req.query.search ? {
            $and:[
                {
                    $or:[
                        {title : { $regex: req.query.search, $options: 'i' }},
                        {price : !isNaN(req.query.search) ? Number(req.query.search) : undefined},
                        {category : { $regex: req.query.search, $options: 'i' }}
                    ]
                },constQuery
            ]
        } : constQuery;

        // Get total count of documents
        let total = await Product.countDocuments(searchQuery);

        const products = await Product.find(searchQuery,{"_id":0,"__v": 0,"createdAt": 0,"updatedAt": 0})
        .skip((page - 1) * limit)
        .limit(limit);
        res.json({
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            products
        });
    } catch (error) {
        console.error('Error retrieving products:', error);
        res.status(500).json({ message: 'Error retrieving products' });
    }
});


router.get('/fetch-and-store', async (req, res) => {
    try {
        const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
        const productData = response.data;
        await Product.insertMany(productData);
        res.json({ message: 'Data successfully fetched and stored in MongoDB!' });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ message: 'Server error while fetching data' });
    }
});

router.get('/product-stats', async (req, res) => {
    const month = parseInt(req.query.month) || 3;
    try {
      const result = await Product.aggregate([
        {
            $match: {
                $and: [
                  {
                    $expr: {
                      $eq: [{ $month: "$dateOfSale" }, month]
                    }
                  }
                ]
            }
        },
        {
          $group: {
            _id: null,
            totalSalesAmount: { $sum: { $cond: [{ $eq: ["$sold", true] }, "$price", 0] } },
            totalSoldItems: { $sum: { $cond: [{ $eq: ["$sold", true] }, 1, 0] } },
            totalNotSoldItems: { $sum: { $cond: [{ $eq: ["$sold", false] }, 1, 0] } }
          }
        }
      ]);
      const formattedResults = result.map(item => ({
        totalSalesAmount: parseFloat(item.totalSalesAmount).toFixed(2), // Format to two decimal places
        totalSoldItems: item.totalSoldItems,
        totalNotSoldItems: item.totalNotSoldItems
      }));
      res.json(formattedResults[0] || { totalSalesAmount: 0, totalSoldItems: 0, totalNotSoldItems: 0 });
    } catch (err) {
      res.status(500).json({ error: "Error retrieving product summary: " + err });
    }
});

router.get('/product-price-ranges', async (req, res) => {
    const month = parseInt(req.query.month) || 3;  
  
    try {
      const result = await Product.aggregate([
        {
            $match: {
                $and: [
                  {
                    $expr: {
                      $eq: [{ $month: "$dateOfSale" }, month]
                    }
                  }
                ]
            }
        },
        {
          $bucket: {
            groupBy: "$price", 
            boundaries: [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, Infinity],
            default: "901-above",
            output: {
              count: { $sum: 1 }
            }
          }
        }
      ]);
      
      const priceRangeDict = {
        "0 - 100": 0,
        "101 - 200": 0,
        "201 - 300": 0,
        "301 - 400": 0,
        "401 - 500": 0,
        "501 - 600": 0,
        "601 - 700": 0,
        "701 - 800": 0,
        "801 - 900": 0,
        "901 and above": 0
      };

      result.forEach(range => {
        if (range._id <= 100) {
          priceRangeDict["0 - 100"] += range.count;
        } else if (range._id <= 200) {
          priceRangeDict["101 - 200"] += range.count;
        } else if (range._id <= 300) {
          priceRangeDict["201 - 300"] += range.count;
        } else if (range._id <= 400) {
          priceRangeDict["301 - 400"] += range.count;
        } else if (range._id <= 500) {
          priceRangeDict["401 - 500"] += range.count;
        } else if (range._id <= 600) {
          priceRangeDict["501 - 600"] += range.count;
        } else if (range._id <= 700) {
          priceRangeDict["601 - 700"] += range.count;
        } else if (range._id <= 800) {
          priceRangeDict["701 - 800"] += range.count;
        } else if (range._id <= 900) {
          priceRangeDict["801 - 900"] += range.count;
        } else {
          priceRangeDict["901 and above"] += range.count;
        }
      });
      

      res.json(priceRangeDict);
    } catch (err) {
      res.status(500).json({ error: "Error retrieving product price ranges: " + err });
    }
  });

router.get('/product-category', async (req, res) => {
    const month = parseInt(req.query.month) || 3;  
  
    try {
    const result = await Product.aggregate([
        {
            $match: {
            $and: [
                {
                $expr: {
                    $eq: [{ $month: "$dateOfSale" }, month]
                }
                }
            ]
            }
        },
        {
            $group: { // Corrected from groupBy to $group
            _id: "$category", // Group by category
            count: { $sum: 1 } // Count the number of items in each category
            }
        }
        ]);      
      res.json(result);
    
    } catch (err) {
      res.status(500).json({ error: "Error retrieving product price ranges: " + err });
    }
  });

module.exports = router;