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

        let query = {};
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
        let resultsMsg = getResultsMessage(status, dateStart, dateEnd);
        dateStart = (dateStart == null) ? new Date(-8640000000000000) : dateStart;
        dateEnd = (dateEnd == null) ? new Date(8640000000000000) : dateEnd;
        query.date = {$gte: dateStart.toISOString(), $lte: dateEnd.toISOString()};
        

        JobOrder.find(query)
            .sort({created: -1})
            .lean()
            .exec(function(err, results) {
                if (err) {
                    res.render('error', {
                        title: 'Facemust',
                        error: '404',
                        message: 'AN ERROR OCCURRED',
                        customer: false
                    })
                    return;
                }

                
                for (let i = 0; i < results.length; i++) {
                    results[i].date = results[i].date.toISOString().split('T')[0];
                    results[i].hasDeficit = (results[i].totalOrders > results[i].totalOutput);
                    results[i].hasDiscrepancy = false;
                    if (results[i].smallOutput != results[i].smallOrder || results[i].mediumOutput != results[i].mediumOrder || results[i].largeOutput != results[i].largeOrder || results[i].extraLargeOutput != results[i].extraLargeOrder) {
                        results[i].hasDiscrepancy = true;
                    }
                }

                Product.find({isPhasedOut: false})
                .select('style description color')
                .lean()
                .exec(function(err, products) {
                    res.render('admin/production', {
                        title: 'Production Dashboard',
                        layout: 'main',
                        products: products,
                        resultsMessage: resultsMsg,
                
                        jobOrderCards: results,
                        noResults: results.length == 0,
            
                    })
                })
                    
            })
       
          
        
    },

    addJobOrder: function(req, res) {
        if (!(req.session.user && req.cookies.user_sid)) {
            res.redirect('/login');
            return;
        }

        let batchNo = sanitize(req.body.newJobOrderBatchNo);
        let _id = sanitize(req.body.newJobOrderSelect);
        let smallOrder = Number(sanitize(req.body.newJobOrderSmall));
        let mediumOrder = Number(sanitize(req.body.newJobOrderMedium));
        let largeOrder = Number(sanitize(req.body.newJobOrderLarge));
        let extraLargeOrder = Number(sanitize(req.body.newJobOrderExtraLarge));
        let yardage = Number(sanitize(req.body.newJobOrderYardage));
        let remarks = sanitize(req.body.newJobOrderRemarks);

        if (isEmpty(batchNo) || isEmpty(_id) || smallOrder == "" || mediumOrder == "" || largeOrder == "" || extraLargeOrder == "") {
             console.log('empty fields');
             res.render('error', {
                title: 'Facemust',
                error: '404',
                message: 'AN ERROR OCCURRED',
                customer: false
            })
            return;
             return;
         }

         if (isEmpty(remarks)) {
             remarks = ""
         }
         if (!isValidJobOrderAmount(yardage) || !isValidJobOrderAmount(smallOrder) || !isValidJobOrderAmount(mediumOrder) ||
         !isValidJobOrderAmount(largeOrder) || !isValidJobOrderAmount(extraLargeOrder)) {
             console.log('not a valid job order input');
             res.render('error', {
                title: 'Facemust',
                error: '404',
                message: 'AN ERROR OCCURRED',
                customer: false
            })
            return;
             return;
         };

         batchNo = batchNo.trim().toUpperCase();
         remarks = remarks.trim();

         if (remarks.length > 80 || batchNo.length > 16) {
            console.log('exceeds maximum allowed characters');
            res.render('error', {
                title: 'Facemust',
                error: '404',
                message: 'AN ERROR OCCURRED',
                customer: false
            })
            return;
        }

        JobOrder.exists({batchNo: batchNo, productId: _id}, function(err, jobOrderExists) {
            if (jobOrderExists) {
                console.log('job order exists already');
                res.render('error', {
                    title: 'Facemust',
                    error: '404',
                    message: 'AN ERROR OCCURRED',
                    customer: false
                })
                return;
            }

            Product.findOne({_id: _id})
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
                    style: productResult.style,
                    color: productResult.color,
                    description: productResult.description,
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
        let _id = sanitize(req.body._id);

        JobOrder.exists({batchNo: batchNo, productId: _id}, function(err, jobOrderExists) {
            Product.exists({_id: _id}, function(err, productExists) {
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
                console.log(result)
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

        let yardage = sanitize(req.body.newYardage);
        let _id = sanitize(req.body.updateRemarkId);
        let smallOrder = sanitize(req.body.newSmall);
        let mediumOrder = sanitize(req.body.newMedium);
        let largeOrder = sanitize(req.body.newLarge);
        let extraLargeOrder = sanitize(req.body.newExtraLarge);
        let remarks = sanitize(req.body.newRemarks);

        if (!isValidJobOrderAmount(smallOrder) || !isValidJobOrderAmount(mediumOrder) || !isValidJobOrderAmount(largeOrder) || !isValidJobOrderAmount(extraLargeOrder)) {
            console.log('not valid job order amounts');
            res.redirect(req.get('referer'));
            return;
        }

        if (remarks.length > 80) {
            console.log('remarks exceeds the 80 character limit');
            res.redirect(req.get('referer'));
            return;
        }

        let totalOrders = Number(smallOrder) + Number(mediumOrder) + Number(largeOrder) + Number(extraLargeOrder);
        JobOrder.updateOne({_id: _id}, {remarks: remarks, totalOrders: totalOrders, smallOrder: smallOrder, mediumOrder: mediumOrder, largeOrder: largeOrder, extraLargeOrder: extraLargeOrder, yardage: yardage}, function(err, result) {
            if (!result) {
                console.log(err)
                res.redirect(req.get('referer'));
                return;
            }

            res.redirect(req.get('referer'));
        })
      }
}

async function getJobOrders(jobOrders, results) {
    for (let i = 0; i < results.length; i++) {
        let product = await Product.findOne({_id: results[i].productId});
        if (!product) {
            console.log("no product found in a job order: " + results[i].productId);
            continue;
        }
        let jobOrder = {
            _id: results[i]._id,
            productId: product._id,
            date: results[i].date,
            batchNo: results[i].batchNo,
            style: product.style,
            color: product.color,
            description: product.description,
            status: results[i].status,
            isDone: results[i].isDone,
            remarks: results[i].remarks,
            yardage: results[i].yardage,
            smallOrder: results[i].smallOrder,
            mediumOrder: results[i].mediumOrder,
            largeOrder: results[i].largeOrder,
            extraLargeOrder: results[i].extraLargeOrder,
            totalOrders: results[i].totalOrders,
            smallOutput: results[i].smallOutput,
            mediumOutput: results[i].mediumOutput,
            largeOutput: results[i].largeOutput,
            extraLargeOutput: results[i].extraLargeOutput,
            totalOutput: results[i].totalOutput,
            hasDeficit: (results[i].totalOrders > results[i].totalOutput)
        }

        jobOrders.push(jobOrder);
    }
}

function getResultsMessage(status, dateStart, dateEnd) {

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

    if (dateMsg == "" && statusMsg == "") {
        return "";
    }

    return statusMsg + dateMsg;
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