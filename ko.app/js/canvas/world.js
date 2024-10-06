var _k_ = {min: function () { var m = Infinity; for (var a of arguments) { if (Array.isArray(a)) {m = _k_.min.apply(_k_.min,[m].concat(a))} else {var n = parseFloat(a); if(!isNaN(n)){m = n < m ? n : m}}}; return m }, max: function () { var m = -Infinity; for (var a of arguments) { if (Array.isArray(a)) {m = _k_.max.apply(_k_.max,[m].concat(a))} else {var n = parseFloat(a); if(!isNaN(n)){m = n > m ? n : m}}}; return m }, clamp: function (l,h,v) { var ll = Math.min(l,h), hh = Math.max(l,h); if (!_k_.isNum(v)) { v = ll }; if (v < ll) { v = ll }; if (v > hh) { v = hh }; if (!_k_.isNum(v)) { v = ll }; return v }, isNum: function (o) {return !isNaN(o) && !isNaN(parseFloat(o)) && (isFinite(o) || o === Infinity || o === -Infinity)}}

var world

import kxk from "../kxk.js"
let $ = kxk.$
let randInt = kxk.randInt
let randRange = kxk.randRange
let randIntRange = kxk.randIntRange
let elem = kxk.elem
let prefs = kxk.prefs
let post = kxk.post

import tweaky from "./tweaky.js"
import valgrid from "./valgrid.js"


world = (function ()
{
    function world ()
    {
        this["singleStep"] = this["singleStep"].bind(this)
        this["toggleValues"] = this["toggleValues"].bind(this)
        this["togglePause"] = this["togglePause"].bind(this)
        this["resize"] = this["resize"].bind(this)
        this["start"] = this["start"].bind(this)
        this.pause = false
        this.types = 12
        this.stepsPerFrame = 1
        this.dt = 0.025
        this.beta = 0.3
        this.num = 1000
        this.friction = 0.5
        this.maxVelocity = 0.5
        this.ageVel = 0.005
        this.showAge = false
        this.minRadius = 0.025
        this.maxRadius = 0.1
        this.canvas = elem('canvas',{class:'canvas'})
        this.main = $('main')
        this.main.appendChild(this.canvas)
        this.tweaky = new tweaky(this.main)
        this.valgrid = new valgrid(this.main)
        this.valgrrd = new valgrid(this.main)
        this.tweaky.init({num:{min:500,max:2000,step:100,value:this.num,cb:(function (num)
        {
            this.num = num
        
            return this.start()
        }).bind(this)},types:{min:2,max:16,step:1,value:this.types,cb:(function (types)
        {
            this.types = types
        
            return this.start()
        }).bind(this)},delta:{min:0.01,max:0.1,step:0.001,value:this.dt,cb:(function (dt)
        {
            this.dt = dt
        }).bind(this)},friction:{min:0.1,max:0.7,step:0.01,value:this.friction,cb:(function (friction)
        {
            this.friction = friction
        }).bind(this)},beta:{min:0.1,max:0.6,step:0.01,value:this.beta,cb:(function (beta)
        {
            this.beta = beta
        }).bind(this)},maxVelocity:{min:0.1,max:1,step:0.01,value:this.maxVelocity,cb:(function (maxVelocity)
        {
            this.maxVelocity = maxVelocity
        }).bind(this)},minRadius:{min:0.001,max:0.05,step:0.001,value:this.minRadius,cb:(function (minRadius)
        {
            this.minRadius = minRadius
        }).bind(this)},maxRadius:{min:0.05,max:0.5,step:0.01,value:this.maxRadius,cb:(function (maxRadius)
        {
            this.maxRadius = maxRadius
        }).bind(this)},ageVel:{min:0.001,max:0.1,step:0.001,value:this.ageVel,cb:(function (ageVel)
        {
            this.ageVel = ageVel
        }).bind(this)},showAge:{value:this.showAge,cb:(function (showAge)
        {
            this.showAge = showAge
        }).bind(this)}})
        post.on('resize',this.resize)
        this.resize()
        this.start()
    }

    world.prototype["start"] = function ()
    {
        var i

        this.matrix = this.randomMatrix(this.types)
        this.radii = this.randomRadii(this.types)
        this.colors = new Int32Array(this.num)
        this.ages = new Float32Array(this.num)
        this.positionsX = new Float32Array(this.num)
        this.positionsY = new Float32Array(this.num)
        this.velocitiesX = new Float32Array(this.num)
        this.velocitiesY = new Float32Array(this.num)
        this.hsl = []
        for (var _a_ = i = 0, _b_ = this.num; (_a_ <= _b_ ? i < this.num : i > this.num); (_a_ <= _b_ ? ++i : --i))
        {
            this.colors[i] = randInt(this.types)
            this.positionsX[i] = Math.random()
            this.positionsY[i] = Math.random()
            this.velocitiesX[i] = 0
            this.velocitiesY[i] = 0
            this.ages[i] = 0
            this.hsl[i] = `hsl(${360 * i / this.types},100%,50%)`
        }
        this.valgrid.init(this.matrix)
        return this.valgrrd.init(this.radii,{min:0,max:1,colors:this.hsl})
    }

    world.prototype["randomMatrix"] = function (n)
    {
        var i, j, row, rows

        rows = []
        for (var _a_ = i = 0, _b_ = n; (_a_ <= _b_ ? i < n : i > n); (_a_ <= _b_ ? ++i : --i))
        {
            row = []
            for (var _c_ = j = 0, _d_ = n; (_c_ <= _d_ ? j < n : j > n); (_c_ <= _d_ ? ++j : --j))
            {
                row.push(Math.random() * 2 - 1)
            }
            rows.push(row)
        }
        return rows
    }

    world.prototype["randomRadii"] = function (n)
    {
        var i, j, row, rows

        rows = []
        for (var _a_ = i = 0, _b_ = n; (_a_ <= _b_ ? i < n : i > n); (_a_ <= _b_ ? ++i : --i))
        {
            row = []
            for (var _c_ = j = 0, _d_ = n; (_c_ <= _d_ ? j < n : j > n); (_c_ <= _d_ ? ++j : --j))
            {
                row.push(Math.random())
            }
            rows.push(row)
        }
        return rows
    }

    world.prototype["resize"] = function ()
    {
        var br

        br = this.main.getBoundingClientRect()
        this.size = _k_.min(br.width,br.height)
        this.canvas.width = this.size
        this.canvas.height = this.size
        this.canvas.style.left = `${(_k_.max(0,br.width - this.size)) / 2}px`
        return this.canvas.style.top = `${(_k_.max(0,br.height - this.size)) / 2}px`
    }

    world.prototype["togglePause"] = function ()
    {
        this.pause = !this.pause
        return post.emit('pause')
    }

    world.prototype["toggleValues"] = function ()
    {
        this.tweaky.div.style.display = (this.tweaky.div.style.display === 'none' ? 'block' : 'none')
        this.valgrid.div.style.display = (this.valgrid.div.style.display === 'none' ? 'block' : 'none')
        return this.valgrrd.div.style.display = (this.valgrrd.div.style.display === 'none' ? 'block' : 'none')
    }

    world.prototype["force"] = function (r, a)
    {
        if (r < this.beta)
        {
            return r / this.beta - 1
        }
        if ((this.beta < r && r < 1))
        {
            return a * (1 - Math.abs(2 * r - 1 - this.beta) / (1 - this.beta))
        }
        return 0
    }

    world.prototype["simulate"] = function ()
    {
        var f, i, j, r, rMax, rx, ry, totalForceX, totalForceY

        if (this.pause && !this.oneStep)
        {
            return
        }
        delete this.oneStep
        for (var _a_ = i = 0, _b_ = this.num; (_a_ <= _b_ ? i < this.num : i > this.num); (_a_ <= _b_ ? ++i : --i))
        {
            totalForceX = 0
            totalForceY = 0
            for (var _c_ = j = 0, _d_ = this.num; (_c_ <= _d_ ? j < this.num : j > this.num); (_c_ <= _d_ ? ++j : --j))
            {
                if (i === j)
                {
                    continue
                }
                rx = this.positionsX[j] - this.positionsX[i]
                ry = this.positionsY[j] - this.positionsY[i]
                if (rx > 0.5)
                {
                    rx = rx - 1
                }
                if (ry > 0.5)
                {
                    ry = ry - 1
                }
                if (rx < -0.5)
                {
                    rx = rx + 1
                }
                if (ry < -0.5)
                {
                    ry = ry + 1
                }
                r = Math.hypot(rx,ry)
                rMax = this.minRadius + this.radii[this.colors[i]][this.colors[j]] * (this.maxRadius - this.minRadius)
                if (r > 0 && r < rMax)
                {
                    f = this.force(r / rMax,this.matrix[this.colors[i]][this.colors[j]])
                    totalForceX += rx / r * f
                    totalForceY += ry / r * f
                }
            }
            this.velocitiesX[i] += totalForceX * this.dt
            this.velocitiesY[i] += totalForceY * this.dt
            if (Math.abs(this.velocitiesX[i]) < this.ageVel && Math.abs(this.velocitiesY[i]) < this.ageVel)
            {
                this.ages[i] += 0.01
                if (this.ages[i] > 1)
                {
                    this.colors[i] = randInt(this.types)
                    this.positionsX[i] = Math.random()
                    this.positionsY[i] = Math.random()
                    this.velocitiesX[i] = 2 * (2 * Math.random() * this.ageVel - this.ageVel)
                    this.velocitiesY[i] = 2 * (2 * Math.random() * this.ageVel - this.ageVel)
                    this.ages[i] = 0
                }
            }
            else
            {
                this.ages[i] = 0
            }
        }
        for (var _e_ = i = 0, _f_ = this.num; (_e_ <= _f_ ? i < this.num : i > this.num); (_e_ <= _f_ ? ++i : --i))
        {
            this.velocitiesX[i] *= this.friction
            this.velocitiesY[i] *= this.friction
            this.velocitiesX[i] = _k_.clamp(-this.maxVelocity,this.maxVelocity,this.velocitiesX[i])
            this.velocitiesY[i] = _k_.clamp(-this.maxVelocity,this.maxVelocity,this.velocitiesY[i])
            this.positionsX[i] += this.velocitiesX[i] * this.dt
            this.positionsY[i] += this.velocitiesY[i] * this.dt
            if (this.positionsX[i] < 0)
            {
                this.positionsX[i] += 1
            }
            if (this.positionsY[i] < 0)
            {
                this.positionsY[i] += 1
            }
            if (this.positionsX[i] > 1)
            {
                this.positionsX[i] -= 1
            }
            if (this.positionsY[i] > 1)
            {
                this.positionsY[i] -= 1
            }
        }
    }

    world.prototype["singleStep"] = function ()
    {
        this.oneStep = true
        this.pause = true
        return post.emit('pause')
    }

    world.prototype["tick"] = function (tickInfo)
    {
        var ctx, i, radius, screenX, screenY

        for (var _a_ = i = 0, _b_ = this.stepsPerFrame; (_a_ <= _b_ ? i < this.stepsPerFrame : i > this.stepsPerFrame); (_a_ <= _b_ ? ++i : --i))
        {
            this.simulate()
        }
        this.canvas.width = this.canvas.width
        ctx = this.canvas.getContext('2d')
        for (var _c_ = i = 0, _d_ = this.num; (_c_ <= _d_ ? i < this.num : i > this.num); (_c_ <= _d_ ? ++i : --i))
        {
            screenX = this.positionsX[i] * this.canvas.width
            screenY = this.positionsY[i] * this.canvas.height
            if (this.showAge)
            {
                ctx.fillStyle = `hsl(${360 * this.ages[i]},100%,50%)`
            }
            else
            {
                ctx.fillStyle = this.hsl[this.colors[i]]
            }
            if (this.num <= 1000)
            {
                radius = 6 * 500 / this.num
                ctx.beginPath()
                ctx.arc(screenX,screenY,radius,0,2 * Math.PI)
                ctx.fill()
            }
            else
            {
                ctx.fillRect(screenX,screenY,4,4)
            }
        }
    }

    return world
})()

export default world;