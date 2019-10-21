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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWwuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLDRHQUFBO0lBQUE7Ozs7QUFRQSxNQUFpRSxPQUFBLENBQVEsS0FBUixDQUFqRSxFQUFFLHVCQUFGLEVBQVkseUJBQVosRUFBdUIsaUJBQXZCLEVBQThCLGVBQTlCLEVBQW9DLGlCQUFwQyxFQUEyQyxtQkFBM0MsRUFBbUQsaUJBQW5ELEVBQTBEOztBQUUxRCxJQUFBLEdBQWEsT0FBQSxDQUFRLGVBQVI7O0FBQ2IsVUFBQSxHQUFhLE9BQUEsQ0FBUSxzQkFBUjs7QUFDYixNQUFBLEdBQWEsT0FBQSxDQUFRLGtCQUFSOztBQUNiLFFBQUEsR0FBYSxPQUFBLENBQVEsbUJBQVI7O0FBRVA7OztJQUVXLGtCQUFDLFFBQUQ7Ozs7UUFFVCwwQ0FBTSxRQUFOLEVBQWdCO1lBQUEsUUFBQSxFQUFVLENBQUMsV0FBRCxFQUFhLFNBQWIsRUFBdUIsU0FBdkIsRUFBaUMsTUFBakMsQ0FBVjtZQUFvRCxRQUFBLEVBQVUsRUFBOUQ7U0FBaEI7UUFFQSxJQUFDLENBQUEsSUFBSSxDQUFDLGdCQUFOLENBQXVCLGFBQXZCLEVBQXNDLElBQUMsQ0FBQSxhQUF2QztRQUVBLElBQUMsQ0FBQSxTQUFELEdBQWE7UUFFYixJQUFDLENBQUEsU0FBRCxDQUFXLEtBQUssQ0FBQyxHQUFOLENBQVUsaUJBQVYsRUFBNEIsS0FBNUIsQ0FBWDtRQUVBLElBQUMsQ0FBQSxjQUFELENBQUE7UUFDQSxJQUFDLENBQUEsUUFBRCxHQUFZLElBQUksUUFBSixDQUFBO1FBQ1osSUFBQyxDQUFBLFFBQUQsQ0FBVSxDQUFDLEVBQUQsQ0FBVjtJQVpTOzt1QkFvQmIsTUFBQSxHQUFRLFNBQUMsQ0FBRDtBQUVKLFlBQUE7QUFBQTtBQUFBO2FBQUEsc0NBQUE7O1lBQ0ksQ0FBQSxHQUFJLENBQUMsQ0FBQyxJQUFGLENBQUE7WUFDSixJQUFHLGNBQWMsQ0FB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UUFWVDtBQUFBLGlCQVVrQixXQVZsQjtnQkFXUSxJQUFVLElBQUMsQ0FBQSxJQUFJLENBQUMsV0FBTixDQUFBLENBQVY7QUFBQSwyQkFBQTs7QUFEVTtBQVZsQixpQkFZUyxLQVpUO2dCQWFRLEtBQUEsR0FBUSxNQUFNLENBQUM7Z0JBQ2YsS0FBSyxDQUFDLEtBQU4sQ0FBWSxvQkFBWjtnQkFDQSxLQUFLLEVBQUMsRUFBRCxFQUFMLENBQVksZ0JBQVo7QUFDQTtBQWhCUjtlQWtCQTtJQXRCd0I7Ozs7R0FwTFQ7O0FBNE12QixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgICBcbiAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgXG4gICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAwMCAgMDAwICAgIFxuICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICBcbiAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwXG4jIyNcblxueyByZXZlcnNlZCwgc3RvcEV2ZW50LCBwcmVmcywga3BvcywgcG9wdXAsIGNoaWxkcCwgZW1wdHksIF8gIH0gPSByZXF1aXJlICdreGsnXG5cbnNhbHQgICAgICAgPSByZXF1aXJlICcuLi90b29scy9zYWx0J1xuVGV4dEVkaXRvciA9IHJlcXVpcmUgJy4uL2VkaXRvci90ZXh0ZWRpdG9yJ1xuc3ludGF4ICAgICA9IHJlcXVpcmUgJy4uL2VkaXRvci9zeW50YXgnXG5hbnNpRGlzcyAgID0gcmVxdWlyZSAnLi4vdG9vbHMvYW5zaWRpc3MnXG5cbmNsYXNzIFRlcm1pbmFsIGV4dGVuZHMgVGV4dEVkaXRvclxuXG4gICAgY29uc3RydWN0b3I6ICh2aWV3RWxlbSkgLT4gXG4gICAgICAgIFxuICAgICAgICBzdXBlciB2aWV3RWxlbSwgZmVhdHVyZXM6IFsnU2Nyb2xsYmFyJyAnTnVtYmVycycgJ01pbmltYXAnICdNZXRhJ10sIGZvbnRTaXplOiAxNVxuICAgICAgICBcbiAgICAgICAgQHZpZXcuYWRkRXZlbnRMaXN0ZW5lciBcImNvbnRleHRtZW51XCIsIEBvbkNvbnRleHRNZW51XG4gICAgICAgIFxuICAgICAgICBAbWV0YVF1ZXVlID0gW11cbiAgICAgICAgXG4gICAgICAgIEBzZXRIZWFkZXIgcHJlZnMuZ2V0ICd0ZXJtaW5hbDpoZWFkZXInIGZhbHNlXG4gICAgICAgIFxuICAgICAgICBAaW5pdEludmlzaWJsZXMoKVxuICAgICAgICBAYW5zaWRpc3MgPSBuZXcgYW5zaURpc3MoKSAgICBcbiAgICAgICAgQHNldExpbmVzIFsnJ11cblxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgIFxuICAgICMgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgICAgICAgMDAwMDAwMCAgICAgIDAwMCAgIFxuXG4gICAgb3V0cHV0OiAocykgLT5cbiAgICAgICAgXG4gICAgICAgIGZvciBsIGluIHMuc3BsaXQgJ1xcbidcbiAgICAgICAgICAgIHQgPSBsLnRyaW0oKVxuICAgICAgICAgICAgaWYgL2tvX3Rlcm1fZG9uZS8udGVzdCB0XG4gICAgICAgICAgICAgICAgaWYgL15rb190ZXJtX2RvbmVcXHNcXGQrJC8udGVzdCB0XG4gICAgICAgICAgICAgICAgICAgIGNpZCA9IHBhcnNlSW50IF8ubGFzdCB0LnNwbGl0ICcgJ1xuICAgICAgICAgICAgICAgICAgICBmb3IgbWV0YSBpbiByZXZlcnNlZCBAbWV0YS5tZXRhc1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgbWV0YVsyXS5jbWRJRCA9PSBjaWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRhWzJdLnNwYW4/LmlubmVySFRNTCA9IFwi4pagXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICBza2lwID0gZmFsc2VcbiAgICAgICAgICAgIGZvciBtZXRhIGluIHJldmVyc2VkIEBtZXRhLm1ldGFzXG4gICAgICAgICAgICAgICAgaWYgbWV0YVsyXS5jb21tYW5kID09IHQgXG4gICAgICAgICAgICAgICAgICAgIGlmIHQgIT0gJ3B3ZCdcbiAgICAgICAgICAgICAgICAgICAgICAgIHNwaW5uaW5nQ29nID0gJzxpIGNsYXNzPVwiZmEgZmEtY29nIGZhLXNwaW4gZmEtMXggZmEtZndcIj48L2k+J1xuICAgICAgICAgICAgICAgICAgICAgICAgbWV0YVsyXS5zcGFuPy5pbm5lckhUTUwgPSBzcGlubmluZ0NvZ1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RvcFNwaW4gPSAtPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIG1ldGFbMl0uc3Bhbj8uaW5uZXJIVE1MID09IHNwaW5uaW5nQ29nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGFbMl0uc3Bhbj8uaW5uZXJIVE1MID0gJzxpIGNsYXNzPVwiZmEgZmEtY29nIGZhLTF4IGZhLWZ3XCI+PC9pPidcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQgc3RvcFNwaW4sIDMwMDBcbiAgICAgICAgICAgICAgICAgICAgc2tpcCA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIGNvbnRpbnVlIGlmIHNraXBcbiAgICAgICAgICAgIFt0ZXh0LGRpc3NdID0gQGFuc2lkaXNzLmRpc3NlY3QgbFxuICAgICAgICAgICAgQHN5bnRheC5zZXREaXNzIEBudW1MaW5lcygpLCBkaXNzIGlmIGRpc3M/Lmxlbmd0aFxuICAgICAgICAgICAgQGFwcGVuZFRleHQgdGV4dFxuICAgICAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMCAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICBcbiAgICAgICAgICAgICAgICBcbiAgICBhcHBlbmRMaW5lRGlzczogKHRleHQsIGRpc3M9W10pIC0+XG4gICAgICAgIFxuICAgICAgICBAc3ludGF4LnNldERpc3MgQG51bUxpbmVzKCksIGRpc3MgaWYgZGlzcz8ubGVuZ3RoXG4gICAgICAgIHRhaWwgPSBAY3Vyc29yUG9zKClbMV0gPT0gQG51bUxpbmVzKCktMSBhbmQgQG51bUN1cnNvcnMoKSA9PSAxXG4gICAgICAgIEBhcHBlbmRUZXh0IHRleHRcbiAgICAgICAgaWYgdGFpbFxuICAgICAgICAgICAgQHNpbmdsZUN1cnNvckF0UG9zIFswLCBAbnVtTGluZXMoKS0xXSBcbiAgICAgICAgICAgIEBzY3JvbGwudG8gQHNjcm9sbC5mdWxsSGVpZ2h0XG4gICAgICAgICAgICBcbiAgICBhcHBlbmREaXNzOiAoZGlzcykgLT4gQGFwcGVuZExpbmVEaXNzIHN5bnRheC5saW5lRm9yRGlzcyhkaXNzKSwgZGlzcyAgICAgICAgXG4gICAgXG4gICAgIyAwMCAgICAgMDAgIDAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDBcbiAgICBcbiAgICBhcHBlbmRNZXRhOiAobWV0YSkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBtZXRhP1xuICAgICAgICAgICAgcmV0dXJuIGtlcnJvciAnVGVybWluYWwuYXBwZW5kTWV0YSAtLSBubyBtZXRhPydcbiAgICAgICAgICAgIFxuICAgICAgICBAbWV0YS5hcHBlbmQgbWV0YVxuICAgICAgICBcbiAgICAgICAgaWYgbWV0YS5kaXNzP1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBAYXBwZW5kTGluZURpc3Mgc3ludGF4LmxpbmVGb3JEaXNzKG1ldGEuZGlzcyksIG1ldGEuZGlzcyBcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBlbHNlIGlmIG1ldGEuY2xzcyA9PSAnc2FsdCdcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgQGFwcGVuZE1ldGEgY2xzczogJ3NwYWNlcidcbiAgICAgICAgICAgIGZvciBsIGluIHNhbHQobWV0YS50ZXh0KS5zcGxpdCAnXFxuJ1xuICAgICAgICAgICAgICAgIEBhcHBlbmRNZXRhIGNsc3M6J3NwYWNlcicgdGV4dDonIyAnK2xcbiAgICAgICAgICAgIEBhcHBlbmRNZXRhIGNsc3M6ICdzcGFjZXInXG4gICAgICAgICAgICBcbiAgICAgICAgZWxzZSBpZiBtZXRhLmNsc3MgPT0gJ3Rlcm1Db21tYW5kJ1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBAYXBwZW5kTGluZURpc3MgbWV0YS5jb21tYW5kLCBzeW50YXguZGlzc0ZvclRleHRBbmRTeW50YXggbWV0YS5jb21tYW5kLCAndGVybSdcblxuICAgICAgICBlbHNlIGlmIG1ldGEudGV4dD9cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgQGFwcGVuZExpbmVEaXNzIG1ldGEudGV4dFxuICAgICAgICAgICAgXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgQGFwcGVuZExpbmVEaXNzICcnXG4gICAgICAgIFxuICAgIHF1ZXVlTWV0YTogKG1ldGEpIC0+XG4gICAgICAgIFxuICAgICAgICBAbWV0YVF1ZXVlLnB1c2ggbWV0YVxuICAgICAgICBjbGVhclRpbWVvdXQgQG1ldGFUaW1lclxuICAgICAgICBAbWV0YVRpbWVyID0gc2V0VGltZW91dCBAZGVxdWV1ZU1ldGEsIDBcbiAgICAgICAgXG4gICAgZGVxdWV1ZU1ldGE6ID0+XG4gICAgICAgIFxuICAgICAgICBjb3VudCA9IDBcbiAgICAgICAgd2hpbGUgbWV0YSA9IEBtZXRhUXVldWUuc2hpZnQoKVxuICAgICAgICAgICAgQGFwcGVuZE1ldGEgbWV0YVxuICAgICAgICAgICAgY291bnQgKz0gMVxuICAgICAgICAgICAgYnJlYWsgaWYgY291bnQgPiAyMFxuICAgICAgICBjbGVhclRpbWVvdXQgQG1ldGFUaW1lclxuICAgICAgICBAbWV0YVRpbWVyID0gc2V0VGltZW91dCBAZGVxdWV1ZU1ldGEsIDAgaWYgQG1ldGFRdWV1ZS5sZW5ndGhcbiAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgIGNsZWFyOiAtPlxuICAgICAgICBAbWV0YS5jbGVhcigpXG4gICAgICAgIEBzaW5nbGVDdXJzb3JBdFBvcyBbMCwwXVxuICAgICAgICBzdXBlcigpXG5cbiAgICBzZXRBdXRvQ2xlYXI6IChzdGF0ZSkgLT4gcHJlZnMuc2V0ICd0ZXJtaW5hbDphdXRvY2xlYXInIHN0YXRlXG4gICAgZ2V0QXV0b0NsZWFyOiAtPiBwcmVmcy5nZXQgJ3Rlcm1pbmFsOmF1dG9jbGVhcicgdHJ1ZVxuXG4gICAgc2V0SGVhZGVyOiAoc3RhdGUpIC0+IHByZWZzLnNldCAndGVybWluYWw6aGVhZGVyJyBzdGF0ZVxuICAgIGdldEhlYWRlcjogLT4gcHJlZnMuZ2V0ICd0ZXJtaW5hbDpoZWFkZXInIHRydWVcbiAgICBcbiAgICBkb0F1dG9DbGVhcjogLT4gaWYgQGdldEF1dG9DbGVhcigpIHRoZW4gQGNsZWFyKClcblxuICAgICMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAgMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAgIFxuICAgIFxuICAgICMgZXhlY3V0ZTogKGNtbWQpIC0+XG4gICAgICAgIFxuICAgICMgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgICAgXG4gICAgIyAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAgICBcblxuICAgIG9uQ29udGV4dE1lbnU6IChldmVudCkgPT4gc3RvcEV2ZW50IGV2ZW50LCBAc2hvd0NvbnRleHRNZW51IGtwb3MgZXZlbnRcbiAgICAgICAgICAgICAgXG4gICAgc2hvd0NvbnRleHRNZW51OiAoYWJzUG9zKSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgbm90IGFic1Bvcz9cbiAgICAgICAgICAgIGFic1BvcyA9IGtwb3MgQHZpZXcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkubGVmdCwgQHZpZXcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wXG4gICAgICAgIFxuICAgICAgICBvcHQgPSBpdGVtczogW1xuICAgICAgICAgICAgdGV4dDogICAnQ2xlYXInXG4gICAgICAgICAgICBjb21ibzogICdhbHQraycgXG4gICAgICAgICAgICBjYjogICAgIEBjbGVhclxuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICdDbG9zZSdcbiAgICAgICAgICAgIGNvbWJvOiAgJ2FsdCtjdHJsK2snXG4gICAgICAgICAgICBjYjogICAgIHdpbmRvdy5zcGxpdC5oaWRlVGVybWluYWxcbiAgICAgICAgXVxuICAgICAgICBcbiAgICAgICAgb3B0LnggPSBhYnNQb3MueFxuICAgICAgICBvcHQueSA9IGFic1Bvcy55XG4gICAgICAgIHBvcHVwLm1lbnUgb3B0XG4gICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgMDAwIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgICAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgIFxuICAgIFxuICAgIGhhbmRsZU1vZEtleUNvbWJvQ2hhckV2ZW50OiAobW9kLCBrZXksIGNvbWJvLCBjaGFyLCBldmVudCkgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiAndW5oYW5kbGVkJyAhPSBzdXBlciBtb2QsIGtleSwgY29tYm8sIGNoYXIsIGV2ZW50XG4gICAgICAgIFxuICAgICAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgICAgIHdoZW4gJ2VudGVyJ1xuICAgICAgICAgICAgICAgIGlmIGhyZWYgPSBAbWV0YS5ocmVmQXRMaW5lSW5kZXggQGN1cnNvclBvcygpWzFdXG4gICAgICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnbG9hZEZpbGUnIFwiI3tocmVmfVwiIFxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgd2hlbiAnY3RybCtlbnRlcicgJ2NvbW1hbmQrZW50ZXInXG4gICAgICAgICAgICAgICAgaWYgaHJlZiA9IEBtZXRhLmhyZWZBdExpbmVJbmRleCBAY3Vyc29yUG9zKClbMV1cbiAgICAgICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdsb2FkRmlsZScgXCIje2hyZWZ9XCIgXG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5lZGl0b3IuZm9jdXMoKVxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgd2hlbiAnY3RybCtzJyAnY29tbWFuZCtzJ1xuICAgICAgICAgICAgICAgIHJldHVybiBpZiBAbWV0YS5zYXZlQ2hhbmdlcygpXG4gICAgICAgICAgICB3aGVuICdlc2MnXG4gICAgICAgICAgICAgICAgc3BsaXQgPSB3aW5kb3cuc3BsaXRcbiAgICAgICAgICAgICAgICBzcGxpdC5mb2N1cyAnY29tbWFuZGxpbmUtZWRpdG9yJ1xuICAgICAgICAgICAgICAgIHNwbGl0LmRvICAgICdlbmxhcmdlIGVkaXRvcidcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgJ3VuaGFuZGxlZCdcblxubW9kdWxlLmV4cG9ydHMgPSBUZXJtaW5hbFxuIl19
//# sourceURL=../../coffee/win/terminal.coffee