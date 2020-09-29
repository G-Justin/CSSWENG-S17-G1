const session = require('express-session');
const User = require('../model/user.js');
const sanitize = require('mongo-sanitize');
const { findOne } = require('../model/user.js');
const bcrypt = require('bcrypt');
const database = require('../model/database.js')

const controlPageController = {
    getControlPage: function(req, res) {
        if (!(req.session.user && req.cookies.user_sid)) {
            res.redirect('/login');
            return;
        }

        User.findOne({username: req.session.user}, function(err, result) {
            if (!result) {
                console.log('no user found')
                res.redirect('/');
                return;
            }

            User.find()
                .select('username userType dateCreated')
                .sort({dateCreated: -1})
                .lean()
                .exec((err, users) => {
                    if (err) {
                        res.render('error', {
                            title: 'Facemust',
                            error: '404',
                            message: 'AN ERROR OCCURED'
                        })
                        return;
                    }

                    console.log(users)
                    for (let i = 0; i < users.length; i++) {
                        users[i].isAdmin = users[i].userType == 'ADMIN'
                    }

                    res.render('admin/control', {
                        title: "Change Account Settings",
                        customer: false,
                        isMaster: result.userType == 'ADMIN',
                        users: users
                    })
                    
                })

            
        })
    },

    checkUsername: function(req, res) {
        if (!(req.session.user && req.cookies.user_sid)) {
            res.redirect('/login');
            return;
        }

        let username = sanitize(req.query.username);

        User.findOne({username: username}, function(err, result) {
            if (err) {
                console.log(err);
                res.render('error', {
                    title: 'Facemust',
                    error: '404',
                    message: 'AN ERROR OCCURED'
                })
                return;
            }

            console.log(result)
            let exists = result != null;
            res.send(exists)
        })
    },

    createAccount: function(req, res) {
        if (!(req.session.user && req.cookies.user_sid)) {
            res.redirect('/login');
            return;
        }

        let username = sanitize(req.body.createAccountUsername);
        let password = sanitize(req.body.createAccountPassword);
        let confirmPassword = sanitize(req.body.createAccountConfirmPassword);

        username = username.trim();
        if (username == "" || password == "" || confirmPassword == "") {
            res.render('error', {
                title: 'Facemust',
                error: '404',
                message: 'INVALID USER DETAILS'
            })
            return;
        }

        let userExp = /^(?!.*\.\.)(?!.*\.$)[^\W][\w.]{3,16}$/;
        if (!userExp.test(username)) {
            res.render('error', {
                title: 'Facemust',
                error: '404',
                message: 'INVALID USER DETAILS'
            })
            return;
        }

        let passExp = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,}$/;
        if (!passExp.test(password)) {
            res.render('error', {
                title: 'Facemust',
                error: '404',
                message: 'INVALID USER DETAILS'
            })
            return;
        }

        if (password != confirmPassword) {
            res.render('error', {
                title: 'Facemust',
                error: '404',
                message: 'INVALID USER DETAILS'
            })
            return;
        }

        User.findOne({username: username}, function(err, result) {
            if (result) {
                res.render('error', {
                    title: 'Facemust',
                    error: '404',
                    message: 'USERNAME ALREADY EXISTS'
                })
                return;
            }

            bcrypt.hash(password, 10, function(err, hash) {
                let user = {
                    username: username,
                    password: hash,
                    userType: 'EMPLOYEE'
                }

                database.insertOne(User, user, (result) => {
                    console.log(result);
                    res.redirect(req.get('referer'))
                    return;
                })
            })
        })
    },

    deleteUser: function(req, res) {
        if (!(req.session.user && req.cookies.user_sid)) {
            res.redirect('/login');
            return;
        }

        let username = sanitize(req.body.deleteUserName);

        User.deleteOne({username: username}, function(err, result) {
            if (err) {
                console.log(err)
                res.render('error', {
                    title: 'Facemust',
                    error: '404',
                    message: 'AN ERROR OCCURRED'
                })
                return;
            }

            res.redirect(req.get('referer'))
        })
    }
}

module.exports = controlPageController;