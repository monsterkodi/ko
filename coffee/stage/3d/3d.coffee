
#   000000   0000000  
#       000  000   000
#     0000   000   000
#       000  000   000
#   000000   0000000  

{ elem, log } = require 'kxk'
Stage = require '../stage'

class Three extends Stage
    
    constructor: (view) -> super view
    
    start: -> 
        @elem = elem 'div'
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
        
        
        #    0000000   0000000   00     00  00000000  00000000    0000000 
        #   000       000   000  000   000  000       000   000  000   000
        #   000       000000000  000000000  0000000   0000000    000000000
        #   000       000   000  000 0 000  000       000   000  000   000
        #    0000000  000   000  000   000  00000000  000   000  000   000
        
        @fov    = 60
        @near   = 10
        @far    = 1000
        @aspect = @view.offsetWidth / @view.offsetHeight
        @dist   = 20
        
        @camera = new THREE.PerspectiveCamera @fov, @aspect, @near, @far
        @camera.position.z = @dist
        
        #    0000000   0000000  00000000  000   000  00000000
        #   000       000       000       0000  000  000     
        #   0000000   000       0000000   000 0 000  0000000 
        #        000  000       000       000  0000  000     
        #   0000000    0000000  00000000  000   000  00000000
        
        @scene = new THREE.Scene()
        @geom = new THREE.BoxGeometry 10, 10, 10
        
        #   000      000   0000000   000   000  000000000
        #   000      000  000        000   000     000   
        #   000      000  000  0000  000000000     000   
        #   000      000  000   000  000   000     000   
        #   0000000  000   0000000   000   000     000   

        @sun = new THREE.PointLight 0xffff00
        @sun.position.copy @camera.position
        @scene.add @sun
        
        @ambient = new THREE.AmbientLight 0x444444
        @scene.add @ambient
                
        #    0000000  000   000  0000000    00000000
        #   000       000   000  000   000  000     
        #   000       000   000  0000000    0000000 
        #   000       000   000  000   000  000     
        #    0000000   0000000   0000000    00000000

        @material = new THREE.MeshPhongMaterial 
            color:     0xff0000
            side:      THREE.FrontSide
            shading:   THREE.SmoothShading
            transparent: true
            opacity: 0.85
            shininess: 0
        
        @mesh = new THREE.Mesh @geom, @material
        @scene.add @mesh

        @animate()

    #    0000000  000000000  00000000  00000000 
    #   000          000     000       000   000
    #   0000000      000     0000000   00000000 
    #        000     000     000       000      
    #   0000000      000     00000000  000      
    
    animationStep: (step) =>
                
        @quat = @camera.quaternion.clone()
        @quat.multiply (new THREE.Quaternion).setFromAxisAngle(new THREE.Vector3(1,0,0), step.dsecs*0.2)
        @quat.multiply (new THREE.Quaternion).setFromAxisAngle(new THREE.Vector3(0,1,0), step.dsecs*0.1)
        @camera.position.set(0,0,@dist).applyQuaternion @quat
        @camera.quaternion.copy @quat
        @sun.position.copy @camera.position
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
