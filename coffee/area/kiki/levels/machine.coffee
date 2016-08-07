# level design by Michael Abel

module.exports =
    name:       "machine"
    scheme:     "tron_scheme"
    size:       [5,5,9]
    intro:      "machine"
    help:       "$scale(1.5)mission:\nactivate the exit!"
    player:     
        position:     [0,0,0]
        orientation:   roty270
    exits:      [
        name:         "exit"
        active:       0
        coordinates:  [1,2,8]
    ]
    create: 
        s = world.getSize()
        world.addObjectAtPos(KikiMotorGear(KikiFace.X), KikiPos(0,2,4))
        world.addObjectAtPos(KikiWall(), KikiPos(0,2,3))
        world.addObjectAtPos(KikiWall(), KikiPos(0,2,5))
        world.addObjectAtPos(KikiMotorCylinder(KikiFace.X), KikiPos(1,2,4))
           
        world.addObjectAtPos(KikiWireStone(), KikiPos(0,2,6))
   
        for i in range(1,9,2)
            world.addObjectAtPos(KikiWall(), KikiPos(4,0,i))
            world.addObjectAtPos(KikiWall(), KikiPos(4,4,i))
            world.addObjectAtPos(KikiWall(), KikiPos(0,0,i))
            world.addObjectAtPos(KikiWall(), KikiPos(0,4,i))
        for i in range(2,8,2)
            gear = KikiGear(KikiFace.X)
            world.addObjectAtPos(gear, KikiPos(0,1,i))
            if i == 4
                gear.setActive(true)
            gear = KikiGear(KikiFace.X)
            world.addObjectAtPos(gear, KikiPos(0,3,i))
            if i == 4
                gear.setActive(true)
       
        world.addObjectAtPos(KikiGenerator(KikiFace.X), KikiPos(0,2,2))
    
        