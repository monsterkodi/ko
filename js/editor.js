(function() {
  var $, Editor, encode, log, tools;

  tools = require('./tools/tools');

  log = require('./tools/log');

  encode = require('html-entities').XmlEntities.encode;

  $ = function(id) {
    return document.getElementById(id);
  };

  Editor = (function() {
    function Editor() {}

    Editor.charSize = [0, 0];

    Editor.cursor = [0, 0];

    Editor.selection = null;

    Editor.lines = [""];

    Editor.cursorSpan = "";

    Editor.id = "";

    Editor.selectionStart = function() {
      if (Editor.selection != null) {
        if (Editor.selection[1] < Editor.cursor[1]) {
          return [Editor.selection[0], Editor.selection[1]];
        }
        if (Editor.selection[1] > Editor.cursor[1]) {
          return [Math.min(Editor.cursor[0], Editor.lines[Editor.cursor[1]].length), Editor.cursor[1]];
        }
        return [Math.min(Editor.selection[0], Editor.cursor[0]), Editor.cursor[1]];
      }
      return [Math.min(Editor.cursor[0], Editor.lines[Editor.cursor[1]].length), Editor.cursor[1]];
    };

    Editor.selectRange = function(range) {
      Editor.selection = range[0];
      return Editor.cursor = range[1];
    };

    Editor.startSelection = function(active) {
      if (active && (Editor.selection == null)) {
        return Editor.selection = [Math.min(Editor.cursor[0], Editor.lines[Editor.cursor[1]].length), Editor.cursor[1]];
      }
    };

    Editor.endSelection = function(active) {
      if ((Editor.selection != null) && !active) {
        return Editor.selection = null;
      }
    };

    Editor.selectedLineRange = function() {
      if (Editor.selection) {
        return [Math.min(Editor.cursor[1], Editor.selection[1]), Math.max(Editor.cursor[1], Editor.selection[1])];
      }
    };

    Editor.selectedCharacterRangeForLineAtIndex = function(i) {
      var lines;
      if (!Editor.selection) {
        return;
      }
      lines = Editor.selectedLineRange();
      if (i < lines[0] || i > lines[1]) {
        return;
      }
      if ((lines[0] < i && i < lines[1])) {
        return [0, Editor.lines[i].length];
      }
      if (lines[0] === lines[1]) {
        return [Math.min(Editor.cursor[0], Editor.selection[0]), Math.max(Editor.cursor[0], Editor.selection[0])];
      }
      if (i === Editor.cursor[1]) {
        if (Editor.selection[1] > i) {
          return [Editor.cursor[0], Editor.lines[i].length];
        } else {
          return [0, Math.min(Editor.lines[i].length, Editor.cursor[0])];
        }
      } else {
        if (Editor.cursor[1] > i) {
          return [Editor.selection[0], Editor.lines[i].length];
        } else {
          return [0, Math.min(Editor.lines[i].length, Editor.selection[0])];
        }
      }
    };

    Editor.cursorAtEndOfLine = function() {
      return Editor.cursor[0] === Editor.lines[Editor.cursor[1]].length;
    };

    Editor.cursorAtStartOfLine = function() {
      return Editor.cursor[0] === 0;
    };

    Editor.cursorInLastLine = function() {
      return Editor.cursor[1] === Editor.lines.length - 1;
    };

    Editor.cursorInFirstLine = function() {
      return Editor.cursor[1] === 0;
    };

    Editor.moveCursorToEndOfLine = function() {
      return Editor.cursor[0] = Editor.lines[Editor.cursor[1]].length;
    };

    Editor.moveCursorToStartOfLine = function() {
      return Editor.cursor[0] = 0;
    };

    Editor.moveCursorToLineChar = function(l, c) {
      if (c == null) {
        c = 0;
      }
      Editor.cursor[1] = Math.min(l, Editor.lines.length - 1);
      return Editor.cursor[0] = Math.min(c, Editor.lines[Editor.cursor[1]].length);
    };

    Editor.moveCursorToPos = function(pos) {
      Editor.cursor[1] = Math.min(pos[1], Editor.lines.length - 1);
      return Editor.cursor[0] = Math.min(pos[0], Editor.lines[Editor.cursor[1]].length);
    };

    Editor.moveCursorUp = function() {
      if (Editor.cursorInFirstLine()) {
        return Editor.moveCursorToStartOfLine();
      } else {
        return Editor.cursor[1] -= 1;
      }
    };

    Editor.moveCursorDown = function() {
      if (Editor.cursorInLastLine()) {
        return Editor.moveCursorToEndOfLine();
      } else {
        return Editor.cursor[1] += 1;
      }
    };

    Editor.moveCursorRight = function() {
      if (Editor.cursorAtEndOfLine()) {
        if (!Editor.cursorInLastLine()) {
          Editor.moveCursorDown();
          return Editor.moveCursorToStartOfLine();
        }
      } else {
        return Editor.cursor[0] += 1;
      }
    };

    Editor.moveCursorLeft = function() {
      Editor.cursor[0] = Math.min(Editor.lines[Editor.cursor[1]].length, Editor.cursor[0]);
      if (Editor.cursorAtStartOfLine()) {
        if (!Editor.cursorInFirstLine()) {
          Editor.moveCursorUp();
          return Editor.moveCursorToEndOfLine();
        }
      } else {
        return Editor.cursor[0] -= 1;
      }
    };

    Editor.moveCursor = function(direction) {
      switch (direction) {
        case 'left':
          return Editor.moveCursorLeft();
        case 'right':
          return Editor.moveCursorRight();
        case 'up':
          return Editor.moveCursorUp();
        case 'down':
          return Editor.moveCursorDown();
      }
    };

    Editor.insertCharacter = function(c) {
      if (Editor.selection != null) {
        Editor.deleteSelection();
      }
      Editor.lines[Editor.cursor[1]] = Editor.lines[Editor.cursor[1]].splice(Editor.cursor[0], 0, c);
      return Editor.cursor[0] += 1;
    };

    Editor.insertNewline = function() {
      if (Editor.selection != null) {
        Editor.deleteSelection();
      }
      if (Editor.cursorAtEndOfLine()) {
        Editor.lines.splice(Editor.cursor[1] + 1, 0, "");
      } else {
        Editor.lines.splice(Editor.cursor[1] + 1, 0, Editor.lines[Editor.cursor[1]].substr(Editor.cursor[0]));
        Editor.lines[Editor.cursor[1]] = Editor.lines[Editor.cursor[1]].substr(0, Editor.cursor[0]);
      }
      return Editor.moveCursorRight();
    };

    Editor.insertText = function(text) {
      var c, j, len, results;
      if (Editor.selection != null) {
        Editor.deleteSelection();
      }
      results = [];
      for (j = 0, len = text.length; j < len; j++) {
        c = text[j];
        if (c === '\n') {
          results.push(Editor.insertNewline());
        } else {
          results.push(Editor.insertCharacter(c));
        }
      }
      return results;
    };

    Editor.joinLine = function() {
      if (!Editor.cursorInLastLine()) {
        Editor.lines[Editor.cursor[1]] += Editor.lines[Editor.cursor[1] + 1];
        return Editor.lines.splice(Editor.cursor[1] + 1, 1);
      }
    };

    Editor.deleteLineAtIndex = function(i) {
      return Editor.lines.splice(i, 1);
    };

    Editor.deleteCharacterRangeInLineAtIndex = function(r, i) {
      return Editor.lines[i] = Editor.lines[i].splice(r[0], r[1] - r[0]);
    };

    Editor.deleteSelection = function() {
      var i, j, lineRange, ref, ref1;
      lineRange = Editor.selectedLineRange();
      if (lineRange == null) {
        return;
      }
      Editor.deleteCharacterRangeInLineAtIndex(Editor.selectedCharacterRangeForLineAtIndex(lineRange[1]), lineRange[1]);
      if (lineRange[1] > lineRange[0]) {
        for (i = j = ref = lineRange[1] - 1, ref1 = lineRange[0]; ref <= ref1 ? j < ref1 : j > ref1; i = ref <= ref1 ? ++j : --j) {
          Editor.deleteLineAtIndex(i);
        }
        Editor.deleteCharacterRangeInLineAtIndex(Editor.selectedCharacterRangeForLineAtIndex(lineRange[0]), lineRange[0]);
      }
      Editor.cursor = Editor.selectionStart();
      if (lineRange[1] > lineRange[0]) {
        return Editor.joinLine();
      }
    };

    Editor.deleteForward = function() {
      if (Editor.selection != null) {
        Editor.deleteSelection();
        return;
      }
      if (Editor.cursorAtEndOfLine()) {
        return Editor.joinLine();
      } else {
        return Editor.lines[Editor.cursor[1]] = Editor.lines[Editor.cursor[1]].splice(Editor.cursor[0], 1);
      }
    };

    Editor.deleteBackward = function() {
      if (Editor.selection != null) {
        Editor.deleteSelection();
        return;
      }
      if (Editor.cursorInFirstLine() && Editor.cursorAtStartOfLine()) {
        return;
      }
      Editor.moveCursorLeft();
      return Editor.deleteForward();
    };

    Editor.html = function() {
      var enc, h, i, j, l, left, mid, range, ref, right, selEnd, selStart;
      enc = function(l) {
        var r;
        r = encode(l);
        r = r.replace(/\s/g, '&nbsp;');
        return r;
      };
      h = [];
      for (i = j = 0, ref = Editor.lines.length; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
        l = Editor.lines[i];
        selStart = "<span class=\"selection\">";
        selEnd = "</span>";
        range = Editor.selectedCharacterRangeForLineAtIndex(i);
        if (range) {
          log("selection range at line", i, ":", range[0], range[1]);
          left = l.substr(0, range[0]);
          mid = l.substr(range[0], range[1] - range[0]);
          right = l.substr(range[1]);
          if (i === Editor.cursor[1]) {
            if (Editor.cursor[0] === range[0]) {
              h.push(enc(left) + Editor.cursorSpan + selStart + enc(mid) + selEnd + enc(right));
            } else {
              h.push(enc(left) + selStart + enc(mid) + selEnd + Editor.cursorSpan + enc(right));
            }
          } else {
            h.push(enc(left) + selStart + enc(mid) + selEnd + enc(right));
          }
        } else if (i === Editor.cursor[1]) {
          left = l.substr(0, Editor.cursor[0]);
          right = l.substr(Editor.cursor[0]);
          h.push(enc(left) + Editor.cursorSpan + enc(right));
        } else {
          h.push(enc(l));
        }
      }
      return h.join('<br>');
    };

    Editor.posForEvent = function(event) {
      var sl, st;
      sl = $(Editor.id).scrollLeft;
      st = $(Editor.id).scrollTop;
      log('scroll', sl, st);
      return [parseInt(Math.floor((Math.max(0, sl + event.offsetX - 10)) / Editor.charSize[0])), parseInt(Math.floor((Math.max(0, st + event.offsetY - 10)) / Editor.charSize[1]))];
    };

    Editor.rangeForWordAtPos = function(pos) {
      var c, l, n, r;
      l = Editor.lines[pos[1]];
      r = [pos[0], pos[0]];
      c = l[r[0]];
      while (r[0] > 0) {
        n = l[r[0] - 1];
        if ((c === ' ') && (n !== ' ') || (c !== ' ') && (n === ' ')) {
          break;
        }
        r[0] -= 1;
      }
      while (r[1] < l.length - 1) {
        n = l[r[1] + 1];
        if ((c === ' ') && (n !== ' ') || (c !== ' ') && (n === ' ')) {
          break;
        }
        r[1] += 1;
      }
      return [[r[0], pos[1]], [r[1] + 1, pos[1]]];
    };

    Editor.update = function() {
      return $(Editor.id).innerHTML = Editor.html();
    };

    Editor.init = function(className) {
      var o;
      Editor.id = className;
      o = document.createElement('div');
      o.className = className;
      o.innerHTML = 'XXXXXXXXXX';
      o.style = {
        float: 'left',
        visibility: 'hidden'
      };
      document.body.appendChild(o);
      Editor.charSize = [o.clientWidth / o.innerHTML.length, o.clientHeight];
      o.remove();
      Editor.cursorSpan = "<span id=\"cursor\" style=\"height: " + Editor.charSize[1] + "px\"></span>";
      return $(className).innerHTML = Editor.cursorSpan;
    };

    return Editor;

  })();

  module.exports = Editor;

}).call(this);
