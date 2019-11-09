// koffee 1.4.0

/*
000  000   000  0000000    00000000  000   000  00000000  00000000
000  0000  000  000   000  000        000 000   000       000   000
000  000 0 000  000   000  0000000     00000    0000000   0000000
000  000  0000  000   000  000        000 000   000       000   000
000  000   000  0000000    00000000  000   000  00000000  000   000
 */
var IndexHpp, Indexer, Walker, _, empty, filter, forkfunc, fs, kerror, matchr, post, ref, slash, valid,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    slice = [].slice,
    indexOf = [].indexOf;

ref = require('kxk'), post = ref.post, matchr = ref.matchr, filter = ref.filter, empty = ref.empty, slash = ref.slash, valid = ref.valid, fs = ref.fs, kerror = ref.kerror, _ = ref._;

Walker = require('../tools/walker');

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXhlci5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsa0dBQUE7SUFBQTs7OztBQVFBLE1BQStELE9BQUEsQ0FBUSxLQUFSLENBQS9ELEVBQUUsZUFBRixFQUFRLG1CQUFSLEVBQWdCLG1CQUFoQixFQUF3QixpQkFBeEIsRUFBK0IsaUJBQS9CLEVBQXNDLGlCQUF0QyxFQUE2QyxXQUE3QyxFQUFpRCxtQkFBakQsRUFBeUQ7O0FBRXpELE1BQUEsR0FBVyxPQUFBLENBQVEsaUJBQVI7O0FBQ1gsUUFBQSxHQUFXLE9BQUEsQ0FBUSxtQkFBUjs7QUFDWCxRQUFBLEdBQVcsT0FBQSxDQUFRLFlBQVI7O0FBRUw7SUFFRixPQUFDLENBQUEsYUFBRCxHQUFtQjs7SUFDbkIsT0FBQyxDQUFBLGFBQUQsR0FBbUI7O0lBRW5CLE9BQUMsQ0FBQSxZQUFELEdBQW1COztJQUVuQixPQUFDLENBQUEsVUFBRCxHQUFtQjs7SUFDbkIsT0FBQyxDQUFBLFVBQUQsR0FBbUI7O0lBQ25CLE9BQUMsQ0FBQSxVQUFELEdBQW1COztJQUNuQixPQUFDLENBQUEsV0FBRCxHQUFtQixJQUFJLE1BQUosQ0FBVyxlQUFYLEVBQTRCLEdBQTVCOztJQUNuQixPQUFDLENBQUEsV0FBRCxHQUFtQjs7SUFFbkIsT0FBQyxDQUFBLGVBQUQsR0FBa0IsU0FBQyxJQUFEO0FBRWQsWUFBQTtRQUFBLENBQUEsR0FBSSxJQUFJLENBQUMsS0FBTCxDQUFXLE9BQU8sQ0FBQyxXQUFuQjsyQkFDSixDQUFHLENBQUEsQ0FBQTtJQUhXOztJQUtsQixPQUFDLENBQUEsZ0JBQUQsR0FBbUIsU0FBQyxJQUFEO0FBRWYsWUFBQTtRQUFBLENBQUEsR0FBSSxJQUFJLENBQUMsS0FBTCxDQUFXLE9BQU8sQ0FBQyxZQUFuQjtRQUNKLElBQUcsU0FBSDtZQUNJLEdBQUEsR0FBTSxNQUFNLENBQUMsTUFBUCxDQUFjLE9BQU8sQ0FB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QUEsQ0FBMUI7ZUFtS0E7SUFuTE87O3NCQTJMWCxVQUFBLEdBQVksU0FBQTtBQUVSLFlBQUE7UUFBQSxJQUFHLElBQUMsQ0FBQSxLQUFLLENBQUMsTUFBVjtZQUNJLElBQUEsR0FBTyxJQUFDLENBQUEsS0FBSyxDQUFDLEtBQVAsQ0FBQTttQkFDUCxJQUFDLENBQUEsU0FBRCxDQUFXLElBQVgsRUFGSjs7SUFGUTs7Ozs7O0FBTWhCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDBcbjAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDBcbjAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgIDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwXG4wMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgMDAwXG4wMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwXG4jIyNcblxueyBwb3N0LCBtYXRjaHIsIGZpbHRlciwgZW1wdHksIHNsYXNoLCB2YWxpZCwgZnMsIGtlcnJvciwgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5XYWxrZXIgICA9IHJlcXVpcmUgJy4uL3Rvb2xzL3dhbGtlcidcbmZvcmtmdW5jID0gcmVxdWlyZSAnLi4vdG9vbHMvZm9ya2Z1bmMnXG5JbmRleEhwcCA9IHJlcXVpcmUgJy4vaW5kZXhocHAnXG5cbmNsYXNzIEluZGV4ZXJcblxuICAgIEByZXF1aXJlUmVnRXhwICAgPSAvXlxccyooW1xcd1xce1xcfV0rKVxccys9XFxzK3JlcXVpcmVcXHMrW1xcJ1xcXCJdKFtcXC5cXC9cXHddKylbXFwnXFxcIl0vXG4gICAgQGluY2x1ZGVSZWdFeHAgICA9IC9eI2luY2x1ZGVcXHMrW1xcXCJcXDxdKFtcXC5cXC9cXHddKylbXFxcIlxcPl0vXG4gICAgIyBAbWV0aG9kUmVnRXhwICAgID0gL15cXHMrKFtcXEBdP1xcdyspXFxzKlxcOlxccyooXFwoLipcXCkpP1xccypbPS1dXFw+L1xuICAgIEBtZXRob2RSZWdFeHAgICAgPSAvXlxccysoW1xcQF0/XFx3K3xAKVxccypcXDpcXHMqKFxcKC4qXFwpKT9cXHMqWz0tXVxcPi9cbiAgICAjIEBmdW5jUmVnRXhwICAgICAgPSAvXlxccyooW1xcd1xcLl0rKVxccypbXFw6XFw9XVxccyooXFwoLipcXCkpP1xccypbPS1dXFw+L1xuICAgIEBmdW5jUmVnRXhwICAgICAgPSAvXlxccyooW1xcd1xcLl0rKVxccypbXFw6XFw9XVteXFwoXFwpXSooXFwoLipcXCkpP1xccypbPS1dXFw+L1xuICAgIEBwb3N0UmVnRXhwICAgICAgPSAvXlxccypwb3N0XFwub25cXHMrW1xcJ1xcXCJdKFxcdyspW1xcJ1xcXCJdXFxzKlxcLD9cXHMqKFxcKC4qXFwpKT9cXHMqWz0tXVxcPi9cbiAgICBAdGVzdFJlZ0V4cCAgICAgID0gL15cXHMqKGRlc2NyaWJlfGl0KVxccytbXFwnXFxcIl0oLispW1xcJ1xcXCJdXFxzKlxcLD9cXHMqKFxcKFteXFwpXSpcXCkpP1xccypbPS1dXFw+L1xuICAgIEBzcGxpdFJlZ0V4cCAgICAgPSBuZXcgUmVnRXhwIFwiW15cXFxcd1xcXFxkXFxcXF9dK1wiLCAnZydcbiAgICBAY2xhc3NSZWdFeHAgICAgID0gL14oXFxzKlxcUytcXHMqPSk/XFxzKmNsYXNzXFxzKyhcXHcrKS9cblxuICAgIEBjbGFzc05hbWVJbkxpbmU6IChsaW5lKSAtPlxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgbSA9IGxpbmUubWF0Y2ggSW5kZXhlci5jbGFzc1JlZ0V4cFxuICAgICAgICBtP1syXVxuICAgICAgICBcbiAgICBAbWV0aG9kTmFtZUluTGluZTogKGxpbmUpIC0+XG4gICAgICAgIFxuICAgICAgICBtID0gbGluZS5tYXRjaCBJbmRleGVyLm1ldGhvZFJlZ0V4cFxuICAgICAgICBpZiBtP1xuICAgICAgICAgICAgcmdzID0gbWF0Y2hyLnJhbmdlcyBJbmRleGVyLm1ldGhvZFJlZ0V4cCwgbGluZVxuICAgICAgICAgICAgaWYgcmdzWzBdLnN0YXJ0ID4gMTFcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgICBtP1sxXVxuICAgICAgICBcbiAgICBAZnVuY05hbWVJbkxpbmU6IChsaW5lKSAtPlxuXG4gICAgICAgIGlmIG0gPSBsaW5lLm1hdGNoIEluZGV4ZXIuZnVuY1JlZ0V4cFxuICAgICAgICAgICAgcmdzID0gbWF0Y2hyLnJhbmdlcyBJbmRleGVyLmZ1bmNSZWdFeHAsIGxpbmVcbiAgICAgICAgICAgIGlmIHJnc1swXS5zdGFydCA+IDdcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgICAgICAgXG4gICAgICAgIG0/WzFdXG5cbiAgICBAcG9zdE5hbWVJbkxpbmU6IChsaW5lKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgbSA9IGxpbmUubWF0Y2ggSW5kZXhlci5wb3N0UmVnRXhwXG4gICAgICAgICAgICByZ3MgPSBtYXRjaHIucmFuZ2VzIEluZGV4ZXIucG9zdFJlZ0V4cCwgbGluZVxuICAgICAgICBcbiAgICAgICAgbT9bMV1cbiAgICAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgICAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICBcbiAgICBcbiAgICBAdGVzdFdvcmQ6ICh3b3JkKSAtPlxuICAgICAgICBcbiAgICAgICAgc3dpdGNoXG4gICAgICAgICAgICB3aGVuIHdvcmQubGVuZ3RoIDwgMyB0aGVuIGZhbHNlICMgZXhjbHVkZSB3aGVuIHRvbyBzaG9ydFxuICAgICAgICAgICAgd2hlbiB3b3JkWzBdIGluIFsnLScsIFwiI1wiXSB0aGVuIGZhbHNlXG4gICAgICAgICAgICB3aGVuIHdvcmRbd29yZC5sZW5ndGgtMV0gPT0gJy0nIHRoZW4gZmFsc2UgXG4gICAgICAgICAgICB3aGVuIHdvcmRbMF0gPT0gJ18nIGFuZCB3b3JkLmxlbmd0aCA8IDQgdGhlbiBmYWxzZSAjIGV4Y2x1ZGUgd2hlbiBzdGFydHMgd2l0aCB1bmRlcnNjb3JlIGFuZCBpcyBzaG9ydFxuICAgICAgICAgICAgd2hlbiAvXlswXFxfXFwtXFxAXFwjXSskLy50ZXN0IHdvcmQgdGhlbiBmYWxzZSAjIGV4Y2x1ZGUgd2hlbiBjb25zaXN0IG9mIHNwZWNpYWwgY2hhcmFjdGVycyBvbmx5XG4gICAgICAgICAgICB3aGVuIC9cXGQvLnRlc3Qgd29yZCB0aGVuIGZhbHNlICMgZXhjbHVkZSB3aGVuIHdvcmQgY29udGFpbnMgbnVtYmVyXG4gICAgICAgICAgICBlbHNlIHRydWVcbiAgICAgICAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgIEA6ICgpIC0+XG4gICAgICAgIFxuICAgICAgICBwb3N0Lm9uR2V0ICdpbmRleGVyJyBAb25HZXRcbiAgICAgICAgcG9zdC5vbiAnc291cmNlSW5mb0ZvckZpbGUnIEBvblNvdXJjZUluZm9Gb3JGaWxlXG4gICAgICAgIFxuICAgICAgICBwb3N0Lm9uICdmaWxlU2F2ZWQnICAgIChmaWxlLCB3aW5JRCkgPT4gQGluZGV4RmlsZSBmaWxlLCByZWZyZXNoOiB0cnVlXG4gICAgICAgIHBvc3Qub24gJ2RpckxvYWRlZCcgICAgKGRpcikgICAgICAgICA9PiBAaW5kZXhQcm9qZWN0IGRpclxuICAgICAgICBwb3N0Lm9uICdmaWxlTG9hZGVkJyAgIChmaWxlLCB3aW5JRCkgPT4gXG4gICAgICAgICAgICBAaW5kZXhGaWxlIGZpbGVcbiAgICAgICAgICAgIEBpbmRleFByb2plY3QgZmlsZVxuICAgICAgICBcbiAgICAgICAgQGNvbGxlY3RCaW5zKClcbiAgICBcbiAgICAgICAgQGltYWdlRXh0ZW5zaW9ucyA9IFsncG5nJyAnanBnJyAnZ2lmJyAndGlmZicgJ3B4bScgJ2ljbnMnXSAgICAgICAgXG5cbiAgICAgICAgQGRpcnMgICAgPSBPYmplY3QuY3JlYXRlIG51bGxcbiAgICAgICAgQGZpbGVzICAgPSBPYmplY3QuY3JlYXRlIG51bGxcbiAgICAgICAgQGNsYXNzZXMgPSBPYmplY3QuY3JlYXRlIG51bGxcbiAgICAgICAgQGZ1bmNzICAgPSBPYmplY3QuY3JlYXRlIG51bGxcbiAgICAgICAgQHdvcmRzICAgPSBPYmplY3QuY3JlYXRlIG51bGxcbiAgICAgICAgQHdhbGtlciAgPSBudWxsXG4gICAgICAgIEBxdWV1ZSAgID0gW11cbiAgICAgICAgXG4gICAgICAgIEBpbmRleGVkUHJvamVjdHMgPSBbXVxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIG9uR2V0OiAoa2V5LCBmaWx0ZXIuLi4pID0+XG4gICAgICAgIFxuICAgICAgICBzd2l0Y2gga2V5XG4gICAgICAgICAgICB3aGVuICdjb3VudHMnXG4gICAgICAgICAgICAgICAgcmV0dXJuIFxuICAgICAgICAgICAgICAgICAgICBjbGFzc2VzOiBAY2xhc3Nlcy5sZW5ndGggPyAwXG4gICAgICAgICAgICAgICAgICAgIGZpbGVzOiAgIEBmaWxlcy5sZW5ndGggPyAwXG4gICAgICAgICAgICAgICAgICAgIGZ1bmNzOiAgIEBmdW5jcy5sZW5ndGggPyAwXG4gICAgICAgICAgICAgICAgICAgIHdvcmRzOiAgIEB3b3Jkcy5sZW5ndGggPyAwXG4gICAgICAgICAgICAgICAgICAgIGRpcnM6ICAgIEBkaXJzLmxlbmd0aCA/IDBcbiAgICAgICAgICAgIHdoZW4gJ2ZpbGUnXG4gICAgICAgICAgICAgICAgcmV0dXJuIEBmaWxlc1tmaWx0ZXJbMF1dXG4gICAgICAgICAgICB3aGVuICdwcm9qZWN0J1xuICAgICAgICAgICAgICAgIHJldHVybiBAcHJvamVjdEluZm8gZmlsdGVyWzBdXG4gICAgICAgIFxuICAgICAgICB2YWx1ZSA9IEBba2V5XVxuICAgICAgICBpZiBub3QgZW1wdHkgZmlsdGVyXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIG5hbWVzID0gXy5maWx0ZXIgZmlsdGVyLCAoYykgLT4gbm90IGVtcHR5IGNcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgbm90IGVtcHR5IG5hbWVzXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgbmFtZXMgPSBuYW1lcy5tYXAgKGMpIC0+IGM/LnRvTG93ZXJDYXNlKClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IF8ucGlja0J5IHZhbHVlLCAodmFsdWUsIGtleSkgLT5cbiAgICAgICAgICAgICAgICAgICAgZm9yIGNuIGluIG5hbWVzXG4gICAgICAgICAgICAgICAgICAgICAgICBsYyA9IGtleS50b0xvd2VyQ2FzZSgpXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBjbi5sZW5ndGg+MSBhbmQgbGMuaW5kZXhPZihjbik+PTAgb3IgbGMuc3RhcnRzV2l0aChjbilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICB2YWx1ZVxuICAgICAgICBcbiAgICBvblNvdXJjZUluZm9Gb3JGaWxlOiAob3B0KSA9PlxuICAgICAgICBcbiAgICAgICAgZmlsZSA9IG9wdC5pdGVtLmZpbGVcbiAgICAgICAgaWYgQGZpbGVzW2ZpbGVdP1xuICAgICAgICAgICAgcG9zdC50b1dpbiBvcHQud2luSUQsICdzb3VyY2VJbmZvRm9yRmlsZScgQGZpbGVzW2ZpbGVdLCBvcHRcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgY29sbGVjdEJpbnM6IC0+XG4gICAgICAgIFxuICAgICAgICBAYmlucyA9IFtdXG4gICAgICAgIHJldHVybiBpZiBzbGFzaC53aW4oKVxuICAgICAgICBcbiAgICAgICAgZm9yIGRpciBpbiBbJy9iaW4nICcvdXNyL2JpbicgJy91c3IvbG9jYWwvYmluJ11cbiAgICAgICAgICAgIHcgPSBuZXcgV2Fsa2VyXG4gICAgICAgICAgICAgICAgbWF4RmlsZXM6ICAgIDEwMDBcbiAgICAgICAgICAgICAgICByb290OiAgICAgICAgZGlyXG4gICAgICAgICAgICAgICAgaW5jbHVkZURpcnM6IGZhbHNlXG4gICAgICAgICAgICAgICAgaW5jbHVkZUV4dDogIFsnJ10gIyByZXBvcnQgZmlsZXMgd2l0aG91dCBleHRlbnNpb25cbiAgICAgICAgICAgICAgICBmaWxlOiAgICAgICAgKHApID0+IEBiaW5zLnB1c2ggc2xhc2guYmFzZW5hbWUgcFxuICAgICAgICAgICAgdy5zdGFydCgpXG5cbiAgICBjb2xsZWN0UHJvamVjdHM6IC0+XG5cbiAgICAgICAgQHByb2plY3RzID0ge31cbiAgICAgICAgdyA9IG5ldyBXYWxrZXJcbiAgICAgICAgICAgIG1heEZpbGVzOiAgICA1MDAwXG4gICAgICAgICAgICBtYXhEZXB0aDogICAgM1xuICAgICAgICAgICAgcm9vdDogICAgICAgIHNsYXNoLnJlc29sdmUgJ34nXG4gICAgICAgICAgICBpbmNsdWRlOiAgICAgWycuZ2l0J11cbiAgICAgICAgICAgIGlnbm9yZTogICAgICBbJ25vZGVfbW9kdWxlcycgJ2ltZycgJ2JpbicgJ2pzJyAnTGlicmFyeSddXG4gICAgICAgICAgICBza2lwRGlyOiAgICAgKHApIC0+IHNsYXNoLmJhc2UocCkgPT0gJy5naXQnXG4gICAgICAgICAgICBmaWx0ZXI6ICAgICAgKHApIC0+IHNsYXNoLmV4dChwKSBub3QgaW4gWydub29uJyAnanNvbicgJ2dpdCcgJyddXG4gICAgICAgICAgICBkaXI6ICAgICAgICAgKHApID0+IGlmIHNsYXNoLmZpbGUocCkgPT0gJy5naXQnICAgIHRoZW4gQHByb2plY3RzW3NsYXNoLmJhc2Ugc2xhc2guZGlyIHBdID0gZGlyOiBzbGFzaC50aWxkZSBzbGFzaC5kaXIgcFxuICAgICAgICAgICAgZmlsZTogICAgICAgIChwKSA9PiBpZiBzbGFzaC5iYXNlKHApID09ICdwYWNrYWdlJyB0aGVuIEBwcm9qZWN0c1tzbGFzaC5iYXNlIHNsYXNoLmRpciBwXSA9IGRpcjogc2xhc2gudGlsZGUgc2xhc2guZGlyIHBcbiAgICAgICAgICAgIGRvbmU6ICAgICAgICA9PiBsb2cgJ2NvbGxlY3RQcm9qZWN0cyBkb25lJyBAcHJvamVjdHNcbiAgICAgICAgdy5zdGFydCgpXG5cbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAgICAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAgICAgICAwMDAgIDAwMDAwMDAgICAwMDAgICAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgcHJvamVjdEluZm86IChwYXRoKSAtPlxuICAgICAgICBcbiAgICAgICAgZm9yIHByb2plY3QgaW4gQGluZGV4ZWRQcm9qZWN0c1xuICAgICAgICAgICAgaWYgc2xhc2guc2FtZVBhdGgocHJvamVjdC5kaXIsIHBhdGgpIG9yIHBhdGguc3RhcnRzV2l0aCBwcm9qZWN0LmRpciArICcvJ1xuICAgICAgICAgICAgICAgIHJldHVybiBwcm9qZWN0XG4gICAgICAgIHt9XG4gICAgXG4gICAgaW5kZXhQcm9qZWN0OiAoZmlsZSkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBjdXJyZW50bHlJbmRleGluZ1xuICAgICAgICAgICAgQGluZGV4UXVldWUgPz0gW11cbiAgICAgICAgICAgIGlmIGZpbGUgbm90IGluIEBpbmRleFF1ZXVlXG4gICAgICAgICAgICAgICAgQGluZGV4UXVldWUucHVzaCBmaWxlXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIGZpbGUgPSBzbGFzaC5yZXNvbHZlIGZpbGUgXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgdmFsaWQgQHByb2plY3RJbmZvIGZpbGVcbiAgICAgICAgICAgICAgXG4gICAgICAgIEBjdXJyZW50bHlJbmRleGluZyA9IGZpbGVcbiAgICAgICAgXG4gICAgICAgIGZvcmtmdW5jIFwiI3tfX2Rpcm5hbWV9L2luZGV4cHJqXCIsIGZpbGUsIChlcnIsIGluZm8pID0+XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiBrZXJyb3IgJ2luZGV4aW5nIGZhaWxlZCcsIGVyciBpZiB2YWxpZCBlcnJcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZGVsZXRlIEBjdXJyZW50bHlJbmRleGluZ1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBpbmZvXG4gICAgICAgICAgICAgICAgQGluZGV4ZWRQcm9qZWN0cy5wdXNoIGluZm8gXG4gICAgICAgICAgICAgICAgcG9zdC50b1dpbnMgJ3Byb2plY3RJbmRleGVkJywgaW5mb1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBkb1NoaWZ0ID0gZW1wdHkgQHF1ZXVlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIHZhbGlkIGluZm8uZmlsZXNcbiAgICAgICAgICAgICAgICBAcXVldWUgPSBAcXVldWUuY29uY2F0IGluZm8uZmlsZXNcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIHZhbGlkIEBpbmRleFF1ZXVlXG4gICAgICAgICAgICAgICAgQGluZGV4UHJvamVjdCBAaW5kZXhRdWV1ZS5zaGlmdCgpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBAc2hpZnRRdWV1ZSgpIGlmIGRvU2hpZnRcbiAgICAgICAgICAgICAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgICAgIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgMDAwICAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgMDAwMDAgICAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwIDAwMCAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgICAgIDAwMDAwMDAgICAgMDAwICAwMDAgICAwMDBcblxuICAgIGluZGV4RGlyOiAoZGlyKSAtPlxuXG4gICAgICAgIHJldHVybiBpZiBub3QgZGlyPyBvciBAZGlyc1tkaXJdP1xuICAgICAgICBcbiAgICAgICAgQGRpcnNbZGlyXSA9XG4gICAgICAgICAgICBuYW1lOiBzbGFzaC5iYXNlbmFtZSBkaXJcblxuICAgICAgICB3b3B0ID1cbiAgICAgICAgICAgIHJvb3Q6ICAgICAgICBkaXJcbiAgICAgICAgICAgIGluY2x1ZGVEaXI6ICBkaXJcbiAgICAgICAgICAgIGluY2x1ZGVEaXJzOiB0cnVlXG4gICAgICAgICAgICBkaXI6ICAgICAgICAgQG9uV2Fsa2VyRGlyXG4gICAgICAgICAgICBmaWxlOiAgICAgICAgQG9uV2Fsa2VyRmlsZVxuICAgICAgICAgICAgbWF4RGVwdGg6ICAgIDEyXG4gICAgICAgICAgICBtYXhGaWxlczogICAgMTAwMDAwXG4gICAgICAgICAgICBkb25lOiAgICAgICAgKHcpID0+IFxuICAgICAgICAgICAgICAgIEBzaGlmdFF1ZXVlXG5cbiAgICAgICAgQHdhbGtlciA9IG5ldyBXYWxrZXIgd29wdFxuICAgICAgICBAd2Fsa2VyLmNmZy5pZ25vcmUucHVzaCAnanMnXG4gICAgICAgIEB3YWxrZXIuc3RhcnQoKVxuXG4gICAgb25XYWxrZXJEaXI6IChwLCBzdGF0KSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgbm90IEBkaXJzW3BdP1xuICAgICAgICAgICAgQGRpcnNbcF0gPVxuICAgICAgICAgICAgICAgIG5hbWU6IHNsYXNoLmJhc2VuYW1lIHBcblxuICAgIG9uV2Fsa2VyRmlsZTogKHAsIHN0YXQpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBub3QgQGZpbGVzW3BdPyBhbmQgQHF1ZXVlLmluZGV4T2YocCkgPCAwXG4gICAgICAgICAgICBpZiBzdGF0LnNpemUgPCA2NTQzMjEgIyBvYnZpb3VzbHkgc29tZSBhcmJpdHJhcnkgbnVtYmVyIDopXG4gICAgICAgICAgICAgICAgQHF1ZXVlLnB1c2ggcFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGxvZyBcIndhcm5pbmchIGZpbGUgI3twfSB0b28gbGFyZ2U/ICN7c3RhdC5zaXplfS4gc2tpcHBpbmcgaW5kZXhpbmchXCJcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgIDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAgICAgIDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIFxuXG4gICAgYWRkRnVuY0luZm86IChmdW5jTmFtZSwgZnVuY0luZm8pIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBmdW5jTmFtZS5sZW5ndGggPiAxIGFuZCBmdW5jTmFtZS5zdGFydHNXaXRoICdAJ1xuICAgICAgICAgICAgZnVuY05hbWUgPSBmdW5jTmFtZS5zbGljZSAxXG4gICAgICAgICAgICBmdW5jSW5mby5zdGF0aWMgPSB0cnVlXG4gICAgICAgICAgICBcbiAgICAgICAgZnVuY0luZm8ubmFtZSA9IGZ1bmNOYW1lXG4gICAgICAgIFxuICAgICAgICBmdW5jSW5mb3MgPSBAZnVuY3NbZnVuY05hbWVdID8gW11cbiAgICAgICAgZnVuY0luZm9zLnB1c2ggZnVuY0luZm9cbiAgICAgICAgQGZ1bmNzW2Z1bmNOYW1lXSA9IGZ1bmNJbmZvc1xuICAgICAgICBcbiAgICAgICAgZnVuY0luZm9cblxuICAgIGFkZE1ldGhvZDogKGNsYXNzTmFtZSwgZnVuY05hbWUsIGZpbGUsIGxpKSAtPlxuXG4gICAgICAgIGZ1bmNJbmZvID0gQGFkZEZ1bmNJbmZvIGZ1bmNOYW1lLFxuICAgICAgICAgICAgbGluZTogIGxpKzFcbiAgICAgICAgICAgIGZpbGU6ICBmaWxlXG4gICAgICAgICAgICBjbGFzczogY2xhc3NOYW1lXG5cbiAgICAgICAgXy5zZXQgQGNsYXNzZXMsIFwiI3tjbGFzc05hbWV9Lm1ldGhvZHMuI3tmdW5jSW5mby5uYW1lfVwiLCBmdW5jSW5mb1xuXG4gICAgICAgIGZ1bmNJbmZvXG5cbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAgICAwMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAgMDAwICAgMDAwMDAwMCAgICAgICAgIDAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAgICAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgICAgMCAgICAgIDAwMDAwMDAwICAgICAgICAwMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuXG4gICAgcmVtb3ZlRmlsZTogKGZpbGUpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IEBmaWxlc1tmaWxlXT9cbiAgICAgICAgXG4gICAgICAgIGZvciBuYW1lLGluZm9zIG9mIEBmdW5jc1xuICAgICAgICAgICAgXy5yZW1vdmUgaW5mb3MsICh2KSAtPiB2LmZpbGUgPT0gZmlsZVxuICAgICAgICAgICAgZGVsZXRlIEBmdW5jc1tuYW1lXSBpZiBub3QgaW5mb3MubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBAY2xhc3NlcyA9IF8ub21pdEJ5IEBjbGFzc2VzLCAodikgLT4gdi5maWxlID09IGZpbGVcbiAgICAgICAgXG4gICAgICAgIGRlbGV0ZSBAZmlsZXNbZmlsZV1cblxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwIDAwMCAgICAgICAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMFxuICAgICMgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgMDAwMDAgICAgICAgICAgMDAwMDAwICAgIDAwMCAgMDAwICAgICAgMDAwMDAwMFxuICAgICMgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgMDAwICAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuXG4gICAgaW5kZXhGaWxlOiAoZmlsZSwgb3B0KSAtPlxuICAgICAgICBcbiAgICAgICAgQHJlbW92ZUZpbGUgZmlsZSBpZiBvcHQ/LnJlZnJlc2hcblxuICAgICAgICBpZiBAZmlsZXNbZmlsZV0/XG4gICAgICAgICAgICByZXR1cm4gQHNoaWZ0UXVldWUoKVxuXG4gICAgICAgIGZpbGVFeHQgPSBzbGFzaC5leHQgZmlsZSBcblxuICAgICAgICBpZiBmaWxlRXh0IGluIEBpbWFnZUV4dGVuc2lvbnNcbiAgICAgICAgICAgIEBmaWxlc1tmaWxlXSA9IHt9XG4gICAgICAgICAgICByZXR1cm4gQHNoaWZ0UXVldWUoKVxuICAgICAgICAgICAgXG4gICAgICAgIGlzQ3BwID0gZmlsZUV4dCBpbiBbJ2NwcCcsICdjYyddXG4gICAgICAgIGlzSHBwID0gZmlsZUV4dCBpbiBbJ2hwcCcsICdoJyBdXG5cbiAgICAgICAgZnMucmVhZEZpbGUgZmlsZSwgJ3V0ZjgnLCAoZXJyLCBkYXRhKSA9PlxuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4ga2Vycm9yIFwiY2FuJ3QgaW5kZXggI3tmaWxlfVwiLCBlcnIgaWYgbm90IGVtcHR5IGVyclxuICAgICAgICAgICAgXG4gICAgICAgICAgICBsaW5lcyA9IGRhdGEuc3BsaXQgL1xccj9cXG4vXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZpbGVJbmZvID1cbiAgICAgICAgICAgICAgICBsaW5lczogbGluZXMubGVuZ3RoXG4gICAgICAgICAgICAgICAgZnVuY3M6IFtdXG4gICAgICAgICAgICAgICAgY2xhc3NlczogW11cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGZ1bmNBZGRlZCA9IGZhbHNlXG4gICAgICAgICAgICBmdW5jU3RhY2sgPSBbXVxuICAgICAgICAgICAgY3VycmVudENsYXNzID0gbnVsbFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBpc0hwcCBvciBpc0NwcFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGluZGV4SHBwID0gbmV3IEluZGV4SHBwXG4gICAgICAgICAgICAgICAgcGFyc2VkID0gaW5kZXhIcHAucGFyc2UgZGF0YVxuICAgICAgICAgICAgICAgIGZ1bmNBZGRlZCA9IG5vdCBlbXB0eShwYXJzZWQuY2xhc3Nlcykgb3Igbm90IGVtcHR5KHBhcnNlZC5mdW5jcylcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBmb3IgY2xzcyBpbiBwYXJzZWQuY2xhc3Nlc1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgXy5zZXQgQGNsYXNzZXMsIFwiI3tjbHNzLm5hbWV9LmZpbGVcIiwgZmlsZVxuICAgICAgICAgICAgICAgICAgICBfLnNldCBAY2xhc3NlcywgXCIje2Nsc3MubmFtZX0ubGluZVwiLCBjbHNzLmxpbmUrMVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgZmlsZUluZm8uY2xhc3Nlcy5wdXNoIFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogY2xzcy5uYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICBsaW5lOiBjbHNzLmxpbmUrMVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZm9yIGZ1bmMgaW4gcGFyc2VkLmZ1bmNzXG4gICAgICAgICAgICAgICAgICAgIGZ1bmNJbmZvID0gQGFkZE1ldGhvZCBmdW5jLmNsYXNzLCBmdW5jLm1ldGhvZCwgZmlsZSwgZnVuYy5saW5lXG4gICAgICAgICAgICAgICAgICAgIGZpbGVJbmZvLmZ1bmNzLnB1c2ggZnVuY0luZm9cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgZm9yIGxpIGluIFswLi4ubGluZXMubGVuZ3RoXVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgbGluZSA9IGxpbmVzW2xpXVxuICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiBsaW5lLnRyaW0oKS5sZW5ndGggIyBpZ25vcmluZyBlbXB0eSBsaW5lc1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRlbnQgPSBsaW5lLnNlYXJjaCAvXFxTL1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgZnVuY1N0YWNrLmxlbmd0aCBhbmQgaW5kZW50IDw9IF8ubGFzdChmdW5jU3RhY2spWzBdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXy5sYXN0KGZ1bmNTdGFjaylbMV0ubGFzdCA9IGxpIC0gMVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmNJbmZvID0gZnVuY1N0YWNrLnBvcCgpWzFdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY0luZm8uY2xhc3MgPz0gc2xhc2guYmFzZSBmaWxlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZUluZm8uZnVuY3MucHVzaCBmdW5jSW5mbyBcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIGN1cnJlbnRDbGFzcz8gXG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIyAwMCAgICAgMDAgIDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAwMDAwMDAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgMDAwMDAwMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIyAwMDAgMCAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDBcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBtZXRob2ROYW1lID0gSW5kZXhlci5tZXRob2ROYW1lSW5MaW5lIGxpbmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY0luZm8gPSBAYWRkTWV0aG9kIGN1cnJlbnRDbGFzcywgbWV0aG9kTmFtZSwgZmlsZSwgbGlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY1N0YWNrLnB1c2ggW2luZGVudCwgZnVuY0luZm9dXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmNBZGRlZCA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIyAwMDAgICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDBcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50Q2xhc3MgPSBudWxsIGlmIGluZGVudCA8IDIgIyB3YXMgNFxuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIGZ1bmNOYW1lID0gSW5kZXhlci5mdW5jTmFtZUluTGluZSBsaW5lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmNJbmZvID0gQGFkZEZ1bmNJbmZvIGZ1bmNOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGluZTogbGkrMVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZTogZmlsZVxuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jU3RhY2sucHVzaCBbaW5kZW50LCBmdW5jSW5mb11cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY0FkZGVkID0gdHJ1ZVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBmdW5jTmFtZSA9IEluZGV4ZXIucG9zdE5hbWVJbkxpbmUgbGluZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jSW5mbyA9IEBhZGRGdW5jSW5mbyBmdW5jTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbmU6IGxpKzFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGU6IGZpbGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc3Q6IHRydWVcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY1N0YWNrLnB1c2ggW2luZGVudCwgZnVuY0luZm9dXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmNBZGRlZCA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbSA9IGxpbmUubWF0Y2ggSW5kZXhlci50ZXN0UmVnRXhwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgbT9bMl0/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmNJbmZvID0gQGFkZEZ1bmNJbmZvIG1bMl0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5lOiBsaSsxXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlOiBmaWxlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXN0OiBtWzFdXG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmNTdGFjay5wdXNoIFtpbmRlbnQsIGZ1bmNJbmZvXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jQWRkZWQgPSB0cnVlXG4gICAgXG4gICAgICAgICAgICAgICAgICAgIHdvcmRzID0gbGluZS5zcGxpdCBJbmRleGVyLnNwbGl0UmVnRXhwXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBmb3Igd29yZCBpbiB3b3Jkc1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBJbmRleGVyLnRlc3RXb3JkIHdvcmRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfLnVwZGF0ZSBAd29yZHMsIFwiI3t3b3JkfS5jb3VudFwiLCAobikgLT4gKG4gPyAwKSArIDFcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIHN3aXRjaCB3b3JkXG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIyAgMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgICAgICAwMDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAjICAwMDAwMDAwICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2hlbiAnY2xhc3MnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBjbGFzc05hbWUgPSBJbmRleGVyLmNsYXNzTmFtZUluTGluZSBsaW5lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50Q2xhc3MgPSBjbGFzc05hbWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF8uc2V0IEBjbGFzc2VzLCBcIiN7Y2xhc3NOYW1lfS5maWxlXCIsIGZpbGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF8uc2V0IEBjbGFzc2VzLCBcIiN7Y2xhc3NOYW1lfS5saW5lXCIsIGxpKzFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZUluZm8uY2xhc3Nlcy5wdXNoIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGNsYXNzTmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbmU6IGxpKzFcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgMDAgMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAwMDAwICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAgMDAgICAwMDAwMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2hlbiAncmVxdWlyZSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0gPSBsaW5lLm1hdGNoIEluZGV4ZXIucmVxdWlyZVJlZ0V4cFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBtP1sxXT8gYW5kIG1bMl0/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByID0gZmlsZUluZm8ucmVxdWlyZSA/IFtdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByLnB1c2ggW21bMV0sIG1bMl1dXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlSW5mby5yZXF1aXJlID0gclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWJzcGF0aCA9IHNsYXNoLnJlc29sdmUgc2xhc2guam9pbiBzbGFzaC5kaXIoZmlsZSksIG1bMl1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFic3BhdGggKz0gJy5jb2ZmZWUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobVsyXVswXSA9PSAnLicpIGFuZCAobm90IEBmaWxlc1thYnNwYXRoXT8pIGFuZCAoQHF1ZXVlLmluZGV4T2YoYWJzcGF0aCkgPCAwKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIHNsYXNoLmlzRmlsZSBhYnNwYXRoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBxdWV1ZS5wdXNoIGFic3BhdGhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBmdW5jQWRkZWRcblxuICAgICAgICAgICAgICAgIHdoaWxlIGZ1bmNTdGFjay5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgXy5sYXN0KGZ1bmNTdGFjaylbMV0ubGFzdCA9IGxpIC0gMVxuICAgICAgICAgICAgICAgICAgICBmdW5jSW5mbyA9IGZ1bmNTdGFjay5wb3AoKVsxXVxuICAgICAgICAgICAgICAgICAgICBmdW5jSW5mby5jbGFzcyA/PSBzbGFzaC5iYXNlIGZ1bmNJbmZvLmZpbGVcbiAgICAgICAgICAgICAgICAgICAgZnVuY0luZm8uY2xhc3MgPz0gc2xhc2guYmFzZSBmaWxlXG4gICAgICAgICAgICAgICAgICAgIGZpbGVJbmZvLmZ1bmNzLnB1c2ggZnVuY0luZm9cblxuICAgICAgICAgICAgICAgIGlmIG9wdD8ucG9zdCAhPSBmYWxzZVxuICAgICAgICAgICAgICAgICAgICBwb3N0LnRvV2lucyAnY2xhc3Nlc0NvdW50JyBfLnNpemUgQGNsYXNzZXNcbiAgICAgICAgICAgICAgICAgICAgcG9zdC50b1dpbnMgJ2Z1bmNzQ291bnQnICAgXy5zaXplIEBmdW5jc1xuICAgICAgICAgICAgICAgICAgICBwb3N0LnRvV2lucyAnZmlsZUluZGV4ZWQnICBmaWxlLCBmaWxlSW5mb1xuXG4gICAgICAgICAgICBAZmlsZXNbZmlsZV0gPSBmaWxlSW5mb1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBvcHQ/LnBvc3QgIT0gZmFsc2VcbiAgICAgICAgICAgICAgICBwb3N0LnRvV2lucyAnZmlsZXNDb3VudCcgXy5zaXplIEBmaWxlc1xuXG4gICAgICAgICAgICBAc2hpZnRRdWV1ZSgpXG4gICAgICAgIEBcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgIDAwMDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgc2hpZnRRdWV1ZTogPT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBxdWV1ZS5sZW5ndGhcbiAgICAgICAgICAgIGZpbGUgPSBAcXVldWUuc2hpZnQoKVxuICAgICAgICAgICAgQGluZGV4RmlsZSBmaWxlXG5cbm1vZHVsZS5leHBvcnRzID0gSW5kZXhlclxuIl19
//# sourceURL=../../coffee/main/indexer.coffee