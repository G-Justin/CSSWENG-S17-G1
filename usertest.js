let User = require('./model/user.js');
let database = require('./model/database.js');
let bcrypt = require('bcrypt');
database.connect()

let username = 'username';
let password = 'password';

bcrypt.hash(password, 10, function(err, hash) {
    let user = {
        username: username,
        password: hash,
        userType: 'ADMIN'
    }

    database.insertOne(User, user, (result) => {
        console.log(result);
    }); 

    /*database.findMany(User, {}, {}, (result) => {
        console.log(result);
    })*/
})