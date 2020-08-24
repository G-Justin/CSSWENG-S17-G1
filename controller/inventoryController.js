const Product = require('../model/product.js');
const sanitize = require('mongo-sanitize');
const { Mongoose } = require('mongoose');
const PAGE_LIMIT = 10;

const inventoryController = {
    getInventoryPage: function(req, res) {
        if (!(req.session.user && req.cookies.user_sid)) {
            res.redirect('/login');
            return;
        }

        let style = sanitize(req.query.style);
        let color = sanitize(req.query.color);
        let query = getQueries(style, color);

        let page = sanitize(req.query.page);
        if (page == null) {
            page = 1;
        }

        let options = {
            //select: '_id totalAvailable style color',
            lean: true,
            page: page,
            limit: PAGE_LIMIT
        };

        Product.paginate(query, options, function(err, results){
            if (!results) {
                console.log('no products returned');
                console.log(results)
                return;
            }
            let selectOptions = new Array();
            console.log(results.totalPages)
            for (let i = 0; i < results.totalPages; i++) {
                let no = i + 1;
                let options = {
                    pageLink: "/admin/inventory?style=" + style + "&color=" + color + "&page=" + no,
                    pageNo: no,
                    isSelected: (results.page == no),
                };

                selectOptions.push(options);
            }

            let prevPageLink = results.hasPrevPage ? "/admin/inventory?style=" + style + "&color=" + color + "&page=" + results.prevPage : "";
            let nextPageLink = results.hasNextPage ? "/admin/inventory?style=" + style + "&color=" + color + "&page=" + results.nextPage : "";
            res.render('admin/inventory', {
                title: 'Inventory',

                products: results.docs,

                //pagination
                selectOptions: selectOptions,
                hasPrev: results.hasPrevPage,
                hasNext: results.hasNextPage,
                prevPageLink: prevPageLink,
                nextPageLink: nextPageLink
            })
        })
    },

    addProduct: function(req, res) {
        if (!(req.session.user && req.cookies.user_sid)) {
            res.redirect('/login');
            return;
        }

        let style = sanitize(req.body.newProductStyle);
        let color = sanitize(req.body.newProductColor);
        let price = sanitize(req.body.newProductPrice);
        let s = sanitize(req.body.newProductS);
        let m = sanitize(req.body.newProductM);
        let l = sanitize(req.body.newProductL);
        let xl = sanitize(req.body.newProductXl);

        console.log(style + " " + color + " " + s + " " + m + " " + l + " " + xl);

        if (isEmpty(style) || isEmpty(color) || isEmpty(price) ||
        isEmpty(s) || isEmpty(m) || isEmpty(l) || isEmpty(xl)) {
            res.redirect('/admin/inventory');
            return;
        };

        if (!isValidNumberInput(price) || !isValidNumberInput(s) || !isValidNumberInput(m) || !isValidNumberInput(l) || !isValidNumberInput(xl)) {
            console.log("Stock and price inputs are invalid");
            return;
        }

        style = style.trim().toUpperCase();
        color = color.trim().toUpperCase();

        Product.exists({style: style, color: color}, function(err, exists) {
            if (exists) {
                console.log("Product already exists: " + style + " " + color);
                res.redirect('/admin/inventory');
                return;
            }

            let product = {
                style: style,
                color: color,
                price: price.trim().toUpperCase(),
                s: s,
                m: m,
                l: l,
                xl: xl,
                totalAvailable: Number(s) + Number(m) + Number(l) + Number(xl)
            };
    
            Product.create(product, function(err, result) {
                if (!result) {
                    console.log(err);
                    return;
                }
    
                console.log("Added new product: " + result);
    
                res.redirect('/admin/inventory');
            })
        })
    },

    validateNewProduct: function(req, res) {
        let style = sanitize(req.body.style);
        let color = sanitize(req.body.color);

        let query = {
            style: style.trim().toUpperCase(),
            color: color.trim().toUpperCase()
        };

        Product.exists(query, function(err, result) {
            res.send(result);
        })
    }
}

module.exports = inventoryController;

function getQueries(style, color) {
    let query = {};

    if(isEmpty(style) && isEmpty(color)) {
        return query;
    }

    if (isEmpty(style) && !isEmpty(color)) {
        query = { color: new RegExp(color, 'i') };
        return query;
    } 
    
    if (isEmpty(color) && !isEmpty(style)) {
        query = { style: new RegExp(style, 'i') };
        return query;
    }

    if (!isEmpty(color) && !isEmpty(style)) {
        query = { color: new RegExp(color, 'i'), style: new RegExp(style, 'i') };
        return query;
    } 
     
}

function isEmpty(input) {
    if (input === null) {
        return true;
    }

    if (input === undefined) {
        return true;
    }

    if (input.trim() == "undefined") {
        return true;
    }

    if (input.trim() == "") {
        return true;
    }

    return false;
}

function isValidNumberInput(n) {
    return Number(n) >= 0 && Number(n) < (Number.MAX_SAFE_INTEGER - 10);
}