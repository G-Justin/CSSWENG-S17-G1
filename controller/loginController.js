const bcrypt = require('bcrypt');
const database = require('../model/database.js');
const sanitize = require('mongo-sanitize');

const User = require('../model/user.js');

const loginController = {
    
    getLogin: function(req, res) {
        renderLogin(res, false);
    },

    postLogin: function(req, res) {
        console.log('post login')
        let username = sanitize(req.body.loginUsername);
        let password = sanitize(req.body.loginPassword);

        if (username.trim() == '' || password == '') {
            renderLogin(res, true);
            return;
        }

        User.findOne({username: username})
        .exec((err, usernameResult) => {
            if (!usernameResult) {
                renderLogin(res, true);
            } 

            bcrypt.compare(password, usernameResult.password, function(err, equal) {
                if (!equal) {
                    renderLogin(res, true);
                    return;
                }

                res.redirect('/admin/inventory');
            });
        });



    }
}

module.exports = loginController;

function renderLogin(res, err) {
    res.render('login', {
        title: 'Facemustph Admin Login',
        //showError: err
    });
}
