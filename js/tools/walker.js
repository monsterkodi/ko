// koffee 1.12.0

/*
000   000   0000000   000      000   000  00000000  00000000 
000 0 000  000   000  000      000  000   000       000   000
000000000  000000000  000      0000000    0000000   0000000  
000   000  000   000  000      000  000   000       000   000
00     00  000   000  0000000  000   000  00000000  000   000
 */
var File, Walker, kerror, ref, slash, walkdir,
    indexOf = [].indexOf;

ref = require('kxk'), walkdir = ref.walkdir, slash = ref.slash, kerror = ref.kerror;

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Fsa2VyLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uL2NvZmZlZS90b29scyIsInNvdXJjZXMiOlsid2Fsa2VyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSx5Q0FBQTtJQUFBOztBQVFBLE1BQTZCLE9BQUEsQ0FBUSxLQUFSLENBQTdCLEVBQUUscUJBQUYsRUFBVyxpQkFBWCxFQUFrQjs7QUFFbEIsSUFBQSxHQUFPLE9BQUEsQ0FBUSxRQUFSOztBQUVEO0lBRUMsZ0JBQUMsSUFBRDtBQUVDLFlBQUE7UUFGQSxJQUFDLENBQUEsTUFBRDtRQUVBLElBQUMsQ0FBQSxHQUFHLENBQUMsS0FBTCxHQUFtQjtRQUNuQixJQUFDLENBQUEsR0FBRyxDQUFDLEtBQUwsR0FBbUI7O2dCQUNmLENBQUM7O2dCQUFELENBQUMsV0FBZTs7O2lCQUNoQixDQUFDOztpQkFBRCxDQUFDLFdBQWU7OztpQkFDaEIsQ0FBQzs7aUJBQUQsQ0FBQyxjQUFlOzs7aUJBQ2hCLENBQUM7O2lCQUFELENBQUMsV0FBZTs7O2lCQUNoQixDQUFDOztpQkFBRCxDQUFDLFNBQWUsQ0FBQyxjQUFELEVBQWdCLE9BQWhCLEVBQXdCLE9BQXhCLEVBQWdDLFNBQWhDLEVBQTBDLGNBQTFDOzs7aUJBQ2hCLENBQUM7O2lCQUFELENBQUMsVUFBZSxDQUFDLGNBQUQsRUFBZ0IsWUFBaEIsRUFBNkIsWUFBN0I7OztpQkFDaEIsQ0FBQzs7aUJBQUQsQ0FBQyxZQUFlLENBQUMsS0FBRCxFQUFPLE1BQVA7OztpQkFDaEIsQ0FBQzs7aUJBQUQsQ0FBQyxhQUFlLElBQUksQ0FBQzs7SUFYMUI7O3FCQW1CSCxLQUFBLEdBQU8sU0FBQTtBQUNILFlBQUE7QUFBQTtZQUNJLElBQUMsQ0FBQSxPQUFELEdBQVc7WUFDWCxHQUFBLEdBQU0sSUFBQyxDQUFBLEdBQUcsQ0FBQztZQUNYLElBQUMsQ0FBQSxNQUFELEdBQVUsT0FBTyxDQUFDLElBQVIsQ0FBYSxHQUFiLEVBQWtCO2dC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WCxFQUFrQixDQUFBLFNBQUEsS0FBQTt1QkFBQSxTQUFBO0FBQ2Qsd0JBQUE7b0JBQUEsS0FBQyxDQUFBLE9BQUQsR0FBVzsrRUFDUCxDQUFDLEtBQU07Z0JBRkc7WUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWxCLEVBM0RKO1NBQUEsYUFBQTtZQStETTtZQUNGLElBQUMsQ0FBQSxPQUFELEdBQVc7bUJBQ1gsTUFBQSxDQUFPLGtCQUFBLEdBQW1CLEdBQW5CLEdBQXVCLFFBQXZCLEdBQStCLEdBQS9CLEdBQW1DLFNBQTFDLEVBQW9ELEdBQUcsQ0FBQyxLQUF4RCxFQWpFSjs7SUFERzs7cUJBb0VQLElBQUEsR0FBTSxTQUFBO0FBRUYsWUFBQTs7Z0JBQU8sQ0FBRSxLQUFULENBQUE7OztnQkFDTyxDQUFFLEdBQVQsQ0FBQTs7ZUFDQSxJQUFDLENBQUEsTUFBRCxHQUFVO0lBSlI7Ozs7OztBQU1WLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgXG4wMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAgMDAwXG4wMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAgMDAwXG4wMCAgICAgMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwXG4jIyNcblxueyB3YWxrZGlyLCBzbGFzaCwga2Vycm9yIH0gPSByZXF1aXJlICdreGsnXG5cbkZpbGUgPSByZXF1aXJlICcuL2ZpbGUnXG5cbmNsYXNzIFdhbGtlclxuXG4gICAgQDogKEBjZmcpIC0+XG5cbiAgICAgICAgQGNmZy5maWxlcyAgICAgICA9IFtdXG4gICAgICAgIEBjZmcuc3RhdHMgICAgICAgPSBbXVxuICAgICAgICBAY2ZnLm1heERlcHRoICAgID89IDNcbiAgICAgICAgQGNmZy5kb3RGaWxlcyAgICA/PSBmYWxzZVxuICAgICAgICBAY2ZnLmluY2x1ZGVEaXJzID89IHRydWVcbiAgICAgICAgQGNmZy5tYXhGaWxlcyAgICA/PSA1MDBcbiAgICAgICAgQGNmZy5pZ25vcmUgICAgICA/PSBbJ25vZGVfbW9kdWxlcycgJ2J1aWxkJyAnQnVpbGQnICdMaWJyYXJ5JyAnQXBwbGljYXRpb25zJ10gIywgJ3Jlc291cmNlcycgJ1RoaXJkUGFydHknICdCaW5hcmllcycgJ0ludGVybWVkaWF0ZScgJ1NhdmVkJyAnUHJvZ3JhbXMnICdTaGFkZXJzJyAnRGVyaXZlZERhdGFDYWNoZScgJ0NvbnRlbnQnICdTYW1wbGVzJ11cbiAgICAgICAgQGNmZy5pbmNsdWRlICAgICA/PSBbJy5rb25yYWQubm9vbicgJy5naXRpZ25vcmUnICcubnBtaWdub3JlJ11cbiAgICAgICAgQGNmZy5pZ25vcmVFeHQgICA/PSBbJ2FwcCcgJ2FzYXInXVxuICAgICAgICBAY2ZnLmluY2x1ZGVFeHQgID89IEZpbGUuc291cmNlRmlsZUV4dGVuc2lvbnNcbiAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgIFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgICAgIDAwMCAgIFxuICAgICMgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgIFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgIFxuICAgIFxuICAgIHN0YXJ0OiAtPiAgICAgICAgICAgXG4gICAgICAgIHRyeVxuICAgICAgICAgICAgQHJ1bm5pbmcgPSB0cnVlXG4gICAgICAgICAgICBkaXIgPSBAY2ZnLnJvb3RcbiAgICAgICAgICAgIEB3YWxrZXIgPSB3YWxrZGlyLndhbGsgZGlyLCBtYXhfZGVwdGg6IEBjZmcubWF4RGVwdGhcbiAgICAgICAgICAgIG9uV2Fsa2VyUGF0aCA9IChjZmcpIC0+IChwLHN0YXQpIC0+XG4gICAgICAgICAgICAgICAgc3AgICA9IHNsYXNoLnBhdGggcFxuICAgICAgICAgICAgICAgIG5hbWUgPSBzbGFzaC5iYXNlbmFtZSBwXG4gICAgICAgICAgICAgICAgZXh0biA9IHNsYXNoLmV4dCBwXG5cbiAgICAgICAgICAgICAgICBpZiBjZmcuZmlsdGVyPyhwKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gQGlnbm9yZSBwXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBuYW1lIGluIFsnLkRTX1N0b3JlJyAnSWNvblxcciddIG9yIGV4dG4gaW4gWydweWMnXVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gQGlnbm9yZSBwXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBuYW1lLmVuZHNXaXRoICcteDY0J1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gQGlnbm9yZSBwXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBjZmcuaW5jbHVkZURpcj8gYW5kIHNsYXNoLmRpcihwKSA9PSBjZmcuaW5jbHVkZURpclxuICAgICAgICAgICAgICAgICAgICBjZmcuZmlsZXMucHVzaCBzcFxuICAgICAgICAgICAgICAgICAgICBjZmcuc3RhdHMucHVzaCBzdGF0XG4gICAgICAgICAgICAgICAgICAgIEBpZ25vcmUgcCBpZiBuYW1lIGluIGNmZy5pZ25vcmVcbiAgICAgICAgICAgICAgICAgICAgQGlnbm9yZSBwIGlmIG5hbWUuc3RhcnRzV2l0aCgnLicpIGFuZCBub3QgY2ZnLmRvdEZpbGVzXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBuYW1lIGluIGNmZy5pZ25vcmVcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEBpZ25vcmUgcFxuICAgICAgICAgICAgICAgIGVsc2UgaWYgbmFtZSBpbiBjZmcuaW5jbHVkZVxuICAgICAgICAgICAgICAgICAgICBjZmcuZmlsZXMucHVzaCBzcFxuICAgICAgICAgICAgICAgICAgICBjZmcuc3RhdHMucHVzaCBzdGF0XG4gICAgICAgICAgICAgICAgZWxzZSBpZiBuYW1lLnN0YXJ0c1dpdGggJy4nXG4gICAgICAgICAgICAgICAgICAgIGlmIGNmZy5kb3RGaWxlc1xuICAgICAgICAgICAgICAgICAgICAgICAgY2ZnLmZpbGVzLnB1c2ggc3BcbiAgICAgICAgICAgICAgICAgICAgICAgIGNmZy5zdGF0cy5wdXNoIHN0YXRcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEBpZ25vcmUgcCBcbiAgICAgICAgICAgICAgICBlbHNlIGlmIGV4dG4gaW4gY2ZnLmlnbm9yZUV4dFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gQGlnbm9yZSBwXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBleHRuIGluIGNmZy5pbmNsdWRlRXh0IG9yIGNmZy5pbmNsdWRlRXh0LmluZGV4T2YoJycpID49IDBcbiAgICAgICAgICAgICAgICAgICAgY2ZnLmZpbGVzLnB1c2ggc3BcbiAgICAgICAgICAgICAgICAgICAgY2ZnLnN0YXRzLnB1c2ggc3RhdFxuICAgICAgICAgICAgICAgIGVsc2UgaWYgc3RhdC5pc0RpcmVjdG9yeSgpXG4gICAgICAgICAgICAgICAgICAgIGlmIHAgIT0gY2ZnLnJvb3QgYW5kIGNmZy5pbmNsdWRlRGlyc1xuICAgICAgICAgICAgICAgICAgICAgICAgY2ZnLmZpbGVzLnB1c2ggc3AgXG4gICAgICAgICAgICAgICAgICAgICAgICBjZmcuc3RhdHMucHVzaCBzdGF0XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBjZmcucGF0aD8gc3AsIHN0YXRcbiAgICAgICAgICAgICAgICBpZiBzdGF0LmlzRGlyZWN0b3J5KClcbiAgICAgICAgICAgICAgICAgICAgaWYgY2ZnLmluY2x1ZGVEaXJzXG4gICAgICAgICAgICAgICAgICAgICAgICBjZmcuZGlyPyBzcCwgc3RhdFxuICAgICAgICAgICAgICAgICAgICBpZiBjZmcuc2tpcERpcj8gc3BcbiAgICAgICAgICAgICAgICAgICAgICAgIEBpZ25vcmUgcFxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgaWYgc2xhc2guZXh0KHNwKSBpbiBjZmcuaW5jbHVkZUV4dCBvciBzbGFzaC5iYXNlbmFtZShzcCkgaW4gY2ZnLmluY2x1ZGUgb3IgY2ZnLmluY2x1ZGVFeHQuaW5kZXhPZignJykgPj0gMFxuICAgICAgICAgICAgICAgICAgICAgICAgY2ZnLmZpbGU/IHNwLCBzdGF0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiBjZmcuZmlsZXMubGVuZ3RoID4gY2ZnLm1heEZpbGVzXG4gICAgICAgICAgICAgICAgICAgIEBlbmQoKVxuXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBjZmcuc2xvd2Rvd24gYW5kIChjZmcuZmlsZXMubGVuZ3RoICUgNDAwKSA9PSAzOTlcbiAgICAgICAgICAgICAgICAgICAgQHBhdXNlKClcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCBAcmVzdW1lLCAxMFxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIEB3YWxrZXIub24gJ3BhdGgnLCBvbldhbGtlclBhdGggQGNmZ1xuICAgICAgICAgICAgQHdhbGtlci5vbiAnZW5kJywgPT4gXG4gICAgICAgICAgICAgICAgQHJ1bm5pbmcgPSBmYWxzZVxuICAgICAgICAgICAgICAgIEBjZmcuZG9uZT8gQFxuICAgICAgICAgICAgICAgIFxuICAgICAgICBjYXRjaCBlcnJcbiAgICAgICAgICAgIEBydW5uaW5nID0gZmFsc2VcbiAgICAgICAgICAgIGtlcnJvciBcIldhbGtlci5zdGFydCAtLSAje2Vycn0gZGlyOiAje2Rpcn0gc3RhY2s6XCIsIGVyci5zdGFja1xuXG4gICAgc3RvcDogLT5cbiAgICAgICAgXG4gICAgICAgIEB3YWxrZXI/LnBhdXNlKClcbiAgICAgICAgQHdhbGtlcj8uZW5kKClcbiAgICAgICAgQHdhbGtlciA9IG51bGxcbiAgICBcbm1vZHVsZS5leHBvcnRzID0gV2Fsa2VyXG4iXX0=
//# sourceURL=../../coffee/tools/walker.coffee