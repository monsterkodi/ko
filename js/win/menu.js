// monsterkodi/kode 0.230.0

var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}, isArr: function (o) {return Array.isArray(o)}, clone: function (o,v) { v ??= new Map(); if (o instanceof Array) { if (!v.has(o)) {var r = []; v.set(o,r); for (var i=0; i < o.length; i++) {if (!v.has(o[i])) { v.set(o[i],_k_.clone(o[i],v)) }; r.push(v.get(o[i]))}}; return v.get(o) } else if (typeof o == 'string') { if (!v.has(o)) {v.set(o,''+o)}; return v.get(o) } else if (o != null && typeof o == 'object' && o.constructor.name == 'Object') { if (!v.has(o)) { var k, r = {}; v.set(o,r); for (k in o) { if (!v.has(o[k])) { v.set(o[k],_k_.clone(o[k],v)) }; r[k] = v.get(o[k]) }; }; return v.get(o) } else {return o} }, in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}}

var filelist, getMenu, klog, Macro, menu, os, slash, Syntax, Transform

filelist = require('kxk').filelist
klog = require('kxk').klog
os = require('kxk').os
slash = require('kxk').slash

Syntax = require('../editor/syntax')
Transform = require('../editor/actions/transform')
Macro = require('../commands/macro')

getMenu = function (template, name)
{
    var item

    var list = _k_.list(template)
    for (var _17_13_ = 0; _17_13_ < list.length; _17_13_++)
    {
        item = list[_17_13_]
        if (item.text === name)
        {
            return item
        }
    }
}

menu = function (template)
{
    var actionFile, actionFiles, actions, combo, commandMenu, editMenu, EditMenu, item, k, key, macro, MacroMenu, menuName, submenu, transform, transformList, transformMenu, TransformMenu, transformSubmenu, v, value, _41_38_, _51_33_, _52_44_, _54_43_, _55_39_

    if (_k_.isArr(template))
    {
        template = _k_.clone(template)
    }
    else
    {
        klog('no array?',typeof(template),template)
        template = []
    }
    actionFiles = filelist(slash.join(__dirname,'../editor/actions'))
    submenu = {Misc:[]}
    EditMenu = []
    var list = _k_.list(actionFiles)
    for (var _33_19_ = 0; _33_19_ < list.length; _33_19_++)
    {
        actionFile = list[_33_19_]
        if (!(_k_.in(slash.ext(actionFile),['js','coffee','kode'])))
        {
            continue
        }
        actions = require(actionFile)
        for (key in actions)
        {
            value = actions[key]
            menuName = 'Misc'
            if (key === 'actions')
            {
                if ((value['menu'] != null))
                {
                    menuName = value['menu']
                    submenu[menuName] = ((_41_38_=submenu[menuName]) != null ? _41_38_ : [])
                }
                for (k in value)
                {
                    v = value[k]
                    if (v.name && v.combo)
                    {
                        combo = v.combo
                        if (os.platform() !== 'darwin' && v.accel)
                        {
                            combo = v.accel
                        }
                        item = {text:v.name,accel:combo}
                        if ((v.menu != null))
                        {
                            submenu[v.menu] = ((_52_44_=submenu[v.menu]) != null ? _52_44_ : [])
                        }
                        if (v.separator)
                        {
                            submenu[((_54_43_=v.menu) != null ? _54_43_ : menuName)].push({text:''})
                        }
                        submenu[((_55_39_=v.menu) != null ? _55_39_ : menuName)].push(item)
                    }
                }
            }
        }
    }
    for (key in submenu)
    {
        menu = submenu[key]
        EditMenu.push({text:key,menu:menu})
    }
    editMenu = getMenu(template,'Edit')
    editMenu.menu = editMenu.menu.concat(EditMenu)
    MacroMenu = [{text:'Macro',combo:'command+m',accel:'ctrl+m',command:'macro'}]
    var list1 = _k_.list(Macro.macroNames)
    for (var _64_14_ = 0; _64_14_ < list1.length; _64_14_++)
    {
        macro = list1[_64_14_]
        MacroMenu.push({text:macro,actarg:macro,action:'doMacro'})
    }
    commandMenu = getMenu(template,'Command')
    commandMenu.menu = commandMenu.menu.concat({text:'Macro',menu:MacroMenu})
    TransformMenu = []
    for (transformMenu in Transform.Transform.transformMenus)
    {
        transformList = Transform.Transform.transformMenus[transformMenu]
        transformSubmenu = []
        var list2 = _k_.list(transformList)
        for (var _76_22_ = 0; _76_22_ < list2.length; _76_22_++)
        {
            transform = list2[_76_22_]
            transformSubmenu.push({text:transform,actarg:transform,action:'doTransform'})
        }
        TransformMenu.push({text:transformMenu,menu:transformSubmenu})
    }
    editMenu.menu = editMenu.menu.concat({text:'Transform',menu:TransformMenu})
    return template
}
module.exports = menu