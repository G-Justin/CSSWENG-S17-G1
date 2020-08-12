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
    //orderNumber: Math.floor(100000000 + Math.random() * 900000000),
    firstname: 'John',
    lastname: 'Santos',
    contactNo: '09292',
    email: 'test@yahoo',
    address: 'test city',
    deliveryStatus: 'PROCESSING',
    orderDate: new Date('2020-08-08'),
    deliveryDate: new Date("2021-08-08"),
    basePrice: 1600,
    totalPrice: 1600,
    shippingFee: 0
});

let newProduct = new Product({
    style: 'STYLE 2', 
    color: 'BLACK',
    price: 100,
    smallInventory: 10,
    mediumInventory: 5,
    largeInventory: 5,
    extraLargeInventory: 5,
    smallSold: 0,
    mediumSold: 0,
    largeSold: 0,
    extraLargeSold: 0,
    smallAvailable: 0,
    mediumAvailable: 5,
    largeAvailable: 5,
    extraLargeAvailable: 5,
    totalAvailable: 20,
    smallDeficit: 5, 
    mediumDeficit: 0,
    largeDeficit: 0, 
    extraLargeDeficit: 0
});

let newProduct2 = new Product({
    style: 'STYLE 1', 
    color: 'CAR27',
    price: 100,
    smallInventory: 10,
    mediumInventory: 5,
    largeInventory: 5,
    extraLargeInventory: 5,
    smallSold: 0,
    mediumSold: 0,
    largeSold: 0,
    extraLargeSold: 0,
    smallAvailable: 0,
    mediumAvailable: 5,
    largeAvailable: 5,
    extraLargeAvailable: 5,
    totalAvailable: 20,
    smallDeficit: 0, 
    mediumDeficit: 0,
    largeDeficit: 0, 
    extraLargeDeficit: 0
});

let newOrderItem = new OrderItem({
    parentOrder: newOrder._id,
    product: newProduct._id,
    smallAmount: 10,
    mediumAmount: 5, 
    largeAmount: 0, 
    extraLargeAmount: 0,
    price: 1500
});

johnOrders.push(newOrderItem._id);
let newOrderItem2 = new OrderItem({
    parentOrder: newOrder._id,
    product: newProduct2._id,
    smallAmount: 1,
    mediumAmount: 0, 
    largeAmount: 0, 
    extraLargeAmount: 0,
    price: 100
});
johnOrders.push(newOrderItem2._id);
database.insertOne(Order, newOrder, (flag) => {  
    database.insertOne(Product, newProduct, (flag) => {
        database.insertOne(Product, newProduct2, (flag) => {  
            database.insertOne(OrderItem, newOrderItem, (flag) => {   
                database.insertOne(OrderItem, newOrderItem2, (flag) => {   
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

let newOrder2 = new Order({
    //orderDate: Math.floor(100000000 + Math.random() * 900000000),
    firstname: 'Lucifer',
    lastname: 'Angel of Light',
    contactNo: '666',
    email: 'toevilforu@roblox.com',
    address: '9th Circle of Hell',
    deliveryStatus: 'PROCESSING',
    paymentStatus: 'TO PAY',
    orderDate: new Date('2020-07-01'),
    basePrice: 100,
    totalPrice: 433,
    shippingFee: 333
});

let luciferItem = new OrderItem({
    parentOrder: newOrder2._id,
    product: newProduct2._id,
    smallAmount: 0,
    mediumAmount: 1, 
    largeAmount: 0, 
    extraLargeAmount: 0,
    price: 100
})

database.insertOne(Order, newOrder2, (flag) => {
    database.insertOne(OrderItem, luciferItem, (flag) => {
        Order.updateOne({_id: newOrder2._id}, {$push: {orderItems: luciferItem._id}}).then();
    })
})

let newOrder3 = new Order({
    //orderNumber: Math.floor(100000000 + Math.random() * 900000000),
    firstname: 'Jennifer',
    lastname: 'Ureta',
    contactNo: '8700',
    email: 'jennifer.ureta@dlsu.edu',
    address: 'somewhere in manila idk',
    deliveryStatus: 'PROCESSING',
    paymentStatus: 'TO PAY',
    orderDate: new Date('2020-06-01'),
    paymentDate: new Date('2020-08-10'),
    basePrice: 100,
    totalPrice: 200000000000100,
    shippingFee: 20000000000000,
});

let uretaItem = new OrderItem({
    parentOrder: newOrder3._id,
    product: newProduct2._id,
    smallAmount: 0,
    mediumAmount: 1, 
    largeAmount: 0, 
    extraLargeAmount: 0,
    price: 100
});
database.insertOne(Order, newOrder3, (flag) => {
    database.insertOne(OrderItem, uretaItem, (flag) => {
        Order.updateOne({_id: newOrder3._id}, {$push: {orderItems: uretaItem._id}}).then();
    })
})




















