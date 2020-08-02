const ordersController = {
    getOrderpage: function(req, res) {
        if (!(req.session.user && req.cookies.user_sid)) {
            res.redirect('/admin');
            return;
        }

        res.render('orderpage', {
            active_session: (req.session.user && req.cookies.user_sid),
            active_user: req.session.user,
            title: 'Facemustph | Orders'
        })
    }
}

module.exports = ordersController;