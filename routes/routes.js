const express = require('express');
const app = express();
const database = require('../model/database.js');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

//Multer image processing
var multer = require('multer');
var storage = multer.diskStorage({
    destination:  './public/productimgs',
    filename: function(req, file, cb) {
        cb(null, file.originalname)
    }
}),
productImageUpload = multer({ storage: storage }).single('newProductImage');

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
app.post('/admin/production/addJobOrder', productionController.addJobOrder)
app.post('/admin/production/validateNewJobOrder', productionController.validateNewJobOrder);
app.post('/admin/production/updateJobOrderStatus', productionController.updateJobOrderStatus);
app.post('/admin/production/resolveJobOrder', productionController.resolveJobOrder)
app.post('/admin/production/updateRemarks', productionController.updateRemarks)

const inventoryController = require('../controller/inventoryController.js');
app.get('/admin/inventory', inventoryController.getInventoryPage);
app.post('/admin/inventory/addProduct', inventoryController.addProduct);
app.post('/admin/inventory/validateNewProduct', inventoryController.validateNewProduct);
app.post('/admin/inventory/updateStock', inventoryController.updateStock);
app.post('/admin/inventory/validateStockUpdate', inventoryController.validateStockUpdate);
app.post('/admin/inventory/phaseOut', inventoryController.phaseOut);
app.get('/admin/inventory/phasedout', inventoryController.getPhasedOut);
app.get('/getProductImage', inventoryController.getProductImage)
app.post('/updateProductImage', productImageUpload, inventoryController.updateProductImage)
app.post('/admin/inventory/phaseInProduct', inventoryController.phaseIn);
app.get('/inventory/requestProductDetails', inventoryController.requestProductDetails);

const adminCartController = require('../controller/adminCartController.js');
app.get('/admin/orders/:_id', adminCartController.getOrder);
app.post('/admin/cart/checkDeliveryUpdate', adminCartController.checkDeliveryUpdate);
app.post('/admin/orders/updateShippingFee', adminCartController.updateShippingFee);
app.post('/admin/orders/updateDeliveryStatus', adminCartController.updateDeliveryStatus);
app.post('/admin/orders/updatePaymentStatus', adminCartController.updatePaymentStatus);
app.post('/admin/cart/checkDeliveryStatusUpdate', adminCartController.checkDeliveryStatusUpdate)
app.post('/admin/orders/void', adminCartController.voidOrder);
app.get('/admin/cart', (request, res) => {
    res.render('admin/cart',  { title: 'Cart Dashboard' });
});

const customerCartController = require('../controller/customerCartController.js');
app.get('/cart', customerCartController.getCustomerPage);
app.post('/cart/getData', customerCartController.getData);

//customer

const mainCustomerController = require('../controller/mainCustomerController.js');
app.get('', mainCustomerController.getMainCustomerPage)
app.get('/', mainCustomerController.getMainCustomerPage)


app.get('/checkout', function(req, res) {
    res.render('customer/checkout', {title: "Checkout"})
})

app.get('/item', function(req, res) {
    res.render('customer/item', {title: "View Item"})
})

const specificProductController = require('../controller/specificProductController.js');
app.get('/item/:_id', specificProductController.getSpecificProduct);

const trackOrderController = require('../controller/trackOrderController.js');
app.get('/track/', trackOrderController.trackOrder);

app.post('/editProductDetails', function(req, res) {
    res.redirect(req.get('referer'))
})


module.exports = app;