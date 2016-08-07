module.exports =
    name:   "grid"
                        "scheme":   "candy_scheme",
                        "size":     [9,9,9],
                        "intro":    "grid", 
                        "help":     ( 
                                        "$scale(1.5)mission:\nget to the exit!\n\n" + \
                                        "to get to the exit,\nuse the stones",
                                    ),
                       "player":    {   "position":         [1,0,1],
                                    },
                        "exits":    [
                                        {
                                            "name":         "exit",
                                            "active":       1,
                                            "position":     [0,0,0],
                                        },
                                    ],
                        "create": ->
# 
s = world.getSize()

for y in [-1, 1]:
    for x in range (-s.x/2+3, s.x/2-1, 2):
        for z in range (-s.z/2+3, s.z/2-1, 2):
            world.addObjectAtPos(KikiWall (), world.decenter(x, y, z))
            
for y in [-4, 4]:
    for x in range (-s.x/2+1, s.x/2+1, 2):
        for z in range (-s.z/2+1, s.z/2+1, 2):
            world.addObjectAtPos(KikiWall (), world.decenter(x, y, z))
            
world.addObjectAtPos(KikiStone (), world.decenter(3,-3,0))
world.addObjectAtPos(KikiStone (), world.decenter(-3,-3,0))

world.addObjectAtPos(KikiStone (), world.decenter(3,3,0))
world.addObjectAtPos(KikiStone (), world.decenter(-3,3,0))

world.addObjectAtPos(KikiStone (), world.decenter(0,-3,0))
world.addObjectAtPos(KikiStone (), world.decenter(0,3,0))
# 
}