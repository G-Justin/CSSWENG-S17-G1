const Order = require('../model/order.js');

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
        .select('_id firstname lastname paymentStatus deliveryStatus')
        .lean()
        .exec(function (err, results) {
            res.render('admin/orders', {
                title: 'Facemustph | Orders',
                layout: 'main',

                orderCards: results
            });
        });
        
    }
}

module.exports = ordersController;