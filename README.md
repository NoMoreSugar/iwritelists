# iwritelists

A modular Steam chat bot framework based on node-steam.

## Installing

It's really simple, I promise!

    git clone https://github.com/NoMoreSugar/iwritelists
    cd iwritelists
    npm install


Note that any special instructions involving [ursa](https://github.com/Medium/ursa) on Windows will need to be observed.

To install a basic command implementation (with a recommended "about" command):

    cd plugins
    git clone https://github.com/NoMoreSugar/iwritelists-basicbot
    cd iwritelists-basicbot
    npm install

## Writing Plugins

Plugins are ordinary Node modules. They have a package.json, etc., and are placed in their own directory in ./plugins/.

    var init = function(twimod){
       
       eh = twimod.eventHandler;
       
       // register some kind of event
       eh.registerEvent("loggedOn", function(){
            console.log("event fired!!");
       });
       
       // now a command
       eh.registerCommand("myamazingcommand", function(msg){
            msg.reply("2amazing4u");
       });
    }
    
    module.exports=init;

## Credits

iwritelists, a Valve Steam client autonomous bot framework based on node-steam

Copyright (c) 2013-14 [No More Sugar](http://nomoresugar.github.io), [tdlive aw'sum](http://tdlive.me/), and
[contributors](https://github.com/NoMoreSugar/iwritelistsgraphs/contributors).

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
