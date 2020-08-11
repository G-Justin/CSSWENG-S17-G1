const database = require('./model/database.js');
database.connect();
const Product = require('./model/product.js');

Product.find({})
.select('smallAvailable')
.exec((err, result) => {
    console.log(result);
})