// koffee 1.16.0

/*
 0000000   000  000000000  000  000   000  00000000   0000000 
000        000     000     000  0000  000  000       000   000
000  0000  000     000     000  000 0 000  000000    000   000
000   000  000     000     000  000  0000  000       000   000
 0000000   000     000     000  000   000  000        0000000
 */
var GitInfo, Syntax, empty, fs, hub, lineDiff, post, ref, slash,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    indexOf = [].indexOf;

ref = require('kxk'), empty = ref.empty, fs = ref.fs, post = ref.post, slash = ref.slash;

lineDiff = require('../tools/linediff');

Syntax = require('../editor/syntax');

hub = require('../git/hub');

GitInfo = (function() {
    function GitInfo() {
        this.onMetaClick = bind(this.onMetaClick, this);
    }

    GitInfo.prototype.onMetaClick = function(meta, event) {
        var href;
        if (href = meta[2].href) {
            href += ':' + window.terminal.posForEvent(event)[0];
            post.emit('openFiles', [href], {
                newTab: event.metaKey
            });
        }
        return 'unhandled';
    };

    GitInfo.prototype.logText = function(text) {
        var terminal;
        terminal = window.terminal;
        return terminal.appendMeta({
            clss: 'searchHeader',
            diss: Syntax.dissForTextAndSyntax(text, 'ko')
        });
    };

    GitInfo.prototype.logChanges = function(changes) {
        var diff, diffs, dss, extn, index, j, k, len, len1, lineMeta, meta, ref1, syntaxName, sytx, terminal, text;
        terminal = window.terminal;
        extn = slash.ext(changes.file);
        if (indexOf.call(Syntax.syntaxNames, extn) >= 0) {
            syntaxName = extn;
        } else {
            syntaxName = 'txt';
        }
        sytx = new Syntax(syntaxName, function(i) {
            return changes.lines[i];
        });
        index = 0;
        ref1 = changes.lines;
        for (j = 0, len = ref1.length; j < len; j++) {
            text = ref1[j];
            dss = sytx.getDiss(index);
            if (changes.change === 'deleted') {
                dss.map(function(ds) {
                    return ds.clss += ' ' + 'git-deleted';
                });
            } else if (changes.change === 'changed') {
                diffs = lineDiff(changes.info.mod[index].old, changes.info.mod[index]["new"]);
                for (k = 0, len1 = diffs.length; k < len1; k++) {
                    diff = diffs[k];
                    if (diff.change === 'delete') {
                        continue;
                    }
                    lineMeta = {
                        line: terminal.numLines(),
                        start: diff["new"],
                        end: diff["new"] + diff.length,
                        clss: 'gitInfoChange'
                    };
                    terminal.meta.add(lineMeta);
                }
            }
            meta = {
                diss: dss,
                href: changes.file + ":" + (changes.line + index),
                clss: 'searchResult',
                click: this.onMetaClick
            };
            terminal.appendMeta(meta);
            post.emit('search-result', meta);
            index += 1;
        }
        return index;
    };

    GitInfo.prototype.logFile = function(change, file) {
        var meta, symbol, terminal, text;
        text = (function() {
            switch (change) {
                case 'changed':
                    return '  ● ';
                case 'added':
                    return '  ◼ ';
                case 'deleted':
                    return '  ✘ ';
            }
        })();
        symbol = (function() {
            switch (change) {
                case 'changed':
                    return '●';
                case 'added':
                    return '◼';
                case 'deleted':
                    return '✘';
            }
        })();
        terminal = window.terminal;
        meta = {
            diss: Syntax.dissForTextAndSyntax("" + (slash.tilde(file)), 'ko'),
            href: file,
            clss: 'gitInfoFile',
            click: this.onMetaClick,
            line: symbol,
            lineClss: 'gitInfoLine ' + change
        };
        terminal.appendMeta(meta);
        return terminal.appendMeta({
            clss: 'spacer'
        });
    };

    GitInfo.prototype.start = function() {
        var dirOrFile, ref1, terminal;
        dirOrFile = (ref1 = window.cwd.cwd) != null ? ref1 : window.editor.currentFile;
        window.split.raise('terminal');
        terminal = window.terminal;
        terminal.clear();
        return hub.info(dirOrFile, (function(_this) {
            return function(info) {
                var change, changeInfo, data, file, j, k, len, len1, len2, len3, line, lines, m, n, ref2, ref3, ref4, ref5;
                if (empty(info)) {
                    return;
                }
                terminal = window.terminal;
                terminal.appendMeta({
                    clss: 'salt',
                    text: slash.tilde(info.gitDir)
                });
                terminal.appendMeta({
                    clss: 'spacer'
                });
                ref2 = info.deleted;
                for (j = 0, len = ref2.length; j < len; j++) {
                    file = ref2[j];
                    _this.logFile('deleted', file);
                }
                ref3 = info.added;
                for (k = 0, len1 = ref3.length; k < len1; k++) {
                    file = ref3[k];
                    _this.logFile('added', file);
                    if (slash.isText(file)) {
                        data = fs.readFileSync(file, {
                            encoding: 'utf8'
                        });
                        lines = data.split(/\r?\n/);
                        line = 1;
                        line += _this.logChanges({
                            lines: lines,
                            file: file,
                            line: line,
                            change: 'new'
                        });
                    }
                    terminal.appendMeta({
                        clss: 'spacer'
                    });
                }
                ref4 = info.changed;
                for (m = 0, len2 = ref4.length; m < len2; m++) {
                    changeInfo = ref4[m];
                    _this.logFile('changed', changeInfo.file);
                    ref5 = changeInfo.changes;
                    for (n = 0, len3 = ref5.length; n < len3; n++) {
                        change = ref5[n];
                        line = change.line;
                        if (!empty(change.mod)) {
                            lines = change.mod.map(function(l) {
                                return l["new"];
                            });
                            line += _this.logChanges({
                                lines: lines,
                                file: changeInfo.file,
                                line: line,
                                info: change,
                                change: 'changed'
                            });
                        }
                        if (!empty(change.add)) {
                            lines = change.add.map(function(l) {
                                return l["new"];
                            });
                            line += _this.logChanges({
                                lines: lines,
                                file: changeInfo.file,
                                line: line,
                                info: change,
                                change: 'added'
                            });
                        }
                        if (!empty(change.del)) {
                            lines = change.del.map(function(l) {
                                return l.old;
                            });
                            line += _this.logChanges({
                                lines: lines,
                                file: changeInfo.file,
                                line: line,
                                info: change,
                                change: 'deleted'
                            });
                        }
                        terminal.appendMeta({
                            clss: 'spacer'
                        });
                    }
                }
                return terminal.scroll.cursorToTop(7);
            };
        })(this));
    };

    return GitInfo;

})();

module.exports = new GitInfo;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2l0aW5mby5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvd2luIiwic291cmNlcyI6WyJnaXRpbmZvLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSwyREFBQTtJQUFBOzs7QUFRQSxNQUE2QixPQUFBLENBQVEsS0FBUixDQUE3QixFQUFFLGlCQUFGLEVBQVMsV0FBVCxFQUFhLGVBQWIsRUFBbUI7O0FBRW5CLFFBQUEsR0FBYSxPQUFBLENBQVEsbUJBQVI7O0FBQ2IsTUFBQSxHQUFhLE9BQUEsQ0FBUSxrQkFBUjs7QUFDYixHQUFBLEdBQWEsT0FBQSxDQUFRLFlBQVI7O0FBRVA7SUFFQyxpQkFBQTs7SUFBQTs7c0JBUUgsV0FBQSxHQUFhLFNBQUMsSUFBRCxFQUFPLEtBQVA7QUFFVCxZQUFBO1FBQUEsSUFBRyxJQUFBLEdBQU8sSUFBSyxDQUFBLENBQUEsQ0FBRSxDQUFDLElBQWxCO1lBQ0ksSUFBQSxJQUFRLEdBQUEsR0FBTSxNQUFNLENBQUMsUUFBUSxDQUFDLFdBQWhCLENBQTRCLEtBQTVCLENBQW1DLENBQUEsQ0FBQTtZQUNqRCxJQUFJLENBQUMsSUFBTCxDQUFVLFdBQVYsRUFBc0IsQ0FBQyxJQUFELENBQXRCLEVBQThCO2dCQUFBLE1BQUEsRUFBUSxLQUFLLENBQUMsT0FBZDthQUE5QixFQUZKOztlQUdBO0lBTFM7O3NCQU9iLE9BQUEsR0FBUyxTQUFDLElBQUQ7QUFFTCxZQUFBO1FBQUEsUUFBQSxHQUFXLE1BQU0sQ0FBQztlQUNsQixRQUFRLENBQUMsVUFBVCxDQUFvQjtZQUFBLElBQUEsRUFBSyxjQUFMO1lBQW9CLElBQUEsRUFBSyxNQUFNLENBQUMsb0JBQVAsQ0FBNEIsSUFBNUIsRUFBa0MsSUFBbEMsQ0FBekI7U0FBcEI7SUFISzs7c0JBV1QsVUFBQSxHQUFZLFNBQUMsT0FBRDtBQUVSLFlBQUE7UUFBQSxRQUFBLEdBQVcsTUFBTSxDQUFDO1FBRWxCLElBQUEsR0FBTyxLQUFLLENBQUMsR0FBTixDQUFVLE9BQU8sQ0FBQyxJQUFsQjtRQUNQLElBQUcsYUFBUSxNQUFNLENBQUMsV0FBZixFQUFBLElBQUEsTUFBSDtZQUNJLFVBQUEsR0FBYSxLQURqQjtTQUFBLE1BQUE7WUFHSSxVQUFBLEdBQWEsTUFIakI7O1FBS0EsSUFBQSxHQUFPLElBQUksTUFBSixDQUFXLFVBQVgsRUFBdUIsU0FBQyxDQUFEO21CQUFPLE9BQU8sQ0FBQyxLQUFNLENBQUEsQ0FBQTtRQUFyQixDQUF2QjtRQUVQLEtBQUEsR0FBUTtBQUNSO0FBQUEsYUFBQSxzQ0FBQTs7WUFFSSxHQUFBLEdBQU0sSUFBSSxDQUFDLE9BQUwsQ0FBYSxLQUFiO1lBRU4sSUFBRyxPQUFPLENBQUMsTUFBUixLQUFrQixTQUFyQjtnQkFFSSxHQUFHLENBQUMsR0FBSixDQUFRLFNBQUMsRUFBRDsyQkFBUSxFQUFFLENBQUMsSUFBSCxJQUFXLEdBQUEsR0FBTTtnQkFBekIsQ0FBUixFQUZKO2FBQUEsTUFJSyxJQUFHLE9BQU8sQ0FBQyxNQUFSLEtBQWtCLFNBQXJCO2dCQUVELEtBQUEsR0FBUSxRQUFBLENBQVMsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFJLENBQUEsS0FBQSxDQUFNLENBQUMsR0FBakMsRUFBc0MsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFJLENBQUEsS0FBQSxDQUFNLEVBQUMsR0FBRCxFQUE3RDtBQUNSLHFCQUFBLHlDQUFBOztvQkFDSSxJQUFZLElBQUksQ0FBQyxNQUFMLEtBQWUsUUFBM0I7QUFBQSxpQ0FBQTs7b0JBQ0EsUUFBQSxHQUNJO3dCQUFBLElBQUEsRUFBWSxRQUFRLENBQUMsUUFBVCxDQUFBLENBQVo7d0JBQ0EsS0FBQSxFQUFZLElBQUksRUFBQyxHQUFELEVBRGhCO3dCQUVBLEdBQUEsRUFBWSxJQUFJLEVBQUMsR0FBRCxFQUFKLEdBQVMsSUFBSSxDQUFDLE1BRjFCO3dCQUdBLElBQUEsRUFBWSxlQUhaOztvQkFJSixRQUFRLENBQUMsSUFBSSxDQUFDLEdBQWQsQ0FBa0IsUUFBbEI7QUFQSixpQkFIQzs7WUFZTCxJQUFBLEdBQ0k7Z0JBQUEsSUFBQSxFQUFNLEdBQU47Z0JBQ0EsSUFBQSxFQUFTLE9BQU8sQ0FBQyxJQUFULEdBQWMsR0FBZCxHQUFnQixDQUFDLE9BQU8sQ0FBQyxJQUFSLEdBQWEsS0FBZCxDQUR4QjtnQkFFQSxJQUFBLEVBQU0sY0FGTjtnQkFHQSxLQUFBLEVBQU8sSUFBQyxDQUFBLFdBSFI7O1lBS0osUUFBUSxDQUFDLFVBQVQsQ0FBb0IsSUFBcEI7WUFDQSxJQUFJLENBQUMsSUFBTCxDQUFVLGVBQVYsRUFBMEIsSUFBMUI7WUFDQSxLQUFBLElBQVM7QUE1QmI7ZUE2QkE7SUExQ1E7O3NCQWtEWixPQUFBLEdBQVMsU0FBQyxNQUFELEVBQVMsSUFBVDtBQUVMLFlBQUE7UUFBQSxJQUFBO0FBQU8sb0JBQU8sTUFBUDtBQUFBLHFCQUNFLFNBREY7MkJBQ2lCO0FBRGpCLHFCQUVFLE9BRkY7MkJBRWlCO0FBRmpCLHFCQUdFLFNBSEY7MkJBR2lCO0FBSGpCOztRQUtQLE1BQUE7QUFBUyxvQkFBTyxNQUFQO0FBQUEscUJBRUEsU0FGQTsyQkFFZTtBQUZmLHFCQUdBLE9BSEE7MkJBR2U7QUFIZixxQkFJQSxTQUpBOzJCQUllO0FBSmY7O1FBTVQsUUFBQSxHQUFXLE1BQU0sQ0FBQztRQUNsQixJQUFBLEdBQ0k7WUFBQSxJQUFBLEVBQVksTUFBTSxDQUFDLG9CQUFQLENBQTRCLEVBQUEsR0FBRSxDQUFDLEtBQUssQ0FBQyxLQUFOLENBQVksSUFBWixDQUFELENBQTlCLEVBQW1ELElBQW5ELENBQVo7WUFDQSxJQUFBLEVBQVksSUFEWjtZQUVBLElBQUEsRUFBWSxhQUZaO1lBR0EsS0FBQSxFQUFZLElBQUMsQ0FBQSxXQUhiO1lBSUEsSUFBQSxFQUFZLE1BSlo7WUFLQSxRQUFBLEVBQVksY0FBQSxHQUFlLE1BTDNCOztRQU9KLFFBQVEsQ0FBQyxVQUFULENBQW9CLElBQXBCO2VBQ0EsUUFBUSxDQUFDLFVBQVQsQ0FBb0I7WUFBQSxJQUFBLEVBQU0sUUFBTjtTQUFwQjtJQXZCSzs7c0JBK0JULEtBQUEsR0FBTyxTQUFBO0FBRUgsWUFBQTtRQUFBLFNBQUEsNENBQTZCLE1BQU0sQ0FBQyxNQUFNLENBQUM7UUFFM0MsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFiLENBQW1CLFVBQW5CO1FBQ0EsUUFBQSxHQUFXLE1BQU0sQ0FBQztRQUNsQixRQUFRLENBQUMsS0FBVCxDQUFBO2VBRUEsR0FBRyxDQUFDLElBQUosQ0FBUyxTQUFULEVBQW9CLENBQUEsU0FBQSxLQUFBO21CQUFBLFNBQUMsSUFBRDtBQUVoQixvQkFBQTtnQkFBQSxJQUFVLEtBQUEsQ0FBTSxJQUFOLENBQVY7QUFBQSwyQkFBQTs7Z0JBRUEsUUFBQSxHQUFXLE1BQU0sQ0FBQztnQkFDbEIsUUFBUSxDQUFDLFVBQVQsQ0FBb0I7b0JBQUEsSUFBQSxFQUFNLE1BQU47b0JBQWEsSUFBQSxFQUFNLEtBQUssQ0FBQyxLQUFOLENBQVksSUFBSSxDQUFDLE1BQWpCLENBQW5CO2lCQUFwQjtnQkFDQSxRQUFRLENBQUMsVUFBVCxDQUFvQjtvQkFBQSxJQUFBLEVBQU0sUUFBTjtpQkFBcEI7QUFFQTtBQUFBLHFCQUFBLHNDQUFBOztvQkFFSSxLQUFDLENBQUEsT0FBRCxDQUFTLFNBQVQsRUFBbUIsSUFBbkI7QUFGSjtBQUlBO0FBQUEscUJBQUEsd0NBQUE7O29CQUVJLEtBQUMsQ0FBQSxPQUFELENBQVMsT0FBVCxFQUFpQixJQUFqQjtvQkFFQSxJQUFHLEtBQUssQ0FBQyxNQUFOLENBQWEsSUFBYixDQUFIO3dCQUNJLElBQUEsR0FBUSxFQUFFLENBQUMsWUFBSCxDQUFnQixJQUFoQixFQUFzQjs0QkFBQSxRQUFBLEVBQVUsTUFBVjt5QkFBdEI7d0JBQ1IsS0FBQSxHQUFRLElBQUksQ0FBQyxLQUFMLENBQVcsT0FBWDt3QkFDUixJQUFBLEdBQVE7d0JBRVIsSUFBQSxJQUFRLEtBQUMsQ0FBQSxVQUFELENBQVk7NEJBQUEsS0FBQSxFQUFNLEtBQU47NEJBQWEsSUFBQSxFQUFLLElBQWxCOzRCQUF3QixJQUFBLEVBQUssSUFBN0I7NEJBQW1DLE1BQUEsRUFBTyxLQUExQzt5QkFBWixFQUxaOztvQkFPQSxRQUFRLENBQUMsVUFBVCxDQUFvQjt3QkFBQSxJQUFBLEVBQU0sUUFBTjtxQkFBcEI7QUFYSjtBQWFBO0FBQUEscUJBQUEsd0NBQUE7O29CQUVJLEtBQUMsQ0FBQSxPQUFELENBQVMsU0FBVCxFQUFtQixVQUFVLENBQUMsSUFBOUI7QUFFQTtBQUFBLHlCQUFBLHdDQUFBOzt3QkFDSSxJQUFBLEdBQU8sTUFBTSxDQUFDO3dCQUVkLElBQUcsQ0FBSSxLQUFBLENBQU0sTUFBTSxDQUFDLEdBQWIsQ0FBUDs0QkFDSSxLQUFBLEdBQVEsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFYLENBQWUsU0FBQyxDQUFEO3VDQUFPLENBQUMsRUFBQyxHQUFEOzRCQUFSLENBQWY7NEJBQ1IsSUFBQSxJQUFRLEtBQUMsQ0FBQSxVQUFELENBQVk7Z0NBQUEsS0FBQSxFQUFNLEtBQU47Z0NBQWEsSUFBQSxFQUFLLFVBQVUsQ0FBQyxJQUE3QjtnQ0FBbUMsSUFBQSxFQUFLLElBQXhDO2dDQUE4QyxJQUFBLEVBQUssTUFBbkQ7Z0NBQTJELE1BQUEsRUFBTyxTQUFsRTs2QkFBWixFQUZaOzt3QkFJQSxJQUFHLENBQUksS0FBQSxDQUFNLE1BQU0sQ0FBQyxHQUFiLENBQVA7NEJBQ0ksS0FBQSxHQUFRLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBWCxDQUFlLFNBQUMsQ0FBRDt1Q0FBTyxDQUFDLEVBQUMsR0FBRDs0QkFBUixDQUFmOzRCQUNSLElBQUEsSUFBUSxLQUFDLENBQUEsVUFBRCxDQUFZO2dDQUFBLEtBQUEsRUFBTSxLQUFOO2dDQUFhLElBQUEsRUFBSyxVQUFVLENBQUMsSUFBN0I7Z0NBQW1DLElBQUEsRUFBSyxJQUF4QztnQ0FBOEMsSUFBQSxFQUFLLE1BQW5EO2dDQUEyRCxNQUFBLEVBQU8sT0FBbEU7NkJBQVosRUFGWjs7d0JBSUEsSUFBRyxDQUFJLEtBQUEsQ0FBTSxNQUFNLENBQUMsR0FBYixDQUFQOzRCQUNJLEtBQUEsR0FBUSxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQVgsQ0FBZSxTQUFDLENBQUQ7dUNBQU8sQ0FBQyxDQUFDOzRCQUFULENBQWY7NEJBQ1IsSUFBQSxJQUFRLEtBQUMsQ0FBQSxVQUFELENBQVk7Z0NBQUEsS0FBQSxFQUFNLEtBQU47Z0NBQWEsSUFBQSxFQUFLLFVBQVUsQ0FBQyxJQUE3QjtnQ0FBbUMsSUFBQSxFQUFLLElBQXhDO2dDQUE4QyxJQUFBLEVBQUssTUFBbkQ7Z0NBQTJELE1BQUEsRUFBTyxTQUFsRTs2QkFBWixFQUZaOzt3QkFJQSxRQUFRLENBQUMsVUFBVCxDQUFvQjs0QkFBQSxJQUFBLEVBQU0sUUFBTjt5QkFBcEI7QUFmSjtBQUpKO3VCQXFCQSxRQUFRLENBQUMsTUFBTSxDQUFDLFdBQWhCLENBQTRCLENBQTVCO1lBOUNnQjtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBcEI7SUFSRzs7Ozs7O0FBd0RYLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLElBQUkiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbiAwMDAwMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgXG4wMDAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuMDAwICAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMCAgICAwMDAgICAwMDBcbjAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4gMDAwMDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAwMDAwIFxuIyMjXG5cbnsgZW1wdHksIGZzLCBwb3N0LCBzbGFzaCB9ID0gcmVxdWlyZSAna3hrJ1xuXG5saW5lRGlmZiAgID0gcmVxdWlyZSAnLi4vdG9vbHMvbGluZWRpZmYnXG5TeW50YXggICAgID0gcmVxdWlyZSAnLi4vZWRpdG9yL3N5bnRheCdcbmh1YiAgICAgICAgPSByZXF1aXJlICcuLi9naXQvaHViJ1xuXG5jbGFzcyBHaXRJbmZvXG4gICAgXG4gICAgQDogLT5cbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgICAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAgICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgIG9uTWV0YUNsaWNrOiAobWV0YSwgZXZlbnQpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBocmVmID0gbWV0YVsyXS5ocmVmXG4gICAgICAgICAgICBocmVmICs9ICc6JyArIHdpbmRvdy50ZXJtaW5hbC5wb3NGb3JFdmVudChldmVudClbMF1cbiAgICAgICAgICAgIHBvc3QuZW1pdCAnb3BlbkZpbGVzJyBbaHJlZl0sIG5ld1RhYjogZXZlbnQubWV0YUtleVxuICAgICAgICAndW5oYW5kbGVkJyAjIG90aGVyd2lzZSBjdXJzb3IgZG9lc24ndCBnZXQgc2V0XG4gICAgICAgIFxuICAgIGxvZ1RleHQ6ICh0ZXh0KSAtPlxuICAgICAgICBcbiAgICAgICAgdGVybWluYWwgPSB3aW5kb3cudGVybWluYWxcbiAgICAgICAgdGVybWluYWwuYXBwZW5kTWV0YSBjbHNzOidzZWFyY2hIZWFkZXInIGRpc3M6U3ludGF4LmRpc3NGb3JUZXh0QW5kU3ludGF4IHRleHQsICdrbydcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwICAgXG4gICAgXG4gICAgbG9nQ2hhbmdlczogKGNoYW5nZXMpIC0+XG4gICAgICAgIFxuICAgICAgICB0ZXJtaW5hbCA9IHdpbmRvdy50ZXJtaW5hbFxuICAgICAgICBcbiAgICAgICAgZXh0biA9IHNsYXNoLmV4dCBjaGFuZ2VzLmZpbGVcbiAgICAgICAgaWYgZXh0biBpbiBTeW50YXguc3ludGF4TmFtZXNcbiAgICAgICAgICAgIHN5bnRheE5hbWUgPSBleHRuXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHN5bnRheE5hbWUgPSAndHh0J1xuICAgICAgICBcbiAgICAgICAgc3l0eCA9IG5ldyBTeW50YXggc3ludGF4TmFtZSwgKGkpIC0+IGNoYW5nZXMubGluZXNbaV1cbiAgICAgICAgXG4gICAgICAgIGluZGV4ID0gMFxuICAgICAgICBmb3IgdGV4dCBpbiBjaGFuZ2VzLmxpbmVzXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGRzcyA9IHN5dHguZ2V0RGlzcyBpbmRleFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBjaGFuZ2VzLmNoYW5nZSA9PSAnZGVsZXRlZCdcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBkc3MubWFwIChkcykgLT4gZHMuY2xzcyArPSAnICcgKyAnZ2l0LWRlbGV0ZWQnXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBlbHNlIGlmIGNoYW5nZXMuY2hhbmdlID09ICdjaGFuZ2VkJ1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGRpZmZzID0gbGluZURpZmYgY2hhbmdlcy5pbmZvLm1vZFtpbmRleF0ub2xkLCBjaGFuZ2VzLmluZm8ubW9kW2luZGV4XS5uZXdcbiAgICAgICAgICAgICAgICBmb3IgZGlmZiBpbiBkaWZmcyBcbiAgICAgICAgICAgICAgICAgICAgY29udGludWUgaWYgZGlmZi5jaGFuZ2UgPT0gJ2RlbGV0ZSdcbiAgICAgICAgICAgICAgICAgICAgbGluZU1ldGEgPVxuICAgICAgICAgICAgICAgICAgICAgICAgbGluZTogICAgICAgdGVybWluYWwubnVtTGluZXMoKVxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnQ6ICAgICAgZGlmZi5uZXdcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZDogICAgICAgIGRpZmYubmV3K2RpZmYubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgICAgICBjbHNzOiAgICAgICAnZ2l0SW5mb0NoYW5nZSdcbiAgICAgICAgICAgICAgICAgICAgdGVybWluYWwubWV0YS5hZGQgbGluZU1ldGFcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIG1ldGEgPVxuICAgICAgICAgICAgICAgIGRpc3M6IGRzc1xuICAgICAgICAgICAgICAgIGhyZWY6IFwiI3tjaGFuZ2VzLmZpbGV9OiN7Y2hhbmdlcy5saW5lK2luZGV4fVwiXG4gICAgICAgICAgICAgICAgY2xzczogJ3NlYXJjaFJlc3VsdCdcbiAgICAgICAgICAgICAgICBjbGljazogQG9uTWV0YUNsaWNrXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICB0ZXJtaW5hbC5hcHBlbmRNZXRhIG1ldGFcbiAgICAgICAgICAgIHBvc3QuZW1pdCAnc2VhcmNoLXJlc3VsdCcgbWV0YVxuICAgICAgICAgICAgaW5kZXggKz0gMVxuICAgICAgICBpbmRleFxuICAgICAgICBcbiAgICAjIDAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICBcbiAgICBsb2dGaWxlOiAoY2hhbmdlLCBmaWxlKSAtPiBcbiAgICAgICAgXG4gICAgICAgIHRleHQgPSBzd2l0Y2ggY2hhbmdlXG4gICAgICAgICAgICB3aGVuICdjaGFuZ2VkJyB0aGVuICcgIOKXjyAnXG4gICAgICAgICAgICB3aGVuICdhZGRlZCcgICB0aGVuICcgIOKXvCAnXG4gICAgICAgICAgICB3aGVuICdkZWxldGVkJyB0aGVuICcgIOKcmCAnXG4gICAgICAgICAgICBcbiAgICAgICAgc3ltYm9sID0gc3dpdGNoIGNoYW5nZVxuXG4gICAgICAgICAgICB3aGVuICdjaGFuZ2VkJyB0aGVuICfil48nXG4gICAgICAgICAgICB3aGVuICdhZGRlZCcgICB0aGVuICfil7wnXG4gICAgICAgICAgICB3aGVuICdkZWxldGVkJyB0aGVuICfinJgnXG4gICAgICAgICAgICBcbiAgICAgICAgdGVybWluYWwgPSB3aW5kb3cudGVybWluYWxcbiAgICAgICAgbWV0YSA9IFxuICAgICAgICAgICAgZGlzczogICAgICAgU3ludGF4LmRpc3NGb3JUZXh0QW5kU3ludGF4IFwiI3tzbGFzaC50aWxkZSBmaWxlfVwiLCAna28nXG4gICAgICAgICAgICBocmVmOiAgICAgICBmaWxlXG4gICAgICAgICAgICBjbHNzOiAgICAgICAnZ2l0SW5mb0ZpbGUnXG4gICAgICAgICAgICBjbGljazogICAgICBAb25NZXRhQ2xpY2tcbiAgICAgICAgICAgIGxpbmU6ICAgICAgIHN5bWJvbFxuICAgICAgICAgICAgbGluZUNsc3M6ICAgJ2dpdEluZm9MaW5lICcrY2hhbmdlXG4gICAgICAgICAgICBcbiAgICAgICAgdGVybWluYWwuYXBwZW5kTWV0YSBtZXRhXG4gICAgICAgIHRlcm1pbmFsLmFwcGVuZE1ldGEgY2xzczogJ3NwYWNlcidcbiAgICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgICAgMDAwICAgICBcbiAgICAjICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgc3RhcnQ6IC0+IFxuICAgICAgICBcbiAgICAgICAgZGlyT3JGaWxlID0gd2luZG93LmN3ZC5jd2QgPyB3aW5kb3cuZWRpdG9yLmN1cnJlbnRGaWxlXG5cbiAgICAgICAgd2luZG93LnNwbGl0LnJhaXNlICd0ZXJtaW5hbCdcbiAgICAgICAgdGVybWluYWwgPSB3aW5kb3cudGVybWluYWxcbiAgICAgICAgdGVybWluYWwuY2xlYXIoKVxuICAgICAgICBcbiAgICAgICAgaHViLmluZm8gZGlyT3JGaWxlLCAoaW5mbykgPT5cblxuICAgICAgICAgICAgcmV0dXJuIGlmIGVtcHR5IGluZm9cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGVybWluYWwgPSB3aW5kb3cudGVybWluYWxcbiAgICAgICAgICAgIHRlcm1pbmFsLmFwcGVuZE1ldGEgY2xzczogJ3NhbHQnIHRleHQ6IHNsYXNoLnRpbGRlIGluZm8uZ2l0RGlyXG4gICAgICAgICAgICB0ZXJtaW5hbC5hcHBlbmRNZXRhIGNsc3M6ICdzcGFjZXInXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBmb3IgZmlsZSBpbiBpbmZvLmRlbGV0ZWRcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBAbG9nRmlsZSAnZGVsZXRlZCcgZmlsZSAjIGRvbnQgZGVsZXRlIHRoaXMgZm9yIG5vdyA6KVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yIGZpbGUgaW4gaW5mby5hZGRlZFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIEBsb2dGaWxlICdhZGRlZCcgZmlsZSAgIyBkb250IGRlbGV0ZSB0aGlzIGZvciBub3cgOilcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiBzbGFzaC5pc1RleHQgZmlsZVxuICAgICAgICAgICAgICAgICAgICBkYXRhICA9IGZzLnJlYWRGaWxlU3luYyBmaWxlLCBlbmNvZGluZzogJ3V0ZjgnXG4gICAgICAgICAgICAgICAgICAgIGxpbmVzID0gZGF0YS5zcGxpdCAvXFxyP1xcbi9cbiAgICAgICAgICAgICAgICAgICAgbGluZSAgPSAxXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBsaW5lICs9IEBsb2dDaGFuZ2VzIGxpbmVzOmxpbmVzLCBmaWxlOmZpbGUsIGxpbmU6bGluZSwgY2hhbmdlOiduZXcnXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHRlcm1pbmFsLmFwcGVuZE1ldGEgY2xzczogJ3NwYWNlcidcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciBjaGFuZ2VJbmZvIGluIGluZm8uY2hhbmdlZCAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBAbG9nRmlsZSAnY2hhbmdlZCcgY2hhbmdlSW5mby5maWxlICMgZG9udCBkZWxldGUgdGhpcyBmb3Igbm93IDopXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZm9yIGNoYW5nZSBpbiBjaGFuZ2VJbmZvLmNoYW5nZXNcbiAgICAgICAgICAgICAgICAgICAgbGluZSA9IGNoYW5nZS5saW5lXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiBub3QgZW1wdHkgY2hhbmdlLm1vZFxuICAgICAgICAgICAgICAgICAgICAgICAgbGluZXMgPSBjaGFuZ2UubW9kLm1hcCAobCkgLT4gbC5uZXdcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpbmUgKz0gQGxvZ0NoYW5nZXMgbGluZXM6bGluZXMsIGZpbGU6Y2hhbmdlSW5mby5maWxlLCBsaW5lOmxpbmUsIGluZm86Y2hhbmdlLCBjaGFuZ2U6J2NoYW5nZWQnXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgbm90IGVtcHR5IGNoYW5nZS5hZGRcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpbmVzID0gY2hhbmdlLmFkZC5tYXAgKGwpIC0+IGwubmV3XG4gICAgICAgICAgICAgICAgICAgICAgICBsaW5lICs9IEBsb2dDaGFuZ2VzIGxpbmVzOmxpbmVzLCBmaWxlOmNoYW5nZUluZm8uZmlsZSwgbGluZTpsaW5lLCBpbmZvOmNoYW5nZSwgY2hhbmdlOidhZGRlZCdcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiBub3QgZW1wdHkgY2hhbmdlLmRlbFxuICAgICAgICAgICAgICAgICAgICAgICAgbGluZXMgPSBjaGFuZ2UuZGVsLm1hcCAobCkgLT4gbC5vbGRcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpbmUgKz0gQGxvZ0NoYW5nZXMgbGluZXM6bGluZXMsIGZpbGU6Y2hhbmdlSW5mby5maWxlLCBsaW5lOmxpbmUsIGluZm86Y2hhbmdlLCBjaGFuZ2U6J2RlbGV0ZWQnXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgdGVybWluYWwuYXBwZW5kTWV0YSBjbHNzOiAnc3BhY2VyJ1xuXG4gICAgICAgICAgICB0ZXJtaW5hbC5zY3JvbGwuY3Vyc29yVG9Ub3AgN1xuICAgICAgICBcbm1vZHVsZS5leHBvcnRzID0gbmV3IEdpdEluZm9cbiJdfQ==
//# sourceURL=../../coffee/win/gitinfo.coffee