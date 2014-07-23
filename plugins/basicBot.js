function init(twimod){
  eh=twimod.eventHandler;

  eh.registerEvent("loggedOn", function(){
    twimod.bot.setPersonaState(twimod.steam.EPersonaState.Online);
  })
}

module.exports = init;
