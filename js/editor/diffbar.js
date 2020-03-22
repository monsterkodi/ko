// koffee 1.12.0

/*
0000000    000  00000000  00000000  0000000     0000000   00000000
000   000  000  000       000       000   000  000   000  000   000
000   000  000  000000    000000    0000000    000000000  0000000
000   000  000  000       000       000   000  000   000  000   000
0000000    000  000       000       0000000    000   000  000   000
 */
var Diffbar, elem, empty, hub, lineDiff, post, ref,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), elem = ref.elem, empty = ref.empty, post = ref.post;

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
        h = this.editor.scroll.viewHeight;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZmJhci5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvZWRpdG9yIiwic291cmNlcyI6WyJkaWZmYmFyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSw4Q0FBQTtJQUFBOztBQVFBLE1BQXdCLE9BQUEsQ0FBUSxLQUFSLENBQXhCLEVBQUUsZUFBRixFQUFRLGlCQUFSLEVBQWU7O0FBRWYsUUFBQSxHQUFXLE9BQUEsQ0FBUSxtQkFBUjs7QUFDWCxHQUFBLEdBQVcsT0FBQSxDQUFRLFlBQVI7O0FBRUw7SUFFQyxpQkFBQyxNQUFEO1FBQUMsSUFBQyxDQUFBLFNBQUQ7Ozs7O1FBRUEsSUFBQyxDQUFBLElBQUQsR0FBUSxJQUFBLENBQUssUUFBTCxFQUFlO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxTQUFQO1NBQWY7UUFDUixJQUFDLENBQUEsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFaLEdBQXVCO1FBQ3ZCLElBQUMsQ0FBQSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQVosR0FBbUI7UUFDbkIsSUFBQyxDQUFBLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBWixHQUFtQjtRQUVuQixJQUFDLENBQUEsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFiLENBQXlCLElBQUMsQ0FBQSxJQUExQjtRQUVBLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLE1BQVgsRUFBd0IsSUFBQyxDQUFBLFlBQXpCO1FBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsUUFBWCxFQUF3QixJQUFDLENBQUEsTUFBekI7UUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxRQUFYLEVBQXdCLElBQUMsQ0FBQSxNQUF6QjtRQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLFlBQVgsRUFBd0IsSUFBQyxDQUFBLFlBQXpCO1FBRUEsSUFBSSxDQUFDLEVBQUwsQ0FBUSxXQUFSLEVBQXdCLElBQUMsQ0FBQSxNQUF6QjtRQUNBLElBQUksQ0FBQyxFQUFMLENBQVEsU0FBUixFQUF3QixJQUFDLENBQUEsTUFBekI7SUFmRDs7c0JBdUJILFdBQUEsR0FBYSxTQUFDLElBQUQsRUFBTyxLQUFQO0FBRVQsWUFBQTtRQUFBLElBQXNCLEtBQUssQ0FBQyxPQUE1QjtBQUFBLG1CQUFPLFlBQVA7O1FBRUEsSUFBRyxLQUFLLENBQUMsT0FBVDtZQUNJLElBQUMsQ0FBQSxNQUFNLENBQUMsaUJBQVIsQ0FBMEIsYUFBQSxDQUFjLElBQWQsQ0FBMUI7WUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLHVCQUFSLENBQWdDLENBQUMsSUFBSyxDQUFBLENBQUEsQ0FBTixDQUFoQyxFQUZKO1NBQUEsTUFBQTtZQUlJLElBQUcsSUFBSyxDQUFBLENBQUEsQ0FBRSxDQUFDLE1BQVg7O3dCQUF5QyxDQUFFLFFBQXBCLENBQUE7aUJBQXZCOztZQUNBLFlBQUEsR0FBZSxJQUFDLENBQUEseUJBQUQsQ0FBMkIsSUFBSyxDQUFBLENBQUEsQ0FBaEM7WUFDZixJQUFDLENBQUEsTUFBTSxFQUFDLEVBQUQsRUFBRyxDQUFDLEtBQVgsQ0FBQTtZQUNBLElBQUMsQ0FBQSxNQUFNLEVBQUMsRUFBRCxFQUFHLENBQUMsVUFBWCxDQUFzQixZQUFZLENBQUMsR0FBYixDQUFpQixTQUFDLENBQUQ7dUJBQU8sQ0FBQyxDQUFELEVBQUcsQ0FBSDtZQUFQLENBQWpCLENBQXRCO1lBQ0EsSUFBQyxDQUFBLE1BQU0sRUFBQyxFQUFELEVBQUcsQ0FBQyxHQUFYLENBQUE7WUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLHVCQUFSLENBQWdDLFlBQWhDLEVBVEo7O2VBVUE7SUFkUzs7c0JBZ0JiLG1CQUFBLEdBQXFCLFNBQUMsRUFBRDtlQUVqQixJQUFDLENBQUEsTUFBTSxDQUFDLElBQUksQ0FBQyxnQkFBYixDQUE4QixFQUE5QixDQUFpQyxDQUFDLE1BQWxDLENBQXlDLFNBQUMsQ0FBRDttQkFBTyxDQUFFLENBQUEsQ0FBQSxDQUFFLENBQUMsSUFBSSxDQUFDLFVBQVYsQ0FBcUIsS0FBckI7UUFBUCxDQUF6QztJQUZpQjs7c0JBVXJCLHlCQUFBLEdBQTJCLFNBQUMsRUFBRDtBQUV2QixZQUFBO1FBQUEsS0FBQSxHQUFRO1FBQ1IsSUFBRyxDQUFJLEtBQUEsQ0FBTSxLQUFBLEdBQVEsSUFBQyxDQUFBLG1CQUFELENBQXFCLEVBQXJCLENBQWQsQ0FBUDtZQUVJLE9BQUEsR0FBVSxLQUFNLENBQUEsQ0FBQSxDQUFHLENBQUEsQ0FBQSxDQUFFLENBQUM7WUFDdEIsS0FBSyxDQUFDLElBQU4sQ0FBVyxFQUFYO1lBRUEsRUFBQSxHQUFLLEVBQUEsR0FBRztBQUNSLG1CQUFNLENBQUksS0FBQSxDQUFNLEtBQUEsR0FBUSxJQUFDLENBQUEsbUJBQUQsQ0FBcUIsRUFBckIsQ0FBZCxDQUFWO2dCQUNJLElBQVMsS0FBTSxDQUFBLENBQUEsQ0FBRyxDQUFBLENBQUEsQ0FBRSxDQUFDLE9BQVosS0FBdUIsT0FBaEM7QUFBQSwwQkFBQTs7Z0JBQ0EsS0FBSyxDQUFDLE9BQU4sQ0FBYyxFQUFkO2dCQUNBLEVBQUE7WUFISjtZQUtBLEVBQUEsR0FBSyxFQUFBLEdBQUc7QUFDUixtQkFBTSxDQUFJLEtBQUEsQ0FBTSxLQUFBLEdBQVEsSUFBQyxDQUFBLG1CQUFELENBQXFCLEVBQXJCLENBQWQsQ0FBVjtnQkFDSSxJQUFTLEtBQU0sQ0FBQSxDQUFBLENBQUcsQ0FBQSxDQUFBLENBQUUsQ0FBQyxPQUFaLEtBQXVCLE9BQWhDO0FBQUEsMEJBQUE7O2dCQUNBLEtBQUssQ0FBQyxJQUFOLENBQVcsRUFBWDtnQkFDQSxFQUFBO1lBSEosQ0FaSjs7ZUFnQkE7SUFuQnVCOztzQkEyQjNCLFdBQUEsR0FBYSxTQUFBO0FBRVQsWUFBQTtRQUFBLElBQUMsQ0FBQSxVQUFELENBQUE7UUFFQSxJQUFVLHNFQUFxQixDQUFFLHlCQUFqQztBQUFBLG1CQUFBOztBQUVBO0FBQUE7YUFBQSxzQ0FBQTs7WUFFSSxNQUFBLEdBQVMsSUFBQyxDQUFBLFFBQUQsQ0FBVSxNQUFWO1lBRVQsSUFBRyxrQkFBSDtnQkFFSSxFQUFBLEdBQUssTUFBTSxDQUFDLElBQVAsR0FBWTtBQUVqQjtBQUFBLHFCQUFBLHdDQUFBOztvQkFFSSxJQUFBLEdBQ0k7d0JBQUEsSUFBQSxFQUFNLEVBQU47d0JBQ0EsSUFBQSxFQUFNLFNBQUEsR0FBWSxDQUFDLE1BQUEsSUFBVyxTQUFYLElBQXdCLEVBQXpCLENBRGxCO3dCQUVBLEdBQUEsRUFBTSxLQUZOO3dCQUdBLE1BQUEsRUFBUSxHQUhSO3dCQUlBLE1BQUEsRUFBUSxNQUpSO3dCQUtBLE1BQUEsRUFBUSxNQUFNLENBQUMsR0FBRyxDQUFDLE1BTG5CO3dCQU1BLEtBQUEsRUFBTyxJQUFDLENBQUEsV0FOUjs7b0JBT0osSUFBQyxDQUFBLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBYixDQUF5QixJQUF6QjtvQkFDQSxFQUFBO0FBWEosaUJBSko7O1lBaUJBLElBQUcsa0JBQUg7Z0JBRUksSUFBQSxHQUFPLG9CQUFBLElBQWdCLE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBM0IsSUFBcUM7Z0JBQzVDLEVBQUEsR0FBSyxNQUFNLENBQUMsSUFBUCxHQUFjLENBQWQsR0FBa0I7OztBQUV2QjtBQUFBO3lCQUFBLHdDQUFBOzt3QkFDSSxJQUFBLEdBQ0k7NEJBQUEsSUFBQSxFQUFNLEVBQU47NEJBQ0EsSUFBQSxFQUFNLFNBQUEsR0FBWSxDQUFDLE1BQUEsSUFBVyxTQUFYLElBQXdCLEVBQXpCLENBRGxCOzRCQUVBLEdBQUEsRUFBTSxLQUZOOzRCQUdBLE1BQUEsRUFBUSxHQUhSOzRCQUlBLE1BQUEsRUFBUSxNQUFNLENBQUMsR0FBRyxDQUFDLE1BSm5COzRCQUtBLE1BQUEsRUFBUSxNQUxSOzRCQU1BLEtBQUEsRUFBTyxJQUFDLENBQUEsV0FOUjs7d0JBUUosSUFBQyxDQUFBLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBYixDQUF5QixJQUF6QjtzQ0FDQSxFQUFBO0FBWEo7OytCQUxKO2FBQUEsTUFrQkssSUFBRyxrQkFBSDtnQkFFRCxJQUFBLEdBQU8sb0JBQUEsSUFBZ0IsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUEzQixJQUFxQztnQkFDNUMsRUFBQSxHQUFLLE1BQU0sQ0FBQyxJQUFQLEdBQWMsQ0FBZCxHQUFrQjtnQkFFdkIsSUFBQSxHQUNJO29CQUFBLElBQUEsRUFBTSxFQUFOO29CQUNBLElBQUEsRUFBTSxTQUFBLEdBQVksQ0FBQyxNQUFBLElBQVcsU0FBWCxJQUF3QixFQUF6QixDQURsQjtvQkFFQSxHQUFBLEVBQU0sS0FGTjtvQkFHQSxNQUFBLEVBQVEsTUFBTSxDQUFDLEdBSGY7b0JBSUEsTUFBQSxFQUFRLENBSlI7b0JBS0EsTUFBQSxFQUFRLE1BTFI7b0JBTUEsS0FBQSxFQUFPLElBQUMsQ0FBQSxXQU5SOzs2QkFRSixJQUFDLENBQUEsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFiLENBQXlCLElBQXpCLEdBZEM7YUFBQSxNQUFBO3FDQUFBOztBQXZDVDs7SUFOUzs7c0JBbUViLFFBQUEsR0FBVSxTQUFDLE1BQUQ7QUFFTixZQUFBO1FBQUEsSUFBRyxrQkFBSDtBQUNJO0FBQUEsaUJBQUEsc0NBQUE7O2dCQUNJLElBQWdCLENBQUksUUFBUSxDQUFDLFFBQVQsQ0FBa0IsQ0FBQyxDQUFDLEdBQXBCLEVBQXlCLENBQUMsRUFBQyxHQUFELEVBQTFCLENBQXBCO0FBQUEsMkJBQU8sTUFBUDs7QUFESixhQURKOztRQUlBLElBQUcsa0JBQUg7QUFDSTtBQUFBLGlCQUFBLHdDQUFBOztnQkFDSSxJQUFnQixDQUFJLEtBQUEsQ0FBTSxDQUFDLEVBQUMsR0FBRCxFQUFJLENBQUMsSUFBTixDQUFBLENBQU4sQ0FBcEI7QUFBQSwyQkFBTyxNQUFQOztBQURKLGFBREo7O1FBSUEsSUFBRyxrQkFBSDtBQUNJO0FBQUEsaUJBQUEsd0NBQUE7O2dCQUNJLElBQWdCLENBQUksS0FBQSxDQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBTixDQUFBLENBQU4sQ0FBcEI7QUFBQSwyQkFBTyxNQUFQOztBQURKLGFBREo7O2VBSUE7SUFkTTs7c0JBc0JWLFlBQUEsR0FBYyxTQUFBO2VBQUcsSUFBQyxDQUFBLE1BQUQsQ0FBQTtJQUFIOztzQkFRZCxNQUFBLEdBQVEsU0FBQTtRQUVKLElBQUcsSUFBQyxDQUFBLE1BQU0sQ0FBQyxXQUFYO1lBRUksSUFBQyxDQUFBLE9BQUQsR0FBVztnQkFBQSxJQUFBLEVBQUssSUFBQyxDQUFBLE1BQU0sQ0FBQyxXQUFiOzttQkFFWCxHQUFHLENBQUMsSUFBSixDQUFTLElBQUMsQ0FBQSxNQUFNLENBQUMsV0FBakIsRUFBOEIsQ0FBQSxTQUFBLEtBQUE7dUJBQUEsU0FBQyxPQUFEO29CQUUxQixJQUFHLE9BQU8sQ0FBQyxJQUFSLEtBQWdCLEtBQUMsQ0FBQSxNQUFNLENBQUMsV0FBM0I7QUFBNEMsK0JBQU8sR0FBbkQ7O29CQUVBLEtBQUMsQ0FBQSxPQUFELEdBQVc7b0JBRVgsS0FBQyxDQUFBLFdBQUQsQ0FBQTtvQkFDQSxLQUFDLENBQUEsWUFBRCxDQUFBOzJCQUNBLEtBQUMsQ0FBQSxNQUFNLENBQUMsSUFBUixDQUFhLGdCQUFiLEVBQStCLEtBQUMsQ0FBQSxPQUFoQztnQkFSMEI7WUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQTlCLEVBSko7U0FBQSxNQUFBO1lBY0ksSUFBQyxDQUFBLE9BQUQsR0FBVztZQUNYLElBQUMsQ0FBQSxXQUFELENBQUE7WUFDQSxJQUFDLENBQUEsWUFBRCxDQUFBO21CQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsSUFBUixDQUFhLGdCQUFiLEVBQStCLElBQUMsQ0FBQSxPQUFoQyxFQWpCSjs7SUFGSTs7c0JBMkJSLFlBQUEsR0FBYyxTQUFBO0FBRVYsWUFBQTtRQUFBLENBQUEsR0FBSztRQUVMLENBQUEsR0FBSyxJQUFDLENBQUEsTUFBTSxDQUFDLE1BQU0sQ0FBQztRQUNwQixFQUFBLEdBQUssQ0FBQSxHQUFJLElBQUMsQ0FBQSxNQUFNLENBQUMsUUFBUixDQUFBO1FBRVQsR0FBQSxHQUFNLElBQUMsQ0FBQSxJQUFJLENBQUMsVUFBTixDQUFpQixJQUFqQjtRQUNOLElBQUMsQ0FBQSxJQUFJLENBQUMsS0FBTixHQUFlO1FBQ2YsSUFBQyxDQUFBLElBQUksQ0FBQyxNQUFOLEdBQWU7UUFFZixLQUFBLEdBQVEsU0FBQyxDQUFEO21CQUFPLEdBQUEsR0FBTSxJQUFJLENBQUMsR0FBTCxDQUFTLENBQVQsRUFBWSxDQUFDLEVBQUEsR0FBRyxDQUFBLEdBQUUsRUFBTixDQUFBLEdBQVUsQ0FBQyxHQUFBLEdBQUksRUFBTCxDQUF0QjtRQUFiO1FBRVIsSUFBRyxJQUFDLENBQUEsT0FBSjtBQUVJO0FBQUE7aUJBQUEsc0NBQUE7O2dCQUVJLElBQWdCLDhFQUFoQjtBQUFBLDZCQUFBOztnQkFFQSxFQUFBLEdBQVMsSUFBSyxDQUFBLENBQUE7Z0JBQ2QsTUFBQSxHQUFTLElBQUssQ0FBQSxDQUFBLENBQUUsQ0FBQztnQkFDakIsTUFBQSxHQUFTLElBQUssQ0FBQSxDQUFBLENBQUUsQ0FBQztnQkFFakIsR0FBRyxDQUFDLFNBQUo7QUFBZ0IsNEJBQU8sSUFBSyxDQUFBLENBQUEsQ0FBRSxDQUFDLEdBQWY7QUFBQSw2QkFFUCxLQUZPOzRCQUdSLElBQUcsTUFBSDt1Q0FBZSxpQkFBQSxHQUFpQixDQUFDLEtBQUEsQ0FBTSxNQUFOLENBQUQsQ0FBakIsR0FBK0IsSUFBOUM7NkJBQUEsTUFBQTt1Q0FDZSxpQkFBQSxHQUFpQixDQUFDLEtBQUEsQ0FBTSxNQUFOLENBQUQsQ0FBakIsR0FBK0IsSUFEOUM7O0FBREM7QUFGTyw2QkFNUCxLQU5POzRCQU9SLElBQUcsTUFBSDt1Q0FBZSxnQkFBQSxHQUFnQixDQUFDLEtBQUEsQ0FBTSxNQUFOLENBQUQsQ0FBaEIsR0FBOEIsSUFBN0M7NkJBQUEsTUFBQTt1Q0FDZSxlQUFBLEdBQWUsQ0FBQyxLQUFBLENBQU0sTUFBTixDQUFELENBQWYsR0FBNkIsSUFENUM7O0FBREM7QUFOTyw2QkFVUCxLQVZPOzRCQVdSLElBQUcsTUFBSDt1Q0FBZSxnQkFBQSxHQUFnQixDQUFDLEtBQUEsQ0FBTSxNQUFOLENBQUQsQ0FBaEIsR0FBOEIsSUFBN0M7NkJBQUEsTUFBQTt1Q0FDZSxtQkFBQSxHQUFtQixDQUFDLEtBQUEsQ0FBTSxNQUFOLENBQUQsQ0FBbkIsR0FBaUMsSUFEaEQ7O0FBWFE7OzZCQWNoQixHQUFHLENBQUMsUUFBSixDQUFhLENBQWIsRUFBZ0IsRUFBQSxHQUFLLEVBQXJCLEVBQXlCLENBQXpCLEVBQTRCLEVBQTVCO0FBdEJKOzJCQUZKOztJQWJVOztzQkE2Q2QsS0FBQSxHQUFPLFNBQUE7UUFFSCxJQUFDLENBQUEsVUFBRCxDQUFBO2VBQ0EsSUFBQyxDQUFBLElBQUksQ0FBQyxLQUFOLEdBQWM7SUFIWDs7c0JBS1AsVUFBQSxHQUFZLFNBQUE7ZUFBRyxJQUFDLENBQUEsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFiLENBQXNCLEtBQXRCO0lBQUg7Ozs7OztBQUVoQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4wMDAgICAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4wMDAgICAwMDAgIDAwMCAgMDAwMDAwICAgIDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuMDAwMDAwMCAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgZWxlbSwgZW1wdHksIHBvc3QgfSA9IHJlcXVpcmUgJ2t4aydcblxubGluZURpZmYgPSByZXF1aXJlICcuLi90b29scy9saW5lZGlmZidcbmh1YiAgICAgID0gcmVxdWlyZSAnLi4vZ2l0L2h1YidcblxuY2xhc3MgRGlmZmJhclxuXG4gICAgQDogKEBlZGl0b3IpIC0+XG5cbiAgICAgICAgQGVsZW0gPSBlbGVtICdjYW52YXMnLCBjbGFzczogJ2RpZmZiYXInXG4gICAgICAgIEBlbGVtLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJ1xuICAgICAgICBAZWxlbS5zdHlsZS5sZWZ0ID0gJzAnXG4gICAgICAgIEBlbGVtLnN0eWxlLnRvcCAgPSAnMCdcblxuICAgICAgICBAZWRpdG9yLnZpZXcuYXBwZW5kQ2hpbGQgQGVsZW1cblxuICAgICAgICBAZWRpdG9yLm9uICdmaWxlJyAgICAgICBAb25FZGl0b3JGaWxlXG4gICAgICAgIEBlZGl0b3Iub24gJ3VuZG9uZScgICAgIEB1cGRhdGVcbiAgICAgICAgQGVkaXRvci5vbiAncmVkb25lJyAgICAgQHVwZGF0ZVxuICAgICAgICBAZWRpdG9yLm9uICdsaW5lc1Nob3duJyBAdXBkYXRlU2Nyb2xsXG4gICAgICAgIFxuICAgICAgICBwb3N0Lm9uICdnaXRTdGF0dXMnICAgICBAdXBkYXRlXG4gICAgICAgIHBvc3Qub24gJ2dpdERpZmYnICAgICAgIEB1cGRhdGVcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICBvbk1ldGFDbGljazogKG1ldGEsIGV2ZW50KSA9PlxuXG4gICAgICAgIHJldHVybiAndW5oYW5kbGVkJyBpZiBldmVudC5tZXRhS2V5XG5cbiAgICAgICAgaWYgZXZlbnQuY3RybEtleVxuICAgICAgICAgICAgQGVkaXRvci5zaW5nbGVDdXJzb3JBdFBvcyByYW5nZVN0YXJ0UG9zIG1ldGFcbiAgICAgICAgICAgIEBlZGl0b3IudG9nZ2xlR2l0Q2hhbmdlc0luTGluZXMgW21ldGFbMF1dXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGlmIG1ldGFbMl0uYm9yaW5nIHRoZW4gQGVkaXRvci5pbnZpc2libGVzPy5hY3RpdmF0ZSgpXG4gICAgICAgICAgICBibG9ja0luZGljZXMgPSBAbGluZUluZGljZXNGb3JCbG9ja0F0TGluZSBtZXRhWzBdXG4gICAgICAgICAgICBAZWRpdG9yLmRvLnN0YXJ0KClcbiAgICAgICAgICAgIEBlZGl0b3IuZG8uc2V0Q3Vyc29ycyBibG9ja0luZGljZXMubWFwIChpKSAtPiBbMCxpXVxuICAgICAgICAgICAgQGVkaXRvci5kby5lbmQoKVxuICAgICAgICAgICAgQGVkaXRvci50b2dnbGVHaXRDaGFuZ2VzSW5MaW5lcyBibG9ja0luZGljZXNcbiAgICAgICAgQFxuXG4gICAgZ2l0TWV0YXNBdExpbmVJbmRleDogKGxpKSAtPlxuXG4gICAgICAgIEBlZGl0b3IubWV0YS5tZXRhc0F0TGluZUluZGV4KGxpKS5maWx0ZXIgKG0pIC0+IG1bMl0uY2xzcy5zdGFydHNXaXRoICdnaXQnXG5cbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAgICAgIDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDBcblxuICAgIGxpbmVJbmRpY2VzRm9yQmxvY2tBdExpbmU6IChsaSkgLT5cblxuICAgICAgICBsaW5lcyA9IFtdXG4gICAgICAgIGlmIG5vdCBlbXB0eSBtZXRhcyA9IEBnaXRNZXRhc0F0TGluZUluZGV4IGxpXG5cbiAgICAgICAgICAgIHRvZ2dsZWQgPSBtZXRhc1swXVsyXS50b2dnbGVkXG4gICAgICAgICAgICBsaW5lcy5wdXNoIGxpXG5cbiAgICAgICAgICAgIGJpID0gbGktMVxuICAgICAgICAgICAgd2hpbGUgbm90IGVtcHR5IG1ldGFzID0gQGdpdE1ldGFzQXRMaW5lSW5kZXggYmlcbiAgICAgICAgICAgICAgICBicmVhayBpZiBtZXRhc1swXVsyXS50b2dnbGVkICE9IHRvZ2dsZWRcbiAgICAgICAgICAgICAgICBsaW5lcy51bnNoaWZ0IGJpXG4gICAgICAgICAgICAgICAgYmktLVxuXG4gICAgICAgICAgICBhaSA9IGxpKzFcbiAgICAgICAgICAgIHdoaWxlIG5vdCBlbXB0eSBtZXRhcyA9IEBnaXRNZXRhc0F0TGluZUluZGV4IGFpXG4gICAgICAgICAgICAgICAgYnJlYWsgaWYgbWV0YXNbMF1bMl0udG9nZ2xlZCAhPSB0b2dnbGVkXG4gICAgICAgICAgICAgICAgbGluZXMucHVzaCBhaVxuICAgICAgICAgICAgICAgIGFpKytcbiAgICAgICAgbGluZXNcblxuICAgICMgMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuXG4gICAgdXBkYXRlTWV0YXM6IC0+XG5cbiAgICAgICAgQGNsZWFyTWV0YXMoKVxuXG4gICAgICAgIHJldHVybiBpZiBub3QgQGNoYW5nZXM/LmNoYW5nZXM/Lmxlbmd0aFxuXG4gICAgICAgIGZvciBjaGFuZ2UgaW4gQGNoYW5nZXMuY2hhbmdlc1xuXG4gICAgICAgICAgICBib3JpbmcgPSBAaXNCb3JpbmcgY2hhbmdlXG5cbiAgICAgICAgICAgIGlmIGNoYW5nZS5tb2Q/XG5cbiAgICAgICAgICAgICAgICBsaSA9IGNoYW5nZS5saW5lLTFcblxuICAgICAgICAgICAgICAgIGZvciBtb2QgaW4gY2hhbmdlLm1vZFxuXG4gICAgICAgICAgICAgICAgICAgIG1ldGEgPVxuICAgICAgICAgICAgICAgICAgICAgICAgbGluZTogbGlcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsc3M6ICdnaXQgbW9kJyArIChib3JpbmcgYW5kICcgYm9yaW5nJyBvciAnJylcbiAgICAgICAgICAgICAgICAgICAgICAgIGdpdDogICdtb2QnXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGFuZ2U6IG1vZFxuICAgICAgICAgICAgICAgICAgICAgICAgYm9yaW5nOiBib3JpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlbmd0aDogY2hhbmdlLm1vZC5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsaWNrOiBAb25NZXRhQ2xpY2tcbiAgICAgICAgICAgICAgICAgICAgQGVkaXRvci5tZXRhLmFkZERpZmZNZXRhIG1ldGFcbiAgICAgICAgICAgICAgICAgICAgbGkrK1xuXG4gICAgICAgICAgICBpZiBjaGFuZ2UuYWRkP1xuXG4gICAgICAgICAgICAgICAgbW9kcyA9IGNoYW5nZS5tb2Q/IGFuZCBjaGFuZ2UubW9kLmxlbmd0aCBvciAwXG4gICAgICAgICAgICAgICAgbGkgPSBjaGFuZ2UubGluZSAtIDEgKyBtb2RzXG5cbiAgICAgICAgICAgICAgICBmb3IgYWRkIGluIGNoYW5nZS5hZGRcbiAgICAgICAgICAgICAgICAgICAgbWV0YSA9XG4gICAgICAgICAgICAgICAgICAgICAgICBsaW5lOiBsaVxuICAgICAgICAgICAgICAgICAgICAgICAgY2xzczogJ2dpdCBhZGQnICsgKGJvcmluZyBhbmQgJyBib3JpbmcnIG9yICcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgZ2l0OiAgJ2FkZCdcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoYW5nZTogYWRkXG4gICAgICAgICAgICAgICAgICAgICAgICBsZW5ndGg6IGNoYW5nZS5hZGQubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgICAgICBib3Jpbmc6IGJvcmluZ1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xpY2s6IEBvbk1ldGFDbGlja1xuXG4gICAgICAgICAgICAgICAgICAgIEBlZGl0b3IubWV0YS5hZGREaWZmTWV0YSBtZXRhXG4gICAgICAgICAgICAgICAgICAgIGxpKytcblxuICAgICAgICAgICAgZWxzZSBpZiBjaGFuZ2UuZGVsP1xuXG4gICAgICAgICAgICAgICAgbW9kcyA9IGNoYW5nZS5tb2Q/IGFuZCBjaGFuZ2UubW9kLmxlbmd0aCBvciAxXG4gICAgICAgICAgICAgICAgbGkgPSBjaGFuZ2UubGluZSAtIDEgKyBtb2RzXG5cbiAgICAgICAgICAgICAgICBtZXRhID1cbiAgICAgICAgICAgICAgICAgICAgbGluZTogbGlcbiAgICAgICAgICAgICAgICAgICAgY2xzczogJ2dpdCBkZWwnICsgKGJvcmluZyBhbmQgJyBib3JpbmcnIG9yICcnKVxuICAgICAgICAgICAgICAgICAgICBnaXQ6ICAnZGVsJ1xuICAgICAgICAgICAgICAgICAgICBjaGFuZ2U6IGNoYW5nZS5kZWxcbiAgICAgICAgICAgICAgICAgICAgbGVuZ3RoOiAxXG4gICAgICAgICAgICAgICAgICAgIGJvcmluZzogYm9yaW5nXG4gICAgICAgICAgICAgICAgICAgIGNsaWNrOiBAb25NZXRhQ2xpY2tcblxuICAgICAgICAgICAgICAgIEBlZGl0b3IubWV0YS5hZGREaWZmTWV0YSBtZXRhXG5cbiAgICAjIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwXG5cbiAgICBpc0JvcmluZzogKGNoYW5nZSkgLT5cblxuICAgICAgICBpZiBjaGFuZ2UubW9kP1xuICAgICAgICAgICAgZm9yIGMgaW4gY2hhbmdlLm1vZFxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZSBpZiBub3QgbGluZURpZmYuaXNCb3JpbmcgYy5vbGQsIGMubmV3XG5cbiAgICAgICAgaWYgY2hhbmdlLmFkZD9cbiAgICAgICAgICAgIGZvciBjIGluIGNoYW5nZS5hZGRcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2UgaWYgbm90IGVtcHR5IGMubmV3LnRyaW0oKVxuXG4gICAgICAgIGlmIGNoYW5nZS5kZWw/XG4gICAgICAgICAgICBmb3IgYyBpbiBjaGFuZ2UuZGVsXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlIGlmIG5vdCBlbXB0eSBjLm9sZC50cmltKClcblxuICAgICAgICB0cnVlXG5cbiAgICAjIDAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDBcbiAgICAjIDAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcblxuICAgIG9uRWRpdG9yRmlsZTogPT4gQHVwZGF0ZSgpXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgICAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuXG4gICAgdXBkYXRlOiA9PlxuXG4gICAgICAgIGlmIEBlZGl0b3IuY3VycmVudEZpbGVcblxuICAgICAgICAgICAgQGNoYW5nZXMgPSBmaWxlOkBlZGl0b3IuY3VycmVudEZpbGVcblxuICAgICAgICAgICAgaHViLmRpZmYgQGVkaXRvci5jdXJyZW50RmlsZSwgKGNoYW5nZXMpID0+XG5cbiAgICAgICAgICAgICAgICBpZiBjaGFuZ2VzLmZpbGUgIT0gQGVkaXRvci5jdXJyZW50RmlsZSB0aGVuIHJldHVybiB7fVxuXG4gICAgICAgICAgICAgICAgQGNoYW5nZXMgPSBjaGFuZ2VzXG5cbiAgICAgICAgICAgICAgICBAdXBkYXRlTWV0YXMoKVxuICAgICAgICAgICAgICAgIEB1cGRhdGVTY3JvbGwoKVxuICAgICAgICAgICAgICAgIEBlZGl0b3IuZW1pdCAnZGlmZmJhclVwZGF0ZWQnLCBAY2hhbmdlcyAjIG9ubHkgdXNlZCBpbiB0ZXN0c1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAY2hhbmdlcyA9IG51bGxcbiAgICAgICAgICAgIEB1cGRhdGVNZXRhcygpXG4gICAgICAgICAgICBAdXBkYXRlU2Nyb2xsKClcbiAgICAgICAgICAgIEBlZGl0b3IuZW1pdCAnZGlmZmJhclVwZGF0ZWQnLCBAY2hhbmdlcyAjIG9ubHkgdXNlZCBpbiB0ZXN0c1xuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwXG4gICAgIyAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDBcblxuICAgIHVwZGF0ZVNjcm9sbDogPT5cblxuICAgICAgICB3ICA9IDJcbiAgICAgICAgI2ggID0gQGVkaXRvci52aWV3LmNsaWVudEhlaWdodFxuICAgICAgICBoICA9IEBlZGl0b3Iuc2Nyb2xsLnZpZXdIZWlnaHRcbiAgICAgICAgbGggPSBoIC8gQGVkaXRvci5udW1MaW5lcygpXG5cbiAgICAgICAgY3R4ID0gQGVsZW0uZ2V0Q29udGV4dCAnMmQnXG4gICAgICAgIEBlbGVtLndpZHRoICA9IHdcbiAgICAgICAgQGVsZW0uaGVpZ2h0ID0gaFxuXG4gICAgICAgIGFscGhhID0gKG8pIC0+IDAuNSArIE1hdGgubWF4IDAsICgxNi1vKmxoKSooMC41LzE2KVxuXG4gICAgICAgIGlmIEBjaGFuZ2VzXG5cbiAgICAgICAgICAgIGZvciBtZXRhIGluIEBlZGl0b3IubWV0YS5tZXRhc1xuXG4gICAgICAgICAgICAgICAgY29udGludWUgaWYgbm90IG1ldGE/WzJdPy5naXQ/XG5cbiAgICAgICAgICAgICAgICBsaSAgICAgPSBtZXRhWzBdXG4gICAgICAgICAgICAgICAgbGVuZ3RoID0gbWV0YVsyXS5sZW5ndGhcbiAgICAgICAgICAgICAgICBib3JpbmcgPSBtZXRhWzJdLmJvcmluZ1xuXG4gICAgICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IHN3aXRjaCBtZXRhWzJdLmdpdFxuXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gJ21vZCdcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIGJvcmluZyB0aGVuIFwicmdiYSg1MCwgNTAsNTAsI3thbHBoYSBsZW5ndGh9KVwiXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlICAgICAgICAgICBcInJnYmEoIDAsMjU1LCAwLCN7YWxwaGEgbGVuZ3RofSlcIlxuXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gJ2RlbCdcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIGJvcmluZyB0aGVuIFwicmdiYSg1MCw1MCw1MCwje2FscGhhIGxlbmd0aH0pXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgICAgICAgICAgIFwicmdiYSgyNTUsMCwwLCN7YWxwaGEgbGVuZ3RofSlcIlxuXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gJ2FkZCdcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIGJvcmluZyB0aGVuIFwicmdiYSg1MCw1MCw1MCwje2FscGhhIGxlbmd0aH0pXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgICAgICAgICAgIFwicmdiYSgxNjAsMTYwLDI1NSwje2FscGhhIGxlbmd0aH0pXCJcblxuICAgICAgICAgICAgICAgIGN0eC5maWxsUmVjdCAwLCBsaSAqIGxoLCB3LCBsaFxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG5cbiAgICBjbGVhcjogLT5cblxuICAgICAgICBAY2xlYXJNZXRhcygpXG4gICAgICAgIEBlbGVtLndpZHRoID0gMlxuXG4gICAgY2xlYXJNZXRhczogLT4gQGVkaXRvci5tZXRhLmRlbENsYXNzICdnaXQnXG5cbm1vZHVsZS5leHBvcnRzID0gRGlmZmJhclxuIl19
//# sourceURL=../../coffee/editor/diffbar.coffee