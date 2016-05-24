(function() {
  var log, noon, str;

  noon = require('noon');

  str = function(o) {
    if (typeof o === 'object') {
      if (o._str != null) {
        return o._str();
      } else {
        return "\n" + noon.stringify(o, {
          circular: true
        });
      }
    } else {
      return String(o);
    }
  };

  log = function() {
    var s;
    return console.log(((function() {
      var i, len, ref, results;
      ref = [].slice.call(arguments, 0);
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        s = ref[i];
        results.push(str(s));
      }
      return results;
    }).apply(this, arguments)).join(" "));
  };

  module.exports = log;

}).call(this);
