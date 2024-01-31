'use strict'
const mqtt = require('mqtt');
const { send } = require('./index')

const ste = {
    WAITING_RESPONSE: 2,
    WAITING_NOTIFICATION : 1,
    INIT : 0
}
const topic = {
    SUBSCRIBE : "/station/state/",
    PUBLISH : "/cloud/request/",
}

const vars = {
    TEMPERATURA:0,
    DISTANCIA:1,
    SWITCH:2,
    LIGHT:3,
}
function MqttAssistantClient(name, clientId){
    
    this.client;
    this.name = name;
    let options = {
        clientId:clientId,
        keepalive:60,
        reconnectPeriod: 1000,
        connectTimeout:  90*1000,
        resubscribe: true,
        queueQoSZero: true,
        rejectUnauthorized: true,
        clean : true,
    }
    
	this.Init = function(){
        console.log(`${this.name}: inciando conexion con el broker`)
        this.client = mqtt.connect(`${process.env.BROKER_URL}`,options);
        this.client.on("connect", clientConnectedEvent);
        this.client.on('close', clienDisconnectedEvent);
        this.client.on('message',msgReceivedEvent);
        this.client.state= ste.INIT;

	}	

    this.publishRequest = clientPublishAction;
}

let msgReceivedEvent = function(topic,payload,packet){   
    const data = JSON.parse(payload);
    switch(this.state){
        case ste.INIT:
            break
        case ste.WAITING_NOTIFICATION:
        case ste.WAITING_RESPONSE:
            let response = processDeviceJson(data);
            send(response, data.chatId);          
            break;
    }
}

let processDeviceJson  = (data) =>{
    console.log(data)
    let response;
    response =data.alerta? handleNotification(data):handleResponse(data);
    return response;
};
let handleNotification = (data)=>{
    switch(data.type){
        case vars.TEMPERATURA:
            return `Alerta! La temperatura es de ${data.value} ${data.unidad} en la estacion ${data.id}`
        case vars.DISTANCIA:
            return `Alerta! El nivel de líquido es de ${data.value} ${data.unidad} en estacion ${data.id}`
        case vars.SWITCH:
            return `Alerta! El interruptor se abrió en la estacion ${data.id}`
    }
}

let handleResponse = (data)=>{
    switch(data.type){
        case vars.TEMPERATURA:
            return `La temperatura es de ${data.value} ${data.unidad} en la estacion ${data.id}`
        case vars.DISTANCIA:
            return `El nivel de líquido es de ${data.value} ${data.unidad} en la estacion ${data.id}`
        case vars.SWITCH:
            return `El interruptor está ${data.value?"cerrado":"abierto"} en la estacion ${data.id}`
        case vars.LIGHT:
            return `Se ${data.value?"encendió":"apagó"} el foco LED en la estacion ${data.id}`
    }
}



let clientConnectedEvent = function(){
    console.log("mqtt client conectado !!");

    let op={
        retain:false,
        qos:0
    };
    
    if (this.connected==true){ // && this.state == ste.INIT){ 
        this.subscribe(topic.SUBSCRIBE);
        console.log(`mqtt client suscrito`)
        this.state = ste.WAITING_NOTIFICATION;
    }
}

let clientPublishAction = function(payload){
    if (this.client.connected==true){ 
        console.log("publicando...")
        this.client.publish(`${topic.PUBLISH}${payload.device}`, payload.request) 
    }
}

let clienDisconnectedEvent = function(){
    console.log("cliente desconectado...");
}

module.exports ={MqttAssistantClient,ste,topic} 
