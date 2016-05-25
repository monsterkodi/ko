
/*
000   000  00000000  000   000  000   000   0000000   00     00  00000000
000  000   000        000 000   0000  000  000   000  000   000  000     
0000000    0000000     00000    000 0 000  000000000  000000000  0000000 
000  000   000          000     000  0000  000   000  000 0 000  000     
000   000  00000000     000     000   000  000   000  000   000  00000000
 */

(function() {
  var keycode, keyinfo,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  keycode = require('keycode');

  keyinfo = (function() {
    function keyinfo() {}

    keyinfo.modifierNames = ['shift', 'ctrl', 'alt', 'command'];

    keyinfo.isModifier = function(keyname) {
      return indexOf.call(this.modifierNames, keyname) >= 0;
    };

    keyinfo.modifiersForEvent = function(event) {
      var mods;
      mods = [];
      if (event.metaKey) {
        mods.push('command');
      }
      if (event.altKey) {
        mods.push('alt');
      }
      if (event.ctrlKey) {
        mods.push('ctrl');
      }
      if (event.shiftKey) {
        mods.push('shift');
      }
      return mods.join('+');
    };

    keyinfo.join = function() {
      var args;
      args = [].slice.call(arguments, 0);
      args = args.filter(function(e) {
        return e.length;
      });
      return args.join('+');
    };

    keyinfo.comboForEvent = function(event) {
      var key;
      key = keycode(event);
      if (indexOf.call(keyinfo.modifierNames, key) < 0) {
        return keyinfo.join(keyinfo.modifiersForEvent(event), key);
      }
      return "";
    };

    keyinfo.keynameForEvent = function(event) {
      return keycode(event);
    };

    keyinfo.forEvent = function(event) {
      return {
        key: keyinfo.keynameForEvent(event),
        combo: keyinfo.comboForEvent(event),
        mod: keyinfo.modifiersForEvent(event)
      };
    };

    return keyinfo;

  })();

  module.exports = keyinfo;

}).call(this);
