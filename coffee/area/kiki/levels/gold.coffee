# .................................................................................................................
level_dict["gold"] = {   
                        "scheme":   "yellow_scheme",
                        "size":     (3,11,3),    
                        "intro":    "gold", 
                        "help":     ( 
                                        "$scale(1.5)mission:\nget to the exit!\n\n" + \
                                        "move the stones to reach it",                                    
                                    ),
                        "player":   {   "position":         (0,-4,0),
                                    },
                        "exits":    [
                                        {
                                            "name":         "exit",
                                            "active":       1,
                                            "position":     (0,4,0),
                                        },
                                    ],
                        "create":
"""
s = world.getSize()

for y in range (-s.y/2+3, s.y/2, 2):
    for x in range (-s.x/2+1, s.x/2+1):
        for z in range (-s.z/2+1, s.z/2+1):
            world.addObjectAtPos (KikiStone (), world.decenter (x, y, z))
""",                                 
}
