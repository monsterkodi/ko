var _k_ = {clamp: function (l,h,v) { var ll = Math.min(l,h), hh = Math.max(l,h); if (!_k_.isNum(v)) { v = ll }; if (v < ll) { v = ll }; if (v > hh) { v = hh }; if (!_k_.isNum(v)) { v = ll }; return v }, isNum: function (o) {return !isNaN(o) && !isNaN(parseFloat(o)) && (isFinite(o) || o === Infinity || o === -Infinity)}}

var Three

import kxk from "../kxk.js"
let deg2rad = kxk.deg2rad
let randInt = kxk.randInt
let randRange = kxk.randRange

import gridhelper from "./lib/gridhelper.js"

import noise from "./lib/noise.js"
let simplex3 = noise.simplex3

import * as three from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { MarchingCubes } from 'three/addons/objects/MarchingCubes.js'

Three = (function ()
{
    function Three (view)
    {
        this.view = view
    
        this["animate"] = this["animate"].bind(this)
        this["initGyroidSphere"] = this["initGyroidSphere"].bind(this)
        this["initMarchingCubes"] = this["initMarchingCubes"].bind(this)
        this["initHelpers"] = this["initHelpers"].bind(this)
        this["onMouseMove"] = this["onMouseMove"].bind(this)
        this["onWindowResize"] = this["onWindowResize"].bind(this)
        this["initLights"] = this["initLights"].bind(this)
        this["initControls"] = this["initControls"].bind(this)
        this["initComposer"] = this["initComposer"].bind(this)
        this["initCamera"] = this["initCamera"].bind(this)
        this["initRenderer"] = this["initRenderer"].bind(this)
        this.scene = new three.Scene()
        this.clock = new three.Clock()
        this.raycaster = new three.Raycaster()
        this.mouse = new three.Vector2(1,1)
        this.unitX = new three.Vector3(1,0,0)
        this.unitY = new three.Vector3(0,1,0)
        this.unitZ = new three.Vector3(0,0,1)
        this.vec = new three.Vector3
        this.quat = new three.Quaternion
        this.matrix = new three.Matrix4
        this.initRenderer()
        this.initCamera()
        this.initLights()
        this.initMarchingCubes()
        this.initHelpers()
        this.initControls()
        this.initComposer()
        window.addEventListener('resize',this.onWindowResize)
        document.addEventListener('mousemove',this.onMouseMove)
    }

    Three.prototype["initRenderer"] = function ()
    {
        this.renderer = new three.WebGLRenderer()
        this.renderer.setPixelRatio(window.devicePixelRatio)
        this.renderer.setSize(this.view.clientWidth,this.view.clientHeight)
        this.renderer.shadowMap.enabled = true
        this.renderer.shadowMap.type = three.PCFSoftShadowMap
        this.renderer.setClearColor(new three.Color(0,0,0))
        this.renderer.toneMapping = three.ReinhardToneMapping
        this.renderer.toneMappingExposure = Math.pow(1,4.0)
        this.view.appendChild(this.renderer.domElement)
        return this.renderer.setAnimationLoop(this.animate)
    }

    Three.prototype["initCamera"] = function ()
    {
        this.camera = new three.PerspectiveCamera(45,this.view.clientWidth / this.view.clientHeight,0.1,1000)
        this.camera.position.set(0,0,150)
        return this.camera.lookAt(0,0,0)
    }

    Three.prototype["initComposer"] = function ()
    {
        var bloomPass, outputPass, renderScene, size

        renderScene = new RenderPass(this.scene,this.camera)
        size = new three.Vector2(this.view.clientWidth,this.view.clientHeight)
        bloomPass = new UnrealBloomPass(size,0.3,0,1.01)
        outputPass = new OutputPass()
        this.composer = new EffectComposer(this.renderer)
        this.composer.setPixelRatio(window.devicePixelRatio)
        this.composer.setSize(this.view.clientWidth,this.view.clientHeight)
        this.composer.addPass(renderScene)
        this.composer.addPass(bloomPass)
        return this.composer.addPass(outputPass)
    }

    Three.prototype["initControls"] = function ()
    {
        this.controls = new OrbitControls(this.camera,this.renderer.domElement)
        this.controls.maxPolarAngle = Math.PI * 0.5
        this.controls.minDistance = 13
        this.controls.maxDistance = 300
        this.controls.enableDamping = true
        this.controls.minPolarAngle = -Math.PI
        this.controls.maxPolarAngle = Math.PI
        return this.controls.target.set(0,1,0)
    }

    Three.prototype["initLights"] = function ()
    {
        var geom

        this.lightIntensityAmbient = 10
        this.lightIntensityPlayer = 10
        this.lightIntensityShadow = 20
        this.lightAmbient = new three.AmbientLight(0xffffff,this.lightIntensityAmbient)
        this.scene.add(this.lightAmbient)
        this.lightPlayer = new three.PointLight(0xffffff,this.lightIntensityPlayer,0,0)
        this.lightPlayer.position.copy(this.camera.position)
        this.scene.add(this.lightPlayer)
        this.lightShadow = new three.DirectionalLight(0xffffff,this.lightIntensityShadow)
        this.lightShadow.castShadow = true
        this.lightShadow.position.set(-10,30,30)
        this.lightShadow.target.position.set(0,0,0)
        this.lightShadow.shadow.mapSize.width = 4096
        this.lightShadow.shadow.mapSize.height = 4096
        this.lightShadow.shadow.camera.near = 0.5
        this.lightShadow.shadow.camera.far = 400
        this.lightShadow.shadow.camera.left = -50
        this.lightShadow.shadow.camera.right = 50
        this.lightShadow.shadow.camera.top = 50
        this.lightShadow.shadow.camera.bottom = -50
        this.scene.add(this.lightShadow)
        if (false)
        {
            geom = new three.PlaneGeometry(1500,1500)
            this.shadowFloor = new three.Mesh(geom,new three.ShadowMaterial({color:0x000000,opacity:0.2,depthWrite:false}))
            this.shadowFloor.rotateX(deg2rad(-90))
            this.shadowFloor.receiveShadow = true
            return this.scene.add(this.shadowFloor)
        }
    }

    Three.prototype["onWindowResize"] = function ()
    {
        this.camera.aspect = this.view.clientWidth / this.view.clientHeight
        this.camera.updateProjectionMatrix()
        this.renderer.setSize(this.view.clientWidth,this.view.clientHeight)
        return this.composer.setSize(this.view.clientWidth,this.view.clientHeight)
    }

    Three.prototype["onMouseMove"] = function (event)
    {
        event.preventDefault()
        this.mouse.x = (event.clientX / this.view.clientWidth) * 2 - 1
        this.mouse.y = -((event.clientY - 30) / this.view.clientHeight) * 2 + 1
        return this.mouse
    }

    Three.prototype["initHelpers"] = function ()
    {
        this.lightShadowHelper = new three.DirectionalLightHelper(this.lightShadow,5,new three.Color(0xffff00))
        this.lightShadowHelper.visible = false
        this.scene.add(this.lightShadowHelper)
        this.shadowCameraHelper = new three.CameraHelper(this.lightShadow.shadow.camera)
        this.shadowCameraHelper.visible = false
        this.scene.add(this.shadowCameraHelper)
        this.axesHelper = new three.AxesHelper(10)
        this.axesHelper.visible = false
        this.axesHelper.position.set(0,0.1,0)
        this.axesHelper.material.depthWrite = false
        this.axesHelper.material.depthTest = false
        this.axesHelper.material.depthFunc = three.NeverDepth
        this.scene.add(this.axesHelper)
        this.gridHelper = new gridhelper()
        this.gridHelper.visible = false
        return this.scene.add(this.gridHelper)
    }

    Three.prototype["initMarchingCubes"] = function ()
    {
        var color, enableColors, enableUvs, material, maxPolyCount

        this.resolution = 100
        color = new three.Color(1,1,1)
        material = new three.MeshLambertMaterial({color:color,vertexColors:true,flatShading:false,dithering:true})
        enableUvs = false
        enableColors = true
        maxPolyCount = 1500000
        this.mc = new MarchingCubes(this.resolution,material,enableUvs,enableColors,maxPolyCount)
        this.mc.scale.set(50,50,50)
        this.mc.receiveShadow = true
        this.mc.castShadow = true
        this.scene.add(this.mc)
        return this.initGyroidSphere()
    }

    Three.prototype["initGyroidSphere"] = function ()
    {
        var b, beta, cx, cy, cz, ff, fo, g, gyroid, nx, ny, nz, r, rf, rx, ry, rz, ss, x, y, yn, z

        gyroid = function (x, y, z)
        {
            return Math.sin(x) * Math.cos(y) + Math.sin(y) * Math.cos(z) + Math.sin(z) * Math.cos(x)
        }
        this.mc.reset()
        for (var _a_ = x = 0, _b_ = this.resolution; (_a_ <= _b_ ? x < this.resolution : x > this.resolution); (_a_ <= _b_ ? ++x : --x))
        {
            for (var _c_ = y = 0, _d_ = this.resolution; (_c_ <= _d_ ? y < this.resolution : y > this.resolution); (_c_ <= _d_ ? ++y : --y))
            {
                for (var _e_ = z = 0, _f_ = this.resolution; (_e_ <= _f_ ? z < this.resolution : z > this.resolution); (_e_ <= _f_ ? ++z : --z))
                {
                    ss = this.resolution / (Math.PI * 12)
                    rf = Math.sqrt((x / this.resolution - 0.5) * (x / this.resolution - 0.5) + (y / this.resolution - 0.5) * (y / this.resolution - 0.5) + (z / this.resolution - 0.5) * (z / this.resolution - 0.5))
                    ff = 1 - 1.41 * rf
                    nx = x / ss
                    ny = y / ss
                    nz = z / ss
                    cx = nx - 0.5
                    cy = ny - 0.5
                    cz = nz - 0.5
                    fo = Math.sqrt(cx * cx + cz * cz)
                    beta = fo * 0.01
                    rx = cx * Math.cos(beta) - cz * Math.sin(beta)
                    ry = cy
                    rz = cx * Math.sin(beta) + cz * Math.cos(beta)
                    nx = rx + 0.5
                    ny = ry + 0.5
                    nz = rz + 0.5
                    this.mc.setCell(x,y,z,Math.max(0,ff * 100 * (gyroid(nx,ny,nz) + 1)))
                    yn = y / this.resolution
                    b = ff * ff
                    b = b * b * b
                    b = _k_.clamp(0,1,b)
                    ss = 0.8 * this.resolution
                    r = 4 * Math.max(0,simplex3(x / ss,y / ss,z / ss) + 0.05)
                    r = r * r * b
                    g = r / 2
                    this.mc.setColor(x,y,z,r,g,Math.max(0,b - r))
                }
            }
        }
        return this.mc.update()
    }

    Three.prototype["animate"] = function ()
    {
        var _321_17_

        this.lightPlayer.position.copy(this.camera.position)
        this.lightShadow.position.copy(this.camera.position)
        this.quat.copy(this.camera.quaternion)
        this.vec.copy(this.unitX)
        this.vec.applyQuaternion(this.quat)
        this.vec.multiplyScalar(-20)
        this.lightShadow.position.add(this.vec)
        this.vec.copy(this.unitY)
        this.vec.applyQuaternion(this.quat)
        this.vec.multiplyScalar(10)
        this.lightShadow.position.add(this.vec)
        ;(this.controls != null ? this.controls.update(this.clock.getDelta()) : undefined)
        return this.composer.render()
    }

    return Three
})()

export default Three;