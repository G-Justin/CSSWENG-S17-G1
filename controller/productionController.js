const productionController = {
    getProductionPage: function(req, res) {
        if (!(req.session.user && req.cookies.user_sid)) {
            res.redirect('/login');
            return;
        }

        res.render('admin/production', { title: 'Production Dashboard' });
    }
}

module.exports = productionController;