const express = require('express')
const bodyParser = require('body-parser')
const router = express.Router();
const path = require('path');
const jsonfile = require('jsonfile')
const crypto = require('crypto')
const axios = require('axios')

const urlencodedParser = bodyParser.urlencoded({ extended: false })
const jsonParser = bodyParser.json()

const Telegrambot = require("../modul/telegrambot.js")
const Getdata = require("../modul/getdata.js")

const telegrambot = new Telegrambot(process.env.TGBOTKEY, process.env.TGBOTAPIURL, axios)
const getdata = new Getdata()

const api_secret_key = process.env.APISECRETKEY

function login(username, password) {

    const member_config = getdata.getUser(username)

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

function create_token(username) {

    const random_number = Math.floor(Math.random() * 10000)

    let hash = crypto.createHash('md5').update(username + api_secret_key + random_number).digest("hex")
    
    return random_number + ":" + hash

}

function verify_token(username, number, hash) {

    let hash_temp = crypto.createHash('md5').update(username + api_secret_key + number).digest("hex")

    return hash == hash_temp

}

function check_token(token) {

    const tokenSplit = token.split(":")

    if (verify_token(tokenSplit[0], tokenSplit[1], tokenSplit[2])) {

        return true
    }

    return false

}

function create_payid(username) {

    let hash = crypto.createHash('md5').update(username + Date.now()).digest("hex")
    
    return hash.substr(0,12)

}

router.post('/authenticate', jsonParser, async function(req, res) {

    const username = req.body.username
    const password = req.body.password

    const member_config = getdata.getUser(username)

    if (login(username, password)) {

        res.json({"token": username + ":" + create_token(username)})

    } else {

        res.json({"error": "not valid"})

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
    const token = req.body.token

    if (!check_token(token)) {
        res.json({"error": "token not valid"})
    }

    const tokenSplit = token.split(":")
    const username = tokenSplit[0]

    const member_config = getdata.getUser(username)

    const data = {
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

    getdata.setPayment(payid, data)

    const url = process.env.SYSTEMURL + 'pay/' + payid

    res.json({"paymentLinkUrl": url})

})



//Return router
module.exports = router