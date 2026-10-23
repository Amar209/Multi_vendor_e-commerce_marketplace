import { Product } from '../models/Product.js';
import { Vendor } from '../models/Vendor.js';
import { getElasticClient } from '../config/elasticsearch.js';

// Sync product to Elasticsearch
const syncToElasticsearch = async (product, vendorName) => {
  const es = getElasticClient();
  if (!es) return;
  try {
    await es.index({
      index: 'products',
      id: product._id.toString(),
      body: {
        title: product.title,
        description: product.description,
        category: product.category,
        brand: product.brand,
        price: product.price,
        discountPrice: product.discountPrice,
        ratingAverage: product.ratingAverage,
        vendorId: product.vendor.toString(),
        vendorName: vendorName || '',
        stock: product.stock,
        images: product.images
      }
    });
  } catch (err) {
    console.warn(`[Elasticsearch Sync Warning] ${err.message}`);
  }
};

// @desc    Get all products with Elasticsearch fuzzy search, facets and filtering
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
  try {
    const { q, category, brand, minPrice, maxPrice, sort, page = 1, limit = 12 } = req.query;
    const es = getElasticClient();

    // 1. If live Elasticsearch is available, use Elastic Search Query DSL
    if (es && q) {
      try {
        const must = [{ match: { title: { query: q, fuzziness: 'AUTO' } } }];
        const filter = [];

        if (category) filter.push({ term: { category } });
        if (brand) filter.push({ term: { brand } });
        if (minPrice || maxPrice) {
          const range = {};
          if (minPrice) range.gte = Number(minPrice);
          if (maxPrice) range.lte = Number(maxPrice);
          filter.push({ range: { price: range } });
        }

        const esResponse = await es.search({
          index: 'products',
          from: (page - 1) * limit,
          size: Number(limit),
          body: {
            query: { bool: { must, filter } },
            aggs: {
              categories: { terms: { field: 'category' } },
              price_stats: { stats: { field: 'price' } }
            }
          }
        });

        const hits = esResponse.hits.hits.map(h => ({ _id: h._id, ...h._source }));
        return res.status(200).json({
          success: true,
          count: esResponse.hits.total.value,
          totalPages: Math.ceil(esResponse.hits.total.value / limit),
          currentPage: Number(page),
          source: 'elasticsearch',
          aggregations: esResponse.aggregations,
          data: hits
        });
      } catch (esErr) {
        console.warn(`[Elasticsearch Query Fallback] ${esErr.message}`);
      }
    }

    // 2. Primary / Fallback: High-Performance MongoDB Query Engine
    const filter = {};
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { brand: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } }
      ];
    }
    if (category) filter.category = category;
    if (brand) filter.brand = brand;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'price-asc') sortOption = { price: 1 };
    if (sort === 'price-desc') sortOption = { price: -1 };
    if (sort === 'rating') sortOption = { ratingAverage: -1 };

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate('vendor', 'storeName logo commissionRate')
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Get categories for filter faceting
    const categories = await Product.distinct('category');

    res.status(200).json({
      success: true,
      count: total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      source: 'database-engine',
      categories,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch products.'
    });
  }
};

// @desc    Get single product by ID or Slug
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      'vendor',
      'storeName logo banner description totalSales balance'
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving product.' });
  }
};

// @desc    Create new product (Vendor only)
// @route   POST /api/products
// @access  Private (Vendor)
export const createProduct = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(403).json({
        success: false,
        message: 'No vendor profile associated with this account.'
      });
    }

    const { title, description, category, brand, price, discountPrice, stock, images } = req.body;

    const product = await Product.create({
      vendor: vendor._id,
      title,
      description,
      category,
      brand: brand || 'Generic',
      price: Number(price),
      discountPrice: Number(discountPrice || 0),
      stock: Number(stock || 1),
      images: images && images.length ? images : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600']
    });

    // Sync to Elasticsearch in background
    syncToElasticsearch(product, vendor.storeName);

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update product (Vendor only)
// @route   PUT /api/products/:id
// @access  Private (Vendor)
export const updateProduct = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Verify ownership
    if (product.vendor.toString() !== vendor._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized to edit this product.' });
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    syncToElasticsearch(product, vendor.storeName);

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete product (Vendor / Admin)
// @route   DELETE /api/products/:id
// @access  Private (Vendor / Admin)
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const vendor = await Vendor.findOne({ user: req.user._id });
    if (product.vendor.toString() !== vendor?._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this product.' });
    }

    await product.deleteOne();

    const es = getElasticClient();
    if (es) {
      try {
        await es.delete({ index: 'products', id: req.params.id });
      } catch (e) {
        // ignore delete if not present
      }
    }

    res.status(200).json({ success: true, message: 'Product removed successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current vendor's product listings
// @route   GET /api/products/vendor/mine
// @access  Private (Vendor)
export const getMyProducts = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(403).json({ success: false, message: 'Vendor store not found.' });
    }

    const products = await Product.find({ vendor: vendor._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
