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

const telegrambot = new Telegrambot(process.env.TGBOTKEY, process.env.TGBOTAPIURL, axios)

function get_member_config(username) {

    const file_location = path.join(__dirname, '..', process.env.USERCONFIGDIR)
    const file = file_location + '/' + username + '.json'
  
    return jsonfile.readFileSync(file)
  
  }

  function get_payment_config(payid) {

    const file_location = path.join(__dirname, '..', process.env.PAYMENTCONFIGDIR)
    const file = file_location + '/' + payid + '.json'
  
    return jsonfile.readFileSync(file)
  
  }

  function update_payment_config(payid, data) {

    const file_location = path.join(__dirname, '..', process.env.PAYMENTCONFIGDIR)
    const file = file_location + '/' + payid + '.json'
   
    jsonfile.writeFileSync(file, data)
  
  }

  function get_stripe_config(stripe_id) {

    const file_location = path.join(__dirname, '..', process.env.STRIPEPAYMENTCONFIGDIR)
    const file = file_location + '/' + stripe_id + '.json'
  
    return jsonfile.readFileSync(file)
  
  }

router.post('/stripe', jsonParser, async function(req, res) {
    
    event = req.body

    console.log(event)
    
    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;

            const stripe_details = get_stripe_config(paymentIntent.id)
            const payment_config = get_payment_config(stripe_details.payid)
            const member_config = get_member_config(payment_config.username)

            payment_config.stripe_paid = "true"
            payment_config.stripe_status = paymentIntent.status
            payment_config.stripe_created = paymentIntent.created

            update_payment_config(stripe_details.payid, payment_config)
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