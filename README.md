# iwritelists [![Build Status](https://travis-ci.org/NoMoreSugar/iwritelists.svg?branch=master)](https://travis-ci.org/NoMoreSugar/iwritelists)

A modular Steam chat bot framework based on node-steam.

## Installing

Download [Node.js](http://nodejs.org/).

After that, it's really simple, I promise!

    git clone https://github.com/NoMoreSugar/iwritelists #or download the .zip
    cd iwritelists
    npm install
    node iwritelists.js #or npm start if you know what you're doing

*Note* that any special instructions involving [ursa](https://github.com/Medium/ursa) on Windows will need to be
observed.

To install a basic command implementation (with a recommended "about" command):

    cd plugins
    git clone https://github.com/NoMoreSugar/iwritelists-basicbot

P.S. - instead of using Git you can just download the .zip from NoMoreSugar/iwritelists-basicbot.

### settings.json

settings.json is the configuration for IWriteLists. You can use settings.json.example to create a new settings.json.
The most important properties are the "username" and "password" fields, which are necessary to actually log on.

You can also set these fields with environment variables ``IWRITELISTS_STEAM_USER`` and ``IWRITELISTS_STEAM_PASS``
(although it isn't at all recommended).

If you haven't run IWriteLists before and have SteamGuard enabled on the account, you'll need to specify the
SteamGuard code like

    node iwritelists.js -a 8372

### Permissions

To restrict access of (mainly) administrative commands, IWriteLists has a built-in permissions system. This data is
stored in ``permissions.json``. It is recommended that you set these up once you install IWriteLists.

The default (and usually expected) ranks are:

- ``superadmin``: Has access to literally everything. This should be limited to the bot owner ONLY.
- ``admin``: Has access to most things, excluding certain administration functions such as modifying permissions or
starting/stopping the bot.
- ``moderator``: Has access to moderation functions only (ban, etc.)
- ``user``: Automatically set by IWriteLists to any user the bot is friends with. This should be limited to commands
that don't affect other user(s).

*Note* that permissions aren't heritable. You will need to add users to the superadmin, admin and moderator group in
order for a superadmin to have access to *all* commands.

If the permissions.json file is not set up, any non-user-level commands will be rejected.

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
[contributors](https://github.com/NoMoreSugar/iwritelists/graphs/contributors).

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
