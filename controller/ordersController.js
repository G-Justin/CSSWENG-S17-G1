const moment = require('moment');
const Order = require('../model/order.js');
const sanitize = require('mongo-sanitize');
const { filter } = require('async');

const CARD_SELECT = '_id paymentStatus deliveryStatus orderDate';

const ordersController = {
    getOrderpage: function(req, res) {
        if (!(req.session.user && req.cookies.user_sid)) {
            res.redirect('/login');
            return;
        }
        
        if (req.query.orderId != null) {
            let orderId = req.query.orderId;
            res.redirect('/admin/orders/' + orderId.trim());
            return;
        }

        Order.find({})
        .select(CARD_SELECT)
        .lean()
        .exec(function (err, results) {
            res.render('admin/orders', {
                title: 'Facemustph | Orders',
                layout: 'main',

                orderCards: results,

                paginator: {
                    limit: 10, // This key:value pair is required.
                    defaultPage: 'posts', // This key:value pair defaults to 'posts' if not set.
                    currentPage: 1, // This key:value pair is required.
                    totalPages: 20, // This key:value pair is required.
                }
            });
        });  
    },

    getFilteredOrderPage: function(req, res) {
        if (!(req.session.user && req.cookies.user_sid)) {
            res.redirect('/login');
            return;
        }

        let deliveryQueries = new Array();
        let paymentQueries = new Array();

        let deliveryStatus = sanitize(req.query.deliveryStatus);
        if (deliveryStatus == 'SELECT') {
            deliveryQueries.push('PROCESSING', 'DELIVERING', 'DELIVERED');
        } else {
            deliveryQueries.push(deliveryStatus);
        }


        let paymentStatus = sanitize(req.query.paymentStatus);
        if (paymentStatus == 'SELECT') {
            paymentQueries.push('TO PAY', 'PAID');
        } else {
            paymentQueries.push(paymentStatus);
        }

        let dateStart = parseDate(sanitize(req.query.dateStart));
        let dateEnd = parseDate(sanitize(req.query.dateEnd));
        let hasDateQuery = dateStart != null && dateEnd != null;

        Order.find({
            deliveryStatus: {$in: deliveryQueries},
            paymentStatus: {$in : paymentQueries}
        })
        .select(CARD_SELECT)
        .lean()
        .exec(function(err, results) {
            console.log(results)
            let filteredOrders = new Array();
           
            for (let i = 0; i < results.length; i++) {
                if (hasDateQuery) {
                    let dateCopy = results[i].orderDate;
                    dateCopy.setHours(12, 0, 0, 0);

                    if (dateCopy >= dateStart && dateCopy <= dateEnd) {
                        filteredOrders.push(results[i]);
                    }
                } else {
                    filteredOrders.push(results[i]);
                }
                
            }

            res.render('admin/orders', {
                title: 'Facemustph | Orders',
                layout: 'main',

                orderCards: filteredOrders
            });  
        })
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

module.exports = ordersController;