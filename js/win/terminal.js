// koffee 1.4.0

/*
000000000  00000000  00000000   00     00  000  000   000   0000000   000    
   000     000       000   000  000   000  000  0000  000  000   000  000    
   000     0000000   0000000    000000000  000  000 0 000  000000000  000    
   000     000       000   000  000 0 000  000  000  0000  000   000  000    
   000     00000000  000   000  000   000  000  000   000  000   000  0000000
 */
var Terminal, TextEditor, _, ansiDiss, childp, empty, kpos, popup, prefs, ref, reversed, salt, stopEvent, syntax,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), reversed = ref.reversed, stopEvent = ref.stopEvent, prefs = ref.prefs, kpos = ref.kpos, popup = ref.popup, childp = ref.childp, empty = ref.empty, _ = ref._;

salt = require('../tools/salt');

TextEditor = require('../editor/texteditor');

syntax = require('../editor/syntax');

ansiDiss = require('../tools/ansidiss');

Terminal = (function(superClass) {
    extend(Terminal, superClass);

    function Terminal(viewElem) {
        this.showContextMenu = bind(this.showContextMenu, this);
        this.onContextMenu = bind(this.onContextMenu, this);
        this.dequeueMeta = bind(this.dequeueMeta, this);
        Terminal.__super__.constructor.call(this, viewElem, {
            features: ['Scrollbar', 'Numbers', 'Minimap', 'Meta'],
            fontSize: 15
        });
        this.view.addEventListener("contextmenu", this.onContextMenu);
        this.metaQueue = [];
        this.initInvisibles();
        this.ansidiss = new ansiDiss();
        this.setLines(['']);
    }

    Terminal.prototype.output = function(s) {
        var cid, diss, i, j, k, l, len, len1, len2, meta, ref1, ref2, ref3, ref4, ref5, ref6, results, skip, spinningCog, stopSpin, t, text;
        ref1 = s.split('\n');
        results = [];
        for (i = 0, len = ref1.length; i < len; i++) {
            l = ref1[i];
            t = l.trim();
            if (/ko_term_done/.test(t)) {
                if (/^ko_term_done\s\d+$/.test(t)) {
                    cid = parseInt(_.last(t.split(' ')));
                    ref2 = reversed(this.meta.metas);
                    for (j = 0, len1 = ref2.length; j < len1; j++) {
                        meta = ref2[j];
                        if (meta[2].cmdID === cid) {
                            if ((ref3 = meta[2].span) != null) {
                                ref3.innerHTML = "■";
                            }
                            break;
                        }
                    }
                }
                continue;
            }
            skip = false;
            ref4 = reversed(this.meta.metas);
            for (k = 0, len2 = ref4.length; k < len2; k++) {
                meta = ref4[k];
                if (meta[2].command === t) {
                    if (t !== 'pwd') {
                        spinningCog = '<i class="fa fa-cog fa-spin fa-1x fa-fw"></i>';
                        if ((ref5 = meta[2].span) != null) {
                            ref5.innerHTML = spinningCog;
                        }
                        stopSpin = function() {
                            var ref6, ref7;
                            if (((ref6 = meta[2].span) != null ? ref6.innerHTML : void 0) === spinningCog) {
                                return (ref7 = meta[2].span) != null ? ref7.innerHTML = '<i class="fa fa-cog fa-1x fa-fw"></i>' : void 0;
                            }
                        };
                        setTimeout(stopSpin, 3000);
                    }
                    skip = true;
                    break;
                }
            }
            if (skip) {
                continue;
            }
            ref6 = this.ansidiss.dissect(l), text = ref6[0], diss = ref6[1];
            if (diss != null ? diss.length : void 0) {
                this.syntax.setDiss(this.numLines(), diss);
            }
            results.push(this.appendText(text));
        }
        return results;
    };

    Terminal.prototype.appendLineDiss = function(text, diss) {
        var tail;
        if (diss == null) {
            diss = [];
        }
        if (diss != null ? diss.length : void 0) {
            this.syntax.setDiss(this.numLines(), diss);
        }
        tail = this.cursorPos()[1] === this.numLines() - 1 && this.numCursors() === 1;
        this.appendText(text);
        if (tail) {
            this.singleCursorAtPos([0, this.numLines() - 1]);
            return this.scroll.to(this.scroll.fullHeight);
        }
    };

    Terminal.prototype.appendDiss = function(diss) {
        return this.appendLineDiss(syntax.lineForDiss(diss), diss);
    };

    Terminal.prototype.appendMeta = function(meta) {
        var i, l, len, ref1;
        if (meta == null) {
            return kerror('Terminal.appendMeta -- no meta?');
        }
        this.meta.append(meta);
        if (meta.diss != null) {
            return this.appendLineDiss(syntax.lineForDiss(meta.diss), meta.diss);
        } else if (meta.clss === 'salt') {
            this.appendMeta({
                clss: 'spacer'
            });
            ref1 = salt(meta.text).split('\n');
            for (i = 0, len = ref1.length; i < len; i++) {
                l = ref1[i];
                this.appendMeta({
                    clss: 'spacer',
                    text: '# ' + l
                });
            }
            return this.appendMeta({
                clss: 'spacer'
            });
        } else if (meta.clss === 'termCommand') {
            return this.appendLineDiss(meta.command, syntax.dissForTextAndSyntax(meta.command, 'term'));
        } else if (meta.text != null) {
            return this.appendLineDiss(meta.text);
        } else {
            return this.appendLineDiss('');
        }
    };

    Terminal.prototype.queueMeta = function(meta) {
        this.metaQueue.push(meta);
        clearTimeout(this.metaTimer);
        return this.metaTimer = setTimeout(this.dequeueMeta, 0);
    };

    Terminal.prototype.dequeueMeta = function() {
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

    Terminal.prototype.clear = function() {
        this.meta.clear();
        this.singleCursorAtPos([0, 0]);
        return Terminal.__super__.clear.call(this);
    };

    Terminal.prototype.setAutoClear = function(state) {
        return prefs.set('terminal:autoclear', state);
    };

    Terminal.prototype.getAutoClear = function() {
        return prefs.get('terminal:autoclear', true);
    };

    Terminal.prototype.setHeader = function(state) {
        return prefs.set('terminal:header', state);
    };

    Terminal.prototype.getHeader = function() {
        return prefs.get('terminal:header', true);
    };

    Terminal.prototype.doAutoClear = function() {
        if (this.getAutoClear()) {
            return this.clear();
        }
    };

    Terminal.prototype.onContextMenu = function(event) {
        return stopEvent(event, this.showContextMenu(kpos(event)));
    };

    Terminal.prototype.showContextMenu = function(absPos) {
        var opt;
        if (absPos == null) {
            absPos = kpos(this.view.getBoundingClientRect().left, this.view.getBoundingClientRect().top);
        }
        opt = {
            items: [
                {
                    text: 'Clear',
                    combo: 'alt+k',
                    cb: this.clear
                }, {
                    text: 'Close',
                    combo: 'alt+ctrl+k',
                    cb: window.split.hideTerminal
                }
            ]
        };
        opt.x = absPos.x;
        opt.y = absPos.y;
        return popup.menu(opt);
    };

    Terminal.prototype.handleModKeyComboCharEvent = function(mod, key, combo, char, event) {
        var href, split;
        if ('unhandled' !== Terminal.__super__.handleModKeyComboCharEvent.call(this, mod, key, combo, char, event)) {
            return;
        }
        switch (combo) {
            case 'enter':
                if (href = this.meta.hrefAtLineIndex(this.cursorPos()[1])) {
                    post.emit('loadFile', "" + href);
                }
                return;
            case 'ctrl+enter':
            case 'command+enter':
                if (href = this.meta.hrefAtLineIndex(this.cursorPos()[1])) {
                    post.emit('loadFile', "" + href);
                    window.editor.focus();
                }
                return;
            case 'ctrl+s':
            case 'command+s':
                if (this.meta.saveChanges()) {
                    return;
                }
                break;
            case 'esc':
                split = window.split;
                split.focus('commandline-editor');
                split["do"]('enlarge editor');
                return;
        }
        return 'unhandled';
    };

    return Terminal;

})(TextEditor);

module.exports = Terminal;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWwuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLDRHQUFBO0lBQUE7Ozs7QUFRQSxNQUFpRSxPQUFBLENBQVEsS0FBUixDQUFqRSxFQUFFLHVCQUFGLEVBQVkseUJBQVosRUFBdUIsaUJBQXZCLEVBQThCLGVBQTlCLEVBQW9DLGlCQUFwQyxFQUEyQyxtQkFBM0MsRUFBbUQsaUJBQW5ELEVBQTBEOztBQUUxRCxJQUFBLEdBQWEsT0FBQSxDQUFRLGVBQVI7O0FBQ2IsVUFBQSxHQUFhLE9BQUEsQ0FBUSxzQkFBUjs7QUFDYixNQUFBLEdBQWEsT0FBQSxDQUFRLGtCQUFSOztBQUNiLFFBQUEsR0FBYSxPQUFBLENBQVEsbUJBQVI7O0FBRVA7OztJQUVXLGtCQUFDLFFBQUQ7Ozs7UUFFVCwwQ0FBTSxRQUFOLEVBQWdCO1lBQUEsUUFBQSxFQUFVLENBQUMsV0FBRCxFQUFjLFNBQWQsRUFBeUIsU0FBekIsRUFBb0MsTUFBcEMsQ0FBVjtZQUF1RCxRQUFBLEVBQVUsRUFBakU7U0FBaEI7UUFFQSxJQUFDLENBQUEsSUFBSSxDQUFDLGdCQUFOLENBQXVCLGFBQXZCLEVBQXNDLElBQUMsQ0FBQSxhQUF2QztRQUVBLElBQUMsQ0FBQSxTQUFELEdBQWE7UUFFYixJQUFDLENBQUEsY0FBRCxDQUFBO1FBQ0EsSUFBQyxDQUFBLFFBQUQsR0FBWSxJQUFJLFFBQUosQ0FBQTtRQUNaLElBQUMsQ0FBQSxRQUFELENBQVUsQ0FBQyxFQUFELENBQVY7SUFWUzs7dUJBa0JiLE1BQUEsR0FBUSxTQUFDLENBQUQ7QUFFSixZQUFBO0FBQUE7QUFBQTthQUFBLHNDQUFBOztZQUNJLENBQUEsR0FBSSxDQUFDLENBQUMsSUFBRixDQUFBO1lBQ0osSUFBRyxjQUFjLENBQUMsSUFBZixDQUFvQixDQUFwQixDQUFIO2dCQUNJLElBQUcscUJBQXFCLENBQUMsSUFBdEIsQ0FBMkIsQ0FBM0IsQ0FB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VjtBQUFBLDJCQUFBOztBQURXO0FBVm5CLGlCQVlTLEtBWlQ7Z0JBYVEsS0FBQSxHQUFRLE1BQU0sQ0FBQztnQkFDZixLQUFLLENBQUMsS0FBTixDQUFZLG9CQUFaO2dCQUNBLEtBQUssRUFBQyxFQUFELEVBQUwsQ0FBWSxnQkFBWjtBQUNBO0FBaEJSO2VBa0JBO0lBdEJ3Qjs7OztHQWxMVDs7QUEwTXZCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgIFxuICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICBcbiAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMDAwICAwMDAgICAgXG4gICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgIFxuICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDBcbiMjI1xuXG57IHJldmVyc2VkLCBzdG9wRXZlbnQsIHByZWZzLCBrcG9zLCBwb3B1cCwgY2hpbGRwLCBlbXB0eSwgXyAgfSA9IHJlcXVpcmUgJ2t4aydcblxuc2FsdCAgICAgICA9IHJlcXVpcmUgJy4uL3Rvb2xzL3NhbHQnXG5UZXh0RWRpdG9yID0gcmVxdWlyZSAnLi4vZWRpdG9yL3RleHRlZGl0b3InXG5zeW50YXggICAgID0gcmVxdWlyZSAnLi4vZWRpdG9yL3N5bnRheCdcbmFuc2lEaXNzICAgPSByZXF1aXJlICcuLi90b29scy9hbnNpZGlzcydcblxuY2xhc3MgVGVybWluYWwgZXh0ZW5kcyBUZXh0RWRpdG9yXG5cbiAgICBjb25zdHJ1Y3RvcjogKHZpZXdFbGVtKSAtPiBcbiAgICAgICAgXG4gICAgICAgIHN1cGVyIHZpZXdFbGVtLCBmZWF0dXJlczogWydTY3JvbGxiYXInLCAnTnVtYmVycycsICdNaW5pbWFwJywgJ01ldGEnXSwgZm9udFNpemU6IDE1XG4gICAgICAgIFxuICAgICAgICBAdmlldy5hZGRFdmVudExpc3RlbmVyIFwiY29udGV4dG1lbnVcIiwgQG9uQ29udGV4dE1lbnVcbiAgICAgICAgXG4gICAgICAgIEBtZXRhUXVldWUgPSBbXVxuICAgICAgICBcbiAgICAgICAgQGluaXRJbnZpc2libGVzKClcbiAgICAgICAgQGFuc2lkaXNzID0gbmV3IGFuc2lEaXNzKCkgICAgXG4gICAgICAgIEBzZXRMaW5lcyBbJyddXG5cbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICBcbiAgICAjICAwMDAwMDAwICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgICAgICAgIDAwMDAwMDAgICAgICAwMDAgICBcblxuICAgIG91dHB1dDogKHMpIC0+XG4gICAgICAgIFxuICAgICAgICBmb3IgbCBpbiBzLnNwbGl0ICdcXG4nXG4gICAgICAgICAgICB0ID0gbC50cmltKClcbiAgICAgICAgICAgIGlmIC9rb190ZXJtX2RvbmUvLnRlc3QgdFxuICAgICAgICAgICAgICAgIGlmIC9ea29fdGVybV9kb25lXFxzXFxkKyQvLnRlc3QgdFxuICAgICAgICAgICAgICAgICAgICBjaWQgPSBwYXJzZUludCBfLmxhc3QgdC5zcGxpdCAnICdcbiAgICAgICAgICAgICAgICAgICAgZm9yIG1ldGEgaW4gcmV2ZXJzZWQgQG1ldGEubWV0YXNcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIG1ldGFbMl0uY21kSUQgPT0gY2lkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0YVsyXS5zcGFuPy5pbm5lckhUTUwgPSBcIuKWoFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgc2tpcCA9IGZhbHNlXG4gICAgICAgICAgICBmb3IgbWV0YSBpbiByZXZlcnNlZCBAbWV0YS5tZXRhc1xuICAgICAgICAgICAgICAgIGlmIG1ldGFbMl0uY29tbWFuZCA9PSB0IFxuICAgICAgICAgICAgICAgICAgICBpZiB0ICE9ICdwd2QnXG4gICAgICAgICAgICAgICAgICAgICAgICBzcGlubmluZ0NvZyA9ICc8aSBjbGFzcz1cImZhIGZhLWNvZyBmYS1zcGluIGZhLTF4IGZhLWZ3XCI+PC9pPidcbiAgICAgICAgICAgICAgICAgICAgICAgIG1ldGFbMl0uc3Bhbj8uaW5uZXJIVE1MID0gc3Bpbm5pbmdDb2dcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0b3BTcGluID0gLT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBtZXRhWzJdLnNwYW4/LmlubmVySFRNTCA9PSBzcGlubmluZ0NvZ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRhWzJdLnNwYW4/LmlubmVySFRNTCA9ICc8aSBjbGFzcz1cImZhIGZhLWNvZyBmYS0xeCBmYS1md1wiPjwvaT4nXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0IHN0b3BTcGluLCAzMDAwXG4gICAgICAgICAgICAgICAgICAgIHNraXAgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICBjb250aW51ZSBpZiBza2lwXG4gICAgICAgICAgICBbdGV4dCxkaXNzXSA9IEBhbnNpZGlzcy5kaXNzZWN0IGxcbiAgICAgICAgICAgIEBzeW50YXguc2V0RGlzcyBAbnVtTGluZXMoKSwgZGlzcyBpZiBkaXNzPy5sZW5ndGhcbiAgICAgICAgICAgIEBhcHBlbmRUZXh0IHRleHRcbiAgICAgICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwIDAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgIDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgXG4gICAgICAgICAgICAgICAgXG4gICAgYXBwZW5kTGluZURpc3M6ICh0ZXh0LCBkaXNzPVtdKSAtPlxuICAgICAgICBcbiAgICAgICAgQHN5bnRheC5zZXREaXNzIEBudW1MaW5lcygpLCBkaXNzIGlmIGRpc3M/Lmxlbmd0aFxuICAgICAgICB0YWlsID0gQGN1cnNvclBvcygpWzFdID09IEBudW1MaW5lcygpLTEgYW5kIEBudW1DdXJzb3JzKCkgPT0gMVxuICAgICAgICBAYXBwZW5kVGV4dCB0ZXh0XG4gICAgICAgIGlmIHRhaWxcbiAgICAgICAgICAgIEBzaW5nbGVDdXJzb3JBdFBvcyBbMCwgQG51bUxpbmVzKCktMV0gXG4gICAgICAgICAgICBAc2Nyb2xsLnRvIEBzY3JvbGwuZnVsbEhlaWdodFxuICAgICAgICAgICAgXG4gICAgYXBwZW5kRGlzczogKGRpc3MpIC0+IEBhcHBlbmRMaW5lRGlzcyBzeW50YXgubGluZUZvckRpc3MoZGlzcyksIGRpc3MgICAgICAgIFxuICAgIFxuICAgICMgMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwXG4gICAgXG4gICAgYXBwZW5kTWV0YTogKG1ldGEpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBub3QgbWV0YT9cbiAgICAgICAgICAgIHJldHVybiBrZXJyb3IgJ1Rlcm1pbmFsLmFwcGVuZE1ldGEgLS0gbm8gbWV0YT8nXG4gICAgICAgICAgICBcbiAgICAgICAgQG1ldGEuYXBwZW5kIG1ldGFcbiAgICAgICAgXG4gICAgICAgIGlmIG1ldGEuZGlzcz9cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgQGFwcGVuZExpbmVEaXNzIHN5bnRheC5saW5lRm9yRGlzcyhtZXRhLmRpc3MpLCBtZXRhLmRpc3MgXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgZWxzZSBpZiBtZXRhLmNsc3MgPT0gJ3NhbHQnXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIEBhcHBlbmRNZXRhIGNsc3M6ICdzcGFjZXInXG4gICAgICAgICAgICBmb3IgbCBpbiBzYWx0KG1ldGEudGV4dCkuc3BsaXQgJ1xcbidcbiAgICAgICAgICAgICAgICBAYXBwZW5kTWV0YSBjbHNzOiAnc3BhY2VyJywgdGV4dDogJyMgJytsXG4gICAgICAgICAgICBAYXBwZW5kTWV0YSBjbHNzOiAnc3BhY2VyJ1xuICAgICAgICAgICAgXG4gICAgICAgIGVsc2UgaWYgbWV0YS5jbHNzID09ICd0ZXJtQ29tbWFuZCdcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgQGFwcGVuZExpbmVEaXNzIG1ldGEuY29tbWFuZCwgc3ludGF4LmRpc3NGb3JUZXh0QW5kU3ludGF4IG1ldGEuY29tbWFuZCwgJ3Rlcm0nXG5cbiAgICAgICAgZWxzZSBpZiBtZXRhLnRleHQ/XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIEBhcHBlbmRMaW5lRGlzcyBtZXRhLnRleHRcbiAgICAgICAgICAgIFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIEBhcHBlbmRMaW5lRGlzcyAnJ1xuICAgICAgICBcbiAgICBxdWV1ZU1ldGE6IChtZXRhKSAtPlxuICAgICAgICBcbiAgICAgICAgQG1ldGFRdWV1ZS5wdXNoIG1ldGFcbiAgICAgICAgY2xlYXJUaW1lb3V0IEBtZXRhVGltZXJcbiAgICAgICAgQG1ldGFUaW1lciA9IHNldFRpbWVvdXQgQGRlcXVldWVNZXRhLCAwXG4gICAgICAgIFxuICAgIGRlcXVldWVNZXRhOiA9PlxuICAgICAgICBcbiAgICAgICAgY291bnQgPSAwXG4gICAgICAgIHdoaWxlIG1ldGEgPSBAbWV0YVF1ZXVlLnNoaWZ0KClcbiAgICAgICAgICAgIEBhcHBlbmRNZXRhIG1ldGFcbiAgICAgICAgICAgIGNvdW50ICs9IDFcbiAgICAgICAgICAgIGJyZWFrIGlmIGNvdW50ID4gMjBcbiAgICAgICAgY2xlYXJUaW1lb3V0IEBtZXRhVGltZXJcbiAgICAgICAgQG1ldGFUaW1lciA9IHNldFRpbWVvdXQgQGRlcXVldWVNZXRhLCAwIGlmIEBtZXRhUXVldWUubGVuZ3RoXG4gICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICBjbGVhcjogLT5cbiAgICAgICAgQG1ldGEuY2xlYXIoKVxuICAgICAgICBAc2luZ2xlQ3Vyc29yQXRQb3MgWzAsMF1cbiAgICAgICAgc3VwZXIoKVxuXG4gICAgc2V0QXV0b0NsZWFyOiAoc3RhdGUpIC0+IHByZWZzLnNldCAndGVybWluYWw6YXV0b2NsZWFyJywgc3RhdGVcbiAgICBnZXRBdXRvQ2xlYXI6IC0+IHByZWZzLmdldCAndGVybWluYWw6YXV0b2NsZWFyJywgdHJ1ZVxuXG4gICAgc2V0SGVhZGVyOiAoc3RhdGUpIC0+IHByZWZzLnNldCAndGVybWluYWw6aGVhZGVyJywgc3RhdGVcbiAgICBnZXRIZWFkZXI6IC0+IHByZWZzLmdldCAndGVybWluYWw6aGVhZGVyJywgdHJ1ZVxuICAgIFxuICAgIGRvQXV0b0NsZWFyOiAtPiBpZiBAZ2V0QXV0b0NsZWFyKCkgdGhlbiBAY2xlYXIoKVxuXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgICAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMCAgXG4gICAgXG4gICAgIyBleGVjdXRlOiAoY21tZCkgLT5cbiAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgICBcbiAgICAjIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwICAgICAgICAgIFxuXG4gICAgb25Db250ZXh0TWVudTogKGV2ZW50KSA9PiBzdG9wRXZlbnQgZXZlbnQsIEBzaG93Q29udGV4dE1lbnUga3BvcyBldmVudFxuICAgICAgICAgICAgICBcbiAgICBzaG93Q29udGV4dE1lbnU6IChhYnNQb3MpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBub3QgYWJzUG9zP1xuICAgICAgICAgICAgYWJzUG9zID0ga3BvcyBAdmlldy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5sZWZ0LCBAdmlldy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3BcbiAgICAgICAgXG4gICAgICAgIG9wdCA9IGl0ZW1zOiBbXG4gICAgICAgICAgICB0ZXh0OiAgICdDbGVhcidcbiAgICAgICAgICAgIGNvbWJvOiAgJ2FsdCtrJyBcbiAgICAgICAgICAgIGNiOiAgICAgQGNsZWFyXG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJ0Nsb3NlJ1xuICAgICAgICAgICAgY29tYm86ICAnYWx0K2N0cmwraydcbiAgICAgICAgICAgIGNiOiAgICAgd2luZG93LnNwbGl0LmhpZGVUZXJtaW5hbFxuICAgICAgICBdXG4gICAgICAgIFxuICAgICAgICBvcHQueCA9IGFic1Bvcy54XG4gICAgICAgIG9wdC55ID0gYWJzUG9zLnlcbiAgICAgICAgcG9wdXAubWVudSBvcHRcbiAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAwMDAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAgIDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwICAgXG4gICAgXG4gICAgaGFuZGxlTW9kS2V5Q29tYm9DaGFyRXZlbnQ6IChtb2QsIGtleSwgY29tYm8sIGNoYXIsIGV2ZW50KSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmICd1bmhhbmRsZWQnICE9IHN1cGVyIG1vZCwga2V5LCBjb21ibywgY2hhciwgZXZlbnRcbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCBjb21ib1xuICAgICAgICAgICAgd2hlbiAnZW50ZXInXG4gICAgICAgICAgICAgICAgaWYgaHJlZiA9IEBtZXRhLmhyZWZBdExpbmVJbmRleCBAY3Vyc29yUG9zKClbMV1cbiAgICAgICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdsb2FkRmlsZScsIFwiI3tocmVmfVwiIFxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgd2hlbiAnY3RybCtlbnRlcicsICdjb21tYW5kK2VudGVyJ1xuICAgICAgICAgICAgICAgIGlmIGhyZWYgPSBAbWV0YS5ocmVmQXRMaW5lSW5kZXggQGN1cnNvclBvcygpWzFdXG4gICAgICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnbG9hZEZpbGUnLCBcIiN7aHJlZn1cIiBcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LmVkaXRvci5mb2N1cygpXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICB3aGVuICdjdHJsK3MnLCAnY29tbWFuZCtzJ1xuICAgICAgICAgICAgICAgIHJldHVybiBpZiBAbWV0YS5zYXZlQ2hhbmdlcygpXG4gICAgICAgICAgICB3aGVuICdlc2MnXG4gICAgICAgICAgICAgICAgc3BsaXQgPSB3aW5kb3cuc3BsaXRcbiAgICAgICAgICAgICAgICBzcGxpdC5mb2N1cyAnY29tbWFuZGxpbmUtZWRpdG9yJ1xuICAgICAgICAgICAgICAgIHNwbGl0LmRvICAgICdlbmxhcmdlIGVkaXRvcidcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgJ3VuaGFuZGxlZCdcblxubW9kdWxlLmV4cG9ydHMgPSBUZXJtaW5hbFxuIl19
//# sourceURL=../../coffee/win/terminal.coffee