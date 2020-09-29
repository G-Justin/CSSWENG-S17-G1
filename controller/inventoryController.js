const Product = require('../model/product.js');
const InventoryRecord = require('../model/inventoryRecord.js');
const OrderItem = require("../model/orderitem.js");
const Order = require('../model/order.js');
const sanitize = require('mongo-sanitize');
const orderitem = require('../model/orderitem.js');
const { findSeries } = require('async');
const fs = require('fs')
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

        Product.findOne(query)
            .select('isPhasedOut')
            .exec(function(err, result) {
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
                color: productResult.color,
                style: productResult.style,
                description: productResult.description,
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
    },

    phaseIn: function(req, res) {
        if (!(req.session.user && req.cookies.user_sid)) {
            res.redirect('/login');
            return;
        }

        let _id = sanitize(req.body.productId);

        Product.updateOne({_id: _id}, {
            isPhasedOut: false
        }, function(err, updateResult) {
            if (!updateResult) {
                console.log(err);
                res.redirect(req.get('referer'));
                return;
            }

            res.redirect('/admin/inventory')
        })
    },

    getProductImage: function(req, res) {
        if (!(req.session.user && req.cookies.user_sid)) {
            res.redirect('/login');
            return;
        }

        let _id = sanitize(req.query._id);
        Product.findById(_id)
        .select('image')
        .exec((err, result) => {
            res.send(result.image);
        })
    },

    updateProductImage: function(req, res) {
        if (!(req.session.user && req.cookies.user_sid)) {
            res.redirect('/login');
            return;
        }

        let file = req.file;
        let _id = sanitize(req.body.editImageProductId);
        
        if (!file) {
            res.redirect(req.get('referer'));
            return;
        }

        if (file.size > (1048576 * 2)) {
            res.redirect(req.get('referer'));
            return;
        }

        let imageName = renameImage(file, _id);

        updateImage(_id, imageName, res).then((a) => {
            res.redirect(req.get('referer'));
        })
    },

    getProductDetails: function(req, res) {
        if (!(req.session.user && req.cookies.user_sid)) {
            res.redirect('/login');
            return;
        }

        let _id = sanitize(req.query._id);

        Product.findOne({_id: _id})
            .select('image style description color price')
            .exec(function(err, result) {
                if (!result) {
                    console.log("no product found");
                    res.redirect(req.get('referer'));
                    return;
                }

                res.send(result);
            })
    }

}

module.exports = inventoryController;

async function updateImage(_id, imageName, res) {
    let extension = imageName.substring(imageName.lastIndexOf("."))
    let filename = imageName.split('.').slice(0, -1).join('.');
    
    Product.updateOne({_id: _id}, {image: imageName}, function(err, result) {
        if (!result) {
            console.log(err);
            res.redirect(req.get('referer'));
        }
        switch (extension) {
            case '.jpg':
                fs.unlink('./public/productimgs/' + filename + '.png', (fds) => {});
                fs.unlink('./public/productimgs/' + filename + '.jpeg', (fds) => {});
                break;
            case '.png': 
                fs.unlink('./public/productimgs/' + filename + '.jpg', (fds) => {});
                fs.unlink('./public/productimgs/' + filename + '.jpeg', (fds) => {});
                break;
            case '.jpeg':
                fs.unlink('./public/productimgs/' + filename + '.png', (fds) => {});
                fs.unlink('./public/productimgs/' + filename + '.jpg', (fds) => {});
                break;
        }
    })
}

function renameImage(file, newName) {
    let original = file.originalname;
    let extension = original.substring(original.lastIndexOf("."));
    const newUrl = file.destination + '/' + newName + extension;

    fs.renameSync(file.path, newUrl);
    return newName + extension;
}


function getInventory(req, res, phasedOut) {

    Product.find({isPhasedOut: phasedOut})
        .sort({dateCreated: -1})
        .lean()
        .exec(function(err, productResults) {
            if (!productResults) {
                console.log("Inventory controller error: no products returned");
                res.redirect(req.get('referer'));
                return;
            }

            for (let i = 0; i < productResults.length; i++) {
                productResults[i].notPhasedOut = !phasedOut;
            }

            updateDeficits(productResults).then((a) => {
                InventoryRecord.find()
                    .sort({date: -1})
                    .lean()
                    .exec(function(err, inventoryRecordsResult) {
                        if (!inventoryRecordsResult) {
                            console.log("Inventory Controller: no records returned");
                            res.redirect(req.get('referer'));
                            return;
                        }

                        res.render('admin/inventory', {
                            title: 'Inventory',
                
                            products: productResults,
                            inventoryRecords: inventoryRecordsResult,
                            notPhasedOut: !phasedOut,
                        });                  
                    })
            })
        })
}

async function getInventoryRecords(inventoryRecords, results) {
    for (let i = 0; i < results.length; i++) {
        let product = await Product.findOne({_id: results[i].parentRecord});
        
        if (!product) {
            console.log("did not find the parent product record for a log");
            continue;
        }

        let inventoryRecord = {
            parentRecord: product._id,
            color: product.color,
            style: product.style,
            description: product.description,
            date: results[i].date,
            smallUpdate: results[i].smallUpdate,
            mediumUpdate: results[i].mediumUpdate,
            largeUpdate: results[i].largeUpdate,
            extraLargeUpdate: results[i].extraLargeUpdate,
            extraLargeUpdate: results[i].extraLargeUpdate,
        }

        inventoryRecords.push(inventoryRecord);
    }
}

async function updateDeficits(products) {
    for (let i = 0; i < products.length; i++) {
        let items = await OrderItem.find({product: products[i]._id});
        let orderItems = new Array();
        for (let j = 0; j < items.length; j++) {
            let order = await Order.findOne({_id: items[j].parentOrder, deliveryStatus: 'PROCESSING'});
            if (!order) {
                continue;
            }
            console.log(order)
            orderItems.push(items[j])
        }
        
        let smallAmount = 0;
        let mediumAmount = 0;
        let largeAmount = 0;
        let extraLargeAmount = 0;
        let totalAmount = 0;

        for (let j = 0; j < orderItems.length; j++) {
            smallAmount = smallAmount + orderItems[j].smallAmount;
            mediumAmount = mediumAmount + orderItems[j].mediumAmount;
            largeAmount = largeAmount + orderItems[j].largeAmount;
            extraLargeAmount = extraLargeAmount + orderItems[j].extraLargeAmount;
        }
        totalAmount = smallAmount + mediumAmount + largeAmount + extraLargeAmount;

        let smallDeficit = smallAmount - products[i].smallAvailable;
        products[i].smallDeficit = (smallDeficit > 0) ? smallDeficit : 0;

        let mediumDeficit = mediumAmount - products[i].mediumAvailable;
        products[i].mediumDeficit = (mediumDeficit > 0) ? mediumDeficit : 0;

        let largeDeficit = largeAmount - products[i].largeAvailable;
        products[i].largeDeficit = (largeDeficit > 0) ? largeDeficit : 0;

        let extraLargeDeficit = extraLargeAmount - products[i].extraLargeAvailable;
        products[i].extraLargeDeficit = (extraLargeDeficit > 0) ? extraLargeDeficit : 0;

        let totalDeficit = totalAmount - products[i].totalAvailable;
        products[i].totalDeficit = (totalDeficit > 0) ? totalDeficit : 0;

        let update = await Product.updateOne({_id: products[i]._id}, {
            smallDeficit: products[i].smallDeficit,
            mediumDeficit: products[i].mediumDeficit,
            largeDeficit: products[i].largeDeficit,
            extraLargeDeficit: products[i].extraLargeDeficit,
            totalDeficit: products[i].totalDeficit
        });

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

function isValidNumberInput(n) {
    return Number(n) >= 0 && Number(n) < (Number.MAX_SAFE_INTEGER - 10);
}

function isValidStockUpdate(n) {
    return Number(n) > (Number.MIN_SAFE_INTEGER + 10)  && Number(n) < (Number.MAX_SAFE_INTEGER - 10);
}