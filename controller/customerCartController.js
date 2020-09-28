const session = require('express-session');
const sanitize = require('mongo-sanitize');
const Product = require('../model/product.js');
const OrderItem = require('../model/orderitem.js');
const Order = require('../model/order.js');
const https = require('https');
const axios = require('axios').default;
const User = require('../model/user.js');
const orderitem = require('../model/orderitem.js');
const nodemailer = require('nodemailer')

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
    
    verifyCaptcha: function(req, res) {

        if (req.body.captcha === undefined || req.body.captcha === '' || req.body.captcha === null) {
            res.send(false);
            return;
        }

        const secretKey = '6LcCbdEZAAAAAGQO-e8jkWVBcw91MB1rJU27EJaf';
        const verifyUrl = `https://google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${req.body.captcha}&remoteip=${req.connection.remoteAddress}`;
        axios.get(verifyUrl).then(function(response) {
            console.log(response.data.success)
            if (!response.data.success) {
                res.send(false);
                return;
             }
             
            res.send(true);   
        })
    },
    
    newOrder: function(req, res) {
        let firstname = sanitize(req.body.customerFirstName);
        let lastname = sanitize(req.body.customerLastName);
        let contactNo = sanitize(req.body.customerContact);
        let email = sanitize(req.body.customerEmail);
        let address = sanitize(req.body.customerAddress);
        let paymentMode = sanitize(req.body.customerPaymentMode);
        let deliveryMode = sanitize(req.body.customerDeliveryMode);
        let region = sanitize(req.body.region);
        let cart = sanitize(req.body.cart);

        firstname = firstname.trim();
        lastname = lastname.trim();
        contactNo = contactNo.trim();
        email = email.trim();
        address = address.trim();
        paymentMode = paymentMode.trim();
        deliveryMode = deliveryMode.trim();
        region = region.trim();
        cart = JSON.parse(cart);

        let regExp = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (!regExp.test(email)) {
            console.log("customercartcontroller: invalid email format");
            res.render('error', {
                title: 'Facemust',
                error: '404',
                message: 'AN ERROR OCCURRED',
                customer: true
            });
            return;
        }

        let regions = Order.schema.path('region').enumValues;
        if (!regions.includes(region)) {
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
            console.log("customercartcontroller: region is empty or is not valid");
            res.render('error', {
                title: 'Facemust',
                error: '404',
                message: 'AN ERROR OCCURRED',
                customer: true
            });
            return;
        }

        let orderItems = new Array();
        let order = new Order({
            firstname: firstname,
            lastname: lastname,
            contactNo: contactNo,
            email: email,
            address: address,
            deliveryMode: deliveryMode,
            paymentMode: paymentMode,
            //totalItems
            //basePrice
            //totalPrice
            region: region
        });

        getOrderItemsFromCart(orderItems, order, cart).then((a) => {
            OrderItem.insertMany(orderItems, function(err, docs) {
                if (err) {
                    console.log("customercartcontroller" + err);
                    res.render('error', {
                        title: 'Facemust',
                        error: '404',
                        message: 'AN ERROR OCCURRED',
                        customer: true
                    });
                    return;
                }
                Order.create(order, function(err, result) {
                    if (err) {
                        console.log("customercartcontroller" + err);
                    res.render('error', {
                        title: 'Facemust',
                        error: '404',
                        message: 'AN ERROR OCCURRED',
                        customer: true
                    });
                    return;
                    }

                    sendEmail(email, order._id).then((a) => {
                        res.redirect('/')
                    })
                })
                
            })
        })


    }
}
async function sendEmail(email, trackingId) {
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
        user: 'facemustapptest@gmail.com', // generated ethereal user
        pass: 'facemust1', // generated ethereal password
        },
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: '"Facemust" <facemustapptest@gmail.com>', // sender address
        to: email, // list of receivers
        subject: "Order Received!", // Subject line
        text: "Order details", // plain text body
        html: "<b>Thank you for placing your order! Your tracking number is " + trackingId + "</b>", // html body
    });

    console.log("Message sent: %s", info.messageId);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

    // Preview only available when sending through an Ethereal account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}

async function getOrderItemsFromCart(orderItems, order, cart) {
    for (let i = 0; i < cart.length; i++) {
        let product = await Product.findOne({_id: cart[i].product});
        if (!product) {
            continue;
        }

        let orderItem = new OrderItem({
            parentOrder: order._id,
            product: product._id,
            smallAmount: cart[i].smallAmount,
            mediumAmount: cart[i].mediumAmount,
            largeAmount: cart[i].largeAmount,
            extraLargeAmount: cart[i].extraLargeAmount,
            price: product.price * (Number(cart[i].smallAmount) + Number(cart[i].mediumAmount) + Number(cart[i].largeAmount) + Number(cart[i].extraLargeAmount)),
        })

        orderItems.push(orderItem);
        order.orderItems.push(orderItem._id);
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