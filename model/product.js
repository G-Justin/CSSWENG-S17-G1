var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

var ProductSchema = new mongoose.Schema({
    dateCreated: {
        type: Date,
        default: Date.now
    },
    style: {
        type: String,
        trim: true
    },
    color:{
        type: String,
        trim: true
    }, 
    price: {
        type: Number,
        min: 0
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
    },
    extraLargeDeficit: {
        type: Number,
        min: 0
    },
    inventoryRecords: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InventoryRecord'
    }]
});

ProductSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Product', ProductSchema);