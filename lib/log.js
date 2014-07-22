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
Log.getDate = function(){
  var d = new Date();
  return d.getFullYear() + "-" + (d.getMonth()+1) + "-" + d.getDate() + " " + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds();
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

  console.log("[" + lvltext + " " + Log.getDate() + "]: " + msg);
}

// Wrapper functions to Log.custom()
Log.debug = function(msg){
  Log.debug(Log.e.DEBUG, msg);
}
Log.info = function(msg){
  log.custom(Log.e.INFO, msg);
}
Log.warning = function(msg){
  Log.custom(Log.e.WARNING, msg);
}
Log.error = function(msg){
  Log.custom(Log.e.ERROR, msg);
}
Log.fatal = function(msg){
  Log.custom(Log.e.FATAL, msg);
}

module.exports = Log;
