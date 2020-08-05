const inventoryController = {
    getInventoryPage: function(req, res) {
        if (!(req.session.user && req.cookies.user_sid)) {
            res.redirect('/login');
            return;
        }

        res.render('admin/inventory',  { title: 'Inventory Dashboard' });
    }
}

module.exports = inventoryController;