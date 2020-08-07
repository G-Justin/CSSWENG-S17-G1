const Order = require('../model/order.js');
const sanitize = require('mongo-sanitize');

const CARD_SELECT = '_id firstname lastname paymentStatus deliveryStatus deliveryDate';

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

                orderCards: results
            });
        });  
    },

    getFilteredOrderPage: function(req, res) {
        if (!(req.session.user && req.cookies.user_sid)) {
            res.redirect('/login');
            return;
        }

        let filters = {
            deliveryStatus: sanitize(req.query.deliveryStatus),
            paymentStatus: sanitize(req.query.paymentStatus),
        };

        let dateStart = parseDate(sanitize(req.query.dateStart));
        let dateEnd = parseDate(sanitize(req.query.dateEnd));

        Order.find(filters)
        .select(CARD_SELECT)
        .lean()
        .exec(function(err, results) {
            let filteredOrders = new Array();
           
            for (let i = 0; i < results.length; i++) {
                let dateCopy = results[i].deliveryDate;
                dateCopy.setHours(12, 0, 0, 0);

                if (dateCopy >= dateStart && dateCopy <= dateEnd) {
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
    var b = s.split(/\D/);
    let date = new Date(b[0], --b[1], b[2]);
    date.setHours(12, 0, 0, 0);

    return date;
  }

module.exports = ordersController;