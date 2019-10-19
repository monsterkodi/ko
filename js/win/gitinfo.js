// koffee 1.3.0

/*
 0000000   000  000000000  000  000   000  00000000   0000000 
000        000     000     000  0000  000  000       000   000
000  0000  000     000     000  000 0 000  000000    000   000
000   000  000     000     000  000  0000  000       000   000
 0000000   000     000     000  000   000  000        0000000
 */
var $, GitInfo, Syntax, _, elem, empty, fs, hub, lineDiff, post, ref, slash,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    indexOf = [].indexOf;

ref = require('kxk'), post = ref.post, slash = ref.slash, elem = ref.elem, empty = ref.empty, fs = ref.fs, $ = ref.$, _ = ref._;

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
                    return ds.value += ' ' + 'git-deleted';
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2l0aW5mby5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsdUVBQUE7SUFBQTs7O0FBUUEsTUFBeUMsT0FBQSxDQUFRLEtBQVIsQ0FBekMsRUFBRSxlQUFGLEVBQVEsaUJBQVIsRUFBZSxlQUFmLEVBQXFCLGlCQUFyQixFQUE0QixXQUE1QixFQUFnQyxTQUFoQyxFQUFtQzs7QUFFbkMsUUFBQSxHQUFhLE9BQUEsQ0FBUSxtQkFBUjs7QUFDYixNQUFBLEdBQWEsT0FBQSxDQUFRLGtCQUFSOztBQUNiLEdBQUEsR0FBYSxPQUFBLENBQVEsWUFBUjs7QUFFUDtJQUVXLGlCQUFBOztJQUFBOztzQkFRYixXQUFBLEdBQWEsU0FBQyxJQUFELEVBQU8sS0FBUDtBQUVULFlBQUE7UUFBQSxJQUFHLElBQUEsR0FBTyxJQUFLLENBQUEsQ0FBQSxDQUFFLENBQUMsSUFBbEI7WUFDSSxJQUFBLElBQVEsR0FBQSxHQUFNLE1BQU0sQ0FBQyxRQUFRLENBQUMsV0FBaEIsQ0FBNEIsS0FBNUIsQ0FBbUMsQ0FBQSxDQUFBO1lBQ2pELElBQUksQ0FBQyxJQUFMLENBQVUsV0FBVixFQUF1QixDQUFDLElBQUQsQ0FBdkIsRUFBK0I7Z0JBQUEsTUFBQSxFQUFRLEtBQUssQ0FBQyxPQUFkO2FBQS9CLEVBRko7O2VBR0E7SUFMUzs7c0JBT2IsT0FBQSxHQUFTLFNBQUMsSUFBRDtBQUVMLFlBQUE7UUFBQSxRQUFBLEdBQVcsTUFBTSxDQUFDO2VBQ2xCLFFBQVEsQ0FBQyxVQUFULENBQW9CO1lBQUEsSUFBQSxFQUFLLGNBQUw7WUFBcUIsSUFBQSxFQUFLLE1BQU0sQ0FBQyxvQkFBUCxDQUE0QixJQUE1QixFQUFrQyxJQUFsQyxDQUExQjtTQUFwQjtJQUhLOztzQkFXVCxVQUFBLEdBQVksU0FBQyxPQUFEO0FBRVIsWUFBQTtRQUFBLFFBQUEsR0FBVyxNQUFNLENBQUM7UUFFbEIsSUFBQSxHQUFPLEtB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QUFBLEdBQVEsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFYLENBQWUsU0FBQyxDQUFEO3VDQUFPLENBQUMsQ0FBQzs0QkFBVCxDQUFmOzRCQUNSLElBQUEsSUFBUSxLQUFDLENBQUEsVUFBRCxDQUFZO2dDQUFBLEtBQUEsRUFBTSxLQUFOO2dDQUFhLElBQUEsRUFBSyxVQUFVLENBQUMsSUFBN0I7Z0NBQW1DLElBQUEsRUFBSyxJQUF4QztnQ0FBOEMsSUFBQSxFQUFLLE1BQW5EO2dDQUEyRCxNQUFBLEVBQU8sU0FBbEU7NkJBQVosRUFGWjs7d0JBSUEsUUFBUSxDQUFDLFVBQVQsQ0FBb0I7NEJBQUEsSUFBQSxFQUFNLFFBQU47eUJBQXBCO0FBZko7QUFKSjt1QkFxQkEsUUFBUSxDQUFDLE1BQU0sQ0FBQyxXQUFoQixDQUE0QixDQUE1QjtZQTlDZ0I7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXBCO0lBUkc7Ozs7OztBQXdEWCxNQUFNLENBQUMsT0FBUCxHQUFpQixJQUFJIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwIFxuMDAwICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbjAwMCAgMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAgICAgMDAwICAgMDAwXG4wMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuIDAwMDAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwMDAwMCBcbiMjI1xuXG57IHBvc3QsIHNsYXNoLCBlbGVtLCBlbXB0eSwgZnMsICQsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxubGluZURpZmYgICA9IHJlcXVpcmUgJy4uL3Rvb2xzL2xpbmVkaWZmJ1xuU3ludGF4ICAgICA9IHJlcXVpcmUgJy4uL2VkaXRvci9zeW50YXgnXG5odWIgICAgICAgID0gcmVxdWlyZSAnLi4vZ2l0L2h1YidcblxuY2xhc3MgR2l0SW5mb1xuICAgIFxuICAgIGNvbnN0cnVjdG9yOiAtPlxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAgICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgIFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgb25NZXRhQ2xpY2s6IChtZXRhLCBldmVudCkgPT5cbiAgICAgICAgXG4gICAgICAgIGlmIGhyZWYgPSBtZXRhWzJdLmhyZWZcbiAgICAgICAgICAgIGhyZWYgKz0gJzonICsgd2luZG93LnRlcm1pbmFsLnBvc0ZvckV2ZW50KGV2ZW50KVswXVxuICAgICAgICAgICAgcG9zdC5lbWl0ICdvcGVuRmlsZXMnLCBbaHJlZl0sIG5ld1RhYjogZXZlbnQubWV0YUtleVxuICAgICAgICAndW5oYW5kbGVkJyAjIG90aGVyd2lzZSBjdXJzb3IgZG9lc24ndCBnZXQgc2V0XG4gICAgICAgIFxuICAgIGxvZ1RleHQ6ICh0ZXh0KSAtPlxuICAgICAgICBcbiAgICAgICAgdGVybWluYWwgPSB3aW5kb3cudGVybWluYWxcbiAgICAgICAgdGVybWluYWwuYXBwZW5kTWV0YSBjbHNzOidzZWFyY2hIZWFkZXInLCBkaXNzOlN5bnRheC5kaXNzRm9yVGV4dEFuZFN5bnRheCB0ZXh0LCAna28nXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMCAgIFxuICAgIFxuICAgIGxvZ0NoYW5nZXM6IChjaGFuZ2VzKSAtPlxuICAgICAgICBcbiAgICAgICAgdGVybWluYWwgPSB3aW5kb3cudGVybWluYWxcbiAgICAgICAgXG4gICAgICAgIGV4dG4gPSBzbGFzaC5leHQgY2hhbmdlcy5maWxlXG4gICAgICAgIGlmIGV4dG4gaW4gU3ludGF4LnN5bnRheE5hbWVzXG4gICAgICAgICAgICBzeW50YXhOYW1lID0gZXh0blxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBzeW50YXhOYW1lID0gJ3R4dCdcbiAgICAgICAgXG4gICAgICAgIHN5dHggPSBuZXcgU3ludGF4IHN5bnRheE5hbWUsIChpKSAtPiBjaGFuZ2VzLmxpbmVzW2ldXG4gICAgICAgIHN5dHguc2V0RmlsZVR5cGUgc3ludGF4TmFtZVxuICAgICAgICBcbiAgICAgICAgaW5kZXggPSAwXG4gICAgICAgIGZvciB0ZXh0IGluIGNoYW5nZXMubGluZXNcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZHNzID0gc3l0eC5nZXREaXNzIGluZGV4XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIGNoYW5nZXMuY2hhbmdlID09ICdkZWxldGVkJ1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGRzcy5tYXAgKGRzKSAtPiBkcy52YWx1ZSArPSAnICcgKyAnZ2l0LWRlbGV0ZWQnXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBlbHNlIGlmIGNoYW5nZXMuY2hhbmdlID09ICdjaGFuZ2VkJ1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGRpZmZzID0gbGluZURpZmYgY2hhbmdlcy5pbmZvLm1vZFtpbmRleF0ub2xkLCBjaGFuZ2VzLmluZm8ubW9kW2luZGV4XS5uZXdcbiAgICAgICAgICAgICAgICBmb3IgZGlmZiBpbiBkaWZmcyBcbiAgICAgICAgICAgICAgICAgICAgY29udGludWUgaWYgZGlmZi5jaGFuZ2UgPT0gJ2RlbGV0ZSdcbiAgICAgICAgICAgICAgICAgICAgbGluZU1ldGEgPVxuICAgICAgICAgICAgICAgICAgICAgICAgbGluZTogICAgICAgdGVybWluYWwubnVtTGluZXMoKVxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnQ6ICAgICAgZGlmZi5uZXdcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZDogICAgICAgIGRpZmYubmV3K2RpZmYubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgICAgICBjbHNzOiAgICAgICAnZ2l0SW5mb0NoYW5nZSdcbiAgICAgICAgICAgICAgICAgICAgdGVybWluYWwubWV0YS5hZGQgbGluZU1ldGFcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIG1ldGEgPVxuICAgICAgICAgICAgICAgIGRpc3M6IGRzc1xuICAgICAgICAgICAgICAgIGhyZWY6IFwiI3tjaGFuZ2VzLmZpbGV9OiN7Y2hhbmdlcy5saW5lK2luZGV4fVwiXG4gICAgICAgICAgICAgICAgY2xzczogJ3NlYXJjaFJlc3VsdCdcbiAgICAgICAgICAgICAgICBjbGljazogQG9uTWV0YUNsaWNrXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICB0ZXJtaW5hbC5hcHBlbmRNZXRhIG1ldGFcbiAgICAgICAgICAgIHBvc3QuZW1pdCAnc2VhcmNoLXJlc3VsdCcsIG1ldGFcbiAgICAgICAgICAgIGluZGV4ICs9IDFcbiAgICAgICAgaW5kZXhcbiAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgXG4gICAgbG9nRmlsZTogKGNoYW5nZSwgZmlsZSkgLT4gXG4gICAgICAgIFxuICAgICAgICB0ZXh0ID0gc3dpdGNoIGNoYW5nZVxuICAgICAgICAgICAgd2hlbiAnY2hhbmdlZCcgdGhlbiAnICDil48gJ1xuICAgICAgICAgICAgd2hlbiAnYWRkZWQnICAgdGhlbiAnICDil7wgJ1xuICAgICAgICAgICAgd2hlbiAnZGVsZXRlZCcgdGhlbiAnICDinJggJ1xuICAgICAgICAgICAgXG4gICAgICAgIHN5bWJvbCA9IHN3aXRjaCBjaGFuZ2VcblxuICAgICAgICAgICAgd2hlbiAnY2hhbmdlZCcgdGhlbiAn4pePJ1xuICAgICAgICAgICAgd2hlbiAnYWRkZWQnICAgdGhlbiAn4pe8J1xuICAgICAgICAgICAgd2hlbiAnZGVsZXRlZCcgdGhlbiAn4pyYJ1xuICAgICAgICAgICAgXG4gICAgICAgIHRlcm1pbmFsID0gd2luZG93LnRlcm1pbmFsXG4gICAgICAgIG1ldGEgPSBcbiAgICAgICAgICAgIGRpc3M6ICAgICAgIFN5bnRheC5kaXNzRm9yVGV4dEFuZFN5bnRheCBcIiN7c2xhc2gudGlsZGUgZmlsZX1cIiwgJ2tvJ1xuICAgICAgICAgICAgaHJlZjogICAgICAgZmlsZVxuICAgICAgICAgICAgY2xzczogICAgICAgJ2dpdEluZm9GaWxlJ1xuICAgICAgICAgICAgY2xpY2s6ICAgICAgQG9uTWV0YUNsaWNrXG4gICAgICAgICAgICBsaW5lOiAgICAgICBzeW1ib2xcbiAgICAgICAgICAgIGxpbmVDbHNzOiAgICdnaXRJbmZvTGluZSAnK2NoYW5nZVxuICAgICAgICAgICAgXG4gICAgICAgIHRlcm1pbmFsLmFwcGVuZE1ldGEgbWV0YVxuICAgICAgICB0ZXJtaW5hbC5hcHBlbmRNZXRhIGNsc3M6ICdzcGFjZXInXG4gICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgICAgIDAwMCAgICAgXG4gICAgIyAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIHN0YXJ0OiAtPiBcbiAgICAgICAgXG4gICAgICAgIGRpck9yRmlsZSA9IHdpbmRvdy5jd2QuY3dkID8gd2luZG93LmVkaXRvci5jdXJyZW50RmlsZVxuXG4gICAgICAgIHdpbmRvdy5zcGxpdC5yYWlzZSAndGVybWluYWwnXG4gICAgICAgIHRlcm1pbmFsID0gd2luZG93LnRlcm1pbmFsXG4gICAgICAgIHRlcm1pbmFsLmRvQXV0b0NsZWFyKClcbiAgICAgICAgXG4gICAgICAgIGh1Yi5pbmZvIGRpck9yRmlsZSwgKGluZm8pID0+XG5cbiAgICAgICAgICAgIHJldHVybiBpZiBlbXB0eSBpbmZvXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHRlcm1pbmFsID0gd2luZG93LnRlcm1pbmFsXG4gICAgICAgICAgICB0ZXJtaW5hbC5hcHBlbmRNZXRhIGNsc3M6ICdzYWx0JywgdGV4dDogc2xhc2gudGlsZGUgaW5mby5naXREaXJcbiAgICAgICAgICAgIHRlcm1pbmFsLmFwcGVuZE1ldGEgY2xzczogJ3NwYWNlcidcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciBmaWxlIGluIGluZm8uZGVsZXRlZFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIEBsb2dGaWxlICdkZWxldGVkJywgZmlsZSAjIGRvbnQgZGVsZXRlIHRoaXMgZm9yIG5vdyA6KVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yIGZpbGUgaW4gaW5mby5hZGRlZFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIEBsb2dGaWxlICdhZGRlZCcsIGZpbGUgICMgZG9udCBkZWxldGUgdGhpcyBmb3Igbm93IDopXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgc2xhc2guaXNUZXh0IGZpbGVcbiAgICAgICAgICAgICAgICAgICAgZGF0YSAgPSBmcy5yZWFkRmlsZVN5bmMgZmlsZSwgZW5jb2Rpbmc6ICd1dGY4J1xuICAgICAgICAgICAgICAgICAgICBsaW5lcyA9IGRhdGEuc3BsaXQgL1xccj9cXG4vXG4gICAgICAgICAgICAgICAgICAgIGxpbmUgID0gMVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgbGluZSArPSBAbG9nQ2hhbmdlcyBsaW5lczpsaW5lcywgZmlsZTpmaWxlLCBsaW5lOmxpbmUsIGNoYW5nZTonbmV3J1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB0ZXJtaW5hbC5hcHBlbmRNZXRhIGNsc3M6ICdzcGFjZXInXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBmb3IgY2hhbmdlSW5mbyBpbiBpbmZvLmNoYW5nZWQgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgQGxvZ0ZpbGUgJ2NoYW5nZWQnLCBjaGFuZ2VJbmZvLmZpbGUgIyBkb250IGRlbGV0ZSB0aGlzIGZvciBub3cgOilcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBmb3IgY2hhbmdlIGluIGNoYW5nZUluZm8uY2hhbmdlc1xuICAgICAgICAgICAgICAgICAgICBsaW5lID0gY2hhbmdlLmxpbmVcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGlmIG5vdCBlbXB0eSBjaGFuZ2UubW9kXG4gICAgICAgICAgICAgICAgICAgICAgICBsaW5lcyA9IGNoYW5nZS5tb2QubWFwIChsKSAtPiBsLm5ld1xuICAgICAgICAgICAgICAgICAgICAgICAgbGluZSArPSBAbG9nQ2hhbmdlcyBsaW5lczpsaW5lcywgZmlsZTpjaGFuZ2VJbmZvLmZpbGUsIGxpbmU6bGluZSwgaW5mbzpjaGFuZ2UsIGNoYW5nZTonY2hhbmdlZCdcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiBub3QgZW1wdHkgY2hhbmdlLmFkZFxuICAgICAgICAgICAgICAgICAgICAgICAgbGluZXMgPSBjaGFuZ2UuYWRkLm1hcCAobCkgLT4gbC5uZXdcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpbmUgKz0gQGxvZ0NoYW5nZXMgbGluZXM6bGluZXMsIGZpbGU6Y2hhbmdlSW5mby5maWxlLCBsaW5lOmxpbmUsIGluZm86Y2hhbmdlLCBjaGFuZ2U6J2FkZGVkJ1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGlmIG5vdCBlbXB0eSBjaGFuZ2UuZGVsXG4gICAgICAgICAgICAgICAgICAgICAgICBsaW5lcyA9IGNoYW5nZS5kZWwubWFwIChsKSAtPiBsLm9sZFxuICAgICAgICAgICAgICAgICAgICAgICAgbGluZSArPSBAbG9nQ2hhbmdlcyBsaW5lczpsaW5lcywgZmlsZTpjaGFuZ2VJbmZvLmZpbGUsIGxpbmU6bGluZSwgaW5mbzpjaGFuZ2UsIGNoYW5nZTonZGVsZXRlZCdcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICB0ZXJtaW5hbC5hcHBlbmRNZXRhIGNsc3M6ICdzcGFjZXInXG5cbiAgICAgICAgICAgIHRlcm1pbmFsLnNjcm9sbC5jdXJzb3JUb1RvcCA3XG4gICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBuZXcgR2l0SW5mb1xuIl19
//# sourceURL=../../coffee/win/gitinfo.coffee