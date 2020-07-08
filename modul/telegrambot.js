class Telegrambot {

    constructor (token, url, axios) {
        this.token = token
        this.url = url
        this.axios = axios
    }

    callApi(method, obj) {

        let base_url = this.url + this.token

        switch (method) {
            case "sendMessage":

                const url = base_url +"/sendMessage"

                this.axios.post(url,
                    {
                        "chat_id": obj.chatId, 
                        "text": obj.message
                    })
                    .then(response => {
                        console.log("Message posted")
                        return true
                    }).catch(error =>{
                        console.log(error)
                        return false
                })
                
                break;
        
            default:
                break;
        }

    }

    sendMessage(message, chatId) {

        this.callApi("sendMessage", {"chatId": chatId, "message": message})

    }

}

module.exports = Telegrambot