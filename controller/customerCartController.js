const session = require('express-session');
const sanitize = require('mongo-sanitize');
const Product = require('../model/product.js');


const customerCartController = {
    getCustomerPage: function(req, res) {
        res.render('customer/cart', {title: 'Cart', customer: true});
    },

    getData: function(req, res) {
        
        let cart = sanitize(req.body.cart);
        let items = new Array();

        getCartItems(cart, items).then((a) => {
            res.send(items);
        })

        
    }
}


async function getCartItems(cart, items) {
    if (cart == null || cart == 'undefined') {
        return;
    }

    for (let i = 0; i < cart.length; i++) {
        let product = await Product.findOne({_id: cart[i].product});
        if (!product) {
            continue;
        }
        let item = {
            color: product.color,
            description: product.description,
            style: product.style,
            image: "/productimgs/" + product.image,
            price: product.price * (Number(cart[i].smallAmount) + Number(cart[i].mediumAmount) + Number(cart[i].largeAmount) + Number(cart[i].extraLargeAmount)),

            product: cart[i].product,
            smallAmount: cart[i].smallAmount,
            mediumAmount: cart[i].mediumAmount,
            largeAmount: cart[i].largeAmount,
            extraLargeAmount: cart[i].extraLargeAmount
        }
        
        items.push(item);
    }
}

module.exports = customerCartController;