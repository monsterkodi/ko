
#   0000000     0000000   00     00  0000000     0000000
#   000   000  000   000  000   000  000   000  000     
#   0000000    000   000  000000000  0000000    0000000 
#   000   000  000   000  000 0 000  000   000       000
#   0000000     0000000   000   000  0000000    0000000 

module.exports = 
    name:     'bombs'
    scheme:   "red_scheme"
    size:     [9,9,9]
    intro:    "bombs" 
    help:     """
                $scale(1.5)mission:
                get to the exit!
                
                to get to the exit,
                use the bombs
              """
    player:   position: [0,-4,0]
              
    exits:    [
        name:     "exit"
        active:   1
        position: [0,2,0]
    ],
    create: ->
        world.addObjectAtPos KikiBomb(), world.decenter 0,-4,2
        world.addObjectAtPos KikiBomb(), world.decenter 0,-4,-2
        world.addObjectAtPos KikiBomb(), world.decenter -3,-2,0