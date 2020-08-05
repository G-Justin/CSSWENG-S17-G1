const session = require('express-session');

const dashboardController = {
    getDashboard: function(req, res) {
        if (!(req.session.user && req.cookies.user_sid)) {
            res.redirect('/login');
            return;
        }

        res.render('admin/dashboard', 
        {
            title: 'Admin Dashboard'
        });
    }
}

module.exports = dashboardController;