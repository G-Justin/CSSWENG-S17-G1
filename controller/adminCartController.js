const sanitize = require('mongo-sanitize');

const adminCartController = {
    getOrder: function(req, res) {
        if (!(req.session.user && req.cookies.user_sid)) {
            res.redirect('/login');
            return;
        }
    
        

        
    }
}