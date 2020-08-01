var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    }, 
    password: {
        type: String,
        required: true
    },
    userType: {
        type: String, 
        enum: ['ADMIN'] //and more
    }
});

module.exports = mongoose.model('User', UserSchema);