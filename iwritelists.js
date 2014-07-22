var L = require("./lib/log.js");
var fs = require("fs");

if( ! fs.existsSync("settings.json") ){
  L.fatal("No settings.json file found! Follow settings.json.example to create your own.");
  process.exit(1);
}

var login = {};

// examine arguments
process.argv.forEach(function(v,k){
  // debug mode (-d)
  if( v == "-d" || v == "--debug" )
    L.debugLogging = true;
  // we have a Steam auth code
  else if( v == "-a" || v == "--authCode" ){
    login.authCode=process.argv[k+1];
    L.debug("Using SteamGuard auth code " + login.authCode);
  }
});
