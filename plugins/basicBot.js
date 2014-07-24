var fs=require("fs");

function getVersion(){
  return "git-master-" + fs.readFileSync("./.git/refs/heads/master").slice(0,10);
}

function init(twimod){
  eh=twimod.eventHandler;

  eh.registerCommand("about", function(obj){
    obj.reply("My Amazing IWriteLists bot\n(c) 2013-2014 No More Sugar, tdlive aw'sum & contributors.\nPowered by IWriteLists " + getVersion() + ". http://github.com/NoMoreSugar/iwritelists");
  });
}

module.exports = init;
