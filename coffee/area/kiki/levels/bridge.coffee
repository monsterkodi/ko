
#   0000000    00000000   000  0000000     0000000   00000000
#   000   000  000   000  000  000   000  000        000     
#   0000000    0000000    000  000   000  000  0000  0000000 
#   000   000  000   000  000  000   000  000   000  000     
#   0000000    000   000  000  0000000     0000000   00000000

module.exports =
    name: 'bridge'
    scheme:   "red_scheme"
    size:     [9,9,5]    
    intro:    "bridge" 
    help:     """
              $scale(1.5)mission:
              activate the exit!
              to activate the exit,
              feed it with electricity:
                  
              connect the generator
              with the motor
              
              place a wire stone
              next to the exit
              """
    player:     position:         [0,-3,1]
    exits:    [
       name:         "exit"
       active:       0
       position:     [0,-1,0]
    ]
    create: ->

        s = world.getSize()
        
        world.addObjectAtPos KikiMotorGear(KikiFace.NY),     KikiPos s.x/2-1, s.y-1, s.z/2
        world.addObjectAtPos KikiMotorCylinder(KikiFace.NY), KikiPos s.x/2-1, s.y-2, s.z/2
        world.addObjectAtPos KikiGenerator(KikiFace.NY),     KikiPos s.x/2+1, s.y-1, s.z/2
        world.addObjectLine  "KikiWire (KikiFace.NY, KikiWire.VERTICAL)", KikiPos(s.x/2, s.y-1, 0), KikiPos s.x/2, s.y-1, s.z
        world.addObjectLine  "KikiWire (KikiFace.PY, KikiWire.VERTICAL)", KikiPos(s.x/2, 0, 0),     KikiPos s.x/2, 0, s.z
        world.addObjectLine  "KikiWire (KikiFace.PZ, KikiWire.VERTICAL)", KikiPos(s.x/2, 0, 0),     KikiPos s.x/2, s.y, 0
        world.addObjectLine  "KikiWire (KikiFace.NZ, KikiWire.VERTICAL)", KikiPos(s.x/2, 0, s.z-1), KikiPos s.x/2, s.y, s.z-1
        
        world.addObjectAtPos KikiWireStone(), KikiPos s.x/2+3, 0, s.z/2
        world.addObjectAtPos KikiWireStone(), KikiPos s.x/2-3, 0, s.z/2
        world.addObjectAtPos KikiWireStone(), KikiPos s.x/2+2, 1, s.z/2
        world.addObjectAtPos KikiWireStone(), KikiPos s.x/2-2, 1, s.z/2
        world.addObjectAtPos KikiWireStone(), KikiPos s.x/2+1, 2, s.z/2
        world.addObjectAtPos KikiWireStone(), KikiPos s.x/2-1, 2, s.z/2
