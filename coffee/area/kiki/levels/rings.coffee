module.exports =
    name:   "rings"
                        "scheme":   "default_scheme",
                        "size":     [9,7,9],
                        "intro":    "rings", 
                        "help":     ( 
                                        "$scale(1.5)mission:\nget to the exit!\n\n" + \
                                        "to get to the exit,\nuse the stones",
                                    ),
                        "player":   {   "position":         (0,-1,0),
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
    x = 3
    world.addObjectPoly (KikiStone, [world.decenter(-x, y, -x), world.decenter(-x, y, x), \
                                     world.decenter(x, y, x), world.decenter(x, y, -x)])

for y in [-3, 3]:
    for x in [-3, -1, 1, 3]:
        world.addObjectPoly (KikiStone, [world.decenter(-x, y, -x), world.decenter(-x, y, x), \
                                         world.decenter(x, y, x), world.decenter(x, y, -x)])

           
# 
}