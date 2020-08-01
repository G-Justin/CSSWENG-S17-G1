var mongoose = require('mongoose');

var OrderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
    },
    smallAmount: {
        type: Number,
        min: 0
    },
    mediumAmount: {
        type: Number,
        min: 0
    },
    largeAmount: {
        type: Number,
        min: 0
    },
    extraLargeAmount: {
        type: Number,
        min: 0
    },
    price: {
        type: Number,
        min: 0
    }
});

module.exports = mongoose.model('OrderItem', OrderItemSchema);