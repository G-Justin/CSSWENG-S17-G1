const session = require('express-session');
const Product = require('../model/product.js');
const sanitize = require('mongo-sanitize');

const mainCustomerController = {
    getMainCustomerPage: function(req, res) {
        if (req.session.cart === null || req.session.cart === undefined) {
            req.session.cart = new Array();
        }

        let page = sanitize(req.query.page);
        if (page == null) {
            page = 1;
        }

        let options = {
            lean: true,
            page: page, 
            limit: 30, //test
            
            sort: {
                price: -1
            }
        };

        Product.paginate({}, options, function(err, productResults) {
            if (!productResults) {
                console.log(err);
                res.render('error', {
                    title: 'Facemust',
                    error: '404',
                    message: 'AN ERROR OCCURRED'
                })
                return;
            }

            let selectOptions = new Array();
            for (let i = 0; i < productResults.totalPages; i++) {
                let no = i + 1;
                let options = {
                    pageLink: "/?page=" + no,
                    pageNo: no,
                    isSelected: (productResults.page == no)
                };

                selectOptions.push(options);
            }

            let prevPageLink = productResults.hasPrevPage ? "/?page=" + productResults.prevPage: "";
            let nextPageLink = productResults.hasNextPage ? "/?page=" + productResults.nextPage: "";
            res.render('customer/main', {
                title: "Welcome to Facemustph!",
                products: productResults.docs,

                //pagination
                selectOptions: selectOptions,
                hasPrev: productResults.hasPrevPage,
                hasNext: productResults.hasNextPage,
                prevPageLink: prevPageLink,
                nextPageLink: nextPageLink
            })
        })
    }
}

module.exports = mainCustomerController;