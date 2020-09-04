const database = require('./model/database.js');
database.connect();
const Product = require('./model/product.js');
const OrderItem = require('./model/orderitem');

OrderItem.find({})
.exec((err, result) => {
    console.log(result)
})

Product.find({})
.select('smallAvailable')
.exec((err, result) => {
    console.log(result);
})