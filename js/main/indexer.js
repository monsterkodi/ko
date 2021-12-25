// monsterkodi/kode 0.229.0

var _k_ = {in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}, empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}, list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}, valid: undefined}

var filter, forkfunc, IndexHpp, kerror, klog, kxk, matchr, post, slash, Walker, _

kxk = require('kxk')
_ = kxk._
filter = kxk.filter
kerror = kxk.kerror
klog = kxk.klog
matchr = kxk.matchr
post = kxk.post
slash = kxk.slash

Walker = require('../tools/walker')
forkfunc = require('../tools/forkfunc')
IndexHpp = require('./indexhpp')
class Indexer
{
    static requireRegExp = /^\s*([\w\{\}]+)\s+=\s+require\s+[\'\"]([\.\/\w]+)[\'\"]/

    static includeRegExp = /^#include\s+[\"\<]([\.\/\w]+)[\"\>]/

    static methodRegExp = /^\s+([\@]?\w+|@)\s*\:\s*(\(.*\))?\s*[=-]\>/

    static funcRegExp = /^\s*([\w\.]+)\s*[\:\=][^\(\)]*(\(.*\))?\s*[=-]\>/

    static postRegExp = /^\s*post\.on\s+[\'\"](\w+)[\'\"]\s*\,?\s*(\(.*\))?\s*[=-]\>/

    static testRegExp = /^\s*(describe|it)\s+[\'\"](.+)[\'\"]\s*\,?\s*(\([^\)]*\))?\s*[=-]\>/

    static splitRegExp = new RegExp("[^\\w\\d\\_]+",'g')

    static classRegExp = /^(\s*\S+\s*=)?\s*class\s+(\w+)/

    static classNameInLine (line)
    {
        var m

        m = line.match(Indexer.classRegExp)
        return (m != null ? m[2] : undefined)
    }

    static methodNameInLine (line)
    {
        var m, rgs

        m = line.match(Indexer.methodRegExp)
        if ((m != null))
        {
            rgs = matchr.ranges(Indexer.methodRegExp,line)
            if (rgs[0].start > 11)
            {
                return null
            }
        }
        return (m != null ? m[1] : undefined)
    }

    static funcNameInLine (line)
    {
        var m, rgs

        if (m = line.match(Indexer.funcRegExp))
        {
            rgs = matchr.ranges(Indexer.funcRegExp,line)
            if (rgs[0].start > 7)
            {
                return null
            }
        }
        return (m != null ? m[1] : undefined)
    }

    static postNameInLine (line)
    {
        var m, rgs

        if (m = line.match(Indexer.postRegExp))
        {
            rgs = matchr.ranges(Indexer.postRegExp,line)
        }
        return (m != null ? m[1] : undefined)
    }

    static testWord (word)
    {
        if (word.length < 3)
        {
            return false
        }
        else if (_k_.in(word[0],['-',"#"]))
        {
            return false
        }
        else if (word[word.length - 1] === '-')
        {
            return false
        }
        else if (word[0] === '_' && word.length < 4)
        {
            return false
        }
        else if (/^[0\_\-\@\#]+$/.test(word))
        {
            return false
        }
        else if (/\d/.test(word))
        {
            return false
        }
        else
        {
            return true
        }
    }

    constructor ()
    {
        this.shiftQueue = this.shiftQueue.bind(this)
        this.onWalkerFile = this.onWalkerFile.bind(this)
        this.onWalkerDir = this.onWalkerDir.bind(this)
        this.onSourceInfoForFile = this.onSourceInfoForFile.bind(this)
        this.onGet = this.onGet.bind(this)
        post.onGet('indexer',this.onGet)
        post.on('sourceInfoForFile',this.onSourceInfoForFile)
        post.on('fileSaved',(function (file, winID)
        {
            return this.indexFile(file,{refresh:true})
        }).bind(this))
        post.on('dirLoaded',(function (dir)
        {
            return this.indexProject(dir)
        }).bind(this))
        post.on('fileLoaded',(function (file, winID)
        {
            this.indexFile(file)
            return this.indexProject(file)
        }).bind(this))
        this.collectBins()
        this.imageExtensions = ['png','jpg','gif','tiff','pxm','icns']
        this.dirs = Object.create(null)
        this.files = Object.create(null)
        this.classes = Object.create(null)
        this.funcs = Object.create(null)
        this.words = Object.create(null)
        this.walker = null
        this.queue = []
        this.indexedProjects = []
    }

    onGet (key, ...filter)
    {
        var names, value, _116_45_, _117_43_, _118_43_, _119_43_, _120_42_

        switch (key)
        {
            case 'counts':
                return {classes:((_116_45_=this.classes.length) != null ? _116_45_ : 0),files:((_117_43_=this.files.length) != null ? _117_43_ : 0),funcs:((_118_43_=this.funcs.length) != null ? _118_43_ : 0),words:((_119_43_=this.words.length) != null ? _119_43_ : 0),dirs:((_120_42_=this.dirs.length) != null ? _120_42_ : 0)}

            case 'file':
                return this.files[filter[0]]

            case 'project':
                return this.projectInfo(filter[0])

        }

        value = this[key]
        if (!_k_.empty(filter))
        {
            names = _.filter(filter,function (c)
            {
                return !_k_.empty(c)
            })
            if (!_k_.empty(names))
            {
                names = names.map(function (c)
                {
                    return (c != null ? c.toLowerCase() : undefined)
                })
                value = _.pickBy(value,function (value, key)
                {
                    var cn, lc

                    var list = _k_.list(names)
                    for (var _136_27_ = 0; _136_27_ < list.length; _136_27_++)
                    {
                        cn = list[_136_27_]
                        lc = key.toLowerCase()
                        if (cn.length > 1 && lc.indexOf(cn) >= 0 || lc.startsWith(cn))
                        {
                            return true
                        }
                    }
                })
            }
        }
        return value
    }

    onSourceInfoForFile (opt)
    {
        var file

        file = opt.item.file
        if ((this.files[file] != null))
        {
            return post.toWin(opt.winID,'sourceInfoForFile',this.files[file],opt)
        }
    }

    collectBins ()
    {
        var dir, w

        this.bins = []
        if (slash.win())
        {
            return
        }
        var list = ['/bin','/usr/bin','/usr/local/bin']
        for (var _159_16_ = 0; _159_16_ < list.length; _159_16_++)
        {
            dir = list[_159_16_]
            w = new Walker({maxFiles:1000,root:dir,includeDirs:false,includeExt:[''],file:(function (p)
            {
                return this.bins.push(slash.basename(p))
            }).bind(this)})
            w.start()
        }
    }

    collectProjects ()
    {
        var w

        this.projects = {}
        w = new Walker({maxFiles:5000,maxDepth:3,root:slash.resolve('~'),include:['.git'],ignore:['node_modules','img','bin','js','Library'],skipDir:function (p)
        {
            return slash.base(p) === '.git'
        },filter:function (p)
        {
            return !(_k_.in(slash.ext(p),['noon','json','git','']))
        },dir:(function (p)
        {
            if (slash.file(p) === '.git')
            {
                return this.projects[slash.base(slash.dir(p))] = {dir:slash.tilde(slash.dir(p))}
            }
        }).bind(this),file:(function (p)
        {
            if (slash.base(p) === 'package')
            {
                return this.projects[slash.base(slash.dir(p))] = {dir:slash.tilde(slash.dir(p))}
            }
        }).bind(this),done:(function ()
        {
            console.log('collectProjects done',this.projects)
        }).bind(this)})
        return w.start()
    }

    projectInfo (path)
    {
        var project

        var list = _k_.list(this.indexedProjects)
        for (var _192_20_ = 0; _192_20_ < list.length; _192_20_++)
        {
            project = list[_192_20_]
            if (slash.samePath(project.dir,path) || path.startsWith(project.dir + '/'))
            {
                return project
            }
        }
        return {}
    }

    indexProject (file)
    {
        var _200_24_

        if (this.currentlyIndexing)
        {
            this.indexQueue = ((_200_24_=this.indexQueue) != null ? _200_24_ : [])
            if (!(_k_.in(file,this.indexQueue)))
            {
                this.indexQueue.push(file)
            }
            return
        }
        file = slash.resolve(file)
        if (!_k_.empty(this.projectInfo(file)))
        {
            return
        }
        this.currentlyIndexing = file
        return forkfunc(`${__dirname}/indexprj`,file,(function (err, info)
        {
            var doShift

            if (!_k_.empty(err))
            {
                return kerror('indexing failed',err)
            }
            delete this.currentlyIndexing
            if (info)
            {
                this.indexedProjects.push(info)
                post.toWins('projectIndexed',info)
            }
            doShift = _k_.empty(this.queue)
            if (!_k_.empty(info.files))
            {
                this.queue = this.queue.concat(info.files)
            }
            if (!_k_.empty(this.indexQueue))
            {
                this.indexProject(this.indexQueue.shift())
            }
            if (doShift)
            {
                return this.shiftQueue()
            }
        }).bind(this))
    }

    indexDir (dir)
    {
        var wopt

        if (!(dir != null) || (this.dirs[dir] != null))
        {
            return
        }
        this.dirs[dir] = {name:slash.basename(dir)}
        wopt = {root:dir,includeDir:dir,includeDirs:true,dir:this.onWalkerDir,file:this.onWalkerFile,maxDepth:12,maxFiles:100000,done:(function (w)
        {
            return this.shiftQueue
        }).bind(this)}
        this.walker = new Walker(wopt)
        this.walker.cfg.ignore.push('js')
        return this.walker.start()
    }

    onWalkerDir (p, stat)
    {
        if (!(this.dirs[p] != null))
        {
            return this.dirs[p] = {name:slash.basename(p)}
        }
    }

    onWalkerFile (p, stat)
    {
        if (!(this.files[p] != null) && this.queue.indexOf(p) < 0)
        {
            if (stat.size < 654321)
            {
                return this.queue.push(p)
            }
            else
            {
                console.log(`warning! file ${p} too large? ${stat.size}. skipping indexing!`)
            }
        }
    }

    addFuncInfo (funcName, funcInfo)
    {
        var funcInfos, _290_37_

        if (!funcName)
        {
            klog(`addFuncInfo ${funcName}`,funcInfo)
        }
        if (funcName.length > 1 && funcName.startsWith('@'))
        {
            funcName = funcName.slice(1)
            funcInfo.static = true
        }
        funcInfo.name = funcName
        funcInfos = ((_290_37_=this.funcs[funcName]) != null ? _290_37_ : [])
        funcInfos.push(funcInfo)
        this.funcs[funcName] = funcInfos
        return funcInfo
    }

    addMethod (className, funcName, file, li)
    {
        var funcInfo

        funcInfo = this.addFuncInfo(funcName,{line:li + 1,file:file,class:className})
        _.set(this.classes,`${className}.methods.${funcInfo.name}`,funcInfo)
        return funcInfo
    }

    removeFile (file)
    {
        var infos, name

        if (!(this.files[file] != null))
        {
            return
        }
        for (name in this.funcs)
        {
            infos = this.funcs[name]
            _.remove(infos,function (v)
            {
                return v.file === file
            })
            if (!infos.length)
            {
                delete this.funcs[name]
            }
        }
        this.classes = _.omitBy(this.classes,function (v)
        {
            return v.file === file
        })
        return delete this.files[file]
    }

    indexFile (file, opt)
    {
        var fileExt, isCpp, isHpp

        if ((opt != null ? opt.refresh : undefined))
        {
            this.removeFile(file)
        }
        if ((this.files[file] != null))
        {
            return this.shiftQueue()
        }
        fileExt = slash.ext(file)
        if (_k_.in(fileExt,this.imageExtensions))
        {
            this.files[file] = {}
            return this.shiftQueue()
        }
        isCpp = _k_.in(fileExt,['cpp','cc','c','frag','vert'])
        isHpp = _k_.in(fileExt,['hpp','h'])
        slash.readText(file,(function (text)
        {
            var abspath, className, clss, currentClass, fileInfo, func, funcAdded, funcInfo, funcName, funcStack, indent, indexHpp, li, line, lines, m, methodName, parsed, r, word, words, _393_43_, _481_57_, _495_35_, _496_35_

            lines = text.split(/\r?\n/)
            fileInfo = {lines:lines.length,funcs:[],classes:[]}
            funcAdded = false
            funcStack = []
            currentClass = null
            if (isHpp || isCpp)
            {
                indexHpp = new IndexHpp
                parsed = indexHpp.parse(text)
                funcAdded = !_k_.empty((parsed.classes)) || !_k_.empty((parsed.funcs))
                var list = _k_.list(parsed.classes)
                for (var _368_25_ = 0; _368_25_ < list.length; _368_25_++)
                {
                    clss = list[_368_25_]
                    _.set(this.classes,`${clss.name}.file`,file)
                    _.set(this.classes,`${clss.name}.line`,clss.line + 1)
                    fileInfo.classes.push({name:clss.name,line:clss.line + 1})
                }
                var list1 = _k_.list(parsed.funcs)
                for (var _377_25_ = 0; _377_25_ < list1.length; _377_25_++)
                {
                    func = list1[_377_25_]
                    funcInfo = this.addMethod(func.class,func.method,file,func.line)
                    fileInfo.funcs.push(funcInfo)
                }
            }
            else
            {
                for (var _382_27_ = li = 0, _382_31_ = lines.length; (_382_27_ <= _382_31_ ? li < lines.length : li > lines.length); (_382_27_ <= _382_31_ ? ++li : --li))
                {
                    line = lines[li]
                    if (line.trim().length)
                    {
                        indent = line.search(/\S/)
                        while (funcStack.length && indent <= _.last(funcStack)[0])
                        {
                            _.last(funcStack)[1].last = li - 1
                            funcInfo = funcStack.pop()[1]
                            funcInfo.class = ((_393_43_=funcInfo.class) != null ? _393_43_ : slash.base(file))
                            fileInfo.funcs.push(funcInfo)
                        }
                        if ((currentClass != null))
                        {
                            if (methodName = Indexer.methodNameInLine(line))
                            {
                                funcInfo = this.addMethod(currentClass,methodName,file,li)
                                funcStack.push([indent,funcInfo])
                                funcAdded = true
                            }
                        }
                        else
                        {
                            if (indent < 2)
                            {
                                currentClass = null
                            }
                            if (funcName = Indexer.funcNameInLine(line))
                            {
                                funcInfo = this.addFuncInfo(funcName,{line:li + 1,file:file})
                                funcStack.push([indent,funcInfo])
                                funcAdded = true
                            }
                            else if (funcName = Indexer.postNameInLine(line))
                            {
                                funcInfo = this.addFuncInfo(funcName,{line:li + 1,file:file,post:true})
                                funcStack.push([indent,funcInfo])
                                funcAdded = true
                            }
                            m = line.match(Indexer.testRegExp)
                            if (((m != null ? m[2] : undefined) != null))
                            {
                                funcInfo = this.addFuncInfo(m[2],{line:li + 1,file:file,test:m[1]})
                                funcStack.push([indent,funcInfo])
                                funcAdded = true
                            }
                        }
                    }
                    words = line.split(Indexer.splitRegExp)
                    var list2 = _k_.list(words)
                    for (var _447_29_ = 0; _447_29_ < list2.length; _447_29_++)
                    {
                        word = list2[_447_29_]
                        if (Indexer.testWord(word))
                        {
                            _.update(this.words,`${word}.count`,function (n)
                            {
                                return ((n != null ? n : 0)) + 1
                            })
                        }
                        switch (word)
                        {
                            case 'class':
                                if (className = Indexer.classNameInLine(line))
                                {
                                    currentClass = className
                                    _.set(this.classes,`${className}.file`,file)
                                    _.set(this.classes,`${className}.line`,li + 1)
                                    fileInfo.classes.push({name:className,line:li + 1})
                                }
                                break
                            case 'require':
                                m = line.match(Indexer.requireRegExp)
                                if (((m != null ? m[1] : undefined) != null) && (m[2] != null))
                                {
                                    r = ((_481_57_=fileInfo.require) != null ? _481_57_ : [])
                                    r.push([m[1],m[2]])
                                    fileInfo.require = r
                                    abspath = slash.resolve(slash.join(slash.dir(file),m[2]))
                                    abspath += '.coffee'
                                    if ((m[2][0] === '.') && (!(this.files[abspath] != null)) && (this.queue.indexOf(abspath) < 0))
                                    {
                                        if (slash.isFile(abspath))
                                        {
                                            this.queue.push(abspath)
                                        }
                                    }
                                }
                                break
                        }

                    }
                }
            }
            if (funcAdded)
            {
                while (funcStack.length)
                {
                    _.last(funcStack)[1].last = li - 1
                    funcInfo = funcStack.pop()[1]
                    funcInfo.class = ((_495_35_=funcInfo.class) != null ? _495_35_ : slash.base(funcInfo.file))
                    funcInfo.class = ((_496_35_=funcInfo.class) != null ? _496_35_ : slash.base(file))
                    fileInfo.funcs.push(funcInfo)
                }
                if ((opt != null ? opt.post : undefined) !== false)
                {
                    post.toWins('classesCount',_.size(this.classes))
                    post.toWins('funcsCount',_.size(this.funcs))
                    post.toWins('fileIndexed',file,fileInfo)
                }
            }
            this.files[file] = fileInfo
            if ((opt != null ? opt.post : undefined) !== false)
            {
                post.toWins('filesCount',_.size(this.files))
            }
            return this.shiftQueue()
        }).bind(this))
        return this
    }

    shiftQueue ()
    {
        var file

        if (this.queue.length)
        {
            file = this.queue.shift()
            return this.indexFile(file)
        }
    }
}

module.exports = Indexer