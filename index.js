const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@adiwajshing/baileys");
const {Boom} = require("@hapi/boom");
const fs = require("fs");

async function startBot() {
    const {state, saveCreds} = await useMultiFileAuthState("./sessions");
    const sock = makeWASocket({
        printQRInTerminal: true,
        auth: state
    });
    sock.ev.on("creds.update", saveCreds);
    sock.ev.on('connection.update', (up) => {
        const {lastDisconnect, connection} = up;
        if(connection){
            console.log("status : "+connection);
        }
        if(connection === "close"){
            let reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            if(reason === DisconnectReason.badSession){
                console.log("bad session please delete folder session and scan again");
            }else if(reason === DisconnectReason.connectionClosed){
                console.log("try connecting again");
                startBot();
            }else if(reason === DisconnectReason.connectionLost){
                console.log("connection lost try to conneting again...");
                startBot();
            }else if(reason === DisconnectReason.connectionReplaced){
                console.log("connection replaced another new session is opened please close current session first");
            }else if(reason === DisconnectReason.timedOut){
                console.log("connection timed out try again...");
                startBot();
            }else {
                sock.end("unknown DisconnectReason!");
            }
        }
    })
    sock.ev.on("messages.upsert", ({messages, type}) => {
        let pesan;
        let sender;
        let name;

        if(messages[0].message){
            pesan = messages[0].message.conversation;
            sender = messages[0].key.remoteJid;
            name = messages[0].pushName;
        }
        if(pesan){
            console.log("ada pesan!");
            console.log("pesan = "+pesan);
            console.log("pengirim = "+sender);
            console.log("alias = "+name);
        }
        if(fs.existsSync("./commands/"+pesan+".js")){
            const key = {
                remoteJid: sender,
                id: messages[0].key.id,
                participant: messages[0].key.participant
            }
            sock.readMessages([key]);
            const cmd = require("./commands/"+pesan);
            new cmd(sock, sender);
            console.log("----------------------------------------------------------------");
        }else {
            console.log(`${name} memasukan command yang tidak valid`);
            console.log("----------------------------------------------------------------");
        }
    })
}

startBot();