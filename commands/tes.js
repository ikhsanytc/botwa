class tes {
    constructor(sock, sender){
        sock.sendMessage(sender, {
            text: "halo ada apa?"
        })
    }
}

module.exports = tes;