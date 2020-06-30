# COP - (COD Online Payment)

### Why ?
This simple payment system developed to cater for specific needs of cod practice where payment is made during/before delivery of an item. It is basically just a simple payment on web.

### Integration
* Integrate with Billplz
* Half integrate with STRIPE

### How to use ?
* First you clone this repo
* Run npm install command
```sh
$ npm install
```
* Edit sample.env & put in needed value and save it as .env
```sh
BILLPLZSECRETKEY= <PUT IN YOUR BILLPLZ SECRET KEY HERE >
BILLPLZCOLLECTIONKEY= <PUT IN YOUR BILLPLZ COLLECTION CODE HERE>
SYSTEMURL=https://domain.com/ <CONFIGURE YOUR DOMAIN>
```
* Edit ketetapan_ahli/sample.json
```sh
{"kata_laluan" : "value is just md5 hash text for your password",
"nama_agent": "is just a string"}
```
* run node
```sh
$ node index.js
```
* go to http://yourdomain:3000 or http://localhost:3000
* go to http://localhost:3000/ahli to login
* after login you can click on "Cipta" button
* it will generate a link, you can copy the link
* open the link in new tab and proceed with payment

### Todo
* To properly handle all the error
* To add listing of url created
* To add in proper setting of sitting behind nginx proxy
* To properly handle and check for correct phone number
* Implement webhook verification for STRIPE
