# level design by Michael Abel

# .................................................................................................................
def KikiWireWall( c , p):
	if world.isUnoccupiedPos(KikiPos (p.x,p.y,p.z)):	
		world.addObjectAtPos (KikiWall()		, KikiPos (p.x,p.y,p.z))
		world.addObjectAtPos (KikiWire (KikiFace.X,  c ), KikiPos (p.x+1,p.y  ,p.z  ))
		world.addObjectAtPos (KikiWire (KikiFace.NX, c ), KikiPos (p.x-1,p.y  ,p.z  ))
		world.addObjectAtPos (KikiWire (KikiFace.Y,  c ), KikiPos (p.x  ,p.y+1,p.z  ))
		world.addObjectAtPos (KikiWire (KikiFace.NY, c ), KikiPos (p.x  ,p.y-1,p.z  ))
		world.addObjectAtPos (KikiWire (KikiFace.Z,  c ), KikiPos (p.x  ,p.y  ,p.z+1))
		world.addObjectAtPos (KikiWire (KikiFace.NZ, c ), KikiPos (p.x  ,p.y  ,p.z-1))
	

def func_conductor():
	for h in [ 2,4,6]:
		world.addObjectLine (KikiWall, KikiPos (5,2,h), KikiPos(5,6,h) )
		world.addObjectAtPos(KikiWireStone(), KikiPos (5,1,h))
		world.addObjectAtPos(KikiWireStone(), KikiPos (5,6,h))

	wire_u=lambda:KikiWire (KikiFace.Z, 4+1 )
   	wire_d=lambda:KikiWire (KikiFace.NZ, 4+1 )
	
	world.addObjectLine (wire_d, KikiPos (5,2,1),KikiPos (5,6,1))
	world.addObjectLine (wire_u, KikiPos (5,2,3),KikiPos (5,6,3))
	world.addObjectAtPos(  	KikiWire (KikiFace.NY, 5 ), KikiPos(5,1,2))
	world.addObjectAtPos(  	KikiWire (KikiFace.Y, 5 ), KikiPos(5,6,2))

	
	world.addObjectAtPos (KikiMotorGear     (KikiFace.Z)	, KikiPos (5,0,0))
	world.addObjectAtPos (KikiMotorCylinder (KikiFace.Z)	, KikiPos (5,0,1))
	world.addObjectAtPos (KikiMotorCylinder (KikiFace.NX)	, KikiPos (4,0,0))
	world.addObjectAtPos (KikiMotorCylinder (KikiFace.X)	, KikiPos (6,0,0))
	
	
	g=KikiGenerator 	(KikiFace.Z) #set to Active as last command in LevelS
	world.addObjectAtPos (g	, KikiPos (5,1,0))

 	world.addObjectAtPos (KikiWireStone()	, KikiPos (5,2,0))
 	world.addObjectAtPos (KikiWireStone()	, KikiPos (5,2,1))
 	
	world.addObjectAtPos (KikiWireStone()	, KikiPos (5,5,3))
 	world.addObjectAtPos (KikiWireStone()	, KikiPos (5,5,5))
	
 	KikiWireWall(15 ,KikiPos(5,4,8))	

	world.addObjectAtPos(KikiWall(), KikiPos(0,0,0))
	world.addObjectAtPos(KikiWall(), KikiPos(10,0,0))
	world.addObjectAtPos(KikiWall(), KikiPos(10,8,0))
	world.addObjectAtPos(KikiWall(), KikiPos(0,8,0))
	
	g.setActive(True)

	
level_dict["conductor"] = {   
                        "scheme":   "default_scheme",
                        "size":     (11,9,11),
                        "intro":    "conductor",    
                        "help":     ( 
                                        "$scale(1.5)mission:\nactivate the exit!\n\n" + \
                                        "to activate the exit\nfeed it with electricity:\n\n" + \
                                        "connect the generator\nwith the motor\n\n" + \
                                        "and place a powered wirestone\nnext to the exit"
                                    ),
                        "player":   {   "coordinates":     (3,0,3),
                                        "nostatus":         0,
				    },
                        "exits":    [
                                        {
                                            "name":         "exit",
                                            "active":       0,
                                            "position":     (0,0,4),
                                        },
				    ],
			 "create": func_conductor,
			}

# .................................................................................................................

