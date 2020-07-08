const express = require('express')
const bodyParser = require('body-parser')
const router = express.Router();
const path = require('path');
const jsonfile = require('jsonfile')
const axios = require('axios')

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

function cipta_keterangan_bayaran_stripe(stripe_pi_id, data) {

  const lokasi_ketetapan = path.join(__dirname, '..', process.env.NAMADIREKTORISTRIPE)
  const file = lokasi_ketetapan + '/' + stripe_pi_id + '.json'
 
  jsonfile.writeFileSync(file, data)

}

router.get('/:bayarid/terimakasih', function(req, res) {

  const keterangan_bayaran = dapatkan_keterangan_bayaran(req.params.bayarid)
  const billplz_flag = false

  try {
    if (req.query.billplz.paid == 'true') {
      console.log('this coming from billplz')
      billplz_flag = true
    }
  } catch (error) {
    console.log('maybe this coming from stripe')
  }

  if (billplz_flag) {

    keterangan_bayaran.billplz_paid = "true"

    kemaskini_keterangan_bayaran(req.params.bayarid, keterangan_bayaran)

  }

  data = {
    title: 'Bayar | ' + process.env.SYSTEMTITLE,
    keterangan: keterangan_bayaran.keterangan_barang,
    harga: (keterangan_bayaran.harga_barang/100).toFixed(2),
    sudah_bayar: true,
    nama: keterangan_bayaran.nama,
    no_telefon: keterangan_bayaran.no_telefon,
    nama_agent: keterangan_bayaran.nama_agent
  }

  res.render('bayar', data)

})

router.post('/:bayarid/sudahbayar', urlencodedParser, function(req, res) {

  const keterangan_bayaran = dapatkan_keterangan_bayaran(req.params.bayarid)
  const keterangan_ahli = dapatkan_keterangan_ahli(keterangan_bayaran.nama_ahli)

  const billplz_paid = req.body.paid
  const billplz_state = req.body.state
  const billplz_paid_at = req.body.paid_at
  keterangan_bayaran.billplz_paid = billplz_paid
  keterangan_bayaran.billplz_state = billplz_state
  keterangan_bayaran.billplz_paid_at = billplz_paid_at

  kemaskini_keterangan_bayaran(req.params.bayarid, keterangan_bayaran)

  telegrambot.sendMessage("@" + keterangan_ahli.telegram_username + " " + keterangan_bayaran.nama + " telah membuat bayaran berjumlah RM" + (keterangan_bayaran.harga_barang/100).toFixed(2), process.env.TGBOTCHANNELID)

  res.send()
  
})

router.get('/:bayarid', async function(req, res) {

  const keterangan_bayaran = dapatkan_keterangan_bayaran(req.params.bayarid)
  var sudah_bayar_flag = keterangan_bayaran.billplz_paid == "true" ? true : false
  const stripe_bayar_flag = keterangan_bayaran.stripe_paid == "true" ? true : false

  let session = {}

  if (!sudah_bayar_flag && !stripe_bayar_flag) {

    //process for stripe
    session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'myr',
          product_data: {
            name: keterangan_bayaran.keterangan_barang,
          },
          unit_amount: keterangan_bayaran.harga_barang,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: url_sistem + "bayar/" + req.params.bayarid + "/terimakasih",
      cancel_url: url_sistem + "bayar/" + req.params.bayarid,
    });

    cipta_keterangan_bayaran_stripe(session.payment_intent, {"bayar_id": req.params.bayarid})

  } else {
    session = {id: 0}
    sudah_bayar_flag = true
  }
  

  data = {
    title: 'Bayar | ' + process.env.SYSTEMTITLE,
    keterangan: keterangan_bayaran.keterangan_barang,
    harga: (keterangan_bayaran.harga_barang/100).toFixed(2),
    sudah_bayar: sudah_bayar_flag,
    nama: keterangan_bayaran.nama,
    no_telefon: keterangan_bayaran.no_telefon,
    tarikh_bayaran: keterangan_bayaran.billplz_paid_at,
    nama_agent: keterangan_bayaran.nama_agent,
    bayar_id: req.params.bayarid,
    stripe_session_id: session.id,
    stripe_pk: stripePK,
  }

  res.render('bayar', data)

})

router.post('/:bayarid', urlencodedParser, function(req, res) {

  const keterangan_bayaran = dapatkan_keterangan_bayaran(req.params.bayarid)
  const no_telefon = keterangan_bayaran.no_telefon
  const nama_pelanggan = keterangan_bayaran.nama

    billplz.create_bill({
        'collection_id': billplz_collection,
        'description': keterangan_bayaran.keterangan_barang,
        'mobile': no_telefon,
        'name': nama_pelanggan,
        'amount': keterangan_bayaran.harga_barang,
        'reference_1_label': "Bank Code",
        'reference_1': req.body.bank,
        'callback_url': url_sistem + "bayar/" + req.params.bayarid + "/sudahbayar",
        'redirect_url': url_sistem + "bayar/" + req.params.bayarid + "/terimakasih"
      }, function(err, result) {

        if (err) {
          console.log(err)
          //todo: handle when have error
        }

        keterangan_bayaran.billplz_id = result.id

        kemaskini_keterangan_bayaran(req.params.bayarid, keterangan_bayaran)

        res.redirect(result.url + '?auto_submit=true');
      })

})

//Return router
module.exports = router;