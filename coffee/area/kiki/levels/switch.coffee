# .................................................................................................................
level_dict["switch"] = {   
                        "scheme":   "yellow_scheme",
                        "size":     (7,7,7),
                        "intro":    "switch",    
                        "help":     ( 
                                        "$scale(1.5)mission:\nactivate the exit!\n\n" + \
                                        "to activate the exit,\nactivate the 4 switches\n\n" + \
                                        "to activate the switches,\nshoot them\n\n" + \
                                        "to be able to shoot the switches,\nmove the center stone", 
                                        "to move the center stone,\n\nuse the bomb.\n\n" + \
                                        "the bomb will detonate if you shoot it"
                                    ),
                        "player":   {   "coordinates":     (3,0,3),
                                        "nostatus":         0,
                                    },
                        "exits":    [
                                        {
                                            "name":         "exit",
                                            "active":       0,
                                            "position":     (0,-1,0),
                                        },
                                    ],
                        "create":
"""
s = world.getSize ()
h = 0
# bomb and stones

world.addObjectAtPos (KikiStone(), KikiPos (s.x/2, s.y/2, s.z/2))
world.addObjectAtPos (KikiStone(), KikiPos (s.x/2, s.y-2, s.z/2))

world.addObjectAtPos (KikiBomb(), KikiPos (s.x/2, 1, s.z/2))

# stone frames for switches

world.addObjectAtPos (KikiWall(), world.decenter ( 0,  h-1, s.z/2))
world.addObjectAtPos (KikiWall(), world.decenter ( 0,  h+1, s.z/2))
world.addObjectAtPos (KikiWall(), world.decenter ( 1,  h, s.z/2))
world.addObjectAtPos (KikiWall(), world.decenter (-1,  h, s.z/2))

world.addObjectAtPos (KikiWall(), world.decenter (s.x/2, h-1, 0))
world.addObjectAtPos (KikiWall(), world.decenter (s.x/2, h+1, 0))
world.addObjectAtPos (KikiWall(), world.decenter (s.x/2, h,  1))
world.addObjectAtPos (KikiWall(), world.decenter (s.x/2, h, -1))

world.addObjectAtPos (KikiWall(), world.decenter ( 0,  h-1, -s.z/2+1))
world.addObjectAtPos (KikiWall(), world.decenter ( 0,  h+1, -s.z/2+1))
world.addObjectAtPos (KikiWall(), world.decenter ( 1,  h, -s.z/2+1))
world.addObjectAtPos (KikiWall(), world.decenter (-1,  h, -s.z/2+1))

world.addObjectAtPos (KikiWall(), world.decenter (-s.x/2+1, h-1, 0))
world.addObjectAtPos (KikiWall(), world.decenter (-s.x/2+1, h+1, 0))
world.addObjectAtPos (KikiWall(), world.decenter (-s.x/2+1, h,  1))
world.addObjectAtPos (KikiWall(), world.decenter (-s.x/2+1, h, -1))

# switches

world.switch_counter = 0

def switched (switch):
    world.switch_counter += switch.isActive() and 1 or -1
    exit = kikiObjectToGate(world.getObjectWithName("exit"))
    exit.setActive(world.switch_counter == 4)

switch1 = KikiSwitch()
switch1.getEventWithName("switched").addAction (continuous (lambda s=switch1: switched(s)))
switch2 = KikiSwitch()
switch2.getEventWithName("switched").addAction (continuous (lambda s=switch2: switched(s)))
switch3 = KikiSwitch()
switch3.getEventWithName("switched").addAction (continuous (lambda s=switch3: switched(s)))
switch4 = KikiSwitch()
switch4.getEventWithName("switched").addAction (continuous (lambda s=switch4: switched(s)))

world.addObjectAtPos (switch1, world.decenter (-s.x/2+1, 0, 0))
world.addObjectAtPos (switch2, world.decenter ( s.x/2, 0, 0))
world.addObjectAtPos (switch3, world.decenter (0, 0, -s.z/2+1))
world.addObjectAtPos (switch4, world.decenter (0, 0,  s.z/2))
""",                                 
}