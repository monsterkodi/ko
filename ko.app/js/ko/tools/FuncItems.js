var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}, empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}}

var FuncItems


FuncItems = (function ()
{
    function FuncItems ()
    {}

    FuncItems["forIndexerInfo"] = function (file, info)
    {
        var arr, clss, clsss, func, funcs, items, text, type, _14_29_, _19_27_

        items = []
        clsss = ((_14_29_=info.classes) != null ? _14_29_ : [])
        var list = _k_.list(clsss)
        for (var _15_17_ = 0; _15_17_ < list.length; _15_17_++)
        {
            clss = list[_15_17_]
            text = '● ' + clss.name
            items.push({name:clss.name,text:text,type:'class',path:file,line:clss.line})
        }
        funcs = ((_19_27_=info.funcs) != null ? _19_27_ : [])
        var list1 = _k_.list(funcs)
        for (var _21_17_ = 0; _21_17_ < list1.length; _21_17_++)
        {
            func = list1[_21_17_]
            type = 'func'
            arr = (func.bound ? '=> ' : '-> ')
            if (func.test)
            {
                type = 'test'
                if (func.test === 'describe')
                {
                    console.log('describe still used?')
                    text = '● ' + func.name
                }
                else
                {
                    text = '▸ ' + func.name
                }
            }
            else if (func.static)
            {
                if (func.async)
                {
                    text = '○●' + arr + func.name
                }
                else
                {
                    text = ' ●' + arr + func.name
                }
            }
            else
            {
                if (func.async)
                {
                    text = ' ○' + arr + func.name
                }
                else
                {
                    text = '  ' + arr + func.name
                }
            }
            items.push({name:func.name,text:text,type:type,path:file,line:func.line})
        }
        if (!_k_.empty(items))
        {
            items.sort(function (a, b)
            {
                return a.line - b.line
            })
        }
        return items
    }

    return FuncItems
})()

export default FuncItems;