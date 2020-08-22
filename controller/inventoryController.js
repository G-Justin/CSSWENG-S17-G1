const Product = require('../model/product.js');
const sanitize = require('mongo-sanitize');
const PAGE_LIMIT = 50;

const inventoryController = {
    getInventoryPage: function(req, res) {
        if (!(req.session.user && req.cookies.user_sid)) {
            res.redirect('/login');
            return;
        }

        let style = sanitize(req.body.style);
        let color = sanitize(req.body.color);
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

        Product.paginate({}, options, function(err, results){
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


        return;
    }
}

module.exports = inventoryController;

function getQueries(style, color) {
    let query = {};
    if ((style === null || style === undefined || style.trim() == "") && (color !== null || color !== undefined || color.trim() != "")) {
        query = { color: new RegExp(color, 'i') };
        return query;
    } 
    
    if ((color === null || color === undefined || color.trim() == "") && (style !== null || style !== undefined || style.trim() != "")) {
        query = { style: new RegExp(style, 'i') };
        return query;
    }

    if ((color !== null || color !== undefined || color.trim() != "") && (style !== null || style !== undefined || style.trim() != "")) {
        query = { color: new RegExp(color, 'i'), style: new RegExp(style, 'i') };
        return query;
    }
     
    query = {};
    return query;
}
