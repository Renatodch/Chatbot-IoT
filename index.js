//'use strict'
require("dotenv").config();

/* Http server */
const express = require('express');
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.json());

const {
    HTTP_PORT,
    BOT_TOKEN,
} = process.env;

const URI = `/webhook/${BOT_TOKEN}`

var myBot;
var mqttClientNotificator;
var requestList = [];

const { Bot } = require('./Bot');
myBot = new Bot();

function send(text,chatId){
    myBot.send(text,chatId)
}

module.exports = {
    send
}
const { MqttAssistantClient,ste,topic } = require('./MqttAssistantClient');
mqttClient = new MqttAssistantClient("MQTT client assitant","A001");

/*************** HTTP events ******************/

app.post(URI, async (req,res)=>{
    let chatId;
    let text;
    try{
        chatId = req.body.message.chat.id
        text = req.body.message.text
        let result = await myBot.processRequest(text,chatId)
        if(result !== 0){
            mqttClient.publishRequest(result);
        }
        return res.send();
    }catch(error){
        return res.send();
    }
});

async function main(){
    await app.listen(HTTP_PORT)
    console.log("Http server iniciado en el puerto "+HTTP_PORT);
    const res =  await myBot.setWebHook();
    console.log(res.data)
    console.log(URI)
    mqttClient.Init();
}

main();

