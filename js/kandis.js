(function() {
  var $, Editor, drag, editor, electron, encode, enterHeight, inputDrag, ipc, keyinfo, line, log, minEnterHeight, minScrollHeight, noon, pos, prefs, ref, ref1, remote, sh, splitAt, splitDrag, str, sw;

  electron = require('electron');

  noon = require('noon');

  Editor = require('./editor');

  prefs = require('./tools/prefs');

  keyinfo = require('./tools/keyinfo');

  drag = require('./tools/drag');

  pos = require('./tools/pos');

  log = require('./tools/log');

  str = require('./tools/str');

  encode = require('./tools/encode');

  ref = require('./tools/tools'), sw = ref.sw, sh = ref.sh, $ = ref.$;

  ipc = electron.ipcRenderer;

  remote = electron.remote;

  line = "";

  prefs.init(((ref1 = remote.app) != null ? ref1.getPath('userData') : void 0) + "/kandis.json", {
    split: 300
  });

  enterHeight = 200;

  minEnterHeight = 100;

  minScrollHeight = 24;

  splitAt = function(y) {
    $('scroll').style.height = y + "px";
    $('split').style.top = y + "px";
    $('editor').style.top = (y + 10) + "px";
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

  ipc.on('execute-result', (function(_this) {
    return function(event, arg) {
      log('execute-result:', arg, typeof arg);
      $('scroll').innerHTML += encode(str(arg));
      return $('scroll').innerHTML += "<br>";
    };
  })(this));

  editor = new Editor($('input'), 'input');

  if (true) {
    editor.lines = ["for a in [0...1]", "    console.log a", "console.log 'done'"];
    editor.update();
  }

  editor.elem.focus();

  editor.elem.ondblclick = function(event) {
    var range;
    range = editor.rangeForWordAtPos(editor.posForEvent(event));
    editor.selectRange(range);
    return editor.update();
  };

  window.onresize = (function(_this) {
    return function() {
      splitDrag.maxPos = pos(sw(), sh() - minEnterHeight);
      splitAt(Math.max(minScrollHeight, sh() - enterHeight));
      return ipc.send('bounds');
    };
  })(this);

  inputDrag = new drag({
    target: editor.elem,
    cursor: 'default',
    onStart: function(drag, event) {
      editor.elem.focus();
      editor.startSelection(event.shiftKey);
      editor.moveCursorToPos(editor.posForEvent(event));
      editor.endSelection(event.shiftKey);
      return editor.update();
    },
    onMove: function(drag, event) {
      editor.startSelection(true);
      editor.moveCursorToPos(editor.posForEvent(event));
      return editor.update();
    }
  });

  document.onkeydown = function(event) {
    var combo, key, mod, ref2;
    ref2 = keyinfo.forEvent(event), mod = ref2.mod, key = ref2.key, combo = ref2.combo;
    if (!combo) {
      return;
    }
    switch (key) {
      case 'esc':
        return window.close();
      case 'right click':
        break;
      default:
        switch (combo) {
          case 'command+r':
          case 'command+enter':
            return ipc.send('execute', editor.text());
        }
    }
  };

}).call(this);
