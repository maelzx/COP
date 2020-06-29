const express = require('express')
const bodyParser = require('body-parser')
const router = express.Router();
const path = require('path');
const jsonfile = require('jsonfile')

const urlencodedParser = bodyParser.urlencoded({ extended: false })
const jsonParser = bodyParser.json()

const Billplz = require('billplz')
const billplz = new Billplz(process.env.BILLPLZSECRETKEY)
const billplz_collection = process.env.BILLPLZCOLLECTIONKEY

const url_sistem = process.env.SYSTEMURL

const stripe = require("stripe")(process.env.STRIPESECRETKEY);
const stripePK = process.env.STRIPEPUBLICKEY


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

router.get('/:bayarid/terimakasih', function(req, res) {

  const keterangan_bayaran = dapatkan_keterangan_bayaran(req.params.bayarid)

  const sudah_bayar_flag = req.query.billplz.paid == 'true' ? true : false

  if (sudah_bayar_flag) {

    keterangan_bayaran.billplz_paid = "true"

    kemaskini_keterangan_bayaran(req.params.bayarid, keterangan_bayaran)

  }

  data = {
    title: 'Bayar | FGWalet.com',
    keterangan: keterangan_bayaran.keterangan_barang,
    harga: (keterangan_bayaran.harga_barang/100).toFixed(2),
    sudah_bayar: sudah_bayar_flag,
    nama: keterangan_bayaran.nama,
    no_telefon: keterangan_bayaran.no_telefon,
    nama_agent: keterangan_bayaran.nama_agent
  }

  res.render('bayar', data)

})

router.post('/:bayarid/sudahbayar', urlencodedParser, function(req, res) {

  const keterangan_bayaran = dapatkan_keterangan_bayaran(req.params.bayarid)

  const billplz_paid = req.body.paid
  const billplz_state = req.body.state
  const billplz_paid_at = req.body.paid_at
  keterangan_bayaran.billplz_paid = billplz_paid
  keterangan_bayaran.billplz_state = billplz_state
  keterangan_bayaran.billplz_paid_at = billplz_paid_at

  kemaskini_keterangan_bayaran(req.params.bayarid, keterangan_bayaran)

  res.send()
  
})

router.get('/:bayarid', function(req, res) {

  const keterangan_bayaran = dapatkan_keterangan_bayaran(req.params.bayarid)
  const sudah_bayar_flag = keterangan_bayaran.billplz_paid == "true" ? true : false

  data = {
    title: 'Bayar | FGWalet.com',
    keterangan: keterangan_bayaran.keterangan_barang,
    harga: (keterangan_bayaran.harga_barang/100).toFixed(2),
    sudah_bayar: sudah_bayar_flag,
    nama: keterangan_bayaran.nama,
    no_telefon: keterangan_bayaran.no_telefon,
    tarikh_bayaran: keterangan_bayaran.billplz_paid_at,
    nama_agent: keterangan_bayaran.nama_agent,
    stripe_public_key: stripePK,
    bayar_id: req.params.bayarid,
  }

  res.render('bayar', data)

})

router.post("/create-payment-intent", jsonParser, async function(req, res) {
  const input = req.body;
  console.log(input)

  const keterangan_bayaran = dapatkan_keterangan_bayaran(input.id)

  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: keterangan_bayaran.harga_barang,
    currency: "myr"
  });
  res.send({
    clientSecret: paymentIntent.client_secret
  });
});

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