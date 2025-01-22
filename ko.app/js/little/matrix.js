var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}, empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}, in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}}

var matrix

import kxk from "../kxk.js"
let fade = kxk.fade
let randRange = kxk.randRange
let randInt = kxk.randInt
let randIntRange = kxk.randIntRange


matrix = (function ()
{
    function matrix ()
    {
        var t

        this["randomOffsetCross"] = this["randomOffsetCross"].bind(this)
        this["randomOffset"] = this["randomOffset"].bind(this)
        this["neighborLeaf"] = this["neighborLeaf"].bind(this)
        this["leafToEatAt"] = this["leafToEatAt"].bind(this)
        this["tubeAt"] = this["tubeAt"].bind(this)
        this["plantAt"] = this["plantAt"].bind(this)
        this["critterAt"] = this["critterAt"].bind(this)
        this["objectOfTypeAt"] = this["objectOfTypeAt"].bind(this)
        this["neighbors"] = this["neighbors"].bind(this)
        this["validNeighbors"] = this["validNeighbors"].bind(this)
        this["emptyNeighbor"] = this["emptyNeighbor"].bind(this)
        this["buildingAt"] = this["buildingAt"].bind(this)
        this["isEmpty"] = this["isEmpty"].bind(this)
        this["isInWorld"] = this["isInWorld"].bind(this)
        this["objectAt"] = this["objectAt"].bind(this)
        this["del"] = this["del"].bind(this)
        this["delAt"] = this["delAt"].bind(this)
        this["takeAt"] = this["takeAt"].bind(this)
        this["makePlant"] = this["makePlant"].bind(this)
        this["addPlant"] = this["addPlant"].bind(this)
        this["addTube"] = this["addTube"].bind(this)
        this["addCorpse"] = this["addCorpse"].bind(this)
        this["addCritter"] = this["addCritter"].bind(this)
        this["addEgg"] = this["addEgg"].bind(this)
        this["addGrinder"] = this["addGrinder"].bind(this)
        this["addObject"] = this["addObject"].bind(this)
        this["placeObjectOfType"] = this["placeObjectOfType"].bind(this)
        this["anim"] = this["anim"].bind(this)
        this["returnBot"] = this["returnBot"].bind(this)
        this["moveBotTo"] = this["moveBotTo"].bind(this)
        this["moveLeafTo"] = this["moveLeafTo"].bind(this)
        this["moveObjectFrom"] = this["moveObjectFrom"].bind(this)
        this["animate"] = this["animate"].bind(this)
        this["critterEggPeriod"] = this["critterEggPeriod"].bind(this)
        this["critterEggFactor"] = this["critterEggFactor"].bind(this)
        this["deadCritterForGrinder"] = this["deadCritterForGrinder"].bind(this)
        this["neighborsAtDistance"] = this["neighborsAtDistance"].bind(this)
        this["advance"] = this["advance"].bind(this)
        this["start"] = this["start"].bind(this)
        this["setCritterAge"] = this["setCritterAge"].bind(this)
        this.PLANT = 0
        this.EGG = 1
        this.CRITTER = 2
        this.CORPSE = 3
        this.GRINDER = 4
        this.TUBE = 5
        this.NUM_TYPES = 6
        this.anims = []
        this.eggs = []
        this.critters = []
        this.plants = []
        this.tubes = []
        this.grinders = []
        this.types = []
        for (var _a_ = t = 0, _b_ = this.NUM_TYPES; (_a_ <= _b_ ? t < this.NUM_TYPES : t > this.NUM_TYPES); (_a_ <= _b_ ? ++t : --t))
        {
            this.types.push([])
        }
        this.ws = 5
        this.cycles = 0
        this.eggFadeTime = 6
        this.eggMoveTime = 3
        this.critMoveTime = 4
        this.critDieTime = 4
        this.leafEatTime = 4
        this.botDelta = 1
        this.numLeaves = 8
        this.setCritterAge(1000)
        this.critterNumEggs = 2
        this.eggMaxAge = 100
        this.leafMaxAge = 50
        this.critterEatPeriod = 50
        this.critterStarveTime = 50
        this.tweaky.init({speed:{min:1,max:100,step:1,value:this.speed,cb:(function (speed)
        {
            this.speed = speed
        }).bind(this)},leaves:{min:4,max:12,step:1,value:this.numLeaves,cb:(function (numLeaves)
        {
            this.numLeaves = numLeaves
        }).bind(this)},leafAge:{min:1,max:100,step:1,value:this.leafMaxAge,cb:(function (leafMaxAge)
        {
            this.leafMaxAge = leafMaxAge
        }).bind(this)},eggAge:{min:10,max:200,step:10,value:this.eggMaxAge,cb:(function (eggMaxAge)
        {
            this.eggMaxAge = eggMaxAge
        }).bind(this)},critterAge:{min:100,max:2400,step:100,value:this.critterMaxAge,cb:this.setCritterAge},eatPeriod:{min:1,max:100,step:1,value:this.critterEatPeriod,cb:(function (critterEatPeriod)
        {
            this.critterEatPeriod = critterEatPeriod
        }).bind(this)},starveTime:{min:1,max:100,step:1,value:this.critterStarveTime,cb:(function (critterStarveTime)
        {
            this.critterStarveTime = critterStarveTime
        }).bind(this)},botDelta:{min:1,max:10,step:0.1,value:this.botDelta,cb:(function (botDelta)
        {
            this.botDelta = botDelta
        }).bind(this)},bloomSpread:{min:1,max:32,step:1,value:this.g.bloomSpread,cb:(function (v)
        {
            return this.g.bloomSpread = v
        }).bind(this)},bllomIntens:{min:0.1,max:2,step:0.1,value:this.g.bloomIntensity,cb:(function (v)
        {
            return this.g.bloomIntensity = v
        }).bind(this)},fbo:{value:false,cb:(function (useFBO)
        {
            return this.g.useFBO = useFBO
        }).bind(this)},anims:{info:(function ()
        {
            return this.anims.length
        }).bind(this)},critters:{info:(function ()
        {
            return this.critters.length
        }).bind(this)},corpses:{info:(function ()
        {
            return this.critters.filter(function (c)
            {
                return c.df >= 1
            }).length
        }).bind(this)},plants:{info:(function ()
        {
            return this.plants.length
        }).bind(this)},cycles:{info:(function ()
        {
            return this.cycles.toFixed(2)
        }).bind(this)}})
    }

    matrix.prototype["setCritterAge"] = function (critterMaxAge)
    {
        this.critterMaxAge = critterMaxAge
    
        return this.critterAdultAge = parseInt(this.critterMaxAge / 3)
    }

    matrix.prototype["start"] = function ()
    {
        var column, t, x, y

        this.cycles = 0
        this.anims = []
        this.grid = []
        this.types = []
        for (var _a_ = t = 0, _b_ = this.NUM_TYPES; (_a_ <= _b_ ? t < this.NUM_TYPES : t > this.NUM_TYPES); (_a_ <= _b_ ? ++t : --t))
        {
            this.types.push([])
        }
        this.eggs = this.types[this.EGG]
        this.critters = this.types[this.CRITTER]
        this.plants = this.types[this.PLANT]
        this.tubes = this.types[this.TUBE]
        this.grinders = this.types[this.GRINDER]
        for (var _c_ = x = 0, _d_ = this.ws; (_c_ <= _d_ ? x < this.ws : x > this.ws); (_c_ <= _d_ ? ++x : --x))
        {
            column = []
            for (var _e_ = y = 0, _f_ = this.ws; (_e_ <= _f_ ? y < this.ws : y > this.ws); (_e_ <= _f_ ? ++y : --y))
            {
                column.push(null)
            }
            this.grid.push(column)
        }
        this.slots[this.CORPSE].num = 0
        this.slots[this.PLANT].num = 1
        this.slots[this.EGG].num = 1
        if (0)
        {
            this.addEgg(this.ws / 2,this.ws / 2)
            for (var _10_ = x = 0, _11_ = this.ws / 3; (_10_ <= _11_ ? x <= this.ws / 3 : x >= this.ws / 3); (_10_ <= _11_ ? ++x : --x))
            {
                for (var _12_ = y = 0, _13_ = this.ws / 3; (_12_ <= _13_ ? y <= this.ws / 3 : y >= this.ws / 3); (_12_ <= _13_ ? ++y : --y))
                {
                    this.addPlant(x * 3,y * 3)
                }
            }
        }
    }

    matrix.prototype["advance"] = function (sec)
    {
        var c, e, g, l, n, op, p, _142_21_

        this.cycles += sec / 60
        var list = _k_.list(this.eggs)
        for (var _a_ = 0; _a_ < list.length; _a_++)
        {
            e = list[_a_]
            e.age += sec
            if (e.age > this.eggMaxAge && e.age - sec <= this.eggMaxAge)
            {
                this.addCritter(e.x,e.y)
            }
            if (e.age > this.eggMaxAge + this.eggFadeTime)
            {
                this.del(e)
            }
        }
        var list1 = _k_.list(this.critters)
        for (var _b_ = 0; _b_ < list1.length; _b_++)
        {
            c = list1[_b_]
            c.eat -= sec
            if (!c.df)
            {
                c.age += sec
            }
            if (c.age > this.critterMaxAge || c.eat < -this.critterStarveTime)
            {
                c.df = ((_142_21_=c.df) != null ? _142_21_ : 0)
                c.df += sec / this.critDieTime
                continue
            }
            if (c.eat < 0)
            {
                if (l = this.neighborLeaf(c))
                {
                    c.eat = this.critterEatPeriod
                    l.age = -this.leafEatTime
                    this.moveLeafTo(l,c,this.leafEatTime)
                }
            }
            if (c.p)
            {
                continue
            }
            if (c.ox || c.oy)
            {
                continue
            }
            if (Math.floor((c.age - this.critterAdultAge) / this.critterEggPeriod(c)) > c.eggs)
            {
                if (n = this.emptyNeighbor(c))
                {
                    e = this.addEgg(n.x,n.y)
                    this.moveObjectFrom(e,this.critterWombPos(c),this.eggMoveTime)
                    this.anim(c,'p',1,0,2)
                }
                c.eggs++
            }
            if (this.critterEggFactor(c) > 0.9)
            {
                continue
            }
            if (c.age / this.critterMaxAge > 0.98)
            {
                continue
            }
            n = this.randomOffset(c)
            if (this.isInWorld(n) && this.isEmpty(n))
            {
                op = {x:c.x,y:c.y}
                this.grid[c.x][c.y] = null
                c.x = n[0]
                c.y = n[1]
                this.grid[c.x][c.y] = c
                this.moveObjectFrom(c,op,this.critMoveTime)
            }
        }
        var list2 = _k_.list(this.plants)
        for (var _c_ = 0; _c_ < list2.length; _c_++)
        {
            p = list2[_c_]
            var list3 = _k_.list(p.leaves)
            for (var _d_ = 0; _d_ < list3.length; _d_++)
            {
                l = list3[_d_]
                l.age += sec
            }
        }
        var list4 = _k_.list(this.grinders)
        for (var _e_ = 0; _e_ < list4.length; _e_++)
        {
            g = list4[_e_]
            if (!g.bot.c)
            {
                if (c = this.deadCritterForGrinder(g))
                {
                    c.bot = g.bot
                    this.moveBotTo(g.bot,c)
                }
            }
            else
            {
                if (g.bot.mf <= 0)
                {
                    g.bot.x = g.bot.c.x
                    g.bot.y = g.bot.c.y
                    this.del(g.bot.c)
                    delete g.bot.mf
                    this.returnBot(g.bot,g)
                }
                else if (g.bot.rf <= 0)
                {
                    delete g.bot.rf
                    delete g.bot.s
                    delete g.bot.c
                    g.bot.x = g.x
                    g.bot.y = g.y
                }
            }
        }
        return this.animate(sec)
    }

    matrix.prototype["neighborsAtDistance"] = function (d)
    {
        var x, y, _205_12_

        this.nd = ((_205_12_=this.nd) != null ? _205_12_ : [])
        if (this.nd[d])
        {
            return this.nd[d]
        }
        this.nd[d] = []
        for (var _a_ = x = -d, _b_ = d; (_a_ <= _b_ ? x < d : x > d); (_a_ <= _b_ ? ++x : --x))
        {
            this.nd[d].push([x,-d])
        }
        for (var _c_ = y = -d, _d_ = d; (_c_ <= _d_ ? y < d : y > d); (_c_ <= _d_ ? ++y : --y))
        {
            this.nd[d].push([d,y])
        }
        for (var _e_ = x = d, _f_ = -d; (_e_ <= _f_ ? x < -d : x > -d); (_e_ <= _f_ ? ++x : --x))
        {
            this.nd[d].push([x,d])
        }
        for (var _10_ = y = d, _11_ = -d; (_10_ <= _11_ ? y < -d : y > -d); (_10_ <= _11_ ? ++y : --y))
        {
            this.nd[d].push([-d,y])
        }
        return this.nd[d]
    }

    matrix.prototype["deadCritterForGrinder"] = function (g)
    {
        var c, d, n

        for (var _a_ = d = 1, _b_ = parseInt(this.ws / 2); (_a_ <= _b_ ? d < parseInt(this.ws / 2) : d > parseInt(this.ws / 2)); (_a_ <= _b_ ? ++d : --d))
        {
            var list = _k_.list(this.neighborsAtDistance(d))
            for (var _c_ = 0; _c_ < list.length; _c_++)
            {
                n = list[_c_]
                if (c = this.critterAt([g.x + n[0],g.y + n[1]]))
                {
                    if (c.df >= 1 && !c.bot)
                    {
                        return c
                    }
                }
            }
        }
        return null
    }

    matrix.prototype["critterEggFactor"] = function (c)
    {
        var f

        f = 0
        if (c.age > this.critterAdultAge && c.eggs < this.critterNumEggs)
        {
            f = (c.age - this.critterAdultAge) / this.critterEggPeriod(c)
            f -= c.eggs
        }
        return f
    }

    matrix.prototype["critterEggPeriod"] = function (c)
    {
        return (this.critterMaxAge - this.critterAdultAge) / (this.critterNumEggs + 1)
    }

    matrix.prototype["animate"] = function (sec)
    {
        var a, ai, d

        if (_k_.empty(this.anims))
        {
            return
        }
        for (var _a_ = ai = this.anims.length - 1, _b_ = 0; (_a_ <= _b_ ? ai <= 0 : ai >= 0); (_a_ <= _b_ ? ++ai : --ai))
        {
            a = this.anims[ai]
            d = (sec / a.d) * (a.t - a.s)
            a.o[a.m] += d
            if ((d > 0 && a.o[a.m] >= a.t) || (d < 0 && a.o[a.m] <= a.t))
            {
                a.o[a.m] = a.t
                this.anims.splice(ai,1)
            }
        }
    }

    matrix.prototype["moveObjectFrom"] = function (o, s, d = 1)
    {
        this.anim(o,'ox',s.x - o.x,0,d)
        return this.anim(o,'oy',s.y - o.y,0,d)
    }

    matrix.prototype["moveLeafTo"] = function (l, t, d = 1)
    {
        l.c = t
        return this.anim(l,'ef',1,0,d)
    }

    matrix.prototype["moveBotTo"] = function (b, t)
    {
        var d

        b.c = t
        d = Math.sqrt((b.x - t.x) * (b.x - t.x) + (b.y - t.y) * (b.y - t.y))
        d /= this.botDelta
        return this.anim(b,'mf',1,0,d)
    }

    matrix.prototype["returnBot"] = function (b, g)
    {
        var d

        b.s = {x:b.x,y:b.y}
        d = Math.sqrt((b.x - g.x) * (b.x - g.x) + (b.y - g.y) * (b.y - g.y))
        d /= this.botDelta
        return this.anim(b,'rf',1,0,d)
    }

    matrix.prototype["anim"] = function (o, m, s, t, d)
    {
        if (d <= 0)
        {
            return
        }
        if (s === t)
        {
            return
        }
        o[m] = s
        return this.anims.push({o:o,m:m,s:s,t:t,d:d})
    }

    matrix.prototype["placeObjectOfType"] = function (p, type)
    {
        var o, x, y

        x = parseInt(p[0])
        y = parseInt(p[1])
        this.takeAt([x,y])
        o = ((function ()
        {
            switch (type)
            {
                case this.GRINDER:
                    return {bot:{x:x,y:y}}

                case this.EGG:
                    return {age:0}

                case this.CRITTER:
                    return {age:0,sx:0,sy:0,sf:0,eggs:0,eat:this.critterEatPeriod}

                case this.CORPSE:
                    return {age:2 * this.critterMaxAge,sx:1,sy:1,df:1,eggs:0}

                case this.PLANT:
                    return this.makePlant(x,y,this.numLeaves)

            }

        }).bind(this))()
        o.type = (type === this.CORPSE ? this.CRITTER : type)
        return this.addObject(x,y,o)
    }

    matrix.prototype["addObject"] = function (x, y, o)
    {
        var n

        o.x = parseInt(x)
        o.y = parseInt(y)
        this.delAt([o.x,o.y])
        if (o.type === this.GRINDER)
        {
            var list = _k_.list(this.validNeighbors(o))
            for (var _a_ = 0; _a_ < list.length; _a_++)
            {
                n = list[_a_]
                this.delAt(n)
                this.grid[n[0]][n[1]] = o
            }
        }
        this.grid[o.x][o.y] = o
        this.types[o.type].push(o)
        return o
    }

    matrix.prototype["addGrinder"] = function (x, y)
    {
        return this.addObject(x,y,{type:this.GRINDER,bot:{x:x,y:y}})
    }

    matrix.prototype["addEgg"] = function (x, y)
    {
        return this.addObject(x,y,{type:this.EGG,age:0})
    }

    matrix.prototype["addCritter"] = function (x, y)
    {
        return this.addObject(x,y,{type:this.CRITTER,age:0,sx:0,sy:0,sf:0,eggs:0,eat:this.critterEatPeriod})
    }

    matrix.prototype["addCorpse"] = function (x, y)
    {
        return this.addObject(x,y,{type:this.CRITTER,age:2 * this.critterMaxAge,sx:1,sy:1,df:1,eggs:0})
    }

    matrix.prototype["addTube"] = function (x, y, idx)
    {
        return this.addObject(x,y,{type:this.TUBE,idx:idx})
    }

    matrix.prototype["addPlant"] = function (x, y)
    {
        return this.addObject(x,y,this.makePlant(x,y,this.numLeaves))
    }

    matrix.prototype["makePlant"] = function (x, y, numLeaves, leafAge)
    {
        var l, leaves

        leaves = []
        for (var _a_ = l = 0, _b_ = numLeaves; (_a_ <= _b_ ? l < numLeaves : l > numLeaves); (_a_ <= _b_ ? ++l : --l))
        {
            leaves.push({age:(leafAge != null ? leafAge : -l * this.leafMaxAge / this.numLeaves)})
        }
        return {x:x,y:y,type:this.PLANT,leaves:leaves}
    }

    matrix.prototype["takeAt"] = function (p)
    {
        var o

        if (o = this.objectAt(p))
        {
            if (this.slots[o.type])
            {
                this.slots[o.type].num++
            }
            else if (o.type === this.CRITTER)
            {
                this.slots[this.CORPSE].num++
            }
            return this.del(o)
        }
    }

    matrix.prototype["delAt"] = function (p)
    {
        var o

        if (o = this.objectAt(p))
        {
            return this.del(o)
        }
    }

    matrix.prototype["del"] = function (o)
    {
        var n

        this.types[o.type].splice(this.types[o.type].indexOf(o),1)
        this.grid[o.x][o.y] = null
        if (o.type === this.GRINDER)
        {
            var list = _k_.list(this.validNeighbors(o))
            for (var _a_ = 0; _a_ < list.length; _a_++)
            {
                n = list[_a_]
                this.grid[n[0]][n[1]] = null
            }
        }
    }

    matrix.prototype["objectAt"] = function (p)
    {
        if (this.isInWorld(p))
        {
            return this.grid[p[0]][p[1]]
        }
    }

    matrix.prototype["isInWorld"] = function (p)
    {
        return p[0] >= 0 && p[1] >= 0 && p[0] < this.ws && p[1] < this.ws
    }

    matrix.prototype["isEmpty"] = function (p)
    {
        return !this.objectAt(p)
    }

    matrix.prototype["buildingAt"] = function (p)
    {
        var o

        if (o = this.objectAt(p))
        {
            return _k_.in(o.type,[this.PLANT])
        }
        return false
    }

    matrix.prototype["emptyNeighbor"] = function (o)
    {
        var c, en, x, y

        en = []
        for (x = -1; x <= 1; x++)
        {
            for (y = -1; y <= 1; y++)
            {
                if ((x === y && y === 0))
                {
                    continue
                }
                c = [o.x + x,o.y + y]
                if (!this.isInWorld(c))
                {
                    continue
                }
                if (this.isEmpty(c))
                {
                    en.push({x:c[0],y:c[1]})
                }
            }
        }
        if (en.length)
        {
            return en[randInt(en.length)]
        }
        return null
    }

    matrix.prototype["validNeighbors"] = function (o)
    {
        var c, vn, x, y

        vn = []
        for (x = -1; x <= 1; x++)
        {
            for (y = -1; y <= 1; y++)
            {
                if ((x === y && y === 0))
                {
                    continue
                }
                c = [o.x + x,o.y + y]
                if (this.isInWorld(c))
                {
                    vn.push(c)
                }
            }
        }
        return vn
    }

    matrix.prototype["neighbors"] = function (o)
    {
        var n, x, y

        n = []
        for (x = -1; x <= 1; x++)
        {
            for (y = -1; y <= 1; y++)
            {
                if ((x === y && y === 0))
                {
                    continue
                }
                n.push([o.x + x,o.y + y])
            }
        }
        return n
    }

    matrix.prototype["objectOfTypeAt"] = function (type, p)
    {
        var o

        if (o = this.objectAt(p))
        {
            if (o.type !== type)
            {
                return null
            }
        }
        return o
    }

    matrix.prototype["critterAt"] = function (p)
    {
        return this.objectOfTypeAt(this.CRITTER,p)
    }

    matrix.prototype["plantAt"] = function (p)
    {
        return this.objectOfTypeAt(this.PLANT,p)
    }

    matrix.prototype["tubeAt"] = function (p)
    {
        return this.objectOfTypeAt(this.TUBE,p)
    }

    matrix.prototype["leafToEatAt"] = function (p)
    {
        var l, pl

        if (pl = this.plantAt(p))
        {
            var list = _k_.list(pl.leaves)
            for (var _a_ = 0; _a_ < list.length; _a_++)
            {
                l = list[_a_]
                if (l.age > this.leafMaxAge)
                {
                    return l
                }
            }
        }
        return null
    }

    matrix.prototype["neighborLeaf"] = function (o)
    {
        var l, nl, vn

        nl = []
        var list = _k_.list(this.neighbors(o))
        for (var _a_ = 0; _a_ < list.length; _a_++)
        {
            vn = list[_a_]
            if (l = this.leafToEatAt(vn))
            {
                nl.push(l)
            }
        }
        if (nl.length)
        {
            return nl[randInt(nl.length)]
        }
        return null
    }

    matrix.prototype["randomOffset"] = function (c)
    {
        var o

        o = [[-1,1],[0,1],[1,1],[-1,0],[1,0],[-1,-1],[0,-1],[1,-1]][randInt(8)]
        return [c.x + o[0],c.y + o[1]]
    }

    matrix.prototype["randomOffsetCross"] = function (c)
    {
        var o

        o = [[0,1],[-1,0],[1,0],[0,-1]][randInt(4)]
        return [c.x + o[0],c.y + o[1]]
    }

    return matrix
})()

export default matrix;