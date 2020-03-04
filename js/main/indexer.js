// koffee 1.11.0

/*
000  000   000  0000000    00000000  000   000  00000000  00000000
000  0000  000  000   000  000        000 000   000       000   000
000  000 0 000  000   000  0000000     00000    0000000   0000000
000  000  0000  000   000  000        000 000   000       000   000
000  000   000  0000000    00000000  000   000  00000000  000   000
 */
var IndexHpp, Indexer, Walker, _, empty, filter, forkfunc, fs, kerror, klog, matchr, post, ref, slash, valid,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    slice = [].slice,
    indexOf = [].indexOf;

ref = require('kxk'), _ = ref._, empty = ref.empty, filter = ref.filter, fs = ref.fs, kerror = ref.kerror, klog = ref.klog, matchr = ref.matchr, post = ref.post, slash = ref.slash, valid = ref.valid;

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXhlci5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvbWFpbiIsInNvdXJjZXMiOlsiaW5kZXhlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsd0dBQUE7SUFBQTs7OztBQVFBLE1BQXFFLE9BQUEsQ0FBUSxLQUFSLENBQXJFLEVBQUUsU0FBRixFQUFLLGlCQUFMLEVBQVksbUJBQVosRUFBb0IsV0FBcEIsRUFBd0IsbUJBQXhCLEVBQWdDLGVBQWhDLEVBQXNDLG1CQUF0QyxFQUE4QyxlQUE5QyxFQUFvRCxpQkFBcEQsRUFBMkQ7O0FBRTNELE1BQUEsR0FBVyxPQUFBLENBQVEsaUJBQVI7O0FBQ1gsUUFBQSxHQUFXLE9BQUEsQ0FBUSxtQkFBUjs7QUFDWCxRQUFBLEdBQVcsT0FBQSxDQUFRLFlBQVI7O0FBRUw7SUFFRixPQUFDLENBQUEsYUFBRCxHQUFtQjs7SUFDbkIsT0FBQyxDQUFBLGFBQUQsR0FBbUI7O0lBRW5CLE9BQUMsQ0FBQSxZQUFELEdBQW1COztJQUVuQixPQUFDLENBQUEsVUFBRCxHQUFtQjs7SUFDbkIsT0FBQyxDQUFBLFVBQUQsR0FBbUI7O0lBQ25CLE9BQUMsQ0FBQSxVQUFELEdBQW1COztJQUNuQixPQUFDLENBQUEsV0FBRCxHQUFtQixJQUFJLE1BQUosQ0FBVyxlQUFYLEVBQTRCLEdBQTVCOztJQUNuQixPQUFDLENBQUEsV0FBRCxHQUFtQjs7SUFFbkIsT0FBQyxDQUFBLGVBQUQsR0FBa0IsU0FBQyxJQUFEO0FBRWQsWUFBQTtRQUFBLENBQUEsR0FBSSxJQUFJLENBQUMsS0FBTCxDQUFXLE9BQU8sQ0FBQyxXQUFuQjsyQkFDSixDQUFHLENBQUEsQ0FBQTtJQUhXOztJQUtsQixPQUFDLENBQUEsZ0JBQUQsR0FBbUIsU0FBQyxJQUFEO0FBRWYsWUFBQTtRQUFBLENBQUEsR0FBSSxJQUFJLENBQUMsS0FBTCxDQUFXLE9BQU8sQ0FBQyxZQUFuQjtRQUNKLElBQUcsU0FBSDtZQUNJ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QUVmLG1CQUFHLEdBQUcsQ0FBRSxjQUFMLEtBQWEsS0FBaEI7b0JBQ0ksSUFBSSxDQUFDLE1BQUwsQ0FBWSxZQUFaLEVBQXlCLENBQUMsQ0FBQyxJQUFGLENBQU8sS0FBQyxDQUFBLEtBQVIsQ0FBekIsRUFESjs7dUJBR0EsS0FBQyxDQUFBLFVBQUQsQ0FBQTtZQWxLcUI7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXpCO2VBbUtBO0lBbkxPOztzQkEyTFgsVUFBQSxHQUFZLFNBQUE7QUFFUixZQUFBO1FBQUEsSUFBRyxJQUFDLENBQUEsS0FBSyxDQUFDLE1BQVY7WUFDSSxJQUFBLEdBQU8sSUFBQyxDQUFBLEtBQUssQ0FBQyxLQUFQLENBQUE7bUJBQ1AsSUFBQyxDQUFBLFNBQUQsQ0FBVyxJQUFYLEVBRko7O0lBRlE7Ozs7OztBQU1oQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwXG4wMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgMDAwXG4wMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMFxuMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgICAgIDAwMCAgIDAwMFxuMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgXywgZW1wdHksIGZpbHRlciwgZnMsIGtlcnJvciwga2xvZywgbWF0Y2hyLCBwb3N0LCBzbGFzaCwgdmFsaWQgfSA9IHJlcXVpcmUgJ2t4aydcblxuV2Fsa2VyICAgPSByZXF1aXJlICcuLi90b29scy93YWxrZXInXG5mb3JrZnVuYyA9IHJlcXVpcmUgJy4uL3Rvb2xzL2ZvcmtmdW5jJ1xuSW5kZXhIcHAgPSByZXF1aXJlICcuL2luZGV4aHBwJ1xuXG5jbGFzcyBJbmRleGVyXG5cbiAgICBAcmVxdWlyZVJlZ0V4cCAgID0gL15cXHMqKFtcXHdcXHtcXH1dKylcXHMrPVxccytyZXF1aXJlXFxzK1tcXCdcXFwiXShbXFwuXFwvXFx3XSspW1xcJ1xcXCJdL1xuICAgIEBpbmNsdWRlUmVnRXhwICAgPSAvXiNpbmNsdWRlXFxzK1tcXFwiXFw8XShbXFwuXFwvXFx3XSspW1xcXCJcXD5dL1xuICAgICMgQG1ldGhvZFJlZ0V4cCAgICA9IC9eXFxzKyhbXFxAXT9cXHcrKVxccypcXDpcXHMqKFxcKC4qXFwpKT9cXHMqWz0tXVxcPi9cbiAgICBAbWV0aG9kUmVnRXhwICAgID0gL15cXHMrKFtcXEBdP1xcdyt8QClcXHMqXFw6XFxzKihcXCguKlxcKSk/XFxzKls9LV1cXD4vXG4gICAgIyBAZnVuY1JlZ0V4cCAgICAgID0gL15cXHMqKFtcXHdcXC5dKylcXHMqW1xcOlxcPV1cXHMqKFxcKC4qXFwpKT9cXHMqWz0tXVxcPi9cbiAgICBAZnVuY1JlZ0V4cCAgICAgID0gL15cXHMqKFtcXHdcXC5dKylcXHMqW1xcOlxcPV1bXlxcKFxcKV0qKFxcKC4qXFwpKT9cXHMqWz0tXVxcPi9cbiAgICBAcG9zdFJlZ0V4cCAgICAgID0gL15cXHMqcG9zdFxcLm9uXFxzK1tcXCdcXFwiXShcXHcrKVtcXCdcXFwiXVxccypcXCw/XFxzKihcXCguKlxcKSk/XFxzKls9LV1cXD4vXG4gICAgQHRlc3RSZWdFeHAgICAgICA9IC9eXFxzKihkZXNjcmliZXxpdClcXHMrW1xcJ1xcXCJdKC4rKVtcXCdcXFwiXVxccypcXCw/XFxzKihcXChbXlxcKV0qXFwpKT9cXHMqWz0tXVxcPi9cbiAgICBAc3BsaXRSZWdFeHAgICAgID0gbmV3IFJlZ0V4cCBcIlteXFxcXHdcXFxcZFxcXFxfXStcIiwgJ2cnXG4gICAgQGNsYXNzUmVnRXhwICAgICA9IC9eKFxccypcXFMrXFxzKj0pP1xccypjbGFzc1xccysoXFx3KykvXG5cbiAgICBAY2xhc3NOYW1lSW5MaW5lOiAobGluZSkgLT5cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIG0gPSBsaW5lLm1hdGNoIEluZGV4ZXIuY2xhc3NSZWdFeHBcbiAgICAgICAgbT9bMl1cbiAgICAgICAgXG4gICAgQG1ldGhvZE5hbWVJbkxpbmU6IChsaW5lKSAtPlxuICAgICAgICBcbiAgICAgICAgbSA9IGxpbmUubWF0Y2ggSW5kZXhlci5tZXRob2RSZWdFeHBcbiAgICAgICAgaWYgbT9cbiAgICAgICAgICAgIHJncyA9IG1hdGNoci5yYW5nZXMgSW5kZXhlci5tZXRob2RSZWdFeHAsIGxpbmVcbiAgICAgICAgICAgIGlmIHJnc1swXS5zdGFydCA+IDExXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICAgbT9bMV1cbiAgICAgICAgXG4gICAgQGZ1bmNOYW1lSW5MaW5lOiAobGluZSkgLT5cblxuICAgICAgICBpZiBtID0gbGluZS5tYXRjaCBJbmRleGVyLmZ1bmNSZWdFeHBcbiAgICAgICAgICAgIHJncyA9IG1hdGNoci5yYW5nZXMgSW5kZXhlci5mdW5jUmVnRXhwLCBsaW5lXG4gICAgICAgICAgICBpZiByZ3NbMF0uc3RhcnQgPiA3XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICAgICAgIFxuICAgICAgICBtP1sxXVxuXG4gICAgQHBvc3ROYW1lSW5MaW5lOiAobGluZSkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIG0gPSBsaW5lLm1hdGNoIEluZGV4ZXIucG9zdFJlZ0V4cFxuICAgICAgICAgICAgcmdzID0gbWF0Y2hyLnJhbmdlcyBJbmRleGVyLnBvc3RSZWdFeHAsIGxpbmVcbiAgICAgICAgXG4gICAgICAgIG0/WzFdXG4gICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAwMDAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAgICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgXG4gICAgXG4gICAgQHRlc3RXb3JkOiAod29yZCkgLT5cbiAgICAgICAgXG4gICAgICAgIHN3aXRjaFxuICAgICAgICAgICAgd2hlbiB3b3JkLmxlbmd0aCA8IDMgdGhlbiBmYWxzZSAjIGV4Y2x1ZGUgd2hlbiB0b28gc2hvcnRcbiAgICAgICAgICAgIHdoZW4gd29yZFswXSBpbiBbJy0nLCBcIiNcIl0gdGhlbiBmYWxzZVxuICAgICAgICAgICAgd2hlbiB3b3JkW3dvcmQubGVuZ3RoLTFdID09ICctJyB0aGVuIGZhbHNlIFxuICAgICAgICAgICAgd2hlbiB3b3JkWzBdID09ICdfJyBhbmQgd29yZC5sZW5ndGggPCA0IHRoZW4gZmFsc2UgIyBleGNsdWRlIHdoZW4gc3RhcnRzIHdpdGggdW5kZXJzY29yZSBhbmQgaXMgc2hvcnRcbiAgICAgICAgICAgIHdoZW4gL15bMFxcX1xcLVxcQFxcI10rJC8udGVzdCB3b3JkIHRoZW4gZmFsc2UgIyBleGNsdWRlIHdoZW4gY29uc2lzdCBvZiBzcGVjaWFsIGNoYXJhY3RlcnMgb25seVxuICAgICAgICAgICAgd2hlbiAvXFxkLy50ZXN0IHdvcmQgdGhlbiBmYWxzZSAjIGV4Y2x1ZGUgd2hlbiB3b3JkIGNvbnRhaW5zIG51bWJlclxuICAgICAgICAgICAgZWxzZSB0cnVlXG4gICAgICAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgIDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICBAOiAoKSAtPlxuICAgICAgICBcbiAgICAgICAgcG9zdC5vbkdldCAnaW5kZXhlcicgQG9uR2V0XG4gICAgICAgIHBvc3Qub24gJ3NvdXJjZUluZm9Gb3JGaWxlJyBAb25Tb3VyY2VJbmZvRm9yRmlsZVxuICAgICAgICBcbiAgICAgICAgcG9zdC5vbiAnZmlsZVNhdmVkJyAgICAoZmlsZSwgd2luSUQpID0+IEBpbmRleEZpbGUgZmlsZSwgcmVmcmVzaDogdHJ1ZVxuICAgICAgICBwb3N0Lm9uICdkaXJMb2FkZWQnICAgIChkaXIpICAgICAgICAgPT4gQGluZGV4UHJvamVjdCBkaXJcbiAgICAgICAgcG9zdC5vbiAnZmlsZUxvYWRlZCcgICAoZmlsZSwgd2luSUQpID0+IFxuICAgICAgICAgICAgQGluZGV4RmlsZSBmaWxlXG4gICAgICAgICAgICBAaW5kZXhQcm9qZWN0IGZpbGVcbiAgICAgICAgXG4gICAgICAgIEBjb2xsZWN0QmlucygpXG4gICAgXG4gICAgICAgIEBpbWFnZUV4dGVuc2lvbnMgPSBbJ3BuZycgJ2pwZycgJ2dpZicgJ3RpZmYnICdweG0nICdpY25zJ10gICAgICAgIFxuXG4gICAgICAgIEBkaXJzICAgID0gT2JqZWN0LmNyZWF0ZSBudWxsXG4gICAgICAgIEBmaWxlcyAgID0gT2JqZWN0LmNyZWF0ZSBudWxsXG4gICAgICAgIEBjbGFzc2VzID0gT2JqZWN0LmNyZWF0ZSBudWxsXG4gICAgICAgIEBmdW5jcyAgID0gT2JqZWN0LmNyZWF0ZSBudWxsXG4gICAgICAgIEB3b3JkcyAgID0gT2JqZWN0LmNyZWF0ZSBudWxsXG4gICAgICAgIEB3YWxrZXIgID0gbnVsbFxuICAgICAgICBAcXVldWUgICA9IFtdXG4gICAgICAgIFxuICAgICAgICBAaW5kZXhlZFByb2plY3RzID0gW11cblxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBvbkdldDogKGtleSwgZmlsdGVyLi4uKSA9PlxuICAgICAgICBcbiAgICAgICAgc3dpdGNoIGtleVxuICAgICAgICAgICAgd2hlbiAnY291bnRzJ1xuICAgICAgICAgICAgICAgIHJldHVybiBcbiAgICAgICAgICAgICAgICAgICAgY2xhc3NlczogQGNsYXNzZXMubGVuZ3RoID8gMFxuICAgICAgICAgICAgICAgICAgICBmaWxlczogICBAZmlsZXMubGVuZ3RoID8gMFxuICAgICAgICAgICAgICAgICAgICBmdW5jczogICBAZnVuY3MubGVuZ3RoID8gMFxuICAgICAgICAgICAgICAgICAgICB3b3JkczogICBAd29yZHMubGVuZ3RoID8gMFxuICAgICAgICAgICAgICAgICAgICBkaXJzOiAgICBAZGlycy5sZW5ndGggPyAwXG4gICAgICAgICAgICB3aGVuICdmaWxlJ1xuICAgICAgICAgICAgICAgIHJldHVybiBAZmlsZXNbZmlsdGVyWzBdXVxuICAgICAgICAgICAgd2hlbiAncHJvamVjdCdcbiAgICAgICAgICAgICAgICByZXR1cm4gQHByb2plY3RJbmZvIGZpbHRlclswXVxuICAgICAgICBcbiAgICAgICAgdmFsdWUgPSBAW2tleV1cbiAgICAgICAgaWYgbm90IGVtcHR5IGZpbHRlclxuICAgICAgICAgICAgXG4gICAgICAgICAgICBuYW1lcyA9IF8uZmlsdGVyIGZpbHRlciwgKGMpIC0+IG5vdCBlbXB0eSBjXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIG5vdCBlbXB0eSBuYW1lc1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIG5hbWVzID0gbmFtZXMubWFwIChjKSAtPiBjPy50b0xvd2VyQ2FzZSgpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBfLnBpY2tCeSB2YWx1ZSwgKHZhbHVlLCBrZXkpIC0+XG4gICAgICAgICAgICAgICAgICAgIGZvciBjbiBpbiBuYW1lc1xuICAgICAgICAgICAgICAgICAgICAgICAgbGMgPSBrZXkudG9Mb3dlckNhc2UoKVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgY24ubGVuZ3RoPjEgYW5kIGxjLmluZGV4T2YoY24pPj0wIG9yIGxjLnN0YXJ0c1dpdGgoY24pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgdmFsdWVcbiAgICAgICAgXG4gICAgb25Tb3VyY2VJbmZvRm9yRmlsZTogKG9wdCkgPT5cbiAgICAgICAgXG4gICAgICAgIGZpbGUgPSBvcHQuaXRlbS5maWxlXG4gICAgICAgIGlmIEBmaWxlc1tmaWxlXT9cbiAgICAgICAgICAgIHBvc3QudG9XaW4gb3B0LndpbklELCAnc291cmNlSW5mb0ZvckZpbGUnIEBmaWxlc1tmaWxlXSwgb3B0XG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIGNvbGxlY3RCaW5zOiAtPlxuICAgICAgICBcbiAgICAgICAgQGJpbnMgPSBbXVxuICAgICAgICByZXR1cm4gaWYgc2xhc2gud2luKClcbiAgICAgICAgXG4gICAgICAgIGZvciBkaXIgaW4gWycvYmluJyAnL3Vzci9iaW4nICcvdXNyL2xvY2FsL2JpbiddXG4gICAgICAgICAgICB3ID0gbmV3IFdhbGtlclxuICAgICAgICAgICAgICAgIG1heEZpbGVzOiAgICAxMDAwXG4gICAgICAgICAgICAgICAgcm9vdDogICAgICAgIGRpclxuICAgICAgICAgICAgICAgIGluY2x1ZGVEaXJzOiBmYWxzZVxuICAgICAgICAgICAgICAgIGluY2x1ZGVFeHQ6ICBbJyddICMgcmVwb3J0IGZpbGVzIHdpdGhvdXQgZXh0ZW5zaW9uXG4gICAgICAgICAgICAgICAgZmlsZTogICAgICAgIChwKSA9PiBAYmlucy5wdXNoIHNsYXNoLmJhc2VuYW1lIHBcbiAgICAgICAgICAgIHcuc3RhcnQoKVxuXG4gICAgY29sbGVjdFByb2plY3RzOiAtPlxuXG4gICAgICAgIEBwcm9qZWN0cyA9IHt9XG4gICAgICAgIHcgPSBuZXcgV2Fsa2VyXG4gICAgICAgICAgICBtYXhGaWxlczogICAgNTAwMFxuICAgICAgICAgICAgbWF4RGVwdGg6ICAgIDNcbiAgICAgICAgICAgIHJvb3Q6ICAgICAgICBzbGFzaC5yZXNvbHZlICd+J1xuICAgICAgICAgICAgaW5jbHVkZTogICAgIFsnLmdpdCddXG4gICAgICAgICAgICBpZ25vcmU6ICAgICAgWydub2RlX21vZHVsZXMnICdpbWcnICdiaW4nICdqcycgJ0xpYnJhcnknXVxuICAgICAgICAgICAgc2tpcERpcjogICAgIChwKSAtPiBzbGFzaC5iYXNlKHApID09ICcuZ2l0J1xuICAgICAgICAgICAgZmlsdGVyOiAgICAgIChwKSAtPiBzbGFzaC5leHQocCkgbm90IGluIFsnbm9vbicgJ2pzb24nICdnaXQnICcnXVxuICAgICAgICAgICAgZGlyOiAgICAgICAgIChwKSA9PiBpZiBzbGFzaC5maWxlKHApID09ICcuZ2l0JyAgICB0aGVuIEBwcm9qZWN0c1tzbGFzaC5iYXNlIHNsYXNoLmRpciBwXSA9IGRpcjogc2xhc2gudGlsZGUgc2xhc2guZGlyIHBcbiAgICAgICAgICAgIGZpbGU6ICAgICAgICAocCkgPT4gaWYgc2xhc2guYmFzZShwKSA9PSAncGFja2FnZScgdGhlbiBAcHJvamVjdHNbc2xhc2guYmFzZSBzbGFzaC5kaXIgcF0gPSBkaXI6IHNsYXNoLnRpbGRlIHNsYXNoLmRpciBwXG4gICAgICAgICAgICBkb25lOiAgICAgICAgPT4gbG9nICdjb2xsZWN0UHJvamVjdHMgZG9uZScgQHByb2plY3RzXG4gICAgICAgIHcuc3RhcnQoKVxuXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgICAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgICAgICAgMDAwICAwMDAwMDAwICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIHByb2plY3RJbmZvOiAocGF0aCkgLT5cbiAgICAgICAgXG4gICAgICAgIGZvciBwcm9qZWN0IGluIEBpbmRleGVkUHJvamVjdHNcbiAgICAgICAgICAgIGlmIHNsYXNoLnNhbWVQYXRoKHByb2plY3QuZGlyLCBwYXRoKSBvciBwYXRoLnN0YXJ0c1dpdGggcHJvamVjdC5kaXIgKyAnLydcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJvamVjdFxuICAgICAgICB7fVxuICAgIFxuICAgIGluZGV4UHJvamVjdDogKGZpbGUpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBAY3VycmVudGx5SW5kZXhpbmdcbiAgICAgICAgICAgIEBpbmRleFF1ZXVlID89IFtdXG4gICAgICAgICAgICBpZiBmaWxlIG5vdCBpbiBAaW5kZXhRdWV1ZVxuICAgICAgICAgICAgICAgIEBpbmRleFF1ZXVlLnB1c2ggZmlsZVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIFxuICAgICAgICBmaWxlID0gc2xhc2gucmVzb2x2ZSBmaWxlIFxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIHZhbGlkIEBwcm9qZWN0SW5mbyBmaWxlXG4gICAgICAgICAgICAgIFxuICAgICAgICBAY3VycmVudGx5SW5kZXhpbmcgPSBmaWxlXG4gICAgICAgIFxuICAgICAgICBmb3JrZnVuYyBcIiN7X19kaXJuYW1lfS9pbmRleHByalwiLCBmaWxlLCAoZXJyLCBpbmZvKSA9PlxuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4ga2Vycm9yICdpbmRleGluZyBmYWlsZWQnLCBlcnIgaWYgdmFsaWQgZXJyXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGRlbGV0ZSBAY3VycmVudGx5SW5kZXhpbmdcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgaW5mb1xuICAgICAgICAgICAgICAgIEBpbmRleGVkUHJvamVjdHMucHVzaCBpbmZvIFxuICAgICAgICAgICAgICAgIHBvc3QudG9XaW5zICdwcm9qZWN0SW5kZXhlZCcsIGluZm9cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZG9TaGlmdCA9IGVtcHR5IEBxdWV1ZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiB2YWxpZCBpbmZvLmZpbGVzXG4gICAgICAgICAgICAgICAgQHF1ZXVlID0gQHF1ZXVlLmNvbmNhdCBpbmZvLmZpbGVzXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiB2YWxpZCBAaW5kZXhRdWV1ZVxuICAgICAgICAgICAgICAgIEBpbmRleFByb2plY3QgQGluZGV4UXVldWUuc2hpZnQoKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgQHNoaWZ0UXVldWUoKSBpZiBkb1NoaWZ0XG4gICAgICAgICAgICAgICAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwIDAwMCAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgIDAwMDAwICAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAwMDAgICAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAwMDAwICAgIDAwMCAgMDAwICAgMDAwXG5cbiAgICBpbmRleERpcjogKGRpcikgLT5cblxuICAgICAgICByZXR1cm4gaWYgbm90IGRpcj8gb3IgQGRpcnNbZGlyXT9cbiAgICAgICAgXG4gICAgICAgIEBkaXJzW2Rpcl0gPVxuICAgICAgICAgICAgbmFtZTogc2xhc2guYmFzZW5hbWUgZGlyXG5cbiAgICAgICAgd29wdCA9XG4gICAgICAgICAgICByb290OiAgICAgICAgZGlyXG4gICAgICAgICAgICBpbmNsdWRlRGlyOiAgZGlyXG4gICAgICAgICAgICBpbmNsdWRlRGlyczogdHJ1ZVxuICAgICAgICAgICAgZGlyOiAgICAgICAgIEBvbldhbGtlckRpclxuICAgICAgICAgICAgZmlsZTogICAgICAgIEBvbldhbGtlckZpbGVcbiAgICAgICAgICAgIG1heERlcHRoOiAgICAxMlxuICAgICAgICAgICAgbWF4RmlsZXM6ICAgIDEwMDAwMFxuICAgICAgICAgICAgZG9uZTogICAgICAgICh3KSA9PiBcbiAgICAgICAgICAgICAgICBAc2hpZnRRdWV1ZVxuXG4gICAgICAgIEB3YWxrZXIgPSBuZXcgV2Fsa2VyIHdvcHRcbiAgICAgICAgQHdhbGtlci5jZmcuaWdub3JlLnB1c2ggJ2pzJ1xuICAgICAgICBAd2Fsa2VyLnN0YXJ0KClcblxuICAgIG9uV2Fsa2VyRGlyOiAocCwgc3RhdCkgPT5cbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBAZGlyc1twXT9cbiAgICAgICAgICAgIEBkaXJzW3BdID1cbiAgICAgICAgICAgICAgICBuYW1lOiBzbGFzaC5iYXNlbmFtZSBwXG5cbiAgICBvbldhbGtlckZpbGU6IChwLCBzdGF0KSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgbm90IEBmaWxlc1twXT8gYW5kIEBxdWV1ZS5pbmRleE9mKHApIDwgMFxuICAgICAgICAgICAgaWYgc3RhdC5zaXplIDwgNjU0MzIxICMgb2J2aW91c2x5IHNvbWUgYXJiaXRyYXJ5IG51bWJlciA6KVxuICAgICAgICAgICAgICAgIEBxdWV1ZS5wdXNoIHBcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBsb2cgXCJ3YXJuaW5nISBmaWxlICN7cH0gdG9vIGxhcmdlPyAje3N0YXQuc2l6ZX0uIHNraXBwaW5nIGluZGV4aW5nIVwiXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgICAgICAwMDAgICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICBcblxuICAgIGFkZEZ1bmNJbmZvOiAoZnVuY05hbWUsIGZ1bmNJbmZvKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgbm90IGZ1bmNOYW1lXG4gICAgICAgICAgICBrbG9nIFwiYWRkRnVuY0luZm8gI3tmdW5jTmFtZX1cIiBmdW5jSW5mb1xuICAgICAgICBcbiAgICAgICAgaWYgZnVuY05hbWUubGVuZ3RoID4gMSBhbmQgZnVuY05hbWUuc3RhcnRzV2l0aCAnQCdcbiAgICAgICAgICAgIGZ1bmNOYW1lID0gZnVuY05hbWUuc2xpY2UgMVxuICAgICAgICAgICAgZnVuY0luZm8uc3RhdGljID0gdHJ1ZVxuICAgICAgICAgICAgXG4gICAgICAgIGZ1bmNJbmZvLm5hbWUgPSBmdW5jTmFtZVxuICAgICAgICBcbiAgICAgICAgZnVuY0luZm9zID0gQGZ1bmNzW2Z1bmNOYW1lXSA/IFtdXG4gICAgICAgIGZ1bmNJbmZvcy5wdXNoIGZ1bmNJbmZvXG4gICAgICAgIEBmdW5jc1tmdW5jTmFtZV0gPSBmdW5jSW5mb3NcbiAgICAgICAgXG4gICAgICAgIGZ1bmNJbmZvXG5cbiAgICBhZGRNZXRob2Q6IChjbGFzc05hbWUsIGZ1bmNOYW1lLCBmaWxlLCBsaSkgLT5cblxuICAgICAgICBmdW5jSW5mbyA9IEBhZGRGdW5jSW5mbyBmdW5jTmFtZSxcbiAgICAgICAgICAgIGxpbmU6ICBsaSsxXG4gICAgICAgICAgICBmaWxlOiAgZmlsZVxuICAgICAgICAgICAgY2xhc3M6IGNsYXNzTmFtZVxuXG4gICAgICAgIF8uc2V0IEBjbGFzc2VzLCBcIiN7Y2xhc3NOYW1lfS5tZXRob2RzLiN7ZnVuY0luZm8ubmFtZX1cIiwgZnVuY0luZm9cblxuICAgICAgICBmdW5jSW5mb1xuXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwIDAwMCAgIDAwMDAwMDAgICAgICAgICAwMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgICAgIDAgICAgICAwMDAwMDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcblxuICAgIHJlbW92ZUZpbGU6IChmaWxlKSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAZmlsZXNbZmlsZV0/XG4gICAgICAgIFxuICAgICAgICBmb3IgbmFtZSxpbmZvcyBvZiBAZnVuY3NcbiAgICAgICAgICAgIF8ucmVtb3ZlIGluZm9zLCAodikgLT4gdi5maWxlID09IGZpbGVcbiAgICAgICAgICAgIGRlbGV0ZSBAZnVuY3NbbmFtZV0gaWYgbm90IGluZm9zLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgQGNsYXNzZXMgPSBfLm9taXRCeSBAY2xhc3NlcywgKHYpIC0+IHYuZmlsZSA9PSBmaWxlXG4gICAgICAgIFxuICAgICAgICBkZWxldGUgQGZpbGVzW2ZpbGVdXG5cbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgICAgIDAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAwMDAgICAgICAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgIDAwMDAwICAgICAgICAgIDAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwIDAwMCAgICAgICAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcblxuICAgIGluZGV4RmlsZTogKGZpbGUsIG9wdCkgLT5cbiAgICAgICAgXG4gICAgICAgIEByZW1vdmVGaWxlIGZpbGUgaWYgb3B0Py5yZWZyZXNoXG5cbiAgICAgICAgaWYgQGZpbGVzW2ZpbGVdP1xuICAgICAgICAgICAgcmV0dXJuIEBzaGlmdFF1ZXVlKClcblxuICAgICAgICBmaWxlRXh0ID0gc2xhc2guZXh0IGZpbGUgXG5cbiAgICAgICAgaWYgZmlsZUV4dCBpbiBAaW1hZ2VFeHRlbnNpb25zXG4gICAgICAgICAgICBAZmlsZXNbZmlsZV0gPSB7fVxuICAgICAgICAgICAgcmV0dXJuIEBzaGlmdFF1ZXVlKClcbiAgICAgICAgICAgIFxuICAgICAgICBpc0NwcCA9IGZpbGVFeHQgaW4gWydjcHAnICdjYycgJ2MnICdmcmFnJyAndmVydCddXG4gICAgICAgIGlzSHBwID0gZmlsZUV4dCBpbiBbJ2hwcCcgJ2gnIF1cblxuICAgICAgICBmcy5yZWFkRmlsZSBmaWxlLCAndXRmOCcgKGVyciwgZGF0YSkgPT5cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIGtlcnJvciBcImNhbid0IGluZGV4ICN7ZmlsZX1cIiwgZXJyIGlmIG5vdCBlbXB0eSBlcnJcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgbGluZXMgPSBkYXRhLnNwbGl0IC9cXHI/XFxuL1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBmaWxlSW5mbyA9XG4gICAgICAgICAgICAgICAgbGluZXM6IGxpbmVzLmxlbmd0aFxuICAgICAgICAgICAgICAgIGZ1bmNzOiBbXVxuICAgICAgICAgICAgICAgIGNsYXNzZXM6IFtdXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBmdW5jQWRkZWQgPSBmYWxzZVxuICAgICAgICAgICAgZnVuY1N0YWNrID0gW11cbiAgICAgICAgICAgIGN1cnJlbnRDbGFzcyA9IG51bGxcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgaXNIcHAgb3IgaXNDcHBcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpbmRleEhwcCA9IG5ldyBJbmRleEhwcFxuICAgICAgICAgICAgICAgIHBhcnNlZCA9IGluZGV4SHBwLnBhcnNlIGRhdGFcbiAgICAgICAgICAgICAgICBmdW5jQWRkZWQgPSBub3QgZW1wdHkocGFyc2VkLmNsYXNzZXMpIG9yIG5vdCBlbXB0eShwYXJzZWQuZnVuY3MpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZm9yIGNsc3MgaW4gcGFyc2VkLmNsYXNzZXNcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIF8uc2V0IEBjbGFzc2VzLCBcIiN7Y2xzcy5uYW1lfS5maWxlXCIsIGZpbGVcbiAgICAgICAgICAgICAgICAgICAgXy5zZXQgQGNsYXNzZXMsIFwiI3tjbHNzLm5hbWV9LmxpbmVcIiwgY2xzcy5saW5lKzFcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGZpbGVJbmZvLmNsYXNzZXMucHVzaCBcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGNsc3MubmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgbGluZTogY2xzcy5saW5lKzFcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGZvciBmdW5jIGluIHBhcnNlZC5mdW5jc1xuICAgICAgICAgICAgICAgICAgICBmdW5jSW5mbyA9IEBhZGRNZXRob2QgZnVuYy5jbGFzcywgZnVuYy5tZXRob2QsIGZpbGUsIGZ1bmMubGluZVxuICAgICAgICAgICAgICAgICAgICBmaWxlSW5mby5mdW5jcy5wdXNoIGZ1bmNJbmZvXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGZvciBsaSBpbiBbMC4uLmxpbmVzLmxlbmd0aF1cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGxpbmUgPSBsaW5lc1tsaV1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgbGluZS50cmltKCkubGVuZ3RoICMgaWdub3JpbmcgZW1wdHkgbGluZXNcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZW50ID0gbGluZS5zZWFyY2ggL1xcUy9cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIGZ1bmNTdGFjay5sZW5ndGggYW5kIGluZGVudCA8PSBfLmxhc3QoZnVuY1N0YWNrKVswXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF8ubGFzdChmdW5jU3RhY2spWzFdLmxhc3QgPSBsaSAtIDFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jSW5mbyA9IGZ1bmNTdGFjay5wb3AoKVsxXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmNJbmZvLmNsYXNzID89IHNsYXNoLmJhc2UgZmlsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVJbmZvLmZ1bmNzLnB1c2ggZnVuY0luZm8gXG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBjdXJyZW50Q2xhc3M/IFxuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgMDAwMDAwMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgMDAwIDAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwXG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgbWV0aG9kTmFtZSA9IEluZGV4ZXIubWV0aG9kTmFtZUluTGluZSBsaW5lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmNJbmZvID0gQGFkZE1ldGhvZCBjdXJyZW50Q2xhc3MsIG1ldGhvZE5hbWUsIGZpbGUsIGxpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmNTdGFjay5wdXNoIFtpbmRlbnQsIGZ1bmNJbmZvXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jQWRkZWQgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgMDAwICAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwXG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudENsYXNzID0gbnVsbCBpZiBpbmRlbnQgPCAyICMgd2FzIDRcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBmdW5jTmFtZSA9IEluZGV4ZXIuZnVuY05hbWVJbkxpbmUgbGluZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jSW5mbyA9IEBhZGRGdW5jSW5mbyBmdW5jTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbmU6IGxpKzFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGU6IGZpbGVcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY1N0YWNrLnB1c2ggW2luZGVudCwgZnVuY0luZm9dXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmNBZGRlZCA9IHRydWVcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgZnVuY05hbWUgPSBJbmRleGVyLnBvc3ROYW1lSW5MaW5lIGxpbmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY0luZm8gPSBAYWRkRnVuY0luZm8gZnVuY05hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5lOiBsaSsxXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlOiBmaWxlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3N0OiB0cnVlXG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmNTdGFjay5wdXNoIFtpbmRlbnQsIGZ1bmNJbmZvXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jQWRkZWQgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0gPSBsaW5lLm1hdGNoIEluZGV4ZXIudGVzdFJlZ0V4cFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIG0/WzJdP1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jSW5mbyA9IEBhZGRGdW5jSW5mbyBtWzJdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGluZTogbGkrMVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZTogZmlsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVzdDogbVsxXVxuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jU3RhY2sucHVzaCBbaW5kZW50LCBmdW5jSW5mb11cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY0FkZGVkID0gdHJ1ZVxuICAgIFxuICAgICAgICAgICAgICAgICAgICB3b3JkcyA9IGxpbmUuc3BsaXQgSW5kZXhlci5zcGxpdFJlZ0V4cFxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgZm9yIHdvcmQgaW4gd29yZHNcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgSW5kZXhlci50ZXN0V29yZCB3b3JkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXy51cGRhdGUgQHdvcmRzLCBcIiN7d29yZH0uY291bnRcIiwgKG4pIC0+IChuID8gMCkgKyAxXG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggd29yZFxuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgIDAwMDAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoZW4gJ2NsYXNzJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgY2xhc3NOYW1lID0gSW5kZXhlci5jbGFzc05hbWVJbkxpbmUgbGluZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudENsYXNzID0gY2xhc3NOYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfLnNldCBAY2xhc3NlcywgXCIje2NsYXNzTmFtZX0uZmlsZVwiLCBmaWxlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfLnNldCBAY2xhc3NlcywgXCIje2NsYXNzTmFtZX0ubGluZVwiLCBsaSsxXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVJbmZvLmNsYXNzZXMucHVzaCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBjbGFzc05hbWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5lOiBsaSsxXG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwIDAwIDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwIDAwICAgMDAwMDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoZW4gJ3JlcXVpcmUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtID0gbGluZS5tYXRjaCBJbmRleGVyLnJlcXVpcmVSZWdFeHBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgbT9bMV0/IGFuZCBtWzJdP1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgciA9IGZpbGVJbmZvLnJlcXVpcmUgPyBbXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgci5wdXNoIFttWzFdLCBtWzJdXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZUluZm8ucmVxdWlyZSA9IHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFic3BhdGggPSBzbGFzaC5yZXNvbHZlIHNsYXNoLmpvaW4gc2xhc2guZGlyKGZpbGUpLCBtWzJdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhYnNwYXRoICs9ICcuY29mZmVlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1bMl1bMF0gPT0gJy4nKSBhbmQgKG5vdCBAZmlsZXNbYWJzcGF0aF0/KSBhbmQgKEBxdWV1ZS5pbmRleE9mKGFic3BhdGgpIDwgMClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBzbGFzaC5pc0ZpbGUgYWJzcGF0aFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBAcXVldWUucHVzaCBhYnNwYXRoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgZnVuY0FkZGVkXG5cbiAgICAgICAgICAgICAgICB3aGlsZSBmdW5jU3RhY2subGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgIF8ubGFzdChmdW5jU3RhY2spWzFdLmxhc3QgPSBsaSAtIDFcbiAgICAgICAgICAgICAgICAgICAgZnVuY0luZm8gPSBmdW5jU3RhY2sucG9wKClbMV1cbiAgICAgICAgICAgICAgICAgICAgZnVuY0luZm8uY2xhc3MgPz0gc2xhc2guYmFzZSBmdW5jSW5mby5maWxlXG4gICAgICAgICAgICAgICAgICAgIGZ1bmNJbmZvLmNsYXNzID89IHNsYXNoLmJhc2UgZmlsZVxuICAgICAgICAgICAgICAgICAgICBmaWxlSW5mby5mdW5jcy5wdXNoIGZ1bmNJbmZvXG5cbiAgICAgICAgICAgICAgICBpZiBvcHQ/LnBvc3QgIT0gZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgcG9zdC50b1dpbnMgJ2NsYXNzZXNDb3VudCcgXy5zaXplIEBjbGFzc2VzXG4gICAgICAgICAgICAgICAgICAgIHBvc3QudG9XaW5zICdmdW5jc0NvdW50JyAgIF8uc2l6ZSBAZnVuY3NcbiAgICAgICAgICAgICAgICAgICAgcG9zdC50b1dpbnMgJ2ZpbGVJbmRleGVkJyAgZmlsZSwgZmlsZUluZm9cblxuICAgICAgICAgICAgQGZpbGVzW2ZpbGVdID0gZmlsZUluZm9cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgb3B0Py5wb3N0ICE9IGZhbHNlXG4gICAgICAgICAgICAgICAgcG9zdC50b1dpbnMgJ2ZpbGVzQ291bnQnIF8uc2l6ZSBAZmlsZXNcblxuICAgICAgICAgICAgQHNoaWZ0UXVldWUoKVxuICAgICAgICBAXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAwMDAwMDAgICAgICAgMDAwICAgICBcbiAgICAjICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuICAgIFxuICAgIHNoaWZ0UXVldWU6ID0+XG4gICAgICAgIFxuICAgICAgICBpZiBAcXVldWUubGVuZ3RoXG4gICAgICAgICAgICBmaWxlID0gQHF1ZXVlLnNoaWZ0KClcbiAgICAgICAgICAgIEBpbmRleEZpbGUgZmlsZVxuXG5tb2R1bGUuZXhwb3J0cyA9IEluZGV4ZXJcbiJdfQ==
//# sourceURL=../../coffee/main/indexer.coffee