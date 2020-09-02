const sanitize = require("mongo-sanitize");
const JobOrder = require('../model/jobOrder.js');
const moment = require('moment');

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