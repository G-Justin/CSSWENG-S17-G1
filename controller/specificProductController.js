const session = require('express-session');
const sanitize = require('mongo-sanitize');
const Product = require('../model/product.js');

const specificProductController = {
    getDashboard: function(req, res) {
        if (!(req.session.user && req.cookies.user_sid)) {
            res.redirect('/login');
            return;
        }

        res.render('admin/dashboard', 
        {
            title: 'Admin Dashboard'
        });
    },

    getSpecificProduct: function(req, res) {
        if (req.session.cart === null || req.session.cart === undefined) {
            req.session.cart = new Array();
        }

        let _id = sanitize(req.params._id);
        Product.findOne({_id: _id})
            .lean()
            .exec(function(err, productResult) {
                if (!productResult) {
                    res.render('error', {
                        title: 'Facemust',
                        error: '404',
                        message: 'PRODUCT DOES NOT EXIST'
                    })
                    return;
                }

                Product.find({style: productResult.style, description: productResult.description})
                    .lean()
                    .exec(function(err, variationsResult) {
                        if (!variationsResult) {
                            console.log("specificProductController error");
                            console.log(err)
                            res.render('error', {
                                title: 'Facemust',
                                error: '404',
                                message: 'AN ERROR OCCURRED'
                            });
                            return;
                        }

                        res.render('customer/item', {
                            title: productResult.style + "| " + productResult.description,

                            style: productResult.style,
                            description: productResult.description,
                            color: productResult.color,
                            price: productResult.price,
                            image: productResult.image,

                            variations: variationsResult
                        })
                    } )
        
            })
        
        
    }
}

module.exports = specificProductController;