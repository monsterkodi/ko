(function() {
  var log, undo,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  log = require('./tools/log');

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
      this.start = bind(this.start, this);
      this.cursor = bind(this.cursor, this);
      this.selection = bind(this.selection, this);
      this.redoAction = bind(this.redoAction, this);
      this.undoAction = bind(this.undoAction, this);
      this.lastAction = bind(this.lastAction, this);
      this.redo = bind(this.redo, this);
      this.undo = bind(this.undo, this);
      this.actionList = [];
      this.futureList = [];
      this.actions = this.actionList;
      this.groupCount = 0;
      this.groupDone = done;
    }

    undo.prototype.undo = function(obj) {
      var a, action, i, j, ref;
      if (this.actionList.length) {
        action = this.actionList.pop();
        if (action.length != null) {
          for (i = j = ref = action.length - 1; ref <= 0 ? j <= 0 : j >= 0; i = ref <= 0 ? ++j : --j) {
            a = action[i];
            this.undoAction(obj, a);
          }
        } else {
          this.undoAction(obj, action);
        }
        this.futureList.unshift(action);
        return log(this.actionList);
      }
    };

    undo.prototype.redo = function(obj) {
      var a, action, j, len;
      if (this.futureList.length) {
        action = this.futureList.shift();
        if (action.length != null) {
          for (j = 0, len = action.length; j < len; j++) {
            a = action[j];
            this.redoAction(obj, a);
          }
        } else {
          this.redoAction(obj, action);
        }
        this.actionList.push(action);
        return log(this.actionList);
      }
    };

    undo.prototype.lastAction = function() {
      if (this.actionList.length) {
        return this.actionList[this.actionList.length - 1];
      }
    };

    undo.prototype.undoAction = function(obj, action) {
      var ref;
      if (action.before != null) {
        if (action.after != null) {
          obj.lines[action.index] = action.before;
        } else {
          obj.lines.splice(action.index, 0, action.before);
        }
      } else if (action.after != null) {
        obj.lines.splice(action.index, 1);
      }
      if (action.selBefore != null) {
        obj.selection = action.selBefore;
      }
      if (((ref = action.selBefore) != null ? ref[0] : void 0) === null) {
        obj.selection = null;
      }
      log('obj.selection', obj.selection);
      if (action.curBefore != null) {
        return obj.cursor = action.curBefore;
      }
    };

    undo.prototype.redoAction = function(obj, action) {
      var ref;
      if (action.after != null) {
        if (action.before != null) {
          obj.lines[action.index] = action.after;
        } else {
          obj.lines.splice(action.index, 1);
        }
      } else if (action.before != null) {
        obj.lines.splice(action.index, 0, action.before);
      }
      if (action.selAfter != null) {
        obj.selection = action.selAfter;
      }
      if (((ref = action.selAfter) != null ? ref[0] : void 0) === null) {
        obj.selection = null;
      }
      if (action.curAfter != null) {
        return obj.cursor = [action.curAfter[0], action.curAfter[1]];
      }
    };

    undo.prototype.selection = function(sel, pos) {
      var last;
      if (sel !== pos) {
        last = this.lastAction();
        if (((last != null ? last.selAfter : void 0) != null) || ((last != null ? last.curAfter : void 0) != null)) {
          last.selAfter = [pos != null ? pos[0] : void 0, pos != null ? pos[1] : void 0];
        } else {
          this.actions.push({
            selBefore: [sel != null ? sel[0] : void 0, sel != null ? sel[1] : void 0],
            selAfter: [pos != null ? pos[0] : void 0, pos != null ? pos[1] : void 0]
          });
        }
        if (sel != null) {
          sel[0] = pos != null ? pos[0] : void 0;
        }
        if (sel != null) {
          sel[1] = pos != null ? pos[1] : void 0;
        }
        this.check();
        log(this.actionList);
      }
      return pos;
    };

    undo.prototype.cursor = function(cur, pos) {
      var last;
      if ((cur[0] !== pos[0]) || (cur[1] !== pos[1])) {
        last = this.lastAction();
        if (((last != null ? last.selAfter : void 0) != null) || ((last != null ? last.curAfter : void 0) != null)) {
          last.curAfter = [pos[0], pos[1]];
        } else {
          this.actions.push({
            selBefore: [null, null],
            curBefore: [cur[0], cur[1]],
            curAfter: [pos[0], pos[1]]
          });
        }
        cur[0] = pos[0];
        cur[1] = pos[1];
        this.check();
        log(this.actionList);
      }
      return pos;
    };

    undo.prototype.start = function() {
      this.groupCount += 1;
      if (this.groupCount === 1) {
        this.actions = [];
        return this.actionList.push(this.actions);
      }
    };

    undo.prototype.change = function(lines, index, text) {
      this.actions.push({
        index: index,
        before: lines[index],
        after: text
      });
      lines[index] = text;
      return this.check();
    };

    undo.prototype.insert = function(lines, index, text) {
      this.actions.push({
        index: index,
        after: text
      });
      lines.splice(index, 0, text);
      return this.check();
    };

    undo.prototype["delete"] = function(lines, index) {
      this.actions.push({
        index: index,
        before: lines[index]
      });
      lines.splice(index, 1);
      return this.check();
    };

    undo.prototype.check = function() {
      this.futureList = [];
      if (this.groupCount === 0) {
        return this.groupDone();
      }
    };

    undo.prototype.end = function() {
      this.groupCount -= 1;
      this.check();
      if (this.groupCount === 0) {
        return this.actions = this.actionList;
      }
    };

    return undo;

  })();

  module.exports = undo;

}).call(this);
