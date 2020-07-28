var mongoose = require('mongoose');

var OrderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
    },
    amount: {
        type: Number,
        min: 0
    },
    price: {
        type: Number
    }
});

module.exports = mongoose.model('OrderItem', OrderItemSchema);