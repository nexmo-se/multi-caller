require('dotenv').config();
var express = require('express');
var path = require('path');
const {Vonage} = require("@vonage/server-sdk");

const { tokenGenerate } = require('@vonage/jwt');
const {Users} = require('@vonage/users');
const { Auth } = require('@vonage/auth');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const fs = require('fs');
const { list } = require('pm2');
const conv_name = "multicall-vonage-"+Date.now()
var app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
const port = process.env.PORT;
const Vonage_API_KEY = process.env.API_KEY;
const Vonage_SECRET = process.env.API_SECRET;
const Vonage_APPLICATION_ID = process.env.APPLICATION_ID;
const Vonage_PRIVATE_KEY = process.env.PRIVATE_KEY;
const Vonage_LVN = process.env.VONAGE_LVN;
const APIHOST = process.env.APIHOST;
const WSHOST = process.env.WSHOST;
var privateKey = fs.readFileSync(Vonage_PRIVATE_KEY);
const join = path.join


//store Calls here
var calls = {}


//load the css, js, fonts to static paths so it's easier to call in template
app.use("/fonts", express.static(join(__dirname, "node_modules/bootstrap/fonts")));
app.use("/css", express.static(join(__dirname, "node_modules/bootstrap/dist/css")));
app.use("/css", express.static(join(__dirname, "node_modules/bootstrap-select/dist/css")));
app.use("/js", express.static(join(__dirname, "node_modules/bootstrap/dist/js")));
app.use("/js", express.static(join(__dirname, "node_modules/bootstrap-select/dist/js")));
app.use("/js", express.static(join(__dirname, "node_modules/jquery/dist")));
app.use("/js", express.static(join(__dirname, "node_modules/@vonage/client-sdk/dist")));


app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'views')));
app.use("/node_modules", express.static(path.join(__dirname, 'node_modules')))
console.log(Vonage_API_KEY, Vonage_APPLICATION_ID, Vonage_SECRET, privateKey)

auth = new Auth({
  apiKey: Vonage_API_KEY,
  apiSecret: Vonage_SECRET,
  applicationId: Vonage_APPLICATION_ID,
  privateKey: Vonage_PRIVATE_KEY
})

// const conf-name = 
const vonage = new Vonage(auth, {apiHost: APIHOST})

//const users =  new Users (auth, {debug: true});
const users =  vonage.users

//Check if the user is available. If not, create one
users.getUser("caller")
  .then((resp)=>{
    console.log("Caller User Found")
  })
    
  .catch((error)=>{
    console.dir(error,{depth:9})
    console.log(error.response.statusText)
    if(error.response.statusText == "Not Found"){
      console.log("Caller User not found, creating user")
      users.createUser({name:"caller"})
        .then(resp => console.log(resp))
        .catch(err => console.error(err));
    }
  });


//ACL for User
const aclPaths = {
  "paths": {
    "/*/rtc/**": {},
    "/*/users/**": {},
    "/*/conversations/**": {},
    "/*/sessions/**": {},
    "/*/devices/**": {},
    "/*/image/**": {},
    "/*/media/**": {},
    "/*/knocking/**": {},
    "/*/legs/**": {}
  }
}

//Generates a user token. We will use this on our client
const user_token = () => {return tokenGenerate(Vonage_APPLICATION_ID, privateKey, {
  //expire in 24 hours
  exp: Math.round(new Date().getTime()/1000)+86400,
  sub: "caller",
  acl: aclPaths,
})};
var token = user_token()
console.log(token)

//pass the token and APIHOST to out index.ejs
app.get('/', function (req, res) {
	res.render('index.ejs', {
    user_token: token,
    api_host: APIHOST,
    ws_host: WSHOST
  });
});


app.post('/webhooks/call-event', function (req, res) {
  console.log("EVENT\n",req.body)
  const status = req.body.status || "nil"
  const to = req.body.to || "nil"
  const uuid = req.body.uuid || "000"
  const disconnected_by = req.body.disconnected_by || "nil"
  const rate = parseFloat(req.body.rate) || 0.00

  //when someone answers, hangup other callers
  if(status == "answered" && to!="caller"){    
    members_to_remove = []
    Object.entries(calls).forEach(([parent_uuid,member_uuid]) => {      
      
      if(member_uuid.includes(uuid)){
        console.log("All UUID in registry:", member_uuid)
        console.log("A Caller answered, hanging up other callers")
        member_uuid.forEach((u, index) => {
          if(u!=uuid){
            console.log("killing",uuid)
            vonage.voice.hangupCall(u)
            .then(resp =>console.log())
            .catch(err => console.error());
            members_to_remove.push[u]
          }
        })
        member_uuid = [uuid]
        console.log("Killed UUID", members_to_remove)
        return
      }
    })
    
  }

  // if the caller who answered hangs up, end the call
  if(status == "completed" && to!="caller" && disconnected_by == "user" && rate > 0.00){
    Object.entries(calls).forEach(([parent_uuid,member_uuid]) => {      
      if(member_uuid.includes(uuid)){
        console.log("Caller left, Ending Call")
        vonage.voice.hangupCall(parent_uuid)
          .then(resp =>console.log())
          .catch(err => console.error());           
        delete calls[uuid] 
        return
      }
    })
  }

  //when the app hangs up, end the call
  if(status == "completed" && to=="caller"){
    console.log("App Hangup, Ending Call")
    calls[uuid].forEach((u) => {
      vonage.voice.hangupCall(u)
      .then(resp =>console.log())
      .catch(err => console.error());
    })
    delete calls[uuid]  
  }

  return res.sendStatus(200)
});

app.post('/webhooks/answer', function (req, res) {
	console.log(req.body)
  const numbers= String(req.body["to"]).split(",")
  const custom_data = JSON.parse(req.body["custom_data"]||'{"type":"phone"}')
  const type = custom_data["type"] || "phone"
  if(type == "phone"){
    res.json([
      {
        "action": "talk",
        "text": "Connecting you to an agent.",
      },
      {
        "action": "conversation",
        "name": conv_name,
        "startOnEnter": true,
        "endOnExit": true,
      }
    ] ).status(200)
  }
  if(type == "app"){
    calls[req.body.uuid] = []
    res.json([
      {
        "action": "talk",
        "text": "Please wait for a person to pickup the call."
      },
      {
        "action": "conversation",
        "name": conv_name,
        "startOnEnter": false,
        "musicOnHoldUrl": ["https://nexmo-community.github.io/ncco-examples/assets/phone-ringing.mp3"],
        "endOnExit": true,
      }
    ]).status(200)
    numbers.forEach((num) => {
      console.log("Number", num)
      vonage.voice.createOutboundCall({
        to: [
          {
            type: 'phone',
            number: num,
          },
        ],
        from: {
          type: 'phone',
          number: Vonage_LVN,
        },
        ncco:[
          {
            "action": "talk",
            "text": "Welcome",
          },
          {
            "action": "conversation",
            "name": conv_name,
            "startOnEnter": true
          }
        ] 
      })
        .then((resp) => {
          console.log("Response",resp)
          calls[req.body.uuid].push(resp.uuid)                    
          vonage.voice.getCall(resp.uuid)
            .then(resp =>console.log(resp))
            .catch(err => console.error(err));
        })
        .catch((error) => console.error(error));
    } )
   
    
  }
  
});


const server = app.listen(port);
server.on('upgrade', (request, socket, head) => {
//   wsServer.handleUpgrade(request, socket, head, socket => {
//     wsServer.emit('connection', socket, request);
//   });
});