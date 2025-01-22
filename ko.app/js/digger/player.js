var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

var Player

import * as three from 'three'
import kxk from "../kxk.js"
let deg2rad = kxk.deg2rad
let rad2deg = kxk.rad2deg
let fade = kxk.fade

import geom from "./lib/geom.js"

import polar from "./lib/polar.js"

import input from "./input.js"


Player = (function ()
{
    function Player (scene)
    {
        var child

        this.scene = scene
    
        this.input = new input(this)
        this.eat = 0
        this.maxVel = 0.7
        this.speed = 1
        this.friction = 0.985
        this.angle = 0
        this.ray = new three.Ray
        this.mesh = geom.pill({length:1,radius:0.5,material:'player'})
        var list = _k_.list(this.mesh.children)
        for (var _a_ = 0; _a_ < list.length; _a_++)
        {
            child = list[_a_]
            child.castShadow = true
        }
        this.scene.scene.add(this.mesh)
        this.pos = new three.Vector3
        this.vec = new three.Vector3
        this.dir = new three.Vector3
        this.mat = new three.Matrix4
        this.tqt = new three.Quaternion
        this.sphere = new three.Sphere(this.vec,50)
        this.unitX = new three.Vector3(1,0,0)
        this.unitY = new three.Vector3(0,1,0)
        this.unitZ = new three.Vector3(0,0,1)
        this.steer = new three.Vector2
        this.tgtDot = geom.icosa({radius:0.3,material:'wireframe'})
        this.tgtDot.scale.set(0,0,0)
        this.tgtDot.position.set(0,0,50)
        this.scene.scene.add(this.tgtDot)
    }

    Player.prototype["start"] = function ()
    {
        this.vel = new three.Vector2
        this.polar = new polar({dist:50})
        this.mesh.position.copy(this.polar.pos())
        this.mesh.quaternion.copy(this.polar.quat)
        return this.tgtDot.position.set(0,0,50)
    }

    Player.prototype["startAction"] = function (action)
    {}

    Player.prototype["stopAction"] = function (action)
    {}

    Player.prototype["update"] = function (deltaSec)
    {
        var acc, deg

        deg = 0.7
        acc = [0,0]
        if (this.input.action.moveUp)
        {
            acc[1] += deg
        }
        if (this.input.action.moveDown)
        {
            acc[1] -= deg
        }
        if (this.input.action.moveRight)
        {
            acc[0] += deg
        }
        if (this.input.action.moveLeft)
        {
            acc[0] -= deg
        }
        this.vel.x += this.speed * deltaSec * acc[0]
        this.vel.y += this.speed * deltaSec * acc[1]
        this.vel.x *= this.friction
        this.vel.y *= this.friction
        this.vel.clampLength(0,this.maxVel)
        if (this.dragScreen)
        {
            this.steer.copy(this.dragScreen)
        }
        else if (this.vel.length() > 0.01)
        {
            this.steer.x = this.vel.x
            this.steer.y = -
            this.vel.y
        }
        this.ray.origin.copy(this.scene.camera.position)
        this.ray.direction.set(this.steer.x,-this.steer.y,0.5).unproject(this.scene.camera).sub(this.ray.origin).normalize()
        if (this.ray.intersectSphere(this.sphere,this.pos))
        {
            this.tgtDot.position.copy(this.pos)
        }
        this.polar.target(this.tgtDot.position,deltaSec * this.speed)
        this.mesh.position.copy(this.polar.pos())
        return this.polar.orient(this.mesh.quaternion)
    }

    return Player
})()

export default Player;