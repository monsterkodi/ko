// monsterkodi/kode 0.257.0

var _k_ = {empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}}

var files, numFiles, post, slash

post = require('kxk').post
slash = require('kxk').slash

files = {}
numFiles = 0
class Projects
{
    static refresh ()
    {
        return files = {}
    }

    static onIndexed (info)
    {
        if (!_k_.empty(info.files))
        {
            console.log('project indexed',info)
            files[info.dir] = info.files
            return numFiles += info.files.length
        }
    }

    static files (file)
    {
        var dir, info, list

        if (!file)
        {
            return []
        }
        if ((files[file] != null))
        {
            return files[file]
        }
        if (dir = slash.pkg(file))
        {
            if (info = post.get('indexer','project',dir))
            {
                Projects.onIndexed(info)
                console.log('got main index',info)
                return files[info.dir]
            }
        }
        for (dir in files)
        {
            list = files[dir]
            if (file.startsWith(dir))
            {
                console.log('fallback index',file,dir,list)
                return list
            }
        }
        console.log(`no project files for file ${file}`,Object.keys(files))
        return []
    }
}

post.on('projectIndexed',Projects.onIndexed)
module.exports = Projects