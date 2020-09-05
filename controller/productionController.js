const sanitize = require("mongo-sanitize");
const JobOrder = require('../model/jobOrder.js');
const Product = require('../model/product.js');
const InventoryRecord = require('../model/inventoryRecord.js');
const moment = require('moment');
const { exists } = require("../model/product.js");

const productionController = {
    getProductionPage: function(req, res) {
        if (!(req.session.user && req.cookies.user_sid)) {
            res.redirect('/login');
            return;
        }

        let style = sanitize(req.query.style);
        let color = sanitize(req.query.color);
        let description = sanitize(req.query.description);
        let query = getQueries(style, color, description)

        let status = sanitize(req.query.status);
        let statusQueries = new Array();
        let statusEnums = JobOrder.schema.path('status').enumValues;
        if (status == 'SELECT' || status == null || status == 'undefined') {
            statusQueries.push(...statusEnums);
        } else {
            statusQueries.push(status)
        }
        query.status = {$in: statusQueries};

        let dateStart = parseDate(sanitize(req.query.dateStart));
        let dateEnd = parseDate(sanitize(req.query.dateEnd));
        let resultsMessage = getResultsMessage(style, color, description, status, dateStart, dateEnd);
        dateStart = (dateStart == null) ? new Date(-8640000000000000) : dateStart;
        dateEnd = (dateEnd == null) ? new Date(8640000000000000) : dateEnd;
        query.date = {$gte: dateStart.toISOString(), $lte: dateEnd.toISOString()};

        let page = sanitize(req.query.page);
        if (page == null) {
            page = 1;
        }

        let options = {
            lean: true,
            page: page,
            limit: 10, //test

            sort: {
                date: -1
            }
        }

        JobOrder.paginate(query, options, function (err, results) {
            if (!results) {
                console.log(err);
                res.redirect(req.get('referer'));
                return;
            }
            console.log(results)

            for (let i = 0; i < results.docs.length; i++) {
                results.docs[i].date = formatDate(results.docs[i].date);
            }

            let selectOptions = new Array();
            for (let i = 0; i < results.totalPages; i++) {
                let no = i + 1;
                let options = {
                    pageLink: "/admin/production?style=" + style + "&color=" + color + "&description=" + description + "&status=" + status + "&dateStart=" + req.query.dateStart + "&dateEnd=" + req.query.dateEnd + "&page=" + no,
                    pageNo: no,
                    isSelected: (results.page == no),
                };

                selectOptions.push(options);
            }

            let prevPageLink = results.hasPrevPage ? "/admin/production?style=" + style + "&color=" + color + "&description=" + description + "&status=" + status + "&dateStart=" + req.query.dateStart + "&dateEnd=" + req.query.dateEnd + "&page=" + results.prevPage : ""
            let nextPageLink = results.hasNextPage ? "/admin/production?style=" + style + "&color=" + color + "&description=" + description + "&status=" + status + "&dateStart=" + req.query.dateStart + "&dateEnd=" + req.query.dateEnd + "&page=" + results.nextPage : ""
            res.render('admin/production', {
                title: 'Production Dashboard',
                layout: 'main',

                jobOrderCards: results.docs,
                noResults: results.docs.length == 0,
                resultsMessage: resultsMessage,

                //pagination
                selectOptions: selectOptions,
                hasPrev: results.hasPrevPage,
                hasNext: results.hasNextPage,
                prevPageLink: prevPageLink,
                nextPageLink: nextPageLink
            });
        })
    },

    addJobOrder: function(req, res) {
        if (!(req.session.user && req.cookies.user_sid)) {
            res.redirect('/login');
            return;
        }

        let batchNo = sanitize(req.body.newJobOrderBatchNo);
        let style = sanitize(req.body.newJobOrderStyle);
        let color = sanitize(req.body.newJobOrderColor)
        let description = sanitize(req.body.newJobOrderDescription);
        let smallOrder = Number(sanitize(req.body.newJobOrderSmall));
        let mediumOrder = Number(sanitize(req.body.newJobOrderMedium));
        let largeOrder = Number(sanitize(req.body.newJobOrderLarge));
        let extraLargeOrder = Number(sanitize(req.body.newJobOrderExtraLarge));
        let yardage = Number(sanitize(req.body.newJobOrderYardage));
        let remarks = sanitize(req.body.newJobOrderRemarks);

        if (isEmpty(batchNo) || isEmpty(style) || isEmpty(color) || isEmpty(description) ||
         smallOrder == "" || mediumOrder == "" || largeOrder == "" || extraLargeOrder == "") {
             console.log('empty fields');
             res.redirect(req.get('referer'));
             return;
         }

         if (isEmpty(remarks)) {
             remarks = ""
         }
         if (!isValidJobOrderAmount(yardage) || !isValidJobOrderAmount(smallOrder) || !isValidJobOrderAmount(mediumOrder) ||
         !isValidJobOrderAmount(largeOrder) || !isValidJobOrderAmount(extraLargeOrder)) {
             console.log('not a valid job order input');
             res.redirect(req.get('referer'));
             return;
         };

         batchNo = batchNo.trim().toUpperCase();
         style = style.trim().toUpperCase();
         color = color.trim().toUpperCase();
         description = description.trim().toUpperCase();
         remarks = remarks.trim();

         if (remarks.length > 80 || batchNo.length > 16 || style.length > 16 || color.length > 16 || description.length > 20) {
            console.log('style/color/description exceeds maximum allowed characters');
            res.redirect(req.get('referer'));
            return;
        }

        JobOrder.exists({batchNo: batchNo, style: style, color: color, description: description}, function(err, jobOrderExists) {
            if (jobOrderExists) {
                console.log('job order exists already');
                res.redirect(req.get('referer'));
                return;
            }

            Product.findOne({style: style, color: color, description: description})
            .exec((err, productResult) => {
                if (!productResult) {
                    console.log(err)
                    res.redirect(req.get('referer'));
                    return;
                }

                let date = new Date();
                let jobOrder = new JobOrder({
                    productId: productResult._id,
                    date: new Date(date.toISOString().split("T")[0]),
                    batchNo: batchNo,
                    style: style,
                    color: color,
                    description: description,
                    smallOrder: smallOrder,
                    mediumOrder: mediumOrder,
                    largeOrder: largeOrder,
                    extraLargeOrder: extraLargeOrder,
                    totalOrders: smallOrder + mediumOrder + largeOrder + extraLargeOrder,
                    yardage: yardage,
                    remarks: remarks
                });

                JobOrder.create(jobOrder).then((a) => {
                    res.redirect(req.get('referer'));
                    return;
                })

            })
        })
        
        
    },

    validateNewJobOrder: function(req, res) {
        if (!(req.session.user && req.cookies.user_sid)) {
            res.redirect('/login');
            return;
        }

        let batchNo = sanitize(req.body.batchNo);
        let style = sanitize(req.body.style);
        let color = sanitize(req.body.color);
        let description = sanitize(req.body.description);

        style = style.trim().toUpperCase();
        color = color.trim().toUpperCase();
        description = description.toUpperCase();

        JobOrder.exists({batchNo: batchNo, style: style, color: color, description: description}, function(err, jobOrderExists) {
            Product.exists({style: style, color: color, description: description}, function(err, productExists) {
                let data = {
                    jobOrderExists: jobOrderExists,
                    productExists: productExists
                };

                res.send(data);
            })
        })  
    },

    updateJobOrderStatus: function (req, res) {
        if (!(req.session.user && req.cookies.user_sid)) {
            res.redirect('/login');
            return;
        }
        
        let _id = sanitize(req.body._id);
        let status = sanitize(req.body.status);
        console.log(_id);
        console.log(status)

        JobOrder.updateOne({_id: _id}, {status: status}, (err, result) => {
            if (!result) {
                console.log(err);
                res.redirect(req.get('referer'));
                return;
            }

            console.log(result)
            res.send(true);
        })
      },

      resolveJobOrder: function(req, res) {
        if (!(req.session.user && req.cookies.user_sid)) {
            res.redirect('/login');
            return;
        }

        let _id = sanitize(req.body.resolveJobOrderId);
        let productId = sanitize(req.body.resolveJobOrderProductId);
        let smallOutput = Number(sanitize(req.body.resolveJobOrderSmallOutput));
        let mediumOutput = Number(sanitize(req.body.resolveJobOrderMediumOutput));
        let largeOutput = Number(sanitize(req.body.resolveJobOrderLargeOutput));
        let extraLargeOutput = Number(sanitize(req.body.resolveJobOrderExtraLargeOutput));

        if (smallOutput == "" && mediumOutput == "" && largeOutput == "" && extraLargeOutput == "") {
            console.log("all actual output fields are empty");
            res.redirect(req.get('referer'));
            return;
        }

        if(!isValidJobOrderAmount(smallOutput) || !isValidJobOrderAmount(mediumOutput) || !isValidJobOrderAmount(largeOutput) || !isValidJobOrderAmount(extraLargeOutput)) {
            console.log('not valid job order resolution');
            res.redirect(req.get('referer'));
            return;
        }

        JobOrder.updateOne({_id: _id}, {
            smallOutput: smallOutput,
            mediumOutput: mediumOutput,
            largeOutput: largeOutput,
            extraLargeOutput: extraLargeOutput,
            totalOutput: smallOutput + mediumOutput + largeOutput + extraLargeOutput,
            status: 'DONE',
            isDone: true
        }, (err, result) => {
            if(!result) {
                console.log(err);
                res.redirect(req.get('referer'));
                return;
            }
            
            let inventoryRecord = new InventoryRecord({
                parentRecord: productId,
                smallUpdate: smallOutput,
                mediumUpdate: mediumOutput,
                largeUpdate: largeOutput,
                extraLargeUpdate: extraLargeOutput
            });

            InventoryRecord.create(inventoryRecord, function(err, result) {
                if (!result) {
                    console.log(err);
                    res.redirect(req.get('referer'));
                    return;
                }

                Product.updateOne({_id: productId}, {
                    $push: {inventoryRecords: inventoryRecord._id},
                    $inc: {
                        smallAvailable: smallOutput, 
                        mediumAvailable: mediumOutput, 
                        largeAvailable: largeOutput, 
                        extraLargeAvailable: extraLargeOutput,
                        totalAvailable: smallOutput + mediumOutput + largeOutput + extraLargeOutput}
                }).then((a) => {
                    res.redirect(req.get('referer'));
                    return;
                })
            })
            
        })
      },

      updateRemarks: function(req, res) {
        if (!(req.session.user && req.cookies.user_sid)) {
            res.redirect('/login');
            return;
        }

        let _id = sanitize(req.body.updateRemarkId);
        let remarks = sanitize(req.body.newRemarks);

        if (remarks.length > 80) {
            console.log('remarks exceeds the 80 character limit');
            res.redirect(req.get('referer'));
            return;
        }

        JobOrder.updateOne({_id: _id}, {remarks: remarks}, function(err, result) {
            if (!result) {
                console.log(err)
                res.redirect(req.get('referer'));
                return;
            }

            res.redirect(req.get('referer'));
        })
      }
}

function getResultsMessage(style, color, description, status, dateStart, dateEnd) {
    let styleMsg = !isEmpty(style) ? style : "";
    let colorMsg = !isEmpty(color) ? color : "";
    let descriptionMsg = !isEmpty(description) ? description : "";
    

    let statusMsg = (status == 'SELECT' || status == null || status == 'undefined') ? "" : status;

    let dateMsg;
    if (dateStart == null && dateEnd == null ) {
        dateMsg = "";
    } else if (dateStart != null && dateEnd == null) {
        dateMsg = " from " + formatDate(dateStart) + " to current date."
    } else if (dateStart == null && dateEnd != null) {
        dateMsg = " up to " + formatDate(dateEnd);
    } else if (dateStart !== null && dateEnd != null) {
        dateMsg = " between dates " + formatDate(dateStart) + " and " + formatDate(dateEnd);
    }

    if (styleMsg == "" && colorMsg == "" && description == "" && dateMsg == "" && statusMsg == "") {
        return "";
    }

    return styleMsg + " " + colorMsg + " " + descriptionMsg + " " + statusMsg + dateMsg;
}

function isValidJobOrderAmount(n) {
    return Number(n) >= 0 && Number(n) < (Number.MAX_SAFE_INTEGER - 10) && Number(n) % 1 == 0;
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

function getQueries(style, color, description, isPhasedOut) {
    let query = {};

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
}

function formatDate(dt) {
    if (dt == null) {
        return null;
    }

    var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

    let date = new Date(dt).getDate();
    let month = new Date(dt).getMonth();
    let year = new Date(dt).getFullYear();

    return date + "/" + monthNames[month] + "/" + year;
}

function parseDate(s) {
    if (!(moment(s, 'YYYY-MM-DD', true).isValid())) {
        return null;
    }

    if (s == null || s === undefined) {
        return null;
    }
    var b = s.split(/\D/);
    let date = new Date(b[0], --b[1], b[2]);

    date.setHours(8, 0, 0, 0);
    return date;
}

module.exports = productionController;