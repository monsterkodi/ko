# level design by Owen Hay

module.exports =
    name:       "grasp"
    scheme:     "blue_scheme"
    intro:      "grasp"
    size:       [11,11,11]
    help:       """
                $scale(1.5)mission:activate the exit!
                
                to shoot, press $key(shoot)
                """
    player:   
        coordinates:     [3,0,3]
        nostatus:         0
    exits:    [
        name:         "exit"
        active:       0
        position:     [0,0,0]
    ]
    create: ->

        s = world.getSize()
        
        world.addObjectAtPos(KikiStone(), KikiPos(s.x/2-1, s.y/2+1, 0))
        world.addObjectAtPos(KikiStone(), KikiPos(s.x/2+1, s.y/2+1, 0))
        world.addObjectAtPos(KikiStone(), KikiPos(s.x/2+1, s.y/2-1, 0))
        world.addObjectAtPos(KikiStone(), KikiPos(s.x/2-1, s.y/2-1, 0))
        world.addObjectAtPos(KikiStone(), KikiPos(s.x/2-1, s.y/2,   0))
        world.addObjectAtPos(KikiStone(), KikiPos(s.x/2+1, s.y/2,   0))
        world.addObjectAtPos(KikiStone(), KikiPos(s.x/2,   s.y/2-1, 0))
        world.addObjectAtPos(KikiStone(), KikiPos(s.x/2,   s.y/2+1, 0))
        
        world.addObjectAtPos(KikiStone(), KikiPos(s.x/2,   s.y/2,   1))
        world.addObjectAtPos(KikiStone(), KikiPos(s.x/2+1, s.y/2,   2))
        world.addObjectAtPos(KikiStone(), KikiPos(s.x/2-1, s.y/2,   2))
        world.addObjectAtPos(KikiStone(), KikiPos(s.x/2+2, s.y/2,   1))
        world.addObjectAtPos(KikiStone(), KikiPos(s.x/2-2, s.y/2,   1))
        world.addObjectAtPos(KikiStone(), KikiPos(s.x/2+2, s.y/2,   4))
        world.addObjectAtPos(KikiStone(), KikiPos(s.x/2-2, s.y/2,   4))
        
        exit_switch = KikiSwitch()
        exit_switch.getEventWithName("switched").addAction(continuous(()-> : world.toggle("exit")))
        world.addObjectAtPos(exit_switch, KikiPos(s.x/2,  s.y/2, 0))
        