import { Review } from '../models/Review.js';
import { Product } from '../models/Product.js';

// @desc    Get all reviews for a product
// @route   GET /api/products/:productId/reviews
// @access  Public
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const reviews = await Review.find({ product: productId })
      .populate('customer', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create a product review
// @route   POST /api/products/:productId/reviews
// @access  Private (Customer / Any logged in user)
export const createProductReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({ success: false, message: 'Rating and comment are required.' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Check if user already reviewed
    const alreadyReviewed = await Review.findOne({
      product: productId,
      customer: req.user._id
    });

    if (alreadyReviewed) {
      alreadyReviewed.rating = Number(rating);
      alreadyReviewed.comment = comment.trim();
      await alreadyReviewed.save();
    } else {
      await Review.create({
        product: productId,
        customer: req.user._id,
        rating: Number(rating),
        comment: comment.trim()
      });
    }

    // Recalculate rating metrics
    const allReviews = await Review.find({ product: productId });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    product.ratingAverage = Number(avgRating.toFixed(1));
    product.numReviews = allReviews.length;
    await product.save();

    res.status(201).json({
      success: true,
      message: 'Review recorded successfully.',
      data: {
        ratingAverage: product.ratingAverage,
        numReviews: product.numReviews
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
