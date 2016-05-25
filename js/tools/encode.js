(function() {
  var encode;

  encode = require('html-entities').XmlEntities.encode;

  module.exports = function(s) {
    var r;
    r = encode(s);
    r = r.replace(/\s/g, '&nbsp;');
    return r;
  };

}).call(this);
