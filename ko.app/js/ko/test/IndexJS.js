var toExport = {}
var idx

import IndexJS from "../tools/IndexJS.js"

toExport["IndexJS"] = function ()
{
    section("class", function ()
    {
        idx = new IndexJS
        compare(idx.parse(""),{classes:[],funcs:[],lines:1})
        compare(idx.parse("class Hello"),{classes:[{name:'Hello',type:'class',line:0}],funcs:[],lines:1})
        compare(idx.parse(`class World
    constructor ()`),{classes:[{name:'World',type:'class',line:0}],funcs:[{method:'constructor',line:1,class:'World'}],lines:2})
        compare(idx.parse(`class World
    constructor (a,b)`),{classes:[{name:'World',type:'class',line:0}],funcs:[{method:'constructor',line:1,class:'World'}],lines:2})
        compare(idx.parse(`class World
    fun (a, b)
    {
        if (a)
        {
            for (var i = 0; i < 10; i++)
            {
                b += a
            }
        }
    }`),{classes:[{name:'World',type:'class',line:0}],funcs:[{method:'fun',line:1,class:'World'}],lines:11})
        compare(idx.parse(`class World
    constructor (a,b)
    {
        this.onFileChanged = this.onFileChanged.bind(this)
    }
    
    onFileChanged ()`),{classes:[{name:'World',type:'class',line:0}],funcs:[{method:'constructor',line:1,class:'World'},{method:'onFileChanged',line:6,class:'World',bound:true}],lines:7})
    })
    section("function", function ()
    {
        idx = new IndexJS
        compare(idx.parse("Git = (function ()"),{classes:[{name:'Git',type:'function',line:0}],funcs:[],lines:1})
        compare(idx.parse(`Git = (function ()
{
    Git["statusRequests"] = {}
    Git["statusCache"] = {}
    function Git ()`),{classes:[{name:'Git',type:'function',line:0}],funcs:[{method:'Git',line:4,class:'Git'}],lines:5})
        compare(idx.parse(`Git = (function ()
{
    Git.prototype["onProjectIndexed"] = function (prjPath)
    {
    }

    Git["onFileChanged"] = function (file)
    {`),{classes:[{name:'Git',type:'function',line:0}],funcs:[{method:'onProjectIndexed',line:2,class:'Git'},{method:'onFileChanged',line:6,class:'Git',static:true}],lines:8})
        compare(idx.parse(`Git = (function ()
{
    Git.prototype["onProjectIndexed"] = async function (prjPath)
    {
    }

    Git["onFileChanged"] = async function (file)
    {`),{classes:[{name:'Git',type:'function',line:0}],funcs:[{method:'onProjectIndexed',line:2,class:'Git',async:true},{method:'onFileChanged',line:6,class:'Git',static:true,async:true}],lines:8})
        compare(idx.parse(`Git = (function ()
{
    function Git ()
    {
        this["onFileChanged"] = this["onFileChanged"].bind(this)
    }

    Git["onFileChanged"] = function (file)
    {`),{classes:[{name:'Git',type:'function',line:0}],funcs:[{method:'Git',line:2,class:'Git'},{method:'onFileChanged',line:7,class:'Git',static:true,bound:true}],lines:9})
    })
    section("func", function ()
    {
        compare(idx.parse(`myFunc = function (a, b)`),{classes:[],funcs:[{name:'myFunc',line:0}],lines:1})
    })
}
toExport["IndexJS"]._section_ = true
toExport._test_ = true
export default toExport
