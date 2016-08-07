# .................................................................................................................
level_dict["regal"] = {   
                        "scheme":   "bronze_scheme",
                        "size":     (7,3,9),    
                        "intro":    "regal", 
                        "help":     ( 
                                        "$scale(1.5)mission:\nactivate the exit!",
                                    ),
                        "player":   {   "position":         (0,0,0),
                                    },
                        "exits":    [
                                        {
                                            "name":         "exit",
                                            "active":       0,
                                            "position":     (0,0,4),
                                        },
                                    ],
                        "create":
"""
sx, sy, sz = 7,3,9
            
for z in range(-sz/2+1, sz/2+1):
    
    world.addObjectAtPos (KikiWall (), world.decenter(-sx/2+1, 0, z))
    world.addObjectAtPos (KikiWall (), world.decenter( sx/2, 0, z))
    
    if z:
        world.addObjectAtPos (KikiWall (), world.decenter(-sx/2+2, 0, z))
        world.addObjectAtPos (KikiWall (), world.decenter( sx/2-1, 0, z))
        if z <> 4 and z <> -4:
            world.addObjectAtPos (KikiWall (), world.decenter(0, -sy/2+1, z))
        if z <> 1 and z <> -1:
            world.addObjectAtPos (KikiWall (), world.decenter(0,  sy/2, z))
    
    
for z in [-3, -1, 1, 3]:
    world.addObjectAtPos (KikiGear (KikiFace.PY), world.decenter(-sx/2+1, 1, z))
    
for z in [-3, 3]:    
    world.addObjectAtPos (KikiGear (KikiFace.PY), world.decenter( sx/2, 1, z))
    
for z in [-1, 1]:    
    world.addObjectAtPos (KikiGenerator (KikiFace.PY), world.decenter( sx/2, 1, z))   
    world.addObjectAtPos (KikiMotorGear (KikiFace.PY),  world.decenter( 0, 0, z))
    world.addObjectAtPos (KikiMotorCylinder (KikiFace.PY),  world.decenter( 0, 1, z))

world.addObjectAtPos(KikiWireStone(), world.decenter(-sx/2+2, 1, 0))
world.addObjectAtPos(KikiWireStone(), world.decenter( sx/2-1, 1, 0))

""",                                 
}
