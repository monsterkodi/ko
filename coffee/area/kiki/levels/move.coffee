module.exports =
    name:   "move"
                        "scheme":   "red_scheme",
                        "intro":    "move",
                        "size":     [7,7,7],
                        "help":     ( 
                                        "$scale(1.5)mission:\nactivate the exit!\n\n" + \
                                        "to activate the exit,\nactivate the switch\n\n" + \
                                        "to activate the switch,\nshoot it\n\n" + \
                                        "to be able to shoot the switch,\nmove the stone", 
                                        "to move a stone, press \"$key(push)\" while moving\n\n" + \
                                        "to shoot, press \"$key(shoot)\"",
                                    ),
                        "player":   {   "coordinates":     [3,5,5],
                                        "orientation":      roty180,
                                        "nostatus":         0,
                                    },
                        "exits":    [
                                        {
                                            "name":         "exit",
                                            "active":       0,
                                            "position":     [0,0,0],
                                        },
                                    ],
                        "create": ->
# 
s = world.getSize ()

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
exit_switch.getEventWithName ("switched").addAction (continuous (lambda : world.toggle("exit")))
world.addObjectAtPos(exit_switch, KikiPos(s.x/2,  s.y/2, 0))
# 
}
