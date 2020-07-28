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
    status: {
        type: String,
        enum: ['PARTIAL', 'DELIVERED']
    },
    paymentMode: {
        type: String
    }
});

module.exports = mongoose.model('Cart', CartSchema);