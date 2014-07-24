var L = require("./lib/log.js");
var fs = require("fs");
var Steam = require("steam");

var saveSentry=true;

if( ! fs.existsSync("settings.json") ){
  L.fatal("No settings.json file found! Follow settings.json.example to create your own.");
  process.exit(1);
}

var login = {};

// examine arguments
process.argv.forEach(function(v,k){
  // debug mode (-d)
  if( v == "-d" || v == "--debug" ){
    L.debugLogging = true;
    L.debug("Debug logging ON.");
  }
  else if( v == "-a" || v == "--authCode" ){
    login.authCode=process.argv[k+1];
    L.debug("Using SteamGuard auth code " + login.authCode);
  }
  else if( v == "-n" || v == "--no-sentry" ){
    L.debug("Not saving sentry-file.");
    saveSentry=false;
  }
});

L.debug("Parsing settings");
try {
  settings = JSON.parse(fs.readFileSync("settings.json"));
} catch(e){
  L.prettyStackTrace({e: e, msg: "Could not read/parse settings.json", isFatal: true});
}

if( ! settings.accountName || ! settings.password ){
  L.fatal("There must be a 'accountName' and 'password' property in settings.json");
  process.exit(1);
}

L.debug("Reading account name/password");
login.accountName = settings.accountName;
login.password = settings.password;

if( ! fs.existsSync(".sentryfile") ){
  L.warn("Sentry file doesn't exist. If SteamGuard is enabled you will need to specify your one-time use key with -a.");
}
else {
  L.debug("Reading .sentryfile.");
  login.shaSentryfile = fs.readFileSync(".sentryfile");
}

bot = new Steam.SteamClient();

L.debug("Creating event objects");

var eventHandler = {};
var events = {};

eventHandler.registerEvent = function(eventName, callback){
  if( eventName == "message" || eventName == "friendMsg" || eventName == "chatMsg" || eventName == "sentry" ){
    L.warn("Overriding the " + eventName + " event may cause issues if not handled correctly!!");
  }
  events[eventName]=callback;
  bot.removeAllListeners(eventName);
  bot.on(eventName, events[eventName]);
}

eventHandler.removeEvent = function(eventName){
  bot.removeListener(eventName);
}

eventHandler.doOnce = function(eventName, callback){
  bot.once(eventName, callback);
}

eventHandler.getEvent = function(eventName){
  return events[eventName];
}

var commands = {};

eventHandler.registerCommand = function(commandName, callback){
  commands[commandName]=callback;
}

L.debug("Initializing default events");

commands.unknown = function(message){
  message.reply("Unknown command.");
}

function commandHandler(message){
  if( commands[message.command] ) commands[message.command](message);
  else commands["unknown"](message);
}

events.defaultFriendMessageHandler = function(id, msg){
  if( msg == "" ){
    L.info(bot.users[id].playerName + " (" + id + ") is typing...");
    return;
  }
  L.info(bot.users[id].playerName + " (" + id + "): " + msg);
  commandHandler(messageFactory(id, msg, false));
}
eventHandler.registerEvent("friendMsg", events.defaultFriendMessageHandler);

events.defaultGroupMessageHandler = function(id, msg){
  if(! msg[0] == "!") return;
  commandHandler(messageFactory(id, msg.slice(1), true, groupID));
}
eventHandler.registerEvent("chatMsg", events.defaultGroupMessageHandler);

events.defaultSentryHandler = function(sentry){
  if( saveSentry ){
    L.info("Saving sentry-file for future log-ins.");
    fs.writeFile(".sentryfile", sentry);
  }
  else {
    L.debug("Recieved sentry-file event, but not saving sentry-file.");
  }
}
eventHandler.registerEvent("sentry", events.defaultSentryHandler);

events.defaultLogonHandler = function(){
  bot.setPersonaState(Steam.EPersonaState.Online);

  L.debug("Preparing twimod (node-steam API is ready)");
  var twimod = {};
  twimod.eventHandler = eventHandler;
  twimod.bot = bot;
  twimod.steam = Steam;

  L.debug("Reading ./plugins/");
  fs.readdirSync("./plugins/").forEach(function(v,k){
    L.debug("Loading plugin " + v);
    try {
      require("./plugins/" + v)(twimod);
    }
    catch(e){
      L.prettyStackTrace({e: e, msg: "Plugin " + v + "could not be injected."})
    }
  });

  L.debug("Done loading plugins");
}
eventHandler.registerEvent("loggedOn", events.defaultLogonHandler);

function messageFactory(id, msg, isGroupMessage, groupID){
  var message = {};
  message.fromID = id;
  message.message = msg;
  message.split = message.message.split(" ");
  message.command = message.split[0];
  message.args = message.split.slice(1);

  if( isGroupMessage ) message.replyTo = groupID;
  else message.replyTo = id;

  message.reply = function(msg){
    if( isGroupMessage ) bot.sendMessage(groupID, bot.users[id].playerName + ": " + msg);
    else bot.sendMessage(id, msg);
  }

  message.send = function(msg){
    bot.sendMessage(message.replyTo, msg);
  }

  return message;
}

L.debug("Logging on");
try {
  bot.logOn(login);
} catch(e){
  L.prettyStackTrace({e: e, msg: "Could not log in", isFatal: true});
}
