(function() {
  var clone, log, undo,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  log = require('./tools/log');

  clone = require('lodash').clone;

  undo = (function() {
    function undo(done) {
      if (done == null) {
        done = function() {};
      }
      this.end = bind(this.end, this);
      this.check = bind(this.check, this);
      this["delete"] = bind(this["delete"], this);
      this.insert = bind(this.insert, this);
      this.change = bind(this.change, this);
      this.modify = bind(this.modify, this);
      this.start = bind(this.start, this);
      this.cursor = bind(this.cursor, this);
      this.selection = bind(this.selection, this);
      this.lastAction = bind(this.lastAction, this);
      this.undoCursor = bind(this.undoCursor, this);
      this.undoSelection = bind(this.undoSelection, this);
      this.undoLine = bind(this.undoLine, this);
      this.undo = bind(this.undo, this);
      this.redoCursor = bind(this.redoCursor, this);
      this.redoSelection = bind(this.redoSelection, this);
      this.redoLine = bind(this.redoLine, this);
      this.redo = bind(this.redo, this);
      this.actions = [];
      this.futures = [];
      this.groupCount = 0;
      this.groupDone = done;
    }

    undo.prototype.redo = function(obj) {
      var action, j, len, line, ref;
      if (this.futures.length) {
        action = this.futures.shift();
        ref = action.lines;
        for (j = 0, len = ref.length; j < len; j++) {
          line = ref[j];
          this.redoLine(obj, line);
        }
        this.redoCursor(obj, action);
        this.redoSelection(obj, action);
        return this.actions.push(action);
      }
    };

    undo.prototype.redoLine = function(obj, line) {
      if (line.after != null) {
        if (line.before != null) {
          return obj.lines[line.index] = line.after;
        } else {
          return obj.lines.splice(line.index, 0, line.before);
        }
      } else if (line.before != null) {
        return obj.lines.splice(line.index, 1);
      }
    };

    undo.prototype.redoSelection = function(obj, action) {
      var ref;
      if (action.selAfter != null) {
        obj.selection = action.selAfter;
      }
      if (((ref = action.selAfter) != null ? ref[0] : void 0) === null) {
        return obj.selection = null;
      }
    };

    undo.prototype.redoCursor = function(obj, action) {
      if (action.curAfter != null) {
        return obj.cursor = [action.curAfter[0], action.curAfter[1]];
      }
    };

    undo.prototype.undo = function(obj) {
      var action, i, j, ref;
      if (this.actions.length) {
        action = this.actions.pop();
        if (action.lines.length) {
          for (i = j = ref = action.lines.length - 1; ref <= 0 ? j <= 0 : j >= 0; i = ref <= 0 ? ++j : --j) {
            this.undoLine(obj, action.lines[i]);
          }
        }
        this.undoCursor(obj, action);
        this.undoSelection(obj, action);
        return this.futures.unshift(action);
      }
    };

    undo.prototype.undoLine = function(obj, line) {
      if (line.before != null) {
        if (line.after != null) {
          return obj.lines[line.index] = line.before;
        } else {
          return obj.lines.splice(line.index, 0, line.before);
        }
      } else if (line.after != null) {
        return obj.lines.splice(line.index, 1);
      }
    };

    undo.prototype.undoSelection = function(obj, action) {
      var ref;
      if (action.selBefore != null) {
        obj.selection = action.selBefore;
      }
      if (((ref = action.selBefore) != null ? ref[0] : void 0) === null) {
        return obj.selection = null;
      }
    };

    undo.prototype.undoCursor = function(obj, action) {
      if (action.curBefore != null) {
        return obj.cursor = action.curBefore;
      }
    };

    undo.prototype.lastAction = function() {
      if (this.actions.length === 0) {
        this.actions.push({
          selBefore: [null, null],
          selAfter: [null, null],
          curBefore: [0, 0],
          curAfter: [0, 0],
          lines: []
        });
      }
      return this.actions[this.actions.length - 1];
    };

    undo.prototype.selection = function(sel, pos) {
      if (((sel != null ? sel[0] : void 0) !== (pos != null ? pos[0] : void 0)) || ((sel != null ? sel[1] : void 0) !== (pos != null ? pos[1] : void 0))) {
        if (pos != null) {
          this.lastAction().selAfter = [pos[0], pos[1]];
          if (sel != null) {
            sel[0] = pos[0];
          }
          if (sel != null) {
            sel[1] = pos[1];
          }
        } else {
          this.lastAction().selAfter = [null, null];
        }
        this.check();
      }
      return pos;
    };

    undo.prototype.cursor = function(cur, pos) {
      if ((cur[0] !== pos[0]) || (cur[1] !== pos[1])) {
        this.lastAction().curAfter = [pos[0], pos[1]];
        cur[0] = pos[0];
        cur[1] = pos[1];
        this.check();
      }
      return pos;
    };

    undo.prototype.start = function() {
      var last;
      this.groupCount += 1;
      if (this.groupCount === 1) {
        last = this.lastAction();
        return this.actions.push({
          selBefore: clone(last.selAfter),
          curBefore: clone(last.curAfter),
          selAfter: clone(last.selAfter),
          curAfter: clone(last.curAfter),
          lines: []
        });
      }
    };

    undo.prototype.modify = function(change) {
      var last, lines;
      last = this.lastAction();
      lines = last.lines;
      if (lines.length && lines[lines.length - 1].index === change.index) {
        return lines[lines.length - 1].after = change.after;
      } else {
        return lines.push(change);
      }
    };

    undo.prototype.change = function(lines, index, text) {
      if (lines[index] === text) {
        return;
      }
      this.modify({
        index: index,
        before: lines[index],
        after: text
      });
      lines[index] = text;
      return this.check();
    };

    undo.prototype.insert = function(lines, index, text) {
      this.modify({
        index: index,
        after: text
      });
      lines.splice(index, 0, text);
      return this.check();
    };

    undo.prototype["delete"] = function(lines, index) {
      this.modify({
        index: index,
        before: lines[index]
      });
      lines.splice(index, 1);
      return this.check();
    };

    undo.prototype.check = function() {
      this.futures = [];
      if (this.groupCount === 0) {
        return this.groupDone();
      }
    };

    undo.prototype.end = function() {
      this.groupCount -= 1;
      return this.check();
    };

    return undo;

  })();

  module.exports = undo;

}).call(this);
