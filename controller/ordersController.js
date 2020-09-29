const moment = require('moment');
const Order = require('../model/order.js');
const OrderItem = require('../model/orderitem.js');
const Product = require('../model/product.js')
const sanitize = require('mongo-sanitize');
const { filter } = require('async');
const { options } = require('../routes/routes.js');
const orderitem = require('../model/orderitem.js');

const CARD_SELECT = '_id paymentStatus deliveryStatus orderDate';

const ordersController = {
    getFilteredOrderPage: function(req, res) {
        if (!(req.session.user && req.cookies.user_sid)) {
            res.redirect('/login');
            return;
        }

        let orderId = sanitize(req.query.orderId);
        if (orderId != null && orderId != "" && orderId != "undefined") {
            res.redirect('/admin/orders/' + orderId.trim());
            return;
        }
        
        let dateStart = parseDate(sanitize(req.query.dateStart));
        let dateEnd = parseDate(sanitize(req.query.dateEnd));
        let resultsMessage = getResultsMessage(dateStart, dateEnd)
        
        dateStart = (dateStart == null) ? new Date(-8640000000000000) : dateStart;
        dateEnd = (dateEnd == null) ? new Date(8640000000000000) : dateEnd;

        let query= {
            orderDate: {
                $gte: dateStart.toISOString(),
                $lte: dateEnd.toISOString()
            } 
        };

        Order.find(query)
            .sort({orderDate: -1})
            .exec((err, ordersResult) => {
                if (err) {
                    console.log('orderscontroller.js: err on querying for the orders')
                    res.render('error', {
                        title: 'Facemust',
                        error: '404',
                        message: 'AN ERROR OCCURRED'
                    })
                    return;
                }
                
                let orders = new Array();
                getOrders(ordersResult, orders).then((a) => {
                    res.render('admin/orders', {
                        title: 'Facemustph | Orders',
                        layout: 'main',
                        resultsMessage: resultsMessage,
        
                        orderCards: orders
        
                    });
                })
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

async function getOrders(ordersResult, orders) {
    for (let i = 0; i < ordersResult.length; i++) {
        let order = {
            _id: ordersResult[i]._id,
            firstname: ordersResult[i].firstname,
            lastname: ordersResult[i].lastname,
            paymentStatus: ordersResult[i].paymentStatus,
            deliveryStatus: ordersResult[i].deliveryStatus,
            hasDeficit: false
        }

        if(order.deliveryStatus == 'PROCESSING') {
            let orderItems = await OrderItem.find({parentOrder: order._id});
            for (let j = 0; j < orderItems.length; j++) {
                let product = await Product.findOne({_id: orderItems[j].product});
                if (!product) {
                    continue;
                }

                let smallDeficit = product.smallAvailable < orderItems[j].smallAmount ? (orderItems[j].smallAmount - product.smallAvailable) : 0;
                let mediumDeficit = product.mediumAvailable < orderItems[j].mediumAmount ? (orderItems[j].mediumAmount - product.mediumAvailable) : 0;
                let largeDeficit = product.largeAvailable < orderItems[j].largeAmount ? (orderItems[j].largeAmount - product.largeAvailable) : 0;
                let extraLargeDeficit = product.extraLargeAvailable < orderItems[j].extraLargeAmount ? (orderItems[j].extraLargeAmount - product.extraLargeAvailable) : 0;

                if (smallDeficit > 0 || mediumDeficit > 0 || largeDeficit > 0 || extraLargeDeficit > 0) {
                    order.hasDeficit = true;
                    break;
                } 
            }
        }

        orders.push(order);
    }
}

function getResultsMessage(dateStart, dateEnd) {
    let dateMsg;
    if (dateStart == null && dateEnd == null ) {
        dateMsg = "";
    } else if (dateStart != null && dateEnd == null) {
        dateMsg = " from " + formatDate(dateStart) + " to current date."
    } else if (dateStart == null && dateEnd != null) {
        dateMsg = " up to " + formatDate(dateEnd);
    } else if (dateStart !== null && dateEnd != null) {
        dateMsg = " between dates " + formatDate(dateStart) + " and " + formatDate(dateEnd);
    }


    return dateMsg;
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

function parseDate(s) {
    if (!(moment(s, 'YYYY-MM-DD', true).isValid())) {
        return null;
    }

    if (s == null || s === undefined) {
        return null;
    }
    var b = s.split(/\D/);
    let date = new Date(b[0], --b[1], b[2]);

    date.setHours(8, 0, 0, 0);
    return date;
}

module.exports = ordersController;