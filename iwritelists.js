var L = require("./lib/log.js");
var fs = require("fs");
var Steam = require("steam");

var saveSentry=true;
var dryRun=false;

var errors=0;

var login = {};
var twimod = {};
var twidb = {};

twidb.write = function(key, keyValue){
  var prevKey = JSON.parse(fs.readFileSync("twi.db"));
  prevKey[key]=keyValue;
  return fs.writeFileSync("twi.db", JSON.stringify(prevKey));
}
twidb.read = function(key){

  if( ! fs.existsSync("twi.db") ){
    fs.writeFileSync("twi.db", JSON.stringify({}));
  }

  var db = JSON.parse(fs.readFileSync("twi.db"));

  if(! db[key] ) return {};
  else return db[key];
}

twimod.twidb = twidb;

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
  else if( v == "-t" || v == "--test"){
    L.debugLogging = true;
    dryRun=true;
    L.debug("Running in test/dry-run mode.");
  }
});

if( ! dryRun ){
  if( ! fs.existsSync("settings.json") ){
    L.fatal("No settings.json file found! Follow settings.json.example to create your own.");
    process.exit(1);
  }

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
}
else {
  L.debug("Skipping configuration as we're running in dry-run mode.");
}

bot = new Steam.SteamClient();

L.debug("Creating event objects");

var eventHandler = {};
var events = {};

eventHandler.registerEvent = function(eventName, callback){
  if( (eventName == "message" && events.message) || (eventName == "friendMsg" && events.friendMsg) || eventName == ("chatMsg" && events.chatMsg) || (eventName == "sentry" && events.sentry) ){
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
  commands[commandName.toLowerCase()]=callback;
}

L.debug("Initializing default events");

commands.unknown = function(message){
  message.reply("Unknown command.");
}

function commandHandler(message){
  if( commands[message.command.toLowerCase()] ) commands[message.command.toLowerCase()](message);
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
eventHandler.registerEvent("sentry", events.defaultSentryHandler)

function messageFactory(id, msg, isGroupMessage, groupID){
  var message = {};
  message.fromID = id;
  message.message = msg;
  message.split = message.message.split(" ");
  message.command = message.split[0];
  message.args = message.split.slice(1);
  message.twimod = twimod;

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

L.debug("Preparing twimod");
twimod.eventHandler = eventHandler;
twimod.bot = bot;
twimod.steam = Steam;
twimod.L = L;

L.debug("Reading ./plugins/");

if( ! fs.existsSync("./plugins/") ){
  fs.mkdirSync("./plugins/");
}

fs.readdirSync("./plugins/").forEach(function(v,k){
  if( ! fs.lstatSync("./plugins/" + v).isDirectory()) return;
  L.debug("Loading plugin " + v);
  try {
    require("./plugins/" + v)(twimod);
  }
  catch(e){
    L.prettyStackTrace({e: e, msg: "Plugin " + v + " could not be injected."});
    errors++;
  }
});
L.debug("Done loading plugins");

if( dryRun ){
  if( errors == 0 ){
    L.info("IWriteLists (and any attached plugins) seem to be working normally (unless otherwise stated above).");
  }
  else {
    L.info(errors + " errors occured while starting IWriteLists.");
  }
  process.exit(errors);
}

L.debug("Logging on");
try {
  bot.logOn(login);
} catch(e){
  L.prettyStackTrace({e: e, msg: "Could not log in", isFatal: true});
}
