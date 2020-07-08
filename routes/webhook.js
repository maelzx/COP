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

function dapatkan_keterangan_ahli(nama_ahli) {

    const lokasi_ketetapan = path.join(__dirname, '..', process.env.NAMADIREKTORIAHLI)
    const file = lokasi_ketetapan + '/' + nama_ahli + '.json'
  
    return jsonfile.readFileSync(file)
  
  }

  function dapatkan_keterangan_bayaran(bayarid) {

    const lokasi_ketetapan = path.join(__dirname, '..', process.env.NAMADIREKTORIBAYARAN)
    const file = lokasi_ketetapan + '/' + bayarid + '.json'
  
    return jsonfile.readFileSync(file)
  
  }

  function kemaskini_keterangan_bayaran(bayarid, data) {

    const lokasi_ketetapan = path.join(__dirname, '..', process.env.NAMADIREKTORIBAYARAN)
    const file = lokasi_ketetapan + '/' + bayarid + '.json'
   
    jsonfile.writeFileSync(file, data)
  
  }

  function dapatkan_keterangan_stripe(stripe_id) {

    const lokasi_ketetapan = path.join(__dirname, '..', process.env.NAMADIREKTORISTRIPE)
    const file = lokasi_ketetapan + '/' + stripe_id + '.json'
  
    return jsonfile.readFileSync(file)
  
  }

router.post('/stripe', jsonParser, async function(req, res) {
    
    event = req.body

    console.log(event)
    
    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;

            const keterangan_stripe = dapatkan_keterangan_stripe(paymentIntent.id)
            const keterangan_bayaran = dapatkan_keterangan_bayaran(keterangan_stripe.bayar_id)
            const keterangan_ahli = dapatkan_keterangan_ahli(keterangan_bayaran.nama_ahli)

            keterangan_bayaran.stripe_paid = "true"
            keterangan_bayaran.stripe_status = paymentIntent.status
            keterangan_bayaran.stripe_created = paymentIntent.created

            kemaskini_keterangan_bayaran(keterangan_stripe.bayar_id, keterangan_bayaran)

            telegrambot.sendMessage("@" + keterangan_ahli.telegram_username + " " + keterangan_bayaran.nama + " telah membuat bayaran berjumlah RM" + (keterangan_bayaran.harga_barang/100).toFixed(2), process.env.TGBOTCHANNELID)

            console.log('PaymentIntent was successful!');

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