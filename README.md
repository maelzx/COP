# COP - (COD Online Payment)

### Why ?
This simple payment system developed to cater for specific needs of cod practice where payment is made during/before delivery of an item. It is basically just a simple payment on web.

### Integration
Currently only integrate with Billplz

### How to use ?
* First you clone this repo
* Run npm install command
```sh
$ npm install
```
* Edit sample.env & put in needed value
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
* go to http://yourdomain:3000 or http:localhost:3000

### Todo
* To properly handle all the error
* To add listing of url created
* To add in proper setting of sitting behind nginx proxy
* To add in STRIPE to handle Credit Card
