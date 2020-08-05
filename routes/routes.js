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

//return;

const loginController = require('../controller/loginController.js');

app.get('/logout', function(req, res) {
    req.logout;
    req.session.destroy(function(err) { });
    res.redirect('/login');
});

app.get('/login', function(req, res) {
    res.render('login',{
        title: 'Log In',
        layout: 'auth'
    });
})

app.post('/login', loginController.postLogin);

//app.get('/admin', loginController.getLogin);
//app.post('/admin', loginController.postLogin);

const orderpageController = require('../controller/orderpageController.js');
//app.get('/admin/orders', orderpageController.getOrderpage);

app.get('/cart', function(req, res) {
    res.render('customer/cart', {title: 'Cart'});
});

app.get('/admin', function(req, res) {
    res.render('admin/dashboard', { title: 'Admin Dashboard' });
});

app.get('/admin/orders', function(req, res) {
    res.render('admin/orders', { title: 'Order Dashboard' });
});

app.get('/admin/production', (request, res) => {
    res.render('admin/production', { title: 'Production Dashboard' });
});

app.get('/admin/inventory', (request, res) => {
    res.render('admin/inventory',  { title: 'Inventory Dashboard' });
});

app.get('/admin/cart', (request, res) => {
    res.render('admin/cart',  { title: 'Cart Dashboard' });
});



module.exports = app;