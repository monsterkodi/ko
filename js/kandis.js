(function() {
  var $, ansiKeycode, clipboard, drag, editor, electron, encode, enterHeight, inputDrag, ipc, keyinfo, line, log, minEnterHeight, minScrollHeight, noon, pos, prefs, ref, ref1, remote, sh, splitAt, splitDrag, sw;

  electron = require('electron');

  ansiKeycode = require('ansi-keycode');

  noon = require('noon');

  editor = require('./editor');

  prefs = require('./tools/prefs');

  keyinfo = require('./tools/keyinfo');

  drag = require('./tools/drag');

  pos = require('./tools/pos');

  log = require('./tools/log');

  ref = require('./tools/tools'), sw = ref.sw, sh = ref.sh;

  ipc = electron.ipcRenderer;

  clipboard = electron.clipboard;

  remote = electron.remote;

  encode = require('html-entities').XmlEntities.encode;

  line = "";

  $ = function(id) {
    return document.getElementById(id);
  };

  prefs.init(((ref1 = remote.app) != null ? ref1.getPath('userData') : void 0) + "/kandis.json", {
    split: 300
  });

  enterHeight = 200;

  minEnterHeight = 100;

  minScrollHeight = 24;

  splitAt = function(y) {
    $('scroll').style.height = y + "px";
    $('split').style.top = y + "px";
    $('enter').style.top = (y + 10) + "px";
    enterHeight = sh() - y;
    return prefs.set('split', y);
  };

  splitAt(prefs.get('split', 100));

  splitDrag = new drag({
    target: 'split',
    cursor: 'ns-resize',
    minPos: pos(0, minScrollHeight),
    maxPos: pos(sw(), sh() - minEnterHeight),
    onMove: function(drag) {
      return splitAt(drag.cpos.y);
    }
  });

  editor.init('input');

  if (true) {
    editor.lines = ["for a in [0...1]", "    console.log a", "console.log 'done'"];
    editor.update();
  }

  window.onresize = (function(_this) {
    return function() {
      splitDrag.maxPos = pos(sw(), sh() - minEnterHeight);
      splitAt(Math.max(minScrollHeight, sh() - enterHeight));
      return ipc.send('bounds');
    };
  })(this);

  inputDrag = new drag({
    target: editor.id,
    cursor: 'default',
    onStart: function(drag, event) {
      editor.startSelection(event.shiftKey);
      editor.moveCursorToPos(editor.posForEvent(event));
      editor.endSelection(event.shiftKey);
      return editor.update();
    },
    onMove: function(drag, event) {
      editor.startSelection(true);
      editor.moveCursorToPos(editor.posForEvent(event));
      return editor.update();
    },
    onStop: function(drag, event) {}
  });

  $(editor.id).ondblclick = function(event) {
    var range;
    pos = editor.posForEvent(event);
    range = editor.rangeForWordAtPos(pos);
    editor.selectRange(range);
    return editor.update();
  };

  document.onkeydown = function(event) {
    var combo, key, mod, ref2, ref3, ref4;
    ref2 = keyinfo.forEvent(event), mod = ref2.mod, key = ref2.key, combo = ref2.combo;
    log("key:", key, "mod:", mod, "combo:", combo);
    if (!combo) {
      return;
    }
    switch (key) {
      case 'esc':
        return window.close();
      case 'right click':
        return;
      case 'down':
      case 'right':
      case 'up':
      case 'left':
        editor.startSelection(event.shiftKey);
        if (event.metaKey) {
          if (key === 'left') {
            editor.moveCursorToStartOfLine();
          } else if (key === 'right') {
            editor.moveCursorToEndOfLine();
          }
        } else {
          editor.moveCursor(key);
        }
        break;
      default:
        switch (combo) {
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
          case 'command+v':
            editor.insertText(clipboard.readText());
            break;
          case 'command+r':
            return ipc.send('execute', editor.text());
          case 'ctrl+a':
            editor.moveCursorToStartOfLine();
            break;
          case 'ctrl+e':
            editor.moveCursorToEndOfLine();
            break;
          case 'command+a':
            editor.selectAll();
            editor.update();
            return;
          case 'ctrl+shift+a':
            editor.startSelection(true);
            editor.moveCursorToStartOfLine();
            break;
          case 'ctrl+shift+e':
            editor.startSelection(true);
            editor.moveCursorToEndOfLine();
            break;
          default:
            if (((ref3 = ansiKeycode(event)) != null ? ref3.length : void 0) === 1) {
              editor.insertCharacter(ansiKeycode(event));
            }
        }
    }
    editor.endSelection(event.shiftKey);
    editor.update();
    return (ref4 = $('cursor')) != null ? ref4.scrollIntoViewIfNeeded() : void 0;
  };

}).call(this);
