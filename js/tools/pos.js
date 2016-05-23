(function() {
  var Pos,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  Pos = (function() {
    function Pos(x1, y1) {
      this.x = x1;
      this.y = y1;
      this.clamp = bind(this.clamp, this);
      this.sub = bind(this.sub, this);
      this.add = bind(this.add, this);
      this.mul = bind(this.mul, this);
      this.scale = bind(this.scale, this);
      this._str = bind(this._str, this);
      this.check = bind(this.check, this);
      this.notSame = bind(this.notSame, this);
      this.same = bind(this.same, this);
      this.dist = bind(this.dist, this);
      this.distSquare = bind(this.distSquare, this);
      this.square = bind(this.square, this);
      this.length = bind(this.length, this);
      this.max = bind(this.max, this);
      this.min = bind(this.min, this);
      this.mid = bind(this.mid, this);
      this.to = bind(this.to, this);
      this.clamped = bind(this.clamped, this);
      this.times = bind(this.times, this);
      this.minus = bind(this.minus, this);
      this.plus = bind(this.plus, this);
      this.copy = bind(this.copy, this);
    }

    Pos.prototype.copy = function() {
      return new Pos(this.x, this.y);
    };

    Pos.prototype.plus = function(val) {
      var newPos;
      newPos = this.copy();
      if (val != null) {
        if (!isNaN(val.x)) {
          newPos.x += val.x;
        }
        if (!isNaN(val.y)) {
          newPos.y += val.y;
        }
      }
      return newPos;
    };

    Pos.prototype.minus = function(val) {
      var newPos;
      newPos = this.copy();
      if (val != null) {
        if (!isNaN(val.x)) {
          newPos.x -= val.x;
        }
        if (!isNaN(val.y)) {
          newPos.y -= val.y;
        }
      }
      return newPos;
    };

    Pos.prototype.times = function(val) {
      return this.copy().scale(val);
    };

    Pos.prototype.clamped = function(lower, upper) {
      return this.copy().clamp(lower, upper);
    };

    Pos.prototype.to = function(other) {
      return other.minus(this);
    };

    Pos.prototype.mid = function(other) {
      return this.plus(other).scale(0.5);
    };

    Pos.prototype.min = function(val) {
      var newPos;
      newPos = this.copy();
      if (val == null) {
        return newPos;
      }
      if (!isNaN(val.x) && this.x > val.x) {
        newPos.x = val.x;
      }
      if (!isNaN(val.y) && this.y > val.y) {
        newPos.y = val.y;
      }
      return newPos;
    };

    Pos.prototype.max = function(val) {
      var newPos;
      newPos = this.copy();
      if (val == null) {
        return newPos;
      }
      if (!isNaN(val.x) && this.x < val.x) {
        newPos.x = val.x;
      }
      if (!isNaN(val.y) && this.y < val.y) {
        newPos.y = val.y;
      }
      return newPos;
    };

    Pos.prototype.length = function() {
      return Math.sqrt(this.square());
    };

    Pos.prototype.square = function() {
      return (this.x * this.x) + (this.y * this.y);
    };

    Pos.prototype.distSquare = function(o) {
      return this.minus(o).square();
    };

    Pos.prototype.dist = function(o) {
      return Math.sqrt(this.distSquare(o));
    };

    Pos.prototype.same = function(o) {
      return this.x === (o != null ? o.x : void 0) && this.y === (o != null ? o.y : void 0);
    };

    Pos.prototype.notSame = function(o) {
      return this.x !== (o != null ? o.x : void 0) || this.y !== (o != null ? o.y : void 0);
    };

    Pos.prototype.check = function() {
      var newPos;
      newPos = this.copy();
      if (isNaN(newPos.x)) {
        newPos.x = 0;
      }
      if (isNaN(newPos.y)) {
        newPos.y = 0;
      }
      return newPos;
    };

    Pos.prototype._str = function() {
      var s;
      s = (this.x != null ? "<x:" + this.x + " " : void 0) || "<NaN ";
      return s += (this.y != null ? "y:" + this.y + ">" : void 0) || "NaN>";
    };

    Pos.prototype.scale = function(val) {
      this.x *= val;
      this.y *= val;
      return this;
    };

    Pos.prototype.mul = function(other) {
      this.x *= other.x;
      this.y *= other.y;
      return this;
    };

    Pos.prototype.add = function(other) {
      this.x += other.x;
      this.y += other.y;
      return this;
    };

    Pos.prototype.sub = function(other) {
      this.x -= other.x;
      this.y -= other.y;
      return this;
    };

    Pos.prototype.clamp = function(lower, upper) {
      var clamp;
      if ((lower != null) && (upper != null)) {
        clamp = require('./tools').clamp;
        this.x = clamp(lower.x, upper.x, this.x);
        this.y = clamp(lower.y, upper.y, this.y);
      }
      return this;
    };

    return Pos;

  })();

  module.exports = function(x, y) {
    return new Pos(x, y);
  };

}).call(this);
