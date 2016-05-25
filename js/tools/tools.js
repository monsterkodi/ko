(function() {
  var _, pos;

  _ = require('lodash');

  pos = require('./pos');

  module.exports = {
    def: function(c, d) {
      if (c != null) {
        return _.defaults(_.clone(c), d);
      } else if (d != null) {
        return _.clone(d);
      } else {
        return {};
      }
    },
    del: function(l, e) {
      return _.remove(l, function(n) {
        return n === e;
      });
    },
    absPos: function(event) {
      event = event != null ? event : window.event;
      if (isNaN(window.scrollX)) {
        return pos(event.clientX + document.documentElement.scrollLeft + document.body.scrollLeft, event.clientY + document.documentElement.scrollTop + document.body.scrollTop);
      } else {
        return pos(event.clientX + window.scrollX, event.clientY + window.scrollY);
      }
    },
    sw: function() {
      return parseInt(window.getComputedStyle(document.body).width);
    },
    sh: function() {
      return parseInt(window.getComputedStyle(document.body).height);
    },
    clamp: function(r1, r2, v) {
      var ref;
      if (r1 > r2) {
        ref = [r2, r1], r1 = ref[0], r2 = ref[1];
      }
      if (r1 != null) {
        v = Math.max(v, r1);
      }
      if (r2 != null) {
        v = Math.min(v, r2);
      }
      return v;
    }
  };

  if (!String.prototype.splice) {
    String.prototype.splice = function(start, delCount, newSubStr) {
      if (newSubStr == null) {
        newSubStr = '';
      }
      return this.slice(0, start) + newSubStr + this.slice(start + Math.abs(delCount));
    };
  }

}).call(this);
