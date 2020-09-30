const session = require('express-session');
const Product = require('../model/product.js');
const sanitize = require('mongo-sanitize');
const async = require('async')

const mainCustomerController = {
    getMainCustomerAscending: function(req, res) {
        getCustomerPage(req, res, true)
    },
    getMainCustomerPage: function(req, res) {
        
        getCustomerPage(req, res, false);
    }
}

module.exports = mainCustomerController;

function getCustomerPage(req, res, ascending) {
    let selectDescription = sanitize(req.query.selectDescription);
    let description = getArrayQuery(selectDescription);
    let descriptionUrlPiece = getUrlPiece(description, "selectDescription");

    let selectColor = sanitize(req.query.selectColor);
    let color = getArrayQuery(selectColor);
    let colorUrlPiece = getUrlPiece(color, "selectColor");

    let minPrice = sanitize(req.query.minPrice);
    let maxPrice = sanitize(req.query.maxPrice);

    let page = sanitize(req.query.page);
    if (page == null) {
        page = 1;
    }

    let query = getQuery(description, color, minPrice, maxPrice);
    let priceSort = ascending ? 1 : -1;
    let options = {
        lean: true,
        page: page,
        limit: 30,

        sort: {
            price: priceSort
        }
    };

    let sort = ascending ? "ASC" : "DSC";
    Product.paginate(query, options, function (err, productResults) {
        if (!productResults) {
            console.log(err);
            res.render('error', {
                title: 'Facemust',
                error: '404',
                message: 'AN ERROR OCCURRED',
                customer: true
            });
            return;
        }

        let pagePiece = ascending ? "/ascending" : "";
        Product.find().select('description color').exec((err, selectors) => {
            let descriptions = new Set();
            for (let i = 0; i < selectors.length; i++) {
                descriptions.add(selectors[i].description);
            }

            let colors = new Set();
            for (let i = 0; i < selectors.length; i++) {
                colors.add(selectors[i].color);
            }

            let selectOptions = new Array();
            for (let i = 0; i < productResults.totalPages; i++) {
                let no = i + 1;
                let options = {
                    pageLink: pagePiece + "/?page=" + no + descriptionUrlPiece + colorUrlPiece + "&minPrice=" + minPrice + "&maxPrice=" + maxPrice,
                    pageNo: no,
                    isSelected: (productResults.page == no)
                };

                selectOptions.push(options);
            }

            let prevPageLink = productResults.hasPrevPage ? pagePiece + "/?page=" + productResults.prevPage + descriptionUrlPiece + colorUrlPiece + "&minPrice=" + minPrice + "&maxPrice=" + maxPrice : "";
            let nextPageLink = productResults.hasNextPage ? pagePiece + "/?page=" + productResults.nextPage + descriptionUrlPiece + colorUrlPiece + "&minPrice=" + minPrice + "&maxPrice=" + maxPrice : "";
            Product.find()
                .sort({ price: -1 })
                .lean()
                .exec((err, highestPrice) => {

                    res.render('customer/main', {
                        title: "Welcome to Facemustph!",
                        products: productResults.docs,
                        maxPrice: highestPrice[0].price,
                        productSelect: highestPrice,
                        noResults: productResults.docs.length == 0,
                        descriptions: descriptions,
                        colors: colors,
                        customer: true,
                        sort: sort,


                        //pagination
                        selectOptions: selectOptions,
                        hasPrev: productResults.hasPrevPage,
                        hasNext: productResults.hasNextPage,
                        prevPageLink: prevPageLink,
                        nextPageLink: nextPageLink
                    });
                });

        });


    });
}

function getQuery(description, color, minPrice, maxPrice) {
    let query = {};

    if (description != null && description.length > 0) {
        query.description = {$in: description};
    }

    if (color != null && color.length > 0) {
        query.color = {$in: color};
    }

    if (minPrice == null || minPrice == "undefined") {
        minPrice = 0;
    }

    if (maxPrice == null || maxPrice == "undefined") {
        query.price = {$gte: minPrice}
    } else {
        query.price = {$gte: minPrice, $lte: maxPrice}
    }
    return query;

}

function getArrayQuery(data) {
    if (data == null || data == "undefined" || data == undefined) {
        return new Array();
    }

    let query = new Array();
    if (Array.isArray(data)) {
        query.push(...data);
    } else {
        query.push(data);
    }

    return query;
}

function getUrlPiece(data, type) {
    let query = "&" + type + "=";
    let urlPiece = "";

    if (Array.isArray(data)) {
        for (let i = 0; i < data.length; i++) {
            urlPiece = urlPiece + "&selectDescription=" + data[i];
        }
    }
    else {
        urlPiece = "&selectDescription=" + data;
    }
    
    return urlPiece;
}
