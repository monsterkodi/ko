(function() {
  var undo,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

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
      this.groupCount = 0;
      this.groupDone = done;
    }

    undo.prototype.start = function() {
      return this.groupCount += 1;
    };

    undo.prototype.change = function(lines, index, text) {
      lines[index] = text;
      return this.check();
    };

    undo.prototype.insert = function(lines, index, text) {
      lines.splice(index, 0, text);
      return this.check();
    };

    undo.prototype["delete"] = function(lines, index) {
      lines.splice(index, 1);
      return this.check();
    };

    undo.prototype.check = function() {
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
