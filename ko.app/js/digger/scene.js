var Scene

import kxk from "../kxk.js"
let deg2rad = kxk.deg2rad
let post = kxk.post

import gyroid from "./gyroid.js"

import gridhelper from "./lib/gridhelper.js"

import geom from "./lib/geom.js"

import material from "./lib/material.js"

import * as three from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import Stats from 'three/addons/libs/stats.module.js'

Scene = (function ()
{
    function Scene (view)
    {
        this.view = view
    
        this["animate"] = this["animate"].bind(this)
        this["initHelpers"] = this["initHelpers"].bind(this)
        this["onMouseMove"] = this["onMouseMove"].bind(this)
        this["onWindowResize"] = this["onWindowResize"].bind(this)
        this["initFog"] = this["initFog"].bind(this)
        this["initLights"] = this["initLights"].bind(this)
        this["initComposer"] = this["initComposer"].bind(this)
        this["initCamera"] = this["initCamera"].bind(this)
        this["initRenderer"] = this["initRenderer"].bind(this)
        this.doPostProcess = false
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
        this.initHelpers()
        this.initComposer()
        post.on('fps.toggle',(function ()
        {
            return this.stats.dom.style.display = (this.stats.dom.style.display === 'none' ? 'inherit' : 'none')
        }).bind(this))
        window.addEventListener('resize',this.onWindowResize)
        document.addEventListener('mousemove',this.onMouseMove)
    }

    Scene.prototype["initRenderer"] = function ()
    {
        this.renderer = new three.WebGLRenderer
        this.renderer.setPixelRatio(window.devicePixelRatio)
        this.renderer.setSize(this.view.clientWidth,this.view.clientHeight)
        this.renderer.shadowMap.enabled = true
        this.renderer.shadowMap.type = three.PCFSoftShadowMap
        this.renderer.setClearColor(new three.Color(0,0,0))
        this.renderer.toneMapping = three.ReinhardToneMapping
        this.renderer.toneMappingExposure = Math.pow(1,4.0)
        this.renderer.sortObjects = false
        this.view.appendChild(this.renderer.domElement)
        return this.renderer.setAnimationLoop(this.animate)
    }

    Scene.prototype["initCamera"] = function ()
    {
        this.camera = new three.PerspectiveCamera(45,this.view.clientWidth / this.view.clientHeight,0.1,1000)
        this.camera.position.set(0,0,150)
        return this.camera.lookAt(0,0,0)
    }

    Scene.prototype["initComposer"] = function ()
    {
        var bloomPass, outputPass, renderScene, size

        renderScene = new RenderPass(this.scene,this.camera)
        size = new three.Vector2(0,0)
        bloomPass = new UnrealBloomPass({x:0,y:0},0.3,0,1.01)
        outputPass = new OutputPass()
        this.composer = new EffectComposer(this.renderer)
        this.composer.setPixelRatio(window.devicePixelRatio)
        this.composer.setSize(this.view.clientWidth,this.view.clientHeight)
        this.composer.addPass(renderScene)
        this.composer.addPass(bloomPass)
        return this.composer.addPass(outputPass)
    }

    Scene.prototype["initLights"] = function ()
    {
        var geo

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
            geo = new three.PlaneGeometry(1500,1500)
            this.shadowFloor = new three.Mesh(geo,new three.ShadowMaterial({color:0x000000,opacity:0.2,depthWrite:false}))
            this.shadowFloor.rotateX(deg2rad(-90))
            this.shadowFloor.receiveShadow = true
            return this.scene.add(this.shadowFloor)
        }
    }

    Scene.prototype["initFog"] = function ()
    {
        return this.scene.fog = new three.FogExp2(0x000000,0.01)
    }

    Scene.prototype["onWindowResize"] = function ()
    {
        this.camera.aspect = this.view.clientWidth / this.view.clientHeight
        this.camera.updateProjectionMatrix()
        this.renderer.setSize(this.view.clientWidth,this.view.clientHeight)
        return this.composer.setSize(this.view.clientWidth,this.view.clientHeight)
    }

    Scene.prototype["onMouseMove"] = function (event)
    {
        event.preventDefault()
        this.mouse.x = (event.clientX / this.view.clientWidth) * 2 - 1
        this.mouse.y = -((event.clientY - 30) / this.view.clientHeight) * 2 + 1
        return this.mouse
    }

    Scene.prototype["initHelpers"] = function ()
    {
        this.lightShadowHelper = new three.DirectionalLightHelper(this.lightShadow,5,new three.Color(0xffff00))
        this.lightShadowHelper.visible = false
        this.scene.add(this.lightShadowHelper)
        this.shadowCameraHelper = new three.CameraHelper(this.lightShadow.shadow.camera)
        this.shadowCameraHelper.visible = false
        this.scene.add(this.shadowCameraHelper)
        this.axesHelper = new three.AxesHelper(50)
        this.axesHelper.visible = false
        this.axesHelper.position.set(0,0,0)
        this.axesHelper.material.depthWrite = false
        this.axesHelper.material.depthTest = false
        this.axesHelper.material.depthFunc = three.NeverDepth
        this.axesHelper.renderOrder = 1000
        this.scene.add(this.axesHelper)
        this.gridHelper = new gridhelper()
        this.gridHelper.visible = false
        this.scene.add(this.gridHelper)
        this.stats = new Stats()
        this.stats.dom.style.position = 'absolute'
        return this.view.appendChild(this.stats.dom)
    }

    Scene.prototype["animate"] = function ()
    {
        var _254_18_

        this.clockDelta = this.clock.getDelta()
        this.stats.begin()
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
        if (this.doPostProcess)
        {
            this.composer.render()
        }
        else
        {
            this.renderer.render(this.scene,this.camera)
        }
        this.stats.end()
        return (typeof this.preRender === "function" ? this.preRender({delta:this.clockDelta,time:this.clock.elapsedTime}) : undefined)
    }

    return Scene
})()

export default Scene;