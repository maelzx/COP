const express = require('express')
const router = express.Router();

router.get('/', function(req, res) {
    res.render('index', { title: 'FGWalet.com'})
})

//Return router
module.exports = router;