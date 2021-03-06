const express = require('express')
const bodyParser = require('body-parser')
const router = express.Router();
const path = require('path');
const jsonfile = require('jsonfile')
const axios = require('axios')
const Data = require("../modul/data.js")
const data = new Data()

const urlencodedParser = bodyParser.urlencoded({ extended: false })
const jsonParser = bodyParser.json()

const Billplz = require('billplz')
const billplz = new Billplz(process.env.BILLPLZSECRETKEY)
const billplz_collection = process.env.BILLPLZCOLLECTIONKEY

const url_sistem = process.env.SYSTEMURL

const stripe = require("stripe")(process.env.STRIPESECRETKEY);
const stripePK = process.env.STRIPEPUBLICKEY

const Telegrambot = require("../modul/telegrambot.js")
const telegrambot = new Telegrambot(process.env.TGBOTKEY, process.env.TGBOTAPIURL, axios)

const page_main_title = "Payment"
const form_main_title = "Team FG Walet KL"

router.get('/:payid/thankyou', function(req, res) {

  const payment_config = data.getPayment(req.params.payid)
  let billplz_flag = false

  try {
    if (req.query.billplz.paid == 'true') {
      billplz_flag = true
    }
  } catch (error) {
  }

  if (billplz_flag) {

    payment_config.billplz_paid = "true"

    data.setPayment(req.params.payid, payment_config)
    //update_payment_config(req.params.payid, payment_config)

  }

  data = {
    title: page_main_title + ' | ' + process.env.SYSTEMTITLE,
    description: payment_config.item_description,
    price: (payment_config.item_price/100).toFixed(2),
    paid_flag: true,
    paid_at: '[in processing...]',
    name: payment_config.name,
    phone_no : payment_config.phone_no,
    agent_name: payment_config.agent_name,
    form_name: form_main_title
  }

  res.render('pay', data)

})

router.post('/:payid/paid', urlencodedParser, function(req, res) {

  const payment_config = data.getPayment(req.params.payid)
  const member_config = data.getUser(payment_config.username)

  if (req.body.paid == "true") {
    const billplz_paid = req.body.paid
    const billplz_state = req.body.state
    const billplz_paid_at = req.body.paid_at
    payment_config.billplz_paid = billplz_paid
    payment_config.billplz_state = billplz_state
    payment_config.billplz_paid_at = billplz_paid_at

    data.setPayment(req.params.payid, payment_config)
    //update_payment_config(req.params.payid, payment_config)
  
    let message = "@" + member_config.telegram_username
    message += " " + payment_config.name + " make a payment with amount RM" + (payment_config.item_price/100).toFixed(2)
    message += " via Billplz. Link: " + req.body.url
    telegrambot.sendMessage(message, process.env.TGBOTCHANNELID)
  }

  res.send()
  
})

router.get('/:payid', async function(req, res) {

  const payment_config = data.getPayment(req.params.payid)
  var paid_flag = payment_config.billplz_paid == "true" ? true : false
  const stripe_paid_flag = payment_config.stripe_paid == "true" ? true : false
  let stripe_amount = payment_config.item_price
  let paid_at = payment_config.billplz_paid_at

  let session = {}

  if (!paid_flag && !stripe_paid_flag) {

    if (payment_config.cc_enable == "true") {

      if (payment_config.cc_charge_extra == "true") {
        stripe_amount = Math.round(payment_config.item_price / (1 - (3/100)))
      }

      //process for stripe
      session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'myr',
            product_data: {
              name: payment_config.item_description,
            },
            unit_amount: stripe_amount,
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: url_sistem + "pay/" + req.params.payid + "/thankyou",
        cancel_url: url_sistem + "pay/" + req.params.payid,
      });

      data.setStripe(session.payment_intent, {"payid": req.params.payid})
      //create_stripe_payment_config(session.payment_intent, {"payid": req.params.payid})
    }

    

  } else {
    session = {id: 0}
    paid_flag = true
  }

  if (stripe_paid_flag) {
    var ts = new Date(payment_config.stripe_created*1000)
    paid_at = ts.toLocaleString()
  }
  

  data = {
    title: page_main_title + ' | ' + process.env.SYSTEMTITLE,
    description: payment_config.item_description,
    price: (payment_config.item_price/100).toFixed(2),
    stripe_amount: (stripe_amount/100).toFixed(2),
    paid_flag: paid_flag,
    name: payment_config.name,
    phone_no: payment_config.phone_no,
    paid_at: paid_at,
    agent_name: payment_config.agent_name,
    payid: req.params.payid,
    stripe_session_id: session.id,
    stripe_pk: stripePK,
    form_name: form_main_title,
    cc_enable: payment_config.cc_enable == "true" ? true : false,
    cc_charge_extra: payment_config.cc_charge_extra == "true" ? true : false
  }

  res.render('pay', data)

})

router.post('/:payid', urlencodedParser, function(req, res) {

    const payment_config = data.getPayment(req.params.payid)
    const phone_no = payment_config.phone_no
    const name = payment_config.name

    let billplz_object = {
        'collection_id': billplz_collection,
        'description': payment_config.item_description,
        'mobile': phone_no,
        'name': name,
        'amount': payment_config.item_price,
        'reference_1_label': "Bank Code",
        'reference_1': req.body.bank,
        'callback_url': url_sistem + "pay/" + req.params.payid + "/paid",
        'redirect_url': url_sistem + "pay/" + req.params.payid + "/thankyou"
    }

    // handling when no mobile phone number given
    // just put in seller own email
    if (phone_no == '') {
        delete billplz_object['mobile']
        billplz_object.email = payment_config.seller_email
    }

    billplz.create_bill(billplz_object, function(err, result) {

        if (err) {
          console.log(err)
          //todo: handle when have error
        }

        payment_config.billplz_id = result.id

        data.setPayment(req.params.payid, payment_config)
        //update_payment_config(req.params.payid, payment_config)

        res.redirect(result.url + '?auto_submit=true');
      })

})

//Return router
module.exports = router;