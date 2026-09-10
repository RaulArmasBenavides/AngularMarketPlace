const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_demo');
const { auth } = require('../middleware/auth');
const Order = require('../models/Order');
const User = require('../models/User');

const router = express.Router();

// Create payment intent (Stripe)
router.post('/create-intent', auth, async (req, res, next) => {
  try {
    const { amount, orderId, provider } = req.body;

    if (!amount || !orderId) {
      return res.status(400).json({ error: 'Amount and orderId required' });
    }

    if (provider === 'stripe') {
      // Create Stripe PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        metadata: { orderId, userId: req.user.sub },
      });

      res.json({
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: amount,
        currency: 'USD',
        status: paymentIntent.status,
      });
    } else if (provider === 'paypal') {
      // For PayPal, just return a mock intent
      res.json({
        id: `paypal-${orderId}`,
        clientSecret: `secret-${orderId}`,
        amount: amount,
        currency: 'USD',
        status: 'requires_payment_method',
      });
    } else {
      res.status(400).json({ error: 'Invalid payment provider' });
    }
  } catch (error) {
    next(error);
  }
});

// Process payment
router.post('/process', auth, async (req, res, next) => {
  try {
    const { paymentIntentId, provider, shippingAddress, items, subtotal, shipping, tax } = req.body;

    if (!paymentIntentId || !shippingAddress || !items) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let paymentStatus = 'failed';
    let transactionId = null;

    if (provider === 'stripe') {
      // Verify with Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (paymentIntent.status === 'succeeded') {
        paymentStatus = 'completed';
        transactionId = paymentIntent.id;
      }
    } else if (provider === 'paypal') {
      // Mock PayPal verification
      paymentStatus = 'completed';
      transactionId = paymentIntentId;
    }

    if (paymentStatus !== 'completed') {
      return res.status(400).json({ success: false, message: 'Payment failed' });
    }

    // Create order
    const order = new Order({
      userId: req.user.sub,
      items,
      subtotal,
      shipping,
      tax,
      totalAmount: subtotal + shipping + tax,
      status: 'processing',
      paymentStatus: 'completed',
      paymentMethod: { provider },
      paymentId: paymentIntentId,
      transactionId,
      shippingAddress,
    });

    await order.save();

    res.json({
      success: true,
      message: 'Payment processed successfully',
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Get payment methods
router.get('/methods', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.sub);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user.paymentMethods || []);
  } catch (error) {
    next(error);
  }
});

// Save payment method
router.post('/methods', auth, async (req, res, next) => {
  try {
    const { provider, type, last4, brand, expMonth, expYear, isDefault } = req.body;

    const user = await User.findById(req.user.sub);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const paymentMethod = {
      id: `${provider}-${Date.now()}`,
      type,
      provider,
      last4,
      brand,
      expMonth,
      expYear,
      isDefault: isDefault || false,
    };

    user.paymentMethods.push(paymentMethod);
    await user.save();

    res.status(201).json(paymentMethod);
  } catch (error) {
    next(error);
  }
});

// Delete payment method
router.delete('/methods/:id', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.sub);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.paymentMethods = user.paymentMethods.filter((m) => m.id !== req.params.id);
    await user.save();

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Get order details
router.get('/orders/:id', auth, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if order belongs to user
    if (order.userId.toString() !== req.user.sub) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
});

// Get user orders
router.get('/orders', auth, async (req, res, next) => {
  try {
    const orders = await Order.find({ userId: req.user.sub }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
