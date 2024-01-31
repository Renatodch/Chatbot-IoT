const axios = require('axios');
const base64 = require('base-64');
urlCbCreateSession = process.env.CB_CREATE_SESSION_URL
let assistant_id = process.env.ASSISTANT_ID;
let url = process.env.CB_URL + assistant_id
let version = `version=${process.env.CB_VERSION}` 

function setSessionItem(name, value) {
    var mySession;
    try {
        mySession = JSON.parse(localStorage.getItem('mySession'));
    } catch (e) {
        console.log(e);
        mySession = {};
    }
    if(mySession == null) mySession ={};
    mySession[name] = value;
    mySession = JSON.stringify(mySession);
    localStorage.setItem('mySession', mySession);
  }
function getSessionItem(name) {
    var mySession = localStorage.getItem('mySession');
    if (mySession) {
        try {
            mySession = JSON.parse(mySession);
            let val = mySession[name]
            return mySession[name];
        } catch (e) {
            console.log(e);
        }
    }
  }

let destroySession=async (session_id)=>{
    try{
        let config ={
            headers: {
                'Authorization': 'Basic ' + base64.encode(process.env.APIUSER + ":" + process.env.APIKEY)
            }
        }
        const response = await axios.delete(`${url}/sessions/${session_id}?${version}`, config)
    }
    catch(error){
        return 0;
    }
}
let createSession=async ()=>{
    try{

        let config ={
            headers: {
                'Authorization': 'Basic ' + base64.encode(process.env.APIUSER + ":" + process.env.APIKEY)
            }
        }
        let data = {input:""};
        const response = await axios.post(`${url}/sessions?${version}`,data,config);
        return response.data.session_id;
    }
    catch(error){
        console.log(error)
        return 0;
    }
}
let inputData=async (text, session_id)=>{
    if(session_id == "") return 0;
    try{
        let config ={
            headers:{
                'Authorization': 'Basic ' + base64.encode(process.env.APIUSER + ":" + process.env.APIKEY),
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        }
        let data = {
            input:{
            text:text
            }
        }
        const response = await axios.post(`${url}/sessions/${session_id}/message?${version}`,JSON.stringify(data),config)
        return response.data.output;
    }
    catch(error){
        console.log(error)
        return 0;
    }
}

module.exports={
    createSession,destroySession,inputData
}