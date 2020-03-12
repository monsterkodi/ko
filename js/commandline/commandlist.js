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

ref = require('kxk'), kerror = ref.kerror, matchr = ref.matchr;

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
            scrollOffset: 0,
            syntaxName: (ref1 = opt.syntaxName) != null ? ref1 : 'ko'
        });
        this.name = 'commandlist-editor';
        this.items = [];
        this.metaQueue = [];
        this.maxLines = 17;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZGxpc3QuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vY29mZmVlL2NvbW1hbmRsaW5lIiwic291cmNlcyI6WyJjb21tYW5kbGlzdC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsMERBQUE7SUFBQTs7OztBQVFBLE1BQXFCLE9BQUEsQ0FBUSxLQUFSLENBQXJCLEVBQUUsbUJBQUYsRUFBVTs7QUFFVixVQUFBLEdBQWEsT0FBQSxDQUFRLHNCQUFSOztBQUNiLE1BQUEsR0FBYSxPQUFBLENBQVEsa0JBQVI7O0FBQ2IsSUFBQSxHQUFhLE9BQUEsQ0FBUSxlQUFSOztBQUVQOzs7SUFFQyxxQkFBQyxPQUFELEVBQVcsUUFBWCxFQUFxQixHQUFyQjtBQUVDLFlBQUE7UUFGQSxJQUFDLENBQUEsVUFBRDs7O1FBRUEsNkNBQU0sUUFBTixFQUNJO1lBQUEsUUFBQSxFQUFjLENBQUMsV0FBRCxFQUFhLFNBQWIsRUFBdUIsTUFBdkIsQ0FBZDtZQUNBLFVBQUEsRUFBYyxHQURkO1lBRUEsUUFBQSxFQUFjLEVBRmQ7WUFHQSxZQUFBLEVBQWMsQ0FIZDtZQUlBLFVBQUEsMkNBQStCLElBSi9CO1NBREo7UUFPQSxJQUFDLENBQUEsSUFBRCxHQUFhO1FBQ2IsSUFBQyxDQUFBLEtBQUQsR0FBYTtRQUNiLElBQUMsQ0FBQSxTQUFELEdBQWE7UUFDYixJQUFDLENBQUEsUUFBRCxHQUFhO1FBRWIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQXBCLEdBQStCO0lBZGhDOzswQkFzQkgsUUFBQSxHQUFVLFNBQUMsS0FBRDtBQUVOLFlBQUE7UUFBQSxJQUFDLENBQUEsS0FBRCxDQUFBO1FBQ0EsS0FBQSxHQUFRO1FBRVIsVUFBQSxHQUFhLElBQUMsQ0FBQSxJQUFJLENBQUMsVUFBTixHQUFtQixJQUFJLENBQUMsR0FBTCxDQUFTLElBQUMsQ0FBQSxRQUFWLEVBQW9CLEtBQUssQ0FBQyxNQUExQjtRQUNo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QUEsV0FBWixFQUF5QixDQUF6QjtJQUpOOzswQkFNWCxXQUFBLEdBQWEsU0FBQTtBQUVULFlBQUE7UUFBQSxLQUFBLEdBQVE7QUFDUixlQUFNLElBQUEsR0FBTyxJQUFDLENBQUEsU0FBUyxDQUFDLEtBQVgsQ0FBQSxDQUFiO1lBQ0ksSUFBQyxDQUFBLFVBQUQsQ0FBWSxJQUFaO1lBQ0EsS0FBQSxJQUFTO1lBQ1QsSUFBUyxLQUFBLEdBQVEsRUFBakI7QUFBQSxzQkFBQTs7UUFISjtRQUlBLFlBQUEsQ0FBYSxJQUFDLENBQUEsU0FBZDtRQUNBLElBQTJDLElBQUMsQ0FBQSxTQUFTLENBQUMsTUFBdEQ7bUJBQUEsSUFBQyxDQUFBLFNBQUQsR0FBYSxVQUFBLENBQVcsSUFBQyxDQUFBLFdBQVosRUFBeUIsQ0FBekIsRUFBYjs7SUFSUzs7MEJBVWIsS0FBQSxHQUFPLFNBQUE7UUFFSCxJQUFDLENBQUEsS0FBRCxHQUFTO1FBQ1QsSUFBQyxDQUFBLElBQUksQ0FBQyxLQUFOLENBQUE7ZUFDQSxxQ0FBQTtJQUpHOzs7O0dBbkhlOztBQXlIMUIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbiAwMDAwMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAgICAwMDBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMDAwMDAgICAgICAwMDBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDBcbiAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgIDAwMDAwMDAgICAgICAwMDBcbiMjI1xuXG57IGtlcnJvciwgbWF0Y2hyIH0gPSByZXF1aXJlICdreGsnXG5cblRleHRFZGl0b3IgPSByZXF1aXJlICcuLi9lZGl0b3IvdGV4dGVkaXRvcidcblN5bnRheCAgICAgPSByZXF1aXJlICcuLi9lZGl0b3Ivc3ludGF4J1xuc2FsdCAgICAgICA9IHJlcXVpcmUgJy4uL3Rvb2xzL3NhbHQnXG5cbmNsYXNzIENvbW1hbmRMaXN0IGV4dGVuZHMgVGV4dEVkaXRvclxuXG4gICAgQDogKEBjb21tYW5kLCB2aWV3RWxlbSwgb3B0KSAtPlxuXG4gICAgICAgIHN1cGVyIHZpZXdFbGVtLFxuICAgICAgICAgICAgZmVhdHVyZXM6ICAgICBbJ1Njcm9sbGJhcicgJ051bWJlcnMnICdNZXRhJ11cbiAgICAgICAgICAgIGxpbmVIZWlnaHQ6ICAgMS40XG4gICAgICAgICAgICBmb250U2l6ZTogICAgIDE5XG4gICAgICAgICAgICBzY3JvbGxPZmZzZXQ6IDBcbiAgICAgICAgICAgIHN5bnRheE5hbWU6ICAgb3B0LnN5bnRheE5hbWUgPyAna28nXG5cbiAgICAgICAgQG5hbWUgICAgICA9ICdjb21tYW5kbGlzdC1lZGl0b3InXG4gICAgICAgIEBpdGVtcyAgICAgPSBbXVxuICAgICAgICBAbWV0YVF1ZXVlID0gW11cbiAgICAgICAgQG1heExpbmVzICA9IDE3XG5cbiAgICAgICAgQG51bWJlcnMuZWxlbS5zdHlsZS5mb250U2l6ZSA9ICcxOXB4J1xuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAwIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwXG5cbiAgICBhZGRJdGVtczogKGl0ZW1zKSAtPlxuXG4gICAgICAgIEBjbGVhcigpXG4gICAgICAgIGluZGV4ID0gMFxuICAgICAgICBcbiAgICAgICAgdmlld0hlaWdodCA9IEBzaXplLmxpbmVIZWlnaHQgKiBNYXRoLm1pbiBAbWF4TGluZXMsIGl0ZW1zLmxlbmd0aFxuICAgICAgICBAdmlldy5zdHlsZS5oZWlnaHQgPSBcIiN7dmlld0hlaWdodH1weFwiXG4gICAgICAgIGlmIHZpZXdIZWlnaHQgIT0gQHNjcm9sbC52aWV3SGVpZ2h0XG4gICAgICAgICAgICBAcmVzaXplZCgpXG5cbiAgICAgICAgZm9yIGl0ZW0gaW4gaXRlbXNcbiAgICAgICAgICAgIGNvbnRpbnVlIGlmIG5vdCBpdGVtP1xuICAgICAgICAgICAgdGV4dCA9IChpdGVtLnRleHQgPyBpdGVtKS50cmltPygpXG4gICAgICAgICAgICBjb250aW51ZSBpZiBub3QgdGV4dD8ubGVuZ3RoXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIEBpdGVtcy5wdXNoIGl0ZW1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcm5ncyA9IGl0ZW0ucm5ncyA/IFtdXG5cbiAgICAgICAgICAgIGlmIGl0ZW0uY2xzcz9cbiAgICAgICAgICAgICAgICBybmdzLnB1c2hcbiAgICAgICAgICAgICAgICAgICAgbWF0Y2g6IHRleHRcbiAgICAgICAgICAgICAgICAgICAgc3RhcnQ6IDBcbiAgICAgICAgICAgICAgICAgICAgY2xzczogIGl0ZW0uY2xzc1xuICAgICAgICAgICAgICAgICAgICBpbmRleDogMFxuXG4gICAgICAgICAgICBAYXBwZW5kTWV0YVxuICAgICAgICAgICAgICAgIGxpbmU6IGl0ZW0ubGluZSA/ICcgJ1xuICAgICAgICAgICAgICAgIHRleHQ6IHRleHRcbiAgICAgICAgICAgICAgICBybmdzOiBybmdzXG4gICAgICAgICAgICAgICAgdHlwZTogaXRlbS50eXBlID8gQGNvbmZpZy5zeW50YXhOYW1lXG4gICAgICAgICAgICAgICAgY2xzczogJ2NvbW1hbmRsaXN0SXRlbSdcbiAgICAgICAgICAgICAgICBpbmRleDogaW5kZXhcbiAgICAgICAgICAgICAgICBjbGljazogQG9uTWV0YUNsaWNrXG5cbiAgICAgICAgICAgIGluZGV4ICs9IDEgICAgICAgICAgICBcblxuICAgIG9uTWV0YUNsaWNrOiAobWV0YSkgPT5cblxuICAgICAgICBAY29tbWFuZC5saXN0Q2xpY2sgbWV0YVsyXS5pbmRleFxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMCAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwXG5cbiAgICBhcHBlbmRMaW5lRGlzczogKHRleHQsIGRpc3M9W10pIC0+XG5cbiAgICAgICAgQHN5bnRheC5zZXREaXNzIEBudW1MaW5lcygpLCBkaXNzIGlmIGRpc3M/Lmxlbmd0aFxuICAgICAgICBAYXBwZW5kVGV4dCB0ZXh0XG5cbiAgICAjIDAwICAgICAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwXG4gICAgXG4gICAgYXBwZW5kTWV0YTogKG1ldGEpIC0+XG5cbiAgICAgICAgaWYgbm90IG1ldGE/XG4gICAgICAgICAgICByZXR1cm4ga2Vycm9yICdDb21tYW5kTGlzdC5hcHBlbmRNZXRhIC0tIG5vIG1ldGE/J1xuICAgICAgICAgICAgXG4gICAgICAgIEBtZXRhLmFkZERpdiBAbWV0YS5hcHBlbmQgbWV0YVxuXG4gICAgICAgIGlmIG1ldGEuZGlzcz9cbiAgICAgICAgICAgIEBhcHBlbmRMaW5lRGlzcyBTeW50YXgubGluZUZvckRpc3MobWV0YS5kaXNzKSwgbWV0YS5kaXNzXG4gICAgICAgIGVsc2UgaWYgbWV0YS50ZXh0PyBhbmQgbWV0YS50ZXh0LnRyaW0oKS5sZW5ndGhcbiAgICAgICAgICAgIHIgICAgPSBtZXRhLnJuZ3MgPyBbXVxuICAgICAgICAgICAgdGV4dCA9IG1ldGEudGV4dC50cmltKClcbiAgICAgICAgICAgIHJuZ3MgPSByLmNvbmNhdCBTeW50YXgucmFuZ2VzRm9yVGV4dEFuZFN5bnRheCB0ZXh0LCBtZXRhLnR5cGUgb3IgJ2tvJ1xuICAgICAgICAgICAgbWF0Y2hyLnNvcnRSYW5nZXMgcm5nc1xuICAgICAgICAgICAgZGlzcyA9IG1hdGNoci5kaXNzZWN0IHJuZ3MsIGpvaW46dHJ1ZVxuICAgICAgICAgICAgQGFwcGVuZExpbmVEaXNzIHRleHQsIGRpc3MgICAgICAgICAgICBcblxuICAgIHF1ZXVlTWV0YTogKG1ldGEpIC0+XG5cbiAgICAgICAgQG1ldGFRdWV1ZS5wdXNoIG1ldGFcbiAgICAgICAgY2xlYXJUaW1lb3V0IEBtZXRhVGltZXJcbiAgICAgICAgQG1ldGFUaW1lciA9IHNldFRpbWVvdXQgQGRlcXVldWVNZXRhLCAwXG5cbiAgICBkZXF1ZXVlTWV0YTogPT5cblxuICAgICAgICBjb3VudCA9IDBcbiAgICAgICAgd2hpbGUgbWV0YSA9IEBtZXRhUXVldWUuc2hpZnQoKVxuICAgICAgICAgICAgQGFwcGVuZE1ldGEgbWV0YVxuICAgICAgICAgICAgY291bnQgKz0gMVxuICAgICAgICAgICAgYnJlYWsgaWYgY291bnQgPiAyMFxuICAgICAgICBjbGVhclRpbWVvdXQgQG1ldGFUaW1lclxuICAgICAgICBAbWV0YVRpbWVyID0gc2V0VGltZW91dCBAZGVxdWV1ZU1ldGEsIDAgaWYgQG1ldGFRdWV1ZS5sZW5ndGhcblxuICAgIGNsZWFyOiAtPlxuICAgICAgICBcbiAgICAgICAgQGl0ZW1zID0gW11cbiAgICAgICAgQG1ldGEuY2xlYXIoKVxuICAgICAgICBzdXBlcigpXG5cbm1vZHVsZS5leHBvcnRzID0gQ29tbWFuZExpc3RcbiJdfQ==
//# sourceURL=../../coffee/commandline/commandlist.coffee