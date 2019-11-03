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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXhlci5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsa0dBQUE7SUFBQTs7OztBQVFBLE1BQStELE9BQUEsQ0FBUSxLQUFSLENBQS9ELEVBQUUsZUFBRixFQUFRLG1CQUFSLEVBQWdCLG1CQUFoQixFQUF3QixpQkFBeEIsRUFBK0IsaUJBQS9CLEVBQXNDLGlCQUF0QyxFQUE2QyxXQUE3QyxFQUFpRCxtQkFBakQsRUFBeUQ7O0FBRXpELE1BQUEsR0FBVyxPQUFBLENBQVEsaUJBQVI7O0FBQ1gsUUFBQSxHQUFXLE9BQUEsQ0FBUSxtQkFBUjs7QUFDWCxRQUFBLEdBQVcsT0FBQSxDQUFRLFlBQVI7O0FBRUw7SUFFRixPQUFDLENBQUEsYUFBRCxHQUFtQjs7SUFDbkIsT0FBQyxDQUFBLGFBQUQsR0FBbUI7O0lBRW5CLE9BQUMsQ0FBQSxZQUFELEdBQW1COztJQUVuQixPQUFDLENBQUEsVUFBRCxHQUFtQjs7SUFDbkIsT0FBQyxDQUFBLFVBQUQsR0FBbUI7O0lBQ25CLE9BQUMsQ0FBQSxVQUFELEdBQW1COztJQUNuQixPQUFDLENBQUEsV0FBRCxHQUFtQixJQUFJLE1BQUosQ0FBVyxlQUFYLEVBQTRCLEdBQTVCOztJQUNuQixPQUFDLENBQUEsV0FBRCxHQUFtQjs7SUFFbkIsT0FBQyxDQUFBLGVBQUQsR0FBa0IsU0FBQyxJQUFEO0FBRWQsWUFBQTtRQUFBLENBQUEsR0FBSSxJQUFJLENBQUMsS0FBTCxDQUFXLE9BQU8sQ0FBQyxXQUFuQjsyQkFDSixDQUFHLENBQUEsQ0FBQTtJQUhXOztJQUtsQixPQUFDLENBQUEsZ0JBQUQsR0FBbUIsU0FBQyxJQUFEO0FBRWYsWUFBQTtRQUFBLENBQUEsR0FBSSxJQUFJLENBQUMsS0FBTCxDQUFXLE9BQU8sQ0FBQyxZQUFuQjtRQUNKLElBQUcsU0FBSDtZQUNJLEdBQUEsR0FBTSxNQUFNLENBQUMsTUFBUCxDQUFjLE9BQU8sQ0FB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QUEsQ0FBMUI7ZUFtS0E7SUFuTE87O3NCQTJMWCxVQUFBLEdBQVksU0FBQTtBQUVSLFlBQUE7UUFBQSxJQUFHLElBQUMsQ0FBQSxLQUFLLENBQUMsTUFBVjtZQUNJLElBQUEsR0FBTyxJQUFDLENBQUEsS0FBSyxDQUFDLEtBQVAsQ0FBQTttQkFDUCxJQUFDLENBQUEsU0FBRCxDQUFXLElBQVgsRUFGSjs7SUFGUTs7Ozs7O0FBTWhCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDBcbjAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDBcbjAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgIDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwXG4wMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgMDAwXG4wMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwXG4jIyNcblxueyBwb3N0LCBtYXRjaHIsIGZpbHRlciwgZW1wdHksIHNsYXNoLCB2YWxpZCwgZnMsIGtlcnJvciwgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5XYWxrZXIgICA9IHJlcXVpcmUgJy4uL3Rvb2xzL3dhbGtlcidcbmZvcmtmdW5jID0gcmVxdWlyZSAnLi4vdG9vbHMvZm9ya2Z1bmMnXG5JbmRleEhwcCA9IHJlcXVpcmUgJy4vaW5kZXhocHAnXG5cbmNsYXNzIEluZGV4ZXJcblxuICAgIEByZXF1aXJlUmVnRXhwICAgPSAvXlxccyooW1xcd1xce1xcfV0rKVxccys9XFxzK3JlcXVpcmVcXHMrW1xcJ1xcXCJdKFtcXC5cXC9cXHddKylbXFwnXFxcIl0vXG4gICAgQGluY2x1ZGVSZWdFeHAgICA9IC9eI2luY2x1ZGVcXHMrW1xcXCJcXDxdKFtcXC5cXC9cXHddKylbXFxcIlxcPl0vXG4gICAgIyBAbWV0aG9kUmVnRXhwICAgID0gL15cXHMrKFtcXEBdP1xcdyspXFxzKlxcOlxccyooXFwoLipcXCkpP1xccypbPS1dXFw+L1xuICAgIEBtZXRob2RSZWdFeHAgICAgPSAvXlxccysoW1xcQF0/XFx3K3xAKVxccypcXDpcXHMqKFxcKC4qXFwpKT9cXHMqWz0tXVxcPi9cbiAgICAjIEBmdW5jUmVnRXhwICAgICAgPSAvXlxccyooW1xcd1xcLl0rKVxccypbXFw6XFw9XVxccyooXFwoLipcXCkpP1xccypbPS1dXFw+L1xuICAgIEBmdW5jUmVnRXhwICAgICAgPSAvXlxccyooW1xcd1xcLl0rKVxccypbXFw6XFw9XVteXFwoXFwpXSooXFwoLipcXCkpP1xccypbPS1dXFw+L1xuICAgIEBwb3N0UmVnRXhwICAgICAgPSAvXlxccypwb3N0XFwub25cXHMrW1xcJ1xcXCJdKFxcdyspW1xcJ1xcXCJdXFxzKlxcLD9cXHMqKFxcKC4qXFwpKT9cXHMqWz0tXVxcPi9cbiAgICBAdGVzdFJlZ0V4cCAgICAgID0gL15cXHMqKGRlc2NyaWJlfGl0KVxccytbXFwnXFxcIl0oLispW1xcJ1xcXCJdXFxzKlxcLD9cXHMqKFxcKFteXFwpXSpcXCkpP1xccypbPS1dXFw+L1xuICAgIEBzcGxpdFJlZ0V4cCAgICAgPSBuZXcgUmVnRXhwIFwiW15cXFxcd1xcXFxkXFxcXF9dK1wiLCAnZydcbiAgICBAY2xhc3NSZWdFeHAgICAgID0gL14oXFxzKlxcUytcXHMqPSk/XFxzKmNsYXNzXFxzKyhcXHcrKS9cblxuICAgIEBjbGFzc05hbWVJbkxpbmU6IChsaW5lKSAtPlxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgbSA9IGxpbmUubWF0Y2ggSW5kZXhlci5jbGFzc1JlZ0V4cFxuICAgICAgICBtP1syXVxuICAgICAgICBcbiAgICBAbWV0aG9kTmFtZUluTGluZTogKGxpbmUpIC0+XG4gICAgICAgIFxuICAgICAgICBtID0gbGluZS5tYXRjaCBJbmRleGVyLm1ldGhvZFJlZ0V4cFxuICAgICAgICBpZiBtP1xuICAgICAgICAgICAgcmdzID0gbWF0Y2hyLnJhbmdlcyBJbmRleGVyLm1ldGhvZFJlZ0V4cCwgbGluZVxuICAgICAgICAgICAgaWYgcmdzWzBdLnN0YXJ0ID4gMTFcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgICBtP1sxXVxuICAgICAgICBcbiAgICBAZnVuY05hbWVJbkxpbmU6IChsaW5lKSAtPlxuXG4gICAgICAgIGlmIG0gPSBsaW5lLm1hdGNoIEluZGV4ZXIuZnVuY1JlZ0V4cFxuICAgICAgICAgICAgcmdzID0gbWF0Y2hyLnJhbmdlcyBJbmRleGVyLmZ1bmNSZWdFeHAsIGxpbmVcbiAgICAgICAgICAgIGlmIHJnc1swXS5zdGFydCA+IDdcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgICAgICAgXG4gICAgICAgIG0/WzFdXG5cbiAgICBAcG9zdE5hbWVJbkxpbmU6IChsaW5lKSAtPiAgICAgICAgXG4gICAgICAgIFxuICAgICAgICBpZiBtID0gbGluZS5tYXRjaCBJbmRleGVyLnBvc3RSZWdFeHBcbiAgICAgICAgICAgIHJncyA9IG1hdGNoci5yYW5nZXMgSW5kZXhlci5wb3N0UmVnRXhwLCBsaW5lXG4gICAgICAgIFxuICAgICAgICBtP1sxXVxuICAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAgMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgICAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIFxuICAgIFxuICAgIEB0ZXN0V29yZDogKHdvcmQpIC0+XG4gICAgICAgIFxuICAgICAgICBzd2l0Y2hcbiAgICAgICAgICAgIHdoZW4gd29yZC5sZW5ndGggPCAzIHRoZW4gZmFsc2UgIyBleGNsdWRlIHdoZW4gdG9vIHNob3J0XG4gICAgICAgICAgICB3aGVuIHdvcmRbMF0gaW4gWyctJywgXCIjXCJdIHRoZW4gZmFsc2VcbiAgICAgICAgICAgIHdoZW4gd29yZFt3b3JkLmxlbmd0aC0xXSA9PSAnLScgdGhlbiBmYWxzZSBcbiAgICAgICAgICAgIHdoZW4gd29yZFswXSA9PSAnXycgYW5kIHdvcmQubGVuZ3RoIDwgNCB0aGVuIGZhbHNlICMgZXhjbHVkZSB3aGVuIHN0YXJ0cyB3aXRoIHVuZGVyc2NvcmUgYW5kIGlzIHNob3J0XG4gICAgICAgICAgICB3aGVuIC9eWzBcXF9cXC1cXEBcXCNdKyQvLnRlc3Qgd29yZCB0aGVuIGZhbHNlICMgZXhjbHVkZSB3aGVuIGNvbnNpc3Qgb2Ygc3BlY2lhbCBjaGFyYWN0ZXJzIG9ubHlcbiAgICAgICAgICAgIHdoZW4gL1xcZC8udGVzdCB3b3JkIHRoZW4gZmFsc2UgIyBleGNsdWRlIHdoZW4gd29yZCBjb250YWlucyBudW1iZXJcbiAgICAgICAgICAgIGVsc2UgdHJ1ZVxuICAgICAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgQDogKCkgLT5cbiAgICAgICAgXG4gICAgICAgIHBvc3Qub25HZXQgJ2luZGV4ZXInIEBvbkdldFxuICAgICAgICBwb3N0Lm9uICdzb3VyY2VJbmZvRm9yRmlsZScgQG9uU291cmNlSW5mb0ZvckZpbGVcbiAgICAgICAgXG4gICAgICAgIHBvc3Qub24gJ2ZpbGVTYXZlZCcgICAgKGZpbGUsIHdpbklEKSA9PiBAaW5kZXhGaWxlIGZpbGUsIHJlZnJlc2g6IHRydWVcbiAgICAgICAgcG9zdC5vbiAnZGlyTG9hZGVkJyAgICAoZGlyKSAgICAgICAgID0+IEBpbmRleFByb2plY3QgZGlyXG4gICAgICAgIHBvc3Qub24gJ2ZpbGVMb2FkZWQnICAgKGZpbGUsIHdpbklEKSA9PiBcbiAgICAgICAgICAgIEBpbmRleEZpbGUgZmlsZVxuICAgICAgICAgICAgQGluZGV4UHJvamVjdCBmaWxlXG4gICAgICAgIFxuICAgICAgICBAY29sbGVjdEJpbnMoKVxuICAgIFxuICAgICAgICBAaW1hZ2VFeHRlbnNpb25zID0gWydwbmcnICdqcGcnICdnaWYnICd0aWZmJyAncHhtJyAnaWNucyddICAgICAgICBcblxuICAgICAgICBAZGlycyAgICA9IE9iamVjdC5jcmVhdGUgbnVsbFxuICAgICAgICBAZmlsZXMgICA9IE9iamVjdC5jcmVhdGUgbnVsbFxuICAgICAgICBAY2xhc3NlcyA9IE9iamVjdC5jcmVhdGUgbnVsbFxuICAgICAgICBAZnVuY3MgICA9IE9iamVjdC5jcmVhdGUgbnVsbFxuICAgICAgICBAd29yZHMgICA9IE9iamVjdC5jcmVhdGUgbnVsbFxuICAgICAgICBAd2Fsa2VyICA9IG51bGxcbiAgICAgICAgQHF1ZXVlICAgPSBbXVxuICAgICAgICBcbiAgICAgICAgQGluZGV4ZWRQcm9qZWN0cyA9IFtdXG5cbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgb25HZXQ6IChrZXksIGZpbHRlci4uLikgPT5cbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCBrZXlcbiAgICAgICAgICAgIHdoZW4gJ2NvdW50cydcbiAgICAgICAgICAgICAgICByZXR1cm4gXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzZXM6IEBjbGFzc2VzLmxlbmd0aCA/IDBcbiAgICAgICAgICAgICAgICAgICAgZmlsZXM6ICAgQGZpbGVzLmxlbmd0aCA/IDBcbiAgICAgICAgICAgICAgICAgICAgZnVuY3M6ICAgQGZ1bmNzLmxlbmd0aCA/IDBcbiAgICAgICAgICAgICAgICAgICAgd29yZHM6ICAgQHdvcmRzLmxlbmd0aCA/IDBcbiAgICAgICAgICAgICAgICAgICAgZGlyczogICAgQGRpcnMubGVuZ3RoID8gMFxuICAgICAgICAgICAgd2hlbiAnZmlsZSdcbiAgICAgICAgICAgICAgICByZXR1cm4gQGZpbGVzW2ZpbHRlclswXV1cbiAgICAgICAgICAgIHdoZW4gJ3Byb2plY3QnXG4gICAgICAgICAgICAgICAgcmV0dXJuIEBwcm9qZWN0SW5mbyBmaWx0ZXJbMF1cbiAgICAgICAgXG4gICAgICAgIHZhbHVlID0gQFtrZXldXG4gICAgICAgIGlmIG5vdCBlbXB0eSBmaWx0ZXJcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgbmFtZXMgPSBfLmZpbHRlciBmaWx0ZXIsIChjKSAtPiBub3QgZW1wdHkgY1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBub3QgZW1wdHkgbmFtZXNcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBuYW1lcyA9IG5hbWVzLm1hcCAoYykgLT4gYz8udG9Mb3dlckNhc2UoKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHZhbHVlID0gXy5waWNrQnkgdmFsdWUsICh2YWx1ZSwga2V5KSAtPlxuICAgICAgICAgICAgICAgICAgICBmb3IgY24gaW4gbmFtZXNcbiAgICAgICAgICAgICAgICAgICAgICAgIGxjID0ga2V5LnRvTG93ZXJDYXNlKClcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIGNuLmxlbmd0aD4xIGFuZCBsYy5pbmRleE9mKGNuKT49MCBvciBsYy5zdGFydHNXaXRoKGNuKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIHZhbHVlXG4gICAgICAgIFxuICAgIG9uU291cmNlSW5mb0ZvckZpbGU6IChvcHQpID0+XG4gICAgICAgIFxuICAgICAgICBmaWxlID0gb3B0Lml0ZW0uZmlsZVxuICAgICAgICBpZiBAZmlsZXNbZmlsZV0/XG4gICAgICAgICAgICBwb3N0LnRvV2luIG9wdC53aW5JRCwgJ3NvdXJjZUluZm9Gb3JGaWxlJyBAZmlsZXNbZmlsZV0sIG9wdFxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBjb2xsZWN0QmluczogLT5cbiAgICAgICAgXG4gICAgICAgIEBiaW5zID0gW11cbiAgICAgICAgcmV0dXJuIGlmIHNsYXNoLndpbigpXG4gICAgICAgIFxuICAgICAgICBmb3IgZGlyIGluIFsnL2JpbicgJy91c3IvYmluJyAnL3Vzci9sb2NhbC9iaW4nXVxuICAgICAgICAgICAgdyA9IG5ldyBXYWxrZXJcbiAgICAgICAgICAgICAgICBtYXhGaWxlczogICAgMTAwMFxuICAgICAgICAgICAgICAgIHJvb3Q6ICAgICAgICBkaXJcbiAgICAgICAgICAgICAgICBpbmNsdWRlRGlyczogZmFsc2VcbiAgICAgICAgICAgICAgICBpbmNsdWRlRXh0OiAgWycnXSAjIHJlcG9ydCBmaWxlcyB3aXRob3V0IGV4dGVuc2lvblxuICAgICAgICAgICAgICAgIGZpbGU6ICAgICAgICAocCkgPT4gQGJpbnMucHVzaCBzbGFzaC5iYXNlbmFtZSBwXG4gICAgICAgICAgICB3LnN0YXJ0KClcblxuICAgIGNvbGxlY3RQcm9qZWN0czogLT5cblxuICAgICAgICBAcHJvamVjdHMgPSB7fVxuICAgICAgICB3ID0gbmV3IFdhbGtlclxuICAgICAgICAgICAgbWF4RmlsZXM6ICAgIDUwMDBcbiAgICAgICAgICAgIG1heERlcHRoOiAgICAzXG4gICAgICAgICAgICByb290OiAgICAgICAgc2xhc2gucmVzb2x2ZSAnfidcbiAgICAgICAgICAgIGluY2x1ZGU6ICAgICBbJy5naXQnXVxuICAgICAgICAgICAgaWdub3JlOiAgICAgIFsnbm9kZV9tb2R1bGVzJyAnaW1nJyAnYmluJyAnanMnICdMaWJyYXJ5J11cbiAgICAgICAgICAgIHNraXBEaXI6ICAgICAocCkgLT4gc2xhc2guYmFzZShwKSA9PSAnLmdpdCdcbiAgICAgICAgICAgIGZpbHRlcjogICAgICAocCkgLT4gc2xhc2guZXh0KHApIG5vdCBpbiBbJ25vb24nICdqc29uJyAnZ2l0JyAnJ11cbiAgICAgICAgICAgIGRpcjogICAgICAgICAocCkgPT4gaWYgc2xhc2guZmlsZShwKSA9PSAnLmdpdCcgICAgdGhlbiBAcHJvamVjdHNbc2xhc2guYmFzZSBzbGFzaC5kaXIgcF0gPSBkaXI6IHNsYXNoLnRpbGRlIHNsYXNoLmRpciBwXG4gICAgICAgICAgICBmaWxlOiAgICAgICAgKHApID0+IGlmIHNsYXNoLmJhc2UocCkgPT0gJ3BhY2thZ2UnIHRoZW4gQHByb2plY3RzW3NsYXNoLmJhc2Ugc2xhc2guZGlyIHBdID0gZGlyOiBzbGFzaC50aWxkZSBzbGFzaC5kaXIgcFxuICAgICAgICAgICAgZG9uZTogICAgICAgID0+IGxvZyAnY29sbGVjdFByb2plY3RzIGRvbmUnIEBwcm9qZWN0c1xuICAgICAgICB3LnN0YXJ0KClcblxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgICAgICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAgICAwMDAgICAgICAgIDAwMCAgMDAwMDAwMCAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBwcm9qZWN0SW5mbzogKHBhdGgpIC0+XG4gICAgICAgIFxuICAgICAgICBmb3IgcHJvamVjdCBpbiBAaW5kZXhlZFByb2plY3RzXG4gICAgICAgICAgICBpZiBzbGFzaC5zYW1lUGF0aChwcm9qZWN0LmRpciwgcGF0aCkgb3IgcGF0aC5zdGFydHNXaXRoIHByb2plY3QuZGlyICsgJy8nXG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb2plY3RcbiAgICAgICAge31cbiAgICBcbiAgICBpbmRleFByb2plY3Q6IChmaWxlKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgQGN1cnJlbnRseUluZGV4aW5nXG4gICAgICAgICAgICBAaW5kZXhRdWV1ZSA/PSBbXVxuICAgICAgICAgICAgaWYgZmlsZSBub3QgaW4gQGluZGV4UXVldWVcbiAgICAgICAgICAgICAgICBAaW5kZXhRdWV1ZS5wdXNoIGZpbGVcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICBcbiAgICAgICAgZmlsZSA9IHNsYXNoLnJlc29sdmUgZmlsZSBcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiB2YWxpZCBAcHJvamVjdEluZm8gZmlsZVxuICAgICAgICAgICAgICBcbiAgICAgICAgQGN1cnJlbnRseUluZGV4aW5nID0gZmlsZVxuICAgICAgICBcbiAgICAgICAgZm9ya2Z1bmMgXCIje19fZGlybmFtZX0vaW5kZXhwcmpcIiwgZmlsZSwgKGVyciwgaW5mbykgPT5cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIGtlcnJvciAnaW5kZXhpbmcgZmFpbGVkJywgZXJyIGlmIHZhbGlkIGVyclxuICAgICAgICAgICAgXG4gICAgICAgICAgICBkZWxldGUgQGN1cnJlbnRseUluZGV4aW5nXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIGluZm9cbiAgICAgICAgICAgICAgICBAaW5kZXhlZFByb2plY3RzLnB1c2ggaW5mbyBcbiAgICAgICAgICAgICAgICBwb3N0LnRvV2lucyAncHJvamVjdEluZGV4ZWQnLCBpbmZvXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGRvU2hpZnQgPSBlbXB0eSBAcXVldWVcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgdmFsaWQgaW5mby5maWxlc1xuICAgICAgICAgICAgICAgIEBxdWV1ZSA9IEBxdWV1ZS5jb25jYXQgaW5mby5maWxlc1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgdmFsaWQgQGluZGV4UXVldWVcbiAgICAgICAgICAgICAgICBAaW5kZXhQcm9qZWN0IEBpbmRleFF1ZXVlLnNoaWZ0KClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIEBzaGlmdFF1ZXVlKCkgaWYgZG9TaGlmdFxuICAgICAgICAgICAgICAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAwMDAgICAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAwMCAgICAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgMDAwICAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAgIDAwMCAgIDAwMFxuXG4gICAgaW5kZXhEaXI6IChkaXIpIC0+XG5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCBkaXI/IG9yIEBkaXJzW2Rpcl0/XG4gICAgICAgIFxuICAgICAgICBAZGlyc1tkaXJdID1cbiAgICAgICAgICAgIG5hbWU6IHNsYXNoLmJhc2VuYW1lIGRpclxuXG4gICAgICAgIHdvcHQgPVxuICAgICAgICAgICAgcm9vdDogICAgICAgIGRpclxuICAgICAgICAgICAgaW5jbHVkZURpcjogIGRpclxuICAgICAgICAgICAgaW5jbHVkZURpcnM6IHRydWVcbiAgICAgICAgICAgIGRpcjogICAgICAgICBAb25XYWxrZXJEaXJcbiAgICAgICAgICAgIGZpbGU6ICAgICAgICBAb25XYWxrZXJGaWxlXG4gICAgICAgICAgICBtYXhEZXB0aDogICAgMTJcbiAgICAgICAgICAgIG1heEZpbGVzOiAgICAxMDAwMDBcbiAgICAgICAgICAgIGRvbmU6ICAgICAgICAodykgPT4gXG4gICAgICAgICAgICAgICAgQHNoaWZ0UXVldWVcblxuICAgICAgICBAd2Fsa2VyID0gbmV3IFdhbGtlciB3b3B0XG4gICAgICAgIEB3YWxrZXIuY2ZnLmlnbm9yZS5wdXNoICdqcydcbiAgICAgICAgQHdhbGtlci5zdGFydCgpXG5cbiAgICBvbldhbGtlckRpcjogKHAsIHN0YXQpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBub3QgQGRpcnNbcF0/XG4gICAgICAgICAgICBAZGlyc1twXSA9XG4gICAgICAgICAgICAgICAgbmFtZTogc2xhc2guYmFzZW5hbWUgcFxuXG4gICAgb25XYWxrZXJGaWxlOiAocCwgc3RhdCkgPT5cbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBAZmlsZXNbcF0/IGFuZCBAcXVldWUuaW5kZXhPZihwKSA8IDBcbiAgICAgICAgICAgIGlmIHN0YXQuc2l6ZSA8IDY1NDMyMSAjIG9idmlvdXNseSBzb21lIGFyYml0cmFyeSBudW1iZXIgOilcbiAgICAgICAgICAgICAgICBAcXVldWUucHVzaCBwXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgbG9nIFwid2FybmluZyEgZmlsZSAje3B9IHRvbyBsYXJnZT8gI3tzdGF0LnNpemV9LiBza2lwcGluZyBpbmRleGluZyFcIlxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgICAgMDAwICAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgXG5cbiAgICBhZGRGdW5jSW5mbzogKGZ1bmNOYW1lLCBmdW5jSW5mbykgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIGZ1bmNOYW1lLmxlbmd0aCA+IDEgYW5kIGZ1bmNOYW1lLnN0YXJ0c1dpdGggJ0AnXG4gICAgICAgICAgICBmdW5jTmFtZSA9IGZ1bmNOYW1lLnNsaWNlIDFcbiAgICAgICAgICAgIGZ1bmNJbmZvLnN0YXRpYyA9IHRydWVcbiAgICAgICAgICAgIFxuICAgICAgICBmdW5jSW5mby5uYW1lID0gZnVuY05hbWVcbiAgICAgICAgXG4gICAgICAgIGZ1bmNJbmZvcyA9IEBmdW5jc1tmdW5jTmFtZV0gPyBbXVxuICAgICAgICBmdW5jSW5mb3MucHVzaCBmdW5jSW5mb1xuICAgICAgICBAZnVuY3NbZnVuY05hbWVdID0gZnVuY0luZm9zXG4gICAgICAgIFxuICAgICAgICBmdW5jSW5mb1xuXG4gICAgYWRkTWV0aG9kOiAoY2xhc3NOYW1lLCBmdW5jTmFtZSwgZmlsZSwgbGkpIC0+XG5cbiAgICAgICAgZnVuY0luZm8gPSBAYWRkRnVuY0luZm8gZnVuY05hbWUsXG4gICAgICAgICAgICBsaW5lOiAgbGkrMVxuICAgICAgICAgICAgZmlsZTogIGZpbGVcbiAgICAgICAgICAgIGNsYXNzOiBjbGFzc05hbWVcblxuICAgICAgICBfLnNldCBAY2xhc3NlcywgXCIje2NsYXNzTmFtZX0ubWV0aG9kcy4je2Z1bmNJbmZvLm5hbWV9XCIsIGZ1bmNJbmZvXG5cbiAgICAgICAgZnVuY0luZm9cblxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgICAgIDAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMCAwMDAgICAwMDAwMDAwICAgICAgICAgMDAwMDAwICAgIDAwMCAgMDAwICAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwIDAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgICAgICAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgICAwICAgICAgMDAwMDAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG5cbiAgICByZW1vdmVGaWxlOiAoZmlsZSkgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBub3QgQGZpbGVzW2ZpbGVdP1xuICAgICAgICBcbiAgICAgICAgZm9yIG5hbWUsaW5mb3Mgb2YgQGZ1bmNzXG4gICAgICAgICAgICBfLnJlbW92ZSBpbmZvcywgKHYpIC0+IHYuZmlsZSA9PSBmaWxlXG4gICAgICAgICAgICBkZWxldGUgQGZ1bmNzW25hbWVdIGlmIG5vdCBpbmZvcy5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIEBjbGFzc2VzID0gXy5vbWl0QnkgQGNsYXNzZXMsICh2KSAtPiB2LmZpbGUgPT0gZmlsZVxuICAgICAgICBcbiAgICAgICAgZGVsZXRlIEBmaWxlc1tmaWxlXVxuXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMFxuICAgICMgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgMDAwICAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAwMCAgICAgICAgICAwMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwXG4gICAgIyAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAwMDAgICAgICAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG5cbiAgICBpbmRleEZpbGU6IChmaWxlLCBvcHQpIC0+XG4gICAgICAgIFxuICAgICAgICBAcmVtb3ZlRmlsZSBmaWxlIGlmIG9wdD8ucmVmcmVzaFxuXG4gICAgICAgIGlmIEBmaWxlc1tmaWxlXT9cbiAgICAgICAgICAgIHJldHVybiBAc2hpZnRRdWV1ZSgpXG5cbiAgICAgICAgZmlsZUV4dCA9IHNsYXNoLmV4dCBmaWxlIFxuXG4gICAgICAgIGlmIGZpbGVFeHQgaW4gQGltYWdlRXh0ZW5zaW9uc1xuICAgICAgICAgICAgQGZpbGVzW2ZpbGVdID0ge31cbiAgICAgICAgICAgIHJldHVybiBAc2hpZnRRdWV1ZSgpXG4gICAgICAgICAgICBcbiAgICAgICAgaXNDcHAgPSBmaWxlRXh0IGluIFsnY3BwJywgJ2NjJ11cbiAgICAgICAgaXNIcHAgPSBmaWxlRXh0IGluIFsnaHBwJywgJ2gnIF1cblxuICAgICAgICBmcy5yZWFkRmlsZSBmaWxlLCAndXRmOCcsIChlcnIsIGRhdGEpID0+XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiBrZXJyb3IgXCJjYW4ndCBpbmRleCAje2ZpbGV9XCIsIGVyciBpZiBub3QgZW1wdHkgZXJyXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGxpbmVzID0gZGF0YS5zcGxpdCAvXFxyP1xcbi9cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZmlsZUluZm8gPVxuICAgICAgICAgICAgICAgIGxpbmVzOiBsaW5lcy5sZW5ndGhcbiAgICAgICAgICAgICAgICBmdW5jczogW11cbiAgICAgICAgICAgICAgICBjbGFzc2VzOiBbXVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgZnVuY0FkZGVkID0gZmFsc2VcbiAgICAgICAgICAgIGZ1bmNTdGFjayA9IFtdXG4gICAgICAgICAgICBjdXJyZW50Q2xhc3MgPSBudWxsXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIGlzSHBwIG9yIGlzQ3BwXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaW5kZXhIcHAgPSBuZXcgSW5kZXhIcHBcbiAgICAgICAgICAgICAgICBwYXJzZWQgPSBpbmRleEhwcC5wYXJzZSBkYXRhXG4gICAgICAgICAgICAgICAgZnVuY0FkZGVkID0gbm90IGVtcHR5KHBhcnNlZC5jbGFzc2VzKSBvciBub3QgZW1wdHkocGFyc2VkLmZ1bmNzKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGZvciBjbHNzIGluIHBhcnNlZC5jbGFzc2VzXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBfLnNldCBAY2xhc3NlcywgXCIje2Nsc3MubmFtZX0uZmlsZVwiLCBmaWxlXG4gICAgICAgICAgICAgICAgICAgIF8uc2V0IEBjbGFzc2VzLCBcIiN7Y2xzcy5uYW1lfS5saW5lXCIsIGNsc3MubGluZSsxXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBmaWxlSW5mby5jbGFzc2VzLnB1c2ggXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBjbHNzLm5hbWVcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpbmU6IGNsc3MubGluZSsxXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBmb3IgZnVuYyBpbiBwYXJzZWQuZnVuY3NcbiAgICAgICAgICAgICAgICAgICAgZnVuY0luZm8gPSBAYWRkTWV0aG9kIGZ1bmMuY2xhc3MsIGZ1bmMubWV0aG9kLCBmaWxlLCBmdW5jLmxpbmVcbiAgICAgICAgICAgICAgICAgICAgZmlsZUluZm8uZnVuY3MucHVzaCBmdW5jSW5mb1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBmb3IgbGkgaW4gWzAuLi5saW5lcy5sZW5ndGhdXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBsaW5lID0gbGluZXNbbGldXG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGlmIGxpbmUudHJpbSgpLmxlbmd0aCAjIGlnbm9yaW5nIGVtcHR5IGxpbmVzXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGVudCA9IGxpbmUuc2VhcmNoIC9cXFMvXG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSBmdW5jU3RhY2subGVuZ3RoIGFuZCBpbmRlbnQgPD0gXy5sYXN0KGZ1bmNTdGFjaylbMF1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfLmxhc3QoZnVuY1N0YWNrKVsxXS5sYXN0ID0gbGkgLSAxXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY0luZm8gPSBmdW5jU3RhY2sucG9wKClbMV1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jSW5mby5jbGFzcyA/PSBzbGFzaC5iYXNlIGZpbGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlSW5mby5mdW5jcy5wdXNoIGZ1bmNJbmZvIFxuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgY3VycmVudENsYXNzPyBcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIDAwICAgICAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgIDAwMDAwMDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIDAwMCAwIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMFxuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIG1ldGhvZE5hbWUgPSBJbmRleGVyLm1ldGhvZE5hbWVJbkxpbmUgbGluZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jSW5mbyA9IEBhZGRNZXRob2QgY3VycmVudENsYXNzLCBtZXRob2ROYW1lLCBmaWxlLCBsaVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jU3RhY2sucHVzaCBbaW5kZW50LCBmdW5jSW5mb11cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY0FkZGVkID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIyAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgICAwMDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRDbGFzcyA9IG51bGwgaWYgaW5kZW50IDwgMiAjIHdhcyA0XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgZnVuY05hbWUgPSBJbmRleGVyLmZ1bmNOYW1lSW5MaW5lIGxpbmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY0luZm8gPSBAYWRkRnVuY0luZm8gZnVuY05hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5lOiBsaSsxXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlOiBmaWxlXG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmNTdGFjay5wdXNoIFtpbmRlbnQsIGZ1bmNJbmZvXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jQWRkZWQgPSB0cnVlXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIGZ1bmNOYW1lID0gSW5kZXhlci5wb3N0TmFtZUluTGluZSBsaW5lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmNJbmZvID0gQGFkZEZ1bmNJbmZvIGZ1bmNOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGluZTogbGkrMVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZTogZmlsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zdDogdHJ1ZVxuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jU3RhY2sucHVzaCBbaW5kZW50LCBmdW5jSW5mb11cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY0FkZGVkID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtID0gbGluZS5tYXRjaCBJbmRleGVyLnRlc3RSZWdFeHBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBtP1syXT9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY0luZm8gPSBAYWRkRnVuY0luZm8gbVsyXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbmU6IGxpKzFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGU6IGZpbGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlc3Q6IG1bMV1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY1N0YWNrLnB1c2ggW2luZGVudCwgZnVuY0luZm9dXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmNBZGRlZCA9IHRydWVcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgd29yZHMgPSBsaW5lLnNwbGl0IEluZGV4ZXIuc3BsaXRSZWdFeHBcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGZvciB3b3JkIGluIHdvcmRzXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIEluZGV4ZXIudGVzdFdvcmQgd29yZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF8udXBkYXRlIEB3b3JkcywgXCIje3dvcmR9LmNvdW50XCIsIChuKSAtPiAobiA/IDApICsgMVxuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgc3dpdGNoIHdvcmRcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAjICAwMDAwMDAwICAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgIDAwMDAwMDAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGVuICdjbGFzcydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIGNsYXNzTmFtZSA9IEluZGV4ZXIuY2xhc3NOYW1lSW5MaW5lIGxpbmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRDbGFzcyA9IGNsYXNzTmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXy5zZXQgQGNsYXNzZXMsIFwiI3tjbGFzc05hbWV9LmZpbGVcIiwgZmlsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXy5zZXQgQGNsYXNzZXMsIFwiI3tjbGFzc05hbWV9LmxpbmVcIiwgbGkrMVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlSW5mby5jbGFzc2VzLnB1c2ggXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogY2xhc3NOYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGluZTogbGkrMVxuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAwMCAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwIDAwMDAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMCAwMCAgIDAwMDAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGVuICdyZXF1aXJlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbSA9IGxpbmUubWF0Y2ggSW5kZXhlci5yZXF1aXJlUmVnRXhwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIG0/WzFdPyBhbmQgbVsyXT9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHIgPSBmaWxlSW5mby5yZXF1aXJlID8gW11cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHIucHVzaCBbbVsxXSwgbVsyXV1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVJbmZvLnJlcXVpcmUgPSByXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhYnNwYXRoID0gc2xhc2gucmVzb2x2ZSBzbGFzaC5qb2luIHNsYXNoLmRpcihmaWxlKSwgbVsyXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWJzcGF0aCArPSAnLmNvZmZlZSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtWzJdWzBdID09ICcuJykgYW5kIChub3QgQGZpbGVzW2Fic3BhdGhdPykgYW5kIChAcXVldWUuaW5kZXhPZihhYnNwYXRoKSA8IDApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgc2xhc2guaXNGaWxlIGFic3BhdGhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQHF1ZXVlLnB1c2ggYWJzcGF0aFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIGZ1bmNBZGRlZFxuXG4gICAgICAgICAgICAgICAgd2hpbGUgZnVuY1N0YWNrLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICBfLmxhc3QoZnVuY1N0YWNrKVsxXS5sYXN0ID0gbGkgLSAxXG4gICAgICAgICAgICAgICAgICAgIGZ1bmNJbmZvID0gZnVuY1N0YWNrLnBvcCgpWzFdXG4gICAgICAgICAgICAgICAgICAgIGZ1bmNJbmZvLmNsYXNzID89IHNsYXNoLmJhc2UgZnVuY0luZm8uZmlsZVxuICAgICAgICAgICAgICAgICAgICBmdW5jSW5mby5jbGFzcyA/PSBzbGFzaC5iYXNlIGZpbGVcbiAgICAgICAgICAgICAgICAgICAgZmlsZUluZm8uZnVuY3MucHVzaCBmdW5jSW5mb1xuXG4gICAgICAgICAgICAgICAgaWYgb3B0Py5wb3N0ICE9IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgIHBvc3QudG9XaW5zICdjbGFzc2VzQ291bnQnIF8uc2l6ZSBAY2xhc3Nlc1xuICAgICAgICAgICAgICAgICAgICBwb3N0LnRvV2lucyAnZnVuY3NDb3VudCcgICBfLnNpemUgQGZ1bmNzXG4gICAgICAgICAgICAgICAgICAgIHBvc3QudG9XaW5zICdmaWxlSW5kZXhlZCcgIGZpbGUsIGZpbGVJbmZvXG5cbiAgICAgICAgICAgIEBmaWxlc1tmaWxlXSA9IGZpbGVJbmZvXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIG9wdD8ucG9zdCAhPSBmYWxzZVxuICAgICAgICAgICAgICAgIHBvc3QudG9XaW5zICdmaWxlc0NvdW50JyBfLnNpemUgQGZpbGVzXG5cbiAgICAgICAgICAgIEBzaGlmdFF1ZXVlKClcbiAgICAgICAgQFxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgMDAwMDAwICAgICAgIDAwMCAgICAgXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICBcbiAgICBcbiAgICBzaGlmdFF1ZXVlOiA9PlxuICAgICAgICBcbiAgICAgICAgaWYgQHF1ZXVlLmxlbmd0aFxuICAgICAgICAgICAgZmlsZSA9IEBxdWV1ZS5zaGlmdCgpXG4gICAgICAgICAgICBAaW5kZXhGaWxlIGZpbGVcblxubW9kdWxlLmV4cG9ydHMgPSBJbmRleGVyXG4iXX0=
//# sourceURL=../../coffee/main/indexer.coffee