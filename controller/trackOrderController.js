const session = require('express-session');
const sanitize = require('mongo-sanitize')
const Order = require('../model/order.js')
const OrderItem = require('../model/orderitem');
const Product = require('../model/product.js');
const order = require('../model/order.js');
const async = require('async');
const orderitem = require('../model/orderitem');

const dashboardController = {
    trackOrder: function(req, res) {

        let _id = sanitize(req.params._id)
        let validator = sanitize(req.query.validator);

        Order.findOne({_id: _id})
            .populate('orderItems')
            .lean()
            .exec((err, orderResult) => {
                if (!orderResult) {
                    res.render('error', {
                        title: 'Facemust',
                        error: '404',
                        message: 'ORDER DOES NOT EXIST'
                    })
                    return;
                }
/*
                if (isNaN(validator)) {
                    if (validator != orderResult.email) {
                        res.render('error', {
                            title: 'Facemust',
                            error: '404',
                            message: 'INVALID ORDER DETAILS'
                        })
                        return;
                    }
                } else {
                    if (validator != orderResult.contactNo) {
                        res.render('error', {
                            title: 'Facemust',
                            error: '404',
                            message: 'INVALID ORDER DETAILS'
                        })
                        return;
                    }
                } */

                let shippingFee = (orderResult.shippingFee == null) ? "PROCESSING" : "₱" + orderResult.shippingFee;

                let orderItemsArray = new Array();
                getOrderItems(orderResult.orderItems, orderItemsArray).then((a) => {
                    res.render('customer/track', {
                        title: "Track Order",
                        customer: true,
                        _id: orderResult._id,
                        deliveryStatus: orderResult.deliveryStatus,
                        paymentStatus: orderResult.paymentStatus,
                        shippingFee: shippingFee,
                        address: orderResult.address,
                        firstname: orderResult.firstname,
                        lastname: orderResult.lastname,
                        basePrice: orderResult.basePrice,
                        totalPrice: orderResult.totalPrice,
                        orderItems: orderItemsArray
                    })
                })

                

                
            })


        

       
    }
}

module.exports = dashboardController;

async function getOrderItems(orderItems, array) {
    for (let i = 0; i < orderItems.length; i++) {
        let product = await Product.findOne({_id: orderItems[i].product});
        let newOrder = {
            image: product.image,
            style: product.style,
            description: product.description,
            color: product.color,
            price: orderItems[i].price,
            smallAmount: orderItems[i].smallAmount,
            mediumAmount: orderItems[i].mediumAmount,
            largeAmount: orderItems[i].largeAmount,
            extraLargeAmount: orderItems[i].extraLargeAmount
        }

        array.push(newOrder);
    }
}