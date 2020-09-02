const Product = require('../model/product.js');
const InventoryRecord = require('../model/inventoryRecord.js');
const sanitize = require('mongo-sanitize');
const PAGE_LIMIT = 10;

const inventoryController = {
    getInventoryPage: function(req, res) {
        if (!(req.session.user && req.cookies.user_sid)) {
            res.redirect('/login');
            return;
        }

        getInventory(req, res, false);
    },

    getPhasedOut: function(req, res) {
        if (!(req.session.user && req.cookies.user_sid)) {
            res.redirect('/login');
            return;
        }

        getInventory(req, res, true);
    },

    addProduct: function(req, res) {
        if (!(req.session.user && req.cookies.user_sid)) {
            res.redirect('/login');
            return;
        }

        let style = sanitize(req.body.newProductStyle);
        let color = sanitize(req.body.newProductColor);
        let description = sanitize(req.body.newProductDescription);
        let price = sanitize(req.body.newProductPrice);
        let s = sanitize(req.body.newProductS);
        let m = sanitize(req.body.newProductM);
        let l = sanitize(req.body.newProductL);
        let xl = sanitize(req.body.newProductXl);

        if (isEmpty(style) || isEmpty(color) || isEmpty(price) || isEmpty(description) ||
        isEmpty(s) || isEmpty(m) || isEmpty(l) || isEmpty(xl)) {
            res.redirect('/admin/inventory');
            return;
        };

        if (!isValidNumberInput(price) || !isValidNumberInput(s) || !isValidNumberInput(m) || !isValidNumberInput(l) || !isValidNumberInput(xl)) {
            console.log("Stock and price inputs are invalid");
            return;
        }

        if (s % 1 != 0 || m % 1 != 0 || l % 1 != 0 || xl % 1 != 0) {
            console.log('numbers must be whole')
            return;
        }

        style = style.trim().toUpperCase();
        color = color.trim().toUpperCase();
        description = description.trim().toUpperCase();

        if (style.length > 16 || color.length > 16 || description.length > 20) {
            console.log('style/color/description exceeds maximum allowed characters');
            res.redirect(req.get('referer'));
            return;
        }

        Product.exists({style: style, color: color, description: description}, function(err, exists) {
            if (exists) {
                console.log("Product already exists: " + style + " " + color + " " + description);
                res.redirect('/admin/inventory');
                return;
            }

            let product = {
                style: style,
                color: color,
                description: description,
                price: price.trim().toUpperCase(),
                smallAvailable: s,
                mediumAvailable: m,
                largeAvailable: l,
                extraLargeAvailable: xl,
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
        let description = sanitize(req.body.description);

        let query = {
            style: style.trim().toUpperCase(),
            color: color.trim().toUpperCase(),
            description: description.trim().toUpperCase()
        };

        Product.exists(query, function(err, result) {
            res.send(result);
        })
    },

    updateStock: function(req, res) {
        if (!(req.session.user && req.cookies.user_sid)) {
            res.redirect('/login');
            return;
        }

        let _id = sanitize(req.body.productId);
        let s = Number(sanitize(req.body.updateStockS));
        let m = Number(sanitize(req.body.updateStockM));
        let l = Number(sanitize(req.body.updateStockL));
        let xl = Number(sanitize(req.body.updateStockXL));
        
        if (s == "" && m == "" && l == "" && xl == "") {
            console.log("all update stock input fields are empty");
            res.redirect(req.get('referer'));
            return;
        }

        if(!isValidStockUpdate(s) || !isValidStockUpdate(m) || !isValidStockUpdate(l) || !isValidStockUpdate(xl)) {
            console.log('not valid stock update');
            res.redirect(req.get('referer'));
            return;
        }

        if (s % 1 != 0 || m % 1 != 0 || l % 1 != 0 || xl % 1 != 0) {
            console.log('numbers must be whole')
            return;
        }

        Product.findById(_id).exec(function(err, productResult) {
            if (!productResult) {
                console.log(err);
                return;
            }

            productResult.smallAvailable = productResult.smallAvailable + s;
            if (productResult.smallAvailable < 0) {
                console.log('exceeds small zero');
                res.redirect(req.get('referer'))
                return;
            }
            productResult.mediumAvailable = productResult.mediumAvailable + m;
            if (productResult.mediumAvailable < 0) {
                console.log('exceeds m zero');
                res.redirect(req.get('referer'))
                return;
            }
            productResult.largeAvailable = productResult.largeAvailable + l;
            if (productResult.largeAvailable < 0) {
                console.log('exceeds small zero');
                res.redirect(req.get('referer'))
                return;
            }
            productResult.extraLargeAvailable = productResult.extraLargeAvailable + xl;
            if (productResult.extraLargeAvailable < 0) {
                console.log('exceeds xl zero');
                res.redirect(req.get('referer'))
                return;
            }
            productResult.totalAvailable =  productResult.smallAvailable + productResult.mediumAvailable + productResult.largeAvailable + productResult.extraLargeAvailable;
            productResult.save();

            let inventoryRecord = new InventoryRecord({
                parentRecord: _id,
                smallUpdate: s,
                mediumUpdate: m,
                largeUpdate: l,
                extraLargeUpdate: xl
            });

            InventoryRecord.create(inventoryRecord, function(err, result) {
                if (!result) {
                    console.log(err);
                    return;
                }

                Product.update({_id: _id}, {
                    $push : {inventoryRecords: inventoryRecord._id}
                }).then((a) => {
                    console.log("Added record: " + result);
                    res.redirect(req.get('referer'))
                })
            })
        })
    },

    validateStockUpdate: function(req, res) {
        if (!(req.session.user && req.cookies.user_sid)) {
            res.redirect('/login');
            return;
        }

        let _id = sanitize(req.body._id);
        let s = Number(sanitize(req.body.s));
        let m = Number(sanitize(req.body.m));
        let l = Number(sanitize(req.body.l));
        let xl = Number(sanitize(req.body.xl));
        
        if(!isValidStockUpdate(s) || !isValidStockUpdate(m) || !isValidStockUpdate(l) || !isValidStockUpdate(xl)) {
            console.log('not valid stock update');
            res.redirect(req.get('referer'));
            return;
        }

        let data = {
            isValid: false,
            msg: ''
        }

        Product.findById(_id).exec(function(err, productResult) {
            if (!productResult) {
                data.msg = 'No product found with given id';
                res.send(data);
                return;
            }

            if ((productResult.smallAvailable + s) < 0) {
                data.msg = "Invalid subtraction: Current small stock is " + productResult.smallAvailable;
                res.send(data);
                return;
            }

            if ((productResult.mediumAvailable + m) < 0) {
                data.msg = "Invalid subtraction: Current medium stock is " + productResult.mediumAvailable;
                res.send(data);
                return;
            }

            if ((productResult.largeAvailable + m) < 0) {
                data.msg = "Invalid subtraction: Current large stock is " + productResult.largeAvailable;
                res.send(data);
                return;
            }

            if ((productResult.extraLargeAvailable + xl) < 0) {
                data.msg = "Invalid subtraction: Current extra-large stock is " + productResult.extraLargeAvailable;
                res.send(data);
                return;
            }

            data.isValid = true;
            res.send(data);
        })

    },

    phaseOut: function(req, res) {
        if (!(req.session.user && req.cookies.user_sid)) {
            res.redirect('/login');
            return;
        }
        
        let _id = sanitize(req.body.phaseOutId);

        Product.updateOne({_id: _id}, {
            isPhasedOut: true
        }, function(err, updateResult) {
            if (!updateResult) {
                console.log(err);
                res.redirect(req.get('referer'));
                return;
            }

            res.redirect('/admin/inventory/phasedout')
        })
    }
}

module.exports = inventoryController;

function getInventory(req, res, isPhasedOut) {
    let style = sanitize(req.query.style);
    let color = sanitize(req.query.color);
    let description = sanitize(req.query.description);
    let query = getQueries(style, color, description, isPhasedOut);
    let resultsMessage = getResultsMessage(style, color, description);
    let phasedOutUrlPiece = isPhasedOut ? "/phasedout" : "";

    let page = sanitize(req.query.page);
    if (page == null) {
        page = 1;
    }

    let options = {
        populate: 'inventoryRecords',
        lean: true,
        page: page,
        limit: PAGE_LIMIT,

        sort: {
            dateCreated: -1
        }
    };

    Product.paginate(query, options, function (err, results) {
        if (!results) {
            console.log('no products returned');
            console.log(results);
            return;
        }

        for (let i = 0; i < results.docs.length; i++) {
            results.docs[i].notPhasedOut = !isPhasedOut;
        }

        let selectOptions = new Array();
        for (let i = 0; i < results.totalPages; i++) {
            let no = i + 1;
            let options = {
                pageLink: "/admin/inventory" + phasedOutUrlPiece + "?style=" + style + "&color=" + color + "&page=" + no,
                pageNo: no,
                isSelected: (results.page == no)
            };

            selectOptions.push(options);
        }

        let prevPageLink = results.hasPrevPage ? "/admin/inventory" + phasedOutUrlPiece + "?style=" + style + "&color=" + color + "&page=" + results.prevPage : "";
        let nextPageLink = results.hasNextPage ? "/admin/inventory" + phasedOutUrlPiece + "?style=" + style + "&color=" + color + "&page=" + results.nextPage : "";
        res.render('admin/inventory', {
            title: 'Inventory',

            products: results.docs,
            resultsMessage: resultsMessage,
            notPhasedOut: !isPhasedOut,
            noResults: results.docs.length == 0,

            //pagination
            selectOptions: selectOptions,
            hasPrev: results.hasPrevPage,
            hasNext: results.hasNextPage,
            prevPageLink: prevPageLink,
            nextPageLink: nextPageLink
        });
    });
}

function getQueries(style, color, description, isPhasedOut) {
    let query = {isPhasedOut: isPhasedOut};

    if (!isEmpty(style)) {
        query.style = new RegExp(style, 'i')
    }

    if (!isEmpty(color)) {
        query.color = new RegExp(color, 'i')
    }

    if (!isEmpty(description)) {
        query.description = new RegExp(description, 'i');
    }

    return query;
    

    if(isEmpty(style) && isEmpty(color) && isEmpty(description)) {
        return query;
    }

    if (isEmpty(style) && !isEmpty(color)) {
        query = { color: new RegExp(color, 'i'), isPhasedOut: isPhasedOut };
        return query;
    } 
    
    if (isEmpty(color) && !isEmpty(style)) {
        query = { style: new RegExp(style, 'i'), isPhasedOut: isPhasedOut };
        return query;
    }

    if (!isEmpty(color) && !isEmpty(style)) {
        query = { color: new RegExp(color, 'i'), style: new RegExp(style, 'i'), isPhasedOut: isPhasedOut };
        return query;
    } 
     
}

function isEmptyNumberInput(input) {
    return input != "";
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

function getResultsMessage(style, color, description) {
    let styleMsg = !isEmpty(style) ? style : "";
    let colorMsg = !isEmpty(color) ? color : "";
    let descriptionMsg = !isEmpty(description) ? description : "";

    if (styleMsg == "" && colorMsg == "" && description == "") {
        return "";
    }

    return styleMsg + " " + colorMsg + " " + descriptionMsg;
}

function isValidNumberInput(n) {
    return Number(n) >= 0 && Number(n) < (Number.MAX_SAFE_INTEGER - 10);
}

function isValidStockUpdate(n) {
    return Number(n) > (Number.MIN_SAFE_INTEGER + 10)  && Number(n) < (Number.MAX_SAFE_INTEGER - 10);
}