const moment = require('moment');
const Order = require('../model/order.js');
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
        

        let deliveryQueries = new Array();
        let paymentQueries = new Array();

        let deliveryStatus = sanitize(req.query.deliveryStatus);
        if (deliveryStatus == 'SELECT' || deliveryStatus == null || deliveryStatus == 'undefined') {
            deliveryQueries.push('PROCESSING', 'DELIVERING', 'DELIVERED');
        } else {
            deliveryQueries.push(deliveryStatus);
        }

        let paymentStatus = sanitize(req.query.paymentStatus);
        if (paymentStatus == 'SELECT' || paymentStatus == null || paymentStatus == 'undefined') {
            paymentQueries.push('TO PAY', 'PAID');
        } else {
            paymentQueries.push(paymentStatus);
        }

        let dateStart = parseDate(sanitize(req.query.dateStart));
        let dateEnd = parseDate(sanitize(req.query.dateEnd));
        let resultsMessage = getResultsMessage(deliveryStatus, paymentStatus, dateStart, dateEnd)
        
        let page = sanitize(req.query.page);
        if (page == null) {
            page = 1;
        }

        let options = {
            select: CARD_SELECT,
            lean: true,
            page: page,
            limit: 3,

            sort: {
                orderDate: -1
            }
        };

        dateStart = (dateStart == null) ? new Date(-8640000000000000) : dateStart;
        dateEnd = (dateEnd == null) ? new Date(8640000000000000) : dateEnd;

        
        let query= {
            deliveryStatus: {$in: deliveryQueries},
            paymentStatus: {$in : paymentQueries},
            
            
            orderDate: {
                $gte: dateStart.toISOString(),
                $lte: dateEnd.toISOString()
            } 
        };

        
        Order.paginate(query, options, 
            function(err, results) {
            let filteredOrders = new Array();
           
            let selectOptions = new Array();
            for (let i = 0; i < results.totalPages; i++) {
                let no = i + 1;
                let options = {
                    pageLink: "/admin/orders?deliveryStatus=" + deliveryStatus + "&paymentStatus=" + paymentStatus + "&dateStart=" + req.query.dateStart + "&dateEnd=" + req.query.dateEnd + "&page=" + no,
                    pageNo: no,
                    isSelected: (results.page == no),
                };

                selectOptions.push(options);
            }

            let prevPageLink = results.hasPrevPage ? "/admin/orders?deliveryStatus=" + deliveryStatus + "&paymentStatus=" + paymentStatus + "&dateStart=" + req.query.dateStart + "&dateEnd=" + req.query.dateEnd + "&page=" + results.prevPage : ""
            let nextPageLink = results.hasNextPage ? "/admin/orders?deliveryStatus=" + deliveryStatus + "&paymentStatus=" + paymentStatus + "&dateStart=" + req.query.dateStart + "&dateEnd=" + req.query.dateEnd + "&page=" + results.nextPage : ""
            res.render('admin/orders', {
                title: 'Facemustph | Orders',
                layout: 'main',
                resultsMessage: resultsMessage,

                orderCards: results.docs,
                selectOptions: selectOptions,
                hasPrev: results.hasPrevPage,
                hasNext: results.hasNextPage,
                prevPageLink: prevPageLink,
                nextPageLink: nextPageLink

            });
        })
    }
}

function getResultsMessage(deliveryStatus, paymentStatus, dateStart, dateEnd) {
    let deliveryMsg;
    if (deliveryStatus == 'SELECT' || deliveryStatus == null || deliveryStatus == 'undefined') {
        deliveryMsg = "";
    } else {
        deliveryMsg = deliveryStatus;
    }

    let paymentMsg;
    if (paymentStatus == 'SELECT' || paymentStatus == null || paymentStatus == 'undefined') {
        paymentMsg = "";
    } else {
        paymentMsg = paymentStatus;
    }

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


    return deliveryMsg + " " + paymentMsg + " " + dateMsg;
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