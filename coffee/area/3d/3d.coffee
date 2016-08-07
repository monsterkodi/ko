
#   000000   0000000  
#       000  000   000
#     0000   000   000
#       000  000   000
#   000000   0000000  

log = require '../../tools/log'
Stage = require '../stage'

class Three extends Stage
    
    constructor: (@view) -> super @view
    
    start: -> 
        @elem = document.createElement 'div'
        @elem.className = 'three'
        @elem.id = 'three'
        @elem.style.position = 'absolute'
        @elem.style.top = '0'
        @elem.style.left = '0'
        @elem.style.right = '0'
        @elem.style.bottom = '0'
        @elem.style.background = "#004"
        @view.appendChild @elem

        @renderer = new THREE.WebGLRenderer 
            antialias:              true
            logarithmicDepthBuffer: true
            autoClear:              true
                    
        @renderer.setClearColor 0x008800
        @elem.appendChild @renderer.domElement
        @renderer.setSize @view.offsetWidth, @view.offsetHeight
        
        @fov    = 60
        @near   = 10
        @far    = 1000
        @aspect = @view.offsetWidth / @view.offsetHeight
        @dist   = 20
        
        @scene = new THREE.Scene()
        @geom = new THREE.BoxGeometry 10, 10, 10
        @material = new THREE.MeshPhongMaterial 
            color:     0xf00
            side:      THREE.FrontSide
            shading:   THREE.SmoothShading
            transparent: true
            opacity: 0.85
            shininess: 0
            
        @mesh = new THREE.Mesh @geom, @material
        @scene.add @mesh
        @camera = new THREE.PerspectiveCamera @fov, @aspect, @near, @far
        @camera.position.z = @dist
        @clock = new THREE.Clock()
        @animate()

    animationStep: (step) =>
                
        @quat = @camera.quaternion.clone()
        @quat.multiply (new THREE.Quaternion).setFromAxisAngle(new THREE.Vector3(1,0,0), step.dsecs*0.2)
        @quat.multiply (new THREE.Quaternion).setFromAxisAngle(new THREE.Vector3(0,1,0), step.dsecs*0.1)
        @camera.position.set(0,0,@dist).applyQuaternion @quat
        @camera.quaternion.copy @quat
        @renderer.render @scene, @camera

    reset: ->
        @elem.style.display = 'block'
        @resume()
        
    stop: ->
        @elem.style.display = 'none'
        @pause()
        
    resized: (w,h) -> 
        @aspect = w/h
        @camera?.aspect = @aspect
        @camera.updateProjectionMatrix()
        @renderer?.setSize w,h

module.exports = Three
