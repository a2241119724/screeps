const roleConfig = require('roleConfig');
const roleCommon = require('roleCommon');
const tool = require('tool');
const Role = require('Role');

const harvesterState = {
    toSource:"toSource",
    toSpawn:"toSpawn",
    toContainer:"toContainer",
    toExtension:"toExtension",
    collectSource:"collectSource",
    toStorage:"toStorage"
};
const freeCapacity = [harvesterState.toSource,harvesterState.collectSource];

class RoleHarvester extends Role{
    constructor(){
        super();
    }
    static getInstance(){
        if(!RoleHarvester.instance){
            RoleHarvester.instance = new RoleHarvester();
        }
        return RoleHarvester.instance;
    }
    create(index){
        const name = "Harvester" + index;
        const spawn = Game.spawns["Spawn1"];
        const res = spawn.spawnCreep(tool.getComponentByLevel(roleConfig.harvesterComponent,roleConfig.harvesterComponentToEnergy,true), name, {
            memory:{ role: "harvester" }
        });
        roleCommon.create(res, name, index, harvesterState.toSource);
        if(res==ERR_NAME_EXISTS){
            // add new attr
        }else if(res==OK){
            if(roleConfig.isPrintLog){
                console.log(name + " is created");
            }
            return 1;
        }
        return 0;
    }
    run(creep) {        
        if(roleConfig.isHarvesterSay){
            creep.say(creep.memory.creepState);
        }

        if(freeCapacity.includes(creep.memory.creepState)){
            // 找资源且自身满了
            if(creep.store.getFreeCapacity()==0){
                creep.memory.creepState = harvesterState.toExtension;
            }
        }else{
            if(creep.store.getUsedCapacity()==0){
                creep.memory.creepState = harvesterState.toSource;
            }
        }
        if(creep.memory.creepState == harvesterState.toSource){
            const source = Game.getObjectById(creep.memory.sourceId);
            const res = creep.harvest(source);
            if(res==OK){
                creep.memory.creepState = harvesterState.collectSource;
            }else if(res==ERR_NOT_IN_RANGE){
                creep.moveTo(source);
            }
            if(creep.store.getFreeCapacity()==0){
                creep.memory.creepState = harvesterState.toExtension;
            }
        }else if(creep.memory.creepState == harvesterState.toSpawn){
            const spawn = Game.spawns["Spawn1"];
            if(spawn.store.getFreeCapacity(RESOURCE_ENERGY)==0){
                creep.memory.creepState = harvesterState.toTower;
                return;
            }
            const res = creep.transfer(spawn,RESOURCE_ENERGY)
            if(res==ERR_NOT_ENOUGH_RESOURCES){
                creep.memory.creepState = harvesterState.toSource;
            }else if(res==ERR_FULL){
                creep.memory.creepState = harvesterState.toTower;
            }else if(res==ERR_NOT_IN_RANGE){
                creep.moveTo(spawn);
            }
        }else if(creep.memory.creepState == harvesterState.collectSource){
            const dropped_resource = creep.pos.lookFor(LOOK_RESOURCES)
            if(dropped_resource.length){
                if(roleConfig.isHarvesterSay){
                    creep.say("🔍" + dropped_resource[0].amount);
                }
                creep.pickup(dropped_resource[0]);
            }
            const source = Game.getObjectById(creep.memory.sourceId);
            const res = creep.harvest(source);
            if(res==ERR_NOT_IN_RANGE || res==ERR_NOT_ENOUGH_RESOURCES){
                creep.memory.creepState = harvesterState.toSource;
            }
            if(res==ERR_FULL || creep.store.getFreeCapacity()==0){
                creep.memory.creepState = harvesterState.toExtension;
            }
        }else if(creep.memory.creepState == harvesterState.toExtension){
            const extension = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                filter: (i)=>i.structureType==STRUCTURE_EXTENSION 
                    && i.store.getFreeCapacity(RESOURCE_ENERGY)>0
            });
            if(!extension){
                creep.memory.creepState = harvesterState.toSpawn;
                return;
            }
            const res = creep.transfer(extension,RESOURCE_ENERGY);
            if(res==ERR_NOT_ENOUGH_RESOURCES){
                creep.memory.creepState = harvesterState.toSource;
            }else if(res==ERR_NOT_IN_RANGE){
                creep.moveTo(extension);
            }
        }else if(creep.memory.creepState == harvesterState.toContainer){
            const container = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (i)=>i.structureType==STRUCTURE_CONTAINER 
                    && i.store.getFreeCapacity(RESOURCE_ENERGY)>0
            });
            if(!container){
                creep.memory.creepState = harvesterState.toExtension;
                return;
            }
            const res = creep.transfer(container,RESOURCE_ENERGY);
            if(res==ERR_NOT_ENOUGH_RESOURCES){
                creep.memory.creepState = harvesterState.toSource;
            }else if(res==ERR_NOT_IN_RANGE){
                creep.moveTo(container);
            }
        }else if(creep.memory.creepState == harvesterState.toTower){
            const tower = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (i)=>i.structureType==STRUCTURE_TOWER 
                    && i.store.getFreeCapacity(RESOURCE_ENERGY)>0
            });
            if(!tower){
                creep.memory.creepState = harvesterState.toStorage;
                return;
            }
            const res = creep.transfer(tower,RESOURCE_ENERGY)
            if(res==ERR_NOT_ENOUGH_RESOURCES){
                creep.memory.creepState = harvesterState.toSource;
            }else if(res==ERR_NOT_IN_RANGE){
                creep.moveTo(tower);
            }
        }else if(creep.memory.creepState == harvesterState.toStorage){
            const storage = creep.room.storage;
            if(!storage){
                creep.memory.creepState = harvesterState.toContainer;
                return;
            }
            const res = creep.transfer(storage,RESOURCE_ENERGY)
            if(res==ERR_NOT_ENOUGH_RESOURCES){
                creep.memory.creepState = harvesterState.toSource;
            }else if(res==ERR_NOT_IN_RANGE){
                creep.moveTo(storage);
            }
        }else{
            creep.memory.creepState = harvesterState.toSource;
        }
	}
    kale(creep){
        // creep.memory.creepState = harvesterState.toSource;
    }
};

module.exports = RoleHarvester.getInstance();