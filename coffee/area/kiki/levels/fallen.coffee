# level design by Owen Hay

module.exports =
    name:   "fallen"
                        "scheme":   "blue_scheme",
                        "size":     (13,15,13),
                        "intro":    "fallen",    
                        "help":     ( 
                                        "$scale(1.5)mission:\nget to the exit!\n\n" + \
                                        "to get to the exit,\njump and fall off the stones",
                                        "try to jump so that you \nland on other stones",
                                        "if you fall,  there is a stone \non ground to help get back on",
                                        "you have to fall of this stone, \n as well",

                                    ),
                        "player":   {   "coordinates":     (6,11,6),
                                        "nostatus":         0,
                                    },
                        "exits":    [
                                        {
                                            "name":         "exit",
                                            "active":       1,
                                            "position":     (-4, 1,-3),
                                        },
                                        {
                                            "name":         "exit",
                                            "active":       1,
                                            "position":     (0, -1, 0),
                                        },
                                    ],
                        "create": ->
# 
s = world.getSize ()

#hop back on
world.addObjectAtPos(KikiWall(), KikiPos(2, 12, 12))

#orient world
world.addObjectAtPos(KikiStone(), KikiPos(s.x/2, s.y/2+2, s.z/2))
world.addObjectAtPos(KikiStone(), KikiPos(s.x/2+2, s.y/2+2, s.z/2))


#some Hops
world.addObjectAtPos(KikiStone(), KikiPos(s.x/2+2, s.y/2-2, s.z/2+2))
world.addObjectAtPos(KikiStone(), KikiPos(s.x/2+2, s.y/2-2, s.z/2+4))
world.addObjectAtPos(KikiStone(), KikiPos(s.x/2, s.y/2-2, s.z/2+4))
world.addObjectAtPos(KikiStone(), KikiPos(s.x/2+2, s.y/2-2, s.z/2+4))
world.addObjectAtPos(KikiStone(), KikiPos(s.x/2, s.y/2-4, s.z/2+4))
world.addObjectAtPos(KikiStone(), KikiPos(s.x/2-2, s.y/2-4, s.z/2+4))
world.addObjectAtPos(KikiStone(), KikiPos(s.x/2-4, s.y/2-4, s.z/2+4))

#long fall and strip1

world.addObjectAtPos(KikiStone(), KikiPos(s.x/2-4, s.y/2+4, s.z/2+2))
world.addObjectAtPos(KikiStone(), KikiPos(s.x/2-3, s.y/2+4, s.z/2+2))

#short fall and strip2
world.addObjectAtPos(KikiStone(), KikiPos(s.x/2-4, s.y/2+1, s.z/2-2))
world.addObjectAtPos(KikiStone(), KikiPos(s.x/2-4, s.y/2+1, s.z/2-1))


world.addObjectAtPos(KikiStone(), KikiPos(0, 0, 0))


# 
}


