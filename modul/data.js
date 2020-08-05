class Data {

    constructor () {
        this.USERCONFIGDIR = process.env.USERCONFIGDIR
        this.PAYMENTCONFIGDIR = process.env.PAYMENTCONFIGDIR
        this.STRIPEPAYMENTCONFIGDIR = process.env.STRIPEPAYMENTCONFIGDIR
        this.jsonfile = require('jsonfile')
        this.path = require('path');
    }

    getData(type, key) {

        let path = ''

        switch (type) {
            case "USER":
                path = this.USERCONFIGDIR
                break
            case "PAYMENT":
                path = this.PAYMENTCONFIGDIR
                break
            case "STRIPE":
                path = this.STRIPEPAYMENTCONFIGDIR
                break
            default:
                break

        }

        const file_location = this.path.join(__dirname, '..', path)
        const file = file_location + '/' + key + '.json'
  
        return this.jsonfile.readFileSync(file)
    }

    setData(type, id, data) {

        let path = ''

        switch (type) {
            case "USER":
                path = this.USERCONFIGDIR
                break
            case "PAYMENT":
                path = this.PAYMENTCONFIGDIR
                break
            case "STRIPE":
                path = this.STRIPEPAYMENTCONFIGDIR
                break
            default:
                break

        }

        const file_location = this.path.join(__dirname, '..', path)
        const file = file_location + '/' + id + '.json'
       
        this.jsonfile.writeFileSync(file, data)

        // TODO: check before return true
        return true

    }

    getUser(key) {
        return this.getData("USER", key)
    }

    getPayment(key) {
        return this.getData("PAYMENT", key)
    }

    setPayment(id, data) {
        return this.setData("PAYMENT", id, data)
    }

    getStripe(key) {
        return this.getData("STRIPE", key)
    }

}

module.exports = Data