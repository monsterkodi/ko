(function() {
  var Execute, colors, log, noon, str;

  noon = require('noon');

  colors = require('colors');

  str = function(o) {
    if (typeof o === 'object') {
      return "\n" + noon.stringify(o, {
        colors: true,
        circular: true
      });
    } else {
      return colors.yellow.bold(String(o));
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

  Execute = (function() {
    function Execute() {}

    Execute.init = function(cfg) {
      if (cfg == null) {
        cfg = {};
      }
      return log('constructor', cfg);
    };

    Execute.execute = function(line) {
      return log('execute', line);
    };

    return Execute;

  })();

  module.exports = Execute;

}).call(this);
