var mongoose = require('mongoose');

var OrderSchema = new mongoose.Schema({
    orderNumber: {
        type: Number,
        unique: true
    },
    orderDate: {
        type: Date,
        default: Date.now
    },
    firstname: {
        type: String,
        trim: true
    },
    lastname: {
        type: String,
        trim: true
    },
    contactNo: {
        type: Number
    },
    email: {
        type: String
    },
    address: {
        type: String
    },
    deliveryStatus: {
        type: String,
        enum: ['PROCESSING', 'DELIVERING', 'DELIVERED'],
        default: 'PROCESSING'
    },
    paymentStatus: {
        type: String,
        enum: ['TO PAY', 'PAID'],
        default: 'TO PAY'
    },
    paymentMode: {
        type: String
        
    },
    paymentDate: {
        type: Date,
        default: null
    },
    deliveryMode: {
        type: String,
    },
    deliveryDate: {
        type: Date,
        default: null
    },
    totalItems: {
        type: Number,
        min: 0,
        default: 0
    },
    basePrice: {
        type: Number,
        min: 0,
        default: 0
    },
    shippingFee: {
        type: Number,
        min: 0,
        default: 0
    },
    totalPrice: {
        type: Number,
        min: 0,
        default: 0
    },
    orderItems:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OrderItem'
    }]
});

module.exports = mongoose.model('Order', OrderSchema);