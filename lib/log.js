var fs=require("fs");

// Enumerated values for logging levels
var Log = {};
Log.e = {};
Log.e.DEBUG = 0;
Log.e.INFO = 1;
Log.e.WARNING = 2;
Log.e.ERROR = 3;
Log.e.FATAL = 4;

// If true, logs debug msgs
Log.debugLogging = false;

// Gets the current date for use with log functions
Log.getDate = function(date){
  var d = new Date(date || Date.now());
  var pad = function(n){return n<10 ? '0'+n : n} // from http://stackoverflow.com/a/12550320
  return d.getFullYear() + "-" + pad(d.getMonth()+1) + "-" + pad(d.getDate()) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
}

// Log things
Log.custom = function(lvl, msg){

  if( lvl == Log.e.DEBUG && ! Log.debugLogging ) return;

  var lvltext;

  switch(lvl){
    case Log.e.DEBUG:
      lvltext="DEBUG";
      break;
    case Log.e.INFO:
      lvltext="INFO";
      break;
    case Log.e.WARNING:
      lvltext="WARNING";
      break;
    case Log.e.ERROR:
      lvltext="ERROR";
      break;
    case Log.e.FATAL:
      lvltext="FATAL";
      break;
    default:
      lvltext="UNKNOWN";
  }

  var txt="[" + lvltext + " " + Log.getDate() + "]: " + msg;
  console.log(txt);
  if(! lvl==Log.e.DEBUG ) fs.appendFileSync("./iwritelists.log", txt + "\n");
}

// Wrapper functions to Log.custom()
Log.debug = function(msg){
  Log.custom(Log.e.DEBUG, msg);
}
Log.info = function(msg){
  Log.custom(Log.e.INFO, msg);
}
Log.warn = function(msg){
  Log.custom(Log.e.WARNING, msg);
}
Log.error = function(msg){
  Log.custom(Log.e.ERROR, msg);
}
Log.fatal = function(msg){
  Log.custom(Log.e.FATAL, msg);
}

// !! DEPRECATED !!
Log.prettyStackTrace = function(obj){
  Log.warn("PrettyStacktrace is DEPRECATED. Use Log.warn(e.stack) or Log.fatal(e.stack) instead.");
  Log.warn(obj.stack);
}

module.exports = Log;
