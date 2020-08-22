const Product = require('../model/product.js');
const sanitize = require('mongo-sanitize');
const PAGE_LIMIT = 50;

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
            limit:1
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
