// koffee 1.4.0

/*
000   000   0000000   000      000   000  00000000  00000000 
000 0 000  000   000  000      000  000   000       000   000
000000000  000000000  000      0000000    0000000   0000000  
000   000  000   000  000      000  000   000       000   000
00     00  000   000  0000000  000   000  00000000  000   000
 */
var File, Walker, fs, kerror, ref, slash, walkdir,
    indexOf = [].indexOf;

ref = require('kxk'), slash = ref.slash, walkdir = ref.walkdir, fs = ref.fs, kerror = ref.kerror;

File = require('./file');

Walker = (function() {
    function Walker(cfg1) {
        var base, base1, base2, base3, base4, base5, base6, base7;
        this.cfg = cfg1;
        this.cfg.files = [];
        this.cfg.stats = [];
        if ((base = this.cfg).maxDepth != null) {
            base.maxDepth;
        } else {
            base.maxDepth = 3;
        }
        if ((base1 = this.cfg).dotFiles != null) {
            base1.dotFiles;
        } else {
            base1.dotFiles = false;
        }
        if ((base2 = this.cfg).includeDirs != null) {
            base2.includeDirs;
        } else {
            base2.includeDirs = true;
        }
        if ((base3 = this.cfg).maxFiles != null) {
            base3.maxFiles;
        } else {
            base3.maxFiles = 500;
        }
        if ((base4 = this.cfg).ignore != null) {
            base4.ignore;
        } else {
            base4.ignore = ['node_modules', 'build', 'Build', 'Library', 'Applications'];
        }
        if ((base5 = this.cfg).include != null) {
            base5.include;
        } else {
            base5.include = ['.konrad.noon', '.gitignore', '.npmignore'];
        }
        if ((base6 = this.cfg).ignoreExt != null) {
            base6.ignoreExt;
        } else {
            base6.ignoreExt = ['app', 'asar'];
        }
        if ((base7 = this.cfg).includeExt != null) {
            base7.includeExt;
        } else {
            base7.includeExt = File.sourceFileExtensions;
        }
    }

    Walker.prototype.start = function() {
        var dir, err, onWalkerPath;
        try {
            this.running = true;
            dir = this.cfg.root;
            this.walker = walkdir.walk(dir, {
                max_depth: this.cfg.maxDepth
            });
            onWalkerPath = function(cfg) {
                return function(p, stat) {
                    var extn, name, ref1, ref2, sp;
                    sp = slash.path(p);
                    name = slash.basename(p);
                    extn = slash.ext(p);
                    if (typeof cfg.filter === "function" ? cfg.filter(p) : void 0) {
                        return this.ignore(p);
                    } else if ((name === '.DS_Store' || name === 'Icon\r') || (extn === 'pyc')) {
                        return this.ignore(p);
                    } else if (name.endsWith('-x64')) {
                        return this.ignore(p);
                    } else if ((cfg.includeDir != null) && slash.dir(p) === cfg.includeDir) {
                        cfg.files.push(sp);
                        cfg.stats.push(stat);
                        if (indexOf.call(cfg.ignore, name) >= 0) {
                            this.ignore(p);
                        }
                        if (name.startsWith('.') && !cfg.dotFiles) {
                            this.ignore(p);
                        }
                    } else if (indexOf.call(cfg.ignore, name) >= 0) {
                        return this.ignore(p);
                    } else if (indexOf.call(cfg.include, name) >= 0) {
                        cfg.files.push(sp);
                        cfg.stats.push(stat);
                    } else if (name.startsWith('.')) {
                        if (cfg.dotFiles) {
                            cfg.files.push(sp);
                            cfg.stats.push(stat);
                        } else {
                            return this.ignore(p);
                        }
                    } else if (indexOf.call(cfg.ignoreExt, extn) >= 0) {
                        return this.ignore(p);
                    } else if (indexOf.call(cfg.includeExt, extn) >= 0 || cfg.includeExt.indexOf('') >= 0) {
                        cfg.files.push(sp);
                        cfg.stats.push(stat);
                    } else if (stat.isDirectory()) {
                        if (p !== cfg.root && cfg.includeDirs) {
                            cfg.files.push(sp);
                            cfg.stats.push(stat);
                        }
                    }
                    if (typeof cfg.path === "function") {
                        cfg.path(sp, stat);
                    }
                    if (stat.isDirectory()) {
                        if (cfg.includeDirs) {
                            if (typeof cfg.dir === "function") {
                                cfg.dir(sp, stat);
                            }
                        }
                        if (typeof cfg.skipDir === "function" ? cfg.skipDir(sp) : void 0) {
                            this.ignore(p);
                        }
                    } else {
                        if ((ref1 = slash.ext(sp), indexOf.call(cfg.includeExt, ref1) >= 0) || (ref2 = slash.basename(sp), indexOf.call(cfg.include, ref2) >= 0) || cfg.includeExt.indexOf('') >= 0) {
                            if (typeof cfg.file === "function") {
                                cfg.file(sp, stat);
                            }
                        }
                    }
                    if (cfg.files.length > cfg.maxFiles) {
                        return this.end();
                    } else if (cfg.slowdown && (cfg.files.length % 400) === 399) {
                        this.pause();
                        return setTimeout(this.resume, 10);
                    }
                };
            };
            this.walker.on('path', onWalkerPath(this.cfg));
            return this.walker.on('end', (function(_this) {
                return function() {
                    var base;
                    _this.running = false;
                    return typeof (base = _this.cfg).done === "function" ? base.done(_this) : void 0;
                };
            })(this));
        } catch (error) {
            err = error;
            this.running = false;
            return kerror("Walker.start -- " + err + " dir: " + dir + " stack:", err.stack);
        }
    };

    Walker.prototype.stop = function() {
        var ref1, ref2;
        if ((ref1 = this.walker) != null) {
            ref1.pause();
        }
        if ((ref2 = this.walker) != null) {
            ref2.end();
        }
        return this.walker = null;
    };

    return Walker;

})();

module.exports = Walker;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Fsa2VyLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSw2Q0FBQTtJQUFBOztBQVFBLE1BQWlDLE9BQUEsQ0FBUSxLQUFSLENBQWpDLEVBQUUsaUJBQUYsRUFBUyxxQkFBVCxFQUFrQixXQUFsQixFQUFzQjs7QUFFdEIsSUFBQSxHQUFPLE9BQUEsQ0FBUSxRQUFSOztBQUVEO0lBRVcsZ0JBQUMsSUFBRDtBQUVULFlBQUE7UUFGVSxJQUFDLENBQUEsTUFBRDtRQUVWLElBQUMsQ0FBQSxHQUFHLENBQUMsS0FBTCxHQUFtQjtRQUNuQixJQUFDLENBQUEsR0FBRyxDQUFDLEtBQUwsR0FBbUI7O2dCQUNmLENBQUM7O2dCQUFELENBQUMsV0FBZTs7O2lCQUNoQixDQUFDOztpQkFBRCxDQUFDLFdBQWU7OztpQkFDaEIsQ0FBQzs7aUJBQUQsQ0FBQyxjQUFlOzs7aUJBQ2hCLENBQUM7O2lCQUFELENBQUMsV0FBZTs7O2lCQUNoQixDQUFDOztpQkFBRCxDQUFDLFNBQWUsQ0FBQyxjQUFELEVBQWdCLE9BQWhCLEVBQXdCLE9BQXhCLEVBQWdDLFNBQWhDLEVBQTBDLGNBQTFDOzs7aUJBQ2hCLENBQUM7O2lCQUFELENBQUMsVUFBZSxDQUFDLGNBQUQsRUFBZ0IsWUFBaEIsRUFBNkIsWUFBN0I7OztpQkFDaEIsQ0FBQzs7aUJBQUQsQ0FBQyxZQUFlLENBQUMsS0FBRCxFQUFPLE1BQVA7OztpQkFDaEIsQ0FBQzs7aUJBQUQsQ0FBQyxhQUFlLElBQUksQ0FBQzs7SUFYaEI7O3FCQW1CYixLQUFBLEdBQU8sU0FBQTtBQUNILFlBQUE7QUFBQTtZQUNJLElBQUMsQ0FBQSxPQUFELEdBQVc7WUFDWCxHQUFBLEdBQU0sSUFBQyxDQUFBLEdBQUcsQ0FBQztZQUNYLElBQUMsQ0FBQSxNQUFELEdBQVUsT0FBTyxDQUFDLElBQVIsQ0FBYSxHQUFiLEVBQWtCO2dCQUFBLFNBQUEsRUFBVyxJQUFD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S0FBQTt1QkFBQSxTQUFBO0FBQ2Qsd0JBQUE7b0JBQUEsS0FBQyxDQUFBLE9BQUQsR0FBVzsrRUFDUCxDQUFDLEtBQU07Z0JBRkc7WUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWxCLEVBM0RKO1NBQUEsYUFBQTtZQStETTtZQUNGLElBQUMsQ0FBQSxPQUFELEdBQVc7bUJBQ1gsTUFBQSxDQUFPLGtCQUFBLEdBQW1CLEdBQW5CLEdBQXVCLFFBQXZCLEdBQStCLEdBQS9CLEdBQW1DLFNBQTFDLEVBQW9ELEdBQUcsQ0FBQyxLQUF4RCxFQWpFSjs7SUFERzs7cUJBb0VQLElBQUEsR0FBTSxTQUFBO0FBRUYsWUFBQTs7Z0JBQU8sQ0FBRSxLQUFULENBQUE7OztnQkFDTyxDQUFFLEdBQVQsQ0FBQTs7ZUFDQSxJQUFDLENBQUEsTUFBRCxHQUFVO0lBSlI7Ozs7OztBQU1WLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgXG4wMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAgMDAwXG4wMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAgMDAwXG4wMCAgICAgMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwXG4jIyNcblxueyBzbGFzaCwgd2Fsa2RpciwgZnMsIGtlcnJvciB9ID0gcmVxdWlyZSAna3hrJ1xuXG5GaWxlID0gcmVxdWlyZSAnLi9maWxlJ1xuXG5jbGFzcyBXYWxrZXJcblxuICAgIGNvbnN0cnVjdG9yOiAoQGNmZykgLT5cblxuICAgICAgICBAY2ZnLmZpbGVzICAgICAgID0gW11cbiAgICAgICAgQGNmZy5zdGF0cyAgICAgICA9IFtdXG4gICAgICAgIEBjZmcubWF4RGVwdGggICAgPz0gM1xuICAgICAgICBAY2ZnLmRvdEZpbGVzICAgID89IGZhbHNlXG4gICAgICAgIEBjZmcuaW5jbHVkZURpcnMgPz0gdHJ1ZVxuICAgICAgICBAY2ZnLm1heEZpbGVzICAgID89IDUwMFxuICAgICAgICBAY2ZnLmlnbm9yZSAgICAgID89IFsnbm9kZV9tb2R1bGVzJyAnYnVpbGQnICdCdWlsZCcgJ0xpYnJhcnknICdBcHBsaWNhdGlvbnMnXSAjLCAncmVzb3VyY2VzJyAnVGhpcmRQYXJ0eScgJ0JpbmFyaWVzJyAnSW50ZXJtZWRpYXRlJyAnU2F2ZWQnICdQcm9ncmFtcycgJ1NoYWRlcnMnICdEZXJpdmVkRGF0YUNhY2hlJyAnQ29udGVudCcgJ1NhbXBsZXMnXVxuICAgICAgICBAY2ZnLmluY2x1ZGUgICAgID89IFsnLmtvbnJhZC5ub29uJyAnLmdpdGlnbm9yZScgJy5ucG1pZ25vcmUnXVxuICAgICAgICBAY2ZnLmlnbm9yZUV4dCAgID89IFsnYXBwJyAnYXNhciddXG4gICAgICAgIEBjZmcuaW5jbHVkZUV4dCAgPz0gRmlsZS5zb3VyY2VGaWxlRXh0ZW5zaW9uc1xuICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgICAgMDAwICAgXG4gICAgIyAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgXG4gICAgXG4gICAgc3RhcnQ6IC0+ICAgICAgICAgICBcbiAgICAgICAgdHJ5XG4gICAgICAgICAgICBAcnVubmluZyA9IHRydWVcbiAgICAgICAgICAgIGRpciA9IEBjZmcucm9vdFxuICAgICAgICAgICAgQHdhbGtlciA9IHdhbGtkaXIud2FsayBkaXIsIG1heF9kZXB0aDogQGNmZy5tYXhEZXB0aFxuICAgICAgICAgICAgb25XYWxrZXJQYXRoID0gKGNmZykgLT4gKHAsc3RhdCkgLT5cbiAgICAgICAgICAgICAgICBzcCAgID0gc2xhc2gucGF0aCBwXG4gICAgICAgICAgICAgICAgbmFtZSA9IHNsYXNoLmJhc2VuYW1lIHBcbiAgICAgICAgICAgICAgICBleHRuID0gc2xhc2guZXh0IHBcblxuICAgICAgICAgICAgICAgIGlmIGNmZy5maWx0ZXI/KHApXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBAaWdub3JlIHBcbiAgICAgICAgICAgICAgICBlbHNlIGlmIG5hbWUgaW4gWycuRFNfU3RvcmUnICdJY29uXFxyJ10gb3IgZXh0biBpbiBbJ3B5YyddXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBAaWdub3JlIHBcbiAgICAgICAgICAgICAgICBlbHNlIGlmIG5hbWUuZW5kc1dpdGggJy14NjQnXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBAaWdub3JlIHBcbiAgICAgICAgICAgICAgICBlbHNlIGlmIGNmZy5pbmNsdWRlRGlyPyBhbmQgc2xhc2guZGlyKHApID09IGNmZy5pbmNsdWRlRGlyXG4gICAgICAgICAgICAgICAgICAgIGNmZy5maWxlcy5wdXNoIHNwXG4gICAgICAgICAgICAgICAgICAgIGNmZy5zdGF0cy5wdXNoIHN0YXRcbiAgICAgICAgICAgICAgICAgICAgQGlnbm9yZSBwIGlmIG5hbWUgaW4gY2ZnLmlnbm9yZVxuICAgICAgICAgICAgICAgICAgICBAaWdub3JlIHAgaWYgbmFtZS5zdGFydHNXaXRoKCcuJykgYW5kIG5vdCBjZmcuZG90RmlsZXNcbiAgICAgICAgICAgICAgICBlbHNlIGlmIG5hbWUgaW4gY2ZnLmlnbm9yZVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gQGlnbm9yZSBwXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBuYW1lIGluIGNmZy5pbmNsdWRlXG4gICAgICAgICAgICAgICAgICAgIGNmZy5maWxlcy5wdXNoIHNwXG4gICAgICAgICAgICAgICAgICAgIGNmZy5zdGF0cy5wdXNoIHN0YXRcbiAgICAgICAgICAgICAgICBlbHNlIGlmIG5hbWUuc3RhcnRzV2l0aCAnLidcbiAgICAgICAgICAgICAgICAgICAgaWYgY2ZnLmRvdEZpbGVzXG4gICAgICAgICAgICAgICAgICAgICAgICBjZmcuZmlsZXMucHVzaCBzcFxuICAgICAgICAgICAgICAgICAgICAgICAgY2ZnLnN0YXRzLnB1c2ggc3RhdFxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gQGlnbm9yZSBwIFxuICAgICAgICAgICAgICAgIGVsc2UgaWYgZXh0biBpbiBjZmcuaWdub3JlRXh0XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBAaWdub3JlIHBcbiAgICAgICAgICAgICAgICBlbHNlIGlmIGV4dG4gaW4gY2ZnLmluY2x1ZGVFeHQgb3IgY2ZnLmluY2x1ZGVFeHQuaW5kZXhPZignJykgPj0gMFxuICAgICAgICAgICAgICAgICAgICBjZmcuZmlsZXMucHVzaCBzcFxuICAgICAgICAgICAgICAgICAgICBjZmcuc3RhdHMucHVzaCBzdGF0XG4gICAgICAgICAgICAgICAgZWxzZSBpZiBzdGF0LmlzRGlyZWN0b3J5KClcbiAgICAgICAgICAgICAgICAgICAgaWYgcCAhPSBjZmcucm9vdCBhbmQgY2ZnLmluY2x1ZGVEaXJzXG4gICAgICAgICAgICAgICAgICAgICAgICBjZmcuZmlsZXMucHVzaCBzcCBcbiAgICAgICAgICAgICAgICAgICAgICAgIGNmZy5zdGF0cy5wdXNoIHN0YXRcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGNmZy5wYXRoPyBzcCwgc3RhdFxuICAgICAgICAgICAgICAgIGlmIHN0YXQuaXNEaXJlY3RvcnkoKVxuICAgICAgICAgICAgICAgICAgICBpZiBjZmcuaW5jbHVkZURpcnNcbiAgICAgICAgICAgICAgICAgICAgICAgIGNmZy5kaXI/IHNwLCBzdGF0XG4gICAgICAgICAgICAgICAgICAgIGlmIGNmZy5za2lwRGlyPyBzcFxuICAgICAgICAgICAgICAgICAgICAgICAgQGlnbm9yZSBwXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBpZiBzbGFzaC5leHQoc3ApIGluIGNmZy5pbmNsdWRlRXh0IG9yIHNsYXNoLmJhc2VuYW1lKHNwKSBpbiBjZmcuaW5jbHVkZSBvciBjZmcuaW5jbHVkZUV4dC5pbmRleE9mKCcnKSA+PSAwXG4gICAgICAgICAgICAgICAgICAgICAgICBjZmcuZmlsZT8gc3AsIHN0YXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIGNmZy5maWxlcy5sZW5ndGggPiBjZmcubWF4RmlsZXNcbiAgICAgICAgICAgICAgICAgICAgQGVuZCgpXG5cbiAgICAgICAgICAgICAgICBlbHNlIGlmIGNmZy5zbG93ZG93biBhbmQgKGNmZy5maWxlcy5sZW5ndGggJSA0MDApID09IDM5OVxuICAgICAgICAgICAgICAgICAgICBAcGF1c2UoKVxuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0IEByZXN1bWUsIDEwXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgQHdhbGtlci5vbiAncGF0aCcsIG9uV2Fsa2VyUGF0aCBAY2ZnXG4gICAgICAgICAgICBAd2Fsa2VyLm9uICdlbmQnLCA9PiBcbiAgICAgICAgICAgICAgICBAcnVubmluZyA9IGZhbHNlXG4gICAgICAgICAgICAgICAgQGNmZy5kb25lPyBAXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGNhdGNoIGVyclxuICAgICAgICAgICAgQHJ1bm5pbmcgPSBmYWxzZVxuICAgICAgICAgICAga2Vycm9yIFwiV2Fsa2VyLnN0YXJ0IC0tICN7ZXJyfSBkaXI6ICN7ZGlyfSBzdGFjazpcIiwgZXJyLnN0YWNrXG5cbiAgICBzdG9wOiAtPlxuICAgICAgICBcbiAgICAgICAgQHdhbGtlcj8ucGF1c2UoKVxuICAgICAgICBAd2Fsa2VyPy5lbmQoKVxuICAgICAgICBAd2Fsa2VyID0gbnVsbFxuICAgIFxubW9kdWxlLmV4cG9ydHMgPSBXYWxrZXJcbiJdfQ==
//# sourceURL=../../coffee/tools/walker.coffee