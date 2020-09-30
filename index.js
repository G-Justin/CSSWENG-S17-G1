const express = require('express');
const hbs = require('hbs');
const exphbs = require('express-handlebars');
let path = require('path');

const routes = require('./routes/routes.js');
const database = require('./model/database.js');
const app = express();

let port = process.env.PORT;
if (port == null || port == "") {
    port = 3001;
}

app.set('view engine', 'hbs');
app.engine('hbs',exphbs({
	extname: 'hbs',
	defaultView: 'main',
	layoutsDir: __dirname + '/views/layouts/',
	partialsDir: __dirname + '/views/partials/',
	helpers: {
        ifCond: function(v1, v2, options) {
		  if(v1 === v2) {
		    return options.fn(this);
		  }
		  return options.inverse(this);
		},
		json: function(context) {
    		return JSON.stringify(context);
		}
    }
}));

app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname,'public')));
app.use('/', routes);
app.use(express.static('public'));

app.use(function (req, res, next) {
  res.status(404).render('error',{
  	session: req.session,
  	error: '404',
	  message: "The Page can't be found",
	  customer: true
  });
});

database.connect();

app.listen(port, function() {
    console.log('App listening at port ' + port);
});

