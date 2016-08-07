module.exports =
    name:   "escape"
                        "scheme":   "metal_scheme",
                        "size":     [7,9,7],
                        "intro":    "escape", 
                        "help":     ( 
                                        "$scale(1.5)mission:\ntry to escape!\n\n" + \
                                        "to escape,\nactivate the exit\n\n" + \
                                        "to activate the exit,\nshoot the switch\n\n" + \
                                        "to be able to\nshoot the switch,\nmove the stones",
                                    ),
                        "player":   {   "position":         [0,0,0],
                                        "orientation":      rotx180,
                                    },
                        "exits":    [
                                        {
                                            "name":         "exit",
                                            "active":       0,
                                            "position":     (0,-3,0),
                                        },
                                    ],
                        "create": ->
# 
s = world.getSize()

exit_switch = KikiSwitch()
exit_switch.getEventWithName ("switched").addAction (continuous (lambda : world.toggle("exit")))
world.addObjectAtPos(exit_switch, world.decenter( 0, -2, 0))

world.addObjectAtPos(KikiStone(), world.decenter( 0, s.y/2, 0))
world.addObjectAtPos(KikiStone(), world.decenter( 1, s.y/2, 0))
world.addObjectAtPos(KikiStone(), world.decenter( 0, s.y/2, 1))
world.addObjectAtPos(KikiStone(), world.decenter( 0, s.y/2,-1))
world.addObjectAtPos(KikiStone(), world.decenter(-1, s.y/2, 0))

world.addObjectLine (KikiStone, world.decenter(-2, s.y/2,-2), world.decenter( 2, s.y/2,-2))
world.addObjectLine (KikiStone, world.decenter( 2, s.y/2,-2), world.decenter( 2, s.y/2, 2))
world.addObjectLine (KikiStone, world.decenter( 2, s.y/2, 2), world.decenter(-2, s.y/2, 2))
world.addObjectLine (KikiStone, world.decenter(-2, s.y/2, 2), world.decenter(-2, s.y/2,-2))

world.addObjectAtPos(KikiWall(), world.decenter( 1, 0, 0))
world.addObjectAtPos(KikiWall(), world.decenter( 0, 0, 1))
world.addObjectAtPos(KikiWall(), world.decenter(-1, 0, 0))
world.addObjectAtPos(KikiWall(), world.decenter( 0, 0,-1))

world.addObjectAtPos(KikiWall(), world.decenter( 1,-1, 0))
world.addObjectAtPos(KikiWall(), world.decenter( 0,-1, 1))
world.addObjectAtPos(KikiWall(), world.decenter(-1,-1, 0))
world.addObjectAtPos(KikiWall(), world.decenter( 0,-1,-1))
world.addObjectAtPos(KikiWall(), world.decenter( 1,-1, 1))
world.addObjectAtPos(KikiWall(), world.decenter(-1,-1, 1))
world.addObjectAtPos(KikiWall(), world.decenter(-1,-1,-1))
world.addObjectAtPos(KikiWall(), world.decenter( 1,-1,-1))

world.addObjectAtPos(KikiWall(), world.decenter( 1,-2, 0))
world.addObjectAtPos(KikiWall(), world.decenter( 0,-2, 1))
world.addObjectAtPos(KikiWall(), world.decenter(-1,-2, 0))
world.addObjectAtPos(KikiWall(), world.decenter( 0,-2,-1))
# 
}
