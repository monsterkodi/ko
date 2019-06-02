// koffee 0.56.0

/*
000   000   0000000   000      000   000  00000000  00000000 
000 0 000  000   000  000      000  000   000       000   000
000000000  000000000  000      0000000    0000000   0000000  
000   000  000   000  000      000  000   000       000   000
00     00  000   000  0000000  000   000  00000000  000   000
 */
var Walker, fs, kerror, ref, slash, walkdir,
    indexOf = [].indexOf;

ref = require('kxk'), slash = ref.slash, walkdir = ref.walkdir, fs = ref.fs, kerror = ref.kerror;

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
            base7.includeExt = ['koffee', 'coffee', 'styl', 'pug', 'md', 'noon', 'txt', 'json', 'sh', 'py', 'js', 'ts', 'ini', 'cpp', 'cc', 'c', 'cs', 'h', 'hpp'];
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Fsa2VyLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSx1Q0FBQTtJQUFBOztBQVFBLE1BQWlDLE9BQUEsQ0FBUSxLQUFSLENBQWpDLEVBQUUsaUJBQUYsRUFBUyxxQkFBVCxFQUFrQixXQUFsQixFQUFzQjs7QUFFaEI7SUFFVyxnQkFBQyxJQUFEO0FBRVQsWUFBQTtRQUZVLElBQUMsQ0FBQSxNQUFEO1FBRVYsSUFBQyxDQUFBLEdBQUcsQ0FBQyxLQUFMLEdBQW1CO1FBQ25CLElBQUMsQ0FBQSxHQUFHLENBQUMsS0FBTCxHQUFtQjs7Z0JBQ2YsQ0FBQzs7Z0JBQUQsQ0FBQyxXQUFlOzs7aUJBQ2hCLENBQUM7O2lCQUFELENBQUMsV0FBZTs7O2lCQUNoQixDQUFDOztpQkFBRCxDQUFDLGNBQWU7OztpQkFDaEIsQ0FBQzs7aUJBQUQsQ0FBQyxXQUFlOzs7aUJBQ2hCLENBQUM7O2lCQUFELENBQUMsU0FBZSxDQUFDLGNBQUQsRUFBaUIsT0FBakIsRUFBMEIsT0FBMUIsRUFBbUMsU0FBbkMsRUFBOEMsY0FBOUM7OztpQkFDaEIsQ0FBQzs7aUJBQUQsQ0FBQyxVQUFlLENBQUMsY0FBRCxFQUFpQixZQUFqQixFQUErQixZQUEvQjs7O2lCQUNoQixDQUFDOztpQkFBRCxDQUFDLFlBQWUsQ0FBQyxLQUFELEVBQVEsTUFBUjs7O2lCQUNoQixDQUFDOztpQkFBRCxDQUFDLGFBQWUsQ0FBQyxRQUFELEVBQVcsUUFBWCxFQUFxQixNQUFyQixFQUE2QixLQUE3QixFQUFvQyxJQUFwQyxFQUEwQyxNQUExQyxFQUNBLEtBREEsRUFDTyxNQURQLEVBQ2UsSUFEZixFQUNxQixJQURyQixFQUMyQixJQUQzQixFQUNpQyxJQURqQyxFQUN1QyxLQUR2QyxFQUVBLEtBRkEsRUFFTyxJQUZQLEVBRWEsR0FGYixFQUVrQixJQUZsQixFQUV3QixHQUZ4QixFQUU2QixLQUY3Qjs7SUFYWDs7cUJB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TUFBWixFQUFvQixFQUFwQixFQUZDOztnQkFsRGU7WUFBVDtZQXNEZixJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxNQUFYLEVBQW1CLFlBQUEsQ0FBYSxJQUFDLENBQUEsR0FBZCxDQUFuQjttQkFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxLQUFYLEVBQWtCLENBQUEsU0FBQSxLQUFBO3VCQUFBLFNBQUE7QUFDZCx3QkFBQTtvQkFBQSxLQUFDLENBQUEsT0FBRCxHQUFXOytFQUNQLENBQUMsS0FBTTtnQkFGRztZQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBbEIsRUEzREo7U0FBQSxhQUFBO1lBK0RNO1lBQ0YsSUFBQyxDQUFBLE9BQUQsR0FBVzttQkFDWCxNQUFBLENBQU8sa0JBQUEsR0FBbUIsR0FBbkIsR0FBdUIsUUFBdkIsR0FBK0IsR0FBL0IsR0FBbUMsU0FBMUMsRUFBb0QsR0FBRyxDQUFDLEtBQXhELEVBakVKOztJQURHOztxQkFvRVAsSUFBQSxHQUFNLFNBQUE7QUFFRixZQUFBOztnQkFBTyxDQUFFLEtBQVQsQ0FBQTs7O2dCQUNPLENBQUUsR0FBVCxDQUFBOztlQUNBLElBQUMsQ0FBQSxNQUFELEdBQVU7SUFKUjs7Ozs7O0FBTVYsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCBcbjAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDBcbjAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDBcbjAwICAgICAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiMjI1xuXG57IHNsYXNoLCB3YWxrZGlyLCBmcywga2Vycm9yIH0gPSByZXF1aXJlICdreGsnXG5cbmNsYXNzIFdhbGtlclxuXG4gICAgY29uc3RydWN0b3I6IChAY2ZnKSAtPlxuXG4gICAgICAgIEBjZmcuZmlsZXMgICAgICAgPSBbXVxuICAgICAgICBAY2ZnLnN0YXRzICAgICAgID0gW11cbiAgICAgICAgQGNmZy5tYXhEZXB0aCAgICA/PSAzXG4gICAgICAgIEBjZmcuZG90RmlsZXMgICAgPz0gZmFsc2VcbiAgICAgICAgQGNmZy5pbmNsdWRlRGlycyA/PSB0cnVlXG4gICAgICAgIEBjZmcubWF4RmlsZXMgICAgPz0gNTAwXG4gICAgICAgIEBjZmcuaWdub3JlICAgICAgPz0gWydub2RlX21vZHVsZXMnLCAnYnVpbGQnLCAnQnVpbGQnLCAnTGlicmFyeScsICdBcHBsaWNhdGlvbnMnXSAjLCAncmVzb3VyY2VzJywgJ1RoaXJkUGFydHknLCAnQmluYXJpZXMnLCAnSW50ZXJtZWRpYXRlJywgJ1NhdmVkJywgJ1Byb2dyYW1zJywgJ1NoYWRlcnMnLCAnRGVyaXZlZERhdGFDYWNoZScsICdDb250ZW50JywgJ1NhbXBsZXMnXVxuICAgICAgICBAY2ZnLmluY2x1ZGUgICAgID89IFsnLmtvbnJhZC5ub29uJywgJy5naXRpZ25vcmUnLCAnLm5wbWlnbm9yZSddXG4gICAgICAgIEBjZmcuaWdub3JlRXh0ICAgPz0gWydhcHAnLCAnYXNhciddXG4gICAgICAgIEBjZmcuaW5jbHVkZUV4dCAgPz0gWydrb2ZmZWUnLCAnY29mZmVlJywgJ3N0eWwnLCAncHVnJywgJ21kJywgJ25vb24nLCAjICdodG1sJywgJ2NzcycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3R4dCcsICdqc29uJywgJ3NoJywgJ3B5JywgJ2pzJywgJ3RzJywgJ2luaScsICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnY3BwJywgJ2NjJywgJ2MnLCAnY3MnLCAnaCcsICdocHAnXVxuICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgICAgMDAwICAgXG4gICAgIyAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgXG4gICAgXG4gICAgc3RhcnQ6IC0+ICAgICAgICAgICBcbiAgICAgICAgdHJ5XG4gICAgICAgICAgICBAcnVubmluZyA9IHRydWVcbiAgICAgICAgICAgIGRpciA9IEBjZmcucm9vdFxuICAgICAgICAgICAgQHdhbGtlciA9IHdhbGtkaXIud2FsayBkaXIsIG1heF9kZXB0aDogQGNmZy5tYXhEZXB0aFxuICAgICAgICAgICAgb25XYWxrZXJQYXRoID0gKGNmZykgLT4gKHAsc3RhdCkgLT5cbiAgICAgICAgICAgICAgICBzcCAgID0gc2xhc2gucGF0aCBwXG4gICAgICAgICAgICAgICAgbmFtZSA9IHNsYXNoLmJhc2VuYW1lIHBcbiAgICAgICAgICAgICAgICBleHRuID0gc2xhc2guZXh0IHBcblxuICAgICAgICAgICAgICAgIGlmIGNmZy5maWx0ZXI/KHApXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBAaWdub3JlIHBcbiAgICAgICAgICAgICAgICBlbHNlIGlmIG5hbWUgaW4gWycuRFNfU3RvcmUnLCAnSWNvblxcciddIG9yIGV4dG4gaW4gWydweWMnXVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gQGlnbm9yZSBwXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBuYW1lLmVuZHNXaXRoICcteDY0J1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gQGlnbm9yZSBwXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBjZmcuaW5jbHVkZURpcj8gYW5kIHNsYXNoLmRpcihwKSA9PSBjZmcuaW5jbHVkZURpclxuICAgICAgICAgICAgICAgICAgICBjZmcuZmlsZXMucHVzaCBzcFxuICAgICAgICAgICAgICAgICAgICBjZmcuc3RhdHMucHVzaCBzdGF0XG4gICAgICAgICAgICAgICAgICAgIEBpZ25vcmUgcCBpZiBuYW1lIGluIGNmZy5pZ25vcmVcbiAgICAgICAgICAgICAgICAgICAgQGlnbm9yZSBwIGlmIG5hbWUuc3RhcnRzV2l0aCgnLicpIGFuZCBub3QgY2ZnLmRvdEZpbGVzXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBuYW1lIGluIGNmZy5pZ25vcmVcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEBpZ25vcmUgcFxuICAgICAgICAgICAgICAgIGVsc2UgaWYgbmFtZSBpbiBjZmcuaW5jbHVkZVxuICAgICAgICAgICAgICAgICAgICBjZmcuZmlsZXMucHVzaCBzcFxuICAgICAgICAgICAgICAgICAgICBjZmcuc3RhdHMucHVzaCBzdGF0XG4gICAgICAgICAgICAgICAgZWxzZSBpZiBuYW1lLnN0YXJ0c1dpdGggJy4nXG4gICAgICAgICAgICAgICAgICAgIGlmIGNmZy5kb3RGaWxlc1xuICAgICAgICAgICAgICAgICAgICAgICAgY2ZnLmZpbGVzLnB1c2ggc3BcbiAgICAgICAgICAgICAgICAgICAgICAgIGNmZy5zdGF0cy5wdXNoIHN0YXRcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEBpZ25vcmUgcCBcbiAgICAgICAgICAgICAgICBlbHNlIGlmIGV4dG4gaW4gY2ZnLmlnbm9yZUV4dFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gQGlnbm9yZSBwXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBleHRuIGluIGNmZy5pbmNsdWRlRXh0IG9yIGNmZy5pbmNsdWRlRXh0LmluZGV4T2YoJycpID49IDBcbiAgICAgICAgICAgICAgICAgICAgY2ZnLmZpbGVzLnB1c2ggc3BcbiAgICAgICAgICAgICAgICAgICAgY2ZnLnN0YXRzLnB1c2ggc3RhdFxuICAgICAgICAgICAgICAgIGVsc2UgaWYgc3RhdC5pc0RpcmVjdG9yeSgpXG4gICAgICAgICAgICAgICAgICAgIGlmIHAgIT0gY2ZnLnJvb3QgYW5kIGNmZy5pbmNsdWRlRGlyc1xuICAgICAgICAgICAgICAgICAgICAgICAgY2ZnLmZpbGVzLnB1c2ggc3AgXG4gICAgICAgICAgICAgICAgICAgICAgICBjZmcuc3RhdHMucHVzaCBzdGF0XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBjZmcucGF0aD8gc3AsIHN0YXRcbiAgICAgICAgICAgICAgICBpZiBzdGF0LmlzRGlyZWN0b3J5KClcbiAgICAgICAgICAgICAgICAgICAgaWYgY2ZnLmluY2x1ZGVEaXJzXG4gICAgICAgICAgICAgICAgICAgICAgICBjZmcuZGlyPyBzcCwgc3RhdFxuICAgICAgICAgICAgICAgICAgICBpZiBjZmcuc2tpcERpcj8gc3BcbiAgICAgICAgICAgICAgICAgICAgICAgIEBpZ25vcmUgcFxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgaWYgc2xhc2guZXh0KHNwKSBpbiBjZmcuaW5jbHVkZUV4dCBvciBzbGFzaC5iYXNlbmFtZShzcCkgaW4gY2ZnLmluY2x1ZGUgb3IgY2ZnLmluY2x1ZGVFeHQuaW5kZXhPZignJykgPj0gMFxuICAgICAgICAgICAgICAgICAgICAgICAgY2ZnLmZpbGU/IHNwLCBzdGF0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiBjZmcuZmlsZXMubGVuZ3RoID4gY2ZnLm1heEZpbGVzXG4gICAgICAgICAgICAgICAgICAgIEBlbmQoKVxuXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBjZmcuc2xvd2Rvd24gYW5kIChjZmcuZmlsZXMubGVuZ3RoICUgNDAwKSA9PSAzOTlcbiAgICAgICAgICAgICAgICAgICAgQHBhdXNlKClcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCBAcmVzdW1lLCAxMFxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIEB3YWxrZXIub24gJ3BhdGgnLCBvbldhbGtlclBhdGggQGNmZ1xuICAgICAgICAgICAgQHdhbGtlci5vbiAnZW5kJywgPT4gXG4gICAgICAgICAgICAgICAgQHJ1bm5pbmcgPSBmYWxzZVxuICAgICAgICAgICAgICAgIEBjZmcuZG9uZT8gQFxuICAgICAgICAgICAgICAgIFxuICAgICAgICBjYXRjaCBlcnJcbiAgICAgICAgICAgIEBydW5uaW5nID0gZmFsc2VcbiAgICAgICAgICAgIGtlcnJvciBcIldhbGtlci5zdGFydCAtLSAje2Vycn0gZGlyOiAje2Rpcn0gc3RhY2s6XCIsIGVyci5zdGFja1xuXG4gICAgc3RvcDogLT5cbiAgICAgICAgXG4gICAgICAgIEB3YWxrZXI/LnBhdXNlKClcbiAgICAgICAgQHdhbGtlcj8uZW5kKClcbiAgICAgICAgQHdhbGtlciA9IG51bGxcbiAgICBcbm1vZHVsZS5leHBvcnRzID0gV2Fsa2VyXG4iXX0=
//# sourceURL=../../coffee/tools/walker.coffee