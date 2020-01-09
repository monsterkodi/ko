// koffee 1.6.0

/*
 0000000  000   000  000   000  000000000   0000000   000   000
000        000 000   0000  000     000     000   000   000 000
0000000     00000    000 0 000     000     000000000    00000
     000     000     000  0000     000     000   000   000 000
0000000      000     000   000     000     000   000  000   000
 */
var Balancer, Syntax, _, elem, fs, kerror, klor, kstr, last, matchr, noon, ref, slash, valid,
    indexOf = [].indexOf;

ref = require('kxk'), _ = ref._, elem = ref.elem, fs = ref.fs, kerror = ref.kerror, klor = ref.klor, kstr = ref.kstr, last = ref.last, matchr = ref.matchr, noon = ref.noon, slash = ref.slash, valid = ref.valid;

Balancer = require('./balancer');

Syntax = (function() {
    function Syntax(name, getLine, getLines) {
        this.name = name;
        this.getLine = getLine;
        this.getLines = getLines;
        this.diss = [];
        this.colors = {};
        this.balancer = new Balancer(this, this.getLine);
    }

    Syntax.prototype.newDiss = function(li) {
        var diss;
        diss = this.balancer.dissForLine(li);
        return diss;
    };

    Syntax.prototype.getDiss = function(li) {
        if (this.diss[li] == null) {
            this.diss[li] = this.newDiss(li);
        }
        return this.diss[li];
    };

    Syntax.prototype.setDiss = function(li, dss) {
        this.diss[li] = dss;
        return dss;
    };

    Syntax.prototype.fillDiss = function(bot) {
        var i, li, ref1, results;
        results = [];
        for (li = i = 0, ref1 = bot; 0 <= ref1 ? i <= ref1 : i >= ref1; li = 0 <= ref1 ? ++i : --i) {
            results.push(this.getDiss(li));
        }
        return results;
    };

    Syntax.prototype.setLines = function(lines) {
        return this.balancer.setLines(lines);
    };

    Syntax.prototype.changed = function(changeInfo) {
        var ch, change, di, i, len, li, ref1, ref2, results;
        if (valid(changeInfo.changes)) {
            this.balancer.blocks = null;
        }
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
                    this.balancer.deleteLine(di);
                    results.push(this.diss.splice(di, 1));
                    break;
                case 'inserted':
                    this.balancer.insertLine(di);
                    results.push(this.diss.splice(di, 0, this.newDiss(di)));
                    break;
                default:
                    results.push(void 0);
            }
        }
        return results;
    };

    Syntax.prototype.setFileType = function(fileType) {
        this.name = fileType;
        return this.balancer.setFileType(fileType);
    };

    Syntax.prototype.clear = function() {
        this.diss = [];
        return this.balancer.clear();
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ludGF4LmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSx3RkFBQTtJQUFBOztBQVFBLE1BQXdFLE9BQUEsQ0FBUSxLQUFSLENBQXhFLEVBQUUsU0FBRixFQUFLLGVBQUwsRUFBVyxXQUFYLEVBQWUsbUJBQWYsRUFBdUIsZUFBdkIsRUFBNkIsZUFBN0IsRUFBbUMsZUFBbkMsRUFBeUMsbUJBQXpDLEVBQWlELGVBQWpELEVBQXVELGlCQUF2RCxFQUE4RDs7QUFFOUQsUUFBQSxHQUFXLE9BQUEsQ0FBUSxZQUFSOztBQUVMO0lBRUMsZ0JBQUMsSUFBRCxFQUFRLE9BQVIsRUFBa0IsUUFBbEI7UUFBQyxJQUFDLENBQUEsT0FBRDtRQUFPLElBQUMsQ0FBQSxVQUFEO1FBQVUsSUFBQyxDQUFBLFdBQUQ7UUFFakIsSUFBQyxDQUFBLElBQUQsR0FBWTtRQUNaLElBQUMsQ0FBQSxNQUFELEdBQVk7UUFDWixJQUFDLENBQUEsUUFBRCxHQUFZLElBQUksUUFBSixDQUFhLElBQWIsRUFBZ0IsSUFBQyxDQUFBLE9BQWpCO0lBSmI7O3FCQVlILE9BQUEsR0FBUyxTQUFDLEVBQUQ7QUFFTCxZQUFBO1FBQUEsSUFBQSxHQUFPLElBQUMsQ0FBQSxRQUFRLENBQUMsV0FBVixDQUFzQixFQUF0QjtlQUNQO0lBSEs7O3FCQUtULE9BQUEsR0FBUyxTQUFDLEVBQUQ7UUFFTCxJQUFPLHFCQUFQO1lBQ0ksSUFBQyxDQUFBLElBQUssQ0FBQSxFQUFBLENBQU4sR0FBWSxJQUFDLENBQUEsT0FBRCxDQUFTLEVBQVQsRUFEaEI7O2VBR0EsSUFBQyxDQUFBLElBQUssQ0FBQSxFQUFBO0lBTEQ7O3FCQU9ULE9BQUEsR0FBUyxTQUFDLEVBQUQsRUFBSyxHQUFMO1FBRUwsSUFBQyxDQUFBLElBQUssQ0FBQSxFQUFBLENBQU4sR0FBWTtlQUNaO0lBSEs7O3FCQUtULFFBQUEsR0FBVSxTQUFDLEdBQUQ7QUFF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LENBQUEsV0FBVyxDQUFDLE1BQWIsQ0FBb0IsSUFBSSxDQUFDLElBQXpCO0lBekJaOzs7Ozs7QUEyQlgsTUFBTSxDQUFDLElBQVAsQ0FBQTs7QUFDQSxNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4wMDAgICAgICAgIDAwMCAwMDAgICAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgMDAwIDAwMFxuMDAwMDAwMCAgICAgMDAwMDAgICAgMDAwIDAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwMCAgICAwMDAwMFxuICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgIDAwMCAwMDBcbjAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgXywgZWxlbSwgZnMsIGtlcnJvciwga2xvciwga3N0ciwgbGFzdCwgbWF0Y2hyLCBub29uLCBzbGFzaCwgdmFsaWQgfSA9IHJlcXVpcmUgJ2t4aydcblxuQmFsYW5jZXIgPSByZXF1aXJlICcuL2JhbGFuY2VyJ1xuXG5jbGFzcyBTeW50YXhcbiAgICBcbiAgICBAOiAoQG5hbWUsIEBnZXRMaW5lLCBAZ2V0TGluZXMpIC0+XG5cbiAgICAgICAgQGRpc3MgICAgID0gW11cbiAgICAgICAgQGNvbG9ycyAgID0ge31cbiAgICAgICAgQGJhbGFuY2VyID0gbmV3IEJhbGFuY2VyIEAsIEBnZXRMaW5lXG5cbiAgICAjIDAwMDAwMDAgICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMFxuXG4gICAgbmV3RGlzczogKGxpKSAtPlxuXG4gICAgICAgIGRpc3MgPSBAYmFsYW5jZXIuZGlzc0ZvckxpbmUgbGlcbiAgICAgICAgZGlzc1xuXG4gICAgZ2V0RGlzczogKGxpKSAtPlxuXG4gICAgICAgIGlmIG5vdCBAZGlzc1tsaV0/XG4gICAgICAgICAgICBAZGlzc1tsaV0gPSBAbmV3RGlzcyBsaVxuXG4gICAgICAgIEBkaXNzW2xpXVxuXG4gICAgc2V0RGlzczogKGxpLCBkc3MpIC0+XG5cbiAgICAgICAgQGRpc3NbbGldID0gZHNzXG4gICAgICAgIGRzc1xuXG4gICAgZmlsbERpc3M6IChib3QpIC0+XG5cbiAgICAgICAgZm9yIGxpIGluIFswLi5ib3RdXG4gICAgICAgICAgICBAZ2V0RGlzcyBsaVxuXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAgICAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgXG4gICAgXG4gICAgc2V0TGluZXM6IChsaW5lcykgLT5cbiAgICAgICAgXG4gICAgICAgIEBiYWxhbmNlci5zZXRMaW5lcyBsaW5lc1xuICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDBcblxuICAgIGNoYW5nZWQ6IChjaGFuZ2VJbmZvKSAtPlxuXG4gICAgICAgIGlmIHZhbGlkIGNoYW5nZUluZm8uY2hhbmdlc1xuICAgICAgICAgICAgQGJhbGFuY2VyLmJsb2NrcyA9IG51bGxcbiAgICAgICAgXG4gICAgICAgIGZvciBjaGFuZ2UgaW4gY2hhbmdlSW5mby5jaGFuZ2VzXG5cbiAgICAgICAgICAgIFtkaSxsaSxjaF0gPSBbY2hhbmdlLmRvSW5kZXgsIGNoYW5nZS5uZXdJbmRleCwgY2hhbmdlLmNoYW5nZV1cblxuICAgICAgICAgICAgc3dpdGNoIGNoXG5cbiAgICAgICAgICAgICAgICB3aGVuICdjaGFuZ2VkJ1xuXG4gICAgICAgICAgICAgICAgICAgIEBkaXNzW2RpXSA9IEBuZXdEaXNzIGRpXG5cbiAgICAgICAgICAgICAgICB3aGVuICdkZWxldGVkJ1xuXG4gICAgICAgICAgICAgICAgICAgIEBiYWxhbmNlci5kZWxldGVMaW5lIGRpXG4gICAgICAgICAgICAgICAgICAgIEBkaXNzLnNwbGljZSBkaSwgMVxuXG4gICAgICAgICAgICAgICAgd2hlbiAnaW5zZXJ0ZWQnXG5cbiAgICAgICAgICAgICAgICAgICAgQGJhbGFuY2VyLmluc2VydExpbmUgZGlcbiAgICAgICAgICAgICAgICAgICAgQGRpc3Muc3BsaWNlIGRpLCAwLCBAbmV3RGlzcyBkaVxuXG4gICAgIyAwMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAwMDAgICAgICAwMDAgMDAwICAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgICAgMDAwMDAgICAgMDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwMDAwMDBcblxuICAgIHNldEZpbGVUeXBlOiAoZmlsZVR5cGUpIC0+XG5cbiAgICAgICAgIyBrbG9nICdTeW50YXguc2V0RmlsZVR5cGUnIGZpbGVUeXBlXG4gICAgICAgIFxuICAgICAgICBAbmFtZSA9IGZpbGVUeXBlXG4gICAgICAgIEBiYWxhbmNlci5zZXRGaWxlVHlwZSBmaWxlVHlwZVxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcblxuICAgIGNsZWFyOiAtPlxuXG4gICAgICAgIEBkaXNzID0gW11cbiAgICAgICAgQGJhbGFuY2VyLmNsZWFyKClcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwXG5cbiAgICBjb2xvckZvckNsYXNzbmFtZXM6IChjbHNzKSAtPlxuXG4gICAgICAgIGlmIG5vdCBAY29sb3JzW2Nsc3NdP1xuXG4gICAgICAgICAgICBkaXYgPSBlbGVtIGNsYXNzOiBjbHNzXG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkIGRpdlxuICAgICAgICAgICAgY29tcHV0ZWRTdHlsZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlIGRpdlxuICAgICAgICAgICAgY29sb3IgPSBjb21wdXRlZFN0eWxlLmNvbG9yXG4gICAgICAgICAgICBvcGFjaXR5ID0gY29tcHV0ZWRTdHlsZS5vcGFjaXR5XG4gICAgICAgICAgICBpZiBvcGFjaXR5ICE9ICcxJ1xuICAgICAgICAgICAgICAgIGNvbG9yID0gJ3JnYmEoJyArIGNvbG9yLnNsaWNlKDQsIGNvbG9yLmxlbmd0aC0yKSArICcsICcgKyBvcGFjaXR5ICsgJyknXG4gICAgICAgICAgICBAY29sb3JzW2Nsc3NdID0gY29sb3JcbiAgICAgICAgICAgIGRpdi5yZW1vdmUoKVxuXG4gICAgICAgIHJldHVybiBAY29sb3JzW2Nsc3NdXG5cbiAgICBjb2xvckZvclN0eWxlOiAoc3R5bCkgLT5cblxuICAgICAgICBpZiBub3QgQGNvbG9yc1tzdHlsXT9cbiAgICAgICAgICAgIGRpdiA9IGVsZW0gJ2RpdidcbiAgICAgICAgICAgIGRpdi5zdHlsZSA9IHN0eWxcbiAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQgZGl2XG4gICAgICAgICAgICBAY29sb3JzW3N0eWxdID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZGl2KS5jb2xvclxuICAgICAgICAgICAgZGl2LnJlbW92ZSgpXG4gICAgICAgICAgICBcbiAgICAgICAgcmV0dXJuIEBjb2xvcnNbc3R5bF1cblxuICAgIHNjaGVtZUNoYW5nZWQ6IC0+IEBjb2xvcnMgPSB7fVxuXG4gICAgIyMjXG4gICAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMDAwMDBcbiAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDBcbiAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAwMDBcbiAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDBcbiAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwMDAwMFxuICAgICMjI1xuXG4gICAgQG1hdGNockNvbmZpZ3MgPSB7fVxuICAgIEBzeW50YXhOYW1lcyA9IFtdXG5cbiAgICBAc3BhbkZvclRleHQ6ICh0ZXh0KSAtPiBAc3BhbkZvclRleHRBbmRTeW50YXggdGV4dCwgJ2tvJ1xuICAgIEBzcGFuRm9yVGV4dEFuZFN5bnRheDogKHRleHQsIG4pIC0+XG5cbiAgICAgICAgbCA9IFwiXCJcbiAgICAgICAgZGlzcyA9IEBkaXNzRm9yVGV4dEFuZFN5bnRheCB0ZXh0LCBuXG4gICAgICAgIGlmIGRpc3M/Lmxlbmd0aFxuICAgICAgICAgICAgbGFzdCA9IDBcbiAgICAgICAgICAgIGZvciBkaSBpbiBbMC4uLmRpc3MubGVuZ3RoXVxuICAgICAgICAgICAgICAgIGQgPSBkaXNzW2RpXVxuICAgICAgICAgICAgICAgIHN0eWxlID0gZC5zdHlsPyBhbmQgZC5zdHlsLmxlbmd0aCBhbmQgXCIgc3R5bGU9XFxcIiN7ZC5zdHlsfVxcXCJcIiBvciAnJ1xuICAgICAgICAgICAgICAgIHNwYyA9ICcnXG4gICAgICAgICAgICAgICAgZm9yIHNwIGluIFtsYXN0Li4uZC5zdGFydF1cbiAgICAgICAgICAgICAgICAgICAgc3BjICs9ICcmbmJzcDsnXG4gICAgICAgICAgICAgICAgbGFzdCAgPSBkLnN0YXJ0ICsgZC5tYXRjaC5sZW5ndGhcbiAgICAgICAgICAgICAgICBjbHNzID0gZC5jbHNzPyBhbmQgZC5jbHNzLmxlbmd0aCBhbmQgXCIgY2xhc3M9XFxcIiN7ZC5jbHNzfVxcXCJcIiBvciAnJ1xuICAgICAgICAgICAgICAgIGNscnpkID0gXCI8c3BhbiN7c3R5bGV9I3tjbHNzfT4je3NwY30je2tzdHIuZW5jb2RlIGQubWF0Y2h9PC9zcGFuPlwiXG4gICAgICAgICAgICAgICAgbCArPSBjbHJ6ZFxuICAgICAgICBsXG5cbiAgICBAcmFuZ2VzRm9yVGV4dEFuZFN5bnRheDogKGxpbmUsIG4pIC0+XG5cbiAgICAgICAgbWF0Y2hyLnJhbmdlcyBTeW50YXgubWF0Y2hyQ29uZmlnc1tuXSwgbGluZVxuXG4gICAgQGRpc3NGb3JUZXh0QW5kU3ludGF4OiAodGV4dCwgbikgLT5cblxuICAgICAgICBpZiBuIG5vdCBpbiBbJ2Jyb3dzZXInICdrbycgJ2NvbW1hbmRsaW5lJyAnbWFjcm8nICd0ZXJtJyAndGVzdCddXG4gICAgICAgICAgICByZXN1bHQgPSBrbG9yLnJhbmdlcyB0ZXh0LCBuXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGlmIG5vdCBuPyBvciBub3QgU3ludGF4Lm1hdGNockNvbmZpZ3Nbbl0/XG4gICAgICAgICAgICAgICAgcmV0dXJuIGtlcnJvciBcIm5vIHN5bnRheD8gI3tufVwiXG4gICAgICAgICAgICByZXN1bHQgPSBtYXRjaHIuZGlzc2VjdCBtYXRjaHIucmFuZ2VzIFN5bnRheC5tYXRjaHJDb25maWdzW25dLCB0ZXh0XG4gICAgICAgIHJlc3VsdFxuXG4gICAgQGxpbmVGb3JEaXNzOiAoZHNzKSAtPlxuXG4gICAgICAgIGwgPSBcIlwiXG4gICAgICAgIGZvciBkIGluIGRzc1xuICAgICAgICAgICAgbCA9IF8ucGFkRW5kIGwsIGQuc3RhcnRcbiAgICAgICAgICAgIGwgKz0gZC5tYXRjaFxuICAgICAgICBsXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMFxuICAgICMgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwXG5cbiAgICBAc2hlYmFuZzogKGxpbmUpIC0+XG5cbiAgICAgICAgaWYgbGluZS5zdGFydHNXaXRoIFwiIyFcIlxuICAgICAgICAgICAgbGFzdFdvcmQgPSBfLmxhc3QgbGluZS5zcGxpdCAvW1xcc1xcL10vXG4gICAgICAgICAgICBzd2l0Y2ggbGFzdFdvcmRcbiAgICAgICAgICAgICAgICB3aGVuICdweXRob24nIHRoZW4gcmV0dXJuICdweSdcbiAgICAgICAgICAgICAgICB3aGVuICdub2RlJyAgIHRoZW4gcmV0dXJuICdqcydcbiAgICAgICAgICAgICAgICB3aGVuICdiYXNoJyAgIHRoZW4gcmV0dXJuICdzaCdcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGlmIGxhc3RXb3JkIGluIEBzeW50YXhOYW1lc1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGxhc3RXb3JkXG4gICAgICAgICd0eHQnXG5cbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgMDAwICAwMDAwICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwXG5cbiAgICBAaW5pdDogLT5cblxuICAgICAgICBzeW50YXhEaXIgPSBcIiN7X19kaXJuYW1lfS8uLi8uLi9zeW50YXgvXCJcblxuICAgICAgICBmb3Igc3ludGF4RmlsZSBpbiBmcy5yZWFkZGlyU3luYyBzeW50YXhEaXJcblxuICAgICAgICAgICAgc3ludGF4TmFtZSA9IHNsYXNoLmJhc2VuYW1lIHN5bnRheEZpbGUsICcubm9vbidcbiAgICAgICAgICAgIHBhdHRlcm5zID0gbm9vbi5sb2FkIHNsYXNoLmpvaW4gc3ludGF4RGlyLCBzeW50YXhGaWxlXG5cbiAgICAgICAgICAgIHBhdHRlcm5zWydcXFxcdysnXSAgICAgICA9ICd0ZXh0JyAgICMgdGhpcyBlbnN1cmVzIHRoYXQgYWxsIC4uLlxuICAgICAgICAgICAgcGF0dGVybnNbJ1teXFxcXHdcXFxcc10rJ10gPSAnc3ludGF4JyAjIG5vbi1zcGFjZSBjaGFyYWN0ZXJzIG1hdGNoXG5cbiAgICAgICAgICAgIGlmIHBhdHRlcm5zLmtvPy5leHRuYW1lcz9cbiAgICAgICAgICAgICAgICBleHRuYW1lcyA9IHBhdHRlcm5zLmtvLmV4dG5hbWVzXG4gICAgICAgICAgICAgICAgZGVsZXRlIHBhdHRlcm5zLmtvXG5cbiAgICAgICAgICAgICAgICBjb25maWcgPSBtYXRjaHIuY29uZmlnIHBhdHRlcm5zXG4gICAgICAgICAgICAgICAgZm9yIHN5bnRheE5hbWUgaW4gZXh0bmFtZXNcbiAgICAgICAgICAgICAgICAgICAgQHN5bnRheE5hbWVzLnB1c2ggc3ludGF4TmFtZVxuICAgICAgICAgICAgICAgICAgICBAbWF0Y2hyQ29uZmlnc1tzeW50YXhOYW1lXSA9IGNvbmZpZ1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBzeW50YXhOYW1lcy5wdXNoIHN5bnRheE5hbWVcbiAgICAgICAgICAgICAgICBAbWF0Y2hyQ29uZmlnc1tzeW50YXhOYW1lXSA9IG1hdGNoci5jb25maWcgcGF0dGVybnNcblxuICAgICAgICAjIGtsb3IuaW5pdCgpXG4gICAgICAgIEBzeW50YXhOYW1lcyA9IEBzeW50YXhOYW1lcy5jb25jYXQga2xvci5leHRzXG5cblN5bnRheC5pbml0KClcbm1vZHVsZS5leHBvcnRzID0gU3ludGF4XG4iXX0=
//# sourceURL=../../coffee/editor/syntax.coffee