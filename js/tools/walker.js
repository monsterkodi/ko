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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Fsa2VyLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSw2Q0FBQTtJQUFBOztBQVFBLE1BQWlDLE9BQUEsQ0FBUSxLQUFSLENBQWpDLEVBQUUsaUJBQUYsRUFBUyxxQkFBVCxFQUFrQixXQUFsQixFQUFzQjs7QUFFdEIsSUFBQSxHQUFPLE9BQUEsQ0FBUSxRQUFSOztBQUVEO0lBRUMsZ0JBQUMsSUFBRDtBQUVDLFlBQUE7UUFGQSxJQUFDLENBQUEsTUFBRDtRQUVBLElBQUMsQ0FBQSxHQUFHLENBQUMsS0FBTCxHQUFtQjtRQUNuQixJQUFDLENBQUEsR0FBRyxDQUFDLEtBQUwsR0FBbUI7O2dCQUNmLENBQUM7O2dCQUFELENBQUMsV0FBZTs7O2lCQUNoQixDQUFDOztpQkFBRCxDQUFDLFdBQWU7OztpQkFDaEIsQ0FBQzs7aUJBQUQsQ0FBQyxjQUFlOzs7aUJBQ2hCLENBQUM7O2lCQUFELENBQUMsV0FBZTs7O2lCQUNoQixDQUFDOztpQkFBRCxDQUFDLFNBQWUsQ0FBQyxjQUFELEVBQWdCLE9BQWhCLEVBQXdCLE9BQXhCLEVBQWdDLFNBQWhDLEVBQTBDLGNBQTFDOzs7aUJBQ2hCLENBQUM7O2lCQUFELENBQUMsVUFBZSxDQUFDLGNBQUQsRUFBZ0IsWUFBaEIsRUFBNkIsWUFBN0I7OztpQkFDaEIsQ0FBQzs7aUJBQUQsQ0FBQyxZQUFlLENBQUMsS0FBRCxFQUFPLE1BQVA7OztpQkFDaEIsQ0FBQzs7aUJBQUQsQ0FBQyxhQUFlLElBQUksQ0FBQzs7SUFYMUI7O3FCQW1CSCxLQUFBLEdBQU8sU0FBQTtBQUNILFlBQUE7QUFBQTtZQUNJLElBQUMsQ0FBQSxPQUFELEdBQVc7WUFDWCxHQUFBLEdBQU0sSUFBQyxDQUFBLEdBQUcsQ0FBQztZQUNYLElBQUMsQ0FBQSxNQUFELEdBQVUsT0FBTyxDQUFDLElBQVIsQ0FBYSxHQUFiLEVBQWtCO2dCQUFBLFNBQUEsRUFBVyxJQUFD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S0FBQTt1QkFBQSxTQUFBO0FBQ2Qsd0JBQUE7b0JBQUEsS0FBQyxDQUFBLE9BQUQsR0FBVzsrRUFDUCxDQUFDLEtBQU07Z0JBRkc7WUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWxCLEVBM0RKO1NBQUEsYUFBQTtZQStETTtZQUNGLElBQUMsQ0FBQSxPQUFELEdBQVc7bUJBQ1gsTUFBQSxDQUFPLGtCQUFBLEdBQW1CLEdBQW5CLEdBQXVCLFFBQXZCLEdBQStCLEdBQS9CLEdBQW1DLFNBQTFDLEVBQW9ELEdBQUcsQ0FBQyxLQUF4RCxFQWpFSjs7SUFERzs7cUJBb0VQLElBQUEsR0FBTSxTQUFBO0FBRUYsWUFBQTs7Z0JBQU8sQ0FBRSxLQUFULENBQUE7OztnQkFDTyxDQUFFLEdBQVQsQ0FBQTs7ZUFDQSxJQUFDLENBQUEsTUFBRCxHQUFVO0lBSlI7Ozs7OztBQU1WLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgXG4wMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAgMDAwXG4wMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAgMDAwXG4wMCAgICAgMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwXG4jIyNcblxueyBzbGFzaCwgd2Fsa2RpciwgZnMsIGtlcnJvciB9ID0gcmVxdWlyZSAna3hrJ1xuXG5GaWxlID0gcmVxdWlyZSAnLi9maWxlJ1xuXG5jbGFzcyBXYWxrZXJcblxuICAgIEA6IChAY2ZnKSAtPlxuXG4gICAgICAgIEBjZmcuZmlsZXMgICAgICAgPSBbXVxuICAgICAgICBAY2ZnLnN0YXRzICAgICAgID0gW11cbiAgICAgICAgQGNmZy5tYXhEZXB0aCAgICA/PSAzXG4gICAgICAgIEBjZmcuZG90RmlsZXMgICAgPz0gZmFsc2VcbiAgICAgICAgQGNmZy5pbmNsdWRlRGlycyA/PSB0cnVlXG4gICAgICAgIEBjZmcubWF4RmlsZXMgICAgPz0gNTAwXG4gICAgICAgIEBjZmcuaWdub3JlICAgICAgPz0gWydub2RlX21vZHVsZXMnICdidWlsZCcgJ0J1aWxkJyAnTGlicmFyeScgJ0FwcGxpY2F0aW9ucyddICMsICdyZXNvdXJjZXMnICdUaGlyZFBhcnR5JyAnQmluYXJpZXMnICdJbnRlcm1lZGlhdGUnICdTYXZlZCcgJ1Byb2dyYW1zJyAnU2hhZGVycycgJ0Rlcml2ZWREYXRhQ2FjaGUnICdDb250ZW50JyAnU2FtcGxlcyddXG4gICAgICAgIEBjZmcuaW5jbHVkZSAgICAgPz0gWycua29ucmFkLm5vb24nICcuZ2l0aWdub3JlJyAnLm5wbWlnbm9yZSddXG4gICAgICAgIEBjZmcuaWdub3JlRXh0ICAgPz0gWydhcHAnICdhc2FyJ11cbiAgICAgICAgQGNmZy5pbmNsdWRlRXh0ICA/PSBGaWxlLnNvdXJjZUZpbGVFeHRlbnNpb25zXG4gICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAgICAwMDAgICBcbiAgICAjICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICBcbiAgICBcbiAgICBzdGFydDogLT4gICAgICAgICAgIFxuICAgICAgICB0cnlcbiAgICAgICAgICAgIEBydW5uaW5nID0gdHJ1ZVxuICAgICAgICAgICAgZGlyID0gQGNmZy5yb290XG4gICAgICAgICAgICBAd2Fsa2VyID0gd2Fsa2Rpci53YWxrIGRpciwgbWF4X2RlcHRoOiBAY2ZnLm1heERlcHRoXG4gICAgICAgICAgICBvbldhbGtlclBhdGggPSAoY2ZnKSAtPiAocCxzdGF0KSAtPlxuICAgICAgICAgICAgICAgIHNwICAgPSBzbGFzaC5wYXRoIHBcbiAgICAgICAgICAgICAgICBuYW1lID0gc2xhc2guYmFzZW5hbWUgcFxuICAgICAgICAgICAgICAgIGV4dG4gPSBzbGFzaC5leHQgcFxuXG4gICAgICAgICAgICAgICAgaWYgY2ZnLmZpbHRlcj8ocClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEBpZ25vcmUgcFxuICAgICAgICAgICAgICAgIGVsc2UgaWYgbmFtZSBpbiBbJy5EU19TdG9yZScgJ0ljb25cXHInXSBvciBleHRuIGluIFsncHljJ11cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEBpZ25vcmUgcFxuICAgICAgICAgICAgICAgIGVsc2UgaWYgbmFtZS5lbmRzV2l0aCAnLXg2NCdcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEBpZ25vcmUgcFxuICAgICAgICAgICAgICAgIGVsc2UgaWYgY2ZnLmluY2x1ZGVEaXI/IGFuZCBzbGFzaC5kaXIocCkgPT0gY2ZnLmluY2x1ZGVEaXJcbiAgICAgICAgICAgICAgICAgICAgY2ZnLmZpbGVzLnB1c2ggc3BcbiAgICAgICAgICAgICAgICAgICAgY2ZnLnN0YXRzLnB1c2ggc3RhdFxuICAgICAgICAgICAgICAgICAgICBAaWdub3JlIHAgaWYgbmFtZSBpbiBjZmcuaWdub3JlXG4gICAgICAgICAgICAgICAgICAgIEBpZ25vcmUgcCBpZiBuYW1lLnN0YXJ0c1dpdGgoJy4nKSBhbmQgbm90IGNmZy5kb3RGaWxlc1xuICAgICAgICAgICAgICAgIGVsc2UgaWYgbmFtZSBpbiBjZmcuaWdub3JlXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBAaWdub3JlIHBcbiAgICAgICAgICAgICAgICBlbHNlIGlmIG5hbWUgaW4gY2ZnLmluY2x1ZGVcbiAgICAgICAgICAgICAgICAgICAgY2ZnLmZpbGVzLnB1c2ggc3BcbiAgICAgICAgICAgICAgICAgICAgY2ZnLnN0YXRzLnB1c2ggc3RhdFxuICAgICAgICAgICAgICAgIGVsc2UgaWYgbmFtZS5zdGFydHNXaXRoICcuJ1xuICAgICAgICAgICAgICAgICAgICBpZiBjZmcuZG90RmlsZXNcbiAgICAgICAgICAgICAgICAgICAgICAgIGNmZy5maWxlcy5wdXNoIHNwXG4gICAgICAgICAgICAgICAgICAgICAgICBjZmcuc3RhdHMucHVzaCBzdGF0XG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBAaWdub3JlIHAgXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBleHRuIGluIGNmZy5pZ25vcmVFeHRcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEBpZ25vcmUgcFxuICAgICAgICAgICAgICAgIGVsc2UgaWYgZXh0biBpbiBjZmcuaW5jbHVkZUV4dCBvciBjZmcuaW5jbHVkZUV4dC5pbmRleE9mKCcnKSA+PSAwXG4gICAgICAgICAgICAgICAgICAgIGNmZy5maWxlcy5wdXNoIHNwXG4gICAgICAgICAgICAgICAgICAgIGNmZy5zdGF0cy5wdXNoIHN0YXRcbiAgICAgICAgICAgICAgICBlbHNlIGlmIHN0YXQuaXNEaXJlY3RvcnkoKVxuICAgICAgICAgICAgICAgICAgICBpZiBwICE9IGNmZy5yb290IGFuZCBjZmcuaW5jbHVkZURpcnNcbiAgICAgICAgICAgICAgICAgICAgICAgIGNmZy5maWxlcy5wdXNoIHNwIFxuICAgICAgICAgICAgICAgICAgICAgICAgY2ZnLnN0YXRzLnB1c2ggc3RhdFxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgY2ZnLnBhdGg/IHNwLCBzdGF0XG4gICAgICAgICAgICAgICAgaWYgc3RhdC5pc0RpcmVjdG9yeSgpXG4gICAgICAgICAgICAgICAgICAgIGlmIGNmZy5pbmNsdWRlRGlyc1xuICAgICAgICAgICAgICAgICAgICAgICAgY2ZnLmRpcj8gc3AsIHN0YXRcbiAgICAgICAgICAgICAgICAgICAgaWYgY2ZnLnNraXBEaXI/IHNwXG4gICAgICAgICAgICAgICAgICAgICAgICBAaWdub3JlIHBcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGlmIHNsYXNoLmV4dChzcCkgaW4gY2ZnLmluY2x1ZGVFeHQgb3Igc2xhc2guYmFzZW5hbWUoc3ApIGluIGNmZy5pbmNsdWRlIG9yIGNmZy5pbmNsdWRlRXh0LmluZGV4T2YoJycpID49IDBcbiAgICAgICAgICAgICAgICAgICAgICAgIGNmZy5maWxlPyBzcCwgc3RhdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgY2ZnLmZpbGVzLmxlbmd0aCA+IGNmZy5tYXhGaWxlc1xuICAgICAgICAgICAgICAgICAgICBAZW5kKClcblxuICAgICAgICAgICAgICAgIGVsc2UgaWYgY2ZnLnNsb3dkb3duIGFuZCAoY2ZnLmZpbGVzLmxlbmd0aCAlIDQwMCkgPT0gMzk5XG4gICAgICAgICAgICAgICAgICAgIEBwYXVzZSgpXG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQgQHJlc3VtZSwgMTBcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBAd2Fsa2VyLm9uICdwYXRoJywgb25XYWxrZXJQYXRoIEBjZmdcbiAgICAgICAgICAgIEB3YWxrZXIub24gJ2VuZCcsID0+IFxuICAgICAgICAgICAgICAgIEBydW5uaW5nID0gZmFsc2VcbiAgICAgICAgICAgICAgICBAY2ZnLmRvbmU/IEBcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgY2F0Y2ggZXJyXG4gICAgICAgICAgICBAcnVubmluZyA9IGZhbHNlXG4gICAgICAgICAgICBrZXJyb3IgXCJXYWxrZXIuc3RhcnQgLS0gI3tlcnJ9IGRpcjogI3tkaXJ9IHN0YWNrOlwiLCBlcnIuc3RhY2tcblxuICAgIHN0b3A6IC0+XG4gICAgICAgIFxuICAgICAgICBAd2Fsa2VyPy5wYXVzZSgpXG4gICAgICAgIEB3YWxrZXI/LmVuZCgpXG4gICAgICAgIEB3YWxrZXIgPSBudWxsXG4gICAgXG5tb2R1bGUuZXhwb3J0cyA9IFdhbGtlclxuIl19
//# sourceURL=../../coffee/tools/walker.coffee