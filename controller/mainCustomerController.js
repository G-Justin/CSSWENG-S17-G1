const session = require('express-session');
const Product = require('../model/product.js');

const mainCustomerController = {
    getMainCustomerPage: function(req, res) {
        if (req.session.cart === null || req.session.cart === undefined) {
            req.session.cart = new Array();
        }

        Product.find()
            .sort({totalSold: -1})
            .lean()
            .exec(function(err, productResults) {
                if (!productResults) {
                    console.log(err);
                    res.render('error', {
                        title: 'Facemust',
                        error: '404',
                        message: 'AN ERROR OCCURRED'
                    })
                    return;
                }

                res.render('customer/main', {
                    title: "Welcome to Facemustph!",
                    products: productResults
                })


            })
            
        
    }
}

module.exports = mainCustomerController;