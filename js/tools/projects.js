// monsterkodi/kode 0.228.0

var _k_ = {empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}, valid: undefined}

var files, kxk, numFiles, post, slash

kxk = require('kxk')
post = kxk.post
slash = kxk.slash

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
        for (dir in files)
        {
            list = files[dir]
            if (file.startsWith(dir))
            {
                return list
            }
        }
        if (dir = slash.pkg(file))
        {
            if (info = post.get('indexer','project',dir))
            {
                Projects.onIndexed(info)
                return files[info.dir]
            }
        }
        console.log(`no project files for file ${file}`,Object.keys(files))
        return []
    }
}

post.on('projectIndexed',Projects.onIndexed)
module.exports = Projects