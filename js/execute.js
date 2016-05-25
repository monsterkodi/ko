(function() {
  var Execute, coffee, colors, electron, log, noon;

  noon = require('noon');

  colors = require('colors');

  coffee = require('coffee-script');

  electron = require('electron');

  log = require('./tools/log');

  Execute = (function() {
    function Execute() {}

    Execute.init = function(cfg) {
      if (cfg == null) {
        cfg = {};
      }
    };

    Execute.execute = function(code) {
      var e, error;
      try {
        return coffee["eval"](code);
      } catch (error) {
        e = error;
        return console.error(colors.red.bold('[ERROR]', colors.red(e)));
      }
    };

    return Execute;

  })();

  module.exports = Execute;

}).call(this);
