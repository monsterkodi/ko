// monsterkodi/kode 0.228.0

var _k_ = {in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}, list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

var ignore, indexKoFiles, indexProject, info, shouldIndex, slash, walkdir

ignore = require('ignore')
slash = require('kslash')
walkdir = require('walkdir')

shouldIndex = function (path, stat)
{
    var exts

    exts = ['coffee','kode','styl','pug','md','noon','txt','json','sh','py','cpp','cc','c','cs','h','hpp','js']
    if (_k_.in(slash.ext(path),exts))
    {
        if (stat.size > 654321)
        {
            return false
        }
        else
        {
            return true
        }
    }
    return false
}

indexKoFiles = function (kofiles, info)
{
    var absDir, cfg, dir, ign, kodata, kofile, noon, opt, _34_37_

    var list = _k_.list(kofiles)
    for (var _25_15_ = 0; _25_15_ < list.length; _25_15_++)
    {
        kofile = list[_25_15_]
        noon = require('noon')
        kodata = noon.load(kofile)
        if (!kodata.index)
        {
            return
        }
        for (dir in kodata.index)
        {
            cfg = kodata.index[dir]
            opt = {max_depth:((_34_37_=cfg.depth) != null ? _34_37_ : 4),no_return:true}
            ign = ignore()
            if (cfg.ignore)
            {
                ign.add(cfg.ignore)
            }
            absDir = slash.join(slash.dir(kofile),dir)
            walkdir.sync(absDir,opt,function (path, stat)
            {
                if (ign.ignores(slash.relative(path,dir)))
                {
                    return this.ignore(path)
                }
                else if (stat.isFile())
                {
                    if (shouldIndex(path,stat))
                    {
                        return info.files.push(slash.path(path))
                    }
                }
            })
        }
    }
}

indexProject = function (file)
{
    var depth, dir, ign, info, kofiles, opt

    depth = 20
    dir = slash.pkg(file)
    if (!dir)
    {
        depth = 3
        if (slash.isFile(file))
        {
            dir = slash.dir(file)
        }
        else if (slash.isDir(file))
        {
            dir = file
        }
    }
    if (!dir)
    {
        return
    }
    kofiles = []
    info = {dir:dir,files:[]}
    ign = ignore()
    opt = {max_depth:depth,no_return:true}
    walkdir.sync(dir,opt,function (path, stat)
    {
        var addIgnores, gitignore

        addIgnores = function (gitignore)
        {
            var gitdir, gitign

            gitign = slash.readText(gitignore)
            gitign = gitign.split(/\r?\n/)
            gitign = gitign.filter(function (i)
            {
                var _79_55_

                return ((i != null ? i.startsWith : undefined) != null) && !i.startsWith("#")
            })
            gitdir = slash.dir(gitignore)
            if (!slash.samePath(gitdir,dir))
            {
                gitign = gitign.map(function (i)
                {
                    if (i[0] === '!')
                    {
                        return '!' + slash.relative(gitdir,dir) + i.slice(1)
                    }
                    else
                    {
                        return slash.relative(gitdir,dir) + i
                    }
                })
            }
            return ign.add(gitign)
        }
        if (ign.ignores(slash.relative(path,dir)))
        {
            this.ignore(path)
            return
        }
        if (stat.isDirectory())
        {
            gitignore = slash.join(path,'.gitignore')
            if (slash.isFile(gitignore))
            {
                return addIgnores(gitignore)
            }
        }
        else
        {
            file = slash.file(path)
            if (file === '.gitignore')
            {
                addIgnores(path)
                return
            }
            if (file === '.ko.noon')
            {
                kofiles.push(path)
            }
            if (shouldIndex(path,stat))
            {
                return info.files.push(slash.path(path))
            }
        }
    })
    indexKoFiles(kofiles,info)
    return info
}
if (module.parent)
{
    module.exports = indexProject
}
else
{
    info = indexProject(slash.resolve(process.argv[2]))
    console.log(`${info.files.length} files`)
}