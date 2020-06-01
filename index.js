require('dotenv').config()
const cookie_session = require('cookie-session')
const express = require('express')
const app = express()
const port = 3000

app.set('view engine', 'pug')

app.use(cookie_session({
    name: 'session',
    keys: ['fgwaletdotcom', 'fgwaletcom'],
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }))

app.use("/public", express.static('public')); 

app.use('/bayar', require('./routes/bayar'))
app.use('/ahli', require('./routes/ahli'))
app.use('/', require('./routes/main'))

app.listen(port, () => console.log(`App listening at http://localhost:${port}`))