// koffee 1.11.0

/*
 0000000   0000000   00     00  00     00   0000000   000   000  0000000    000      000   0000000  000000000
000       000   000  000   000  000   000  000   000  0000  000  000   000  000      000  000          000
000       000   000  000000000  000000000  000000000  000 0 000  000   000  000      000  0000000      000
000       000   000  000 0 000  000 0 000  000   000  000  0000  000   000  000      000       000     000
 0000000   0000000   000   000  000   000  000   000  000   000  0000000    0000000  000  0000000      000
 */
var CommandList, Syntax, TextEditor, kerror, matchr, ref, salt,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), matchr = ref.matchr, kerror = ref.kerror;

TextEditor = require('../editor/texteditor');

Syntax = require('../editor/syntax');

salt = require('../tools/salt');

CommandList = (function(superClass) {
    extend(CommandList, superClass);

    function CommandList(command, viewElem, opt) {
        var ref1;
        this.command = command;
        this.dequeueMeta = bind(this.dequeueMeta, this);
        this.onMetaClick = bind(this.onMetaClick, this);
        CommandList.__super__.constructor.call(this, viewElem, {
            features: ['Scrollbar', 'Numbers', 'Meta'],
            lineHeight: 1.4,
            fontSize: 19,
            syntaxName: (ref1 = opt.syntaxName) != null ? ref1 : 'ko',
            scrollOffset: 0
        });
        this.name = 'commandlist-editor';
        this.items = [];
        this.maxLines = 17;
        this.metaQueue = [];
        this.numbers.elem.style.fontSize = '19px';
    }

    CommandList.prototype.addItems = function(items) {
        var base, i, index, item, len, ref1, ref2, ref3, ref4, results, rngs, text, viewHeight;
        this.clear();
        index = 0;
        viewHeight = this.size.lineHeight * Math.min(this.maxLines, items.length);
        this.view.style.height = viewHeight + "px";
        if (viewHeight !== this.scroll.viewHeight) {
            this.resized();
        }
        results = [];
        for (i = 0, len = items.length; i < len; i++) {
            item = items[i];
            if (item == null) {
                continue;
            }
            text = typeof (base = (ref1 = item.text) != null ? ref1 : item).trim === "function" ? base.trim() : void 0;
            if (!(text != null ? text.length : void 0)) {
                continue;
            }
            this.items.push(item);
            rngs = (ref2 = item.rngs) != null ? ref2 : [];
            if (item.clss != null) {
                rngs.push({
                    match: text,
                    start: 0,
                    clss: item.clss,
                    index: 0
                });
            }
            this.appendMeta({
                line: (ref3 = item.line) != null ? ref3 : ' ',
                text: text,
                rngs: rngs,
                type: (ref4 = item.type) != null ? ref4 : this.config.syntaxName,
                clss: 'commandlistItem',
                index: index,
                click: this.onMetaClick
            });
            results.push(index += 1);
        }
        return results;
    };

    CommandList.prototype.onMetaClick = function(meta) {
        return this.command.listClick(meta[2].index);
    };

    CommandList.prototype.appendLineDiss = function(text, diss) {
        if (diss == null) {
            diss = [];
        }
        if (diss != null ? diss.length : void 0) {
            this.syntax.setDiss(this.numLines(), diss);
        }
        return this.appendText(text);
    };

    CommandList.prototype.appendMeta = function(meta) {
        var diss, r, ref1, rngs, text;
        if (meta == null) {
            return kerror('CommandList.appendMeta -- no meta?');
        }
        this.meta.addDiv(this.meta.append(meta));
        if (meta.diss != null) {
            return this.appendLineDiss(Syntax.lineForDiss(meta.diss), meta.diss);
        } else if ((meta.text != null) && meta.text.trim().length) {
            r = (ref1 = meta.rngs) != null ? ref1 : [];
            text = meta.text.trim();
            rngs = r.concat(Syntax.rangesForTextAndSyntax(text, meta.type || 'ko'));
            matchr.sortRanges(rngs);
            diss = matchr.dissect(rngs, {
                join: true
            });
            return this.appendLineDiss(text, diss);
        }
    };

    CommandList.prototype.queueMeta = function(meta) {
        this.metaQueue.push(meta);
        clearTimeout(this.metaTimer);
        return this.metaTimer = setTimeout(this.dequeueMeta, 0);
    };

    CommandList.prototype.dequeueMeta = function() {
        var count, meta;
        count = 0;
        while (meta = this.metaQueue.shift()) {
            this.appendMeta(meta);
            count += 1;
            if (count > 20) {
                break;
            }
        }
        clearTimeout(this.metaTimer);
        if (this.metaQueue.length) {
            return this.metaTimer = setTimeout(this.dequeueMeta, 0);
        }
    };

    CommandList.prototype.clear = function() {
        this.items = [];
        this.meta.clear();
        return CommandList.__super__.clear.call(this);
    };

    return CommandList;

})(TextEditor);

module.exports = CommandList;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZGxpc3QuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vY29mZmVlL2NvbW1hbmRsaW5lIiwic291cmNlcyI6WyJjb21tYW5kbGlzdC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsMERBQUE7SUFBQTs7OztBQVFBLE1BQXFCLE9BQUEsQ0FBUSxLQUFSLENBQXJCLEVBQUUsbUJBQUYsRUFBVTs7QUFFVixVQUFBLEdBQWEsT0FBQSxDQUFRLHNCQUFSOztBQUNiLE1BQUEsR0FBYSxPQUFBLENBQVEsa0JBQVI7O0FBQ2IsSUFBQSxHQUFhLE9BQUEsQ0FBUSxlQUFSOztBQUVQOzs7SUFFQyxxQkFBQyxPQUFELEVBQVcsUUFBWCxFQUFxQixHQUFyQjtBQUVDLFlBQUE7UUFGQSxJQUFDLENBQUEsVUFBRDs7O1FBRUEsNkNBQU0sUUFBTixFQUNJO1lBQUEsUUFBQSxFQUFVLENBQUMsV0FBRCxFQUFhLFNBQWIsRUFBdUIsTUFBdkIsQ0FBVjtZQUNBLFVBQUEsRUFBWSxHQURaO1lBRUEsUUFBQSxFQUFZLEVBRlo7WUFHQSxVQUFBLDJDQUE2QixJQUg3QjtZQUlBLFlBQUEsRUFBYyxDQUpkO1NBREo7UUFPQSxJQUFDLENBQUEsSUFBRCxHQUFhO1FBQ2IsSUFBQyxDQUFBLEtBQUQsR0FBYTtRQUNiLElBQUMsQ0FBQSxRQUFELEdBQWE7UUFDYixJQUFDLENBQUEsU0FBRCxHQUFhO1FBRWIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQXBCLEdBQStCO0lBZGhDOzswQkFzQkgsUUFBQSxHQUFVLFNBQUMsS0FBRDtBQUVOLFlBQUE7UUFBQSxJQUFDLENBQUEsS0FBRCxDQUFBO1FBQ0EsS0FBQSxHQUFRO1FBRVIsVUFBQSxHQUFhLElBQUMsQ0FBQSxJQUFJLENBQUMsVUFBTixHQUFtQixJQUFJLENBQUMsR0FBTCxDQUFTLElBQUMsQ0FBQSxRQUFWLEVBQW9CLEtBQUssQ0FBQyxNQUExQjtRQUNo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QUEsV0FBWixFQUF5QixDQUF6QjtJQUpOOzswQkFNWCxXQUFBLEdBQWEsU0FBQTtBQUVULFlBQUE7UUFBQSxLQUFBLEdBQVE7QUFDUixlQUFNLElBQUEsR0FBTyxJQUFDLENBQUEsU0FBUyxDQUFDLEtBQVgsQ0FBQSxDQUFiO1lBQ0ksSUFBQyxDQUFBLFVBQUQsQ0FBWSxJQUFaO1lBQ0EsS0FBQSxJQUFTO1lBQ1QsSUFBUyxLQUFBLEdBQVEsRUFBakI7QUFBQSxzQkFBQTs7UUFISjtRQUlBLFlBQUEsQ0FBYSxJQUFDLENBQUEsU0FBZDtRQUNBLElBQTJDLElBQUMsQ0FBQSxTQUFTLENBQUMsTUFBdEQ7bUJBQUEsSUFBQyxDQUFBLFNBQUQsR0FBYSxVQUFBLENBQVcsSUFBQyxDQUFBLFdBQVosRUFBeUIsQ0FBekIsRUFBYjs7SUFSUzs7MEJBVWIsS0FBQSxHQUFPLFNBQUE7UUFFSCxJQUFDLENBQUEsS0FBRCxHQUFTO1FBQ1QsSUFBQyxDQUFBLElBQUksQ0FBQyxLQUFOLENBQUE7ZUFDQSxxQ0FBQTtJQUpHOzs7O0dBbkhlOztBQXlIMUIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbiAwMDAwMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAgICAwMDBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMDAwMDAgICAgICAwMDBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDBcbiAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgIDAwMDAwMDAgICAgICAwMDBcbiMjI1xuXG57IG1hdGNociwga2Vycm9yIH0gPSByZXF1aXJlICdreGsnXG5cblRleHRFZGl0b3IgPSByZXF1aXJlICcuLi9lZGl0b3IvdGV4dGVkaXRvcidcblN5bnRheCAgICAgPSByZXF1aXJlICcuLi9lZGl0b3Ivc3ludGF4J1xuc2FsdCAgICAgICA9IHJlcXVpcmUgJy4uL3Rvb2xzL3NhbHQnXG5cbmNsYXNzIENvbW1hbmRMaXN0IGV4dGVuZHMgVGV4dEVkaXRvclxuXG4gICAgQDogKEBjb21tYW5kLCB2aWV3RWxlbSwgb3B0KSAtPlxuXG4gICAgICAgIHN1cGVyIHZpZXdFbGVtLFxuICAgICAgICAgICAgZmVhdHVyZXM6IFsnU2Nyb2xsYmFyJyAnTnVtYmVycycgJ01ldGEnXVxuICAgICAgICAgICAgbGluZUhlaWdodDogMS40XG4gICAgICAgICAgICBmb250U2l6ZTogICAxOVxuICAgICAgICAgICAgc3ludGF4TmFtZTogb3B0LnN5bnRheE5hbWUgPyAna28nXG4gICAgICAgICAgICBzY3JvbGxPZmZzZXQ6IDBcblxuICAgICAgICBAbmFtZSAgICAgID0gJ2NvbW1hbmRsaXN0LWVkaXRvcidcbiAgICAgICAgQGl0ZW1zICAgICA9IFtdXG4gICAgICAgIEBtYXhMaW5lcyAgPSAxN1xuICAgICAgICBAbWV0YVF1ZXVlID0gW11cblxuICAgICAgICBAbnVtYmVycy5lbGVtLnN0eWxlLmZvbnRTaXplID0gJzE5cHgnXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwIDAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDBcblxuICAgIGFkZEl0ZW1zOiAoaXRlbXMpIC0+XG5cbiAgICAgICAgQGNsZWFyKClcbiAgICAgICAgaW5kZXggPSAwXG4gICAgICAgIFxuICAgICAgICB2aWV3SGVpZ2h0ID0gQHNpemUubGluZUhlaWdodCAqIE1hdGgubWluIEBtYXhMaW5lcywgaXRlbXMubGVuZ3RoXG4gICAgICAgIEB2aWV3LnN0eWxlLmhlaWdodCA9IFwiI3t2aWV3SGVpZ2h0fXB4XCJcbiAgICAgICAgaWYgdmlld0hlaWdodCAhPSBAc2Nyb2xsLnZpZXdIZWlnaHRcbiAgICAgICAgICAgIEByZXNpemVkKClcblxuICAgICAgICBmb3IgaXRlbSBpbiBpdGVtc1xuICAgICAgICAgICAgY29udGludWUgaWYgbm90IGl0ZW0/XG4gICAgICAgICAgICB0ZXh0ID0gKGl0ZW0udGV4dCA/IGl0ZW0pLnRyaW0/KClcbiAgICAgICAgICAgIGNvbnRpbnVlIGlmIG5vdCB0ZXh0Py5sZW5ndGhcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgQGl0ZW1zLnB1c2ggaXRlbVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBybmdzID0gaXRlbS5ybmdzID8gW11cblxuICAgICAgICAgICAgaWYgaXRlbS5jbHNzP1xuICAgICAgICAgICAgICAgIHJuZ3MucHVzaFxuICAgICAgICAgICAgICAgICAgICBtYXRjaDogdGV4dFxuICAgICAgICAgICAgICAgICAgICBzdGFydDogMFxuICAgICAgICAgICAgICAgICAgICBjbHNzOiAgaXRlbS5jbHNzXG4gICAgICAgICAgICAgICAgICAgIGluZGV4OiAwXG5cbiAgICAgICAgICAgIEBhcHBlbmRNZXRhXG4gICAgICAgICAgICAgICAgbGluZTogaXRlbS5saW5lID8gJyAnXG4gICAgICAgICAgICAgICAgdGV4dDogdGV4dFxuICAgICAgICAgICAgICAgIHJuZ3M6IHJuZ3NcbiAgICAgICAgICAgICAgICB0eXBlOiBpdGVtLnR5cGUgPyBAY29uZmlnLnN5bnRheE5hbWVcbiAgICAgICAgICAgICAgICBjbHNzOiAnY29tbWFuZGxpc3RJdGVtJ1xuICAgICAgICAgICAgICAgIGluZGV4OiBpbmRleFxuICAgICAgICAgICAgICAgIGNsaWNrOiBAb25NZXRhQ2xpY2tcblxuICAgICAgICAgICAgaW5kZXggKz0gMSAgICAgICAgICAgIFxuXG4gICAgb25NZXRhQ2xpY2s6IChtZXRhKSA9PlxuXG4gICAgICAgIEBjb21tYW5kLmxpc3RDbGljayBtZXRhWzJdLmluZGV4XG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDBcblxuICAgIGFwcGVuZExpbmVEaXNzOiAodGV4dCwgZGlzcz1bXSkgLT5cblxuICAgICAgICBAc3ludGF4LnNldERpc3MgQG51bUxpbmVzKCksIGRpc3MgaWYgZGlzcz8ubGVuZ3RoXG4gICAgICAgIEBhcHBlbmRUZXh0IHRleHRcblxuICAgICMgMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDBcbiAgICBcbiAgICBhcHBlbmRNZXRhOiAobWV0YSkgLT5cblxuICAgICAgICBpZiBub3QgbWV0YT9cbiAgICAgICAgICAgIHJldHVybiBrZXJyb3IgJ0NvbW1hbmRMaXN0LmFwcGVuZE1ldGEgLS0gbm8gbWV0YT8nXG4gICAgICAgICAgICBcbiAgICAgICAgQG1ldGEuYWRkRGl2IEBtZXRhLmFwcGVuZCBtZXRhXG5cbiAgICAgICAgaWYgbWV0YS5kaXNzP1xuICAgICAgICAgICAgQGFwcGVuZExpbmVEaXNzIFN5bnRheC5saW5lRm9yRGlzcyhtZXRhLmRpc3MpLCBtZXRhLmRpc3NcbiAgICAgICAgZWxzZSBpZiBtZXRhLnRleHQ/IGFuZCBtZXRhLnRleHQudHJpbSgpLmxlbmd0aFxuICAgICAgICAgICAgciAgICA9IG1ldGEucm5ncyA/IFtdXG4gICAgICAgICAgICB0ZXh0ID0gbWV0YS50ZXh0LnRyaW0oKVxuICAgICAgICAgICAgcm5ncyA9IHIuY29uY2F0IFN5bnRheC5yYW5nZXNGb3JUZXh0QW5kU3ludGF4IHRleHQsIG1ldGEudHlwZSBvciAna28nXG4gICAgICAgICAgICBtYXRjaHIuc29ydFJhbmdlcyBybmdzXG4gICAgICAgICAgICBkaXNzID0gbWF0Y2hyLmRpc3NlY3Qgcm5ncywgam9pbjp0cnVlXG4gICAgICAgICAgICBAYXBwZW5kTGluZURpc3MgdGV4dCwgZGlzcyAgICAgICAgICAgIFxuXG4gICAgcXVldWVNZXRhOiAobWV0YSkgLT5cblxuICAgICAgICBAbWV0YVF1ZXVlLnB1c2ggbWV0YVxuICAgICAgICBjbGVhclRpbWVvdXQgQG1ldGFUaW1lclxuICAgICAgICBAbWV0YVRpbWVyID0gc2V0VGltZW91dCBAZGVxdWV1ZU1ldGEsIDBcblxuICAgIGRlcXVldWVNZXRhOiA9PlxuXG4gICAgICAgIGNvdW50ID0gMFxuICAgICAgICB3aGlsZSBtZXRhID0gQG1ldGFRdWV1ZS5zaGlmdCgpXG4gICAgICAgICAgICBAYXBwZW5kTWV0YSBtZXRhXG4gICAgICAgICAgICBjb3VudCArPSAxXG4gICAgICAgICAgICBicmVhayBpZiBjb3VudCA+IDIwXG4gICAgICAgIGNsZWFyVGltZW91dCBAbWV0YVRpbWVyXG4gICAgICAgIEBtZXRhVGltZXIgPSBzZXRUaW1lb3V0IEBkZXF1ZXVlTWV0YSwgMCBpZiBAbWV0YVF1ZXVlLmxlbmd0aFxuXG4gICAgY2xlYXI6IC0+XG4gICAgICAgIFxuICAgICAgICBAaXRlbXMgPSBbXVxuICAgICAgICBAbWV0YS5jbGVhcigpXG4gICAgICAgIHN1cGVyKClcblxubW9kdWxlLmV4cG9ydHMgPSBDb21tYW5kTGlzdFxuIl19
//# sourceURL=../../coffee/commandline/commandlist.coffee