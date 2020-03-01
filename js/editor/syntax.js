// koffee 1.7.0

/*
 0000000  000   000  000   000  000000000   0000000   000   000
000        000 000   0000  000     000     000   000   000 000
0000000     00000    000 0 000     000     000000000    00000
     000     000     000  0000     000     000   000   000 000
0000000      000     000   000     000     000   000  000   000
 */
var Syntax, _, elem, fs, kerror, klor, kstr, last, matchr, noon, ref, slash,
    indexOf = [].indexOf;

ref = require('kxk'), _ = ref._, elem = ref.elem, fs = ref.fs, kerror = ref.kerror, klor = ref.klor, kstr = ref.kstr, last = ref.last, matchr = ref.matchr, noon = ref.noon, slash = ref.slash;

Syntax = (function() {
    function Syntax(name, getLine, getLines) {
        this.name = name;
        this.getLine = getLine;
        this.getLines = getLines;
        this.diss = [];
        this.colors = {};
    }

    Syntax.prototype.newDiss = function(li) {
        return klor.dissect([this.getLine(li)], this.name)[0];
    };

    Syntax.prototype.getDiss = function(li) {
        var base;
        return (base = this.diss)[li] != null ? base[li] : base[li] = this.newDiss(li);
    };

    Syntax.prototype.setDiss = function(li, dss) {
        return this.diss[li] = dss;
    };

    Syntax.prototype.setLines = function(lines) {
        return this.diss = klor.dissect(lines, this.name);
    };

    Syntax.prototype.changed = function(changeInfo) {
        var ch, change, di, i, len, li, ref1, ref2, results;
        ref1 = changeInfo.changes;
        results = [];
        for (i = 0, len = ref1.length; i < len; i++) {
            change = ref1[i];
            ref2 = [change.doIndex, change.newIndex, change.change], di = ref2[0], li = ref2[1], ch = ref2[2];
            switch (ch) {
                case 'changed':
                    results.push(this.diss[di] = this.newDiss(di));
                    break;
                case 'deleted':
                    results.push(this.diss.splice(di, 1));
                    break;
                case 'inserted':
                    results.push(this.diss.splice(di, 0, this.newDiss(di)));
                    break;
                default:
                    results.push(void 0);
            }
        }
        return results;
    };

    Syntax.prototype.setFileType = function(name) {
        this.name = name;
    };

    Syntax.prototype.colorForClassnames = function(clss) {
        var color, computedStyle, div, opacity;
        if (this.colors[clss] == null) {
            div = elem({
                "class": clss
            });
            document.body.appendChild(div);
            computedStyle = window.getComputedStyle(div);
            color = computedStyle.color;
            opacity = computedStyle.opacity;
            if (opacity !== '1') {
                color = 'rgba(' + color.slice(4, color.length - 2) + ', ' + opacity + ')';
            }
            this.colors[clss] = color;
            div.remove();
        }
        return this.colors[clss];
    };

    Syntax.prototype.colorForStyle = function(styl) {
        var div;
        if (this.colors[styl] == null) {
            div = elem('div');
            div.style = styl;
            document.body.appendChild(div);
            this.colors[styl] = window.getComputedStyle(div).color;
            div.remove();
        }
        return this.colors[styl];
    };

    Syntax.prototype.schemeChanged = function() {
        return this.colors = {};
    };


    /*
     0000000  000000000   0000000   000000000  000   0000000
    000          000     000   000     000     000  000
    0000000      000     000000000     000     000  000
         000     000     000   000     000     000  000
    0000000      000     000   000     000     000   0000000
     */

    Syntax.matchrConfigs = {};

    Syntax.syntaxNames = [];

    Syntax.spanForText = function(text) {
        return this.spanForTextAndSyntax(text, 'ko');
    };

    Syntax.spanForTextAndSyntax = function(text, n) {
        var clrzd, clss, d, di, diss, i, j, l, ref1, ref2, ref3, sp, spc, style;
        l = "";
        diss = this.dissForTextAndSyntax(text, n);
        if (diss != null ? diss.length : void 0) {
            last = 0;
            for (di = i = 0, ref1 = diss.length; 0 <= ref1 ? i < ref1 : i > ref1; di = 0 <= ref1 ? ++i : --i) {
                d = diss[di];
                style = (d.styl != null) && d.styl.length && (" style=\"" + d.styl + "\"") || '';
                spc = '';
                for (sp = j = ref2 = last, ref3 = d.start; ref2 <= ref3 ? j < ref3 : j > ref3; sp = ref2 <= ref3 ? ++j : --j) {
                    spc += '&nbsp;';
                }
                last = d.start + d.match.length;
                clss = (d.clss != null) && d.clss.length && (" class=\"" + d.clss + "\"") || '';
                clrzd = "<span" + style + clss + ">" + spc + (kstr.encode(d.match)) + "</span>";
                l += clrzd;
            }
        }
        return l;
    };

    Syntax.rangesForTextAndSyntax = function(line, n) {
        return matchr.ranges(Syntax.matchrConfigs[n], line);
    };

    Syntax.dissForTextAndSyntax = function(text, n) {
        var result;
        if (n !== 'browser' && n !== 'ko' && n !== 'commandline' && n !== 'macro' && n !== 'term' && n !== 'test') {
            result = klor.ranges(text, n);
        } else {
            if ((n == null) || (Syntax.matchrConfigs[n] == null)) {
                return kerror("no syntax? " + n);
            }
            result = matchr.dissect(matchr.ranges(Syntax.matchrConfigs[n], text));
        }
        return result;
    };

    Syntax.lineForDiss = function(dss) {
        var d, i, l, len;
        l = "";
        for (i = 0, len = dss.length; i < len; i++) {
            d = dss[i];
            l = _.padEnd(l, d.start);
            l += d.match;
        }
        return l;
    };

    Syntax.shebang = function(line) {
        var lastWord;
        if (line.startsWith("#!")) {
            lastWord = _.last(line.split(/[\s\/]/));
            switch (lastWord) {
                case 'python':
                    return 'py';
                case 'node':
                    return 'js';
                case 'bash':
                    return 'sh';
                default:
                    if (indexOf.call(this.syntaxNames, lastWord) >= 0) {
                        return lastWord;
                    }
            }
        }
        return 'txt';
    };

    Syntax.init = function() {
        var config, extnames, i, j, len, len1, patterns, ref1, ref2, syntaxDir, syntaxFile, syntaxName;
        syntaxDir = __dirname + "/../../syntax/";
        ref1 = fs.readdirSync(syntaxDir);
        for (i = 0, len = ref1.length; i < len; i++) {
            syntaxFile = ref1[i];
            syntaxName = slash.basename(syntaxFile, '.noon');
            patterns = noon.load(slash.join(syntaxDir, syntaxFile));
            patterns['\\w+'] = 'text';
            patterns['[^\\w\\s]+'] = 'syntax';
            if (((ref2 = patterns.ko) != null ? ref2.extnames : void 0) != null) {
                extnames = patterns.ko.extnames;
                delete patterns.ko;
                config = matchr.config(patterns);
                for (j = 0, len1 = extnames.length; j < len1; j++) {
                    syntaxName = extnames[j];
                    this.syntaxNames.push(syntaxName);
                    this.matchrConfigs[syntaxName] = config;
                }
            } else {
                this.syntaxNames.push(syntaxName);
                this.matchrConfigs[syntaxName] = matchr.config(patterns);
            }
        }
        return this.syntaxNames = this.syntaxNames.concat(klor.exts);
    };

    return Syntax;

})();

Syntax.init();

module.exports = Syntax;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ludGF4LmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSx1RUFBQTtJQUFBOztBQVFBLE1BQWlFLE9BQUEsQ0FBUSxLQUFSLENBQWpFLEVBQUUsU0FBRixFQUFLLGVBQUwsRUFBVyxXQUFYLEVBQWUsbUJBQWYsRUFBdUIsZUFBdkIsRUFBNkIsZUFBN0IsRUFBbUMsZUFBbkMsRUFBeUMsbUJBQXpDLEVBQWlELGVBQWpELEVBQXVEOztBQUVqRDtJQUVDLGdCQUFDLElBQUQsRUFBUSxPQUFSLEVBQWtCLFFBQWxCO1FBQUMsSUFBQyxDQUFBLE9BQUQ7UUFBTyxJQUFDLENBQUEsVUFBRDtRQUFVLElBQUMsQ0FBQSxXQUFEO1FBRWpCLElBQUMsQ0FBQSxJQUFELEdBQVU7UUFDVixJQUFDLENBQUEsTUFBRCxHQUFVO0lBSFg7O3FCQVdILE9BQUEsR0FBUyxTQUFDLEVBQUQ7ZUFFTCxJQUFJLENBQUMsT0FBTCxDQUFhLENBQUMsSUFBQyxDQUFBLE9BQUQsQ0FBUyxFQUFULENBQUQsQ0FBYixFQUE0QixJQUFDLENBQUEsSUFBN0IsQ0FBbUMsQ0FBQSxDQUFBO0lBRjlCOztxQkFJVCxPQUFBLEdBQVMsU0FBQyxFQUFEO0FBRUwsWUFBQTtvREFBTSxDQUFBLEVBQUEsUUFBQSxDQUFBLEVBQUEsSUFBTyxJQUFDLENBQUEsT0FBRCxDQUFTLEVBQVQ7SUFGUjs7cUJBSVQsT0FBQSxHQUFTLFNBQUMsRUFBRCxFQUFLLEdBQUw7ZUFFTCxJQUFDLENBQUEsSUFBSyxDQUFBLEVBQUEsQ0FBTixHQUFZO0lBRlA7O3FCQVVULFFBQUEsR0FBVSxTQUFDLEtBQUQ7ZUFFTixJQUFDLENBQUEsSUFBRCxHQUFRLElBQUksQ0FBQyxPQUFMLENBQWEsS0FBYixFQUFvQixJQUFDLENBQUEsSUFBckI7SUFGRjs7cUJBVVYsT0FBQSxHQUFTLFNBQUMsVUFBRDtBQUVMLFlBQUE7QUFBQTtBQUFBO2FBQUEs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WUFBQSxDQUFULEdBQXlCO1lBRXpCLElBQUcsK0RBQUg7Z0JBQ0ksUUFBQSxHQUFXLFFBQVEsQ0FBQyxFQUFFLENBQUM7Z0JBQ3ZCLE9BQU8sUUFBUSxDQUFDO2dCQUVoQixNQUFBLEdBQVMsTUFBTSxDQUFDLE1BQVAsQ0FBYyxRQUFkO0FBQ1QscUJBQUEsNENBQUE7O29CQUNJLElBQUMsQ0FBQSxXQUFXLENBQUMsSUFBYixDQUFrQixVQUFsQjtvQkFDQSxJQUFDLENBQUEsYUFBYyxDQUFBLFVBQUEsQ0FBZixHQUE2QjtBQUZqQyxpQkFMSjthQUFBLE1BQUE7Z0JBU0ksSUFBQyxDQUFBLFdBQVcsQ0FBQyxJQUFiLENBQWtCLFVBQWxCO2dCQUNBLElBQUMsQ0FBQSxhQUFjLENBQUEsVUFBQSxDQUFmLEdBQTZCLE1BQU0sQ0FBQyxNQUFQLENBQWMsUUFBZCxFQVZqQzs7QUFSSjtlQXFCQSxJQUFDLENBQUEsV0FBRCxHQUFlLElBQUMsQ0FBQSxXQUFXLENBQUMsTUFBYixDQUFvQixJQUFJLENBQUMsSUFBekI7SUF6Qlo7Ozs7OztBQTJCWCxNQUFNLENBQUMsSUFBUCxDQUFBOztBQUNBLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDBcbjAwMCAgICAgICAgMDAwIDAwMCAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgICAwMDAgMDAwXG4wMDAwMDAwICAgICAwMDAwMCAgICAwMDAgMCAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAgIDAwMDAwXG4gICAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgMDAwIDAwMFxuMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4jIyNcblxueyBfLCBlbGVtLCBmcywga2Vycm9yLCBrbG9yLCBrc3RyLCBsYXN0LCBtYXRjaHIsIG5vb24sIHNsYXNoIH0gPSByZXF1aXJlICdreGsnXG5cbmNsYXNzIFN5bnRheFxuICAgIFxuICAgIEA6IChAbmFtZSwgQGdldExpbmUsIEBnZXRMaW5lcykgLT5cblxuICAgICAgICBAZGlzcyAgID0gW11cbiAgICAgICAgQGNvbG9ycyA9IHt9XG5cbiAgICAjIDAwMDAwMDAgICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMFxuXG4gICAgbmV3RGlzczogKGxpKSAtPlxuICAgICAgICBcbiAgICAgICAga2xvci5kaXNzZWN0KFtAZ2V0TGluZSBsaV0sIEBuYW1lKVswXVxuXG4gICAgZ2V0RGlzczogKGxpKSAtPlxuXG4gICAgICAgIEBkaXNzW2xpXSA/PSBAbmV3RGlzcyBsaVxuXG4gICAgc2V0RGlzczogKGxpLCBkc3MpIC0+XG5cbiAgICAgICAgQGRpc3NbbGldID0gZHNzXG5cbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICAjICAgICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgICAgICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBzZXRMaW5lczogKGxpbmVzKSAtPlxuICAgICAgICBcbiAgICAgICAgQGRpc3MgPSBrbG9yLmRpc3NlY3QgbGluZXMsIEBuYW1lXG4gICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgY2hhbmdlZDogKGNoYW5nZUluZm8pIC0+XG5cbiAgICAgICAgZm9yIGNoYW5nZSBpbiBjaGFuZ2VJbmZvLmNoYW5nZXNcblxuICAgICAgICAgICAgW2RpLGxpLGNoXSA9IFtjaGFuZ2UuZG9JbmRleCwgY2hhbmdlLm5ld0luZGV4LCBjaGFuZ2UuY2hhbmdlXVxuXG4gICAgICAgICAgICBzd2l0Y2ggY2hcbiAgICAgICAgICAgICAgICB3aGVuICdjaGFuZ2VkJyAgdGhlbiBAZGlzc1tkaV0gPSBAbmV3RGlzcyBkaVxuICAgICAgICAgICAgICAgIHdoZW4gJ2RlbGV0ZWQnICB0aGVuIEBkaXNzLnNwbGljZSBkaSwgMVxuICAgICAgICAgICAgICAgIHdoZW4gJ2luc2VydGVkJyB0aGVuIEBkaXNzLnNwbGljZSBkaSwgMCwgQG5ld0Rpc3MgZGlcblxuICAgIHNldEZpbGVUeXBlOiAoQG5hbWUpIC0+XG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuXG4gICAgY29sb3JGb3JDbGFzc25hbWVzOiAoY2xzcykgLT5cblxuICAgICAgICBpZiBub3QgQGNvbG9yc1tjbHNzXT9cblxuICAgICAgICAgICAgZGl2ID0gZWxlbSBjbGFzczogY2xzc1xuICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCBkaXZcbiAgICAgICAgICAgIGNvbXB1dGVkU3R5bGUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSBkaXZcbiAgICAgICAgICAgIGNvbG9yID0gY29tcHV0ZWRTdHlsZS5jb2xvclxuICAgICAgICAgICAgb3BhY2l0eSA9IGNvbXB1dGVkU3R5bGUub3BhY2l0eVxuICAgICAgICAgICAgaWYgb3BhY2l0eSAhPSAnMSdcbiAgICAgICAgICAgICAgICBjb2xvciA9ICdyZ2JhKCcgKyBjb2xvci5zbGljZSg0LCBjb2xvci5sZW5ndGgtMikgKyAnLCAnICsgb3BhY2l0eSArICcpJ1xuICAgICAgICAgICAgQGNvbG9yc1tjbHNzXSA9IGNvbG9yXG4gICAgICAgICAgICBkaXYucmVtb3ZlKClcblxuICAgICAgICByZXR1cm4gQGNvbG9yc1tjbHNzXVxuXG4gICAgY29sb3JGb3JTdHlsZTogKHN0eWwpIC0+XG5cbiAgICAgICAgaWYgbm90IEBjb2xvcnNbc3R5bF0/XG4gICAgICAgICAgICBkaXYgPSBlbGVtICdkaXYnXG4gICAgICAgICAgICBkaXYuc3R5bGUgPSBzdHlsXG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkIGRpdlxuICAgICAgICAgICAgQGNvbG9yc1tzdHlsXSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGRpdikuY29sb3JcbiAgICAgICAgICAgIGRpdi5yZW1vdmUoKVxuICAgICAgICAgICAgXG4gICAgICAgIHJldHVybiBAY29sb3JzW3N0eWxdXG5cbiAgICBzY2hlbWVDaGFuZ2VkOiAtPiBAY29sb3JzID0ge31cblxuICAgICMjI1xuICAgICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAwMDAwMDAwXG4gICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwXG4gICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgMDAwXG4gICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwXG4gICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMDAwMDBcbiAgICAjIyNcblxuICAgIEBtYXRjaHJDb25maWdzID0ge31cbiAgICBAc3ludGF4TmFtZXMgPSBbXVxuXG4gICAgQHNwYW5Gb3JUZXh0OiAodGV4dCkgLT4gQHNwYW5Gb3JUZXh0QW5kU3ludGF4IHRleHQsICdrbydcbiAgICBAc3BhbkZvclRleHRBbmRTeW50YXg6ICh0ZXh0LCBuKSAtPlxuXG4gICAgICAgIGwgPSBcIlwiXG4gICAgICAgIGRpc3MgPSBAZGlzc0ZvclRleHRBbmRTeW50YXggdGV4dCwgblxuICAgICAgICBpZiBkaXNzPy5sZW5ndGhcbiAgICAgICAgICAgIGxhc3QgPSAwXG4gICAgICAgICAgICBmb3IgZGkgaW4gWzAuLi5kaXNzLmxlbmd0aF1cbiAgICAgICAgICAgICAgICBkID0gZGlzc1tkaV1cbiAgICAgICAgICAgICAgICBzdHlsZSA9IGQuc3R5bD8gYW5kIGQuc3R5bC5sZW5ndGggYW5kIFwiIHN0eWxlPVxcXCIje2Quc3R5bH1cXFwiXCIgb3IgJydcbiAgICAgICAgICAgICAgICBzcGMgPSAnJ1xuICAgICAgICAgICAgICAgIGZvciBzcCBpbiBbbGFzdC4uLmQuc3RhcnRdXG4gICAgICAgICAgICAgICAgICAgIHNwYyArPSAnJm5ic3A7J1xuICAgICAgICAgICAgICAgIGxhc3QgID0gZC5zdGFydCArIGQubWF0Y2gubGVuZ3RoXG4gICAgICAgICAgICAgICAgY2xzcyAgPSBkLmNsc3M/IGFuZCBkLmNsc3MubGVuZ3RoIGFuZCBcIiBjbGFzcz1cXFwiI3tkLmNsc3N9XFxcIlwiIG9yICcnXG4gICAgICAgICAgICAgICAgY2xyemQgPSBcIjxzcGFuI3tzdHlsZX0je2Nsc3N9PiN7c3BjfSN7a3N0ci5lbmNvZGUgZC5tYXRjaH08L3NwYW4+XCJcbiAgICAgICAgICAgICAgICBsICs9IGNscnpkXG4gICAgICAgIGxcblxuICAgIEByYW5nZXNGb3JUZXh0QW5kU3ludGF4OiAobGluZSwgbikgLT5cblxuICAgICAgICBtYXRjaHIucmFuZ2VzIFN5bnRheC5tYXRjaHJDb25maWdzW25dLCBsaW5lXG5cbiAgICBAZGlzc0ZvclRleHRBbmRTeW50YXg6ICh0ZXh0LCBuKSAtPlxuXG4gICAgICAgIGlmIG4gbm90IGluIFsnYnJvd3NlcicgJ2tvJyAnY29tbWFuZGxpbmUnICdtYWNybycgJ3Rlcm0nICd0ZXN0J11cbiAgICAgICAgICAgIHJlc3VsdCA9IGtsb3IucmFuZ2VzIHRleHQsIG5cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaWYgbm90IG4/IG9yIG5vdCBTeW50YXgubWF0Y2hyQ29uZmlnc1tuXT9cbiAgICAgICAgICAgICAgICByZXR1cm4ga2Vycm9yIFwibm8gc3ludGF4PyAje259XCJcbiAgICAgICAgICAgIHJlc3VsdCA9IG1hdGNoci5kaXNzZWN0IG1hdGNoci5yYW5nZXMgU3ludGF4Lm1hdGNockNvbmZpZ3Nbbl0sIHRleHRcbiAgICAgICAgcmVzdWx0XG5cbiAgICBAbGluZUZvckRpc3M6IChkc3MpIC0+XG5cbiAgICAgICAgbCA9IFwiXCJcbiAgICAgICAgZm9yIGQgaW4gZHNzXG4gICAgICAgICAgICBsID0gXy5wYWRFbmQgbCwgZC5zdGFydFxuICAgICAgICAgICAgbCArPSBkLm1hdGNoXG4gICAgICAgIGxcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDBcblxuICAgIEBzaGViYW5nOiAobGluZSkgLT5cblxuICAgICAgICBpZiBsaW5lLnN0YXJ0c1dpdGggXCIjIVwiXG4gICAgICAgICAgICBsYXN0V29yZCA9IF8ubGFzdCBsaW5lLnNwbGl0IC9bXFxzXFwvXS9cbiAgICAgICAgICAgIHN3aXRjaCBsYXN0V29yZFxuICAgICAgICAgICAgICAgIHdoZW4gJ3B5dGhvbicgdGhlbiByZXR1cm4gJ3B5J1xuICAgICAgICAgICAgICAgIHdoZW4gJ25vZGUnICAgdGhlbiByZXR1cm4gJ2pzJ1xuICAgICAgICAgICAgICAgIHdoZW4gJ2Jhc2gnICAgdGhlbiByZXR1cm4gJ3NoJ1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgaWYgbGFzdFdvcmQgaW4gQHN5bnRheE5hbWVzXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbGFzdFdvcmRcbiAgICAgICAgJ3R4dCdcblxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMDAwXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDBcblxuICAgIEBpbml0OiAtPlxuXG4gICAgICAgIHN5bnRheERpciA9IFwiI3tfX2Rpcm5hbWV9Ly4uLy4uL3N5bnRheC9cIlxuXG4gICAgICAgIGZvciBzeW50YXhGaWxlIGluIGZzLnJlYWRkaXJTeW5jIHN5bnRheERpclxuXG4gICAgICAgICAgICBzeW50YXhOYW1lID0gc2xhc2guYmFzZW5hbWUgc3ludGF4RmlsZSwgJy5ub29uJ1xuICAgICAgICAgICAgcGF0dGVybnMgPSBub29uLmxvYWQgc2xhc2guam9pbiBzeW50YXhEaXIsIHN5bnRheEZpbGVcblxuICAgICAgICAgICAgcGF0dGVybnNbJ1xcXFx3KyddICAgICAgID0gJ3RleHQnICAgIyB0aGlzIGVuc3VyZXMgdGhhdCBhbGwgLi4uXG4gICAgICAgICAgICBwYXR0ZXJuc1snW15cXFxcd1xcXFxzXSsnXSA9ICdzeW50YXgnICMgbm9uLXNwYWNlIGNoYXJhY3RlcnMgbWF0Y2hcblxuICAgICAgICAgICAgaWYgcGF0dGVybnMua28/LmV4dG5hbWVzP1xuICAgICAgICAgICAgICAgIGV4dG5hbWVzID0gcGF0dGVybnMua28uZXh0bmFtZXNcbiAgICAgICAgICAgICAgICBkZWxldGUgcGF0dGVybnMua29cblxuICAgICAgICAgICAgICAgIGNvbmZpZyA9IG1hdGNoci5jb25maWcgcGF0dGVybnNcbiAgICAgICAgICAgICAgICBmb3Igc3ludGF4TmFtZSBpbiBleHRuYW1lc1xuICAgICAgICAgICAgICAgICAgICBAc3ludGF4TmFtZXMucHVzaCBzeW50YXhOYW1lXG4gICAgICAgICAgICAgICAgICAgIEBtYXRjaHJDb25maWdzW3N5bnRheE5hbWVdID0gY29uZmlnXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQHN5bnRheE5hbWVzLnB1c2ggc3ludGF4TmFtZVxuICAgICAgICAgICAgICAgIEBtYXRjaHJDb25maWdzW3N5bnRheE5hbWVdID0gbWF0Y2hyLmNvbmZpZyBwYXR0ZXJuc1xuXG4gICAgICAgICMga2xvci5pbml0KClcbiAgICAgICAgQHN5bnRheE5hbWVzID0gQHN5bnRheE5hbWVzLmNvbmNhdCBrbG9yLmV4dHNcblxuU3ludGF4LmluaXQoKVxubW9kdWxlLmV4cG9ydHMgPSBTeW50YXhcbiJdfQ==
//# sourceURL=../../coffee/editor/syntax.coffee