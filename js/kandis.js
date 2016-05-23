(function() {
  var $, drag, electron, encode, enterHeight, ipc, keyname, log, minEnterHeight, minScrollHeight, noon, pos, ref, sh, split, splitAt, sw;

  electron = require('electron');

  keyname = require('./tools/keyname');

  drag = require('./tools/drag');

  pos = require('./tools/pos');

  ref = require('./tools/tools'), sw = ref.sw, sh = ref.sh;

  noon = require('noon');

  log = require('./tools/log');

  ipc = electron.ipcRenderer;

  encode = require('html-entities').XmlEntities.encode;

  $ = function(id) {
    return document.getElementById(id);
  };

  enterHeight = 200;

  minEnterHeight = 100;

  minScrollHeight = 0;

  splitAt = function(y) {
    $('scroll').style.height = y + "px";
    $('split').style.top = y + "px";
    $('enter').style.top = (y + 10) + "px";
    return enterHeight = sh() - y;
  };

  splitAt(sh() - enterHeight);

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
    return splitAt(Math.max(0, sh() - enterHeight));
  };

  document.onkeydown = function(event) {
    var key;
    key = keyname.ofEvent(event);
    switch (key) {
      case 'esc':
        return window.close();
      case 'down':
      case 'right':
        return highlight(current - 1);
      case 'up':
      case 'left':
        return highlight(current + 1);
      case 'home':
      case 'page up':
        return highlight(buffers.length - 1);
      case 'end':
      case 'page down':
        return highlight(0);
      case 'enter':
        return doPaste();
      case 'backspace':
      case 'command+backspace':
        return ipc.send("del", current);
    }
    return log(key);
  };

}).call(this);
