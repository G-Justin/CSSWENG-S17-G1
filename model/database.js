//db
const mongoose = require('mongoose');
const url = 'mongodb+srv://fmAdmin:kSBI0pqqCcPfq6Id@facemust.k65jg.mongodb.net/test'

const options = {
    useUnifiedTopology: true,
    useNewUrlParser: true
};

const database = {

    connect: function () {
        mongoose.connect(url, options, function(error) {
            if(error) throw error;
            console.log('Connected to: ' + url);
        });
    },

    insertOne: function(model, doc, callback) {
        model.create(doc, function(error, result) {
            console.log(error);
            if(error) return callback(false);
            console.log('Added ' + result);
            return callback(result);
        });
    },

    insertMany: function(model, docs) {
        model.insertMany(docs, function(error, result) {
            if(error) return false;
            console.log('Added ' + result);
            return true;
        });
    },

    findOne: function(model, query, projection, callback) {
        model.findOne(query, projection, function(error, result) {
            if(error) return callback(false);
            return callback(result);
        });
    },

    findMany: function(model, query, projection, callback) {
        model.find(query, projection, function(error, result) {
            if(error) return callback(false);
            return callback(result);
        });
    },

    findManyLean: function(model, query, projection, callback) {
        model.find(query, projection).lean().exec(function(error, result) {
            if(error) return callback(false);
            return callback(result);
        });
    },

    updateOne: function(model, filter, update) {
        model.updateOne(filter, update, function(error, result) {
            if(error) return false;
            console.log('Document modified: ' + result.nModified);
            return true;
        });
    },

    updateMany: function(model, filter, update) {
        model.updateMany(filter, update, function(error, result) {
            if(error) return false;
            console.log('Documents modified: ' + result.nModified);
            return true;
        });
    },

    deleteOne: function(model, conditions) {
        model.deleteOne(conditions, function (error, result) {
            if(error) return false;
            console.log('Document deleted: ' + result.deletedCount);
            return true;
        });
    },

    deleteMany: function(model, conditions) {
        model.deleteMany(conditions, function (error, result) {
            if(error) return false;
            console.log('Document deleted: ' + result.deletedCount);
            return true;
        });
    }

}

module.exports = database;