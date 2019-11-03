// koffee 1.4.0

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

ref = require('kxk'), post = ref.post, slash = ref.slash, empty = ref.empty, fs = ref.fs;

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
        sytx.setFileType(syntaxName);
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
        terminal.doAutoClear();
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2l0aW5mby5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsMkRBQUE7SUFBQTs7O0FBUUEsTUFBNkIsT0FBQSxDQUFRLEtBQVIsQ0FBN0IsRUFBRSxlQUFGLEVBQVEsaUJBQVIsRUFBZSxpQkFBZixFQUFzQjs7QUFFdEIsUUFBQSxHQUFhLE9BQUEsQ0FBUSxtQkFBUjs7QUFDYixNQUFBLEdBQWEsT0FBQSxDQUFRLGtCQUFSOztBQUNiLEdBQUEsR0FBYSxPQUFBLENBQVEsWUFBUjs7QUFFUDtJQUVDLGlCQUFBOztJQUFBOztzQkFRSCxXQUFBLEdBQWEsU0FBQyxJQUFELEVBQU8sS0FBUDtBQUVULFlBQUE7UUFBQSxJQUFHLElBQUEsR0FBTyxJQUFLLENBQUEsQ0FBQSxDQUFFLENBQUMsSUFBbEI7WUFDSSxJQUFBLElBQVEsR0FBQSxHQUFNLE1BQU0sQ0FBQyxRQUFRLENBQUMsV0FBaEIsQ0FBNEIsS0FBNUIsQ0FBbUMsQ0FBQSxDQUFBO1lBQ2pELElBQUksQ0FBQyxJQUFMLENBQVUsV0FBVixFQUF1QixDQUFDLElBQUQsQ0FBdkIsRUFBK0I7Z0JBQUEsTUFBQSxFQUFRLEtBQUssQ0FBQyxPQUFkO2FBQS9CLEVBRko7O2VBR0E7SUFMUzs7c0JBT2IsT0FBQSxHQUFTLFNBQUMsSUFBRDtBQUVMLFlBQUE7UUFBQSxRQUFBLEdBQVcsTUFBTSxDQUFDO2VBQ2xCLFFBQVEsQ0FBQyxVQUFULENBQW9CO1lBQUEsSUFBQSxFQUFLLGNBQUw7WUFBcUIsSUFBQSxFQUFLLE1BQU0sQ0FBQyxvQkFBUCxDQUE0QixJQUE1QixFQUFrQyxJQUFsQyxDQUExQjtTQUFwQjtJQUhLOztzQkFXVCxVQUFBLEdBQVksU0FBQyxPQUFEO0FBRVIsWUFBQTtRQUFBLFFBQUEsR0FBVyxNQUFNLENBQUM7UUFFbEIsSUFBQSxHQUFPLEtBQUssQ0FBQyxHQUFOLENBQVUsT0FBTyxDQUFDLElBQWxCO1FB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QWUsU0FBQyxDQUFEO3VDQUFPLENBQUMsQ0FBQzs0QkFBVCxDQUFmOzRCQUNSLElBQUEsSUFBUSxLQUFDLENBQUEsVUFBRCxDQUFZO2dDQUFBLEtBQUEsRUFBTSxLQUFOO2dDQUFhLElBQUEsRUFBSyxVQUFVLENBQUMsSUFBN0I7Z0NBQW1DLElBQUEsRUFBSyxJQUF4QztnQ0FBOEMsSUFBQSxFQUFLLE1BQW5EO2dDQUEyRCxNQUFBLEVBQU8sU0FBbEU7NkJBQVosRUFGWjs7d0JBSUEsUUFBUSxDQUFDLFVBQVQsQ0FBb0I7NEJBQUEsSUFBQSxFQUFNLFFBQU47eUJBQXBCO0FBZko7QUFKSjt1QkFxQkEsUUFBUSxDQUFDLE1BQU0sQ0FBQyxXQUFoQixDQUE0QixDQUE1QjtZQTlDZ0I7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXBCO0lBUkc7Ozs7OztBQXdEWCxNQUFNLENBQUMsT0FBUCxHQUFpQixJQUFJIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwIFxuMDAwICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbjAwMCAgMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAgICAgMDAwICAgMDAwXG4wMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuIDAwMDAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwMDAwMCBcbiMjI1xuXG57IHBvc3QsIHNsYXNoLCBlbXB0eSwgZnMgfSA9IHJlcXVpcmUgJ2t4aydcblxubGluZURpZmYgICA9IHJlcXVpcmUgJy4uL3Rvb2xzL2xpbmVkaWZmJ1xuU3ludGF4ICAgICA9IHJlcXVpcmUgJy4uL2VkaXRvci9zeW50YXgnXG5odWIgICAgICAgID0gcmVxdWlyZSAnLi4vZ2l0L2h1YidcblxuY2xhc3MgR2l0SW5mb1xuICAgIFxuICAgIEA6IC0+XG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICBvbk1ldGFDbGljazogKG1ldGEsIGV2ZW50KSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgaHJlZiA9IG1ldGFbMl0uaHJlZlxuICAgICAgICAgICAgaHJlZiArPSAnOicgKyB3aW5kb3cudGVybWluYWwucG9zRm9yRXZlbnQoZXZlbnQpWzBdXG4gICAgICAgICAgICBwb3N0LmVtaXQgJ29wZW5GaWxlcycsIFtocmVmXSwgbmV3VGFiOiBldmVudC5tZXRhS2V5XG4gICAgICAgICd1bmhhbmRsZWQnICMgb3RoZXJ3aXNlIGN1cnNvciBkb2Vzbid0IGdldCBzZXRcbiAgICAgICAgXG4gICAgbG9nVGV4dDogKHRleHQpIC0+XG4gICAgICAgIFxuICAgICAgICB0ZXJtaW5hbCA9IHdpbmRvdy50ZXJtaW5hbFxuICAgICAgICB0ZXJtaW5hbC5hcHBlbmRNZXRhIGNsc3M6J3NlYXJjaEhlYWRlcicsIGRpc3M6U3ludGF4LmRpc3NGb3JUZXh0QW5kU3ludGF4IHRleHQsICdrbydcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwICAgXG4gICAgXG4gICAgbG9nQ2hhbmdlczogKGNoYW5nZXMpIC0+XG4gICAgICAgIFxuICAgICAgICB0ZXJtaW5hbCA9IHdpbmRvdy50ZXJtaW5hbFxuICAgICAgICBcbiAgICAgICAgZXh0biA9IHNsYXNoLmV4dCBjaGFuZ2VzLmZpbGVcbiAgICAgICAgaWYgZXh0biBpbiBTeW50YXguc3ludGF4TmFtZXNcbiAgICAgICAgICAgIHN5bnRheE5hbWUgPSBleHRuXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHN5bnRheE5hbWUgPSAndHh0J1xuICAgICAgICBcbiAgICAgICAgc3l0eCA9IG5ldyBTeW50YXggc3ludGF4TmFtZSwgKGkpIC0+IGNoYW5nZXMubGluZXNbaV1cbiAgICAgICAgc3l0eC5zZXRGaWxlVHlwZSBzeW50YXhOYW1lXG4gICAgICAgIFxuICAgICAgICBpbmRleCA9IDBcbiAgICAgICAgZm9yIHRleHQgaW4gY2hhbmdlcy5saW5lc1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBkc3MgPSBzeXR4LmdldERpc3MgaW5kZXhcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgY2hhbmdlcy5jaGFuZ2UgPT0gJ2RlbGV0ZWQnXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZHNzLm1hcCAoZHMpIC0+IGRzLmNsc3MgKz0gJyAnICsgJ2dpdC1kZWxldGVkJ1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgZWxzZSBpZiBjaGFuZ2VzLmNoYW5nZSA9PSAnY2hhbmdlZCdcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBkaWZmcyA9IGxpbmVEaWZmIGNoYW5nZXMuaW5mby5tb2RbaW5kZXhdLm9sZCwgY2hhbmdlcy5pbmZvLm1vZFtpbmRleF0ubmV3XG4gICAgICAgICAgICAgICAgZm9yIGRpZmYgaW4gZGlmZnMgXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlIGlmIGRpZmYuY2hhbmdlID09ICdkZWxldGUnXG4gICAgICAgICAgICAgICAgICAgIGxpbmVNZXRhID1cbiAgICAgICAgICAgICAgICAgICAgICAgIGxpbmU6ICAgICAgIHRlcm1pbmFsLm51bUxpbmVzKClcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0OiAgICAgIGRpZmYubmV3XG4gICAgICAgICAgICAgICAgICAgICAgICBlbmQ6ICAgICAgICBkaWZmLm5ldytkaWZmLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICAgICAgY2xzczogICAgICAgJ2dpdEluZm9DaGFuZ2UnXG4gICAgICAgICAgICAgICAgICAgIHRlcm1pbmFsLm1ldGEuYWRkIGxpbmVNZXRhXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBtZXRhID1cbiAgICAgICAgICAgICAgICBkaXNzOiBkc3NcbiAgICAgICAgICAgICAgICBocmVmOiBcIiN7Y2hhbmdlcy5maWxlfToje2NoYW5nZXMubGluZStpbmRleH1cIlxuICAgICAgICAgICAgICAgIGNsc3M6ICdzZWFyY2hSZXN1bHQnXG4gICAgICAgICAgICAgICAgY2xpY2s6IEBvbk1ldGFDbGlja1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgdGVybWluYWwuYXBwZW5kTWV0YSBtZXRhXG4gICAgICAgICAgICBwb3N0LmVtaXQgJ3NlYXJjaC1yZXN1bHQnLCBtZXRhXG4gICAgICAgICAgICBpbmRleCArPSAxXG4gICAgICAgIGluZGV4XG4gICAgICAgIFxuICAgICMgMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwICAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgIFxuICAgIGxvZ0ZpbGU6IChjaGFuZ2UsIGZpbGUpIC0+IFxuICAgICAgICBcbiAgICAgICAgdGV4dCA9IHN3aXRjaCBjaGFuZ2VcbiAgICAgICAgICAgIHdoZW4gJ2NoYW5nZWQnIHRoZW4gJyAg4pePICdcbiAgICAgICAgICAgIHdoZW4gJ2FkZGVkJyAgIHRoZW4gJyAg4pe8ICdcbiAgICAgICAgICAgIHdoZW4gJ2RlbGV0ZWQnIHRoZW4gJyAg4pyYICdcbiAgICAgICAgICAgIFxuICAgICAgICBzeW1ib2wgPSBzd2l0Y2ggY2hhbmdlXG5cbiAgICAgICAgICAgIHdoZW4gJ2NoYW5nZWQnIHRoZW4gJ+KXjydcbiAgICAgICAgICAgIHdoZW4gJ2FkZGVkJyAgIHRoZW4gJ+KXvCdcbiAgICAgICAgICAgIHdoZW4gJ2RlbGV0ZWQnIHRoZW4gJ+KcmCdcbiAgICAgICAgICAgIFxuICAgICAgICB0ZXJtaW5hbCA9IHdpbmRvdy50ZXJtaW5hbFxuICAgICAgICBtZXRhID0gXG4gICAgICAgICAgICBkaXNzOiAgICAgICBTeW50YXguZGlzc0ZvclRleHRBbmRTeW50YXggXCIje3NsYXNoLnRpbGRlIGZpbGV9XCIsICdrbydcbiAgICAgICAgICAgIGhyZWY6ICAgICAgIGZpbGVcbiAgICAgICAgICAgIGNsc3M6ICAgICAgICdnaXRJbmZvRmlsZSdcbiAgICAgICAgICAgIGNsaWNrOiAgICAgIEBvbk1ldGFDbGlja1xuICAgICAgICAgICAgbGluZTogICAgICAgc3ltYm9sXG4gICAgICAgICAgICBsaW5lQ2xzczogICAnZ2l0SW5mb0xpbmUgJytjaGFuZ2VcbiAgICAgICAgICAgIFxuICAgICAgICB0ZXJtaW5hbC5hcHBlbmRNZXRhIG1ldGFcbiAgICAgICAgdGVybWluYWwuYXBwZW5kTWV0YSBjbHNzOiAnc3BhY2VyJ1xuICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBzdGFydDogLT4gXG4gICAgICAgIFxuICAgICAgICBkaXJPckZpbGUgPSB3aW5kb3cuY3dkLmN3ZCA/IHdpbmRvdy5lZGl0b3IuY3VycmVudEZpbGVcblxuICAgICAgICB3aW5kb3cuc3BsaXQucmFpc2UgJ3Rlcm1pbmFsJ1xuICAgICAgICB0ZXJtaW5hbCA9IHdpbmRvdy50ZXJtaW5hbFxuICAgICAgICB0ZXJtaW5hbC5kb0F1dG9DbGVhcigpXG4gICAgICAgIFxuICAgICAgICBodWIuaW5mbyBkaXJPckZpbGUsIChpbmZvKSA9PlxuXG4gICAgICAgICAgICByZXR1cm4gaWYgZW1wdHkgaW5mb1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB0ZXJtaW5hbCA9IHdpbmRvdy50ZXJtaW5hbFxuICAgICAgICAgICAgdGVybWluYWwuYXBwZW5kTWV0YSBjbHNzOiAnc2FsdCcsIHRleHQ6IHNsYXNoLnRpbGRlIGluZm8uZ2l0RGlyXG4gICAgICAgICAgICB0ZXJtaW5hbC5hcHBlbmRNZXRhIGNsc3M6ICdzcGFjZXInXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBmb3IgZmlsZSBpbiBpbmZvLmRlbGV0ZWRcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBAbG9nRmlsZSAnZGVsZXRlZCcsIGZpbGUgIyBkb250IGRlbGV0ZSB0aGlzIGZvciBub3cgOilcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciBmaWxlIGluIGluZm8uYWRkZWRcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBAbG9nRmlsZSAnYWRkZWQnLCBmaWxlICAjIGRvbnQgZGVsZXRlIHRoaXMgZm9yIG5vdyA6KVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIHNsYXNoLmlzVGV4dCBmaWxlXG4gICAgICAgICAgICAgICAgICAgIGRhdGEgID0gZnMucmVhZEZpbGVTeW5jIGZpbGUsIGVuY29kaW5nOiAndXRmOCdcbiAgICAgICAgICAgICAgICAgICAgbGluZXMgPSBkYXRhLnNwbGl0IC9cXHI/XFxuL1xuICAgICAgICAgICAgICAgICAgICBsaW5lICA9IDFcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGxpbmUgKz0gQGxvZ0NoYW5nZXMgbGluZXM6bGluZXMsIGZpbGU6ZmlsZSwgbGluZTpsaW5lLCBjaGFuZ2U6J25ldydcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdGVybWluYWwuYXBwZW5kTWV0YSBjbHNzOiAnc3BhY2VyJ1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yIGNoYW5nZUluZm8gaW4gaW5mby5jaGFuZ2VkICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIEBsb2dGaWxlICdjaGFuZ2VkJywgY2hhbmdlSW5mby5maWxlICMgZG9udCBkZWxldGUgdGhpcyBmb3Igbm93IDopXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZm9yIGNoYW5nZSBpbiBjaGFuZ2VJbmZvLmNoYW5nZXNcbiAgICAgICAgICAgICAgICAgICAgbGluZSA9IGNoYW5nZS5saW5lXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiBub3QgZW1wdHkgY2hhbmdlLm1vZFxuICAgICAgICAgICAgICAgICAgICAgICAgbGluZXMgPSBjaGFuZ2UubW9kLm1hcCAobCkgLT4gbC5uZXdcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpbmUgKz0gQGxvZ0NoYW5nZXMgbGluZXM6bGluZXMsIGZpbGU6Y2hhbmdlSW5mby5maWxlLCBsaW5lOmxpbmUsIGluZm86Y2hhbmdlLCBjaGFuZ2U6J2NoYW5nZWQnXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgbm90IGVtcHR5IGNoYW5nZS5hZGRcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpbmVzID0gY2hhbmdlLmFkZC5tYXAgKGwpIC0+IGwubmV3XG4gICAgICAgICAgICAgICAgICAgICAgICBsaW5lICs9IEBsb2dDaGFuZ2VzIGxpbmVzOmxpbmVzLCBmaWxlOmNoYW5nZUluZm8uZmlsZSwgbGluZTpsaW5lLCBpbmZvOmNoYW5nZSwgY2hhbmdlOidhZGRlZCdcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiBub3QgZW1wdHkgY2hhbmdlLmRlbFxuICAgICAgICAgICAgICAgICAgICAgICAgbGluZXMgPSBjaGFuZ2UuZGVsLm1hcCAobCkgLT4gbC5vbGRcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpbmUgKz0gQGxvZ0NoYW5nZXMgbGluZXM6bGluZXMsIGZpbGU6Y2hhbmdlSW5mby5maWxlLCBsaW5lOmxpbmUsIGluZm86Y2hhbmdlLCBjaGFuZ2U6J2RlbGV0ZWQnXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgdGVybWluYWwuYXBwZW5kTWV0YSBjbHNzOiAnc3BhY2VyJ1xuXG4gICAgICAgICAgICB0ZXJtaW5hbC5zY3JvbGwuY3Vyc29yVG9Ub3AgN1xuICAgICAgICBcbm1vZHVsZS5leHBvcnRzID0gbmV3IEdpdEluZm9cbiJdfQ==
//# sourceURL=../../coffee/win/gitinfo.coffee