var mongoose = require('mongoose');

var CartSchema = new mongoose.Schema({
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
    status: {
        type: String,
        enum: ['PARTIAL', 'DELIVERED']
    },
    paymentMode: {
        type: String
        //might be an enum
    },
    paymentDate: {
        type: Date
    },
    deliveredDate: {
        type: Date
    },
    total: {
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

module.exports = mongoose.model('Cart', CartSchema);