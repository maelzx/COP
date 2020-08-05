const express = require('express')
const bodyParser = require('body-parser')
const router = express.Router();
const crypto = require('crypto')
const axios = require('axios')
const jwt = require('jsonwebtoken')

const urlencodedParser = bodyParser.urlencoded({ extended: false })
const jsonParser = bodyParser.json()

const Telegrambot = require("../modul/telegrambot.js")
const Data = require("../modul/data.js")

const telegrambot = new Telegrambot(process.env.TGBOTKEY, process.env.TGBOTAPIURL, axios)
const data = new Data()

const api_secret_key = process.env.APISECRETKEY

function login(username, password) {

    const member_config = data.getUser(username)

    if (member_config) {

        const hash = crypto.createHash('md5').update(password).digest("hex")

        if (member_config.password == hash) {
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

function create_token(username) {

    var token = jwt.sign({ username: username }, api_secret_key, { expiresIn: '24h' });
    
    return token

}

function check_token(token) {

    let decoded = false

    try {
        decoded = jwt.verify(token, api_secret_key);
    } catch(err) {
        return decoded
    }

    return decoded

}

function create_payid(username) {

    let hash = crypto.createHash('md5').update(username + Date.now()).digest("hex")
    
    return hash.substr(0,12)

}

router.post('/authenticate', jsonParser, async function(req, res) {

    const username = req.body.username
    const password = req.body.password

    if (login(username, password)) {

        res.json({"token": create_token(username)})

    } else {
        res.statusCode = 400
        res.json({"error": "identity not valid"})

    }

})

router.post('/create', jsonParser, async function(req, res) {

    const buyerName = req.body.buyerName
    const buyerPhoneNo = req.body.buyerPhoneNo
    const buyerEmail = req.body.buyerEmail
    const itemDescription = req.body.itemDescription
    const itemPrice = req.body.itemPrice
    const ccEnable = req.body.ccEnable
    const ccExtraCharge = req.body.ccExtraCharge
    const token = req.header('x-token') 
    let username = ''

    tokenDecoded = check_token(token)

    if (!tokenDecoded) {
        res.statusCode = 401
        res.json({"error": "token not valid"})
        return
    } else {
        username = tokenDecoded.username
    }

    const member_config = data.getUser(username)

    const paymentData = {
        item_description: itemDescription,
        item_price: itemPrice * 100,
        name: buyerName,
        phone_no: buyerPhoneNo,
        email: buyerEmail,
        agent_name: member_config.agent_name,
        username: username,
        seller_email: member_config.email,
        cc_enable: ccEnable,
        cc_charge_extra: ccExtraCharge
    }

    const payid = create_payid(username)

    data.setPayment(payid, paymentData)

    const url = process.env.SYSTEMURL + 'pay/' + payid

    res.json({"paymentLinkUrl": url})

})

//Return router
module.exports = router