// koffee 1.4.0

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZGxpc3QuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLHFEQUFBO0lBQUE7Ozs7QUFRRSxTQUFXLE9BQUEsQ0FBUSxLQUFSOztBQUViLFVBQUEsR0FBYSxPQUFBLENBQVEsc0JBQVI7O0FBQ2IsTUFBQSxHQUFhLE9BQUEsQ0FBUSxrQkFBUjs7QUFDYixNQUFBLEdBQWEsT0FBQSxDQUFRLGlCQUFSOztBQUNiLElBQUEsR0FBYSxPQUFBLENBQVEsZUFBUjs7QUFFUDs7O0lBRUMscUJBQUMsT0FBRCxFQUFXLFFBQVgsRUFBcUIsR0FBckI7QUFFQyxZQUFBO1FBRkEsSUFBQyxDQUFBLFVBQUQ7OztRQUVBLDZDQUFNLFFBQU4sRUFDSTtZQUFBLFFBQUEsRUFBVSxDQUFDLFdBQUQsRUFBYyxTQUFkLEVBQXlCLE1BQXpCLENBQVY7WUFDQSxVQUFBLEVBQVksR0FEWjtZQUVBLFFBQUEsRUFBWSxFQUZaO1lBR0EsVUFBQSx5Q0FBNkIsSUFIN0I7WUFJQSxZQUFBLEVBQWMsQ0FKZDtTQURKO1FBT0EsSUFBQyxDQUFBLElBQUQsR0FBYTtRQUNiLElBQUMsQ0FBQSxLQUFELEdBQWE7UUFDYixJQUFDLENBQUEsUUFBRCxHQUFhO1FBQ2IsSUFBQyxDQUFBLFNBQUQsR0FBYTtRQUViLElBQUMsQ0FBQSxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFwQixHQUErQjtJQWRoQzs7MEJBc0JILFFBQUEsR0FBVSxTQUFDLEtBQUQ7QUFFTixZQUFBO1FBQUEsSUFBQyxDQUFBLEtBQUQsQ0FBQTtRQUNBLEtBQUEsR0FBUTtRQUVSLFVBQUEsR0FBYSxJQUFDLENBQUEsSUFBSSxDQUFDLFVBQU4sR0FBbUIsSUFBSSxDQUFDLEdBQUwsQ0FBUyxJQUFDLENBQUEsUUFBVixFQUFvQixLQUFLLENBQUMsTUFBMUI7UUFDaEMsSUFBQyxDQUFBLElBQUksQ0FBQyxLQUFLLENBQUMs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V0FBQSxHQUFhLFNBQUE7QUFFVCxZQUFBO1FBQUEsS0FBQSxHQUFRO0FBQ1IsZUFBTSxJQUFBLEdBQU8sSUFBQyxDQUFBLFNBQVMsQ0FBQyxLQUFYLENBQUEsQ0FBYjtZQUNJLElBQUMsQ0FBQSxVQUFELENBQVksSUFBWjtZQUNBLEtBQUEsSUFBUztZQUNULElBQVMsS0FBQSxHQUFRLEVBQWpCO0FBQUEsc0JBQUE7O1FBSEo7UUFJQSxZQUFBLENBQWEsSUFBQyxDQUFBLFNBQWQ7UUFDQSxJQUEyQyxJQUFDLENBQUEsU0FBUyxDQUFDLE1BQXREO21CQUFBLElBQUMsQ0FBQSxTQUFELEdBQWEsVUFBQSxDQUFXLElBQUMsQ0FBQSxXQUFaLEVBQXlCLENBQXpCLEVBQWI7O0lBUlM7OzBCQVViLEtBQUEsR0FBTyxTQUFBO1FBRUgsSUFBQyxDQUFBLEtBQUQsR0FBUztRQUNULElBQUMsQ0FBQSxJQUFJLENBQUMsS0FBTixDQUFBO2VBQ0EscUNBQUE7SUFKRzs7OztHQW5IZTs7QUF5SDFCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAwMDAgICAgICAgICAgMDAwXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAwMDAwMDAwICAgICAgMDAwXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwXG4gMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAwMDAwMDAwICAgICAgMDAwXG4jIyNcblxueyBrZXJyb3IgfSA9IHJlcXVpcmUgJ2t4aycgXG5cblRleHRFZGl0b3IgPSByZXF1aXJlICcuLi9lZGl0b3IvdGV4dGVkaXRvcidcblN5bnRheCAgICAgPSByZXF1aXJlICcuLi9lZGl0b3Ivc3ludGF4J1xubWF0Y2hyICAgICA9IHJlcXVpcmUgJy4uL3Rvb2xzL21hdGNocidcbnNhbHQgICAgICAgPSByZXF1aXJlICcuLi90b29scy9zYWx0J1xuXG5jbGFzcyBDb21tYW5kTGlzdCBleHRlbmRzIFRleHRFZGl0b3JcblxuICAgIEA6IChAY29tbWFuZCwgdmlld0VsZW0sIG9wdCkgLT5cblxuICAgICAgICBzdXBlciB2aWV3RWxlbSxcbiAgICAgICAgICAgIGZlYXR1cmVzOiBbJ1Njcm9sbGJhcicsICdOdW1iZXJzJywgJ01ldGEnXVxuICAgICAgICAgICAgbGluZUhlaWdodDogMS40XG4gICAgICAgICAgICBmb250U2l6ZTogICAxOVxuICAgICAgICAgICAgc3ludGF4TmFtZTogb3B0LnN5bnRheE5hbWUgPyAna28nXG4gICAgICAgICAgICBzY3JvbGxPZmZzZXQ6IDBcblxuICAgICAgICBAbmFtZSAgICAgID0gJ2NvbW1hbmRsaXN0LWVkaXRvcidcbiAgICAgICAgQGl0ZW1zICAgICA9IFtdXG4gICAgICAgIEBtYXhMaW5lcyAgPSAxN1xuICAgICAgICBAbWV0YVF1ZXVlID0gW11cblxuICAgICAgICBAbnVtYmVycy5lbGVtLnN0eWxlLmZvbnRTaXplID0gXCIxOXB4XCJcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgMCAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuXG4gICAgYWRkSXRlbXM6IChpdGVtcykgLT5cblxuICAgICAgICBAY2xlYXIoKVxuICAgICAgICBpbmRleCA9IDBcbiAgICAgICAgXG4gICAgICAgIHZpZXdIZWlnaHQgPSBAc2l6ZS5saW5lSGVpZ2h0ICogTWF0aC5taW4gQG1heExpbmVzLCBpdGVtcy5sZW5ndGhcbiAgICAgICAgQHZpZXcuc3R5bGUuaGVpZ2h0ID0gXCIje3ZpZXdIZWlnaHR9cHhcIlxuICAgICAgICBpZiB2aWV3SGVpZ2h0ICE9IEBzY3JvbGwudmlld0hlaWdodFxuICAgICAgICAgICAgQHJlc2l6ZWQoKVxuXG4gICAgICAgIGZvciBpdGVtIGluIGl0ZW1zXG4gICAgICAgICAgICBjb250aW51ZSBpZiBub3QgaXRlbT9cbiAgICAgICAgICAgIHRleHQgPSAoaXRlbS50ZXh0ID8gaXRlbSkudHJpbT8oKVxuICAgICAgICAgICAgY29udGludWUgaWYgbm90IHRleHQ/Lmxlbmd0aFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBAaXRlbXMucHVzaCBpdGVtXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJuZ3MgPSBpdGVtLnJuZ3MgPyBbXVxuXG4gICAgICAgICAgICBpZiBpdGVtLmNsc3M/XG4gICAgICAgICAgICAgICAgcm5ncy5wdXNoXG4gICAgICAgICAgICAgICAgICAgIG1hdGNoOiB0ZXh0XG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0OiAwXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpdGVtLmNsc3NcbiAgICAgICAgICAgICAgICAgICAgaW5kZXg6IDBcblxuICAgICAgICAgICAgQGFwcGVuZE1ldGFcbiAgICAgICAgICAgICAgICBsaW5lOiBpdGVtLmxpbmUgPyAnICdcbiAgICAgICAgICAgICAgICB0ZXh0OiB0ZXh0XG4gICAgICAgICAgICAgICAgcm5nczogcm5nc1xuICAgICAgICAgICAgICAgIHR5cGU6IGl0ZW0udHlwZSA/IEBjb25maWcuc3ludGF4TmFtZVxuICAgICAgICAgICAgICAgIGNsc3M6ICdjb21tYW5kbGlzdEl0ZW0nXG4gICAgICAgICAgICAgICAgaW5kZXg6IGluZGV4XG4gICAgICAgICAgICAgICAgY2xpY2s6IEBvbk1ldGFDbGlja1xuXG4gICAgICAgICAgICBpbmRleCArPSAxICAgICAgICAgICAgXG5cbiAgICBvbk1ldGFDbGljazogKG1ldGEpID0+XG5cbiAgICAgICAgQGNvbW1hbmQubGlzdENsaWNrIG1ldGFbMl0uaW5kZXhcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwIDAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgIDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuXG4gICAgYXBwZW5kTGluZURpc3M6ICh0ZXh0LCBkaXNzPVtdKSAtPlxuXG4gICAgICAgIEBzeW50YXguc2V0RGlzcyBAbnVtTGluZXMoKSwgZGlzcyBpZiBkaXNzPy5sZW5ndGhcbiAgICAgICAgQGFwcGVuZFRleHQgdGV4dFxuXG4gICAgIyAwMCAgICAgMDAgIDAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMFxuICAgIFxuICAgIGFwcGVuZE1ldGE6IChtZXRhKSAtPlxuXG4gICAgICAgIGlmIG5vdCBtZXRhP1xuICAgICAgICAgICAgcmV0dXJuIGtlcnJvciAnQ29tbWFuZExpc3QuYXBwZW5kTWV0YSAtLSBubyBtZXRhPydcbiAgICAgICAgICAgIFxuICAgICAgICBAbWV0YS5hZGREaXYgQG1ldGEuYXBwZW5kIG1ldGFcblxuICAgICAgICBpZiBtZXRhLmRpc3M/XG4gICAgICAgICAgICBAYXBwZW5kTGluZURpc3MgU3ludGF4LmxpbmVGb3JEaXNzKG1ldGEuZGlzcyksIG1ldGEuZGlzc1xuICAgICAgICBlbHNlIGlmIG1ldGEudGV4dD8gYW5kIG1ldGEudGV4dC50cmltKCkubGVuZ3RoXG4gICAgICAgICAgICByICAgID0gbWV0YS5ybmdzID8gW11cbiAgICAgICAgICAgIHRleHQgPSBtZXRhLnRleHQudHJpbSgpXG4gICAgICAgICAgICBybmdzID0gci5jb25jYXQgU3ludGF4LnJhbmdlc0ZvclRleHRBbmRTeW50YXggdGV4dCwgbWV0YS50eXBlIG9yICdrbydcbiAgICAgICAgICAgIG1hdGNoci5zb3J0UmFuZ2VzIHJuZ3NcbiAgICAgICAgICAgIGRpc3MgPSBtYXRjaHIuZGlzc2VjdCBybmdzLCBqb2luOnRydWVcbiAgICAgICAgICAgIEBhcHBlbmRMaW5lRGlzcyB0ZXh0LCBkaXNzICAgICAgICAgICAgXG5cbiAgICBxdWV1ZU1ldGE6IChtZXRhKSAtPlxuXG4gICAgICAgIEBtZXRhUXVldWUucHVzaCBtZXRhXG4gICAgICAgIGNsZWFyVGltZW91dCBAbWV0YVRpbWVyXG4gICAgICAgIEBtZXRhVGltZXIgPSBzZXRUaW1lb3V0IEBkZXF1ZXVlTWV0YSwgMFxuXG4gICAgZGVxdWV1ZU1ldGE6ID0+XG5cbiAgICAgICAgY291bnQgPSAwXG4gICAgICAgIHdoaWxlIG1ldGEgPSBAbWV0YVF1ZXVlLnNoaWZ0KClcbiAgICAgICAgICAgIEBhcHBlbmRNZXRhIG1ldGFcbiAgICAgICAgICAgIGNvdW50ICs9IDFcbiAgICAgICAgICAgIGJyZWFrIGlmIGNvdW50ID4gMjBcbiAgICAgICAgY2xlYXJUaW1lb3V0IEBtZXRhVGltZXJcbiAgICAgICAgQG1ldGFUaW1lciA9IHNldFRpbWVvdXQgQGRlcXVldWVNZXRhLCAwIGlmIEBtZXRhUXVldWUubGVuZ3RoXG5cbiAgICBjbGVhcjogLT5cbiAgICAgICAgXG4gICAgICAgIEBpdGVtcyA9IFtdXG4gICAgICAgIEBtZXRhLmNsZWFyKClcbiAgICAgICAgc3VwZXIoKVxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbW1hbmRMaXN0XG4iXX0=
//# sourceURL=../../coffee/commandline/commandlist.coffee