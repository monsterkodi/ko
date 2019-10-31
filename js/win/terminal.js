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
        this.setHeader(prefs.get('terminal:header', false));
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWwuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLDRHQUFBO0lBQUE7Ozs7QUFRQSxNQUFpRSxPQUFBLENBQVEsS0FBUixDQUFqRSxFQUFFLHVCQUFGLEVBQVkseUJBQVosRUFBdUIsaUJBQXZCLEVBQThCLGVBQTlCLEVBQW9DLGlCQUFwQyxFQUEyQyxtQkFBM0MsRUFBbUQsaUJBQW5ELEVBQTBEOztBQUUxRCxJQUFBLEdBQWEsT0FBQSxDQUFRLGVBQVI7O0FBQ2IsVUFBQSxHQUFhLE9BQUEsQ0FBUSxzQkFBUjs7QUFDYixNQUFBLEdBQWEsT0FBQSxDQUFRLGtCQUFSOztBQUNiLFFBQUEsR0FBYSxPQUFBLENBQVEsbUJBQVI7O0FBRVA7OztJQUVDLGtCQUFDLFFBQUQ7Ozs7UUFFQywwQ0FBTSxRQUFOLEVBQWdCO1lBQUEsUUFBQSxFQUFVLENBQUMsV0FBRCxFQUFhLFNBQWIsRUFBdUIsU0FBdkIsRUFBaUMsTUFBakMsQ0FBVjtZQUFvRCxRQUFBLEVBQVUsRUFBOUQ7U0FBaEI7UUFFQSxJQUFDLENBQUEsSUFBSSxDQUFDLGdCQUFOLENBQXVCLGFBQXZCLEVBQXNDLElBQUMsQ0FBQSxhQUF2QztRQUVBLElBQUMsQ0FBQSxTQUFELEdBQWE7UUFFYixJQUFDLENBQUEsU0FBRCxDQUFXLEtBQUssQ0FBQyxHQUFOLENBQVUsaUJBQVYsRUFBNEIsS0FBNUIsQ0FBWDtRQUVBLElBQUMsQ0FBQSxjQUFELENBQUE7UUFDQSxJQUFDLENBQUEsUUFBRCxHQUFZLElBQUksUUFBSixDQUFBO1FBQ1osSUFBQyxDQUFBLFFBQUQsQ0FBVSxDQUFDLEVBQUQsQ0FBVjtJQVpEOzt1QkFvQkgsTUFBQSxHQUFRLFNBQUMsQ0FBRDtBQUVKLFlBQUE7QUFBQTtBQUFBO2FBQUEsc0NBQUE7O1lBQ0ksQ0FBQSxHQUFJLENBQUMsQ0FBQyxJQUFGLENBQUE7WUFDSixJQUFHLGNBQWMsQ0FB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UUFWVDtBQUFBLGlCQVVrQixXQVZsQjtnQkFXUSxJQUFVLElBQUMsQ0FBQSxJQUFJLENBQUMsV0FBTixDQUFBLENBQVY7QUFBQSwyQkFBQTs7QUFEVTtBQVZsQixpQkFZUyxLQVpUO2dCQWFRLEtBQUEsR0FBUSxNQUFNLENBQUM7Z0JBQ2YsS0FBSyxDQUFDLEtBQU4sQ0FBWSxvQkFBWjtnQkFDQSxLQUFLLEVBQUMsRUFBRCxFQUFMLENBQVksZ0JBQVo7QUFDQTtBQWhCUjtlQWtCQTtJQXRCd0I7Ozs7R0FwTFQ7O0FBNE12QixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgICBcbiAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgXG4gICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAwMCAgMDAwICAgIFxuICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICBcbiAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwXG4jIyNcblxueyByZXZlcnNlZCwgc3RvcEV2ZW50LCBwcmVmcywga3BvcywgcG9wdXAsIGNoaWxkcCwgZW1wdHksIF8gIH0gPSByZXF1aXJlICdreGsnXG5cbnNhbHQgICAgICAgPSByZXF1aXJlICcuLi90b29scy9zYWx0J1xuVGV4dEVkaXRvciA9IHJlcXVpcmUgJy4uL2VkaXRvci90ZXh0ZWRpdG9yJ1xuc3ludGF4ICAgICA9IHJlcXVpcmUgJy4uL2VkaXRvci9zeW50YXgnXG5hbnNpRGlzcyAgID0gcmVxdWlyZSAnLi4vdG9vbHMvYW5zaWRpc3MnXG5cbmNsYXNzIFRlcm1pbmFsIGV4dGVuZHMgVGV4dEVkaXRvclxuXG4gICAgQDogKHZpZXdFbGVtKSAtPlxuICAgICAgICBcbiAgICAgICAgc3VwZXIgdmlld0VsZW0sIGZlYXR1cmVzOiBbJ1Njcm9sbGJhcicgJ051bWJlcnMnICdNaW5pbWFwJyAnTWV0YSddLCBmb250U2l6ZTogMTVcbiAgICAgICAgXG4gICAgICAgIEB2aWV3LmFkZEV2ZW50TGlzdGVuZXIgXCJjb250ZXh0bWVudVwiLCBAb25Db250ZXh0TWVudVxuICAgICAgICBcbiAgICAgICAgQG1ldGFRdWV1ZSA9IFtdXG4gICAgICAgIFxuICAgICAgICBAc2V0SGVhZGVyIHByZWZzLmdldCAndGVybWluYWw6aGVhZGVyJyBmYWxzZVxuICAgICAgICBcbiAgICAgICAgQGluaXRJbnZpc2libGVzKClcbiAgICAgICAgQGFuc2lkaXNzID0gbmV3IGFuc2lEaXNzKCkgICAgXG4gICAgICAgIEBzZXRMaW5lcyBbJyddXG5cbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICBcbiAgICAjICAwMDAwMDAwICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgICAgICAgIDAwMDAwMDAgICAgICAwMDAgICBcblxuICAgIG91dHB1dDogKHMpIC0+XG4gICAgICAgIFxuICAgICAgICBmb3IgbCBpbiBzLnNwbGl0ICdcXG4nXG4gICAgICAgICAgICB0ID0gbC50cmltKClcbiAgICAgICAgICAgIGlmIC9rb190ZXJtX2RvbmUvLnRlc3QgdFxuICAgICAgICAgICAgICAgIGlmIC9ea29fdGVybV9kb25lXFxzXFxkKyQvLnRlc3QgdFxuICAgICAgICAgICAgICAgICAgICBjaWQgPSBwYXJzZUludCBfLmxhc3QgdC5zcGxpdCAnICdcbiAgICAgICAgICAgICAgICAgICAgZm9yIG1ldGEgaW4gcmV2ZXJzZWQgQG1ldGEubWV0YXNcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIG1ldGFbMl0uY21kSUQgPT0gY2lkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0YVsyXS5zcGFuPy5pbm5lckhUTUwgPSBcIuKWoFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgc2tpcCA9IGZhbHNlXG4gICAgICAgICAgICBmb3IgbWV0YSBpbiByZXZlcnNlZCBAbWV0YS5tZXRhc1xuICAgICAgICAgICAgICAgIGlmIG1ldGFbMl0uY29tbWFuZCA9PSB0IFxuICAgICAgICAgICAgICAgICAgICBpZiB0ICE9ICdwd2QnXG4gICAgICAgICAgICAgICAgICAgICAgICBzcGlubmluZ0NvZyA9ICc8aSBjbGFzcz1cImZhIGZhLWNvZyBmYS1zcGluIGZhLTF4IGZhLWZ3XCI+PC9pPidcbiAgICAgICAgICAgICAgICAgICAgICAgIG1ldGFbMl0uc3Bhbj8uaW5uZXJIVE1MID0gc3Bpbm5pbmdDb2dcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0b3BTcGluID0gLT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBtZXRhWzJdLnNwYW4/LmlubmVySFRNTCA9PSBzcGlubmluZ0NvZ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRhWzJdLnNwYW4/LmlubmVySFRNTCA9ICc8aSBjbGFzcz1cImZhIGZhLWNvZyBmYS0xeCBmYS1md1wiPjwvaT4nXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0IHN0b3BTcGluLCAzMDAwXG4gICAgICAgICAgICAgICAgICAgIHNraXAgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICBjb250aW51ZSBpZiBza2lwXG4gICAgICAgICAgICBbdGV4dCxkaXNzXSA9IEBhbnNpZGlzcy5kaXNzZWN0IGxcbiAgICAgICAgICAgIEBzeW50YXguc2V0RGlzcyBAbnVtTGluZXMoKSwgZGlzcyBpZiBkaXNzPy5sZW5ndGhcbiAgICAgICAgICAgIEBhcHBlbmRUZXh0IHRleHRcbiAgICAgICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwIDAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgIDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgXG4gICAgICAgICAgICAgICAgXG4gICAgYXBwZW5kTGluZURpc3M6ICh0ZXh0LCBkaXNzPVtdKSAtPlxuICAgICAgICBcbiAgICAgICAgQHN5bnRheC5zZXREaXNzIEBudW1MaW5lcygpLCBkaXNzIGlmIGRpc3M/Lmxlbmd0aFxuICAgICAgICB0YWlsID0gQGN1cnNvclBvcygpWzFdID09IEBudW1MaW5lcygpLTEgYW5kIEBudW1DdXJzb3JzKCkgPT0gMVxuICAgICAgICBAYXBwZW5kVGV4dCB0ZXh0XG4gICAgICAgIGlmIHRhaWxcbiAgICAgICAgICAgIEBzaW5nbGVDdXJzb3JBdFBvcyBbMCwgQG51bUxpbmVzKCktMV0gXG4gICAgICAgICAgICBAc2Nyb2xsLnRvIEBzY3JvbGwuZnVsbEhlaWdodFxuICAgICAgICAgICAgXG4gICAgYXBwZW5kRGlzczogKGRpc3MpIC0+IEBhcHBlbmRMaW5lRGlzcyBzeW50YXgubGluZUZvckRpc3MoZGlzcyksIGRpc3MgICAgICAgIFxuICAgIFxuICAgICMgMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwXG4gICAgXG4gICAgYXBwZW5kTWV0YTogKG1ldGEpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBub3QgbWV0YT9cbiAgICAgICAgICAgIHJldHVybiBrZXJyb3IgJ1Rlcm1pbmFsLmFwcGVuZE1ldGEgLS0gbm8gbWV0YT8nXG4gICAgICAgICAgICBcbiAgICAgICAgQG1ldGEuYXBwZW5kIG1ldGFcbiAgICAgICAgXG4gICAgICAgIGlmIG1ldGEuZGlzcz9cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgQGFwcGVuZExpbmVEaXNzIHN5bnRheC5saW5lRm9yRGlzcyhtZXRhLmRpc3MpLCBtZXRhLmRpc3MgXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgZWxzZSBpZiBtZXRhLmNsc3MgPT0gJ3NhbHQnXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIEBhcHBlbmRNZXRhIGNsc3M6ICdzcGFjZXInXG4gICAgICAgICAgICBmb3IgbCBpbiBzYWx0KG1ldGEudGV4dCkuc3BsaXQgJ1xcbidcbiAgICAgICAgICAgICAgICBAYXBwZW5kTWV0YSBjbHNzOidzcGFjZXInIHRleHQ6JyMgJytsXG4gICAgICAgICAgICBAYXBwZW5kTWV0YSBjbHNzOiAnc3BhY2VyJ1xuICAgICAgICAgICAgXG4gICAgICAgIGVsc2UgaWYgbWV0YS5jbHNzID09ICd0ZXJtQ29tbWFuZCdcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgQGFwcGVuZExpbmVEaXNzIG1ldGEuY29tbWFuZCwgc3ludGF4LmRpc3NGb3JUZXh0QW5kU3ludGF4IG1ldGEuY29tbWFuZCwgJ3Rlcm0nXG5cbiAgICAgICAgZWxzZSBpZiBtZXRhLnRleHQ/XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIEBhcHBlbmRMaW5lRGlzcyBtZXRhLnRleHRcbiAgICAgICAgICAgIFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIEBhcHBlbmRMaW5lRGlzcyAnJ1xuICAgICAgICBcbiAgICBxdWV1ZU1ldGE6IChtZXRhKSAtPlxuICAgICAgICBcbiAgICAgICAgQG1ldGFRdWV1ZS5wdXNoIG1ldGFcbiAgICAgICAgY2xlYXJUaW1lb3V0IEBtZXRhVGltZXJcbiAgICAgICAgQG1ldGFUaW1lciA9IHNldFRpbWVvdXQgQGRlcXVldWVNZXRhLCAwXG4gICAgICAgIFxuICAgIGRlcXVldWVNZXRhOiA9PlxuICAgICAgICBcbiAgICAgICAgY291bnQgPSAwXG4gICAgICAgIHdoaWxlIG1ldGEgPSBAbWV0YVF1ZXVlLnNoaWZ0KClcbiAgICAgICAgICAgIEBhcHBlbmRNZXRhIG1ldGFcbiAgICAgICAgICAgIGNvdW50ICs9IDFcbiAgICAgICAgICAgIGJyZWFrIGlmIGNvdW50ID4gMjBcbiAgICAgICAgY2xlYXJUaW1lb3V0IEBtZXRhVGltZXJcbiAgICAgICAgQG1ldGFUaW1lciA9IHNldFRpbWVvdXQgQGRlcXVldWVNZXRhLCAwIGlmIEBtZXRhUXVldWUubGVuZ3RoXG4gICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICBjbGVhcjogLT5cbiAgICAgICAgQG1ldGEuY2xlYXIoKVxuICAgICAgICBAc2luZ2xlQ3Vyc29yQXRQb3MgWzAsMF1cbiAgICAgICAgc3VwZXIoKVxuXG4gICAgc2V0QXV0b0NsZWFyOiAoc3RhdGUpIC0+IHByZWZzLnNldCAndGVybWluYWw6YXV0b2NsZWFyJyBzdGF0ZVxuICAgIGdldEF1dG9DbGVhcjogLT4gcHJlZnMuZ2V0ICd0ZXJtaW5hbDphdXRvY2xlYXInIHRydWVcblxuICAgIHNldEhlYWRlcjogKHN0YXRlKSAtPiBwcmVmcy5zZXQgJ3Rlcm1pbmFsOmhlYWRlcicgc3RhdGVcbiAgICBnZXRIZWFkZXI6IC0+IHByZWZzLmdldCAndGVybWluYWw6aGVhZGVyJyB0cnVlXG4gICAgXG4gICAgZG9BdXRvQ2xlYXI6IC0+IGlmIEBnZXRBdXRvQ2xlYXIoKSB0aGVuIEBjbGVhcigpXG5cbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgIDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwICBcbiAgICBcbiAgICAjIGV4ZWN1dGU6IChjbW1kKSAtPlxuICAgICAgICBcbiAgICAjIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIFxuICAgICMgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgICAgXG5cbiAgICBvbkNvbnRleHRNZW51OiAoZXZlbnQpID0+IHN0b3BFdmVudCBldmVudCwgQHNob3dDb250ZXh0TWVudSBrcG9zIGV2ZW50XG4gICAgICAgICAgICAgIFxuICAgIHNob3dDb250ZXh0TWVudTogKGFic1BvcykgPT5cbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBhYnNQb3M/XG4gICAgICAgICAgICBhYnNQb3MgPSBrcG9zIEB2aWV3LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQsIEB2aWV3LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcFxuICAgICAgICBcbiAgICAgICAgb3B0ID0gaXRlbXM6IFtcbiAgICAgICAgICAgIHRleHQ6ICAgJ0NsZWFyJ1xuICAgICAgICAgICAgY29tYm86ICAnYWx0K2snIFxuICAgICAgICAgICAgY2I6ICAgICBAY2xlYXJcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnQ2xvc2UnXG4gICAgICAgICAgICBjb21ibzogICdhbHQrY3RybCtrJ1xuICAgICAgICAgICAgY2I6ICAgICB3aW5kb3cuc3BsaXQuaGlkZVRlcm1pbmFsXG4gICAgICAgIF1cbiAgICAgICAgXG4gICAgICAgIG9wdC54ID0gYWJzUG9zLnhcbiAgICAgICAgb3B0LnkgPSBhYnNQb3MueVxuICAgICAgICBwb3B1cC5tZW51IG9wdFxuICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwIDAwMCBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgICAgMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAgICBcbiAgICBcbiAgICBoYW5kbGVNb2RLZXlDb21ib0NoYXJFdmVudDogKG1vZCwga2V5LCBjb21ibywgY2hhciwgZXZlbnQpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgJ3VuaGFuZGxlZCcgIT0gc3VwZXIgbW9kLCBrZXksIGNvbWJvLCBjaGFyLCBldmVudFxuICAgICAgICBcbiAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICB3aGVuICdlbnRlcidcbiAgICAgICAgICAgICAgICBpZiBocmVmID0gQG1ldGEuaHJlZkF0TGluZUluZGV4IEBjdXJzb3JQb3MoKVsxXVxuICAgICAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2xvYWRGaWxlJyBcIiN7aHJlZn1cIiBcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIHdoZW4gJ2N0cmwrZW50ZXInICdjb21tYW5kK2VudGVyJ1xuICAgICAgICAgICAgICAgIGlmIGhyZWYgPSBAbWV0YS5ocmVmQXRMaW5lSW5kZXggQGN1cnNvclBvcygpWzFdXG4gICAgICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnbG9hZEZpbGUnIFwiI3tocmVmfVwiIFxuICAgICAgICAgICAgICAgICAgICB3aW5kb3cuZWRpdG9yLmZvY3VzKClcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIHdoZW4gJ2N0cmwrcycgJ2NvbW1hbmQrcydcbiAgICAgICAgICAgICAgICByZXR1cm4gaWYgQG1ldGEuc2F2ZUNoYW5nZXMoKVxuICAgICAgICAgICAgd2hlbiAnZXNjJ1xuICAgICAgICAgICAgICAgIHNwbGl0ID0gd2luZG93LnNwbGl0XG4gICAgICAgICAgICAgICAgc3BsaXQuZm9jdXMgJ2NvbW1hbmRsaW5lLWVkaXRvcidcbiAgICAgICAgICAgICAgICBzcGxpdC5kbyAgICAnZW5sYXJnZSBlZGl0b3InXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICd1bmhhbmRsZWQnXG5cbm1vZHVsZS5leHBvcnRzID0gVGVybWluYWxcbiJdfQ==
//# sourceURL=../../coffee/win/terminal.coffee