// koffee 0.56.0

/*
 0000000   0000000   00     00  00     00   0000000   000   000  0000000    000      000   0000000  000000000
000       000   000  000   000  000   000  000   000  0000  000  000   000  000      000  000          000
000       000   000  000000000  000000000  000000000  000 0 000  000   000  000      000  0000000      000
000       000   000  000 0 000  000 0 000  000   000  000  0000  000   000  000      000       000     000
 0000000   0000000   000   000  000   000  000   000  000   000  0000000    0000000  000  0000000      000
 */
var CommandList, Syntax, TextEditor, kerror, matchr, salt,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

kerror = require('kxk').kerror;

TextEditor = require('../editor/texteditor');

Syntax = require('../editor/syntax');

matchr = require('../tools/matchr');

salt = require('../tools/salt');

CommandList = (function(superClass) {
    extend(CommandList, superClass);

    function CommandList(command, viewElem, opt) {
        var ref;
        this.command = command;
        this.dequeueMeta = bind(this.dequeueMeta, this);
        this.onMetaClick = bind(this.onMetaClick, this);
        CommandList.__super__.constructor.call(this, viewElem, {
            features: ['Scrollbar', 'Numbers', 'Meta'],
            lineHeight: 1.4,
            fontSize: 19,
            syntaxName: (ref = opt.syntaxName) != null ? ref : 'ko',
            scrollOffset: 0
        });
        this.name = 'commandlist-editor';
        this.items = [];
        this.maxLines = 17;
        this.metaQueue = [];
        this.numbers.elem.style.fontSize = "19px";
    }

    CommandList.prototype.addItems = function(items) {
        var base, i, index, item, len, ref, ref1, ref2, ref3, results, rngs, text, viewHeight;
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
            text = typeof (base = (ref = item.text) != null ? ref : item).trim === "function" ? base.trim() : void 0;
            if (!(text != null ? text.length : void 0)) {
                continue;
            }
            this.items.push(item);
            rngs = (ref1 = item.rngs) != null ? ref1 : [];
            if (item.clss != null) {
                rngs.push({
                    match: text,
                    start: 0,
                    value: item.clss,
                    index: 0
                });
            }
            this.appendMeta({
                line: (ref2 = item.line) != null ? ref2 : ' ',
                text: text,
                rngs: rngs,
                type: (ref3 = item.type) != null ? ref3 : this.config.syntaxName,
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
        var diss, r, ref, rngs, text;
        if (meta == null) {
            return kerror('CommandList.appendMeta -- no meta?');
        }
        this.meta.addDiv(this.meta.append(meta));
        if (meta.diss != null) {
            return this.appendLineDiss(Syntax.lineForDiss(meta.diss), meta.diss);
        } else if ((meta.text != null) && meta.text.trim().length) {
            r = (ref = meta.rngs) != null ? ref : [];
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZGxpc3QuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLHFEQUFBO0lBQUE7Ozs7QUFRRSxTQUFXLE9BQUEsQ0FBUSxLQUFSOztBQUViLFVBQUEsR0FBYSxPQUFBLENBQVEsc0JBQVI7O0FBQ2IsTUFBQSxHQUFhLE9BQUEsQ0FBUSxrQkFBUjs7QUFDYixNQUFBLEdBQWEsT0FBQSxDQUFRLGlCQUFSOztBQUNiLElBQUEsR0FBYSxPQUFBLENBQVEsZUFBUjs7QUFFUDs7O0lBRVcscUJBQUMsT0FBRCxFQUFXLFFBQVgsRUFBcUIsR0FBckI7QUFFVCxZQUFBO1FBRlUsSUFBQyxDQUFBLFVBQUQ7OztRQUVWLDZDQUFNLFFBQU4sRUFDSTtZQUFBLFFBQUEsRUFBVSxDQUFDLFdBQUQsRUFBYyxTQUFkLEVBQXlCLE1BQXpCLENBQVY7WUFDQSxVQUFBLEVBQVksR0FEWjtZQUVBLFFBQUEsRUFBWSxFQUZaO1lBR0EsVUFBQSx5Q0FBNkIsSUFIN0I7WUFJQSxZQUFBLEVBQWMsQ0FKZDtTQURKO1FBT0EsSUFBQyxDQUFBLElBQUQsR0FBYTtRQUNiLElBQUMsQ0FBQSxLQUFELEdBQWE7UUFDYixJQUFDLENBQUEsUUFBRCxHQUFhO1FBQ2IsSUFBQyxDQUFBLFNBQUQsR0FBYTtRQUViLElBQUMsQ0FBQSxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFwQixHQUErQjtJQWR0Qjs7MEJBc0JiLFFBQUEsR0FBVSxTQUFDLEtBQUQ7QUFFTixZQUFBO1FBQUEsSUFBQyxDQUFBLEtBQUQsQ0FBQTtRQUNBLEtBQUEsR0FBUTtRQUVSLFVBQUEsR0FBYSxJQUFDLENBQUEsSUFBSSxDQUFDLFVBQU4sR0FBbUIsSUFBSSxDQUFDLEdBQUwsQ0FBUyxJQUFDLENBQUEsUUFBVixFQUFvQixLQUFLLENBQUMsTUFBMUI7UUFDaEMsSUFBQyxDQUFBLElBQUksQ0FBQyxLQUFLLENBQUMs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V0FBQSxHQUFhLFNBQUE7QUFFVCxZQUFBO1FBQUEsS0FBQSxHQUFRO0FBQ1IsZUFBTSxJQUFBLEdBQU8sSUFBQyxDQUFBLFNBQVMsQ0FBQyxLQUFYLENBQUEsQ0FBYjtZQUNJLElBQUMsQ0FBQSxVQUFELENBQVksSUFBWjtZQUNBLEtBQUEsSUFBUztZQUNULElBQVMsS0FBQSxHQUFRLEVBQWpCO0FBQUEsc0JBQUE7O1FBSEo7UUFJQSxZQUFBLENBQWEsSUFBQyxDQUFBLFNBQWQ7UUFDQSxJQUEyQyxJQUFDLENBQUEsU0FBUyxDQUFDLE1BQXREO21CQUFBLElBQUMsQ0FBQSxTQUFELEdBQWEsVUFBQSxDQUFXLElBQUMsQ0FBQSxXQUFaLEVBQXlCLENBQXpCLEVBQWI7O0lBUlM7OzBCQVViLEtBQUEsR0FBTyxTQUFBO1FBRUgsSUFBQyxDQUFBLEtBQUQsR0FBUztRQUNULElBQUMsQ0FBQSxJQUFJLENBQUMsS0FBTixDQUFBO2VBQ0EscUNBQUE7SUFKRzs7OztHQW5IZTs7QUF5SDFCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAwMDAgICAgICAgICAgMDAwXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAwMDAwMDAwICAgICAgMDAwXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwXG4gMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAwMDAwMDAwICAgICAgMDAwXG4jIyNcblxueyBrZXJyb3IgfSA9IHJlcXVpcmUgJ2t4aycgXG5cblRleHRFZGl0b3IgPSByZXF1aXJlICcuLi9lZGl0b3IvdGV4dGVkaXRvcidcblN5bnRheCAgICAgPSByZXF1aXJlICcuLi9lZGl0b3Ivc3ludGF4J1xubWF0Y2hyICAgICA9IHJlcXVpcmUgJy4uL3Rvb2xzL21hdGNocidcbnNhbHQgICAgICAgPSByZXF1aXJlICcuLi90b29scy9zYWx0J1xuXG5jbGFzcyBDb21tYW5kTGlzdCBleHRlbmRzIFRleHRFZGl0b3JcblxuICAgIGNvbnN0cnVjdG9yOiAoQGNvbW1hbmQsIHZpZXdFbGVtLCBvcHQpIC0+XG5cbiAgICAgICAgc3VwZXIgdmlld0VsZW0sXG4gICAgICAgICAgICBmZWF0dXJlczogWydTY3JvbGxiYXInLCAnTnVtYmVycycsICdNZXRhJ11cbiAgICAgICAgICAgIGxpbmVIZWlnaHQ6IDEuNFxuICAgICAgICAgICAgZm9udFNpemU6ICAgMTlcbiAgICAgICAgICAgIHN5bnRheE5hbWU6IG9wdC5zeW50YXhOYW1lID8gJ2tvJ1xuICAgICAgICAgICAgc2Nyb2xsT2Zmc2V0OiAwXG5cbiAgICAgICAgQG5hbWUgICAgICA9ICdjb21tYW5kbGlzdC1lZGl0b3InXG4gICAgICAgIEBpdGVtcyAgICAgPSBbXVxuICAgICAgICBAbWF4TGluZXMgID0gMTdcbiAgICAgICAgQG1ldGFRdWV1ZSA9IFtdXG5cbiAgICAgICAgQG51bWJlcnMuZWxlbS5zdHlsZS5mb250U2l6ZSA9IFwiMTlweFwiXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwIDAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDBcblxuICAgIGFkZEl0ZW1zOiAoaXRlbXMpIC0+XG5cbiAgICAgICAgQGNsZWFyKClcbiAgICAgICAgaW5kZXggPSAwXG4gICAgICAgIFxuICAgICAgICB2aWV3SGVpZ2h0ID0gQHNpemUubGluZUhlaWdodCAqIE1hdGgubWluIEBtYXhMaW5lcywgaXRlbXMubGVuZ3RoXG4gICAgICAgIEB2aWV3LnN0eWxlLmhlaWdodCA9IFwiI3t2aWV3SGVpZ2h0fXB4XCJcbiAgICAgICAgaWYgdmlld0hlaWdodCAhPSBAc2Nyb2xsLnZpZXdIZWlnaHRcbiAgICAgICAgICAgIEByZXNpemVkKClcblxuICAgICAgICBmb3IgaXRlbSBpbiBpdGVtc1xuICAgICAgICAgICAgY29udGludWUgaWYgbm90IGl0ZW0/XG4gICAgICAgICAgICB0ZXh0ID0gKGl0ZW0udGV4dCA/IGl0ZW0pLnRyaW0/KClcbiAgICAgICAgICAgIGNvbnRpbnVlIGlmIG5vdCB0ZXh0Py5sZW5ndGhcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgQGl0ZW1zLnB1c2ggaXRlbVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBybmdzID0gaXRlbS5ybmdzID8gW11cblxuICAgICAgICAgICAgaWYgaXRlbS5jbHNzP1xuICAgICAgICAgICAgICAgIHJuZ3MucHVzaFxuICAgICAgICAgICAgICAgICAgICBtYXRjaDogdGV4dFxuICAgICAgICAgICAgICAgICAgICBzdGFydDogMFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaXRlbS5jbHNzXG4gICAgICAgICAgICAgICAgICAgIGluZGV4OiAwXG5cbiAgICAgICAgICAgIEBhcHBlbmRNZXRhXG4gICAgICAgICAgICAgICAgbGluZTogaXRlbS5saW5lID8gJyAnXG4gICAgICAgICAgICAgICAgdGV4dDogdGV4dFxuICAgICAgICAgICAgICAgIHJuZ3M6IHJuZ3NcbiAgICAgICAgICAgICAgICB0eXBlOiBpdGVtLnR5cGUgPyBAY29uZmlnLnN5bnRheE5hbWVcbiAgICAgICAgICAgICAgICBjbHNzOiAnY29tbWFuZGxpc3RJdGVtJ1xuICAgICAgICAgICAgICAgIGluZGV4OiBpbmRleFxuICAgICAgICAgICAgICAgIGNsaWNrOiBAb25NZXRhQ2xpY2tcblxuICAgICAgICAgICAgaW5kZXggKz0gMSAgICAgICAgICAgIFxuXG4gICAgb25NZXRhQ2xpY2s6IChtZXRhKSA9PlxuXG4gICAgICAgIEBjb21tYW5kLmxpc3RDbGljayBtZXRhWzJdLmluZGV4XG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDBcblxuICAgIGFwcGVuZExpbmVEaXNzOiAodGV4dCwgZGlzcz1bXSkgLT5cblxuICAgICAgICBAc3ludGF4LnNldERpc3MgQG51bUxpbmVzKCksIGRpc3MgaWYgZGlzcz8ubGVuZ3RoXG4gICAgICAgIEBhcHBlbmRUZXh0IHRleHRcblxuICAgICMgMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDBcbiAgICBcbiAgICBhcHBlbmRNZXRhOiAobWV0YSkgLT5cblxuICAgICAgICBpZiBub3QgbWV0YT9cbiAgICAgICAgICAgIHJldHVybiBrZXJyb3IgJ0NvbW1hbmRMaXN0LmFwcGVuZE1ldGEgLS0gbm8gbWV0YT8nXG4gICAgICAgICAgICBcbiAgICAgICAgQG1ldGEuYWRkRGl2IEBtZXRhLmFwcGVuZCBtZXRhXG5cbiAgICAgICAgaWYgbWV0YS5kaXNzP1xuICAgICAgICAgICAgQGFwcGVuZExpbmVEaXNzIFN5bnRheC5saW5lRm9yRGlzcyhtZXRhLmRpc3MpLCBtZXRhLmRpc3NcbiAgICAgICAgZWxzZSBpZiBtZXRhLnRleHQ/IGFuZCBtZXRhLnRleHQudHJpbSgpLmxlbmd0aFxuICAgICAgICAgICAgciAgICA9IG1ldGEucm5ncyA/IFtdXG4gICAgICAgICAgICB0ZXh0ID0gbWV0YS50ZXh0LnRyaW0oKVxuICAgICAgICAgICAgcm5ncyA9IHIuY29uY2F0IFN5bnRheC5yYW5nZXNGb3JUZXh0QW5kU3ludGF4IHRleHQsIG1ldGEudHlwZSBvciAna28nXG4gICAgICAgICAgICBtYXRjaHIuc29ydFJhbmdlcyBybmdzXG4gICAgICAgICAgICBkaXNzID0gbWF0Y2hyLmRpc3NlY3Qgcm5ncywgam9pbjp0cnVlXG4gICAgICAgICAgICBAYXBwZW5kTGluZURpc3MgdGV4dCwgZGlzcyAgICAgICAgICAgIFxuXG4gICAgcXVldWVNZXRhOiAobWV0YSkgLT5cblxuICAgICAgICBAbWV0YVF1ZXVlLnB1c2ggbWV0YVxuICAgICAgICBjbGVhclRpbWVvdXQgQG1ldGFUaW1lclxuICAgICAgICBAbWV0YVRpbWVyID0gc2V0VGltZW91dCBAZGVxdWV1ZU1ldGEsIDBcblxuICAgIGRlcXVldWVNZXRhOiA9PlxuXG4gICAgICAgIGNvdW50ID0gMFxuICAgICAgICB3aGlsZSBtZXRhID0gQG1ldGFRdWV1ZS5zaGlmdCgpXG4gICAgICAgICAgICBAYXBwZW5kTWV0YSBtZXRhXG4gICAgICAgICAgICBjb3VudCArPSAxXG4gICAgICAgICAgICBicmVhayBpZiBjb3VudCA+IDIwXG4gICAgICAgIGNsZWFyVGltZW91dCBAbWV0YVRpbWVyXG4gICAgICAgIEBtZXRhVGltZXIgPSBzZXRUaW1lb3V0IEBkZXF1ZXVlTWV0YSwgMCBpZiBAbWV0YVF1ZXVlLmxlbmd0aFxuXG4gICAgY2xlYXI6IC0+XG4gICAgICAgIFxuICAgICAgICBAaXRlbXMgPSBbXVxuICAgICAgICBAbWV0YS5jbGVhcigpXG4gICAgICAgIHN1cGVyKClcblxubW9kdWxlLmV4cG9ydHMgPSBDb21tYW5kTGlzdFxuIl19
//# sourceURL=../../coffee/commandline/commandlist.coffee