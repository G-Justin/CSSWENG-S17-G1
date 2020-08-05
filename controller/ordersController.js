const ordersController = {
    getOrderpage: function(req, res) {
        if (!(req.session.user && req.cookies.user_sid)) {
            res.redirect('/login');
            return;
        }

        res.render('admin/orders', {
            title: 'Facemustph | Orders',
            layout: 'main'
        })
    }
}

module.exports = ordersController;