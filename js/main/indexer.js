// koffee 0.56.0

/*
000  000   000  0000000    00000000  000   000  00000000  00000000
000  0000  000  000   000  000        000 000   000       000   000
000  000 0 000  000   000  0000000     00000    0000000   0000000
000  000  0000  000   000  000        000 000   000       000   000
000  000   000  0000000    00000000  000   000  00000000  000   000
 */
var IndexHpp, Indexer, Walker, _, empty, forkfunc, fs, kerror, matchr, os, post, ref, slash, str, valid,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    slice = [].slice,
    indexOf = [].indexOf;

ref = require('kxk'), post = ref.post, valid = ref.valid, empty = ref.empty, slash = ref.slash, fs = ref.fs, os = ref.os, str = ref.str, kerror = ref.kerror, _ = ref._;

Walker = require('../tools/walker');

matchr = require('../tools/matchr');

forkfunc = require('../tools/forkfunc');

IndexHpp = require('./indexhpp');

Indexer = (function() {
    Indexer.requireRegExp = /^\s*([\w\{\}]+)\s+=\s+require\s+[\'\"]([\.\/\w]+)[\'\"]/;

    Indexer.includeRegExp = /^#include\s+[\"\<]([\.\/\w]+)[\"\>]/;

    Indexer.methodRegExp = /^\s+([\@]?\w+|@)\s*\:\s*(\(.*\))?\s*[=-]\>/;

    Indexer.funcRegExp = /^\s*([\w\.]+)\s*[\:\=][^\(\)]*(\(.*\))?\s*[=-]\>/;

    Indexer.postRegExp = /^\s*post\.on\s+[\'\"](\w+)[\'\"]\s*\,?\s*(\(.*\))?\s*[=-]\>/;

    Indexer.testRegExp = /^\s*(describe|it)\s+[\'\"](.+)[\'\"]\s*\,?\s*(\([^\)]*\))?\s*[=-]\>/;

    Indexer.splitRegExp = new RegExp("[^\\w\\d\\_]+", 'g');

    Indexer.classRegExp = /^(\s*\S+\s*=)?\s*class\s+(\w+)/;

    Indexer.classNameInLine = function(line) {
        var m;
        m = line.match(Indexer.classRegExp);
        return m != null ? m[2] : void 0;
    };

    Indexer.methodNameInLine = function(line) {
        var m, rgs;
        m = line.match(Indexer.methodRegExp);
        if (m != null) {
            rgs = matchr.ranges(Indexer.methodRegExp, line);
            if (rgs[0].start > 11) {
                return null;
            }
        }
        return m != null ? m[1] : void 0;
    };

    Indexer.funcNameInLine = function(line) {
        var m, rgs;
        if (m = line.match(Indexer.funcRegExp)) {
            rgs = matchr.ranges(Indexer.funcRegExp, line);
            if (rgs[0].start > 7) {
                return null;
            }
        }
        return m != null ? m[1] : void 0;
    };

    Indexer.postNameInLine = function(line) {
        var m, rgs;
        if (m = line.match(Indexer.postRegExp)) {
            rgs = matchr.ranges(Indexer.postRegExp, line);
        }
        return m != null ? m[1] : void 0;
    };

    Indexer.testWord = function(word) {
        var ref1;
        switch (false) {
            case !(word.length < 3):
                return false;
            case (ref1 = word[0]) !== '-' && ref1 !== "#":
                return false;
            case word[word.length - 1] !== '-':
                return false;
            case !(word[0] === '_' && word.length < 4):
                return false;
            case !/^[0\_\-\@\#]+$/.test(word):
                return false;
            case !/\d/.test(word):
                return false;
            default:
                return true;
        }
    };

    function Indexer() {
        this.shiftQueue = bind(this.shiftQueue, this);
        this.onWalkerFile = bind(this.onWalkerFile, this);
        this.onWalkerDir = bind(this.onWalkerDir, this);
        this.onSourceInfoForFile = bind(this.onSourceInfoForFile, this);
        this.onGet = bind(this.onGet, this);
        post.onGet('indexer', this.onGet);
        post.on('sourceInfoForFile', this.onSourceInfoForFile);
        post.on('fileSaved', (function(_this) {
            return function(file, winID) {
                return _this.indexFile(file, {
                    refresh: true
                });
            };
        })(this));
        post.on('dirLoaded', (function(_this) {
            return function(dir) {
                return _this.indexProject(dir);
            };
        })(this));
        post.on('fileLoaded', (function(_this) {
            return function(file, winID) {
                _this.indexFile(file);
                return _this.indexProject(file);
            };
        })(this));
        this.collectBins();
        this.imageExtensions = ['png', 'jpg', 'gif', 'tiff', 'pxm', 'icns'];
        this.dirs = Object.create(null);
        this.files = Object.create(null);
        this.classes = Object.create(null);
        this.funcs = Object.create(null);
        this.words = Object.create(null);
        this.walker = null;
        this.queue = [];
        this.indexedProjects = [];
    }

    Indexer.prototype.onGet = function() {
        var filter, key, names, ref1, ref2, ref3, ref4, ref5, value;
        key = arguments[0], filter = 2 <= arguments.length ? slice.call(arguments, 1) : [];
        switch (key) {
            case 'counts':
                return {
                    classes: (ref1 = this.classes.length) != null ? ref1 : 0,
                    files: (ref2 = this.files.length) != null ? ref2 : 0,
                    funcs: (ref3 = this.funcs.length) != null ? ref3 : 0,
                    words: (ref4 = this.words.length) != null ? ref4 : 0,
                    dirs: (ref5 = this.dirs.length) != null ? ref5 : 0
                };
            case 'file':
                return this.files[filter[0]];
            case 'project':
                return this.projectInfo(filter[0]);
        }
        value = this[key];
        if (!empty(filter)) {
            names = _.filter(filter, function(c) {
                return !empty(c);
            });
            if (!empty(names)) {
                names = names.map(function(c) {
                    return c != null ? c.toLowerCase() : void 0;
                });
                value = _.pickBy(value, function(value, key) {
                    var cn, i, lc, len;
                    for (i = 0, len = names.length; i < len; i++) {
                        cn = names[i];
                        lc = key.toLowerCase();
                        if (cn.length > 1 && lc.indexOf(cn) >= 0 || lc.startsWith(cn)) {
                            return true;
                        }
                    }
                });
            }
        }
        return value;
    };

    Indexer.prototype.onSourceInfoForFile = function(opt) {
        var file;
        file = opt.item.file;
        if (this.files[file] != null) {
            return post.toWin(opt.winID, 'sourceInfoForFile', this.files[file], opt);
        }
    };

    Indexer.prototype.collectBins = function() {
        var dir, i, len, ref1, results, w;
        this.bins = [];
        if (slash.win()) {
            return;
        }
        ref1 = ['/bin', '/usr/bin', '/usr/local/bin'];
        results = [];
        for (i = 0, len = ref1.length; i < len; i++) {
            dir = ref1[i];
            w = new Walker({
                maxFiles: 1000,
                root: dir,
                includeDirs: false,
                includeExt: [''],
                file: (function(_this) {
                    return function(p) {
                        return _this.bins.push(slash.basename(p));
                    };
                })(this)
            });
            results.push(w.start());
        }
        return results;
    };

    Indexer.prototype.collectProjects = function() {
        var w;
        this.projects = {};
        w = new Walker({
            maxFiles: 5000,
            maxDepth: 3,
            root: slash.resolve('~'),
            include: ['.git'],
            ignore: ['node_modules', 'img', 'bin', 'js', 'Library'],
            skipDir: function(p) {
                return slash.base(p) === '.git';
            },
            filter: function(p) {
                var ref1;
                return (ref1 = slash.ext(p)) !== 'noon' && ref1 !== 'json' && ref1 !== 'git' && ref1 !== '';
            },
            dir: (function(_this) {
                return function(p) {
                    if (slash.file(p) === '.git') {
                        return _this.projects[slash.base(slash.dir(p))] = {
                            dir: slash.tilde(slash.dir(p))
                        };
                    }
                };
            })(this),
            file: (function(_this) {
                return function(p) {
                    if (slash.base(p) === 'package') {
                        return _this.projects[slash.base(slash.dir(p))] = {
                            dir: slash.tilde(slash.dir(p))
                        };
                    }
                };
            })(this),
            done: (function(_this) {
                return function() {
                    return console.log('collectProjects done', _this.projects);
                };
            })(this)
        });
        return w.start();
    };

    Indexer.prototype.projectInfo = function(path) {
        var i, len, project, ref1;
        ref1 = this.indexedProjects;
        for (i = 0, len = ref1.length; i < len; i++) {
            project = ref1[i];
            if (slash.samePath(project.dir, path) || path.startsWith(project.dir + '/')) {
                return project;
            }
        }
        return {};
    };

    Indexer.prototype.indexProject = function(file) {
        if (this.currentlyIndexing) {
            if (this.indexQueue != null) {
                this.indexQueue;
            } else {
                this.indexQueue = [];
            }
            if (indexOf.call(this.indexQueue, file) < 0) {
                this.indexQueue.push(file);
            }
            return;
        }
        file = slash.resolve(file);
        if (valid(this.projectInfo(file))) {
            return;
        }
        this.currentlyIndexing = file;
        return forkfunc(__dirname + "/indexprj", file, (function(_this) {
            return function(err, info) {
                var doShift;
                if (valid(err)) {
                    return kerror('indexing failed', err);
                }
                delete _this.currentlyIndexing;
                if (info) {
                    _this.indexedProjects.push(info);
                    post.toWins('projectIndexed', info);
                }
                doShift = empty(_this.queue);
                if (valid(info.files)) {
                    _this.queue = _this.queue.concat(info.files);
                }
                if (valid(_this.indexQueue)) {
                    _this.indexProject(_this.indexQueue.shift());
                }
                if (doShift) {
                    return _this.shiftQueue();
                }
            };
        })(this));
    };

    Indexer.prototype.indexDir = function(dir) {
        var wopt;
        if ((dir == null) || (this.dirs[dir] != null)) {
            return;
        }
        this.dirs[dir] = {
            name: slash.basename(dir)
        };
        wopt = {
            root: dir,
            includeDir: dir,
            includeDirs: true,
            dir: this.onWalkerDir,
            file: this.onWalkerFile,
            maxDepth: 12,
            maxFiles: 100000,
            done: (function(_this) {
                return function(w) {
                    return _this.shiftQueue;
                };
            })(this)
        };
        this.walker = new Walker(wopt);
        this.walker.cfg.ignore.push('js');
        return this.walker.start();
    };

    Indexer.prototype.onWalkerDir = function(p, stat) {
        if (this.dirs[p] == null) {
            return this.dirs[p] = {
                name: slash.basename(p)
            };
        }
    };

    Indexer.prototype.onWalkerFile = function(p, stat) {
        if ((this.files[p] == null) && this.queue.indexOf(p) < 0) {
            if (stat.size < 654321) {
                return this.queue.push(p);
            } else {
                return console.log("warning! file " + p + " too large? " + stat.size + ". skipping indexing!");
            }
        }
    };

    Indexer.prototype.addFuncInfo = function(funcName, funcInfo) {
        var funcInfos, ref1;
        if (funcName.length > 1 && funcName.startsWith('@')) {
            funcName = funcName.slice(1);
            funcInfo["static"] = true;
        }
        funcInfo.name = funcName;
        funcInfos = (ref1 = this.funcs[funcName]) != null ? ref1 : [];
        funcInfos.push(funcInfo);
        this.funcs[funcName] = funcInfos;
        return funcInfo;
    };

    Indexer.prototype.addMethod = function(className, funcName, file, li) {
        var funcInfo;
        funcInfo = this.addFuncInfo(funcName, {
            line: li + 1,
            file: file,
            "class": className
        });
        _.set(this.classes, className + ".methods." + funcInfo.name, funcInfo);
        return funcInfo;
    };

    Indexer.prototype.removeFile = function(file) {
        var infos, name, ref1;
        if (this.files[file] == null) {
            return;
        }
        ref1 = this.funcs;
        for (name in ref1) {
            infos = ref1[name];
            _.remove(infos, function(v) {
                return v.file === file;
            });
            if (!infos.length) {
                delete this.funcs[name];
            }
        }
        this.classes = _.omitBy(this.classes, function(v) {
            return v.file === file;
        });
        return delete this.files[file];
    };

    Indexer.prototype.indexFile = function(file, opt) {
        var fileExt, isCpp, isHpp;
        if (opt != null ? opt.refresh : void 0) {
            this.removeFile(file);
        }
        if (this.files[file] != null) {
            return this.shiftQueue();
        }
        fileExt = slash.ext(file);
        if (indexOf.call(this.imageExtensions, fileExt) >= 0) {
            this.files[file] = {};
            return this.shiftQueue();
        }
        isCpp = fileExt === 'cpp' || fileExt === 'cc';
        isHpp = fileExt === 'hpp' || fileExt === 'h';
        fs.readFile(file, 'utf8', (function(_this) {
            return function(err, data) {
                var abspath, className, clss, currentClass, fileInfo, func, funcAdded, funcInfo, funcName, funcStack, i, indent, indexHpp, j, k, l, len, len1, len2, li, line, lines, m, methodName, parsed, r, ref1, ref2, ref3, ref4, word, words;
                if (!empty(err)) {
                    return kerror("can't index " + file, err);
                }
                lines = data.split(/\r?\n/);
                fileInfo = {
                    lines: lines.length,
                    funcs: [],
                    classes: []
                };
                funcAdded = false;
                funcStack = [];
                currentClass = null;
                if (isHpp || isCpp) {
                    indexHpp = new IndexHpp;
                    parsed = indexHpp.parse(data);
                    funcAdded = !empty(parsed.classes) || !empty(parsed.funcs);
                    ref1 = parsed.classes;
                    for (i = 0, len = ref1.length; i < len; i++) {
                        clss = ref1[i];
                        _.set(_this.classes, clss.name + ".file", file);
                        _.set(_this.classes, clss.name + ".line", clss.line + 1);
                        fileInfo.classes.push({
                            name: clss.name,
                            line: clss.line + 1
                        });
                    }
                    ref2 = parsed.funcs;
                    for (j = 0, len1 = ref2.length; j < len1; j++) {
                        func = ref2[j];
                        funcInfo = _this.addMethod(func["class"], func.method, file, func.line);
                        fileInfo.funcs.push(funcInfo);
                    }
                } else {
                    for (li = k = 0, ref3 = lines.length; 0 <= ref3 ? k < ref3 : k > ref3; li = 0 <= ref3 ? ++k : --k) {
                        line = lines[li];
                        if (line.trim().length) {
                            indent = line.search(/\S/);
                            while (funcStack.length && indent <= _.last(funcStack)[0]) {
                                _.last(funcStack)[1].last = li - 1;
                                funcInfo = funcStack.pop()[1];
                                if (funcInfo["class"] != null) {
                                    funcInfo["class"];
                                } else {
                                    funcInfo["class"] = slash.base(file);
                                }
                                fileInfo.funcs.push(funcInfo);
                            }
                            if (currentClass != null) {
                                if (methodName = Indexer.methodNameInLine(line)) {
                                    funcInfo = _this.addMethod(currentClass, methodName, file, li);
                                    funcStack.push([indent, funcInfo]);
                                    funcAdded = true;
                                }
                            } else {
                                if (indent < 2) {
                                    currentClass = null;
                                }
                                if (funcName = Indexer.funcNameInLine(line)) {
                                    funcInfo = _this.addFuncInfo(funcName, {
                                        line: li + 1,
                                        file: file
                                    });
                                    funcStack.push([indent, funcInfo]);
                                    funcAdded = true;
                                } else if (funcName = Indexer.postNameInLine(line)) {
                                    funcInfo = _this.addFuncInfo(funcName, {
                                        line: li + 1,
                                        file: file,
                                        post: true
                                    });
                                    funcStack.push([indent, funcInfo]);
                                    funcAdded = true;
                                }
                                m = line.match(Indexer.testRegExp);
                                if ((m != null ? m[2] : void 0) != null) {
                                    funcInfo = _this.addFuncInfo(m[2], {
                                        line: li + 1,
                                        file: file,
                                        test: m[1]
                                    });
                                    funcStack.push([indent, funcInfo]);
                                    funcAdded = true;
                                }
                            }
                        }
                        words = line.split(Indexer.splitRegExp);
                        for (l = 0, len2 = words.length; l < len2; l++) {
                            word = words[l];
                            if (Indexer.testWord(word)) {
                                _.update(_this.words, word + ".count", function(n) {
                                    return (n != null ? n : 0) + 1;
                                });
                            }
                            switch (word) {
                                case 'class':
                                    if (className = Indexer.classNameInLine(line)) {
                                        currentClass = className;
                                        _.set(_this.classes, className + ".file", file);
                                        _.set(_this.classes, className + ".line", li + 1);
                                        fileInfo.classes.push({
                                            name: className,
                                            line: li + 1
                                        });
                                    }
                                    break;
                                case 'require':
                                    m = line.match(Indexer.requireRegExp);
                                    if (((m != null ? m[1] : void 0) != null) && (m[2] != null)) {
                                        r = (ref4 = fileInfo.require) != null ? ref4 : [];
                                        r.push([m[1], m[2]]);
                                        fileInfo.require = r;
                                        abspath = slash.resolve(slash.join(slash.dir(file), m[2]));
                                        abspath += '.coffee';
                                        if ((m[2][0] === '.') && (_this.files[abspath] == null) && (_this.queue.indexOf(abspath) < 0)) {
                                            if (slash.isFile(abspath)) {
                                                _this.queue.push(abspath);
                                            }
                                        }
                                    }
                            }
                        }
                    }
                }
                if (funcAdded) {
                    while (funcStack.length) {
                        _.last(funcStack)[1].last = li - 1;
                        funcInfo = funcStack.pop()[1];
                        if (funcInfo["class"] != null) {
                            funcInfo["class"];
                        } else {
                            funcInfo["class"] = slash.base(funcInfo.file);
                        }
                        if (funcInfo["class"] != null) {
                            funcInfo["class"];
                        } else {
                            funcInfo["class"] = slash.base(file);
                        }
                        fileInfo.funcs.push(funcInfo);
                    }
                    if ((opt != null ? opt.post : void 0) !== false) {
                        post.toWins('classesCount', _.size(_this.classes));
                        post.toWins('funcsCount', _.size(_this.funcs));
                        post.toWins('fileIndexed', file, fileInfo);
                    }
                }
                _this.files[file] = fileInfo;
                if ((opt != null ? opt.post : void 0) !== false) {
                    post.toWins('filesCount', _.size(_this.files));
                }
                return _this.shiftQueue();
            };
        })(this));
        return this;
    };

    Indexer.prototype.shiftQueue = function() {
        var file;
        if (this.queue.length) {
            file = this.queue.shift();
            return this.indexFile(file);
        }
    };

    return Indexer;

})();

module.exports = Indexer;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXhlci5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsbUdBQUE7SUFBQTs7OztBQVFBLE1BQXdELE9BQUEsQ0FBUSxLQUFSLENBQXhELEVBQUUsZUFBRixFQUFRLGlCQUFSLEVBQWUsaUJBQWYsRUFBc0IsaUJBQXRCLEVBQTZCLFdBQTdCLEVBQWlDLFdBQWpDLEVBQXFDLGFBQXJDLEVBQTBDLG1CQUExQyxFQUFrRDs7QUFFbEQsTUFBQSxHQUFXLE9BQUEsQ0FBUSxpQkFBUjs7QUFDWCxNQUFBLEdBQVcsT0FBQSxDQUFRLGlCQUFSOztBQUNYLFFBQUEsR0FBVyxPQUFBLENBQVEsbUJBQVI7O0FBQ1gsUUFBQSxHQUFXLE9BQUEsQ0FBUSxZQUFSOztBQUVMO0lBRUYsT0FBQyxDQUFBLGFBQUQsR0FBbUI7O0lBQ25CLE9BQUMsQ0FBQSxhQUFELEdBQW1COztJQUVuQixPQUFDLENBQUEsWUFBRCxHQUFtQjs7SUFFbkIsT0FBQyxDQUFBLFVBQUQsR0FBbUI7O0lBQ25CLE9BQUMsQ0FBQSxVQUFELEdBQW1COztJQUNuQixPQUFDLENBQUEsVUFBRCxHQUFtQjs7SUFDbkIsT0FBQyxDQUFBLFdBQUQsR0FBbUIsSUFBSSxNQUFKLENBQVcsZUFBWCxFQUE0QixHQUE1Qjs7SUFDbkIsT0FBQyxDQUFBLFdBQUQsR0FBbUI7O0lBRW5CLE9BQUMsQ0FBQSxlQUFELEdBQWtCLFNBQUMsSUFBRDtBQUVkLFlBQUE7UUFBQSxDQUFBLEdBQUksSUFBSSxDQUFDLEtBQUwsQ0FBVyxPQUFPLENBQUMsV0FBbkI7MkJBQ0osQ0FBRyxDQUFBLENBQUE7SUFIVzs7SUFLbEIsT0FBQyxDQUFBLGdCQUFELEdBQW1CLFNBQUMsSUFBRDtBQUVmLFlBQUE7UUFBQSxDQUFBLEdBQUksSUFBSSxDQUFDLEtBQUwsQ0FBVyxPQUFPLENBQUMsWUFBbkI7UUFDSixJQUFHLFNBQUg7WUFDSSxHQUFBLEdBQU0s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bEtzQjtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBMUI7ZUFtS0E7SUFuTE87O3NCQTJMWCxVQUFBLEdBQVksU0FBQTtBQUVSLFlBQUE7UUFBQSxJQUFHLElBQUMsQ0FBQSxLQUFLLENBQUMsTUFBVjtZQUNJLElBQUEsR0FBTyxJQUFDLENBQUEsS0FBSyxDQUFDLEtBQVAsQ0FBQTttQkFDUCxJQUFDLENBQUEsU0FBRCxDQUFXLElBQVgsRUFGSjs7SUFGUTs7Ozs7O0FBTWhCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDBcbjAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDBcbjAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgIDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwXG4wMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgMDAwXG4wMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwXG4jIyNcblxueyBwb3N0LCB2YWxpZCwgZW1wdHksIHNsYXNoLCBmcywgb3MsIHN0ciwga2Vycm9yLCBfIH0gPSByZXF1aXJlICdreGsnXG5cbldhbGtlciAgID0gcmVxdWlyZSAnLi4vdG9vbHMvd2Fsa2VyJ1xubWF0Y2hyICAgPSByZXF1aXJlICcuLi90b29scy9tYXRjaHInXG5mb3JrZnVuYyA9IHJlcXVpcmUgJy4uL3Rvb2xzL2ZvcmtmdW5jJ1xuSW5kZXhIcHAgPSByZXF1aXJlICcuL2luZGV4aHBwJ1xuXG5jbGFzcyBJbmRleGVyXG5cbiAgICBAcmVxdWlyZVJlZ0V4cCAgID0gL15cXHMqKFtcXHdcXHtcXH1dKylcXHMrPVxccytyZXF1aXJlXFxzK1tcXCdcXFwiXShbXFwuXFwvXFx3XSspW1xcJ1xcXCJdL1xuICAgIEBpbmNsdWRlUmVnRXhwICAgPSAvXiNpbmNsdWRlXFxzK1tcXFwiXFw8XShbXFwuXFwvXFx3XSspW1xcXCJcXD5dL1xuICAgICMgQG1ldGhvZFJlZ0V4cCAgICA9IC9eXFxzKyhbXFxAXT9cXHcrKVxccypcXDpcXHMqKFxcKC4qXFwpKT9cXHMqWz0tXVxcPi9cbiAgICBAbWV0aG9kUmVnRXhwICAgID0gL15cXHMrKFtcXEBdP1xcdyt8QClcXHMqXFw6XFxzKihcXCguKlxcKSk/XFxzKls9LV1cXD4vXG4gICAgIyBAZnVuY1JlZ0V4cCAgICAgID0gL15cXHMqKFtcXHdcXC5dKylcXHMqW1xcOlxcPV1cXHMqKFxcKC4qXFwpKT9cXHMqWz0tXVxcPi9cbiAgICBAZnVuY1JlZ0V4cCAgICAgID0gL15cXHMqKFtcXHdcXC5dKylcXHMqW1xcOlxcPV1bXlxcKFxcKV0qKFxcKC4qXFwpKT9cXHMqWz0tXVxcPi9cbiAgICBAcG9zdFJlZ0V4cCAgICAgID0gL15cXHMqcG9zdFxcLm9uXFxzK1tcXCdcXFwiXShcXHcrKVtcXCdcXFwiXVxccypcXCw/XFxzKihcXCguKlxcKSk/XFxzKls9LV1cXD4vXG4gICAgQHRlc3RSZWdFeHAgICAgICA9IC9eXFxzKihkZXNjcmliZXxpdClcXHMrW1xcJ1xcXCJdKC4rKVtcXCdcXFwiXVxccypcXCw/XFxzKihcXChbXlxcKV0qXFwpKT9cXHMqWz0tXVxcPi9cbiAgICBAc3BsaXRSZWdFeHAgICAgID0gbmV3IFJlZ0V4cCBcIlteXFxcXHdcXFxcZFxcXFxfXStcIiwgJ2cnXG4gICAgQGNsYXNzUmVnRXhwICAgICA9IC9eKFxccypcXFMrXFxzKj0pP1xccypjbGFzc1xccysoXFx3KykvXG5cbiAgICBAY2xhc3NOYW1lSW5MaW5lOiAobGluZSkgLT5cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIG0gPSBsaW5lLm1hdGNoIEluZGV4ZXIuY2xhc3NSZWdFeHBcbiAgICAgICAgbT9bMl1cbiAgICAgICAgXG4gICAgQG1ldGhvZE5hbWVJbkxpbmU6IChsaW5lKSAtPlxuICAgICAgICBcbiAgICAgICAgbSA9IGxpbmUubWF0Y2ggSW5kZXhlci5tZXRob2RSZWdFeHBcbiAgICAgICAgaWYgbT9cbiAgICAgICAgICAgIHJncyA9IG1hdGNoci5yYW5nZXMgSW5kZXhlci5tZXRob2RSZWdFeHAsIGxpbmVcbiAgICAgICAgICAgIGlmIHJnc1swXS5zdGFydCA+IDExXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICAgbT9bMV1cbiAgICAgICAgXG4gICAgQGZ1bmNOYW1lSW5MaW5lOiAobGluZSkgLT5cblxuICAgICAgICBpZiBtID0gbGluZS5tYXRjaCBJbmRleGVyLmZ1bmNSZWdFeHBcbiAgICAgICAgICAgIHJncyA9IG1hdGNoci5yYW5nZXMgSW5kZXhlci5mdW5jUmVnRXhwLCBsaW5lXG4gICAgICAgICAgICBpZiByZ3NbMF0uc3RhcnQgPiA3XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICAgICAgIFxuICAgICAgICBtP1sxXVxuXG4gICAgQHBvc3ROYW1lSW5MaW5lOiAobGluZSkgLT4gICAgICAgIFxuICAgICAgICBcbiAgICAgICAgaWYgbSA9IGxpbmUubWF0Y2ggSW5kZXhlci5wb3N0UmVnRXhwXG4gICAgICAgICAgICByZ3MgPSBtYXRjaHIucmFuZ2VzIEluZGV4ZXIucG9zdFJlZ0V4cCwgbGluZVxuICAgICAgICBcbiAgICAgICAgbT9bMV1cbiAgICAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgICAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICBcbiAgICBcbiAgICBAdGVzdFdvcmQ6ICh3b3JkKSAtPlxuICAgICAgICBcbiAgICAgICAgc3dpdGNoXG4gICAgICAgICAgICB3aGVuIHdvcmQubGVuZ3RoIDwgMyB0aGVuIGZhbHNlICMgZXhjbHVkZSB3aGVuIHRvbyBzaG9ydFxuICAgICAgICAgICAgd2hlbiB3b3JkWzBdIGluIFsnLScsIFwiI1wiXSB0aGVuIGZhbHNlXG4gICAgICAgICAgICB3aGVuIHdvcmRbd29yZC5sZW5ndGgtMV0gPT0gJy0nIHRoZW4gZmFsc2UgXG4gICAgICAgICAgICB3aGVuIHdvcmRbMF0gPT0gJ18nIGFuZCB3b3JkLmxlbmd0aCA8IDQgdGhlbiBmYWxzZSAjIGV4Y2x1ZGUgd2hlbiBzdGFydHMgd2l0aCB1bmRlcnNjb3JlIGFuZCBpcyBzaG9ydFxuICAgICAgICAgICAgd2hlbiAvXlswXFxfXFwtXFxAXFwjXSskLy50ZXN0IHdvcmQgdGhlbiBmYWxzZSAjIGV4Y2x1ZGUgd2hlbiBjb25zaXN0IG9mIHNwZWNpYWwgY2hhcmFjdGVycyBvbmx5XG4gICAgICAgICAgICB3aGVuIC9cXGQvLnRlc3Qgd29yZCB0aGVuIGZhbHNlICMgZXhjbHVkZSB3aGVuIHdvcmQgY29udGFpbnMgbnVtYmVyXG4gICAgICAgICAgICBlbHNlIHRydWVcbiAgICAgICAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgIGNvbnN0cnVjdG9yOiAoKSAtPlxuICAgICAgICBcbiAgICAgICAgcG9zdC5vbkdldCAnaW5kZXhlcicsIEBvbkdldFxuICAgICAgICBwb3N0Lm9uICdzb3VyY2VJbmZvRm9yRmlsZScsIEBvblNvdXJjZUluZm9Gb3JGaWxlXG4gICAgICAgIFxuICAgICAgICBwb3N0Lm9uICdmaWxlU2F2ZWQnLCAgICAoZmlsZSwgd2luSUQpID0+IEBpbmRleEZpbGUgZmlsZSwgcmVmcmVzaDogdHJ1ZVxuICAgICAgICBwb3N0Lm9uICdkaXJMb2FkZWQnLCAgICAoZGlyKSAgICAgICAgID0+IEBpbmRleFByb2plY3QgZGlyXG4gICAgICAgIHBvc3Qub24gJ2ZpbGVMb2FkZWQnLCAgIChmaWxlLCB3aW5JRCkgPT4gXG4gICAgICAgICAgICBAaW5kZXhGaWxlIGZpbGVcbiAgICAgICAgICAgIEBpbmRleFByb2plY3QgZmlsZVxuICAgICAgICBcbiAgICAgICAgQGNvbGxlY3RCaW5zKClcbiAgICBcbiAgICAgICAgQGltYWdlRXh0ZW5zaW9ucyA9IFsncG5nJywgJ2pwZycsICdnaWYnLCAndGlmZicsICdweG0nLCAnaWNucyddICAgICAgICBcblxuICAgICAgICBAZGlycyAgICA9IE9iamVjdC5jcmVhdGUgbnVsbFxuICAgICAgICBAZmlsZXMgICA9IE9iamVjdC5jcmVhdGUgbnVsbFxuICAgICAgICBAY2xhc3NlcyA9IE9iamVjdC5jcmVhdGUgbnVsbFxuICAgICAgICBAZnVuY3MgICA9IE9iamVjdC5jcmVhdGUgbnVsbFxuICAgICAgICBAd29yZHMgICA9IE9iamVjdC5jcmVhdGUgbnVsbFxuICAgICAgICBAd2Fsa2VyICA9IG51bGxcbiAgICAgICAgQHF1ZXVlICAgPSBbXVxuICAgICAgICBcbiAgICAgICAgQGluZGV4ZWRQcm9qZWN0cyA9IFtdXG5cbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgb25HZXQ6IChrZXksIGZpbHRlci4uLikgPT5cbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCBrZXlcbiAgICAgICAgICAgIHdoZW4gJ2NvdW50cydcbiAgICAgICAgICAgICAgICByZXR1cm4gXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzZXM6IEBjbGFzc2VzLmxlbmd0aCA/IDBcbiAgICAgICAgICAgICAgICAgICAgZmlsZXM6ICAgQGZpbGVzLmxlbmd0aCA/IDBcbiAgICAgICAgICAgICAgICAgICAgZnVuY3M6ICAgQGZ1bmNzLmxlbmd0aCA/IDBcbiAgICAgICAgICAgICAgICAgICAgd29yZHM6ICAgQHdvcmRzLmxlbmd0aCA/IDBcbiAgICAgICAgICAgICAgICAgICAgZGlyczogICAgQGRpcnMubGVuZ3RoID8gMFxuICAgICAgICAgICAgd2hlbiAnZmlsZSdcbiAgICAgICAgICAgICAgICByZXR1cm4gQGZpbGVzW2ZpbHRlclswXV1cbiAgICAgICAgICAgIHdoZW4gJ3Byb2plY3QnXG4gICAgICAgICAgICAgICAgcmV0dXJuIEBwcm9qZWN0SW5mbyBmaWx0ZXJbMF1cbiAgICAgICAgXG4gICAgICAgIHZhbHVlID0gQFtrZXldXG4gICAgICAgIGlmIG5vdCBlbXB0eSBmaWx0ZXJcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgbmFtZXMgPSBfLmZpbHRlciBmaWx0ZXIsIChjKSAtPiBub3QgZW1wdHkgY1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBub3QgZW1wdHkgbmFtZXNcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBuYW1lcyA9IG5hbWVzLm1hcCAoYykgLT4gYz8udG9Mb3dlckNhc2UoKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHZhbHVlID0gXy5waWNrQnkgdmFsdWUsICh2YWx1ZSwga2V5KSAtPlxuICAgICAgICAgICAgICAgICAgICBmb3IgY24gaW4gbmFtZXNcbiAgICAgICAgICAgICAgICAgICAgICAgIGxjID0ga2V5LnRvTG93ZXJDYXNlKClcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIGNuLmxlbmd0aD4xIGFuZCBsYy5pbmRleE9mKGNuKT49MCBvciBsYy5zdGFydHNXaXRoKGNuKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIHZhbHVlXG4gICAgICAgIFxuICAgIG9uU291cmNlSW5mb0ZvckZpbGU6IChvcHQpID0+XG4gICAgICAgIFxuICAgICAgICBmaWxlID0gb3B0Lml0ZW0uZmlsZVxuICAgICAgICBpZiBAZmlsZXNbZmlsZV0/XG4gICAgICAgICAgICBwb3N0LnRvV2luIG9wdC53aW5JRCwgJ3NvdXJjZUluZm9Gb3JGaWxlJywgQGZpbGVzW2ZpbGVdLCBvcHRcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgY29sbGVjdEJpbnM6IC0+XG4gICAgICAgIFxuICAgICAgICBAYmlucyA9IFtdXG4gICAgICAgIHJldHVybiBpZiBzbGFzaC53aW4oKVxuICAgICAgICBcbiAgICAgICAgZm9yIGRpciBpbiBbJy9iaW4nLCAnL3Vzci9iaW4nLCAnL3Vzci9sb2NhbC9iaW4nXVxuICAgICAgICAgICAgdyA9IG5ldyBXYWxrZXJcbiAgICAgICAgICAgICAgICBtYXhGaWxlczogICAgMTAwMFxuICAgICAgICAgICAgICAgIHJvb3Q6ICAgICAgICBkaXJcbiAgICAgICAgICAgICAgICBpbmNsdWRlRGlyczogZmFsc2VcbiAgICAgICAgICAgICAgICBpbmNsdWRlRXh0OiAgWycnXSAjIHJlcG9ydCBmaWxlcyB3aXRob3V0IGV4dGVuc2lvblxuICAgICAgICAgICAgICAgIGZpbGU6ICAgICAgICAocCkgPT4gQGJpbnMucHVzaCBzbGFzaC5iYXNlbmFtZSBwXG4gICAgICAgICAgICB3LnN0YXJ0KClcblxuICAgIGNvbGxlY3RQcm9qZWN0czogLT5cblxuICAgICAgICBAcHJvamVjdHMgPSB7fVxuICAgICAgICB3ID0gbmV3IFdhbGtlclxuICAgICAgICAgICAgbWF4RmlsZXM6ICAgIDUwMDBcbiAgICAgICAgICAgIG1heERlcHRoOiAgICAzXG4gICAgICAgICAgICByb290OiAgICAgICAgc2xhc2gucmVzb2x2ZSAnfidcbiAgICAgICAgICAgIGluY2x1ZGU6ICAgICBbJy5naXQnXVxuICAgICAgICAgICAgaWdub3JlOiAgICAgIFsnbm9kZV9tb2R1bGVzJywgJ2ltZycsICdiaW4nLCAnanMnLCAnTGlicmFyeSddXG4gICAgICAgICAgICBza2lwRGlyOiAgICAgKHApIC0+IHNsYXNoLmJhc2UocCkgPT0gJy5naXQnXG4gICAgICAgICAgICBmaWx0ZXI6ICAgICAgKHApIC0+IHNsYXNoLmV4dChwKSBub3QgaW4gWydub29uJywgJ2pzb24nLCAnZ2l0JywgJyddXG4gICAgICAgICAgICBkaXI6ICAgICAgICAgKHApID0+IGlmIHNsYXNoLmZpbGUocCkgPT0gJy5naXQnICAgIHRoZW4gQHByb2plY3RzW3NsYXNoLmJhc2Ugc2xhc2guZGlyIHBdID0gZGlyOiBzbGFzaC50aWxkZSBzbGFzaC5kaXIgcFxuICAgICAgICAgICAgZmlsZTogICAgICAgIChwKSA9PiBpZiBzbGFzaC5iYXNlKHApID09ICdwYWNrYWdlJyB0aGVuIEBwcm9qZWN0c1tzbGFzaC5iYXNlIHNsYXNoLmRpciBwXSA9IGRpcjogc2xhc2gudGlsZGUgc2xhc2guZGlyIHBcbiAgICAgICAgICAgIGRvbmU6ICAgICAgICA9PiBsb2cgJ2NvbGxlY3RQcm9qZWN0cyBkb25lJywgQHByb2plY3RzXG4gICAgICAgIHcuc3RhcnQoKVxuXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgICAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgICAgICAgMDAwICAwMDAwMDAwICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIHByb2plY3RJbmZvOiAocGF0aCkgLT5cbiAgICAgICAgXG4gICAgICAgIGZvciBwcm9qZWN0IGluIEBpbmRleGVkUHJvamVjdHNcbiAgICAgICAgICAgIGlmIHNsYXNoLnNhbWVQYXRoKHByb2plY3QuZGlyLCBwYXRoKSBvciBwYXRoLnN0YXJ0c1dpdGggcHJvamVjdC5kaXIgKyAnLydcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJvamVjdFxuICAgICAgICB7fVxuICAgIFxuICAgIGluZGV4UHJvamVjdDogKGZpbGUpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBAY3VycmVudGx5SW5kZXhpbmdcbiAgICAgICAgICAgIEBpbmRleFF1ZXVlID89IFtdXG4gICAgICAgICAgICBpZiBmaWxlIG5vdCBpbiBAaW5kZXhRdWV1ZVxuICAgICAgICAgICAgICAgIEBpbmRleFF1ZXVlLnB1c2ggZmlsZVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIFxuICAgICAgICBmaWxlID0gc2xhc2gucmVzb2x2ZSBmaWxlIFxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIHZhbGlkIEBwcm9qZWN0SW5mbyBmaWxlXG4gICAgICAgICAgICAgIFxuICAgICAgICBAY3VycmVudGx5SW5kZXhpbmcgPSBmaWxlXG4gICAgICAgIFxuICAgICAgICBmb3JrZnVuYyBcIiN7X19kaXJuYW1lfS9pbmRleHByalwiLCBmaWxlLCAoZXJyLCBpbmZvKSA9PlxuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4ga2Vycm9yICdpbmRleGluZyBmYWlsZWQnLCBlcnIgaWYgdmFsaWQgZXJyXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGRlbGV0ZSBAY3VycmVudGx5SW5kZXhpbmdcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgaW5mb1xuICAgICAgICAgICAgICAgIEBpbmRleGVkUHJvamVjdHMucHVzaCBpbmZvIFxuICAgICAgICAgICAgICAgIHBvc3QudG9XaW5zICdwcm9qZWN0SW5kZXhlZCcsIGluZm9cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZG9TaGlmdCA9IGVtcHR5IEBxdWV1ZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiB2YWxpZCBpbmZvLmZpbGVzXG4gICAgICAgICAgICAgICAgQHF1ZXVlID0gQHF1ZXVlLmNvbmNhdCBpbmZvLmZpbGVzXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiB2YWxpZCBAaW5kZXhRdWV1ZVxuICAgICAgICAgICAgICAgIEBpbmRleFByb2plY3QgQGluZGV4UXVldWUuc2hpZnQoKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgQHNoaWZ0UXVldWUoKSBpZiBkb1NoaWZ0XG4gICAgICAgICAgICAgICAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwIDAwMCAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgIDAwMDAwICAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAwMDAgICAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAwMDAwICAgIDAwMCAgMDAwICAgMDAwXG5cbiAgICBpbmRleERpcjogKGRpcikgLT5cblxuICAgICAgICByZXR1cm4gaWYgbm90IGRpcj8gb3IgQGRpcnNbZGlyXT9cbiAgICAgICAgXG4gICAgICAgIEBkaXJzW2Rpcl0gPVxuICAgICAgICAgICAgbmFtZTogc2xhc2guYmFzZW5hbWUgZGlyXG5cbiAgICAgICAgd29wdCA9XG4gICAgICAgICAgICByb290OiAgICAgICAgZGlyXG4gICAgICAgICAgICBpbmNsdWRlRGlyOiAgZGlyXG4gICAgICAgICAgICBpbmNsdWRlRGlyczogdHJ1ZVxuICAgICAgICAgICAgZGlyOiAgICAgICAgIEBvbldhbGtlckRpclxuICAgICAgICAgICAgZmlsZTogICAgICAgIEBvbldhbGtlckZpbGVcbiAgICAgICAgICAgIG1heERlcHRoOiAgICAxMlxuICAgICAgICAgICAgbWF4RmlsZXM6ICAgIDEwMDAwMFxuICAgICAgICAgICAgZG9uZTogICAgICAgICh3KSA9PiBcbiAgICAgICAgICAgICAgICBAc2hpZnRRdWV1ZVxuXG4gICAgICAgIEB3YWxrZXIgPSBuZXcgV2Fsa2VyIHdvcHRcbiAgICAgICAgQHdhbGtlci5jZmcuaWdub3JlLnB1c2ggJ2pzJ1xuICAgICAgICBAd2Fsa2VyLnN0YXJ0KClcblxuICAgIG9uV2Fsa2VyRGlyOiAocCwgc3RhdCkgPT5cbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBAZGlyc1twXT9cbiAgICAgICAgICAgIEBkaXJzW3BdID1cbiAgICAgICAgICAgICAgICBuYW1lOiBzbGFzaC5iYXNlbmFtZSBwXG5cbiAgICBvbldhbGtlckZpbGU6IChwLCBzdGF0KSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgbm90IEBmaWxlc1twXT8gYW5kIEBxdWV1ZS5pbmRleE9mKHApIDwgMFxuICAgICAgICAgICAgaWYgc3RhdC5zaXplIDwgNjU0MzIxICMgb2J2aW91c2x5IHNvbWUgYXJiaXRyYXJ5IG51bWJlciA6KVxuICAgICAgICAgICAgICAgIEBxdWV1ZS5wdXNoIHBcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBsb2cgXCJ3YXJuaW5nISBmaWxlICN7cH0gdG9vIGxhcmdlPyAje3N0YXQuc2l6ZX0uIHNraXBwaW5nIGluZGV4aW5nIVwiXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgICAgICAwMDAgICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICBcblxuICAgIGFkZEZ1bmNJbmZvOiAoZnVuY05hbWUsIGZ1bmNJbmZvKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgZnVuY05hbWUubGVuZ3RoID4gMSBhbmQgZnVuY05hbWUuc3RhcnRzV2l0aCAnQCdcbiAgICAgICAgICAgIGZ1bmNOYW1lID0gZnVuY05hbWUuc2xpY2UgMVxuICAgICAgICAgICAgZnVuY0luZm8uc3RhdGljID0gdHJ1ZVxuICAgICAgICAgICAgXG4gICAgICAgIGZ1bmNJbmZvLm5hbWUgPSBmdW5jTmFtZVxuICAgICAgICBcbiAgICAgICAgZnVuY0luZm9zID0gQGZ1bmNzW2Z1bmNOYW1lXSA/IFtdXG4gICAgICAgIGZ1bmNJbmZvcy5wdXNoIGZ1bmNJbmZvXG4gICAgICAgIEBmdW5jc1tmdW5jTmFtZV0gPSBmdW5jSW5mb3NcbiAgICAgICAgXG4gICAgICAgIGZ1bmNJbmZvXG5cbiAgICBhZGRNZXRob2Q6IChjbGFzc05hbWUsIGZ1bmNOYW1lLCBmaWxlLCBsaSkgLT5cblxuICAgICAgICBmdW5jSW5mbyA9IEBhZGRGdW5jSW5mbyBmdW5jTmFtZSxcbiAgICAgICAgICAgIGxpbmU6ICBsaSsxXG4gICAgICAgICAgICBmaWxlOiAgZmlsZVxuICAgICAgICAgICAgY2xhc3M6IGNsYXNzTmFtZVxuXG4gICAgICAgIF8uc2V0IEBjbGFzc2VzLCBcIiN7Y2xhc3NOYW1lfS5tZXRob2RzLiN7ZnVuY0luZm8ubmFtZX1cIiwgZnVuY0luZm9cblxuICAgICAgICBmdW5jSW5mb1xuXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwIDAwMCAgIDAwMDAwMDAgICAgICAgICAwMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgICAgIDAgICAgICAwMDAwMDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcblxuICAgIHJlbW92ZUZpbGU6IChmaWxlKSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAZmlsZXNbZmlsZV0/XG4gICAgICAgIFxuICAgICAgICBmb3IgbmFtZSxpbmZvcyBvZiBAZnVuY3NcbiAgICAgICAgICAgIF8ucmVtb3ZlIGluZm9zLCAodikgLT4gdi5maWxlID09IGZpbGVcbiAgICAgICAgICAgIGRlbGV0ZSBAZnVuY3NbbmFtZV0gaWYgbm90IGluZm9zLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgQGNsYXNzZXMgPSBfLm9taXRCeSBAY2xhc3NlcywgKHYpIC0+IHYuZmlsZSA9PSBmaWxlXG4gICAgICAgIFxuICAgICAgICBkZWxldGUgQGZpbGVzW2ZpbGVdXG5cbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgICAgIDAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAwMDAgICAgICAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgIDAwMDAwICAgICAgICAgIDAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwIDAwMCAgICAgICAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcblxuICAgIGluZGV4RmlsZTogKGZpbGUsIG9wdCkgLT5cbiAgICAgICAgXG4gICAgICAgIEByZW1vdmVGaWxlIGZpbGUgaWYgb3B0Py5yZWZyZXNoXG5cbiAgICAgICAgaWYgQGZpbGVzW2ZpbGVdP1xuICAgICAgICAgICAgcmV0dXJuIEBzaGlmdFF1ZXVlKClcblxuICAgICAgICBmaWxlRXh0ID0gc2xhc2guZXh0IGZpbGUgXG5cbiAgICAgICAgaWYgZmlsZUV4dCBpbiBAaW1hZ2VFeHRlbnNpb25zXG4gICAgICAgICAgICBAZmlsZXNbZmlsZV0gPSB7fVxuICAgICAgICAgICAgcmV0dXJuIEBzaGlmdFF1ZXVlKClcbiAgICAgICAgICAgIFxuICAgICAgICBpc0NwcCA9IGZpbGVFeHQgaW4gWydjcHAnLCAnY2MnXVxuICAgICAgICBpc0hwcCA9IGZpbGVFeHQgaW4gWydocHAnLCAnaCcgXVxuXG4gICAgICAgIGZzLnJlYWRGaWxlIGZpbGUsICd1dGY4JywgKGVyciwgZGF0YSkgPT5cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIGtlcnJvciBcImNhbid0IGluZGV4ICN7ZmlsZX1cIiwgZXJyIGlmIG5vdCBlbXB0eSBlcnJcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgbGluZXMgPSBkYXRhLnNwbGl0IC9cXHI/XFxuL1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBmaWxlSW5mbyA9XG4gICAgICAgICAgICAgICAgbGluZXM6IGxpbmVzLmxlbmd0aFxuICAgICAgICAgICAgICAgIGZ1bmNzOiBbXVxuICAgICAgICAgICAgICAgIGNsYXNzZXM6IFtdXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBmdW5jQWRkZWQgPSBmYWxzZVxuICAgICAgICAgICAgZnVuY1N0YWNrID0gW11cbiAgICAgICAgICAgIGN1cnJlbnRDbGFzcyA9IG51bGxcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgaXNIcHAgb3IgaXNDcHBcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpbmRleEhwcCA9IG5ldyBJbmRleEhwcFxuICAgICAgICAgICAgICAgIHBhcnNlZCA9IGluZGV4SHBwLnBhcnNlIGRhdGFcbiAgICAgICAgICAgICAgICBmdW5jQWRkZWQgPSBub3QgZW1wdHkocGFyc2VkLmNsYXNzZXMpIG9yIG5vdCBlbXB0eShwYXJzZWQuZnVuY3MpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZm9yIGNsc3MgaW4gcGFyc2VkLmNsYXNzZXNcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIF8uc2V0IEBjbGFzc2VzLCBcIiN7Y2xzcy5uYW1lfS5maWxlXCIsIGZpbGVcbiAgICAgICAgICAgICAgICAgICAgXy5zZXQgQGNsYXNzZXMsIFwiI3tjbHNzLm5hbWV9LmxpbmVcIiwgY2xzcy5saW5lKzFcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGZpbGVJbmZvLmNsYXNzZXMucHVzaCBcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGNsc3MubmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgbGluZTogY2xzcy5saW5lKzFcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGZvciBmdW5jIGluIHBhcnNlZC5mdW5jc1xuICAgICAgICAgICAgICAgICAgICBmdW5jSW5mbyA9IEBhZGRNZXRob2QgZnVuYy5jbGFzcywgZnVuYy5tZXRob2QsIGZpbGUsIGZ1bmMubGluZVxuICAgICAgICAgICAgICAgICAgICBmaWxlSW5mby5mdW5jcy5wdXNoIGZ1bmNJbmZvXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGZvciBsaSBpbiBbMC4uLmxpbmVzLmxlbmd0aF1cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGxpbmUgPSBsaW5lc1tsaV1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgbGluZS50cmltKCkubGVuZ3RoICMgaWdub3JpbmcgZW1wdHkgbGluZXNcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZW50ID0gbGluZS5zZWFyY2ggL1xcUy9cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIGZ1bmNTdGFjay5sZW5ndGggYW5kIGluZGVudCA8PSBfLmxhc3QoZnVuY1N0YWNrKVswXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF8ubGFzdChmdW5jU3RhY2spWzFdLmxhc3QgPSBsaSAtIDFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jSW5mbyA9IGZ1bmNTdGFjay5wb3AoKVsxXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmNJbmZvLmNsYXNzID89IHNsYXNoLmJhc2UgZmlsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVJbmZvLmZ1bmNzLnB1c2ggZnVuY0luZm8gXG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBjdXJyZW50Q2xhc3M/IFxuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgMDAwMDAwMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgMDAwIDAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwXG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgbWV0aG9kTmFtZSA9IEluZGV4ZXIubWV0aG9kTmFtZUluTGluZSBsaW5lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmNJbmZvID0gQGFkZE1ldGhvZCBjdXJyZW50Q2xhc3MsIG1ldGhvZE5hbWUsIGZpbGUsIGxpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmNTdGFjay5wdXNoIFtpbmRlbnQsIGZ1bmNJbmZvXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jQWRkZWQgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgMDAwICAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwXG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudENsYXNzID0gbnVsbCBpZiBpbmRlbnQgPCAyICMgd2FzIDRcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBmdW5jTmFtZSA9IEluZGV4ZXIuZnVuY05hbWVJbkxpbmUgbGluZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jSW5mbyA9IEBhZGRGdW5jSW5mbyBmdW5jTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbmU6IGxpKzFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGU6IGZpbGVcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY1N0YWNrLnB1c2ggW2luZGVudCwgZnVuY0luZm9dXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmNBZGRlZCA9IHRydWVcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgZnVuY05hbWUgPSBJbmRleGVyLnBvc3ROYW1lSW5MaW5lIGxpbmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY0luZm8gPSBAYWRkRnVuY0luZm8gZnVuY05hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5lOiBsaSsxXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlOiBmaWxlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3N0OiB0cnVlXG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmNTdGFjay5wdXNoIFtpbmRlbnQsIGZ1bmNJbmZvXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jQWRkZWQgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0gPSBsaW5lLm1hdGNoIEluZGV4ZXIudGVzdFJlZ0V4cFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIG0/WzJdP1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jSW5mbyA9IEBhZGRGdW5jSW5mbyBtWzJdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGluZTogbGkrMVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZTogZmlsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVzdDogbVsxXVxuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jU3RhY2sucHVzaCBbaW5kZW50LCBmdW5jSW5mb11cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY0FkZGVkID0gdHJ1ZVxuICAgIFxuICAgICAgICAgICAgICAgICAgICB3b3JkcyA9IGxpbmUuc3BsaXQgSW5kZXhlci5zcGxpdFJlZ0V4cFxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgZm9yIHdvcmQgaW4gd29yZHNcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgSW5kZXhlci50ZXN0V29yZCB3b3JkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXy51cGRhdGUgQHdvcmRzLCBcIiN7d29yZH0uY291bnRcIiwgKG4pIC0+IChuID8gMCkgKyAxXG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggd29yZFxuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgIDAwMDAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoZW4gJ2NsYXNzJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgY2xhc3NOYW1lID0gSW5kZXhlci5jbGFzc05hbWVJbkxpbmUgbGluZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudENsYXNzID0gY2xhc3NOYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfLnNldCBAY2xhc3NlcywgXCIje2NsYXNzTmFtZX0uZmlsZVwiLCBmaWxlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfLnNldCBAY2xhc3NlcywgXCIje2NsYXNzTmFtZX0ubGluZVwiLCBsaSsxXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVJbmZvLmNsYXNzZXMucHVzaCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBjbGFzc05hbWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5lOiBsaSsxXG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwIDAwIDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwIDAwICAgMDAwMDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoZW4gJ3JlcXVpcmUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtID0gbGluZS5tYXRjaCBJbmRleGVyLnJlcXVpcmVSZWdFeHBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgbT9bMV0/IGFuZCBtWzJdP1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgciA9IGZpbGVJbmZvLnJlcXVpcmUgPyBbXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgci5wdXNoIFttWzFdLCBtWzJdXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZUluZm8ucmVxdWlyZSA9IHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFic3BhdGggPSBzbGFzaC5yZXNvbHZlIHNsYXNoLmpvaW4gc2xhc2guZGlyKGZpbGUpLCBtWzJdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhYnNwYXRoICs9ICcuY29mZmVlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1bMl1bMF0gPT0gJy4nKSBhbmQgKG5vdCBAZmlsZXNbYWJzcGF0aF0/KSBhbmQgKEBxdWV1ZS5pbmRleE9mKGFic3BhdGgpIDwgMClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBzbGFzaC5pc0ZpbGUgYWJzcGF0aFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBAcXVldWUucHVzaCBhYnNwYXRoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgZnVuY0FkZGVkXG5cbiAgICAgICAgICAgICAgICB3aGlsZSBmdW5jU3RhY2subGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgIF8ubGFzdChmdW5jU3RhY2spWzFdLmxhc3QgPSBsaSAtIDFcbiAgICAgICAgICAgICAgICAgICAgZnVuY0luZm8gPSBmdW5jU3RhY2sucG9wKClbMV1cbiAgICAgICAgICAgICAgICAgICAgZnVuY0luZm8uY2xhc3MgPz0gc2xhc2guYmFzZSBmdW5jSW5mby5maWxlXG4gICAgICAgICAgICAgICAgICAgIGZ1bmNJbmZvLmNsYXNzID89IHNsYXNoLmJhc2UgZmlsZVxuICAgICAgICAgICAgICAgICAgICBmaWxlSW5mby5mdW5jcy5wdXNoIGZ1bmNJbmZvXG5cbiAgICAgICAgICAgICAgICBpZiBvcHQ/LnBvc3QgIT0gZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgcG9zdC50b1dpbnMgJ2NsYXNzZXNDb3VudCcsIF8uc2l6ZSBAY2xhc3Nlc1xuICAgICAgICAgICAgICAgICAgICBwb3N0LnRvV2lucyAnZnVuY3NDb3VudCcsICAgXy5zaXplIEBmdW5jc1xuICAgICAgICAgICAgICAgICAgICBwb3N0LnRvV2lucyAnZmlsZUluZGV4ZWQnLCAgZmlsZSwgZmlsZUluZm9cblxuICAgICAgICAgICAgQGZpbGVzW2ZpbGVdID0gZmlsZUluZm9cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgb3B0Py5wb3N0ICE9IGZhbHNlXG4gICAgICAgICAgICAgICAgcG9zdC50b1dpbnMgJ2ZpbGVzQ291bnQnLCBfLnNpemUgQGZpbGVzXG5cbiAgICAgICAgICAgIEBzaGlmdFF1ZXVlKClcbiAgICAgICAgQFxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgMDAwMDAwICAgICAgIDAwMCAgICAgXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICBcbiAgICBcbiAgICBzaGlmdFF1ZXVlOiA9PlxuICAgICAgICBcbiAgICAgICAgaWYgQHF1ZXVlLmxlbmd0aFxuICAgICAgICAgICAgZmlsZSA9IEBxdWV1ZS5zaGlmdCgpXG4gICAgICAgICAgICBAaW5kZXhGaWxlIGZpbGVcblxubW9kdWxlLmV4cG9ydHMgPSBJbmRleGVyXG4iXX0=
//# sourceURL=../../coffee/main/indexer.coffee