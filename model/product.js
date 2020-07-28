var mongoose = require('mongoose');

var ProductSchema = new mongoose.Schema({
    style: {
        type: String,
        trim: true
    },
    color:{
        type: String,
        trim: true
    }, 
    available: {
        type: Number
    },
    sold: {
        type: Number,
        min: 0
    },
    size: {
        type: String,
        enum: ['B', 'C', 'S', 'M', 'L', 'XL']
    },
    price: {
        type: Number
    }
});

module.exports = mongoose.model('Product', ProductSchema);