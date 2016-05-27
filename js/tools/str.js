(function() {
  var noon, str;

  noon = require('noon');

  str = function(o) {
    var s;
    if (o == null) {
      return 'null';
    }
    if (typeof o === 'object') {
      if (o._str != null) {
        return o._str();
      } else {
        s = noon.stringify(o, {
          circular: true
        });
        return "\n" + s + "\n";
      }
    } else {
      return String(o);
    }
  };

  module.exports = str;

}).call(this);
