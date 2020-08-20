const moment = require('moment');
const Order = require('../model/order.js');
const sanitize = require('mongo-sanitize');
const { filter } = require('async');
const { options } = require('../routes/routes.js');

const CARD_SELECT = '_id paymentStatus deliveryStatus orderDate';

const ordersController = {
    getFilteredOrderPage: function(req, res) {
        if (!(req.session.user && req.cookies.user_sid)) {
            res.redirect('/login');
            return;
        }
        console.log('getFiltered request')
        let deliveryQueries = new Array();
        let paymentQueries = new Array();

        let deliveryStatus = sanitize(req.query.deliveryStatus);
        if (deliveryStatus == 'SELECT' || deliveryStatus == null) {
            deliveryQueries.push('PROCESSING', 'DELIVERING', 'DELIVERED');
        } else {
            deliveryQueries.push(deliveryStatus);
        }

        let paymentStatus = sanitize(req.query.paymentStatus);
        if (paymentStatus == 'SELECT' || paymentStatus == null) {
            paymentQueries.push('TO PAY', 'PAID');
        } else {
            paymentQueries.push(paymentStatus);
        }

        let dateStart = parseDate(sanitize(req.query.dateStart));
        let dateEnd = parseDate(sanitize(req.query.dateEnd));
        let hasDateQuery = dateStart != null && dateEnd != null;

        let page = Number(sanitize(req.query.page));
        if (page == null) {
            page = 1;
        }

        Order.find({
            deliveryStatus: {$in: deliveryQueries},
            paymentStatus: {$in : paymentQueries}
        })
        .select(CARD_SELECT)
        .skip((page - 1) * 2)
        .limit(2)
        .lean()
        .exec(function(err, results) {
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

            let selectOptions = new Array();
            for (let i = 0; i < Math.ceil(filteredOrders.length / 2); i++) {
                let no = i + 1;
                let options = {
                    pageLink: "/admin/orders?deliveryStatus=" + deliveryStatus + "&paymentStatus=" + paymentStatus + "&dateStart=" + req.query.dateStart + "&dateEnd=" + req.query.dateEnd + "&page=" + no,
                    pageNo: no
                };

                selectOptions.push(options);
            }

            res.render('admin/orders', {
                title: 'Facemustph | Orders',
                layout: 'main',

                orderCards: filteredOrders,
                selectOptions: selectOptions
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