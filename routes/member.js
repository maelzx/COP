const express = require('express')
const bodyParser = require('body-parser')
const router = express.Router();
const path = require('path');
const jsonfile = require('jsonfile')
const crypto = require('crypto')

const urlencodedParser = bodyParser.urlencoded({ extended: false })

const page_main_title = "Member Page"
const form_main_title = "Team FG Walet KL"

function get_member_config(username) {

    const file_location = path.join(__dirname, '..', process.env.USERCONFIGDIR)
    const file = file_location + '/' + username + '.json'
  
    return jsonfile.readFileSync(file)
  
  }

function create_payment_config(payid, data) {

    const file_location = path.join(__dirname, '..', process.env.PAYMENTCONFIGDIR)
    const file = file_location + '/' + payid + '.json'
   
    jsonfile.writeFileSync(file, data)
  
  }

function create_payid(username) {

    let hash = crypto.createHash('md5').update(username + Date.now()).digest("hex")
    
    return hash.substr(0,12)

}

function login(username, password) {

    const member_config = get_member_config(username)

    if (member_config) {

        let hash = crypto.createHash('md5').update(password).digest("hex")

        if (member_config.password = hash) {
            return true
        } else {
            // login unsuccessful
            return false
        }

    } else {
        // login unsuccessful
        return false
    }

}

router.get('/login', function(req, res) {

    res.render('member_login', {
        title: page_main_title + ' | ' + process.env.SYSTEMTITLE,
        form_name: form_main_title
    })

})

router.post('/login', urlencodedParser, function(req, res) {

    const username = req.body.username
    const password = req.body.password

    const member_config = get_member_config(username)

    if (login(username, password)) {

        req.session.username = username
        req.session.agent_name = member_config.agent_name
        req.session.email = member_config.email
        res.redirect('/member')

    } else {

        res.render('member_login', {
            title: page_main_title + ' | ' + process.env.SYSTEMTITLE, 
            problem: "Username or Password is incorrect",
            form_name: form_main_title
        })

    }

    

})

router.get('/', function(req, res) {

    if (req.session.username) {
        // logged in and session is valid

        res.render('member_main', {
            title: page_main_title + ' | ' + process.env.SYSTEMTITLE, 
            username: req.session.username,
            form_name: form_main_title
        })

    } else {
        // not logged in or session expired
        res.redirect('/member/login')
    }

})

// todo: senaraikan berapa banyak link bayaran telah dicipta oleh ahli tersebut
// router.get('/senarai', function(req, res) {

//     const response = {
//         "status": "success"
//     }

//     res.json(response);

// })

router.get('/create', function(req, res) {

    res.render('member_create', {
        title: page_main_title + ' | ' + process.env.SYSTEMTITLE,
        form_name: form_main_title
    })

})

router.post('/create', urlencodedParser, function(req, res) {

    const item_description = req.body.item_description
    const item_price = req.body.item_price
    const name = req.body.name
    const phone_no = req.body.phone_no
    const email = req.body.email
    const cc_enable = req.body.cc_enable
    const cc_charge_extra = req.body.cc_charge_extra

    const data = {
        item_description: item_description,
        item_price: item_price * 100,
        name: name,
        phone_no: phone_no,
        email: email,
        agent_name: req.session.agent_name,
        username: req.session.username,
        seller_email: req.session.email,
        cc_enable: cc_enable,
        cc_charge_extra: cc_charge_extra
    }

    const payid = create_payid(req.session.username)

    create_payment_config(payid, data)

    const url = process.env.SYSTEMURL + 'pay/' + payid

    res.render('member_create', {
        title: page_main_title + ' | ' + process.env.SYSTEMTITLE, url: url,
        form_name: form_main_title
    })

})

//Return router
module.exports = router