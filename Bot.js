const axios = require('axios');
const {inputData,destroySession, createSession} = require('./utils')

const {
    BOT_TOKEN,
    SERVER_URL,
} = process.env;

const reqs = {
    REQ_TEMP:"temp",
    REQ_DISTANCE:"distance",
    REQ_SWITCH:"switch",
}

const order ={
    ORDER_LIGHT:"light="
}



const URI = `/webhook/${BOT_TOKEN}`
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`
const WEBHOOK_URL = SERVER_URL + URI



function Bot(){
    //this.chatId = process.env.CHAT_ID

    this.setWebHook= async()=>{
        try{
            return await axios.get(`${TELEGRAM_API}/setWebhook?url=${WEBHOOK_URL}`)
        }catch(error){
            return {data:"No se pudo establecer el webhook para el bot"};   
        }
    }

    this.send = async (text, chatId)=>{    
        await axios.post(`${TELEGRAM_API}/sendMessage`, {
            chat_id: parseInt(chatId),
            text: text
        })
    }

    this.processRequest  = async (text,chatId) =>{
        if(chatId == undefined || text == undefined)
            return 0;
        //Validar stationId con datos de bd en una proxima version...
        let result = await getChatbotResponse(text)
        
        if(result.code === 0){
            this.send(result.response,chatId)
            return 0;
        }
        //look for station id
        let pattern =/[s|S]\d{3}(\s*)/g
        let regRes = text.match(pattern)
        if( regRes == "" || regRes == null){
            this.send("No le entendí bien, indique el id de la estacion en su mensaje",chatId)
            return 0
        }
        let stationId = regRes[0]
        //console.log(stationId)
        result.response.device =  stationId.toUpperCase();
        //console.log(result)
        return result.response;
    };
}

let getChatbotResponse = async(text)=>{
    let session_id = await createSession();
    let result = await inputData(text,session_id)
    await destroySession(session_id);
    if(result === 0){
        return {
            response:"Hubo un error procesando su mensaje",
            code:0
        }
    }
   //verificar que haya detectado el station id
    if(result.generic.length>0){
        let textRes = result.generic[0].text;
        //console.log(textRes)
        if(textRes.includes("Hola")){
            return {
                response:textRes,
                code:0
            }
        }else if(textRes.includes("OperandoFoco")){
            if(result.entities.length>0){
                //result.entities.forEach(i => console.log(i))
                let lightAction = result.entities.filter(i => i.entity=="lightAction")[0] || null 
                //let stationId = result.entities.filter(i => i.entity=="stationId")[0] || null 
                
                if(lightAction == null /*|| stationId == null*/){
                    return {
                        response:"Hubo un error procesando su mensaje",
                        code:0
                    }
                }
                return {
                    code:1,
                    response : {
                        device:"",
                        request:`${order.ORDER_LIGHT}${lightAction.value}`,
                    }
                }
            }

        }else if(textRes.includes("Consultando")){
            //if(result.entities.length>0){
                
                //let stationId = result.entities.filter(i => i.entity=="stationId")[0] || null 
                
                //if(stationId == null){
                  //  return ProcessError()
                //}
                let intent = result.intents.length > 0? result.intents[0] : null
                if(intent == null){
                    return ProcessError()
                }
                let request;
                switch(intent.intent){
                    case "TemperatureRequest":
                        request = reqs.REQ_TEMP 
                        break;
                    case "SwitchRequest":
                        request = reqs.REQ_SWITCH 
                        break;
                    case "LiquidRequest":
                        request = reqs.REQ_DISTANCE 
                        break;
                    default:
                        return ProcessError()
                }
                return {
                    code:1,
                    response : {
                        device:"",
                        request:`${request}`,
                    }
                };
            //}
        }else{
            return {
                response:textRes,
                code:0
            }
        }
    }
    return 0
}

let ProcessError = ()=>{
    return {
        response:"Hubo un error procesando su mensaje",
        code:0
    }
}

module.exports={
    Bot
}

