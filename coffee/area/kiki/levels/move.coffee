module.exports =
    name:       "move"
    scheme:     "red_scheme"
    intro:      "move"
    size:       [7,7,7]
    help:       """
                $scale(1.5)mission: activate the exit!
                to activate the exit, activate the switch
                to activate the switch,shoot it
                to be able to shoot the switch, move the stones
                to move a stone, press "$key(push)" while moving
                to shoot, press "$key(shoot)"
                """
    player:   
        coordinates:     [3,5,5]
        orientation:      roty180
        nostatus:         0
    exits:    [
        name:         "exit"
        active:       0
        position:     [0,0,0]
    ]
    create: ->
# 
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
        
        exit_switch = KikiSwitch()
        exit_switch.getEventWithName("switched").addAction(continuous(()-> world.toggle("exit")))
        world.addObjectAtPos(exit_switch, KikiPos(s.x/2,  s.y/2, 0))
