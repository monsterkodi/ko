(function() {
  var $, ansiKeycode, drag, editor, electron, encode, enterHeight, ipc, keyname, line, log, minEnterHeight, minScrollHeight, noon, pos, ref, sh, split, splitAt, sw;

  electron = require('electron');

  ansiKeycode = require('ansi-keycode');

  noon = require('noon');

  editor = require('./editor');

  keyname = require('./tools/keyname');

  drag = require('./tools/drag');

  pos = require('./tools/pos');

  log = require('./tools/log');

  ref = require('./tools/tools'), sw = ref.sw, sh = ref.sh;

  ipc = electron.ipcRenderer;

  encode = require('html-entities').XmlEntities.encode;

  line = "";

  $ = function(id) {
    return document.getElementById(id);
  };

  enterHeight = 200;

  minEnterHeight = 100;

  minScrollHeight = 24;

  splitAt = function(y) {
    $('scroll').style.height = y + "px";
    $('split').style.top = y + "px";
    $('enter').style.top = (y + 10) + "px";
    return enterHeight = sh() - y;
  };

  splitAt(sh() - enterHeight);

  editor.cursorSpan = "<span id=\"cursor\"></span>";

  $('input').innerHTML = editor.cursorSpan;

  split = new drag({
    target: 'split',
    minPos: pos(0, minScrollHeight),
    maxPos: pos(sw(), sh() - minEnterHeight),
    onStart: function(drag) {
      return log('start', drag.pos);
    },
    onMove: function(drag) {
      return splitAt(drag.cpos.y);
    },
    onStop: function(drag) {
      return log('stop', drag.pos);
    }
  });

  window.onresize = function() {
    split.maxPos = pos(sw(), sh() - minEnterHeight);
    return splitAt(Math.max(minScrollHeight, sh() - enterHeight));
  };

  document.onkeydown = function(event) {
    var key, mod, ref1, ref2;
    key = keyname.ofEvent(event);
    switch (key) {
      case 'esc':
        return window.close();
      case 'down':
      case 'right':
      case 'up':
      case 'left':
        editor.moveCursor(key);
        break;
      case 'enter':
        editor.insertNewline();
        break;
      case 'delete':
      case 'ctrl+backspace':
        editor.deleteForward();
        break;
      case 'backspace':
        editor.deleteBackward();
        break;
      case 'command+j':
        editor.joinLine();
        break;
      case 'ctrl+a':
        editor.moveCursorToStartOfLine();
        break;
      case 'ctrl+e':
        editor.moveCursorToEndOfLine();
        break;
      default:
        mod = keyname.modifiersOfEvent(event);
        if (mod && ((!key) || key.substr(mod.length + 1) === 'right click')) {
          return;
        }
        if (((ref1 = ansiKeycode(event)) != null ? ref1.length : void 0) === 1) {
          editor.insertCharacter(ansiKeycode(event));
        } else {
          log(key);
        }
    }
    $('input').innerHTML = editor.html();
    return (ref2 = $('cursor')) != null ? ref2.scrollIntoViewIfNeeded() : void 0;
  };

}).call(this);
