var world

import kxk from "../kxk.js"
let drag = kxk.drag
let stopEvent = kxk.stopEvent
let prefs = kxk.prefs
let post = kxk.post
let kpos = kxk.kpos
let fade = kxk.fade
let randRange = kxk.randRange
let randInt = kxk.randInt
let randIntRange = kxk.randIntRange

import noise from "./lib/noise.js"

import tweaky from "./tweaky.js"
import swarm from "./swarm.js"
import weed from "./weed.js"
import gyroid from "./gyroid.js"
import boids from "./boids.js"


world = (function ()
{
    function world (scene, player, camera)
    {
        this.scene = scene
        this.player = player
        this.camera = camera
    
        this["singleStep"] = this["singleStep"].bind(this)
        this["simulate"] = this["simulate"].bind(this)
        this["togglePause"] = this["togglePause"].bind(this)
        this.pause = false
        this.scene.preRender = this.simulate
        this.gyroid = new gyroid(this.scene)
        this.swarm = new swarm(this.scene,this.player)
        this.weed = new weed(this.scene,this.gyroid)
        this.boids = new boids(this.scene,this.player,this.gyroid)
        if (1)
        {
            this.tweaky = new tweaky(this.scene.view)
            this.tweaky.init({speed:{min:0.5,max:2,step:0.1,value:1,cb:(function (v)
            {
                return this.player.speed = v
            }).bind(this)},seed:{min:1,max:100,step:1,value:50,cb:(function (v)
            {
                noise.seed(v)
                return this.start()
            }).bind(this)},gyro:{min:7,max:14,step:1,value:this.gyroid.num,cb:(function (v)
            {
                this.gyroid.num = v
                return this.start()
            }).bind(this)},skin:{min:0.5,max:2,step:0.1,value:this.gyroid.skin,cb:(function (v)
            {
                this.gyroid.skin = v
                return this.start()
            }).bind(this)},axes:{value:0,cb:(function (v)
            {
                return this.scene.axesHelper.visible = v
            }).bind(this)},post:{value:1,cb:(function (v)
            {
                return this.scene.doPostProcess = v
            }).bind(this)}})
        }
    }

    world.prototype["start"] = function ()
    {
        this.camera.start()
        this.player.start()
        this.gyroid.start()
        this.weed.spawn()
        this.swarm.spawn()
        return this.boids.spawn()
    }

    world.prototype["togglePause"] = function ()
    {
        this.pause = !this.pause
        return post.emit('pause')
    }

    world.prototype["simulate"] = async function (tickInfo)
    {
        var sec, _67_15_

        if (this.pause && !this.oneStep)
        {
            return
        }
        sec = 1 / 60
        this.player.update(sec)
        this.camera.update(sec)
        this.swarm.update(sec)
        this.weed.update(sec,tickInfo.time)
        this.boids.update(sec,tickInfo.time)
        return (this.tweaky != null ? this.tweaky.update() : undefined)
    }

    world.prototype["singleStep"] = function ()
    {
        this.oneStep = true
        this.pause = true
        return post.emit('pause')
    }

    return world
})()

export default world;