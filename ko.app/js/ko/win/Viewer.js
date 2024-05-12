var _k_ = {in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}}

var Viewer

import kxk from "../../kxk.js"
let post = kxk.post
let slash = kxk.slash
let elem = kxk.elem
let $ = kxk.$


Viewer = (function ()
{
    function Viewer (parent)
    {
        this["close"] = this["close"].bind(this)
        this["onViewFile"] = this["onViewFile"].bind(this)
        this.div = elem({id:'viewer',parent:$(parent)})
        kore.on('view|file',this.onViewFile)
        kore.on('editor|file',this.close)
    }

    Viewer.prototype["onViewFile"] = function (path)
    {
        this.close()
        this.div.classList.add('active')
        if (_k_.in(slash.ext(path),['html']))
        {
            return elem('embed',{type:`text/${slash.ext(path)}`,class:'viewerEmbed',parent:this.div,src:slash.fileUrl(path)})
        }
        else
        {
            return elem('img',{class:'viewerImage',parent:this.div,src:slash.fileUrl(path)})
        }
    }

    Viewer.prototype["close"] = function ()
    {
        this.div.innerHTML = ''
        return this.div.classList.remove('active')
    }

    return Viewer
})()

export default Viewer;