var _k_ = {empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}, last: function (o) {return o != null ? o.length ? o[o.length-1] : undefined : o}, isStr: function (o) {return typeof o === 'string' || o instanceof String}, in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}, list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

import kxk from "../../kxk.js"
let post = kxk.post
let ffs = kxk.ffs
let slash = kxk.slash

import Walker from "./Walker.js"

class Projects
{
    constructor ()
    {
        kore.on('editor|file',function (file)
        {
            return Projects.indexProject(file)
        })
        post.on('indexProject',function (file)
        {
            return Projects.indexProject(file)
        })
    }

    static currentProject = null

    static projects = {}

    static allFiles = {}

    static indexing = null

    static queue = []

    static files (path)
    {
        var _26_57_

        return ((_26_57_=(Projects.projects[this.dir(path)] != null ? Projects.projects[this.dir(path)].files : undefined)) != null ? _26_57_ : [])
    }

    static dir (path)
    {
        var prjPath, project

        if (!_k_.empty(path))
        {
            if (prjPath = this.allFiles[path])
            {
                return prjPath
            }
            if (Projects.projects[path])
            {
                return this.projects[path].dir
            }
            for (prjPath in Projects.projects)
            {
                project = Projects.projects[prjPath]
                if (path.startsWith(prjPath))
                {
                    return prjPath
                }
            }
        }
        return null
    }

    static current ()
    {
        var c

        c = this.currentProject
        c = (c != null ? c : _k_.last(Object.keys(this.projects)))
        c = (c != null ? c : kakao.bundle.path)
        return c
    }

    static setCurrent (currentProject)
    {
        this.currentProject = currentProject
    
        console.log('Project.setCurrent',this.currentProject)
    }

    static async indexProject (file)
    {
        var exists, prjPath, result, walker, _80_19_

        if (!(_k_.isStr(file)))
        {
            console.log('Projects.indexProject file not a str?',file)
            return
        }
        if (file.startsWith('untitled-'))
        {
            return
        }
        exists = await ffs.exists(file)
        if (!exists)
        {
            return
        }
        prjPath = await ffs.git(file)
        prjPath = (prjPath != null ? prjPath : slash.dir(file))
        if (this.indexing)
        {
            if (this.indexing === prjPath)
            {
                return
            }
            this.queue = ((_80_19_=this.queue) != null ? _80_19_ : [])
            if (!(_k_.in(prjPath,this.queue)))
            {
                this.queue.push(prjPath)
            }
            return
        }
        if (!_k_.empty(this.projects[prjPath]))
        {
            return
        }
        this.indexing = prjPath
        walker = new Walker({root:prjPath,maxDepth:12,maxFiles:10000,file:(function (f)
        {
            return post.emit('index',f)
        }).bind(this)})
        result = await walker.start()
        if (result)
        {
            this.projects[prjPath] = {dir:prjPath,files:result.files}
            var list = _k_.list(result.files)
            for (var _100_21_ = 0; _100_21_ < list.length; _100_21_++)
            {
                file = list[_100_21_]
                this.allFiles[file] = prjPath
            }
            console.log('Projects indexed',prjPath,this.projects)
            post.emit('projectIndexed',prjPath)
        }
        delete this.indexing
        if (!_k_.empty(this.queue))
        {
            console.log('dequeue',this.queue[0])
            return await this.indexProject(this.queue.shift())
        }
    }
}

export default Projects;