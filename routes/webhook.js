const express = require('express')
const bodyParser = require('body-parser')
const router = express.Router();
const path = require('path');
const jsonfile = require('jsonfile')
const crypto = require('crypto')
const axios = require('axios')
const Data = require("../modul/data.js")
const data = new Data()

const urlencodedParser = bodyParser.urlencoded({ extended: false })
const jsonParser = bodyParser.json()

const Telegrambot = require("../modul/telegrambot.js")

const telegrambot = new Telegrambot(process.env.TGBOTKEY, process.env.TGBOTAPIURL, axios)

router.post('/stripe', jsonParser, async function(req, res) {
    
    let event = req.body

    console.log(event)
    
    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;

            const stripe_details = data.getStripe(paymentIntent.id)
            const payment_config = data.getPayment(stripe_details.payid)
            const member_config = data.getUser(payment_config.username)

            payment_config.stripe_paid = "true"
            payment_config.stripe_status = paymentIntent.status
            payment_config.stripe_created = paymentIntent.created

            data.setStripe(stripe_details.payid, payment_config)
            let amount_paid = payment_config.item_price
            if (payment_config.cc_charge_extra == "true") {
              amount_paid = Math.round(payment_config.item_price / (1 - (3/100)))
            }

            telegrambot.sendMessage("@" + member_config.telegram_username + " " + payment_config.name + " make a payment with amount RM" + (amount_paid/100).toFixed(2) + " via Stripe", process.env.TGBOTCHANNELID)

            break;
        default:
            // Unexpected event type
            return res.status(400).end();
      }

      res.json({received: true});

})

router.post('/telegram', jsonParser, async function(req, res) {
    
    event = req.body
    
    //console.log(event)

})

//Return router
module.exports = router