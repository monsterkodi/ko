# .................................................................................................................
level_dict["electro"] = {   
                        "scheme":   "metal_scheme",
                        "size":     (9,7,9),
                        "intro":    "electro",    
                        "help":     ( 
                                        "$scale(1.5)mission:\nactivate the exit!\n\n" + \
                                        "to activate the exit\nfeed it with electricity:\n\n" + \
                                        "connect the generator\nwith the motor",
                                    ),
                        "player":   {   "coordinates":         (2,0,4),
                                        "orientation":      rotz180,
                                        "nostatus":         0,
                                    },
                        "exits":    [
                                        {
                                            "name":         "exit",
                                            "active":       0,
                                            "position":     (0,0,0),
                                        },
                                    ],
                        "create":
"""
s = world.getSize ()
d = 2

world.addObjectLine ( KikiWireStone, world.decenter (-d, s.y/2, 0), world.decenter (-d, 0, 0))
world.addObjectLine ( KikiWireStone, world.decenter ( d, s.y/2, 0), world.decenter ( d, 0, 0))
world.addObjectLine ( KikiWireStone, world.decenter ( d, 0, 0), world.decenter ( 0, 0, 0))
world.addObjectLine ( KikiWireStone, world.decenter (-d, 0, 0), world.decenter ( 0, 0, 0))

world.addObjectAtPos ( KikiGear (KikiFace.PY), KikiPos (s.x/2-1, 0, s.z/2-1))

world.addObjectAtPos (KikiGenerator (KikiFace.PY), KikiPos (s.x/2+1, 0, s.z/2+1))
world.addObjectAtPos (KikiMotorCylinder (KikiFace.PY), KikiPos (s.x/2, 1, s.z/2))
world.addObjectAtPos (KikiMotorGear (KikiFace.PY), KikiPos (s.x/2, 0, s.z/2))

# floor wire square
world.addObjectLine ("KikiWire (KikiFace.PY, 10)", KikiPos (s.x/2-d+1, 0, s.z/2-d), KikiPos (s.x/2+d, 0, s.z/2-d))
world.addObjectLine ("KikiWire (KikiFace.PY, 10)", KikiPos (s.x/2-d+1, 0, s.z/2+d), KikiPos (s.x/2+d, 0, s.z/2+d))
world.addObjectLine ("KikiWire (KikiFace.PY, 5)",  KikiPos (s.x/2-d, 0, s.z/2-d+1), KikiPos (s.x/2-d, 0, s.z/2+d))
world.addObjectLine ("KikiWire (KikiFace.PY, 5)",  KikiPos (s.x/2+d, 0, s.z/2-d+1), KikiPos (s.x/2+d, 0, s.z/2+d))
# corners of wire square
world.addObjectAtPos (KikiWire (KikiFace.PY, 6),  KikiPos (s.x/2-d, 0, s.z/2-d))
world.addObjectAtPos (KikiWire (KikiFace.PY, 3),  KikiPos (s.x/2-d, 0, s.z/2+d))
world.addObjectAtPos (KikiWire (KikiFace.PY, 9),  KikiPos (s.x/2+d, 0, s.z/2+d))
world.addObjectAtPos (KikiWire (KikiFace.PY, 12), KikiPos (s.x/2+d, 0, s.z/2-d))

world.addObjectLine ("KikiWire (KikiFace.PX, 5)",  KikiPos (    0, 0, s.z/2), KikiPos (    0, s.y, s.z/2))
world.addObjectLine ("KikiWire (KikiFace.NX, 5)",  KikiPos (s.x-1, 0, s.z/2), KikiPos (s.x-1, s.y, s.z/2))

world.addObjectLine ("KikiWire (KikiFace.NY, 10)", KikiPos (0, s.y-1, s.z/2), KikiPos (s.x/2-d, s.y-1, s.z/2))
world.addObjectLine ("KikiWire (KikiFace.NY, 10)", KikiPos (s.x-d, s.y-1, s.z/2), KikiPos (s.x, s.y-1, s.z/2))

world.addObjectLine ("KikiWire (KikiFace.PY, 10)", KikiPos (0, 0, s.z/2), KikiPos (s.x/2-d, 0, s.z/2))
world.addObjectLine ("KikiWire (KikiFace.PY, 10)", KikiPos (s.x-d, 0, s.z/2), KikiPos (s.x, 0, s.z/2))

world.addObjectAtPos (KikiWire (KikiFace.PY, 13),  KikiPos (s.x/2-d, 0, s.z/2))
world.addObjectAtPos (KikiWire (KikiFace.PY, 7),  KikiPos (s.x/2+d, 0, s.z/2))
""",                                 
}