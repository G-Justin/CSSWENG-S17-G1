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


hbs.registerPartials(__dirname + '/views/partials');

app.set('view engine', 'hbs');
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname,'public')));
app.use('/', routes);

app.use(express.static('public'));
app.use(express.static('views'));

database.connect();

app.listen(port, function() {
    console.log('App listening at port ' + port);
});

