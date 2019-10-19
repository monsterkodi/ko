// koffee 1.3.0

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZmJhci5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsa0RBQUE7SUFBQTs7QUFRQSxNQUE0QixPQUFBLENBQVEsS0FBUixDQUE1QixFQUFFLGVBQUYsRUFBUSxpQkFBUixFQUFlLGVBQWYsRUFBcUI7O0FBRXJCLFFBQUEsR0FBVyxPQUFBLENBQVEsbUJBQVI7O0FBQ1gsR0FBQSxHQUFXLE9BQUEsQ0FBUSxZQUFSOztBQUVMO0lBRVcsaUJBQUMsTUFBRDtRQUFDLElBQUMsQ0FBQSxTQUFEOzs7OztRQUVWLElBQUMsQ0FBQSxJQUFELEdBQVEsSUFBQSxDQUFLLFFBQUwsRUFBZTtZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sU0FBUDtTQUFmO1FBQ1IsSUFBQyxDQUFBLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBWixHQUF1QjtRQUN2QixJQUFDLENBQUEsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFaLEdBQW1CO1FBQ25CLElBQUMsQ0FBQSxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQVosR0FBbUI7UUFFbkIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBYixDQUF5QixJQUFDLENBQUEsSUFBMUI7UUFFQSxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxNQUFYLEVBQXlCLElBQUMsQ0FBQSxZQUExQjtRQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLFFBQVgsRUFBeUIsSUFBQyxDQUFBLE1BQTFCO1FBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsUUFBWCxFQUF5QixJQUFDLENBQUEsTUFBMUI7UUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxZQUFYLEVBQXlCLElBQUMsQ0FBQSxZQUExQjtRQUVBLElBQUksQ0FBQyxFQUFMLENBQVEsV0FBUixFQUF5QixJQUFDLENBQUEsTUFBMUI7UUFDQSxJQUFJLENBQUMsRUFBTCxDQUFRLFNBQVIsRUFBeUIsSUFBQyxDQUFBLE1BQTFCO0lBZlM7O3NCQXVCYixXQUFBLEdBQWEsU0FBQyxJQUFELEVBQU8sS0FBUDtBQUVULFlBQUE7UUFBQSxJQUFzQixLQUFLLENBQUMsT0FBNUI7QUFBQSxtQkFBTyxZQUFQOztRQUVBLElBQUcsS0FBSyxDQUFDLE9BQVQ7WUFDSSxJQUFDLENBQUEsTUFBTSxDQUFDLGlCQUFSLENBQTBCLGFBQUEsQ0FBYyxJQUFkLENBQTFCO1lBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyx1QkFBUixDQUFnQyxDQUFDLElBQUssQ0FBQSxDQUFBLENBQU4sQ0FBaEMsRUFGSjtTQUFBLE1BQUE7WUFJSSxJQUFHLElBQUssQ0FBQSxDQUFBLENBQUUsQ0FBQyxNQUFYOzt3QkFBeUMsQ0FBRSxRQUFwQixDQUFBO2lCQUF2Qjs7WUFDQSxZQUFBLEdBQWUsSUFBQyxDQUFBLHlCQUFELENBQTJCLElBQUssQ0FBQSxDQUFBLENBQWhDO1lBQ2YsSUFBQyxDQUFBLE1BQU0sRUFBQyxFQUFELEVBQUcsQ0FBQyxLQUFYLENBQUE7WUFDQSxJQUFDLENBQUEsTUFBTSxFQUFDLEVBQUQsRUFBRyxDQUFDLFVBQVgsQ0FBc0IsWUFBWSxDQUFDLEdBQWIsQ0FBaUIsU0FBQyxDQUFEO3VCQUFPLENBQUMsQ0FBRCxFQUFHLENBQUg7WUFBUCxDQUFqQixDQUF0QjtZQUNBLElBQUMsQ0FBQSxNQUFNLEVBQUMsRUFBRCxFQUFHLENBQUMsR0FBWCxDQUFBO1lBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyx1QkFBUixDQUFnQyxZQUFoQyxFQVRKOztlQVVBO0lBZFM7O3NCQWdCYixtQkFBQSxHQUFxQixTQUFDLEVBQUQ7ZUFFakIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxJQUFJLENBQUMsZ0JBQWIsQ0FBOEIsRUFBOUIsQ0FBaUMsQ0FBQyxNQUFsQyxDQUF5QyxTQUFDLENBQUQ7bUJBQU8sQ0FBRSxDQUFBLENBQUEsQ0FBRSxDQUFDLElBQUksQ0FBQyxVQUFWLENBQXFCLEtBQXJCO1FBQVAsQ0FBekM7SUFGaUI7O3NCQVVyQix5QkFBQSxHQUEyQixTQUFDLEVBQUQ7QUFFdkIsWUFBQTtRQUFBLEtBQUEsR0FBUTtRQUNSLElBQUcsQ0FBSSxLQUFBLENBQU0sS0FBQSxHQUFRLElBQUMsQ0FBQSxtQkFBRCxDQUFxQixFQUFyQixDQUFkLENBQVA7WUFFSSxPQUFBLEdBQVUsS0FBTSxDQUFBLENBQUEsQ0FBRyxDQUFBLENBQUEsQ0FBRSxDQUFDO1lBQ3RCLEtBQUssQ0FBQyxJQUFOLENBQVcsRUFBWDtZQUVBLEVBQUEsR0FBSyxFQUFBLEdBQUc7QUFDUixtQkFBTSxDQUFJLEtBQUEsQ0FBTSxLQUFBLEdBQVEsSUFBQyxDQUFBLG1CQUFELENBQXFCLEVBQXJCLENBQWQsQ0FBVjtnQkFDSSxJQUFTLEtBQU0sQ0FBQSxDQUFBLENBQUcsQ0FBQSxDQUFBLENBQUUsQ0FBQyxPQUFaLEtBQXVCLE9BQWhDO0FBQUEsMEJBQUE7O2dCQUNBLEtBQUssQ0FBQyxPQUFOLENBQWMsRUFBZDtnQkFDQSxFQUFBO1lBSEo7WUFLQSxFQUFBLEdBQUssRUFBQSxHQUFHO0FBQ1IsbUJBQU0sQ0FBSSxLQUFBLENBQU0sS0FBQSxHQUFRLElBQUMsQ0FBQSxtQkFBRCxDQUFxQixFQUFyQixDQUFkLENBQVY7Z0JBQ0ksSUFBUyxLQUFNLENBQUEsQ0FBQSxDQUFHLENBQUEsQ0FBQSxDQUFFLENBQUMsT0FBWixLQUF1QixPQUFoQztBQUFBLDBCQUFBOztnQkFDQSxLQUFLLENBQUMsSUFBTixDQUFXLEVBQVg7Z0JBQ0EsRUFBQTtZQUhKLENBWko7O2VBZ0JBO0lBbkJ1Qjs7c0JBMkIzQixXQUFBLEdBQWEsU0FBQTtBQUVULFlBQUE7UUFBQSxJQUFDLENBQUEsVUFBRCxDQUFBO1FBRUEsSUFBVSxzRUFBcUIsQ0FBRSx5QkFBakM7QUFBQSxtQkFBQTs7QUFFQTtBQUFBO2FBQUEsc0NBQUE7O1lBRUksTUFBQSxHQUFTLElBQUMsQ0FBQSxRQUFELENBQVUsTUFBVjtZQUVULElBQUcsa0JBQUg7Z0JBRUksRUFBQSxHQUFLLE1BQU0sQ0FBQyxJQUFQLEdBQVk7QUFFakI7QUFBQSxxQkFBQSx3Q0FBQTs7b0JBRUksSUFBQSxHQUNJO3dCQUFBLElBQUEsRUFBTSxFQUFOO3dCQUNBLElBQUEsRUFBTSxTQUFBLEdBQVksQ0FBQyxNQUFBLElBQVcsU0FBWCxJQUF3QixFQUF6QixDQURsQjt3QkFFQSxHQUFBLEVBQU0sS0FGTjt3QkFHQSxNQUFBLEVBQVEsR0FIUjt3QkFJQSxNQUFBLEVBQVEsTUFKUjt3QkFLQSxNQUFBLEVBQVEsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUxuQjt3QkFNQSxLQUFBLEVBQU8sSUFBQyxDQUFBLFdBTlI7O29CQU9KLElBQUMsQ0FBQSxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQWIsQ0FBeUIsSUFBekI7b0JBQ0EsRUFBQTtBQVhKLGlCQUpKOztZQWlCQSxJQUFHLGtCQUFIO2dCQUVJLElBQUEsR0FBTyxvQkFBQSxJQUFnQixNQUFNLENBQUMsR0FBRyxDQUFDLE1BQTNCLElBQXFDO2dCQUM1QyxFQUFBLEdBQUssTUFBTSxDQUFDLElBQVAsR0FBYyxDQUFkLEdBQWtCOzs7QUFFdkI7QUFBQTt5QkFBQSx3Q0FBQTs7d0JBQ0ksSUFBQSxHQUNJOzRCQUFBLElBQUEsRUFBTSxFQUFOOzRCQUNBLElBQUEsRUFBTSxTQUFBLEdBQVksQ0FBQyxNQUFBLElBQVcsU0FBWCxJQUF3QixFQUF6QixDQURsQjs0QkFFQSxHQUFBLEVBQU0sS0FGTjs0QkFHQSxNQUFBLEVBQVEsR0FIUjs0QkFJQSxNQUFBLEVBQVEsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUpuQjs0QkFLQSxNQUFBLEVBQVEsTUFMUjs0QkFNQSxLQUFBLEVBQU8sSUFBQyxDQUFBLFdBTlI7O3dCQVFKLElBQUMsQ0FBQSxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQWIsQ0FBeUIsSUFBekI7c0NBQ0EsRUFBQTtBQVhKOzsrQkFMSjthQUFBLE1Ba0JLLElBQUcsa0JBQUg7Z0JBRUQsSUFBQSxHQUFPLG9CQUFBLElBQWdCLE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBM0IsSUFBcUM7Z0JBQzVDLEVBQUEsR0FBSyxNQUFNLENBQUMsSUFBUCxHQUFjLENBQWQsR0FBa0I7Z0JBRXZCLElBQUEsR0FDSTtvQkFBQSxJQUFBLEVBQU0sRUFBTjtvQkFDQSxJQUFBLEVBQU0sU0FBQSxHQUFZLENBQUMsTUFBQSxJQUFXLFNBQVgsSUFBd0IsRUFBekIsQ0FEbEI7b0JBRUEsR0FBQSxFQUFNLEtBRk47b0JBR0EsTUFBQSxFQUFRLE1BQU0sQ0FBQyxHQUhmO29CQUlBLE1BQUEsRUFBUSxDQUpSO29CQUtBLE1BQUEsRUFBUSxNQUxSO29CQU1BLEtBQUEsRUFBTyxJQUFDLENBQUEsV0FOUjs7NkJBUUosSUFBQyxDQUFBLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBYixDQUF5QixJQUF6QixHQWRDO2FBQUEsTUFBQTtxQ0FBQTs7QUF2Q1Q7O0lBTlM7O3NCQW1FYixRQUFBLEdBQVUsU0FBQyxNQUFEO0FBRU4sWUFBQTtRQUFBLElBQUcsa0JBQUg7QUFDSTtBQUFBLGlCQUFBLHNDQUFBOztnQkFDSSxJQUFnQixDQUFJLFFBQVEsQ0FBQyxRQUFULENBQWtCLENBQUMsQ0FBQyxHQUFwQixFQUF5QixDQUFDLEVBQUMsR0FBRCxFQUExQixDQUFwQjtBQUFBLDJCQUFPLE1BQVA7O0FBREosYUFESjs7UUFJQSxJQUFHLGtCQUFIO0FBQ0k7QUFBQSxpQkFBQSx3Q0FBQTs7Z0JBQ0ksSUFBZ0IsQ0FBSSxLQUFBLENBQU0sQ0FBQyxFQUFDLEdBQUQsRUFBSSxDQUFDLElBQU4sQ0FBQSxDQUFOLENBQXBCO0FBQUEsMkJBQU8sTUFBUDs7QUFESixhQURKOztRQUlBLElBQUcsa0JBQUg7QUFDSTtBQUFBLGlCQUFBLHdDQUFBOztnQkFDSSxJQUFnQixDQUFJLEtBQUEsQ0FBTSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQU4sQ0FBQSxDQUFOLENBQXBCO0FBQUEsMkJBQU8sTUFBUDs7QUFESixhQURKOztlQUlBO0lBZE07O3NCQXNCVixZQUFBLEdBQWMsU0FBQTtlQUFHLElBQUMsQ0FBQSxNQUFELENBQUE7SUFBSDs7c0JBUWQsTUFBQSxHQUFRLFNBQUE7UUFFSixJQUFHLElBQUMsQ0FBQSxNQUFNLENBQUMsV0FBWDtZQUVJLElBQUMsQ0FBQSxPQUFELEdBQVc7Z0JBQUEsSUFBQSxFQUFLLElBQUMsQ0FBQSxNQUFNLENBQUMsV0FBYjs7bUJBRVgsR0FBRyxDQUFDLElBQUosQ0FBUyxJQUFDLENBQUEsTUFBTSxDQUFDLFdBQWpCLEVBQThCLENBQUEsU0FBQSxLQUFBO3VCQUFBLFNBQUMsT0FBRDtvQkFFMUIsSUFBRyxPQUFPLENBQUMsSUFBUixLQUFnQixLQUFDLENBQUEsTUFBTSxDQUFDLFdBQTNCO0FBQTRDLCtCQUFPLEdBQW5EOztvQkFFQSxLQUFDLENBQUEsT0FBRCxHQUFXO29CQUVYLEtBQUMsQ0FBQSxXQUFELENBQUE7b0JBQ0EsS0FBQyxDQUFBLFlBQUQsQ0FBQTsyQkFDQSxLQUFDLENBQUEsTUFBTSxDQUFDLElBQVIsQ0FBYSxnQkFBYixFQUErQixLQUFDLENBQUEsT0FBaEM7Z0JBUjBCO1lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUE5QixFQUpKO1NBQUEsTUFBQTtZQWNJLElBQUMsQ0FBQSxPQUFELEdBQVc7WUFDWCxJQUFDLENBQUEsV0FBRCxDQUFBO1lBQ0EsSUFBQyxDQUFBLFlBQUQsQ0FBQTttQkFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLElBQVIsQ0FBYSxnQkFBYixFQUErQixJQUFDLENBQUEsT0FBaEMsRUFqQko7O0lBRkk7O3NCQTJCUixZQUFBLEdBQWMsU0FBQTtBQUVWLFlBQUE7UUFBQSxDQUFBLEdBQUs7UUFDTCxDQUFBLEdBQUssSUFBQyxDQUFBLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDbEIsRUFBQSxHQUFLLENBQUEsR0FBSSxJQUFDLENBQUEsTUFBTSxDQUFDLFFBQVIsQ0FBQTtRQUVULEdBQUEsR0FBTSxJQUFDLENBQUEsSUFBSSxDQUFDLFVBQU4sQ0FBaUIsSUFBakI7UUFDTixJQUFDLENBQUEsSUFBSSxDQUFDLEtBQU4sR0FBZTtRQUNmLElBQUMsQ0FBQSxJQUFJLENBQUMsTUFBTixHQUFlO1FBRWYsS0FBQSxHQUFRLFNBQUMsQ0FBRDttQkFBTyxHQUFBLEdBQU0sSUFBSSxDQUFDLEdBQUwsQ0FBUyxDQUFULEVBQVksQ0FBQyxFQUFBLEdBQUcsQ0FBQSxHQUFFLEVBQU4sQ0FBQSxHQUFVLENBQUMsR0FBQSxHQUFJLEVBQUwsQ0FBdEI7UUFBYjtRQUVSLElBQUcsSUFBQyxDQUFBLE9BQUo7QUFFSTtBQUFBO2lCQUFBLHNDQUFBOztnQkFFSSxJQUFnQiw4RUFBaEI7QUFBQSw2QkFBQTs7Z0JBRUEsRUFBQSxHQUFTLElBQUssQ0FBQSxDQUFBO2dCQUNkLE1BQUEsR0FBUyxJQUFLLENBQUEsQ0FBQSxDQUFFLENBQUM7Z0JBQ2pCLE1BQUEsR0FBUyxJQUFLLENBQUEsQ0FBQSxDQUFFLENBQUM7Z0JBRWpCLEdBQUcsQ0FBQyxTQUFKO0FBQWdCLDRCQUFPLElBQUssQ0FBQSxDQUFBLENBQUUsQ0FBQyxHQUFmO0FBQUEsNkJBRVAsS0FGTzs0QkFHUixJQUFHLE1BQUg7dUNBQWUsaUJBQUEsR0FBaUIsQ0FBQyxLQUFBLENBQU0sTUFBTixDQUFELENBQWpCLEdBQStCLElBQTlDOzZCQUFBLE1BQUE7dUNBQ2UsaUJBQUEsR0FBaUIsQ0FBQyxLQUFBLENBQU0sTUFBTixDQUFELENBQWpCLEdBQStCLElBRDlDOztBQURDO0FBRk8sNkJBTVAsS0FOTzs0QkFPUixJQUFHLE1BQUg7dUNBQWUsZ0JBQUEsR0FBZ0IsQ0FBQyxLQUFBLENBQU0sTUFBTixDQUFELENBQWhCLEdBQThCLElBQTdDOzZCQUFBLE1BQUE7dUNBQ2UsZUFBQSxHQUFlLENBQUMsS0FBQSxDQUFNLE1BQU4sQ0FBRCxDQUFmLEdBQTZCLElBRDVDOztBQURDO0FBTk8sNkJBVVAsS0FWTzs0QkFXUixJQUFHLE1BQUg7dUNBQWUsZ0JBQUEsR0FBZ0IsQ0FBQyxLQUFBLENBQU0sTUFBTixDQUFELENBQWhCLEdBQThCLElBQTdDOzZCQUFBLE1BQUE7dUNBQ2UsbUJBQUEsR0FBbUIsQ0FBQyxLQUFBLENBQU0sTUFBTixDQUFELENBQW5CLEdBQWlDLElBRGhEOztBQVhROzs2QkFjaEIsR0FBRyxDQUFDLFFBQUosQ0FBYSxDQUFiLEVBQWdCLEVBQUEsR0FBSyxFQUFyQixFQUF5QixDQUF6QixFQUE0QixFQUE1QjtBQXRCSjsyQkFGSjs7SUFaVTs7c0JBNENkLEtBQUEsR0FBTyxTQUFBO1FBRUgsSUFBQyxDQUFBLFVBQUQsQ0FBQTtlQUNBLElBQUMsQ0FBQSxJQUFJLENBQUMsS0FBTixHQUFjO0lBSFg7O3NCQUtQLFVBQUEsR0FBWSxTQUFBO2VBQUcsSUFBQyxDQUFBLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBYixDQUFzQixLQUF0QjtJQUFIOzs7Ozs7QUFFaEIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAgICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuMDAwICAgMDAwICAwMDAgIDAwMDAwMCAgICAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMDAwMDBcbjAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbjAwMDAwMDAgICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiMjI1xuXG57IGVsZW0sIGVtcHR5LCBwb3N0LCBmcyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5saW5lRGlmZiA9IHJlcXVpcmUgJy4uL3Rvb2xzL2xpbmVkaWZmJ1xuaHViICAgICAgPSByZXF1aXJlICcuLi9naXQvaHViJ1xuXG5jbGFzcyBEaWZmYmFyXG5cbiAgICBjb25zdHJ1Y3RvcjogKEBlZGl0b3IpIC0+XG5cbiAgICAgICAgQGVsZW0gPSBlbGVtICdjYW52YXMnLCBjbGFzczogJ2RpZmZiYXInXG4gICAgICAgIEBlbGVtLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJ1xuICAgICAgICBAZWxlbS5zdHlsZS5sZWZ0ID0gJzAnXG4gICAgICAgIEBlbGVtLnN0eWxlLnRvcCAgPSAnMCdcblxuICAgICAgICBAZWRpdG9yLnZpZXcuYXBwZW5kQ2hpbGQgQGVsZW1cblxuICAgICAgICBAZWRpdG9yLm9uICdmaWxlJywgICAgICAgQG9uRWRpdG9yRmlsZVxuICAgICAgICBAZWRpdG9yLm9uICd1bmRvbmUnLCAgICAgQHVwZGF0ZVxuICAgICAgICBAZWRpdG9yLm9uICdyZWRvbmUnLCAgICAgQHVwZGF0ZVxuICAgICAgICBAZWRpdG9yLm9uICdsaW5lc1Nob3duJywgQHVwZGF0ZVNjcm9sbFxuXG4gICAgICAgIHBvc3Qub24gJ2dpdFN0YXR1cycsICAgICBAdXBkYXRlXG4gICAgICAgIHBvc3Qub24gJ2dpdERpZmYnLCAgICAgICBAdXBkYXRlXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAgICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgb25NZXRhQ2xpY2s6IChtZXRhLCBldmVudCkgPT5cblxuICAgICAgICByZXR1cm4gJ3VuaGFuZGxlZCcgaWYgZXZlbnQubWV0YUtleVxuXG4gICAgICAgIGlmIGV2ZW50LmN0cmxLZXlcbiAgICAgICAgICAgIEBlZGl0b3Iuc2luZ2xlQ3Vyc29yQXRQb3MgcmFuZ2VTdGFydFBvcyBtZXRhXG4gICAgICAgICAgICBAZWRpdG9yLnRvZ2dsZUdpdENoYW5nZXNJbkxpbmVzIFttZXRhWzBdXVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBpZiBtZXRhWzJdLmJvcmluZyB0aGVuIEBlZGl0b3IuaW52aXNpYmxlcz8uYWN0aXZhdGUoKVxuICAgICAgICAgICAgYmxvY2tJbmRpY2VzID0gQGxpbmVJbmRpY2VzRm9yQmxvY2tBdExpbmUgbWV0YVswXVxuICAgICAgICAgICAgQGVkaXRvci5kby5zdGFydCgpXG4gICAgICAgICAgICBAZWRpdG9yLmRvLnNldEN1cnNvcnMgYmxvY2tJbmRpY2VzLm1hcCAoaSkgLT4gWzAsaV1cbiAgICAgICAgICAgIEBlZGl0b3IuZG8uZW5kKClcbiAgICAgICAgICAgIEBlZGl0b3IudG9nZ2xlR2l0Q2hhbmdlc0luTGluZXMgYmxvY2tJbmRpY2VzXG4gICAgICAgIEBcblxuICAgIGdpdE1ldGFzQXRMaW5lSW5kZXg6IChsaSkgLT5cblxuICAgICAgICBAZWRpdG9yLm1ldGEubWV0YXNBdExpbmVJbmRleChsaSkuZmlsdGVyIChtKSAtPiBtWzJdLmNsc3Muc3RhcnRzV2l0aCAnZ2l0J1xuXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgICAgICAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwXG5cbiAgICBsaW5lSW5kaWNlc0ZvckJsb2NrQXRMaW5lOiAobGkpIC0+XG5cbiAgICAgICAgbGluZXMgPSBbXVxuICAgICAgICBpZiBub3QgZW1wdHkgbWV0YXMgPSBAZ2l0TWV0YXNBdExpbmVJbmRleCBsaVxuXG4gICAgICAgICAgICB0b2dnbGVkID0gbWV0YXNbMF1bMl0udG9nZ2xlZFxuICAgICAgICAgICAgbGluZXMucHVzaCBsaVxuXG4gICAgICAgICAgICBiaSA9IGxpLTFcbiAgICAgICAgICAgIHdoaWxlIG5vdCBlbXB0eSBtZXRhcyA9IEBnaXRNZXRhc0F0TGluZUluZGV4IGJpXG4gICAgICAgICAgICAgICAgYnJlYWsgaWYgbWV0YXNbMF1bMl0udG9nZ2xlZCAhPSB0b2dnbGVkXG4gICAgICAgICAgICAgICAgbGluZXMudW5zaGlmdCBiaVxuICAgICAgICAgICAgICAgIGJpLS1cblxuICAgICAgICAgICAgYWkgPSBsaSsxXG4gICAgICAgICAgICB3aGlsZSBub3QgZW1wdHkgbWV0YXMgPSBAZ2l0TWV0YXNBdExpbmVJbmRleCBhaVxuICAgICAgICAgICAgICAgIGJyZWFrIGlmIG1ldGFzWzBdWzJdLnRvZ2dsZWQgIT0gdG9nZ2xlZFxuICAgICAgICAgICAgICAgIGxpbmVzLnB1c2ggYWlcbiAgICAgICAgICAgICAgICBhaSsrXG4gICAgICAgIGxpbmVzXG5cbiAgICAjIDAwICAgICAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDBcblxuICAgIHVwZGF0ZU1ldGFzOiAtPlxuXG4gICAgICAgIEBjbGVhck1ldGFzKClcblxuICAgICAgICByZXR1cm4gaWYgbm90IEBjaGFuZ2VzPy5jaGFuZ2VzPy5sZW5ndGhcblxuICAgICAgICBmb3IgY2hhbmdlIGluIEBjaGFuZ2VzLmNoYW5nZXNcblxuICAgICAgICAgICAgYm9yaW5nID0gQGlzQm9yaW5nIGNoYW5nZVxuXG4gICAgICAgICAgICBpZiBjaGFuZ2UubW9kP1xuXG4gICAgICAgICAgICAgICAgbGkgPSBjaGFuZ2UubGluZS0xXG5cbiAgICAgICAgICAgICAgICBmb3IgbW9kIGluIGNoYW5nZS5tb2RcblxuICAgICAgICAgICAgICAgICAgICBtZXRhID1cbiAgICAgICAgICAgICAgICAgICAgICAgIGxpbmU6IGxpXG4gICAgICAgICAgICAgICAgICAgICAgICBjbHNzOiAnZ2l0IG1vZCcgKyAoYm9yaW5nIGFuZCAnIGJvcmluZycgb3IgJycpXG4gICAgICAgICAgICAgICAgICAgICAgICBnaXQ6ICAnbW9kJ1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hhbmdlOiBtb2RcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvcmluZzogYm9yaW5nXG4gICAgICAgICAgICAgICAgICAgICAgICBsZW5ndGg6IGNoYW5nZS5tb2QubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGljazogQG9uTWV0YUNsaWNrXG4gICAgICAgICAgICAgICAgICAgIEBlZGl0b3IubWV0YS5hZGREaWZmTWV0YSBtZXRhXG4gICAgICAgICAgICAgICAgICAgIGxpKytcblxuICAgICAgICAgICAgaWYgY2hhbmdlLmFkZD9cblxuICAgICAgICAgICAgICAgIG1vZHMgPSBjaGFuZ2UubW9kPyBhbmQgY2hhbmdlLm1vZC5sZW5ndGggb3IgMFxuICAgICAgICAgICAgICAgIGxpID0gY2hhbmdlLmxpbmUgLSAxICsgbW9kc1xuXG4gICAgICAgICAgICAgICAgZm9yIGFkZCBpbiBjaGFuZ2UuYWRkXG4gICAgICAgICAgICAgICAgICAgIG1ldGEgPVxuICAgICAgICAgICAgICAgICAgICAgICAgbGluZTogbGlcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsc3M6ICdnaXQgYWRkJyArIChib3JpbmcgYW5kICcgYm9yaW5nJyBvciAnJylcbiAgICAgICAgICAgICAgICAgICAgICAgIGdpdDogICdhZGQnXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGFuZ2U6IGFkZFxuICAgICAgICAgICAgICAgICAgICAgICAgbGVuZ3RoOiBjaGFuZ2UuYWRkLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICAgICAgYm9yaW5nOiBib3JpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsaWNrOiBAb25NZXRhQ2xpY2tcblxuICAgICAgICAgICAgICAgICAgICBAZWRpdG9yLm1ldGEuYWRkRGlmZk1ldGEgbWV0YVxuICAgICAgICAgICAgICAgICAgICBsaSsrXG5cbiAgICAgICAgICAgIGVsc2UgaWYgY2hhbmdlLmRlbD9cblxuICAgICAgICAgICAgICAgIG1vZHMgPSBjaGFuZ2UubW9kPyBhbmQgY2hhbmdlLm1vZC5sZW5ndGggb3IgMVxuICAgICAgICAgICAgICAgIGxpID0gY2hhbmdlLmxpbmUgLSAxICsgbW9kc1xuXG4gICAgICAgICAgICAgICAgbWV0YSA9XG4gICAgICAgICAgICAgICAgICAgIGxpbmU6IGxpXG4gICAgICAgICAgICAgICAgICAgIGNsc3M6ICdnaXQgZGVsJyArIChib3JpbmcgYW5kICcgYm9yaW5nJyBvciAnJylcbiAgICAgICAgICAgICAgICAgICAgZ2l0OiAgJ2RlbCdcbiAgICAgICAgICAgICAgICAgICAgY2hhbmdlOiBjaGFuZ2UuZGVsXG4gICAgICAgICAgICAgICAgICAgIGxlbmd0aDogMVxuICAgICAgICAgICAgICAgICAgICBib3Jpbmc6IGJvcmluZ1xuICAgICAgICAgICAgICAgICAgICBjbGljazogQG9uTWV0YUNsaWNrXG5cbiAgICAgICAgICAgICAgICBAZWRpdG9yLm1ldGEuYWRkRGlmZk1ldGEgbWV0YVxuXG4gICAgIyAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMFxuXG4gICAgaXNCb3Jpbmc6IChjaGFuZ2UpIC0+XG5cbiAgICAgICAgaWYgY2hhbmdlLm1vZD9cbiAgICAgICAgICAgIGZvciBjIGluIGNoYW5nZS5tb2RcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2UgaWYgbm90IGxpbmVEaWZmLmlzQm9yaW5nIGMub2xkLCBjLm5ld1xuXG4gICAgICAgIGlmIGNoYW5nZS5hZGQ/XG4gICAgICAgICAgICBmb3IgYyBpbiBjaGFuZ2UuYWRkXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlIGlmIG5vdCBlbXB0eSBjLm5ldy50cmltKClcblxuICAgICAgICBpZiBjaGFuZ2UuZGVsP1xuICAgICAgICAgICAgZm9yIGMgaW4gY2hhbmdlLmRlbFxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZSBpZiBub3QgZW1wdHkgYy5vbGQudHJpbSgpXG5cbiAgICAgICAgdHJ1ZVxuXG4gICAgIyAwMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwXG4gICAgIyAwMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG5cbiAgICBvbkVkaXRvckZpbGU6ID0+IEB1cGRhdGUoKVxuXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcblxuICAgIHVwZGF0ZTogPT5cblxuICAgICAgICBpZiBAZWRpdG9yLmN1cnJlbnRGaWxlXG5cbiAgICAgICAgICAgIEBjaGFuZ2VzID0gZmlsZTpAZWRpdG9yLmN1cnJlbnRGaWxlXG5cbiAgICAgICAgICAgIGh1Yi5kaWZmIEBlZGl0b3IuY3VycmVudEZpbGUsIChjaGFuZ2VzKSA9PlxuXG4gICAgICAgICAgICAgICAgaWYgY2hhbmdlcy5maWxlICE9IEBlZGl0b3IuY3VycmVudEZpbGUgdGhlbiByZXR1cm4ge31cblxuICAgICAgICAgICAgICAgIEBjaGFuZ2VzID0gY2hhbmdlc1xuXG4gICAgICAgICAgICAgICAgQHVwZGF0ZU1ldGFzKClcbiAgICAgICAgICAgICAgICBAdXBkYXRlU2Nyb2xsKClcbiAgICAgICAgICAgICAgICBAZWRpdG9yLmVtaXQgJ2RpZmZiYXJVcGRhdGVkJywgQGNoYW5nZXMgIyBvbmx5IHVzZWQgaW4gdGVzdHNcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGNoYW5nZXMgPSBudWxsXG4gICAgICAgICAgICBAdXBkYXRlTWV0YXMoKVxuICAgICAgICAgICAgQHVwZGF0ZVNjcm9sbCgpXG4gICAgICAgICAgICBAZWRpdG9yLmVtaXQgJ2RpZmZiYXJVcGRhdGVkJywgQGNoYW5nZXMgIyBvbmx5IHVzZWQgaW4gdGVzdHNcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMFxuICAgICMgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwXG5cbiAgICB1cGRhdGVTY3JvbGw6ID0+XG5cbiAgICAgICAgdyAgPSAyXG4gICAgICAgIGggID0gQGVkaXRvci52aWV3LmNsaWVudEhlaWdodFxuICAgICAgICBsaCA9IGggLyBAZWRpdG9yLm51bUxpbmVzKClcblxuICAgICAgICBjdHggPSBAZWxlbS5nZXRDb250ZXh0ICcyZCdcbiAgICAgICAgQGVsZW0ud2lkdGggID0gd1xuICAgICAgICBAZWxlbS5oZWlnaHQgPSBoXG5cbiAgICAgICAgYWxwaGEgPSAobykgLT4gMC41ICsgTWF0aC5tYXggMCwgKDE2LW8qbGgpKigwLjUvMTYpXG5cbiAgICAgICAgaWYgQGNoYW5nZXNcblxuICAgICAgICAgICAgZm9yIG1ldGEgaW4gQGVkaXRvci5tZXRhLm1ldGFzXG5cbiAgICAgICAgICAgICAgICBjb250aW51ZSBpZiBub3QgbWV0YT9bMl0/LmdpdD9cblxuICAgICAgICAgICAgICAgIGxpICAgICA9IG1ldGFbMF1cbiAgICAgICAgICAgICAgICBsZW5ndGggPSBtZXRhWzJdLmxlbmd0aFxuICAgICAgICAgICAgICAgIGJvcmluZyA9IG1ldGFbMl0uYm9yaW5nXG5cbiAgICAgICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gc3dpdGNoIG1ldGFbMl0uZ2l0XG5cbiAgICAgICAgICAgICAgICAgICAgd2hlbiAnbW9kJ1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgYm9yaW5nIHRoZW4gXCJyZ2JhKDUwLCA1MCw1MCwje2FscGhhIGxlbmd0aH0pXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgICAgICAgICAgIFwicmdiYSggMCwyNTUsIDAsI3thbHBoYSBsZW5ndGh9KVwiXG5cbiAgICAgICAgICAgICAgICAgICAgd2hlbiAnZGVsJ1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgYm9yaW5nIHRoZW4gXCJyZ2JhKDUwLDUwLDUwLCN7YWxwaGEgbGVuZ3RofSlcIlxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSAgICAgICAgICAgXCJyZ2JhKDI1NSwwLDAsI3thbHBoYSBsZW5ndGh9KVwiXG5cbiAgICAgICAgICAgICAgICAgICAgd2hlbiAnYWRkJ1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgYm9yaW5nIHRoZW4gXCJyZ2JhKDUwLDUwLDUwLCN7YWxwaGEgbGVuZ3RofSlcIlxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSAgICAgICAgICAgXCJyZ2JhKDE2MCwxNjAsMjU1LCN7YWxwaGEgbGVuZ3RofSlcIlxuXG4gICAgICAgICAgICAgICAgY3R4LmZpbGxSZWN0IDAsIGxpICogbGgsIHcsIGxoXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcblxuICAgIGNsZWFyOiAtPlxuXG4gICAgICAgIEBjbGVhck1ldGFzKClcbiAgICAgICAgQGVsZW0ud2lkdGggPSAyXG5cbiAgICBjbGVhck1ldGFzOiAtPiBAZWRpdG9yLm1ldGEuZGVsQ2xhc3MgJ2dpdCdcblxubW9kdWxlLmV4cG9ydHMgPSBEaWZmYmFyXG4iXX0=
//# sourceURL=../../coffee/editor/diffbar.coffee