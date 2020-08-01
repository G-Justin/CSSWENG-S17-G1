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
    smallInventory: {
        type: Number,
        min: 0
    },
    mediumInventory: {
        type: Number,
        min: 0
    },
    largeInventory: {
        type: Number,
        min: 0
    },
    extraLargeInventory: {
        type: Number,
        min: 0
    },
    smallSold: {
        type: Number,
        min: 0
    },
    mediumSold: {
        type: Number,
        min: 0
    },
    largeSold: {
        type: Number,
        min: 0
    },
    extraLargeSold: {
        type: Number,
        min: 0
    },
    smallAvailable: {
        type: Number,
        min: 0
    },
    mediumAvailable: {
        type: Number,
        min: 0
    },
    largeAvailable: {
        type: Number,
        min: 0
    },
    extraLargeAvailable: {
        type: Number,
        min: 0
    }, 
    totalAvailable: {
        type: Number,
        min: 0
    },
    smallDeficit: {
        type: Number,
        min: 0
    },
    mediumDeficit: {
        type: Number, 
        min: 0
    },
    largeDeficit: {
        type: Number,
        min: 0
    }
});

module.exports = mongoose.model('Product', ProductSchema);