const Order = require('./model/order.js');
const database = require('./model/database.js');
database.connect();

let newOrder = new Order({
    firstname: 'John',
    lastname: 'Santos',
    contactNo: '09292',
    email: 'test@yahoo',
    address: 'test city',
});

database.insertOne(Order, newOrder, (req, res) => {});
