const bcrypt = require('bcrypt');
const database = require('../model/database.js');

const Admin = require('../model/admin.js');

const loginController = {
    
    getLogin: function(req, res) {
        res.render('login', {
            title: 'Facemustph Admin Login'
        });
    }
}

module.exports = loginController;