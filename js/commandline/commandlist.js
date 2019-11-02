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
        this.numbers.elem.style.fontSize = '19px';
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZGxpc3QuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLHFEQUFBO0lBQUE7Ozs7QUFRRSxTQUFXLE9BQUEsQ0FBUSxLQUFSOztBQUViLFVBQUEsR0FBYSxPQUFBLENBQVEsc0JBQVI7O0FBQ2IsTUFBQSxHQUFhLE9BQUEsQ0FBUSxrQkFBUjs7QUFDYixNQUFBLEdBQWEsT0FBQSxDQUFRLGlCQUFSOztBQUNiLElBQUEsR0FBYSxPQUFBLENBQVEsZUFBUjs7QUFFUDs7O0lBRUMscUJBQUMsT0FBRCxFQUFXLFFBQVgsRUFBcUIsR0FBckI7QUFFQyxZQUFBO1FBRkEsSUFBQyxDQUFBLFVBQUQ7OztRQUVBLDZDQUFNLFFBQU4sRUFDSTtZQUFBLFFBQUEsRUFBVSxDQUFDLFdBQUQsRUFBYSxTQUFiLEVBQXVCLE1BQXZCLENBQVY7WUFDQSxVQUFBLEVBQVksR0FEWjtZQUVBLFFBQUEsRUFBWSxFQUZaO1lBR0EsVUFBQSx5Q0FBNkIsSUFIN0I7WUFJQSxZQUFBLEVBQWMsQ0FKZDtTQURKO1FBT0EsSUFBQyxDQUFBLElBQUQsR0FBYTtRQUNiLElBQUMsQ0FBQSxLQUFELEdBQWE7UUFDYixJQUFDLENBQUEsUUFBRCxHQUFhO1FBQ2IsSUFBQyxDQUFBLFNBQUQsR0FBYTtRQUViLElBQUMsQ0FBQSxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFwQixHQUErQjtJQWRoQzs7MEJBc0JILFFBQUEsR0FBVSxTQUFDLEtBQUQ7QUFFTixZQUFBO1FBQUEsSUFBQyxDQUFBLEtBQUQsQ0FBQTtRQUNBLEtBQUEsR0FBUTtRQUVSLFVBQUEsR0FBYSxJQUFDLENBQUEsSUFBSSxDQUFDLFVBQU4sR0FBbUIsSUFBSSxDQUFDLEdBQUwsQ0FBUyxJQUFDLENBQUEsUUFBVixFQUFvQixLQUFLLENBQUMsTUFBMUI7UUFDaEMsSUFBQyxDQUFBLElBQUksQ0FBQyxLQUFLLENBQUMs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V0FBQSxHQUFhLFNBQUE7QUFFVCxZQUFBO1FBQUEsS0FBQSxHQUFRO0FBQ1IsZUFBTSxJQUFBLEdBQU8sSUFBQyxDQUFBLFNBQVMsQ0FBQyxLQUFYLENBQUEsQ0FBYjtZQUNJLElBQUMsQ0FBQSxVQUFELENBQVksSUFBWjtZQUNBLEtBQUEsSUFBUztZQUNULElBQVMsS0FBQSxHQUFRLEVBQWpCO0FBQUEsc0JBQUE7O1FBSEo7UUFJQSxZQUFBLENBQWEsSUFBQyxDQUFBLFNBQWQ7UUFDQSxJQUEyQyxJQUFDLENBQUEsU0FBUyxDQUFDLE1BQXREO21CQUFBLElBQUMsQ0FBQSxTQUFELEdBQWEsVUFBQSxDQUFXLElBQUMsQ0FBQSxXQUFaLEVBQXlCLENBQXpCLEVBQWI7O0lBUlM7OzBCQVViLEtBQUEsR0FBTyxTQUFBO1FBRUgsSUFBQyxDQUFBLEtBQUQsR0FBUztRQUNULElBQUMsQ0FBQSxJQUFJLENBQUMsS0FBTixDQUFBO2VBQ0EscUNBQUE7SUFKRzs7OztHQW5IZTs7QUF5SDFCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAwMDAgICAgICAgICAgMDAwXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAwMDAwMDAwICAgICAgMDAwXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwXG4gMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAwMDAwMDAwICAgICAgMDAwXG4jIyNcblxueyBrZXJyb3IgfSA9IHJlcXVpcmUgJ2t4aycgXG5cblRleHRFZGl0b3IgPSByZXF1aXJlICcuLi9lZGl0b3IvdGV4dGVkaXRvcidcblN5bnRheCAgICAgPSByZXF1aXJlICcuLi9lZGl0b3Ivc3ludGF4J1xubWF0Y2hyICAgICA9IHJlcXVpcmUgJy4uL3Rvb2xzL21hdGNocidcbnNhbHQgICAgICAgPSByZXF1aXJlICcuLi90b29scy9zYWx0J1xuXG5jbGFzcyBDb21tYW5kTGlzdCBleHRlbmRzIFRleHRFZGl0b3JcblxuICAgIEA6IChAY29tbWFuZCwgdmlld0VsZW0sIG9wdCkgLT5cblxuICAgICAgICBzdXBlciB2aWV3RWxlbSxcbiAgICAgICAgICAgIGZlYXR1cmVzOiBbJ1Njcm9sbGJhcicgJ051bWJlcnMnICdNZXRhJ11cbiAgICAgICAgICAgIGxpbmVIZWlnaHQ6IDEuNFxuICAgICAgICAgICAgZm9udFNpemU6ICAgMTlcbiAgICAgICAgICAgIHN5bnRheE5hbWU6IG9wdC5zeW50YXhOYW1lID8gJ2tvJ1xuICAgICAgICAgICAgc2Nyb2xsT2Zmc2V0OiAwXG5cbiAgICAgICAgQG5hbWUgICAgICA9ICdjb21tYW5kbGlzdC1lZGl0b3InXG4gICAgICAgIEBpdGVtcyAgICAgPSBbXVxuICAgICAgICBAbWF4TGluZXMgID0gMTdcbiAgICAgICAgQG1ldGFRdWV1ZSA9IFtdXG5cbiAgICAgICAgQG51bWJlcnMuZWxlbS5zdHlsZS5mb250U2l6ZSA9ICcxOXB4J1xuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAwIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwXG5cbiAgICBhZGRJdGVtczogKGl0ZW1zKSAtPlxuXG4gICAgICAgIEBjbGVhcigpXG4gICAgICAgIGluZGV4ID0gMFxuICAgICAgICBcbiAgICAgICAgdmlld0hlaWdodCA9IEBzaXplLmxpbmVIZWlnaHQgKiBNYXRoLm1pbiBAbWF4TGluZXMsIGl0ZW1zLmxlbmd0aFxuICAgICAgICBAdmlldy5zdHlsZS5oZWlnaHQgPSBcIiN7dmlld0hlaWdodH1weFwiXG4gICAgICAgIGlmIHZpZXdIZWlnaHQgIT0gQHNjcm9sbC52aWV3SGVpZ2h0XG4gICAgICAgICAgICBAcmVzaXplZCgpXG5cbiAgICAgICAgZm9yIGl0ZW0gaW4gaXRlbXNcbiAgICAgICAgICAgIGNvbnRpbnVlIGlmIG5vdCBpdGVtP1xuICAgICAgICAgICAgdGV4dCA9IChpdGVtLnRleHQgPyBpdGVtKS50cmltPygpXG4gICAgICAgICAgICBjb250aW51ZSBpZiBub3QgdGV4dD8ubGVuZ3RoXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIEBpdGVtcy5wdXNoIGl0ZW1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcm5ncyA9IGl0ZW0ucm5ncyA/IFtdXG5cbiAgICAgICAgICAgIGlmIGl0ZW0uY2xzcz9cbiAgICAgICAgICAgICAgICBybmdzLnB1c2hcbiAgICAgICAgICAgICAgICAgICAgbWF0Y2g6IHRleHRcbiAgICAgICAgICAgICAgICAgICAgc3RhcnQ6IDBcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGl0ZW0uY2xzc1xuICAgICAgICAgICAgICAgICAgICBpbmRleDogMFxuXG4gICAgICAgICAgICBAYXBwZW5kTWV0YVxuICAgICAgICAgICAgICAgIGxpbmU6IGl0ZW0ubGluZSA/ICcgJ1xuICAgICAgICAgICAgICAgIHRleHQ6IHRleHRcbiAgICAgICAgICAgICAgICBybmdzOiBybmdzXG4gICAgICAgICAgICAgICAgdHlwZTogaXRlbS50eXBlID8gQGNvbmZpZy5zeW50YXhOYW1lXG4gICAgICAgICAgICAgICAgY2xzczogJ2NvbW1hbmRsaXN0SXRlbSdcbiAgICAgICAgICAgICAgICBpbmRleDogaW5kZXhcbiAgICAgICAgICAgICAgICBjbGljazogQG9uTWV0YUNsaWNrXG5cbiAgICAgICAgICAgIGluZGV4ICs9IDEgICAgICAgICAgICBcblxuICAgIG9uTWV0YUNsaWNrOiAobWV0YSkgPT5cblxuICAgICAgICBAY29tbWFuZC5saXN0Q2xpY2sgbWV0YVsyXS5pbmRleFxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMCAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwXG5cbiAgICBhcHBlbmRMaW5lRGlzczogKHRleHQsIGRpc3M9W10pIC0+XG5cbiAgICAgICAgQHN5bnRheC5zZXREaXNzIEBudW1MaW5lcygpLCBkaXNzIGlmIGRpc3M/Lmxlbmd0aFxuICAgICAgICBAYXBwZW5kVGV4dCB0ZXh0XG5cbiAgICAjIDAwICAgICAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwXG4gICAgXG4gICAgYXBwZW5kTWV0YTogKG1ldGEpIC0+XG5cbiAgICAgICAgaWYgbm90IG1ldGE/XG4gICAgICAgICAgICByZXR1cm4ga2Vycm9yICdDb21tYW5kTGlzdC5hcHBlbmRNZXRhIC0tIG5vIG1ldGE/J1xuICAgICAgICAgICAgXG4gICAgICAgIEBtZXRhLmFkZERpdiBAbWV0YS5hcHBlbmQgbWV0YVxuXG4gICAgICAgIGlmIG1ldGEuZGlzcz9cbiAgICAgICAgICAgIEBhcHBlbmRMaW5lRGlzcyBTeW50YXgubGluZUZvckRpc3MobWV0YS5kaXNzKSwgbWV0YS5kaXNzXG4gICAgICAgIGVsc2UgaWYgbWV0YS50ZXh0PyBhbmQgbWV0YS50ZXh0LnRyaW0oKS5sZW5ndGhcbiAgICAgICAgICAgIHIgICAgPSBtZXRhLnJuZ3MgPyBbXVxuICAgICAgICAgICAgdGV4dCA9IG1ldGEudGV4dC50cmltKClcbiAgICAgICAgICAgIHJuZ3MgPSByLmNvbmNhdCBTeW50YXgucmFuZ2VzRm9yVGV4dEFuZFN5bnRheCB0ZXh0LCBtZXRhLnR5cGUgb3IgJ2tvJ1xuICAgICAgICAgICAgbWF0Y2hyLnNvcnRSYW5nZXMgcm5nc1xuICAgICAgICAgICAgZGlzcyA9IG1hdGNoci5kaXNzZWN0IHJuZ3MsIGpvaW46dHJ1ZVxuICAgICAgICAgICAgQGFwcGVuZExpbmVEaXNzIHRleHQsIGRpc3MgICAgICAgICAgICBcblxuICAgIHF1ZXVlTWV0YTogKG1ldGEpIC0+XG5cbiAgICAgICAgQG1ldGFRdWV1ZS5wdXNoIG1ldGFcbiAgICAgICAgY2xlYXJUaW1lb3V0IEBtZXRhVGltZXJcbiAgICAgICAgQG1ldGFUaW1lciA9IHNldFRpbWVvdXQgQGRlcXVldWVNZXRhLCAwXG5cbiAgICBkZXF1ZXVlTWV0YTogPT5cblxuICAgICAgICBjb3VudCA9IDBcbiAgICAgICAgd2hpbGUgbWV0YSA9IEBtZXRhUXVldWUuc2hpZnQoKVxuICAgICAgICAgICAgQGFwcGVuZE1ldGEgbWV0YVxuICAgICAgICAgICAgY291bnQgKz0gMVxuICAgICAgICAgICAgYnJlYWsgaWYgY291bnQgPiAyMFxuICAgICAgICBjbGVhclRpbWVvdXQgQG1ldGFUaW1lclxuICAgICAgICBAbWV0YVRpbWVyID0gc2V0VGltZW91dCBAZGVxdWV1ZU1ldGEsIDAgaWYgQG1ldGFRdWV1ZS5sZW5ndGhcblxuICAgIGNsZWFyOiAtPlxuICAgICAgICBcbiAgICAgICAgQGl0ZW1zID0gW11cbiAgICAgICAgQG1ldGEuY2xlYXIoKVxuICAgICAgICBzdXBlcigpXG5cbm1vZHVsZS5leHBvcnRzID0gQ29tbWFuZExpc3RcbiJdfQ==
//# sourceURL=../../coffee/commandline/commandlist.coffee