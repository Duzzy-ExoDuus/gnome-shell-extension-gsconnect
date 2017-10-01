"use strict";

// Imports
const Lang = imports.lang;

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;

// Local Imports
function getPath() {
    // Diced from: https://github.com/optimisme/gjs-examples/
    let m = new RegExp("@(.+):\\d+").exec((new Error()).stack.split("\n")[1]);
    let p = Gio.File.new_for_path(m[1]).get_parent().get_parent().get_parent();
    return p.get_path();
}

imports.searchPath.push(getPath());

const Common = imports.common;
const Protocol = imports.service.protocol;
const PluginsBase = imports.service.plugins.base;


var METADATA = {
    name: "runcommand",
    incomingPackets: ["kdeconnect.runcommand.request"],
    outgoingPackets: ["kdeconnect.runcommand"],
    settings: { commands: {} }
};


/**
 * RunCommand Plugin
 * https://github.com/KDE/kdeconnect-kde/tree/master/plugins/remotecommand
 *
 * TODO: expose commands over DBus
 *       a PR for some new stuff was submitted
 */
var Plugin = new Lang.Class({
    Name: "GSConnectRunCommandPlugin",
    Extends: PluginsBase.Plugin,
    
    _init: function (device) {
        this.parent(device, "runcommand");
    },
    
    handlePacket: function (packet) {
        Common.debug("RunCommand: handlePacket()");
        
        if (packet.body.hasOwnProperty("requestCommandList")) {
            this.sendCommandList();
        } else if (packet.body.hasOwnProperty("key")) {
            if (this.settings.commands.hasOwnProperty(packet.body.key)) {
                GLib.spawn_command_line_async(
                    "/bin/sh -c " + this.settings.commands[packet.body.key].command
                );
            }
        }
    },
    
    reconfigure: function () {
        Common.debug("RunCommand: reconfigure()");
        
        if (this.device.paired && this.device.connected) {
            this.sendCommandList();
        }
    },
    
    sendCommandList: function () {
        Common.debug("RunCommand: sendCommandList()");
        
        let packet = new Protocol.Packet();
        packet.type = "kdeconnect.runcommand";
        packet.body = {
            commandList: JSON.stringify(this.settings.commands)
        };
        
        this.device._channel.send(packet);
    }
});

