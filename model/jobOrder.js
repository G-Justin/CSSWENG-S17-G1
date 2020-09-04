const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

var JobOrderSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    batchNo: {
        type: String,
        required: true
    },
    style: {
        type: String, 
        required: true
    },
    description: {
        type: String,
        required: true
    },
    color: {
        type: String, 
        required: true
    },
    status: {
        type: String,
        enum: ['CUTTING', 'SEWING', 'PRINTING', 'WASHING', 'CANCELLED', 'DONE'],
        default: 'CUTTING'
    },
    isDone: {
        type: Boolean,
        default: false
    },
    remarks: {
        type: String,
    },
    yardage: {
        type: Number,
        min: 0
    },
    smallOrder: {
        type: Number,
        min: 0
    },
    mediumOrder: {
        type: Number,
        min: 0
    },
    largeOrder: {
        type: Number,
        min: 0
    },
    extraLargeOrder: {
        type: Number, 
        min: 0
    },
    totalOrders: {
        type: Number,
        min: 0
    },
    smallOutput: {
        type: Number,
        min: 0
    },
    mediumOutput: {
        type: Number, 
        min: 0
    },
    largeOutput: {
        type: Number,
        min: 0
    },
    extraLargeOutput: {
        type: Number,
        min: 0
    },
    totalOutput: {
        type: Number,
        min: 0
    }
})

JobOrderSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('JobOrderSchema', JobOrderSchema);

