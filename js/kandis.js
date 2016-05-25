(function() {
  var $, ansiKeycode, clipboard, drag, editor, electron, encode, enterHeight, inputDrag, ipc, keyinfo, line, log, minEnterHeight, minScrollHeight, noon, pos, ref, sh, splitAt, splitDrag, sw;

  electron = require('electron');

  ansiKeycode = require('ansi-keycode');

  noon = require('noon');

  editor = require('./editor');

  keyinfo = require('./tools/keyinfo');

  drag = require('./tools/drag');

  pos = require('./tools/pos');

  log = require('./tools/log');

  ref = require('./tools/tools'), sw = ref.sw, sh = ref.sh;

  ipc = electron.ipcRenderer;

  clipboard = electron.clipboard;

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

  splitDrag = new drag({
    target: 'split',
    cursor: 'ns-resize',
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

  editor.init('input');

  window.onresize = function() {
    splitDrag.maxPos = pos(sw(), sh() - minEnterHeight);
    return splitAt(Math.max(minScrollHeight, sh() - enterHeight));
  };

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
    onStop: function(drag, event) {
      return log('stop', drag.pos);
    }
  });

  $(editor.id).ondblclick = function(event) {
    var range;
    pos = editor.posForEvent(event);
    range = editor.rangeForWordAtPos(pos);
    editor.selectRange(range);
    return editor.update();
  };

  document.onkeydown = function(event) {
    var combo, key, mod, ref1, ref2, ref3;
    ref1 = keyinfo.forEvent(event), mod = ref1.mod, key = ref1.key, combo = ref1.combo;
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
          case 'ctrl+a':
            editor.moveCursorToStartOfLine();
            break;
          case 'ctrl+e':
            editor.moveCursorToEndOfLine();
            break;
          case 'ctrl+shift+a':
            editor.startSelection(true);
            editor.moveCursorToStartOfLine();
            break;
          case 'ctrl+shift+e':
            editor.startSelection(true);
            editor.moveCursorToEndOfLine();
            break;
          default:
            if (((ref2 = ansiKeycode(event)) != null ? ref2.length : void 0) === 1) {
              editor.insertCharacter(ansiKeycode(event));
            } else {
              log(combo);
            }
        }
    }
    editor.endSelection(event.shiftKey);
    editor.update();
    return (ref3 = $('cursor')) != null ? ref3.scrollIntoViewIfNeeded() : void 0;
  };

}).call(this);
