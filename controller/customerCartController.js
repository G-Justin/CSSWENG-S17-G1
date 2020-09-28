const session = require('express-session');
const sanitize = require('mongo-sanitize');
const Product = require('../model/product.js');
const OrderItem = require('../model/orderitem.js');
const Order = require('../model/order.js');
const https = require('https');
const axios = require('axios').default;

const customerCartController = {
    getCustomerPage: function(req, res) {
        res.render('customer/cart', {title: 'Cart', customer: true});
    },

    getData: function(req, res) {
        
        let cart = sanitize(req.body.cart);
        let items = new Array();

        getCartItems(cart, items).then((a) => {
            res.send(items);
        })
    },
    
    newOrder: function(req, res) {

        if (req.body.captcha === undefined || req.body.captcha === '' || req.body.captcha === null) {
            res.send("Invalid Captcha 1");
            return;
        }

        const secretKey = '6LcCbdEZAAAAAGQO-e8jkWVBcw91MB1rJU27EJaf';
        const verifyUrl = `https://google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${req.body.captcha}&remoteip=${req.connection.remoteAddress}`;
        axios.get(verifyUrl).then(function(response) {
            console.log(response.data.success)
            if (!response.data.success) {
                res.send("Invalid Captcha 2");
                return;
             }
 
             console.log('reached')
             res.redirect('/');
             return;
        })

        return;
        axios.get(verifyUrl).then(function(response) {
            
        })

        
        
        (verifyUrl, (err, response, body) => {
            body = JSON.parse(body);
            console.log(body)
            
            return;
        })

        let firstname = sanitize(req.body.firstname);
        let lastname = sanitize(req.body.lastname);
        let contactNo = sanitize(req.body.contactNo);
        let email = sanitize(req.body.email);
        let address = sanitize(req.body.address);
        let paymentMode = sanitize(req.body.paymentMode);
        let deliveryMode = sanitize(req.body.deliveryMode);
        let region = sanitize(req.body.region);
        let cart = sanitize(req.body.cart);

        if (region == "" || region != 'INTERNATIONAL' || region != 'DOMESTIC') {
            console.log("customercartcontroller: region is empty or is not valid");
            res.render('error', {
                title: 'Facemust',
                error: '404',
                message: 'AN ERROR OCCURRED',
                customer: true
            });
            return;
        }

        if (firstname == "" || lastname == "" || contactNo == "" || email == "" ||
        address == "" || paymentMode == "" || deliveryMode == "" || cart == null || cart.length == 0) {
            console.log("customercartcontroller: empty fields");
            res.render('error', {
                title: 'Facemust',
                error: '404',
                message: 'AN ERROR OCCURRED',
                customer: true
            });
            return;
        }

        let orderItems = new Array();
        console.log('hello')
        res.send(true);

    }
}

async function getOrderItemsFromCart(orderItems, cart) {
    for (let i = 0; i < cart.length; i++) {
        let product = await Product.findOne({_id: cart[i].product});
        if (!product) {
            continue;
        }

        //let orderItem = new OrderItem({

        //})
    }
}


async function getCartItems(cart, items) {
    if (cart == null || cart == 'undefined') {
        return;
    }

    for (let i = 0; i < cart.length; i++) {
        let product = await Product.findOne({_id: cart[i].product});
        if (!product) {
            continue;
        }
        let item = {
            color: product.color,
            description: product.description,
            style: product.style,
            image: "/productimgs/" + product.image,
            price: product.price * (Number(cart[i].smallAmount) + Number(cart[i].mediumAmount) + Number(cart[i].largeAmount) + Number(cart[i].extraLargeAmount)),

            product: cart[i].product,
            smallAmount: cart[i].smallAmount,
            mediumAmount: cart[i].mediumAmount,
            largeAmount: cart[i].largeAmount,
            extraLargeAmount: cart[i].extraLargeAmount
        }
        
        items.push(item);
    }
}

module.exports = customerCartController;