// koffee 1.4.0

/*
0000000    000  00000000  00000000  0000000     0000000   00000000
000   000  000  000       000       000   000  000   000  000   000
000   000  000  000000    000000    0000000    000000000  0000000
000   000  000  000       000       000   000  000   000  000   000
0000000    000  000       000       0000000    000   000  000   000
 */
var Diffbar, elem, empty, fs, hub, lineDiff, post, ref,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), elem = ref.elem, empty = ref.empty, post = ref.post, fs = ref.fs;

lineDiff = require('../tools/linediff');

hub = require('../git/hub');

Diffbar = (function() {
    function Diffbar(editor) {
        this.editor = editor;
        this.updateScroll = bind(this.updateScroll, this);
        this.update = bind(this.update, this);
        this.onEditorFile = bind(this.onEditorFile, this);
        this.onMetaClick = bind(this.onMetaClick, this);
        this.elem = elem('canvas', {
            "class": 'diffbar'
        });
        this.elem.style.position = 'absolute';
        this.elem.style.left = '0';
        this.elem.style.top = '0';
        this.editor.view.appendChild(this.elem);
        this.editor.on('file', this.onEditorFile);
        this.editor.on('undone', this.update);
        this.editor.on('redone', this.update);
        this.editor.on('linesShown', this.updateScroll);
        post.on('gitStatus', this.update);
        post.on('gitDiff', this.update);
    }

    Diffbar.prototype.onMetaClick = function(meta, event) {
        var blockIndices, ref1;
        if (event.metaKey) {
            return 'unhandled';
        }
        if (event.ctrlKey) {
            this.editor.singleCursorAtPos(rangeStartPos(meta));
            this.editor.toggleGitChangesInLines([meta[0]]);
        } else {
            if (meta[2].boring) {
                if ((ref1 = this.editor.invisibles) != null) {
                    ref1.activate();
                }
            }
            blockIndices = this.lineIndicesForBlockAtLine(meta[0]);
            this.editor["do"].start();
            this.editor["do"].setCursors(blockIndices.map(function(i) {
                return [0, i];
            }));
            this.editor["do"].end();
            this.editor.toggleGitChangesInLines(blockIndices);
        }
        return this;
    };

    Diffbar.prototype.gitMetasAtLineIndex = function(li) {
        return this.editor.meta.metasAtLineIndex(li).filter(function(m) {
            return m[2].clss.startsWith('git');
        });
    };

    Diffbar.prototype.lineIndicesForBlockAtLine = function(li) {
        var ai, bi, lines, metas, toggled;
        lines = [];
        if (!empty(metas = this.gitMetasAtLineIndex(li))) {
            toggled = metas[0][2].toggled;
            lines.push(li);
            bi = li - 1;
            while (!empty(metas = this.gitMetasAtLineIndex(bi))) {
                if (metas[0][2].toggled !== toggled) {
                    break;
                }
                lines.unshift(bi);
                bi--;
            }
            ai = li + 1;
            while (!empty(metas = this.gitMetasAtLineIndex(ai))) {
                if (metas[0][2].toggled !== toggled) {
                    break;
                }
                lines.push(ai);
                ai++;
            }
        }
        return lines;
    };

    Diffbar.prototype.updateMetas = function() {
        var add, boring, change, j, k, len, len1, li, meta, mod, mods, ref1, ref2, ref3, ref4, results;
        this.clearMetas();
        if (!((ref1 = this.changes) != null ? (ref2 = ref1.changes) != null ? ref2.length : void 0 : void 0)) {
            return;
        }
        ref3 = this.changes.changes;
        results = [];
        for (j = 0, len = ref3.length; j < len; j++) {
            change = ref3[j];
            boring = this.isBoring(change);
            if (change.mod != null) {
                li = change.line - 1;
                ref4 = change.mod;
                for (k = 0, len1 = ref4.length; k < len1; k++) {
                    mod = ref4[k];
                    meta = {
                        line: li,
                        clss: 'git mod' + (boring && ' boring' || ''),
                        git: 'mod',
                        change: mod,
                        boring: boring,
                        length: change.mod.length,
                        click: this.onMetaClick
                    };
                    this.editor.meta.addDiffMeta(meta);
                    li++;
                }
            }
            if (change.add != null) {
                mods = (change.mod != null) && change.mod.length || 0;
                li = change.line - 1 + mods;
                results.push((function() {
                    var l, len2, ref5, results1;
                    ref5 = change.add;
                    results1 = [];
                    for (l = 0, len2 = ref5.length; l < len2; l++) {
                        add = ref5[l];
                        meta = {
                            line: li,
                            clss: 'git add' + (boring && ' boring' || ''),
                            git: 'add',
                            change: add,
                            length: change.add.length,
                            boring: boring,
                            click: this.onMetaClick
                        };
                        this.editor.meta.addDiffMeta(meta);
                        results1.push(li++);
                    }
                    return results1;
                }).call(this));
            } else if (change.del != null) {
                mods = (change.mod != null) && change.mod.length || 1;
                li = change.line - 1 + mods;
                meta = {
                    line: li,
                    clss: 'git del' + (boring && ' boring' || ''),
                    git: 'del',
                    change: change.del,
                    length: 1,
                    boring: boring,
                    click: this.onMetaClick
                };
                results.push(this.editor.meta.addDiffMeta(meta));
            } else {
                results.push(void 0);
            }
        }
        return results;
    };

    Diffbar.prototype.isBoring = function(change) {
        var c, j, k, l, len, len1, len2, ref1, ref2, ref3;
        if (change.mod != null) {
            ref1 = change.mod;
            for (j = 0, len = ref1.length; j < len; j++) {
                c = ref1[j];
                if (!lineDiff.isBoring(c.old, c["new"])) {
                    return false;
                }
            }
        }
        if (change.add != null) {
            ref2 = change.add;
            for (k = 0, len1 = ref2.length; k < len1; k++) {
                c = ref2[k];
                if (!empty(c["new"].trim())) {
                    return false;
                }
            }
        }
        if (change.del != null) {
            ref3 = change.del;
            for (l = 0, len2 = ref3.length; l < len2; l++) {
                c = ref3[l];
                if (!empty(c.old.trim())) {
                    return false;
                }
            }
        }
        return true;
    };

    Diffbar.prototype.onEditorFile = function() {
        return this.update();
    };

    Diffbar.prototype.update = function() {
        if (this.editor.currentFile) {
            this.changes = {
                file: this.editor.currentFile
            };
            return hub.diff(this.editor.currentFile, (function(_this) {
                return function(changes) {
                    if (changes.file !== _this.editor.currentFile) {
                        return {};
                    }
                    _this.changes = changes;
                    _this.updateMetas();
                    _this.updateScroll();
                    return _this.editor.emit('diffbarUpdated', _this.changes);
                };
            })(this));
        } else {
            this.changes = null;
            this.updateMetas();
            this.updateScroll();
            return this.editor.emit('diffbarUpdated', this.changes);
        }
    };

    Diffbar.prototype.updateScroll = function() {
        var alpha, boring, ctx, h, j, len, length, lh, li, meta, ref1, ref2, results, w;
        w = 2;
        h = this.editor.view.clientHeight;
        lh = h / this.editor.numLines();
        ctx = this.elem.getContext('2d');
        this.elem.width = w;
        this.elem.height = h;
        alpha = function(o) {
            return 0.5 + Math.max(0, (16 - o * lh) * (0.5 / 16));
        };
        if (this.changes) {
            ref1 = this.editor.meta.metas;
            results = [];
            for (j = 0, len = ref1.length; j < len; j++) {
                meta = ref1[j];
                if ((meta != null ? (ref2 = meta[2]) != null ? ref2.git : void 0 : void 0) == null) {
                    continue;
                }
                li = meta[0];
                length = meta[2].length;
                boring = meta[2].boring;
                ctx.fillStyle = (function() {
                    switch (meta[2].git) {
                        case 'mod':
                            if (boring) {
                                return "rgba(50, 50,50," + (alpha(length)) + ")";
                            } else {
                                return "rgba( 0,255, 0," + (alpha(length)) + ")";
                            }
                            break;
                        case 'del':
                            if (boring) {
                                return "rgba(50,50,50," + (alpha(length)) + ")";
                            } else {
                                return "rgba(255,0,0," + (alpha(length)) + ")";
                            }
                            break;
                        case 'add':
                            if (boring) {
                                return "rgba(50,50,50," + (alpha(length)) + ")";
                            } else {
                                return "rgba(160,160,255," + (alpha(length)) + ")";
                            }
                    }
                })();
                results.push(ctx.fillRect(0, li * lh, w, lh));
            }
            return results;
        }
    };

    Diffbar.prototype.clear = function() {
        this.clearMetas();
        return this.elem.width = 2;
    };

    Diffbar.prototype.clearMetas = function() {
        return this.editor.meta.delClass('git');
    };

    return Diffbar;

})();

module.exports = Diffbar;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZmJhci5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsa0RBQUE7SUFBQTs7QUFRQSxNQUE0QixPQUFBLENBQVEsS0FBUixDQUE1QixFQUFFLGVBQUYsRUFBUSxpQkFBUixFQUFlLGVBQWYsRUFBcUI7O0FBRXJCLFFBQUEsR0FBVyxPQUFBLENBQVEsbUJBQVI7O0FBQ1gsR0FBQSxHQUFXLE9BQUEsQ0FBUSxZQUFSOztBQUVMO0lBRUMsaUJBQUMsTUFBRDtRQUFDLElBQUMsQ0FBQSxTQUFEOzs7OztRQUVBLElBQUMsQ0FBQSxJQUFELEdBQVEsSUFBQSxDQUFLLFFBQUwsRUFBZTtZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sU0FBUDtTQUFmO1FBQ1IsSUFBQyxDQUFBLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBWixHQUF1QjtRQUN2QixJQUFDLENBQUEsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFaLEdBQW1CO1FBQ25CLElBQUMsQ0FBQSxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQVosR0FBbUI7UUFFbkIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBYixDQUF5QixJQUFDLENBQUEsSUFBMUI7UUFFQSxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxNQUFYLEVBQXdCLElBQUMsQ0FBQSxZQUF6QjtRQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLFFBQVgsRUFBd0IsSUFBQyxDQUFBLE1BQXpCO1FBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsUUFBWCxFQUF3QixJQUFDLENBQUEsTUFBekI7UUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxZQUFYLEVBQXdCLElBQUMsQ0FBQSxZQUF6QjtRQUVBLElBQUksQ0FBQyxFQUFMLENBQVEsV0FBUixFQUF3QixJQUFDLENBQUEsTUFBekI7UUFDQSxJQUFJLENBQUMs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Ozs2QkFjaEIsR0FBRyxDQUFDLFFBQUosQ0FBYSxDQUFiLEVBQWdCLEVBQUEsR0FBSyxFQUFyQixFQUF5QixDQUF6QixFQUE0QixFQUE1QjtBQXRCSjsyQkFGSjs7SUFaVTs7c0JBNENkLEtBQUEsR0FBTyxTQUFBO1FBRUgsSUFBQyxDQUFBLFVBQUQsQ0FBQTtlQUNBLElBQUMsQ0FBQSxJQUFJLENBQUMsS0FBTixHQUFjO0lBSFg7O3NCQUtQLFVBQUEsR0FBWSxTQUFBO2VBQUcsSUFBQyxDQUFBLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBYixDQUFzQixLQUF0QjtJQUFIOzs7Ozs7QUFFaEIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAgICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuMDAwICAgMDAwICAwMDAgIDAwMDAwMCAgICAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMDAwMDBcbjAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbjAwMDAwMDAgICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiMjI1xuXG57IGVsZW0sIGVtcHR5LCBwb3N0LCBmcyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5saW5lRGlmZiA9IHJlcXVpcmUgJy4uL3Rvb2xzL2xpbmVkaWZmJ1xuaHViICAgICAgPSByZXF1aXJlICcuLi9naXQvaHViJ1xuXG5jbGFzcyBEaWZmYmFyXG5cbiAgICBAOiAoQGVkaXRvcikgLT5cblxuICAgICAgICBAZWxlbSA9IGVsZW0gJ2NhbnZhcycsIGNsYXNzOiAnZGlmZmJhcidcbiAgICAgICAgQGVsZW0uc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnXG4gICAgICAgIEBlbGVtLnN0eWxlLmxlZnQgPSAnMCdcbiAgICAgICAgQGVsZW0uc3R5bGUudG9wICA9ICcwJ1xuXG4gICAgICAgIEBlZGl0b3Iudmlldy5hcHBlbmRDaGlsZCBAZWxlbVxuXG4gICAgICAgIEBlZGl0b3Iub24gJ2ZpbGUnICAgICAgIEBvbkVkaXRvckZpbGVcbiAgICAgICAgQGVkaXRvci5vbiAndW5kb25lJyAgICAgQHVwZGF0ZVxuICAgICAgICBAZWRpdG9yLm9uICdyZWRvbmUnICAgICBAdXBkYXRlXG4gICAgICAgIEBlZGl0b3Iub24gJ2xpbmVzU2hvd24nIEB1cGRhdGVTY3JvbGxcbiAgICAgICAgXG4gICAgICAgIHBvc3Qub24gJ2dpdFN0YXR1cycgICAgIEB1cGRhdGVcbiAgICAgICAgcG9zdC5vbiAnZ2l0RGlmZicgICAgICAgQHVwZGF0ZVxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgICAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwICAwMDBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDBcblxuICAgIG9uTWV0YUNsaWNrOiAobWV0YSwgZXZlbnQpID0+XG5cbiAgICAgICAgcmV0dXJuICd1bmhhbmRsZWQnIGlmIGV2ZW50Lm1ldGFLZXlcblxuICAgICAgICBpZiBldmVudC5jdHJsS2V5XG4gICAgICAgICAgICBAZWRpdG9yLnNpbmdsZUN1cnNvckF0UG9zIHJhbmdlU3RhcnRQb3MgbWV0YVxuICAgICAgICAgICAgQGVkaXRvci50b2dnbGVHaXRDaGFuZ2VzSW5MaW5lcyBbbWV0YVswXV1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaWYgbWV0YVsyXS5ib3JpbmcgdGhlbiBAZWRpdG9yLmludmlzaWJsZXM/LmFjdGl2YXRlKClcbiAgICAgICAgICAgIGJsb2NrSW5kaWNlcyA9IEBsaW5lSW5kaWNlc0ZvckJsb2NrQXRMaW5lIG1ldGFbMF1cbiAgICAgICAgICAgIEBlZGl0b3IuZG8uc3RhcnQoKVxuICAgICAgICAgICAgQGVkaXRvci5kby5zZXRDdXJzb3JzIGJsb2NrSW5kaWNlcy5tYXAgKGkpIC0+IFswLGldXG4gICAgICAgICAgICBAZWRpdG9yLmRvLmVuZCgpXG4gICAgICAgICAgICBAZWRpdG9yLnRvZ2dsZUdpdENoYW5nZXNJbkxpbmVzIGJsb2NrSW5kaWNlc1xuICAgICAgICBAXG5cbiAgICBnaXRNZXRhc0F0TGluZUluZGV4OiAobGkpIC0+XG5cbiAgICAgICAgQGVkaXRvci5tZXRhLm1ldGFzQXRMaW5lSW5kZXgobGkpLmZpbHRlciAobSkgLT4gbVsyXS5jbHNzLnN0YXJ0c1dpdGggJ2dpdCdcblxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgICAgICAgICAgMDAwXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgbGluZUluZGljZXNGb3JCbG9ja0F0TGluZTogKGxpKSAtPlxuXG4gICAgICAgIGxpbmVzID0gW11cbiAgICAgICAgaWYgbm90IGVtcHR5IG1ldGFzID0gQGdpdE1ldGFzQXRMaW5lSW5kZXggbGlcblxuICAgICAgICAgICAgdG9nZ2xlZCA9IG1ldGFzWzBdWzJdLnRvZ2dsZWRcbiAgICAgICAgICAgIGxpbmVzLnB1c2ggbGlcblxuICAgICAgICAgICAgYmkgPSBsaS0xXG4gICAgICAgICAgICB3aGlsZSBub3QgZW1wdHkgbWV0YXMgPSBAZ2l0TWV0YXNBdExpbmVJbmRleCBiaVxuICAgICAgICAgICAgICAgIGJyZWFrIGlmIG1ldGFzWzBdWzJdLnRvZ2dsZWQgIT0gdG9nZ2xlZFxuICAgICAgICAgICAgICAgIGxpbmVzLnVuc2hpZnQgYmlcbiAgICAgICAgICAgICAgICBiaS0tXG5cbiAgICAgICAgICAgIGFpID0gbGkrMVxuICAgICAgICAgICAgd2hpbGUgbm90IGVtcHR5IG1ldGFzID0gQGdpdE1ldGFzQXRMaW5lSW5kZXggYWlcbiAgICAgICAgICAgICAgICBicmVhayBpZiBtZXRhc1swXVsyXS50b2dnbGVkICE9IHRvZ2dsZWRcbiAgICAgICAgICAgICAgICBsaW5lcy5wdXNoIGFpXG4gICAgICAgICAgICAgICAgYWkrK1xuICAgICAgICBsaW5lc1xuXG4gICAgIyAwMCAgICAgMDAgIDAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwXG5cbiAgICB1cGRhdGVNZXRhczogLT5cblxuICAgICAgICBAY2xlYXJNZXRhcygpXG5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAY2hhbmdlcz8uY2hhbmdlcz8ubGVuZ3RoXG5cbiAgICAgICAgZm9yIGNoYW5nZSBpbiBAY2hhbmdlcy5jaGFuZ2VzXG5cbiAgICAgICAgICAgIGJvcmluZyA9IEBpc0JvcmluZyBjaGFuZ2VcblxuICAgICAgICAgICAgaWYgY2hhbmdlLm1vZD9cblxuICAgICAgICAgICAgICAgIGxpID0gY2hhbmdlLmxpbmUtMVxuXG4gICAgICAgICAgICAgICAgZm9yIG1vZCBpbiBjaGFuZ2UubW9kXG5cbiAgICAgICAgICAgICAgICAgICAgbWV0YSA9XG4gICAgICAgICAgICAgICAgICAgICAgICBsaW5lOiBsaVxuICAgICAgICAgICAgICAgICAgICAgICAgY2xzczogJ2dpdCBtb2QnICsgKGJvcmluZyBhbmQgJyBib3JpbmcnIG9yICcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgZ2l0OiAgJ21vZCdcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoYW5nZTogbW9kXG4gICAgICAgICAgICAgICAgICAgICAgICBib3Jpbmc6IGJvcmluZ1xuICAgICAgICAgICAgICAgICAgICAgICAgbGVuZ3RoOiBjaGFuZ2UubW9kLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICAgICAgY2xpY2s6IEBvbk1ldGFDbGlja1xuICAgICAgICAgICAgICAgICAgICBAZWRpdG9yLm1ldGEuYWRkRGlmZk1ldGEgbWV0YVxuICAgICAgICAgICAgICAgICAgICBsaSsrXG5cbiAgICAgICAgICAgIGlmIGNoYW5nZS5hZGQ/XG5cbiAgICAgICAgICAgICAgICBtb2RzID0gY2hhbmdlLm1vZD8gYW5kIGNoYW5nZS5tb2QubGVuZ3RoIG9yIDBcbiAgICAgICAgICAgICAgICBsaSA9IGNoYW5nZS5saW5lIC0gMSArIG1vZHNcblxuICAgICAgICAgICAgICAgIGZvciBhZGQgaW4gY2hhbmdlLmFkZFxuICAgICAgICAgICAgICAgICAgICBtZXRhID1cbiAgICAgICAgICAgICAgICAgICAgICAgIGxpbmU6IGxpXG4gICAgICAgICAgICAgICAgICAgICAgICBjbHNzOiAnZ2l0IGFkZCcgKyAoYm9yaW5nIGFuZCAnIGJvcmluZycgb3IgJycpXG4gICAgICAgICAgICAgICAgICAgICAgICBnaXQ6ICAnYWRkJ1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hhbmdlOiBhZGRcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlbmd0aDogY2hhbmdlLmFkZC5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvcmluZzogYm9yaW5nXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGljazogQG9uTWV0YUNsaWNrXG5cbiAgICAgICAgICAgICAgICAgICAgQGVkaXRvci5tZXRhLmFkZERpZmZNZXRhIG1ldGFcbiAgICAgICAgICAgICAgICAgICAgbGkrK1xuXG4gICAgICAgICAgICBlbHNlIGlmIGNoYW5nZS5kZWw/XG5cbiAgICAgICAgICAgICAgICBtb2RzID0gY2hhbmdlLm1vZD8gYW5kIGNoYW5nZS5tb2QubGVuZ3RoIG9yIDFcbiAgICAgICAgICAgICAgICBsaSA9IGNoYW5nZS5saW5lIC0gMSArIG1vZHNcblxuICAgICAgICAgICAgICAgIG1ldGEgPVxuICAgICAgICAgICAgICAgICAgICBsaW5lOiBsaVxuICAgICAgICAgICAgICAgICAgICBjbHNzOiAnZ2l0IGRlbCcgKyAoYm9yaW5nIGFuZCAnIGJvcmluZycgb3IgJycpXG4gICAgICAgICAgICAgICAgICAgIGdpdDogICdkZWwnXG4gICAgICAgICAgICAgICAgICAgIGNoYW5nZTogY2hhbmdlLmRlbFxuICAgICAgICAgICAgICAgICAgICBsZW5ndGg6IDFcbiAgICAgICAgICAgICAgICAgICAgYm9yaW5nOiBib3JpbmdcbiAgICAgICAgICAgICAgICAgICAgY2xpY2s6IEBvbk1ldGFDbGlja1xuXG4gICAgICAgICAgICAgICAgQGVkaXRvci5tZXRhLmFkZERpZmZNZXRhIG1ldGFcblxuICAgICMgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDBcblxuICAgIGlzQm9yaW5nOiAoY2hhbmdlKSAtPlxuXG4gICAgICAgIGlmIGNoYW5nZS5tb2Q/XG4gICAgICAgICAgICBmb3IgYyBpbiBjaGFuZ2UubW9kXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlIGlmIG5vdCBsaW5lRGlmZi5pc0JvcmluZyBjLm9sZCwgYy5uZXdcblxuICAgICAgICBpZiBjaGFuZ2UuYWRkP1xuICAgICAgICAgICAgZm9yIGMgaW4gY2hhbmdlLmFkZFxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZSBpZiBub3QgZW1wdHkgYy5uZXcudHJpbSgpXG5cbiAgICAgICAgaWYgY2hhbmdlLmRlbD9cbiAgICAgICAgICAgIGZvciBjIGluIGNoYW5nZS5kZWxcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2UgaWYgbm90IGVtcHR5IGMub2xkLnRyaW0oKVxuXG4gICAgICAgIHRydWVcblxuICAgICMgMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMFxuICAgICMgMDAwMDAwICAgIDAwMCAgMDAwICAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuXG4gICAgb25FZGl0b3JGaWxlOiA9PiBAdXBkYXRlKClcblxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAgICAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG5cbiAgICB1cGRhdGU6ID0+XG5cbiAgICAgICAgaWYgQGVkaXRvci5jdXJyZW50RmlsZVxuXG4gICAgICAgICAgICBAY2hhbmdlcyA9IGZpbGU6QGVkaXRvci5jdXJyZW50RmlsZVxuXG4gICAgICAgICAgICBodWIuZGlmZiBAZWRpdG9yLmN1cnJlbnRGaWxlLCAoY2hhbmdlcykgPT5cblxuICAgICAgICAgICAgICAgIGlmIGNoYW5nZXMuZmlsZSAhPSBAZWRpdG9yLmN1cnJlbnRGaWxlIHRoZW4gcmV0dXJuIHt9XG5cbiAgICAgICAgICAgICAgICBAY2hhbmdlcyA9IGNoYW5nZXNcblxuICAgICAgICAgICAgICAgIEB1cGRhdGVNZXRhcygpXG4gICAgICAgICAgICAgICAgQHVwZGF0ZVNjcm9sbCgpXG4gICAgICAgICAgICAgICAgQGVkaXRvci5lbWl0ICdkaWZmYmFyVXBkYXRlZCcsIEBjaGFuZ2VzICMgb25seSB1c2VkIGluIHRlc3RzXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBjaGFuZ2VzID0gbnVsbFxuICAgICAgICAgICAgQHVwZGF0ZU1ldGFzKClcbiAgICAgICAgICAgIEB1cGRhdGVTY3JvbGwoKVxuICAgICAgICAgICAgQGVkaXRvci5lbWl0ICdkaWZmYmFyVXBkYXRlZCcsIEBjaGFuZ2VzICMgb25seSB1c2VkIGluIHRlc3RzXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDBcbiAgICAjICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgdXBkYXRlU2Nyb2xsOiA9PlxuXG4gICAgICAgIHcgID0gMlxuICAgICAgICBoICA9IEBlZGl0b3Iudmlldy5jbGllbnRIZWlnaHRcbiAgICAgICAgbGggPSBoIC8gQGVkaXRvci5udW1MaW5lcygpXG5cbiAgICAgICAgY3R4ID0gQGVsZW0uZ2V0Q29udGV4dCAnMmQnXG4gICAgICAgIEBlbGVtLndpZHRoICA9IHdcbiAgICAgICAgQGVsZW0uaGVpZ2h0ID0gaFxuXG4gICAgICAgIGFscGhhID0gKG8pIC0+IDAuNSArIE1hdGgubWF4IDAsICgxNi1vKmxoKSooMC41LzE2KVxuXG4gICAgICAgIGlmIEBjaGFuZ2VzXG5cbiAgICAgICAgICAgIGZvciBtZXRhIGluIEBlZGl0b3IubWV0YS5tZXRhc1xuXG4gICAgICAgICAgICAgICAgY29udGludWUgaWYgbm90IG1ldGE/WzJdPy5naXQ/XG5cbiAgICAgICAgICAgICAgICBsaSAgICAgPSBtZXRhWzBdXG4gICAgICAgICAgICAgICAgbGVuZ3RoID0gbWV0YVsyXS5sZW5ndGhcbiAgICAgICAgICAgICAgICBib3JpbmcgPSBtZXRhWzJdLmJvcmluZ1xuXG4gICAgICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IHN3aXRjaCBtZXRhWzJdLmdpdFxuXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gJ21vZCdcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIGJvcmluZyB0aGVuIFwicmdiYSg1MCwgNTAsNTAsI3thbHBoYSBsZW5ndGh9KVwiXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlICAgICAgICAgICBcInJnYmEoIDAsMjU1LCAwLCN7YWxwaGEgbGVuZ3RofSlcIlxuXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gJ2RlbCdcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIGJvcmluZyB0aGVuIFwicmdiYSg1MCw1MCw1MCwje2FscGhhIGxlbmd0aH0pXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgICAgICAgICAgIFwicmdiYSgyNTUsMCwwLCN7YWxwaGEgbGVuZ3RofSlcIlxuXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gJ2FkZCdcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIGJvcmluZyB0aGVuIFwicmdiYSg1MCw1MCw1MCwje2FscGhhIGxlbmd0aH0pXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgICAgICAgICAgIFwicmdiYSgxNjAsMTYwLDI1NSwje2FscGhhIGxlbmd0aH0pXCJcblxuICAgICAgICAgICAgICAgIGN0eC5maWxsUmVjdCAwLCBsaSAqIGxoLCB3LCBsaFxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG5cbiAgICBjbGVhcjogLT5cblxuICAgICAgICBAY2xlYXJNZXRhcygpXG4gICAgICAgIEBlbGVtLndpZHRoID0gMlxuXG4gICAgY2xlYXJNZXRhczogLT4gQGVkaXRvci5tZXRhLmRlbENsYXNzICdnaXQnXG5cbm1vZHVsZS5leHBvcnRzID0gRGlmZmJhclxuIl19
//# sourceURL=../../coffee/editor/diffbar.coffee