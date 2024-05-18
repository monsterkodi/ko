var _k_ = {in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}, empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}, list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}, isArr: function (o) {return Array.isArray(o)}, last: function (o) {return o != null ? o.length ? o[o.length-1] : undefined : o}}

import kxk from "../../kxk.js"
let pickBy = kxk.pickBy
let pullIf = kxk.pullIf
let deleteBy = kxk.deleteBy
let sds = kxk.sds
let matchr = kxk.matchr
let slash = kxk.slash
let post = kxk.post
let ffs = kxk.ffs

import Walker from "./Walker.js"
import IndexHpp from "./IndexHpp.js"
import IndexJS from "./IndexJS.js"
import IndexMM from "./IndexMM.js"
import IndexStyl from "./IndexStyl.js"

class Indexer
{
    static requireRegExp = /^\s*([\w\{\}]+)\s+=\s+require\s+[\'\"]([\.\/\w]+)[\'\"]/

    static includeRegExp = /^#include\s+[\"\<]([\.\/\w]+)[\"\>]/

    static methodRegExp = /^\s+([\@]?\w+|@)\s*\:\s*(\(?.*\)?)?\s*○?[=-]\>/

    static funcRegExp = /^\s*([\w\.]+)\s*[\:\=][^\(\)\'\"]*(\(.*\))?\s*○?[=-]\>/

    static postRegExp = /^\s*post\.on\s+[\'\"](\w+)[\'\"]\s*\,?\s*(\(.*\))?\s*[=-]\>/

    static testRegExp = /^\s*(▸\s+.+)/

    static splitRegExp = new RegExp("[^\\w\\d\\_]+",'g')

    static classRegExp = /^(\s*\S+\s*=)?\s*(class|function)\s+(\w+)/

    static classNameInLine (line)
    {
        var m

        m = line.match(Indexer.classRegExp)
        return (m != null ? m[3] : undefined)
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

    static file (file)
    {
        return window.indexer.files[file]
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
        this.indexFile = this.indexFile.bind(this)
        this.onGet = this.onGet.bind(this)
        post.on('index',(function (file)
        {
            return this.indexFile(file)
        }).bind(this))
        post.on('saved',(function (file)
        {
            return this.indexFile(file,{refresh:true})
        }).bind(this))
        this.imageExtensions = ['png','jpg','gif','tiff','pxm','icns']
        this.dirs = {}
        this.files = {}
        this.classes = {}
        this.funcs = {}
        this.words = {}
        this.queue = []
    }

    onGet (key, ...filter)
    {
        var names, value, _106_45_, _107_45_, _108_45_, _109_45_, _110_45_

        switch (key)
        {
            case 'counts':
                return {classes:((_106_45_=this.classes.length) != null ? _106_45_ : 0),files:((_107_45_=this.files.length) != null ? _107_45_ : 0),funcs:((_108_45_=this.funcs.length) != null ? _108_45_ : 0),words:((_109_45_=this.words.length) != null ? _109_45_ : 0),dirs:((_110_45_=this.dirs.length) != null ? _110_45_ : 0)}

            case 'file':
                return this.files[filter[0]]

            case 'project':
                return this.projectInfo(filter[0])

        }

        value = this[key]
        if (!_k_.empty(filter))
        {
            names = filter.filter(function (c)
            {
                return !_k_.empty(c)
            })
            if (!_k_.empty(names))
            {
                names = names.map(function (c)
                {
                    return (c != null ? c.toLowerCase() : undefined)
                })
                value = pickBy(value,function (key)
                {
                    var cn, lc

                    var list = _k_.list(names)
                    for (var _a_ = 0; _a_ < list.length; _a_++)
                    {
                        cn = list[_a_]
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

    addFuncInfo (funcName, funcInfo)
    {
        var funcInfos, _150_37_

        if (!funcName)
        {
            console.log(`addFuncInfo ${funcName}`,funcInfo)
            return
        }
        if (funcName.length > 1 && funcName.startsWith('@'))
        {
            funcName = funcName.slice(1)
            funcInfo.static = true
        }
        funcInfo.name = funcName
        funcInfos = ((_150_37_=this.funcs[funcName]) != null ? _150_37_ : [])
        if (!(_k_.isArr(funcInfos)))
        {
            funcInfos = []
        }
        funcInfos.push(funcInfo)
        this.funcs[funcName] = funcInfos
        return funcInfo
    }

    addMethod (className, funcName, file, li, async, bound, statik)
    {
        var funcInfo

        funcInfo = this.addFuncInfo(funcName,{line:li + 1,file:file,class:className,async:async,bound:bound,static:statik})
        sds.set(this.classes,`${className}.methods.${funcInfo.name}`,funcInfo)
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
            pullIf(infos,function (v)
            {
                return v.file === file
            })
            if (!infos.length)
            {
                delete this.funcs[name]
            }
        }
        deleteBy(this.classes,function (k, v)
        {
            return v.file === file
        })
        return delete this.files[file]
    }

    applyIndexer (file, fileInfo, text, IndexerClass)
    {
        var clss, func, funcAdded, funcInfo, indexer, parsed

        indexer = new IndexerClass
        parsed = indexer.parse(text)
        funcAdded = !_k_.empty((parsed.classes)) || !_k_.empty((parsed.funcs))
        var list = _k_.list(parsed.classes)
        for (var _a_ = 0; _a_ < list.length; _a_++)
        {
            clss = list[_a_]
            sds.set(this.classes,`${clss.name}.file`,file)
            sds.set(this.classes,`${clss.name}.line`,clss.line + 1)
            fileInfo.classes.push({name:clss.name,line:clss.line + 1})
        }
        var list1 = _k_.list(parsed.funcs)
        for (var _b_ = 0; _b_ < list1.length; _b_++)
        {
            func = list1[_b_]
            if (func.method)
            {
                funcInfo = this.addMethod(func.class,func.method,file,func.line,func.async,func.bound,func.static)
            }
            else
            {
                func.line = func.line + 1
                func.file = file
                funcInfo = this.addFuncInfo(func.name,func)
            }
            fileInfo.funcs.push(funcInfo)
        }
    }

    indexFile (file, opt)
    {
        var fileExt, isCpp, isHpp, isJS

        if ((opt != null ? opt.refresh : undefined))
        {
            this.removeFile(file)
        }
        if ((this.files[file] != null))
        {
            post.emit('fileIndexed',file,this.files[file])
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
        isJS = _k_.in(fileExt,['js','mjs'])
        ffs.read(file).then((function (text)
        {
            var className, cnt, currentClass, fileInfo, funcAdded, funcInfo, funcName, funcStack, indent, li, line, lines, m, methodName, word, words, _287_47_, _345_51_, _373_35_, _374_35_

            if (_k_.empty(text))
            {
                return
            }
            lines = text.split(/\r?\n/)
            fileInfo = {lines:lines.length,funcs:[],classes:[]}
            funcAdded = false
            funcStack = []
            currentClass = null
            if (isHpp || isCpp)
            {
                this.applyIndexer(file,fileInfo,text,IndexHpp)
            }
            else if (isJS)
            {
                this.applyIndexer(file,fileInfo,text,IndexJS)
            }
            else if (fileExt === 'mm')
            {
                this.applyIndexer(file,fileInfo,text,IndexMM)
            }
            else if (fileExt === 'styl')
            {
                this.applyIndexer(file,fileInfo,text,IndexStyl)
            }
            else
            {
                for (var _a_ = li = 0, _b_ = lines.length; (_a_ <= _b_ ? li < lines.length : li > lines.length); (_a_ <= _b_ ? ++li : --li))
                {
                    line = lines[li]
                    if (line.trim().length)
                    {
                        indent = line.search(/\S/)
                        while (funcStack.length && indent <= _k_.last(funcStack)[0])
                        {
                            _k_.last(funcStack)[1].last = li - 1
                            funcInfo = funcStack.pop()[1]
                            funcInfo.class = ((_287_47_=funcInfo.class) != null ? _287_47_ : slash.name(file))
                            fileInfo.funcs.push(funcInfo)
                        }
                        if ((currentClass != null))
                        {
                            if (methodName = Indexer.methodNameInLine(line))
                            {
                                funcInfo = this.addMethod(currentClass,methodName,file,li,line.indexOf('○') >= 0,line.indexOf('=>') >= 0)
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
                                funcInfo = this.addFuncInfo(funcName,{line:li + 1,file:file,async:line.indexOf('○') >= 0})
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
                            if (((m != null ? m[0] : undefined) != null))
                            {
                                funcInfo = this.addFuncInfo(m[0].replaceAll('▸ ',''),{line:li + 1,file:file,test:m[0].replaceAll('▸ ','')})
                                funcStack.push([indent,funcInfo])
                                funcAdded = true
                            }
                        }
                    }
                    words = line.split(Indexer.splitRegExp)
                    var list = _k_.list(words)
                    for (var _c_ = 0; _c_ < list.length; _c_++)
                    {
                        word = list[_c_]
                        if (Indexer.testWord(word))
                        {
                            cnt = ((_345_51_=this.words[word]) != null ? _345_51_ : 0)
                            this.words[word] = cnt + 1
                        }
                        switch (word)
                        {
                            case 'class':
                            case 'function':
                                if (className = Indexer.classNameInLine(line))
                                {
                                    currentClass = className
                                    sds.set(this.classes,`${className}.file`,file)
                                    sds.set(this.classes,`${className}.line`,li + 1)
                                    fileInfo.classes.push({name:className,line:li + 1})
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
                    _k_.last(funcStack)[1].last = li - 1
                    funcInfo = funcStack.pop()[1]
                    funcInfo.class = ((_373_35_=funcInfo.class) != null ? _373_35_ : slash.name(funcInfo.file))
                    funcInfo.class = ((_374_35_=funcInfo.class) != null ? _374_35_ : slash.name(file))
                    fileInfo.funcs.push(funcInfo)
                }
                if ((opt != null ? opt.post : undefined) !== false)
                {
                    post.emit('fileIndexed',file,fileInfo)
                }
            }
            this.files[file] = fileInfo
            if ((opt != null ? opt.post : undefined) !== false)
            {
                post.emit('filesCount',Object.keys(this.files).length)
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

export default Indexer;