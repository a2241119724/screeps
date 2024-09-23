class StructureTower {
    constructor(){}
    static getInstance(){
        if(!StructureTower.instance){
            StructureTower.instance = new StructureTower();
        }
        return StructureTower.instance;
    }
    run(){
        const towers = Game.spawns["Spawn1"].room.find(
            FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}}
        );

        towers.forEach(tower=>{
            const closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            if(closestHostile){ 
                tower.attack(closestHostile); // attack
            }else{
                const closestDamagedStructure = tower.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                    filter: (structure) => structure.hits < structure.hitsMax
                });
                if(closestDamagedStructure){
                    tower.repair(closestDamagedStructure); // repair
                }else{
                    const closestInjuredCreep = tower.pos.findClosestByRange(FIND_MY_CREEPS, {
                        filter: (creep) => creep.hits < creep.hitsMax
                    });
                    if(closestInjuredCreep){
                        tower.heal(closestInjuredCreep); // heal
                    }
                }
            }
        })
    }
}

module.exports = StructureTower.getInstance();