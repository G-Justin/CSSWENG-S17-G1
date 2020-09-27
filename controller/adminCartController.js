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
const order = require('../model/order.js');

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
            let delivered = orderResult.deliveryStatus == "DELIVERED";
            if (delivered) {
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
                    delivered: delivered,
    
                    deliveryStatus: orderResult.deliveryStatus,
                    paymentStatus: orderResult.paymentStatus,
                    shippingFee: orderResult.shippingFee,
                    basePrice: orderResult.basePrice,
                    totalPrice: orderResult.totalPrice,
    
                    orderItems: orderResultItems,
    
                    title: 'Customer Cart'
                };
    
                res.render('admin/cart', details);
            } else {
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
                        delivered: delivered,
        
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

            }
            
        })
    },

    updateShippingFee: function(req, res) {
        if (!(req.session.user && req.cookies.user_sid)) {
            res.redirect('/login');
            return;
        }

        let _id = sanitize(req.body.shippingFeeCartId);
        let shippingFee = sanitize(req.body.shippingFeeInput);
        if (shippingFee != null) {
            shippingFee = Number(shippingFee);
        }
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

            let initialShippingFee = (orderResult.shippingFee == null) ? 0 : orderResult.shippingFee;
            let totalPrice = (orderResult.totalPrice - initialShippingFee) + shippingFee;
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

        Order.findOne({_id: _id})
            .populate('orderItems')
            .exec(function(err, result) {
            if (!result) {
                console.log("admincartcontroller error: no order id found for updating delivery status");
                res.redirect(req.get('referer'));
            }

            console.log('1')

            console.log(result.deliveryStatus)
            console.log(deliveryStatus)
            if (result.deliveryStatus == deliveryStatus) {
                console.log('2')
                if (deliveryDate != null && result.deliveryDate != null) {
                    if (deliveryDate.getTime() < result.orderDate.getTime()) {
                        console.log("error: delivery date earlier than order date");
                        res.redirect(req.get('referer'));
                        return;
                    }
                }

                Order.updateOne({_id: _id}, {
                    deliveryStatus: deliveryStatus,
                    deliveryDate: deliveryDate
                }).then((a) => {
                    res.redirect(req.get('referer'));
                })
            }

            if (result.deliveryStatus == 'PROCESSING' && deliveryStatus == 'DELIVERED') {
                console.log('32323')
                let deficits = new Array()
                checkDeficit(result.orderItems, deficits).then((a) => {
                    console.log(deficits)
                    if (deficits.length > 0) {
                        console.log('admincartcontroller: order has deficit. cannot update to delivered');
                        res.redirect(req.get('referer'));
                        return;
                    }


                    updateProductStats(result.orderItems).then((a) => {
                        Order.updateOne({_id: _id}, {
                            deliveryStatus: deliveryStatus,
                            deliveryDate: deliveryDate
                        }).then((a) => {
                            res.redirect(req.get('referer'))
                        })
                    })
                })
            }
          })
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

        console.log(deliveryDate)
        if (deliveryDate == null) {
            res.send(true);
            return;
        }

        Order.findById(_id, function(err, result) {
            if (!result) {
                console.log(err);
                res.redirect(req.get('referer'));
                return;
            }

            res.send(!(deliveryDate.getTime() < result.orderDate.getTime()));
            return;

            
        })
    },
    
    checkDeliveryStatusUpdate: function(req, res) {
        if (!(req.session.user && req.cookies.user_sid)) {
            res.redirect('/login');
            return;
        }


        let _id =  sanitize(req.body._id);
        let deliveryStatus = sanitize(req.body.deliveryStatus);

        Order.findOne({_id: _id})
            .populate('orderItems')
            .exec(function(err, result) {
                if (!result) {
                    console.log(err)
                    res.redirect(req.get('referer'));
                    return;
                }
                
                console.log(result.deliveryStatus);
                console.log(deliveryStatus)
                if (result.deliveryStatus == deliveryStatus) {
                    res.send(false);
                    return;
                }

                let deficits = new Array()
                checkDeficit(result.orderItems, deficits).then((a) => {
                    let hasDeficit = deficits.length > 0;
                    res.send(hasDeficit);
                })
            })
    }
};

async function updateProductStats(orderItems) {
    for (let i = 0; i < orderItems.length; i++) {
        let _id = orderItems[i].product;
        let s = orderItems[i].smallAmount;
        let m = orderItems[i].mediumAmount;
        let l = orderItems[i].largeAmount;
        let xl = orderItems[i].extraLargeAmount;

        await Product.updateOne({_id: _id}, {
            $inc: {
                smallSold: s,
                mediumSold: m,
                largeSold: l,
                extraLargeSold: xl,

                smallAvailable: -s,
                mediumAvailable: -m,
                largeAvailable: -l,
                extraLargeAvailable: -xl
            }
        })
    }
}

async function checkDeficit(orderResultItems, d) {
    for (let i = 0; i < orderResultItems.length; i++) {
        let productResult = await Product.findOne(orderResultItems[i].product);
        let smallDeficit = productResult.smallAvailable < orderResultItems[i].smallAmount ? (orderResultItems[i].smallAmount - productResult.smallAvailable) : 0;
        let mediumDeficit = productResult.mediumAvailable < orderResultItems[i].mediumAmount ? (orderResultItems[i].mediumAmount - productResult.mediumAvailable) : 0;
        let largeDeficit = productResult.largeAvailable < orderResultItems[i].largeAmount ? (orderResultItems[i].largeAmount - productResult.largeAvailable) : 0;
        let extraLargeDeficit = productResult.extraLargeAvailable < orderResultItems[i].extraLargeAmount ? (orderResultItems[i].extraLargeAmount - productResult.extraLargeAvailable) : 0;

        if (smallDeficit > 0 || mediumDeficit > 0 || largeDeficit > 0 || extraLargeDeficit > 0) {
            d.push(1);
            return;
        }
    
    }
}

async function getOrderItems(orderResultItems, orderItems) {
    for (let i = 0; i < orderResultItems.length; i++) {
        let productResult = await Product.findOne({_id: orderResultItems[i].product});
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