var L = require("./lib/log.js");
var fs = require("fs");
var Steam = require("steam");

var saveSentry=true;
var dryRun=false;

var errors=0;

var login = {};
var twimod = {};
loadedPlugins = [];

twimod.version = JSON.parse(fs.readFileSync("package.json"))["version"] + " (git-master-" + fs.readFileSync("./.git/refs/heads/master").slice(0,5) + ")";

L.info("IWriteLists " + twimod.version + " starting...");

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

function allStrings(strs){
  var all=true;
  strs.forEach(function(v){
    if( ! v instanceof String ) all=false;
  });
  return all;
}

twimod.P = {};

// is user in group?
twimod.P.is = function(id, what){

  if( ! allStrings([id,what]) ) return false;

  if( what == "user" ) return true; // maybe will return false in the future if the user is banned

  if( fs.existsSync("permissions.json") ){
    var perms = JSON.parse(fs.readFileSync("permissions.json"));
    if( ! perms[what] || !(perms[what] instanceof Array) ){
      return false; // key doesn't exist
    }

    var isRank=false;

    perms[what].forEach(function(v){
        if(v == id) isRank=true;
    });

    return isRank;
  }
  else {
    return false;
  }
}

// add user to group
twimod.P.add = function(id, to){
  if( ! allStrings([id,to]) ) return false;

  if( ! fs.existsSync("permissions.json") ) return false;
  if( twimod.P.is(id, to) ) return true;

  var perms = JSON.parse(fs.readFileSync("permissions.json"));
  if( ! perms[to] ) perms[to] = [];
  perms[to].push(id);
  fs.writeFileSync("permissions.json", JSON.stringify(perms));
  return true;
}

// remove user from group
twimod.P.remove = function(id, from){
  if( ! allStrings([id, from])) return false;

  if( ! fs.existsSync("permissions.json")) return false;
  if( ! twimod.P.is(id, from) ) return true;

  var perms = JSON.parse(fs.readFileSync("permissions.json"));
  perms[from].splice(perms[from].indexOf(id), 1);
  fs.writeFileSync("permissions.json", JSON.stringify(perms));
}

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

if( fs.existsSync("steam.srv") ){
  L.debug("Loading Steam auth servers");
  Steam.servers = JSON.parse(fs.readFileSync("steam.srv"));
}

L.debug("Testing for configuration in environment variables.");

if( process.env.IWRITELISTS_STEAM_USER && process.env.IWRITELISTS_STEAM_PASS ){
  L.debug("Importing environment variables");
  login.accountName=process.env.IWRITELISTS_STEAM_USER;
  login.password=process.env.IWRITELISTS_STEAM_PASS;
}

if( ! dryRun ){
  if( ! fs.existsSync("settings.json") ){
    L.fatal("No settings.json file found! Follow settings.json.example to create your own.");
    process.exit(1);
  }

  L.debug("Parsing settings");
  try {
    settings = JSON.parse(fs.readFileSync("settings.json"));
  } catch(e){
    L.warn("Could not parse settings.json");
    L.fatal(e.stack);
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
  L.debug("WARNING! eventHandler.registerEvent() is deprecated and may be removed in a further release. Please use eventHandler.on() instead.");
  if( (eventName == "message" && events.message) || (eventName == "friendMsg" && events.friendMsg) || eventName == ("chatMsg" && events.chatMsg) || (eventName == "sentry" && events.sentry) || (eventName == "servers" && events.servers) ){
    L.debug("WARNING! Overriding the " + eventName + " event may cause issues if not handled correctly!! Please use .on() instead if you wish to override default events.");
  }
  eventHandler.on({from: "deprecated", name: eventName, callback: callback});
}

eventHandler.on = function(n,c){
  var from,name,callback;
  if( n instanceof String ){
    L.debug("WARNING! Registering events anonymously is highly discouraged. Please use an EventObject instead.");
    from="anonymous_" + new Date().getTime();
    name=n;
    callback=c || function(){};
  }
  else {
    if( ! n.from || ! n.name || ! n.callback ){
      L.debug("WARNING! A plugin is trying to inject an invalid event. Discarding.");
      return false;
    }
    from=n.from;
    name=n.name;
    callback=n.callback;
  }

  if( ! events[from] ) events[from]=callback;
  events[from][name]=callback;
  try {
    bot.on(name, callback);
  }
  catch(e){
    L.warn("A plugin (" + from + ") unsuccessfully tried to register an event (" + e + ")");
    L.debug(e.stack);
  }
}

eventHandler.removeEvent = function(callback){
  L.debug("WARNING! eventHandler.removeEvent() is deprecated and may be removed in a further release. Please use eventHandler.removeListener() instead.");
  bot.removeListener(callback);
}

eventHandler.removeListener = function(from, eventName){
  if( ! allStrings([from, eventName]) || ! events[from][eventName] ){
    L.debug("WARNING! A plugin unsuccessfully tried to remove a listener that doesn't exist.");
  }
  bot.removeListener(eventName, events[from][eventName]);
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

eventHandler.unbindDefaultEvent = function(fo){
  var fq = "default" + fo.splice(0,1).toUpperCase() + fo.splice(1) + "Handler";
  if( events[fq] ) return bot.removeListener(events[fq]);
  else return false;
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
eventHandler.on({ from: "twimod (native code)", name: "friendMsg", callback: events.defaultFriendMessageHandler });

events.defaultGroupMessageHandler = function(id, msg){
  if(! msg[0] == "!") return;
  commandHandler(messageFactory(id, msg.slice(1), true, groupID));
}
eventHandler.on({ from: "twimod (native code)", name: "chatMsg", callback: events.defaultGroupMessageHandler });

events.defaultSentryHandler = function(sentry){
  if( saveSentry ){
    L.info("Saving sentry-file for future log-ins.");
    fs.writeFile(".sentryfile", sentry);
  }
  else {
    L.debug("Recieved sentry-file event, but not saving sentry-file.");
  }
}
eventHandler.on({ from: "twimod (native code)", name: "sentry", callback: events.defaultSentryHandler });

events.defaultServersHandler = function(servers){
  fs.writeFileSync("steam.srv", JSON.stringify(servers));
  L.debug("Saved server list.");
}
eventHandler.on({ from: "twimod (native code)", name: "servers", callback: events.defaultServersHandler });

function messageFactory(id, msg, isGroupMessage, groupID){
  var message = {};
  message.fromID = id;
  message.fromPlayerName = bot.users[id].playerName
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
twimod.messageFactory = messageFactory;
twimod.commandHandler = commandHandler;

L.debug("Reading ./plugins/");

if( ! fs.existsSync("./plugins/") ){
  fs.mkdirSync("./plugins/");
}

if( ! fs.existsSync("./plugincfg/") ){
  fs.mkdirSync("./plugincfg/");
}

var getPkgName=function(v, loadedOK){
  if( fs.existsSync("./plugins/" + v + "/package.json") ){
    var pk=JSON.parse(fs.readFileSync("./plugins/" + v + "/package.json"));
    name=pk.name || "unknown package";
  }
  else {
    name="unknown package";
  }

  if( ! loadedOK) name+="*";
  loadedPlugins.push(name);
}

twimod.plugins = {};
twimod.plugins.isLoaded = function(plg){
  var isLoaded=false;
  loadedPlugins.forEach(function(v){
    if( plg == v ) isLoaded=true;
  });
  return isLoaded;
};
twimod.plugins.isNotLoaded = function(plg){
  return !twimod.plugins.isLoaded(plg);
}
twimod.plugins.constructors = [];

fs.readdirSync("./plugins/").forEach(function(v,k){
  if( ! fs.lstatSync("./plugins/" + v).isDirectory()) return;
  L.debug("Loading plugin " + v + " into constructor list.");
  var loadedOK;
  try {
    twimod.plugins.constructors.push({
      name: v,
      constructor: require("./plugins/" + v)
    });
  }
  catch(e){
    L.warn("Plugin " + v + " could not be loaded into constructor list.");
    L.warn(e.stack);
    errors++;
    loadedOK=true;
  }
});
L.debug("Done loading plugins into constructor list (" + errors + " errors).");

twimod.plugins.loaded = loadedPlugins;

L.debug("Constructing plugins");
twimod.plugins.constructors.forEach(function(v,k){
  L.debug("Constructing plugin " + v.name);
  var loadedOK=true;
  try {
    v.constructor(twimod);
  }
  catch(e){
    L.warn("Plugin " + v.name + " could not be constructed. (" + e + ")");
    L.debug(e.stack);
    errors++;
    loadedOK=false;
  }
  getPkgName(v, loadedOK);
});
L.debug("Done constructing plugins. (" + errors + " errors).");

if( dryRun ){
  if( errors == 0 ){
    L.info("IWriteLists (and any attached plugins) seem to be working normally (unless otherwise stated above).");
  }
  else {
    L.info(errors + " errors occured while starting IWriteLists.");
  }

  if( ! login.accountName && ! login.password ){
    L.debug("I don't have any logon info so I won't continue.");
    process.exit(errors);
  }
}

L.debug("Logging on");
bot.logOn(login);

if( dryRun ){
  setTimeout(function(){ bot.logOff(); }, 10000);
}
