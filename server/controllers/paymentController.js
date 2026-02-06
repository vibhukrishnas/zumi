const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.createPaymentIntent = async (req, res) => {
    try {
        const { amount, currency = 'usd' } = req.body;

        // Validation
        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Valid amount is required' 
            });
        }

        if (amount > 999999) {
            return res.status(400).json({ 
                success: false, 
                message: 'Amount exceeds maximum allowed' 
            });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency,
            automatic_payment_methods: { enabled: true },
        });

        res.json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
        });
    } catch (error) {
        console.error('Stripe Error:', error);
        
        // Handle specific Stripe errors
        if (error.type === 'StripeCardError') {
            return res.status(400).json({ 
                success: false, 
                message: error.message 
            });
        }
        
        if (error.type === 'StripeInvalidRequestError') {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid payment request' 
            });
        }

        res.status(500).json({ 
            success: false, 
            message: 'Payment processing failed. Please try again.' 
        });
    }
};

// Retrieve payment status
exports.getPaymentStatus = async (req, res) => {
    try {
        const { paymentIntentId } = req.params;

        if (!paymentIntentId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Payment ID is required' 
            });
        }

        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        res.json({
            success: true,
            status: paymentIntent.status,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency
        });
    } catch (error) {
        console.error('Payment Status Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Could not retrieve payment status' 
        });
    }
};
