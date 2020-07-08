const express = require('express')
const bodyParser = require('body-parser')
const router = express.Router();
const path = require('path');
const jsonfile = require('jsonfile')
const crypto = require('crypto')

const urlencodedParser = bodyParser.urlencoded({ extended: false })

function dapatkan_keterangan_ahli(nama_ahli) {

    const lokasi_ketetapan = path.join(__dirname, '..', process.env.NAMADIREKTORIAHLI)
    const file = lokasi_ketetapan + '/' + nama_ahli + '.json'
  
    return jsonfile.readFileSync(file)
  
  }

function cipta_keterangan_bayaran(bayarid, data) {

    const lokasi_ketetapan = path.join(__dirname, '..', process.env.NAMADIREKTORIBAYARAN)
    const file = lokasi_ketetapan + '/' + bayarid + '.json'
   
    jsonfile.writeFileSync(file, data)
  
  }

function cipta_bayar_id(nama_ahli) {

    let hash = crypto.createHash('md5').update(nama_ahli + Date.now()).digest("hex")
    
    return hash.substr(0,12)

}

function log_masuk(kata_nama, kata_laluan) {

    const ketetapan_ahli = dapatkan_keterangan_ahli(kata_nama)

    if (ketetapan_ahli) {

        let hash = crypto.createHash('md5').update(kata_laluan).digest("hex")

        if (ketetapan_ahli.kata_laluan = hash) {
            return true
        } else {
            // log masuk tidak berjaya, kata laluan salah
            return false
        }

    } else {
        // log masuk tidak berjaya, nama ahli tidak dijumpai
        return false
    }

}

router.get('/logmasuk', function(req, res) {

    res.render('ahli_log_masuk', { title: 'Laman Ahli | ' + process.env.SYSTEMTITLE})

})

router.post('/logmasuk', urlencodedParser, function(req, res) {

    const kata_nama = req.body.kata_nama
    const kata_laluan = req.body.kata_laluan

    const ketetapan_ahli = dapatkan_keterangan_ahli(kata_nama)

    if (log_masuk(kata_nama, kata_laluan)) {

        req.session.ahli = kata_nama
        req.session.nama_agent = ketetapan_ahli.nama_agent
        res.redirect('/ahli')

    } else {

        res.render('ahli_log_masuk', { title: 'Laman Ahli | ' + process.env.SYSTEMTITLE, masalah: "Kata Nama atau Kata Laluan tidak betul"})

    }

    

})

router.get('/', function(req, res) {

    if (req.session.ahli) {
        // sudah log masuk dan masih valid

        res.render('ahli_utama', { title: 'Laman Ahli | ' + process.env.SYSTEMTITLE, kata_nama: req.session.ahli})

    } else {
        // tidak log masuk atau sesi sudah tamat
        res.redirect('/ahli/logmasuk')
    }

})

// todo: senaraikan berapa banyak link bayaran telah dicipta oleh ahli tersebut
// router.get('/senarai', function(req, res) {

//     const response = {
//         "status": "success"
//     }

//     res.json(response);

// })

router.get('/cipta', function(req, res) {

    res.render('ahli_cipta', { title: 'Laman Ahli | ' + process.env.SYSTEMTITLE})

})

router.post('/cipta', urlencodedParser, function(req, res) {

    const keterangan_barang = req.body.keterangan_barang
    const harga_barang = req.body.harga_barang
    const nama = req.body.nama
    const no_telefon = req.body.no_telefon

    const data = {
        keterangan_barang: keterangan_barang,
        harga_barang: harga_barang * 100,
        nama: nama,
        no_telefon: no_telefon,
        nama_agent: req.session.nama_agent,
        nama_ahli: req.session.ahli
    }

    const bayarid = cipta_bayar_id(req.session.ahli)

    cipta_keterangan_bayaran(bayarid, data)

    const url = process.env.SYSTEMURL + 'bayar/' + bayarid

    res.render('ahli_cipta', { title: 'Laman Ahli | ' + process.env.SYSTEMTITLE, url: url})

})

//Return router
module.exports = router