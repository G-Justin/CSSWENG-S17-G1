const express = require('express');
const app = express();
const database = require('../model/database.js');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

//INIT COOKIE AND BODY
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.use(session({ // START COOKIE
    key: 'user_sid', //user session id
    secret: 'delasalle',
    resave: false,
    saveUninitialized: true,
    store: database.sessionStore,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 // 1 Day.
    }
}));

app.use((req, res, next) => { //LOGOUT / BREAK COOKIE
    if(req.cookies.user_sid && !req.session.user) {
        res.clearCookie('user_sid');
    }
    next();
});

const loginController = require('../controller/loginController.js');
app.get('/login', loginController.getLogin);
app.post('/login', loginController.postLogin);
app.get('/logout', function(req, res) {
    req.logout;
    req.session.destroy(function(err) { });
    res.redirect('/login');
});

const ordersController = require('../controller/ordersController.js');
app.get('/admin/orders', ordersController.getFilteredOrderPage);

const dashboardController = require('../controller/dashboardController.js');
app.get('/admin', dashboardController.getDashboard);

const productionController = require('../controller/productionController.js');
app.get('/admin/production', productionController.getProductionPage);

const inventoryController = require('../controller/inventoryController.js');
app.get('/admin/inventory', inventoryController.getInventoryPage);
app.post('/admin/inventory/addProduct', inventoryController.addProduct);
app.post('/admin/inventory/validateNewProduct', inventoryController.validateNewProduct);
app.post('/admin/inventory/updateStock', inventoryController.updateStock);
app.post('/admin/inventory/validateStockUpdate', inventoryController.validateStockUpdate);
app.post('/admin/inventory/phaseOut', inventoryController.phaseOut);
app.get('/admin/inventory/phasedout', inventoryController.getPhasedOut);

const adminCartController = require('../controller/adminCartController.js');
app.get('/admin/orders/:_id', adminCartController.getOrder);
app.post('/admin/orders/updateShippingFee', adminCartController.updateShippingFee);
app.post('/admin/orders/updateDeliveryStatus', adminCartController.updateDeliveryStatus);
app.post('/admin/orders/updatePaymentStatus', adminCartController.updatePaymentStatus);
app.post('/admin/orders/void', adminCartController.voidOrder);
app.get('/admin/cart', (request, res) => {
    res.render('admin/cart',  { title: 'Cart Dashboard' });
});

app.get('/cart', function(req, res) {
    res.render('customer/cart', {title: 'Cart'});
});



module.exports = app;