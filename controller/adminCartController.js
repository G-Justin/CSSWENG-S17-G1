const sanitize = require('mongo-sanitize');
const Order = require('../model/order.js');
const OrderItem = require('../model/orderitem.js');
const Product = require('../model/product.js');
const orderitem = require('../model/orderitem.js');
const database = require('../model/database.js');
const ordersController = require('./ordersController.js');
const adminCartController = {
    getOrder: function(req, res) {
        if (!(req.session.user && req.cookies.user_sid)) {
            res.redirect('/login');
            return;
        }
    
        let orderNumber = sanitize(req.params._id);
        Order.findOne({_id: orderNumber})
        .populate('orderItems')
        .lean()
        .exec((err, orderResult) => {
            if (orderResult == null) {
                res.redirect('/404');
                return;
            }

            let orderResultItems = orderResult.orderItems;
            let orderItems = new Array();

            console.log(orderResult.orderItems.length);
            console.log(orderResultItems[0].product);
            for (let i = 0; i < orderResultItems.length; i++) {
                console.log(i)
                Product.findById(orderResultItems[i].product)
                .exec((err, productResult) => {
                    let smallDeficit = productResult.smallAvailable <  orderResultItems[i].smallAmount ? (orderResultItems[i].smallAmount - productResult.smallAvailable) : 0;
                    let mediumDeficit = productResult.mediumAvailable <  orderResultItems[i].mediumAmount ? (orderResultItems[i].mediumAmount - productResult.mediumAvailable) : 0;  
                    let largeDeficit = productResult.largeAvailable <  orderResultItems[i].largeAmount ? (orderResultItems[i].largeAmount - productResult.largeAvailable) : 0;
                    let extraLargeDeficit = productResult.extraLargeAvailable <  orderResultItems[i].extraLargeAmount ? (orderResultItems[i].extraLargeAmount - productResult.extraLargeAvailable) : 0;

                    let orderItem = {
                        color: productResult.color,
                        style: productResult.style,
                        smallAmount: orderResultItems[i].smallAmount,
                        mediumAmount: orderResultItems[i].mediumAmount,
                        largeAmount: orderResultItems[i].largeAmount,
                        extraLargeAmount: orderResultItems[i].extraLargeAmount,

                        smallDeficit: smallDeficit,
                        mediumDeficit: mediumDeficit,
                        largeDeficit: largeDeficit,
                        extraLargeDeficit: extraLargeDeficit
                    };

                    console.log(orderItem);
                    orderItems.push(orderItem);
                });
            }

            let details = {
                orderDate: orderResult.orderDate,
                firstname: orderResult.firstname,
                lastname: orderResult.lastname,
                contactNo: orderResult.contactNo,
                email: orderResult.email,
                address: orderResult.address,
                paymentMode: orderResult.paymentMode,
                paymentDate: orderResult.paymentDate,
                deliveryMode: orderResult.deliveryMode,
                deliveryDate: orderResult.deliveryDate,
                totalItems: orderResult.orderItems.length,

                deliveryStatus: orderResult.deliveryStatus,
                paymentStatus: orderResult.paymentStatus,
                shippingFee: orderResult.shippingFee,
                basePrice: orderResult.basePrice,
                totalPrice: orderResult.totalPrice,

                orderItems: orderItems,

                title: 'Customer Cart'
            };

            res.render('admin/cart', details);
            
        })

    }
};

module.exports = adminCartController;