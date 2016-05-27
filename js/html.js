(function() {
  var encode, html, log;

  encode = require('./tools/encode');

  log = require('./tools/log');

  html = (function() {
    function html() {}

    html.cursorSpan = function(charSize) {
      return "<span id=\"cursor\" style=\"height: " + charSize[1] + "px\"></span>";
    };

    html.render = function(lines, cursor, selectionRanges, charSize) {
      var border, curSpan, h, i, j, l, left, lineRange, mid, nextRange, prevRange, range, ref, right, selEnd, selStart, selectedCharacters;
      h = [];
      if (selectionRanges.length) {
        lineRange = [selectionRanges[0][0], selectionRanges[selectionRanges.length - 1][0]];
      }
      selectedCharacters = function(i) {
        var r;
        r = selectionRanges[i - selectionRanges[0][0]][1];
        return [r[0], r[1]];
      };
      curSpan = html.cursorSpan(charSize);
      for (i = j = 0, ref = lines.length; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
        l = lines[i];
        if (lineRange && ((lineRange[0] <= i && i <= lineRange[1]))) {
          range = selectedCharacters(i);
          left = l.substr(0, range[0]);
          mid = l.substr(range[0], range[1] - range[0]);
          right = l.substr(range[1]);
          border = "";
          if (i === lineRange[0]) {
            border += " tl tr";
          } else {
            prevRange = selectedCharacters(i - 1);
            if ((range[0] < prevRange[0]) || (range[0] > prevRange[1])) {
              border += " tl";
            }
            if ((range[1] > prevRange[1]) || (range[1] < prevRange[0])) {
              border += " tr";
            }
          }
          if (i === lineRange[1]) {
            border += " bl br";
          } else {
            nextRange = selectedCharacters(i + 1);
            if (range[1] > nextRange[1]) {
              border += " br";
            }
            if ((range[0] < nextRange[0]) || (range[0] > nextRange[1])) {
              border += " bl";
            }
          }
          if (range[1] === l.length || range[1] - range[0] === 0 && i !== cursor[1]) {
            border += " end";
          }
          selStart = "<span class=\"selection" + border + "\">";
          selEnd = "</span>";
          if (i === cursor[1]) {
            if (cursor[0] === range[0]) {
              h.push(encode(left) + curSpan + selStart + encode(mid) + selEnd + encode(right));
            } else {
              h.push(encode(left) + selStart + encode(mid) + selEnd + curSpan + encode(right));
            }
          } else {
            h.push(encode(left) + selStart + encode(mid) + selEnd + encode(right));
          }
        } else if (i === cursor[1]) {
          left = l.substr(0, cursor[0]);
          right = l.substr(cursor[0]);
          h.push(encode(left) + curSpan + encode(right));
        } else {
          h.push(encode(l));
        }
      }
      return h.join('<br>');
    };

    return html;

  })();

  module.exports = html;

}).call(this);
