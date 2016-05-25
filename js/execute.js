(function() {
  var Execute, coffee, colors, electron, log, noon, str;

  noon = require('noon');

  colors = require('colors');

  coffee = require('coffee-script');

  electron = require('electron');

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
      return log('Execute constructor', cfg);
    };

    Execute.execute = function(code) {
      var e, error, r;
      try {
        r = coffee["eval"](code);
        return r;
      } catch (error) {
        e = error;
        return console.error(colors.red.bold('[ERROR]', colors.red(e)));
      }
    };

    return Execute;

  })();

  module.exports = Execute;

}).call(this);
