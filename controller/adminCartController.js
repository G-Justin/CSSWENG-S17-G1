const sanitize = require('mongo-sanitize');
const Order = require('../model/order.js');
const OrderItem = require('../model/orderitem.js');
const Product = require('../model/product.js');
const async = require('async');
const orderitem = require('../model/orderitem.js');

const moment = require('moment');
const database = require('../model/database.js');
const ordersController = require('./ordersController.js');

const { deleteMany } = require('../model/order.js');
const { response } = require('../routes/routes.js');

const adminCartController = {
    getOrder: function(req, res) {
        if (!(req.session.user && req.cookies.user_sid)) {
            res.redirect('/login');
            return;
        }
        
        let orderNumber = sanitize(req.params._id);
        Order.findOne({_id: orderNumber})
        .populate('orderItems')
        .lean()
        .exec((err, orderResult) => {
            if (orderResult == null) {
                console.log('here')
                res.render('error', {
                    title: 'Facemust',
                    error: '404',
                    message: 'ORDER DOES NOT EXIST'
                })
                return;
            }

            let orderResultItems = orderResult.orderItems;
            let orderItems = new Array();

            getOrderItems(orderResultItems, orderItems).then((a) => {
                let details = {
                    _id: orderResult._id,
                    orderDate: formatDate(orderResult.orderDate),
                    firstname: orderResult.firstname,
                    lastname: orderResult.lastname,
                    contactNo: orderResult.contactNo,
                    email: orderResult.email,
                    address: orderResult.address,
                    paymentMode: orderResult.paymentMode,
                    paymentDate: formatDate(orderResult.paymentDate),
                    deliveryMode: orderResult.deliveryMode,
                    deliveryDate: formatDate(orderResult.deliveryDate),
                    totalItems: orderResult.orderItems.length,
    
                    deliveryStatus: orderResult.deliveryStatus,
                    paymentStatus: orderResult.paymentStatus,
                    shippingFee: orderResult.shippingFee,
                    basePrice: orderResult.basePrice,
                    totalPrice: orderResult.totalPrice,
    
                    orderItems: orderItems,
    
                    title: 'Customer Cart'
                };
    
                res.render('admin/cart', details);
            })
                
            
        })
    },

    updateShippingFee: function(req, res) {
        if (!(req.session.user && req.cookies.user_sid)) {
            res.redirect('/login');
            return;
        }
        let _id = sanitize(req.body.shippingFeeCartId);
        let shippingFee = Number(sanitize(req.body.shippingFeeInput));
        let js = req.body.js;
        
        if (shippingFee < 0) {
            res.redirect('/admin/orders/' + _id);
            return;
        }

        Order.findById(_id)
        .select('totalPrice shippingFee')
        .exec((err, orderResult) => {
            if (!orderResult) {
                console.log('did not get cart id to update shipping fee');
                return;
            }

            let totalPrice = (orderResult.totalPrice - orderResult.shippingFee) + shippingFee;
            if (totalPrice >= (Number.MAX_SAFE_INTEGER - 10)) {
                res.redirect('/admin/orders/' + _id);
                return;
            }

            Order.updateOne({_id: _id}, {shippingFee: shippingFee, totalPrice: totalPrice})
            .then((a) => {
                let data = {
                    shippingFee: shippingFee,
                    totalPrice: totalPrice
                };

                if (js) {
                    res.send(data);
                } else {
                    res.redirect('/admin/orders/' + _id);
                }
                
            })
            
        })
    },

    updateDeliveryStatus: function(req, res) {
        if (!(req.session.user && req.cookies.user_sid)) {
            res.redirect('/login');
            return;
        }

        let _id = sanitize(req.body.updateStatusId);
        let deliveryStatus = sanitize(req.body.deliveryStatus);
        let deliveryDate = parseDate(sanitize(req.body.deliveryDate));
        let js = req.body.js;

        let statusEnum = new Array();
        
        switch(deliveryStatus) {
            case 'PROCESSING':
                statusEnum.push('PROCESSING')
                updateDeliveryStatusHelper(_id, res, deliveryDate, js, deliveryStatus, statusEnum);
                return;
            case 'DELIVERING':
                statusEnum.push('DELIVERING', 'DELIVERED');
                updateDeliveryStatusHelper(_id, res, deliveryDate, js, deliveryStatus, statusEnum);
                return;
            case 'DELIVERED':
                statusEnum.push('DELIVERING', 'DELIVERED');
                updateDeliveryStatusHelper(_id, res, deliveryDate, js, deliveryStatus, statusEnum);
                return;
            default: 
            return;
        }  
    },
    
    updatePaymentStatus: function(req, res) {
        if (!(req.session.user && req.cookies.user_sid)) {
            res.redirect('/login');
            return;
        }
        let _id = sanitize(req.body.updateStatusId);
        let paymentStatus = sanitize(req.body.paymentStatus);
        let paymentDate = parseDate(sanitize(req.body.paymentDate));
        let js = req.body.js;

        Order.updateOne({_id: _id}, {
            paymentStatus: paymentStatus,
            paymentDate: paymentDate
        }).then((a) => {
            res.redirect('/admin/orders/' + _id)
        })
    },

    voidOrder: function(req, res) {
        if (!(req.session.user && req.cookies.user_sid)) {
            res.redirect('/login');
            return;
        }

        let _id = sanitize(req.body.voidId);

        Order.deleteOne({_id: _id})
        .then((a) => {
            OrderItem.deleteMany({parentOrder: _id}).then((a) => {
                res.redirect('/admin/orders');
            })
        })
    }, 

    checkDeliveryUpdate: function(req, res) {
        if (!(req.session.user && req.cookies.user_sid)) {
            res.redirect('/login');
            return;
        }

        let _id =  sanitize(req.body._id);
        let deliveryDate = parseDate(sanitize(req.body.deliveryDate));

        Order.findById(_id, function(err, result) {
            if (!result) {
                console.log(err);
                res.redirect(req.get('referer'));
                return;
            }

            res.send(!(deliveryDate.getTime() < result.orderDate.getTime()));
            return;

            
        })
    }
};
async function getOrderItems(orderResultItems, orderItems) {
    for (let i = 0; i < orderResultItems.length; i++) {
        let productResult = await Product.findOne(orderResultItems[i].product);
        let smallDeficit = productResult.smallAvailable < orderResultItems[i].smallAmount ? (orderResultItems[i].smallAmount - productResult.smallAvailable) : 0;
        let mediumDeficit = productResult.mediumAvailable < orderResultItems[i].mediumAmount ? (orderResultItems[i].mediumAmount - productResult.mediumAvailable) : 0;
        let largeDeficit = productResult.largeAvailable < orderResultItems[i].largeAmount ? (orderResultItems[i].largeAmount - productResult.largeAvailable) : 0;
        let extraLargeDeficit = productResult.extraLargeAvailable < orderResultItems[i].extraLargeAmount ? (orderResultItems[i].extraLargeAmount - productResult.extraLargeAvailable) : 0;

        let orderItem = {
            color: productResult.color,
            style: productResult.style,
            smallAmount: orderResultItems[i].smallAmount,
            mediumAmount: orderResultItems[i].mediumAmount,
            largeAmount: orderResultItems[i].largeAmount,
            extraLargeAmount: orderResultItems[i].extraLargeAmount,
            smallDeficit: smallDeficit,
            mediumDeficit: mediumDeficit,
            largeDeficit: largeDeficit,
            extraLargeDeficit: extraLargeDeficit
        };

        orderItems.push(orderItem);
    }
}

function someTest() {
    Product.find({})
    .select('smallAvailable')
    .exec((err, result) => {
        console.log(result);
    })
}
function updateDeliveryStatusHelper(_id, res, deliveryDate, js, deliveryStatus, statusEnum) {
    Order.findById(_id)
        .populate('orderItems')
        .exec((err, orderResult) => {
            if (orderResult == null) {
                res.redirect('/admin/orders');
                return;
            }

            if (deliveryDate.getTime() < orderResult.orderDate.getTime()) {
                console.log("error: delivery date earlier than order date");
                res.redirect(req.get('referer'));
                return;
            }
            
            if (statusEnum.includes(orderResult.deliveryStatus)) {
                Order.updateOne({ _id: _id }, {
                    deliveryDate: deliveryDate,
                    deliveryStatus: deliveryStatus
                }).then((a) => {
                    someTest();
                    if (js) {
                        let data = {
                            deliveryDate: deliveryDate,
                            deliveryStatus: deliveryStatus
                        };
                        res.send(formatDate(data));
                        return;
                    } else {
                        res.redirect('/admin/orders/' + _id);
                        return;
                    }
                });
            } else {
                let orderItems = orderResult.orderItems;
                async.waterfall([
                    function(done) {
                        for (let i = 0; i < orderItems.length; i++) {
                            let smallAmount = (deliveryStatus == 'DELIVERED' || deliveryStatus == 'DELIVERING') ? (orderItems[i].smallAmount * -1) : orderItems[i].smallAmount;
                            let mediumAmount = (deliveryStatus == 'DELIVERED' || deliveryStatus == 'DELIVERING') ? (orderItems[i].mediumAmount * -1) : orderItems[i].mediumAmount;
                            let largeAmount = (deliveryStatus == 'DELIVERED' || deliveryStatus == 'DELIVERING') ? (orderItems[i].largeAmount * -1) : orderItems[i].largeAmount;
                            let extraLargeAmount = (deliveryStatus == 'DELIVERED' || deliveryStatus == 'DELIVERING') ? (orderItems[i].extraLargeAmount * -1) : orderItems[i].extraLargeAmount;
                            console.log(smallAmount)
                            Product.updateOne({ _id: orderItems[i].product }, {
                                $inc: { 
                                    smallAvailable: smallAmount,
                                    mediumAvailable: mediumAmount,
                                    largeAvailable: largeAmount,
                                    extraLargeAvailable: extraLargeAmount
                                }
                            }).then((a) => {
                                console.log(a)
                            });
                        }
                        done(null, 'value 1');
                    },
                    function(value1, done) {
                        Order.updateOne({ _id: _id }, {
                            deliveryStatus: deliveryStatus,
                            deliveryDate: deliveryDate
                        }).then((a) => {
                            someTest()
                            if (js) {
                                let data = {
                                    deliveryDate: deliveryDate,
                                    deliveryStatus: deliveryStatus
                                };
                                res.send(formatDate(data));
                                return;
                            } else {
                                res.redirect('/admin/orders/' + _id);
                                return;
                            }
                        });
                        done(null, 'value 2');
                    }
                ], function (err) {

                })
                
                

            }
            
        });
}


function parseDate(s) {
    if (!(moment(s, 'YYYY-MM-DD', true).isValid())) {
        return null;
    }

    if (s == null) {
        return null;
    }
    var b = s.split(/\D/);
    let date = new Date(b[0], --b[1], b[2]);
    date.setHours(12, 0, 0, 0);

    return date;
}

function formatDate(dt) {
    if (dt == null) {
        return null;
    }

    var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

    let date = new Date(dt).getDate();
    let month = new Date(dt).getMonth();
    let year = new Date(dt).getFullYear();

    return date + "/" + monthNames[month] + "/" + year;
}

module.exports = adminCartController;