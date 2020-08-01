var mongoose = require('mongoose');

var OrderSchema = new mongoose.Schema({
    orderDate: {
        type: Date
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
        enum: ['NOT DELIVERED', 'DELIVERED']
    },
    paymentStatus: {
        type: String,
        enum: ['NOT PAID', 'PAID']
    },
    paymentMode: {
        type: String
        //might be an enum
    },
    paymentDate: {
        type: Date
    },
    deliveryMode: {
        type: String,
    },
    deliveredDate: {
        type: Date
    },
    totalItems: {
        type: Number,
        min: 0
    },
    basePrice: {
        type: Number,
        min: 0
    },
    items:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OrderItem'
    }]
});

module.exports = mongoose.model('Order', OrderSchema);