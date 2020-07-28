const express = require('express');
const app = express();
const loginController = require('../controller/loginController.js');

app.get('/admin', loginController.getLogin);

module.exports = app;