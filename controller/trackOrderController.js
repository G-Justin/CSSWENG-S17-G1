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

        let _id = sanitize(req.body._id)
        let validator = sanitize(req.body.validator);

        Order.findOne({_id: _id})
            .populate('orderItems')
            .lean()
            .exec((err, orderResult) => {
                if (!orderResult) {
                    res.render('error', {
                        title: 'Facemust',
                        error: '404',
                        message: 'ORDER DOES NOT EXIST',
                        customer: true
                    })
                    return;
                }

                if (isNaN(validator)) {
                    if (validator != orderResult.email) {
                        res.render('error', {
                            title: 'Facemust',
                            error: '404',
                            message: 'INVALID ORDER DETAILS',
                            customer: true
                        })
                        return;
                    }
                } else {
                    if (validator != orderResult.contactNo) {
                        res.render('error', {
                            title: 'Facemust',
                            error: '404',
                            message: 'INVALID ORDER DETAILS',
                            customer: true
                        })
                        return;
                    }
                } 

                let shippingFee = (orderResult.shippingFee == null) ? "PROCESSING" : "₱" + orderResult.shippingFee;
                let basePrice = new Array();
                let orderItemsArray = new Array();
                getOrderItems(orderResult.orderItems, orderItemsArray, basePrice).then((a) => {
                    let totalPrice = 0;
                    if (orderResult.shippingFee != null) {
                        totalPrice = basePrice[0] + Number(orderResult.shippingFee);
                    } else {
                        totalPrice = basePrice[0];
                    }

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
                        basePrice: basePrice[0],
                        totalPrice: totalPrice,
                        orderItems: orderItemsArray,
                        canBeVoided: (orderResult.paymentStatus != 'PAID' && orderResult.deliveryStatus != 'DELIVERED' && orderResult.paymentStatus != 'VOIDED')
                    })
                })

                

                
            })
    },

    voidOrder: function(req, res) {
        let _id = sanitize(req.body.voidId);

        Order.updateOne({_id: _id}, {
            deliveryStatus: 'VOIDED',
            paymentStatus: 'VOIDED'
        }, function(err, result) {
            if (err) {
                res.render('error', {
                    title: 'Facemust',
                    error: '404',
                    message: 'AN ERROR OCCURRED',
                    customer: true
                })
                return;
            }

            res.redirect(req.get('referer'))
        })
    }

}

module.exports = dashboardController;

async function getOrderItems(orderItems, array, basePrice) {
    let price = 0;
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

        price += orderItems[i].price;
        array.push(newOrder);
    }
    basePrice.push(price)
}