const database = require('./model/database.js');
database.connect();
const Product = require('./model/product.js');
const OrderItem = require('./model/orderitem');

Product.find({})
.select()
.exec((err, result) => {
    console.log(result);
}) 