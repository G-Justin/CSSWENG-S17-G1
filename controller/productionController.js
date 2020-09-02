const sanitize = require("mongo-sanitize");

const productionController = {
    getProductionPage: function(req, res) {
        if (!(req.session.user && req.cookies.user_sid)) {
            res.redirect('/login');
            return;
        }

        let style = sanitize(req.query.style);
        let color = sanitize(req.query.color);
        let description = sanitize(req.query.description);
        let statusQueries = new Array();
        let statusQuery = sanitize(req.query.status);

        



        res.render('admin/production', { title: 'Production Dashboard' });
    }
}

module.exports = productionController;