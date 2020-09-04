var mongoose = require('mongoose');

var InventoryRecordSchema = new mongoose.Schema({
    parentRecord: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    smallUpdate: {
        type: Number
    },
    mediumUpdate: {
        type: Number
    },
    largeUpdate: {
        type: Number
    },
    extraLargeUpdate: {
        type: Number
    }
});

module.exports = mongoose.model('InventoryRecord', InventoryRecordSchema);