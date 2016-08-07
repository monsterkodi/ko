# .................................................................................................................
level_dict["gears"] = {   
                        "scheme":   "blue_scheme",
                        "size":     (9,9,9),    
                        "intro":    "gears", 
                        "help":     ( 
                                        "$scale(1.5)mission:\nactivate the exit!\n\n" + \
                                        "to activate the exit\nfeed it with electricity:\n\n" + \
                                        "connect the generator\nwith the motor\n" + \
                                        "and close the circuit\nwith the wire stones",
                                    ),
                        "player":   {   "position":         (0,0,0),
                                    },
                        "exits":    [
                                        {
                                            "name":         "exit",
                                            "active":       0,
                                            "position":     (0,4,0),
                                        },
                                    ],
                        "create":
"""
s = world.getSize()

world.addObjectAtPos ( KikiWireStone (), world.decenter (-1, 0, 0))
world.addObjectAtPos ( KikiWireStone (), world.decenter ( 1, 0, 0))
world.addObjectAtPos ( KikiWireStone (), world.decenter ( 0,-1, 0))
world.addObjectAtPos ( KikiWireStone (), world.decenter ( 0, 1, 0))
world.addObjectAtPos ( KikiWireStone (), world.decenter ( 0, 0,-1))
world.addObjectAtPos ( KikiWireStone (), world.decenter ( 0, 0, 1))

world.addObjectAtPos ( KikiGear (KikiFace.PY), KikiPos (s.x/2-1, 0, s.z/2-1))
world.addObjectAtPos ( KikiGear (KikiFace.PY), KikiPos (s.x/2+1, 0, s.z/2-1))
world.addObjectAtPos ( KikiGear (KikiFace.PY), KikiPos (s.x/2-1, 0, s.z/2+1))

d = 3
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

world.addObjectAtPos (KikiWire (KikiFace.PX, 1), KikiPos (0, 0, s.z/2))
world.addObjectAtPos (KikiWire (KikiFace.NX, 1), KikiPos (s.x-1, 0, s.z/2))

world.addObjectLine ("KikiWire (KikiFace.PX, 5)",  KikiPos (    0, 1, s.z/2), KikiPos (    0, s.y, s.z/2))
world.addObjectLine ("KikiWire (KikiFace.NX, 5)",  KikiPos (s.x-1, 1, s.z/2), KikiPos (s.x-1, s.y, s.z/2))
world.addObjectLine ("KikiWire (KikiFace.NY, 10)", KikiPos (0, s.y-1, s.z/2), KikiPos (s.x, s.y-1, s.z/2))

""",                                 
}
