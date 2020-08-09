const Order = require('./model/order.js');
const Product = require('./model/product.js');
const OrderItem = require('./model/orderitem.js');
const database = require('./model/database.js');
let User = require('./model/user.js');
let bcrypt = require('bcrypt');
const ordersController = require('./controller/ordersController.js');
database.connect();

let username = 'username';
let password = 'password';
database.deleteMany(Order, (flag) => {});
database.deleteMany(Product, (flag) => {});
database.deleteMany(OrderItem, (flag) => {});
database.deleteMany(User, (flag) => {});

bcrypt.hash(password, 10, function(err, hash) {
    let user = {
        username: username,
        password: hash,
        userType: 'ADMIN'
    }

    database.insertOne(User, user, (result) => {
        console.log(result);
    }); 

})

let johnOrders = new Array();

//hell (synchronous)
let newOrder = new Order({
    firstname: 'John',
    lastname: 'Santos',
    contactNo: '09292',
    email: 'test@yahoo',
    address: 'test city',
    deliveryDate: new Date("2020-08-08"),
    basePrice: 1600,
    totalPrice: 1600,
    shippingFee: 0
});

database.insertOne(Order, newOrder, (flag) => {

    let newProduct = new Product({
        style: 'STYLE 2', 
        color: 'BLACK',
        price: 100,
        smallInventory: 5,
        mediumInventory: 5,
        largeInventory: 5,
        extraLargeInventory: 5,
        smallSold: 0,
        mediumSold: 0,
        largeSold: 0,
        extraLargeSold: 0,
        smallAvailable: 5,
        mediumAvailable: 5,
        largeAvailable: 5,
        extraLargeAvailable: 5,
        totalAvailable: 20,
        smallDeficit: 5, 
        mediumDeficit: 0,
        largeDeficit: 0, 
        extraLargeDeficit: 0
    });
    database.insertOne(Product, newProduct, (flag) => {
        let newProduct2 = new Product({
            style: 'STYLE 1', 
            color: 'CAR27',
            price: 100,
            smallInventory: 5,
            mediumInventory: 5,
            largeInventory: 5,
            extraLargeInventory: 5,
            smallSold: 0,
            mediumSold: 0,
            largeSold: 0,
            extraLargeSold: 0,
            smallAvailable: 5,
            mediumAvailable: 5,
            largeAvailable: 5,
            extraLargeAvailable: 5,
            totalAvailable: 20,
            smallDeficit: 0, 
            mediumDeficit: 0,
            largeDeficit: 0, 
            extraLargeDeficit: 0
        });
        database.insertOne(Product, newProduct2, (flag) => {
            let newOrderItem = new OrderItem({
                product: newProduct._id,
                smallAmount: 10,
                mediumAmount: 5, 
                largeAmount: 0, 
                extraLargeAmount: 0,
                price: 1500
            });
            database.insertOne(OrderItem, newOrderItem, (flag) => {
                johnOrders.push(newOrderItem._id);
                let newOrderItem2 = new OrderItem({
                    product: newProduct2._id,
                    smallAmount: 1,
                    mediumAmount: 0, 
                    largeAmount: 0, 
                    extraLargeAmount: 0,
                    price: 100
                });
                database.insertOne(OrderItem, newOrderItem2, (flag) => {
                    johnOrders.push(newOrderItem2._id);
    
                    Order.updateOne({_id: newOrder._id}, {
                        $push: {orderItems: {$each: johnOrders}}
                    }).then((flag) => {
                        console.log(flag)
                    })
                });
            });
            
        });
    });
});



















