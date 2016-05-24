(function() {
  var Editor, encode, log, tools;

  tools = require('./tools/tools');

  log = require('./tools/log');

  encode = require('html-entities').XmlEntities.encode;

  Editor = (function() {
    function Editor() {}

    Editor.cursor = [0, 0];

    Editor.lines = [""];

    Editor.cursorSpan = "";

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
      Editor.lines[Editor.cursor[1]] = Editor.lines[Editor.cursor[1]].splice(Editor.cursor[0], 0, c);
      return Editor.cursor[0] += 1;
    };

    Editor.joinLine = function() {
      Editor.lines[Editor.cursor[1]] += Editor.lines[Editor.cursor[1] + 1];
      return Editor.lines.splice(Editor.cursor[1] + 1, 1);
    };

    Editor.deleteForward = function() {
      if (Editor.cursorAtEndOfLine()) {
        if (!Editor.cursorInLastLine()) {
          return Editor.joinLine();
        }
      } else {
        return Editor.lines[Editor.cursor[1]] = Editor.lines[Editor.cursor[1]].splice(Editor.cursor[0], 1);
      }
    };

    Editor.deleteBackward = function() {
      if (Editor.cursorInFirstLine() && Editor.cursorAtStartOfLine()) {
        return;
      }
      Editor.moveCursorLeft();
      return Editor.deleteForward();
    };

    Editor.insertNewline = function() {
      if (Editor.cursorAtEndOfLine()) {
        Editor.lines.splice(Editor.cursor[1] + 1, 0, "");
      } else {
        Editor.lines.splice(Editor.cursor[1] + 1, 0, Editor.lines[Editor.cursor[1]].substr(Editor.cursor[0]));
        Editor.lines[Editor.cursor[1]] = Editor.lines[Editor.cursor[1]].substr(0, Editor.cursor[0]);
      }
      return Editor.moveCursorRight();
    };

    Editor.addLine = function() {
      return Editor.lines.push("");
    };

    Editor.encodeHtml = function(l) {
      var r;
      r = encode(l);
      r = r.replace(/\s/g, '&nbsp;');
      return r;
    };

    Editor.html = function() {
      var h, i, j, l, left, ref, right;
      h = [];
      for (i = j = 0, ref = Editor.lines.length; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
        l = Editor.lines[i];
        if (i === Editor.cursor[1]) {
          left = l.substr(0, Editor.cursor[0]);
          right = l.substr(Editor.cursor[0]);
          h.push(Editor.encodeHtml(left) + Editor.cursorSpan + Editor.encodeHtml(right));
        } else {
          h.push(Editor.encodeHtml(l));
        }
      }
      return h.join('<br>');
    };

    return Editor;

  })();

  module.exports = Editor;

}).call(this);
