# level design by Michael Abel

module.exports =
    
    name:   "circuit"
    "scheme":   "tron_scheme",
    "size":     [9,9,9],
    "intro":    "circuit",    
    "help":     """
                $scale(1.5)mission:
                activate the exit!
                
                to activate the exit
                feed it with electricity
                """
    "player":   
        "coordinates":     [4,6,4],
        "nostatus":         0,
        "orientation":      rot0
    "exits": [
        "name":         "exit",
        "active":       0,
        "coordinates":  [8,8,8],
    ]
    "create": ->
        s=world.getSize()
        mx=s.x/2
        my=s.y/2
        mz=s.z/2
        sx=s.x-1
        sy=s.y-1
        sz=s.z-1
     
        p=[ [KikiPos( 0, 0, 0+1),KikiPos( 0, 0,mz),KikiPos( 0,my,mz), KikiFace.X,  KikiFace.X],
            [KikiPos( 0,my,mz+1),KikiPos( 0,my,sz),KikiPos(mx,my,sz), KikiFace.X,  KikiFace.NZ],
            [KikiPos(mx,my-1,sz),KikiPos(mx, 0,sz),KikiPos(my, 0,mz), KikiFace.NZ, KikiFace.Y],
            [KikiPos(mx+1, 0,mz),KikiPos(sx, 0,mz),KikiPos(sx,my,mz), KikiFace.Y,  KikiFace.NX],
            [KikiPos(sx,my,mz-1),KikiPos(sx,my, 0),KikiPos(mx,my, 0), KikiFace.NX, KikiFace.Z],
            [KikiPos(mx,my+1, 0),KikiPos(mx,sy, 0),KikiPos(mx,sy,my), KikiFace.Z,  KikiFace.NY],
            [KikiPos(mx+1,sy,my),KikiPos(sx,sy,mz),KikiPos(sx,sy,sz), KikiFace.NY, KikiFace.NY],
            ]
        for k in p:            
            stone=lambda:KikiWire(k[3], 15)
            world.addObjectLine(stone,k[0],k[1])
            world.addObjectAtPos(KikiWire(k[3], 15), k[1]) # correct the last missing stone of the line
            
            stone=lambda:KikiWire(k[4], 15)
            world.addObjectLine(stone,k[1],k[2])
            
        world.addObjectAtPos(KikiWireStone(), world.decenter(1,0,0))
        world.addObjectAtPos(KikiWireStone(), world.decenter(-1,0,0))
        world.addObjectAtPos(KikiWireStone(), world.decenter(0,1,0))
        world.addObjectAtPos(KikiWireStone(), world.decenter(0,-1,0))
        world.addObjectAtPos(KikiWireStone(), world.decenter(0,0,1))
        world.addObjectAtPos(KikiWireStone(), world.decenter(0,0,-1))
        world.addObjectAtPos(KikiWireStone(), world.decenter(0,0,2))
        world.addObjectAtPos(KikiWireStone(), world.decenter(0,0,-2))
        
        world.addObjectAtPos(KikiWire(KikiFace.X), KikiPos(0,0,0))
        world.addObjectAtPos(KikiWire(KikiFace.Z), KikiPos(0,0,0))
        world.addObjectAtPos(KikiWire(KikiFace.Z), KikiPos(1,0,0))
        
        world.addObjectAtPos(KikiWire(KikiFace.NY), KikiPos(sx,sy,sz))
        
        world.addObjectAtPos(KikiMotorGear(KikiFace.Z), KikiPos(2,0,0))
        world.addObjectAtPos(KikiMotorCylinder(KikiFace.Z), KikiPos(2,0,1))
        g=KikiGenerator(KikiFace.Z)
        world.addObjectAtPos(g, KikiPos(mx,my,mz))
    