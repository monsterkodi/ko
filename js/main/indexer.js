// koffee 1.20.0

/*
000  000   000  0000000    00000000  000   000  00000000  00000000
000  0000  000  000   000  000        000 000   000       000   000
000  000 0 000  000   000  0000000     00000    0000000   0000000
000  000  0000  000   000  000        000 000   000       000   000
000  000   000  0000000    00000000  000   000  00000000  000   000
 */
var IndexHpp, Indexer, Walker, _, empty, filter, forkfunc, kerror, klog, matchr, post, ref, slash, valid,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    slice = [].slice,
    indexOf = [].indexOf;

ref = require('kxk'), _ = ref._, empty = ref.empty, filter = ref.filter, kerror = ref.kerror, klog = ref.klog, matchr = ref.matchr, post = ref.post, slash = ref.slash, valid = ref.valid;

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
        if (!funcName) {
            klog("addFuncInfo " + funcName, funcInfo);
        }
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
        isCpp = fileExt === 'cpp' || fileExt === 'cc' || fileExt === 'c' || fileExt === 'frag' || fileExt === 'vert';
        isHpp = fileExt === 'hpp' || fileExt === 'h';
        slash.readText(file, (function(_this) {
            return function(text) {
                var abspath, className, clss, currentClass, fileInfo, func, funcAdded, funcInfo, funcName, funcStack, i, indent, indexHpp, j, k, l, len, len1, len2, li, line, lines, m, methodName, parsed, r, ref1, ref2, ref3, ref4, word, words;
                lines = text.split(/\r?\n/);
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
                    parsed = indexHpp.parse(text);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXhlci5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvbWFpbiIsInNvdXJjZXMiOlsiaW5kZXhlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsb0dBQUE7SUFBQTs7OztBQVFBLE1BQWlFLE9BQUEsQ0FBUSxLQUFSLENBQWpFLEVBQUUsU0FBRixFQUFLLGlCQUFMLEVBQVksbUJBQVosRUFBb0IsbUJBQXBCLEVBQTRCLGVBQTVCLEVBQWtDLG1CQUFsQyxFQUEwQyxlQUExQyxFQUFnRCxpQkFBaEQsRUFBdUQ7O0FBRXZELE1BQUEsR0FBVyxPQUFBLENBQVEsaUJBQVI7O0FBQ1gsUUFBQSxHQUFXLE9BQUEsQ0FBUSxtQkFBUjs7QUFDWCxRQUFBLEdBQVcsT0FBQSxDQUFRLFlBQVI7O0FBRUw7SUFFRixPQUFDLENBQUEsYUFBRCxHQUFtQjs7SUFDbkIsT0FBQyxDQUFBLGFBQUQsR0FBbUI7O0lBRW5CLE9BQUMsQ0FBQSxZQUFELEdBQW1COztJQUVuQixPQUFDLENBQUEsVUFBRCxHQUFtQjs7SUFDbkIsT0FBQyxDQUFBLFVBQUQsR0FBbUI7O0lBQ25CLE9BQUMsQ0FBQSxVQUFELEdBQW1COztJQUNuQixPQUFDLENBQUEsV0FBRCxHQUFtQixJQUFJLE1BQUosQ0FBVyxlQUFYLEVBQTRCLEdBQTVCOztJQUNuQixPQUFDLENBQUEsV0FBRCxHQUFtQjs7SUFFbkIsT0FBQyxDQUFBLGVBQUQsR0FBa0IsU0FBQyxJQUFEO0FBRWQsWUFBQTtRQUFBLENBQUEsR0FBSSxJQUFJLENBQUMsS0FBTCxDQUFXLE9BQU8sQ0FBQyxXQUFuQjsyQkFDSixDQUFHLENBQUEsQ0FBQTtJQUhXOztJQUtsQixPQUFDLENBQUEsZ0JBQUQsR0FBbUIsU0FBQyxJQUFEO0FBRWYsWUFBQTtRQUFBLENBQUEsR0FBSSxJQUFJLENBQUMsS0FBTCxDQUFXLE9BQU8sQ0FBQyxZQUFuQjtRQUNKLElBQUcsU0FBSDtZQUNJLEdBQUEsR0FBTSxN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QUFDLENBQUEsVUFBRCxDQUFBO1lBaEtpQjtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBckI7ZUFpS0E7SUFuTE87O3NCQTJMWCxVQUFBLEdBQVksU0FBQTtBQUVSLFlBQUE7UUFBQSxJQUFHLElBQUMsQ0FBQSxLQUFLLENBQUMsTUFBVjtZQUNJLElBQUEsR0FBTyxJQUFDLENBQUEsS0FBSyxDQUFDLEtBQVAsQ0FBQTttQkFDUCxJQUFDLENBQUEsU0FBRCxDQUFXLElBQVgsRUFGSjs7SUFGUTs7Ozs7O0FBTWhCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDBcbjAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDBcbjAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgIDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwXG4wMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgMDAwXG4wMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwXG4jIyNcblxueyBfLCBlbXB0eSwgZmlsdGVyLCBrZXJyb3IsIGtsb2csIG1hdGNociwgcG9zdCwgc2xhc2gsIHZhbGlkIH0gPSByZXF1aXJlICdreGsnXG5cbldhbGtlciAgID0gcmVxdWlyZSAnLi4vdG9vbHMvd2Fsa2VyJ1xuZm9ya2Z1bmMgPSByZXF1aXJlICcuLi90b29scy9mb3JrZnVuYydcbkluZGV4SHBwID0gcmVxdWlyZSAnLi9pbmRleGhwcCdcblxuY2xhc3MgSW5kZXhlclxuXG4gICAgQHJlcXVpcmVSZWdFeHAgICA9IC9eXFxzKihbXFx3XFx7XFx9XSspXFxzKz1cXHMrcmVxdWlyZVxccytbXFwnXFxcIl0oW1xcLlxcL1xcd10rKVtcXCdcXFwiXS9cbiAgICBAaW5jbHVkZVJlZ0V4cCAgID0gL14jaW5jbHVkZVxccytbXFxcIlxcPF0oW1xcLlxcL1xcd10rKVtcXFwiXFw+XS9cbiAgICAjIEBtZXRob2RSZWdFeHAgICAgPSAvXlxccysoW1xcQF0/XFx3KylcXHMqXFw6XFxzKihcXCguKlxcKSk/XFxzKls9LV1cXD4vXG4gICAgQG1ldGhvZFJlZ0V4cCAgICA9IC9eXFxzKyhbXFxAXT9cXHcrfEApXFxzKlxcOlxccyooXFwoLipcXCkpP1xccypbPS1dXFw+L1xuICAgICMgQGZ1bmNSZWdFeHAgICAgICA9IC9eXFxzKihbXFx3XFwuXSspXFxzKltcXDpcXD1dXFxzKihcXCguKlxcKSk/XFxzKls9LV1cXD4vXG4gICAgQGZ1bmNSZWdFeHAgICAgICA9IC9eXFxzKihbXFx3XFwuXSspXFxzKltcXDpcXD1dW15cXChcXCldKihcXCguKlxcKSk/XFxzKls9LV1cXD4vXG4gICAgQHBvc3RSZWdFeHAgICAgICA9IC9eXFxzKnBvc3RcXC5vblxccytbXFwnXFxcIl0oXFx3KylbXFwnXFxcIl1cXHMqXFwsP1xccyooXFwoLipcXCkpP1xccypbPS1dXFw+L1xuICAgIEB0ZXN0UmVnRXhwICAgICAgPSAvXlxccyooZGVzY3JpYmV8aXQpXFxzK1tcXCdcXFwiXSguKylbXFwnXFxcIl1cXHMqXFwsP1xccyooXFwoW15cXCldKlxcKSk/XFxzKls9LV1cXD4vXG4gICAgQHNwbGl0UmVnRXhwICAgICA9IG5ldyBSZWdFeHAgXCJbXlxcXFx3XFxcXGRcXFxcX10rXCIsICdnJ1xuICAgIEBjbGFzc1JlZ0V4cCAgICAgPSAvXihcXHMqXFxTK1xccyo9KT9cXHMqY2xhc3NcXHMrKFxcdyspL1xuXG4gICAgQGNsYXNzTmFtZUluTGluZTogKGxpbmUpIC0+XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBtID0gbGluZS5tYXRjaCBJbmRleGVyLmNsYXNzUmVnRXhwXG4gICAgICAgIG0/WzJdXG4gICAgICAgIFxuICAgIEBtZXRob2ROYW1lSW5MaW5lOiAobGluZSkgLT5cbiAgICAgICAgXG4gICAgICAgIG0gPSBsaW5lLm1hdGNoIEluZGV4ZXIubWV0aG9kUmVnRXhwXG4gICAgICAgIGlmIG0/XG4gICAgICAgICAgICByZ3MgPSBtYXRjaHIucmFuZ2VzIEluZGV4ZXIubWV0aG9kUmVnRXhwLCBsaW5lXG4gICAgICAgICAgICBpZiByZ3NbMF0uc3RhcnQgPiAxMVxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgIG0/WzFdXG4gICAgICAgIFxuICAgIEBmdW5jTmFtZUluTGluZTogKGxpbmUpIC0+XG5cbiAgICAgICAgaWYgbSA9IGxpbmUubWF0Y2ggSW5kZXhlci5mdW5jUmVnRXhwXG4gICAgICAgICAgICByZ3MgPSBtYXRjaHIucmFuZ2VzIEluZGV4ZXIuZnVuY1JlZ0V4cCwgbGluZVxuICAgICAgICAgICAgaWYgcmdzWzBdLnN0YXJ0ID4gN1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgICAgICBcbiAgICAgICAgbT9bMV1cblxuICAgIEBwb3N0TmFtZUluTGluZTogKGxpbmUpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBtID0gbGluZS5tYXRjaCBJbmRleGVyLnBvc3RSZWdFeHBcbiAgICAgICAgICAgIHJncyA9IG1hdGNoci5yYW5nZXMgSW5kZXhlci5wb3N0UmVnRXhwLCBsaW5lXG4gICAgICAgIFxuICAgICAgICBtP1sxXVxuICAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAgMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgICAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIFxuICAgIFxuICAgIEB0ZXN0V29yZDogKHdvcmQpIC0+XG4gICAgICAgIFxuICAgICAgICBzd2l0Y2hcbiAgICAgICAgICAgIHdoZW4gd29yZC5sZW5ndGggPCAzIHRoZW4gZmFsc2UgIyBleGNsdWRlIHdoZW4gdG9vIHNob3J0XG4gICAgICAgICAgICB3aGVuIHdvcmRbMF0gaW4gWyctJywgXCIjXCJdIHRoZW4gZmFsc2VcbiAgICAgICAgICAgIHdoZW4gd29yZFt3b3JkLmxlbmd0aC0xXSA9PSAnLScgdGhlbiBmYWxzZSBcbiAgICAgICAgICAgIHdoZW4gd29yZFswXSA9PSAnXycgYW5kIHdvcmQubGVuZ3RoIDwgNCB0aGVuIGZhbHNlICMgZXhjbHVkZSB3aGVuIHN0YXJ0cyB3aXRoIHVuZGVyc2NvcmUgYW5kIGlzIHNob3J0XG4gICAgICAgICAgICB3aGVuIC9eWzBcXF9cXC1cXEBcXCNdKyQvLnRlc3Qgd29yZCB0aGVuIGZhbHNlICMgZXhjbHVkZSB3aGVuIGNvbnNpc3Qgb2Ygc3BlY2lhbCBjaGFyYWN0ZXJzIG9ubHlcbiAgICAgICAgICAgIHdoZW4gL1xcZC8udGVzdCB3b3JkIHRoZW4gZmFsc2UgIyBleGNsdWRlIHdoZW4gd29yZCBjb250YWlucyBudW1iZXJcbiAgICAgICAgICAgIGVsc2UgdHJ1ZVxuICAgICAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgQDogKCkgLT5cbiAgICAgICAgXG4gICAgICAgIHBvc3Qub25HZXQgJ2luZGV4ZXInIEBvbkdldFxuICAgICAgICBwb3N0Lm9uICdzb3VyY2VJbmZvRm9yRmlsZScgQG9uU291cmNlSW5mb0ZvckZpbGVcbiAgICAgICAgXG4gICAgICAgIHBvc3Qub24gJ2ZpbGVTYXZlZCcgICAgKGZpbGUsIHdpbklEKSA9PiBAaW5kZXhGaWxlIGZpbGUsIHJlZnJlc2g6IHRydWVcbiAgICAgICAgcG9zdC5vbiAnZGlyTG9hZGVkJyAgICAoZGlyKSAgICAgICAgID0+IEBpbmRleFByb2plY3QgZGlyXG4gICAgICAgIHBvc3Qub24gJ2ZpbGVMb2FkZWQnICAgKGZpbGUsIHdpbklEKSA9PiBcbiAgICAgICAgICAgIEBpbmRleEZpbGUgZmlsZVxuICAgICAgICAgICAgQGluZGV4UHJvamVjdCBmaWxlXG4gICAgICAgIFxuICAgICAgICBAY29sbGVjdEJpbnMoKVxuICAgIFxuICAgICAgICBAaW1hZ2VFeHRlbnNpb25zID0gWydwbmcnICdqcGcnICdnaWYnICd0aWZmJyAncHhtJyAnaWNucyddICAgICAgICBcblxuICAgICAgICBAZGlycyAgICA9IE9iamVjdC5jcmVhdGUgbnVsbFxuICAgICAgICBAZmlsZXMgICA9IE9iamVjdC5jcmVhdGUgbnVsbFxuICAgICAgICBAY2xhc3NlcyA9IE9iamVjdC5jcmVhdGUgbnVsbFxuICAgICAgICBAZnVuY3MgICA9IE9iamVjdC5jcmVhdGUgbnVsbFxuICAgICAgICBAd29yZHMgICA9IE9iamVjdC5jcmVhdGUgbnVsbFxuICAgICAgICBAd2Fsa2VyICA9IG51bGxcbiAgICAgICAgQHF1ZXVlICAgPSBbXVxuICAgICAgICBcbiAgICAgICAgQGluZGV4ZWRQcm9qZWN0cyA9IFtdXG5cbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgb25HZXQ6IChrZXksIGZpbHRlci4uLikgPT5cbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCBrZXlcbiAgICAgICAgICAgIHdoZW4gJ2NvdW50cydcbiAgICAgICAgICAgICAgICByZXR1cm4gXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzZXM6IEBjbGFzc2VzLmxlbmd0aCA/IDBcbiAgICAgICAgICAgICAgICAgICAgZmlsZXM6ICAgQGZpbGVzLmxlbmd0aCA/IDBcbiAgICAgICAgICAgICAgICAgICAgZnVuY3M6ICAgQGZ1bmNzLmxlbmd0aCA/IDBcbiAgICAgICAgICAgICAgICAgICAgd29yZHM6ICAgQHdvcmRzLmxlbmd0aCA/IDBcbiAgICAgICAgICAgICAgICAgICAgZGlyczogICAgQGRpcnMubGVuZ3RoID8gMFxuICAgICAgICAgICAgd2hlbiAnZmlsZSdcbiAgICAgICAgICAgICAgICByZXR1cm4gQGZpbGVzW2ZpbHRlclswXV1cbiAgICAgICAgICAgIHdoZW4gJ3Byb2plY3QnXG4gICAgICAgICAgICAgICAgcmV0dXJuIEBwcm9qZWN0SW5mbyBmaWx0ZXJbMF1cbiAgICAgICAgXG4gICAgICAgIHZhbHVlID0gQFtrZXldXG4gICAgICAgIGlmIG5vdCBlbXB0eSBmaWx0ZXJcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgbmFtZXMgPSBfLmZpbHRlciBmaWx0ZXIsIChjKSAtPiBub3QgZW1wdHkgY1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBub3QgZW1wdHkgbmFtZXNcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBuYW1lcyA9IG5hbWVzLm1hcCAoYykgLT4gYz8udG9Mb3dlckNhc2UoKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHZhbHVlID0gXy5waWNrQnkgdmFsdWUsICh2YWx1ZSwga2V5KSAtPlxuICAgICAgICAgICAgICAgICAgICBmb3IgY24gaW4gbmFtZXNcbiAgICAgICAgICAgICAgICAgICAgICAgIGxjID0ga2V5LnRvTG93ZXJDYXNlKClcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIGNuLmxlbmd0aD4xIGFuZCBsYy5pbmRleE9mKGNuKT49MCBvciBsYy5zdGFydHNXaXRoKGNuKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIHZhbHVlXG4gICAgICAgIFxuICAgIG9uU291cmNlSW5mb0ZvckZpbGU6IChvcHQpID0+XG4gICAgICAgIFxuICAgICAgICBmaWxlID0gb3B0Lml0ZW0uZmlsZVxuICAgICAgICBpZiBAZmlsZXNbZmlsZV0/XG4gICAgICAgICAgICBwb3N0LnRvV2luIG9wdC53aW5JRCwgJ3NvdXJjZUluZm9Gb3JGaWxlJyBAZmlsZXNbZmlsZV0sIG9wdFxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBjb2xsZWN0QmluczogLT5cbiAgICAgICAgXG4gICAgICAgIEBiaW5zID0gW11cbiAgICAgICAgcmV0dXJuIGlmIHNsYXNoLndpbigpXG4gICAgICAgIFxuICAgICAgICBmb3IgZGlyIGluIFsnL2JpbicgJy91c3IvYmluJyAnL3Vzci9sb2NhbC9iaW4nXVxuICAgICAgICAgICAgdyA9IG5ldyBXYWxrZXJcbiAgICAgICAgICAgICAgICBtYXhGaWxlczogICAgMTAwMFxuICAgICAgICAgICAgICAgIHJvb3Q6ICAgICAgICBkaXJcbiAgICAgICAgICAgICAgICBpbmNsdWRlRGlyczogZmFsc2VcbiAgICAgICAgICAgICAgICBpbmNsdWRlRXh0OiAgWycnXSAjIHJlcG9ydCBmaWxlcyB3aXRob3V0IGV4dGVuc2lvblxuICAgICAgICAgICAgICAgIGZpbGU6ICAgICAgICAocCkgPT4gQGJpbnMucHVzaCBzbGFzaC5iYXNlbmFtZSBwXG4gICAgICAgICAgICB3LnN0YXJ0KClcblxuICAgIGNvbGxlY3RQcm9qZWN0czogLT5cblxuICAgICAgICBAcHJvamVjdHMgPSB7fVxuICAgICAgICB3ID0gbmV3IFdhbGtlclxuICAgICAgICAgICAgbWF4RmlsZXM6ICAgIDUwMDBcbiAgICAgICAgICAgIG1heERlcHRoOiAgICAzXG4gICAgICAgICAgICByb290OiAgICAgICAgc2xhc2gucmVzb2x2ZSAnfidcbiAgICAgICAgICAgIGluY2x1ZGU6ICAgICBbJy5naXQnXVxuICAgICAgICAgICAgaWdub3JlOiAgICAgIFsnbm9kZV9tb2R1bGVzJyAnaW1nJyAnYmluJyAnanMnICdMaWJyYXJ5J11cbiAgICAgICAgICAgIHNraXBEaXI6ICAgICAocCkgLT4gc2xhc2guYmFzZShwKSA9PSAnLmdpdCdcbiAgICAgICAgICAgIGZpbHRlcjogICAgICAocCkgLT4gc2xhc2guZXh0KHApIG5vdCBpbiBbJ25vb24nICdqc29uJyAnZ2l0JyAnJ11cbiAgICAgICAgICAgIGRpcjogICAgICAgICAocCkgPT4gaWYgc2xhc2guZmlsZShwKSA9PSAnLmdpdCcgICAgdGhlbiBAcHJvamVjdHNbc2xhc2guYmFzZSBzbGFzaC5kaXIgcF0gPSBkaXI6IHNsYXNoLnRpbGRlIHNsYXNoLmRpciBwXG4gICAgICAgICAgICBmaWxlOiAgICAgICAgKHApID0+IGlmIHNsYXNoLmJhc2UocCkgPT0gJ3BhY2thZ2UnIHRoZW4gQHByb2plY3RzW3NsYXNoLmJhc2Ugc2xhc2guZGlyIHBdID0gZGlyOiBzbGFzaC50aWxkZSBzbGFzaC5kaXIgcFxuICAgICAgICAgICAgZG9uZTogICAgICAgID0+IGxvZyAnY29sbGVjdFByb2plY3RzIGRvbmUnIEBwcm9qZWN0c1xuICAgICAgICB3LnN0YXJ0KClcblxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgICAgICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAgICAwMDAgICAgICAgIDAwMCAgMDAwMDAwMCAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBwcm9qZWN0SW5mbzogKHBhdGgpIC0+XG4gICAgICAgIFxuICAgICAgICBmb3IgcHJvamVjdCBpbiBAaW5kZXhlZFByb2plY3RzXG4gICAgICAgICAgICBpZiBzbGFzaC5zYW1lUGF0aChwcm9qZWN0LmRpciwgcGF0aCkgb3IgcGF0aC5zdGFydHNXaXRoIHByb2plY3QuZGlyICsgJy8nXG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb2plY3RcbiAgICAgICAge31cbiAgICBcbiAgICBpbmRleFByb2plY3Q6IChmaWxlKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgQGN1cnJlbnRseUluZGV4aW5nXG4gICAgICAgICAgICBAaW5kZXhRdWV1ZSA/PSBbXVxuICAgICAgICAgICAgaWYgZmlsZSBub3QgaW4gQGluZGV4UXVldWVcbiAgICAgICAgICAgICAgICBAaW5kZXhRdWV1ZS5wdXNoIGZpbGVcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICBcbiAgICAgICAgZmlsZSA9IHNsYXNoLnJlc29sdmUgZmlsZSBcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiB2YWxpZCBAcHJvamVjdEluZm8gZmlsZVxuICAgICAgICAgICAgICBcbiAgICAgICAgQGN1cnJlbnRseUluZGV4aW5nID0gZmlsZVxuICAgICAgICBcbiAgICAgICAgZm9ya2Z1bmMgXCIje19fZGlybmFtZX0vaW5kZXhwcmpcIiBmaWxlLCAoZXJyLCBpbmZvKSA9PlxuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4ga2Vycm9yICdpbmRleGluZyBmYWlsZWQnIGVyciBpZiB2YWxpZCBlcnJcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZGVsZXRlIEBjdXJyZW50bHlJbmRleGluZ1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBpbmZvXG4gICAgICAgICAgICAgICAgQGluZGV4ZWRQcm9qZWN0cy5wdXNoIGluZm8gXG4gICAgICAgICAgICAgICAgcG9zdC50b1dpbnMgJ3Byb2plY3RJbmRleGVkJyBpbmZvXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGRvU2hpZnQgPSBlbXB0eSBAcXVldWVcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgdmFsaWQgaW5mby5maWxlc1xuICAgICAgICAgICAgICAgIEBxdWV1ZSA9IEBxdWV1ZS5jb25jYXQgaW5mby5maWxlc1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgdmFsaWQgQGluZGV4UXVldWVcbiAgICAgICAgICAgICAgICBAaW5kZXhQcm9qZWN0IEBpbmRleFF1ZXVlLnNoaWZ0KClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIEBzaGlmdFF1ZXVlKCkgaWYgZG9TaGlmdFxuICAgICAgICAgICAgICAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAwMDAgICAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAwMCAgICAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgMDAwICAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAgIDAwMCAgIDAwMFxuXG4gICAgaW5kZXhEaXI6IChkaXIpIC0+XG5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCBkaXI/IG9yIEBkaXJzW2Rpcl0/XG4gICAgICAgIFxuICAgICAgICBAZGlyc1tkaXJdID1cbiAgICAgICAgICAgIG5hbWU6IHNsYXNoLmJhc2VuYW1lIGRpclxuXG4gICAgICAgIHdvcHQgPVxuICAgICAgICAgICAgcm9vdDogICAgICAgIGRpclxuICAgICAgICAgICAgaW5jbHVkZURpcjogIGRpclxuICAgICAgICAgICAgaW5jbHVkZURpcnM6IHRydWVcbiAgICAgICAgICAgIGRpcjogICAgICAgICBAb25XYWxrZXJEaXJcbiAgICAgICAgICAgIGZpbGU6ICAgICAgICBAb25XYWxrZXJGaWxlXG4gICAgICAgICAgICBtYXhEZXB0aDogICAgMTJcbiAgICAgICAgICAgIG1heEZpbGVzOiAgICAxMDAwMDBcbiAgICAgICAgICAgIGRvbmU6ICAgICAgICAodykgPT4gXG4gICAgICAgICAgICAgICAgQHNoaWZ0UXVldWVcblxuICAgICAgICBAd2Fsa2VyID0gbmV3IFdhbGtlciB3b3B0XG4gICAgICAgIEB3YWxrZXIuY2ZnLmlnbm9yZS5wdXNoICdqcydcbiAgICAgICAgQHdhbGtlci5zdGFydCgpXG5cbiAgICBvbldhbGtlckRpcjogKHAsIHN0YXQpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBub3QgQGRpcnNbcF0/XG4gICAgICAgICAgICBAZGlyc1twXSA9XG4gICAgICAgICAgICAgICAgbmFtZTogc2xhc2guYmFzZW5hbWUgcFxuXG4gICAgb25XYWxrZXJGaWxlOiAocCwgc3RhdCkgPT5cbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBAZmlsZXNbcF0/IGFuZCBAcXVldWUuaW5kZXhPZihwKSA8IDBcbiAgICAgICAgICAgIGlmIHN0YXQuc2l6ZSA8IDY1NDMyMSAjIG9idmlvdXNseSBzb21lIGFyYml0cmFyeSBudW1iZXIgOilcbiAgICAgICAgICAgICAgICBAcXVldWUucHVzaCBwXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgbG9nIFwid2FybmluZyEgZmlsZSAje3B9IHRvbyBsYXJnZT8gI3tzdGF0LnNpemV9LiBza2lwcGluZyBpbmRleGluZyFcIlxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgICAgMDAwICAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgXG5cbiAgICBhZGRGdW5jSW5mbzogKGZ1bmNOYW1lLCBmdW5jSW5mbykgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBmdW5jTmFtZVxuICAgICAgICAgICAga2xvZyBcImFkZEZ1bmNJbmZvICN7ZnVuY05hbWV9XCIgZnVuY0luZm9cbiAgICAgICAgXG4gICAgICAgIGlmIGZ1bmNOYW1lLmxlbmd0aCA+IDEgYW5kIGZ1bmNOYW1lLnN0YXJ0c1dpdGggJ0AnXG4gICAgICAgICAgICBmdW5jTmFtZSA9IGZ1bmNOYW1lLnNsaWNlIDFcbiAgICAgICAgICAgIGZ1bmNJbmZvLnN0YXRpYyA9IHRydWVcbiAgICAgICAgICAgIFxuICAgICAgICBmdW5jSW5mby5uYW1lID0gZnVuY05hbWVcbiAgICAgICAgXG4gICAgICAgIGZ1bmNJbmZvcyA9IEBmdW5jc1tmdW5jTmFtZV0gPyBbXVxuICAgICAgICBmdW5jSW5mb3MucHVzaCBmdW5jSW5mb1xuICAgICAgICBAZnVuY3NbZnVuY05hbWVdID0gZnVuY0luZm9zXG4gICAgICAgIFxuICAgICAgICBmdW5jSW5mb1xuXG4gICAgYWRkTWV0aG9kOiAoY2xhc3NOYW1lLCBmdW5jTmFtZSwgZmlsZSwgbGkpIC0+XG5cbiAgICAgICAgZnVuY0luZm8gPSBAYWRkRnVuY0luZm8gZnVuY05hbWUsXG4gICAgICAgICAgICBsaW5lOiAgbGkrMVxuICAgICAgICAgICAgZmlsZTogIGZpbGVcbiAgICAgICAgICAgIGNsYXNzOiBjbGFzc05hbWVcblxuICAgICAgICBfLnNldCBAY2xhc3NlcywgXCIje2NsYXNzTmFtZX0ubWV0aG9kcy4je2Z1bmNJbmZvLm5hbWV9XCIgZnVuY0luZm9cblxuICAgICAgICBmdW5jSW5mb1xuXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwIDAwMCAgIDAwMDAwMDAgICAgICAgICAwMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgICAgIDAgICAgICAwMDAwMDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcblxuICAgIHJlbW92ZUZpbGU6IChmaWxlKSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAZmlsZXNbZmlsZV0/XG4gICAgICAgIFxuICAgICAgICBmb3IgbmFtZSxpbmZvcyBvZiBAZnVuY3NcbiAgICAgICAgICAgIF8ucmVtb3ZlIGluZm9zLCAodikgLT4gdi5maWxlID09IGZpbGVcbiAgICAgICAgICAgIGRlbGV0ZSBAZnVuY3NbbmFtZV0gaWYgbm90IGluZm9zLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgQGNsYXNzZXMgPSBfLm9taXRCeSBAY2xhc3NlcywgKHYpIC0+IHYuZmlsZSA9PSBmaWxlXG4gICAgICAgIFxuICAgICAgICBkZWxldGUgQGZpbGVzW2ZpbGVdXG5cbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgICAgIDAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAwMDAgICAgICAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgIDAwMDAwICAgICAgICAgIDAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwIDAwMCAgICAgICAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcblxuICAgIGluZGV4RmlsZTogKGZpbGUsIG9wdCkgLT5cbiAgICAgICAgXG4gICAgICAgICMga2xvZyAnaW5kZXhGaWxlJyBmaWxlXG4gICAgICAgIFxuICAgICAgICBAcmVtb3ZlRmlsZSBmaWxlIGlmIG9wdD8ucmVmcmVzaFxuXG4gICAgICAgIGlmIEBmaWxlc1tmaWxlXT9cbiAgICAgICAgICAgIHJldHVybiBAc2hpZnRRdWV1ZSgpXG5cbiAgICAgICAgZmlsZUV4dCA9IHNsYXNoLmV4dCBmaWxlIFxuXG4gICAgICAgIGlmIGZpbGVFeHQgaW4gQGltYWdlRXh0ZW5zaW9uc1xuICAgICAgICAgICAgQGZpbGVzW2ZpbGVdID0ge31cbiAgICAgICAgICAgIHJldHVybiBAc2hpZnRRdWV1ZSgpXG4gICAgICAgICAgICBcbiAgICAgICAgaXNDcHAgPSBmaWxlRXh0IGluIFsnY3BwJyAnY2MnICdjJyAnZnJhZycgJ3ZlcnQnXVxuICAgICAgICBpc0hwcCA9IGZpbGVFeHQgaW4gWydocHAnICdoJyBdXG5cbiAgICAgICAgc2xhc2gucmVhZFRleHQgZmlsZSwgKHRleHQpID0+XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGxpbmVzID0gdGV4dC5zcGxpdCAvXFxyP1xcbi9cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZmlsZUluZm8gPVxuICAgICAgICAgICAgICAgIGxpbmVzOiBsaW5lcy5sZW5ndGhcbiAgICAgICAgICAgICAgICBmdW5jczogW11cbiAgICAgICAgICAgICAgICBjbGFzc2VzOiBbXVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgZnVuY0FkZGVkID0gZmFsc2VcbiAgICAgICAgICAgIGZ1bmNTdGFjayA9IFtdXG4gICAgICAgICAgICBjdXJyZW50Q2xhc3MgPSBudWxsXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIGlzSHBwIG9yIGlzQ3BwXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaW5kZXhIcHAgPSBuZXcgSW5kZXhIcHBcbiAgICAgICAgICAgICAgICBwYXJzZWQgPSBpbmRleEhwcC5wYXJzZSB0ZXh0XG4gICAgICAgICAgICAgICAgZnVuY0FkZGVkID0gbm90IGVtcHR5KHBhcnNlZC5jbGFzc2VzKSBvciBub3QgZW1wdHkocGFyc2VkLmZ1bmNzKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGZvciBjbHNzIGluIHBhcnNlZC5jbGFzc2VzXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBfLnNldCBAY2xhc3NlcywgXCIje2Nsc3MubmFtZX0uZmlsZVwiIGZpbGVcbiAgICAgICAgICAgICAgICAgICAgXy5zZXQgQGNsYXNzZXMsIFwiI3tjbHNzLm5hbWV9LmxpbmVcIiBjbHNzLmxpbmUrMVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgZmlsZUluZm8uY2xhc3Nlcy5wdXNoIFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogY2xzcy5uYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICBsaW5lOiBjbHNzLmxpbmUrMVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZm9yIGZ1bmMgaW4gcGFyc2VkLmZ1bmNzXG4gICAgICAgICAgICAgICAgICAgIGZ1bmNJbmZvID0gQGFkZE1ldGhvZCBmdW5jLmNsYXNzLCBmdW5jLm1ldGhvZCwgZmlsZSwgZnVuYy5saW5lXG4gICAgICAgICAgICAgICAgICAgIGZpbGVJbmZvLmZ1bmNzLnB1c2ggZnVuY0luZm9cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgZm9yIGxpIGluIFswLi4ubGluZXMubGVuZ3RoXVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgbGluZSA9IGxpbmVzW2xpXVxuICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiBsaW5lLnRyaW0oKS5sZW5ndGggIyBpZ25vcmluZyBlbXB0eSBsaW5lc1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRlbnQgPSBsaW5lLnNlYXJjaCAvXFxTL1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgZnVuY1N0YWNrLmxlbmd0aCBhbmQgaW5kZW50IDw9IF8ubGFzdChmdW5jU3RhY2spWzBdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXy5sYXN0KGZ1bmNTdGFjaylbMV0ubGFzdCA9IGxpIC0gMVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmNJbmZvID0gZnVuY1N0YWNrLnBvcCgpWzFdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY0luZm8uY2xhc3MgPz0gc2xhc2guYmFzZSBmaWxlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZUluZm8uZnVuY3MucHVzaCBmdW5jSW5mbyBcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIGN1cnJlbnRDbGFzcz8gXG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIyAwMCAgICAgMDAgIDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAwMDAwMDAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgMDAwMDAwMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIyAwMDAgMCAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDBcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBtZXRob2ROYW1lID0gSW5kZXhlci5tZXRob2ROYW1lSW5MaW5lIGxpbmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY0luZm8gPSBAYWRkTWV0aG9kIGN1cnJlbnRDbGFzcywgbWV0aG9kTmFtZSwgZmlsZSwgbGlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY1N0YWNrLnB1c2ggW2luZGVudCwgZnVuY0luZm9dXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmNBZGRlZCA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIyAwMDAgICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDBcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50Q2xhc3MgPSBudWxsIGlmIGluZGVudCA8IDIgIyB3YXMgNFxuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIGZ1bmNOYW1lID0gSW5kZXhlci5mdW5jTmFtZUluTGluZSBsaW5lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmNJbmZvID0gQGFkZEZ1bmNJbmZvIGZ1bmNOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGluZTogbGkrMVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZTogZmlsZVxuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jU3RhY2sucHVzaCBbaW5kZW50LCBmdW5jSW5mb11cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY0FkZGVkID0gdHJ1ZVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBmdW5jTmFtZSA9IEluZGV4ZXIucG9zdE5hbWVJbkxpbmUgbGluZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jSW5mbyA9IEBhZGRGdW5jSW5mbyBmdW5jTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbmU6IGxpKzFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGU6IGZpbGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc3Q6IHRydWVcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY1N0YWNrLnB1c2ggW2luZGVudCwgZnVuY0luZm9dXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmNBZGRlZCA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbSA9IGxpbmUubWF0Y2ggSW5kZXhlci50ZXN0UmVnRXhwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgbT9bMl0/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmNJbmZvID0gQGFkZEZ1bmNJbmZvIG1bMl0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5lOiBsaSsxXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlOiBmaWxlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXN0OiBtWzFdXG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmNTdGFjay5wdXNoIFtpbmRlbnQsIGZ1bmNJbmZvXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jQWRkZWQgPSB0cnVlXG4gICAgXG4gICAgICAgICAgICAgICAgICAgIHdvcmRzID0gbGluZS5zcGxpdCBJbmRleGVyLnNwbGl0UmVnRXhwXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBmb3Igd29yZCBpbiB3b3Jkc1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBJbmRleGVyLnRlc3RXb3JkIHdvcmRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfLnVwZGF0ZSBAd29yZHMsIFwiI3t3b3JkfS5jb3VudFwiLCAobikgLT4gKG4gPyAwKSArIDFcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIHN3aXRjaCB3b3JkXG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIyAgMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgICAgICAwMDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAjICAwMDAwMDAwICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2hlbiAnY2xhc3MnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBjbGFzc05hbWUgPSBJbmRleGVyLmNsYXNzTmFtZUluTGluZSBsaW5lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50Q2xhc3MgPSBjbGFzc05hbWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF8uc2V0IEBjbGFzc2VzLCBcIiN7Y2xhc3NOYW1lfS5maWxlXCIgZmlsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXy5zZXQgQGNsYXNzZXMsIFwiI3tjbGFzc05hbWV9LmxpbmVcIiBsaSsxXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVJbmZvLmNsYXNzZXMucHVzaCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBjbGFzc05hbWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5lOiBsaSsxXG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwIDAwIDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwIDAwICAgMDAwMDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoZW4gJ3JlcXVpcmUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtID0gbGluZS5tYXRjaCBJbmRleGVyLnJlcXVpcmVSZWdFeHBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgbT9bMV0/IGFuZCBtWzJdP1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgciA9IGZpbGVJbmZvLnJlcXVpcmUgPyBbXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgci5wdXNoIFttWzFdLCBtWzJdXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZUluZm8ucmVxdWlyZSA9IHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFic3BhdGggPSBzbGFzaC5yZXNvbHZlIHNsYXNoLmpvaW4gc2xhc2guZGlyKGZpbGUpLCBtWzJdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhYnNwYXRoICs9ICcuY29mZmVlJyAjIGZpeG1lIGZvciBrb2RlIVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1bMl1bMF0gPT0gJy4nKSBhbmQgKG5vdCBAZmlsZXNbYWJzcGF0aF0/KSBhbmQgKEBxdWV1ZS5pbmRleE9mKGFic3BhdGgpIDwgMClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBzbGFzaC5pc0ZpbGUgYWJzcGF0aFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBAcXVldWUucHVzaCBhYnNwYXRoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgZnVuY0FkZGVkXG5cbiAgICAgICAgICAgICAgICB3aGlsZSBmdW5jU3RhY2subGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgIF8ubGFzdChmdW5jU3RhY2spWzFdLmxhc3QgPSBsaSAtIDFcbiAgICAgICAgICAgICAgICAgICAgZnVuY0luZm8gPSBmdW5jU3RhY2sucG9wKClbMV1cbiAgICAgICAgICAgICAgICAgICAgZnVuY0luZm8uY2xhc3MgPz0gc2xhc2guYmFzZSBmdW5jSW5mby5maWxlXG4gICAgICAgICAgICAgICAgICAgIGZ1bmNJbmZvLmNsYXNzID89IHNsYXNoLmJhc2UgZmlsZVxuICAgICAgICAgICAgICAgICAgICBmaWxlSW5mby5mdW5jcy5wdXNoIGZ1bmNJbmZvXG5cbiAgICAgICAgICAgICAgICBpZiBvcHQ/LnBvc3QgIT0gZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgcG9zdC50b1dpbnMgJ2NsYXNzZXNDb3VudCcgXy5zaXplIEBjbGFzc2VzXG4gICAgICAgICAgICAgICAgICAgIHBvc3QudG9XaW5zICdmdW5jc0NvdW50JyAgIF8uc2l6ZSBAZnVuY3NcbiAgICAgICAgICAgICAgICAgICAgcG9zdC50b1dpbnMgJ2ZpbGVJbmRleGVkJyAgZmlsZSwgZmlsZUluZm9cblxuICAgICAgICAgICAgQGZpbGVzW2ZpbGVdID0gZmlsZUluZm9cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgb3B0Py5wb3N0ICE9IGZhbHNlXG4gICAgICAgICAgICAgICAgcG9zdC50b1dpbnMgJ2ZpbGVzQ291bnQnIF8uc2l6ZSBAZmlsZXNcblxuICAgICAgICAgICAgQHNoaWZ0UXVldWUoKVxuICAgICAgICBAXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAwMDAwMDAgICAgICAgMDAwICAgICBcbiAgICAjICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuICAgIFxuICAgIHNoaWZ0UXVldWU6ID0+XG4gICAgICAgIFxuICAgICAgICBpZiBAcXVldWUubGVuZ3RoXG4gICAgICAgICAgICBmaWxlID0gQHF1ZXVlLnNoaWZ0KClcbiAgICAgICAgICAgIEBpbmRleEZpbGUgZmlsZVxuXG5tb2R1bGUuZXhwb3J0cyA9IEluZGV4ZXJcbiJdfQ==
//# sourceURL=../../coffee/main/indexer.coffee