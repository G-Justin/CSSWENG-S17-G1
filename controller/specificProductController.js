const session = require('express-session');
const sanitize = require('mongo-sanitize');
const Product = require('../model/product.js');

const specificProductController = {
    getSpecificProduct: function(req, res) {

        let _id = sanitize(req.params._id);
        Product.findOne({_id: _id})
            .lean()
            .exec(function(err, productResult) {
                if (!productResult) {
                    res.render('error', {
                        title: 'Facemust',
                        error: '404',
                        message: 'PRODUCT DOES NOT EXIST',
                        customer: true
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
                                message: 'AN ERROR OCCURRED',
                                customer: true
                            });
                            return;
                        }

                        res.render('customer/item', {
                            title: productResult.style + "| " + productResult.description,
                            
                            _id: productResult._id,
                            style: productResult.style,
                            description: productResult.description,
                            color: productResult.color,
                            price: productResult.price,
                            image: productResult.image,
                            customer: true,

                            variations: variationsResult
                        })
                    } )
        
            })
        
        
    }
}

module.exports = specificProductController;