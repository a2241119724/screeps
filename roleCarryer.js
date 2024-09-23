const roleConfig = require('roleConfig');
const roleCommon = require('roleCommon');
const tool = require('tool');
const Role = require('Role');

const carryerState = {
    toSource:"toSource",
    toSpawn:"toSpawn",
    toContainer:"toContainer",
    collectSource:"collectSource",
    toExtension:"toExtension",
    toTower:"toTower",
    toStorage:"toStorage",
    getFromStorage:"getFromStorage",
    searchContainer:"searchContainer",
    toDropResource:"toDropResource",
    toBeRecycle:"toBeRecycle"
};
const freeCapacity = [carryerState.toSource,carryerState.searchContainer,
    carryerState.toContainer,carryerState.collectSource,
    carryerState.getFromStorage,carryerState.toDropResource];

class RoleCarryer extends Role{
    constructor(){
        super();
    }
    static getInstance(){
        if(!RoleCarryer.instance){
            RoleCarryer.instance = new RoleCarryer();
        }
        return RoleCarryer.instance;
    }
    create(index){
        const name = "Carryer" + index;
        const spawn = Game.spawns["Spawn1"];
        const res = spawn.spawnCreep(tool.getComponentByLevel(roleConfig.carryerComponent,roleConfig.carryerComponentToEnergy), name, {
            memory:{ role: "carryer" }
        });
        roleCommon.create(res, name, index, carryerState.searchContainer);
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
        if(roleConfig.isCarryerSay){
            creep.say(creep.memory.creepState);
        }
        
        if(freeCapacity.includes(creep.memory.creepState)){
            // 找资源且自身满了
            if(creep.store.getFreeCapacity()==0){
                creep.memory.creepState = carryerState.toExtension;
            }
        }else if(creep.memory.creepState==carryerState.toBeRecycle){
        }else{
            if(creep.store.getUsedCapacity()==0){
                creep.memory.creepState = carryerState.toDropResource;
            }
        }
        if(creep.memory.creepState == carryerState.toSource){
            const source = Game.getObjectById(creep.memory.sourceId);
            const res = creep.harvest(source);
            if(res==OK){
                creep.memory.creepState = carryerState.collectSource;
            }else if(res==ERR_NO_BODYPART){
                creep.memory.creepState = carryerState.toDropResource;
            }else if(res==ERR_NOT_IN_RANGE){
                creep.moveTo(source);
            }
        }else if(creep.memory.creepState == carryerState.collectSource){
            const dropped_resource = creep.pos.lookFor(LOOK_RESOURCES)
            if(dropped_resource.length){
                if(roleConfig.isCarryerSay){
                    creep.say("🔍" + dropped_resource[0].amount);
                }
                creep.pickup(dropped_resource[0]);
            }
            const source = Game.getObjectById(creep.memory.sourceId);
            const res = creep.harvest(source);
            if(res==ERR_NOT_IN_RANGE || res==ERR_NOT_ENOUGH_RESOURCES){
                creep.memory.creepState = carryerState.toSource;
            }
            if(res==ERR_FULL || creep.store.getFreeCapacity()==0){
                creep.memory.creepState = carryerState.toSpawn;
            }
        }else if(creep.memory.creepState == carryerState.toSpawn){
            const spawn = Game.spawns["Spawn1"];
            if(spawn.store.getFreeCapacity(RESOURCE_ENERGY)==0){
                creep.memory.creepState = carryerState.toTower;
                return;
            }
            const res = creep.transfer(spawn,RESOURCE_ENERGY)
            if(res==ERR_NOT_ENOUGH_RESOURCES){
                creep.memory.creepState = carryerState.toDropResource;
            }else if(res==ERR_FULL){
                creep.memory.creepState = carryerState.toTower;
            }else if(res==ERR_NOT_IN_RANGE){
                creep.moveTo(spawn);
            }
        }else if(creep.memory.creepState == carryerState.searchContainer){
            const containers = creep.room.find(FIND_STRUCTURES, {
                filter: (i)=>{
                    return i.structureType==STRUCTURE_CONTAINER 
                    && Memory.container.pre[i.id]
                    && i.store.getUsedCapacity(RESOURCE_ENERGY)-Memory.container.pre[i.id].reserve>0
                }
            });
            if(!containers.length){
                creep.memory.creepState = carryerState.getFromStorage;
                return;
            }
            let containerId = 0;
            let maxEnergy = 0;
            containers.forEach(container => {
                const energy = container.store.getUsedCapacity(RESOURCE_ENERGY);
                if(energy>maxEnergy){
                    maxEnergy = energy;
                    containerId = container.id;
                }
            });
            if(!containerId){
                creep.memory.creepState = carryerState.getFromStorage;
                return;
            }
            if(!Memory.container.pre[containerId]){
                tool.updateMemory();
                return;
            }
            creep.memory.containerId = containerId;
            if(!creep.id && !Memory.container.pre[containerId].creepsId.includes(creep.id)){
                Memory.container.pre[containerId].creepsId.push(creep.id);
                Memory.container.pre[containerId].reserve += creep.store.getFreeCapacity();
            }
            creep.memory.creepState = carryerState.toContainer;
        }else if(creep.memory.creepState == carryerState.toContainer){
            if(!Memory.container.pre[creep.memory.containerId]){
                creep.memory.creepState = carryerState.toDropResource;
                return;
            }
            if(roleConfig.isCarryerSay){
                creep.say("toCo" + creep.store.getFreeCapacity());
            }
            if(!creep.memory.containerId){
                creep.memory.creepState = carryerState.toDropResource;
                return;
            }
            const container = Game.getObjectById(creep.memory.containerId);
            if(!container){
                creep.memory.creepState = carryerState.toDropResource;
                return;
            }
            const res = creep.withdraw(container,RESOURCE_ENERGY);
            if(res==OK || res==ERR_FULL){
                creep.memory.creepState = carryerState.toExtension;
                Memory.container.pre[creep.memory.containerId].reserve -= creep.store.getFreeCapacity();
                Memory.container.pre[creep.memory.containerId].creepsId = Memory.container.pre[creep.memory.containerId].creepsId.filter(item=>item!=creep.id);
            }else if(res==ERR_NOT_IN_RANGE){
                creep.moveTo(container);
            }else if(res==ERR_NOT_ENOUGH_RESOURCES){
                Memory.container.pre[creep.memory.containerId].reserve -= creep.store.getFreeCapacity();
                Memory.container.pre[creep.memory.containerId].creepsId = Memory.container.pre[creep.memory.containerId].creepsId.filter(item=>item!=creep.id);
                creep.memory.creepState = carryerState.toDropResource;
            }
        }else if(creep.memory.creepState == carryerState.toExtension){
            const extension = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                filter: (i)=>i.structureType==STRUCTURE_EXTENSION 
                    && i.store.getFreeCapacity(RESOURCE_ENERGY)>0
            });
            if(!extension){
                creep.memory.creepState = carryerState.toSpawn;
                return;
            }
            const res = creep.transfer(extension,RESOURCE_ENERGY);
            if(res==ERR_NOT_ENOUGH_RESOURCES){
                creep.memory.creepState = carryerState.toDropResource;
            }else if(res==ERR_NOT_IN_RANGE){
                creep.moveTo(extension);
            }
        }else if(creep.memory.creepState == carryerState.toTower){
            const tower = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (i)=>i.structureType==STRUCTURE_TOWER 
                    && i.store.getFreeCapacity(RESOURCE_ENERGY)>0
            });
            if(!tower){
                creep.memory.creepState = carryerState.toStorage;
                return;
            }
            const res = creep.transfer(tower,RESOURCE_ENERGY)
            if(res==ERR_NOT_ENOUGH_RESOURCES){
                creep.memory.creepState = carryerState.toDropResource;
            }else if(res==ERR_NOT_IN_RANGE){
                creep.moveTo(tower);
            }
        }else if(creep.memory.creepState == carryerState.toStorage){
            const storage = creep.room.storage;
            if(!storage){
                creep.memory.creepState = carryerState.toExtension;
                return;
            }
            const res = creep.transfer(storage,RESOURCE_ENERGY)
            if(res==ERR_NOT_ENOUGH_RESOURCES){
                creep.memory.creepState = carryerState.toDropResource;
            }else if(res==ERR_NOT_IN_RANGE){
                creep.moveTo(storage);
            }
        }else if(creep.memory.creepState == carryerState.getFromStorage){
            const storage = creep.room.storage;
            if(!storage || !storage.store.getUsedCapacity(RESOURCE_ENERGY)){
                if(Memory.config.toDropCount<roleConfig.toDropMaxCount){
                    creep.memory.creepState = carryerState.toDropResource;
                }else if(Memory.controller.carryer.count>Memory.controller.carryer.maxCount){
                    creep.memory.creepState = carryerState.toBeRecycle;
                }
                return;
            }
            const res = creep.withdraw(storage,RESOURCE_ENERGY);
            if(res==OK || res == ERR_FULL){
                creep.memory.creepState = carryerState.toExtension;
            }else if(res==ERR_NOT_IN_RANGE){
                creep.moveTo(storage);
            }else if(res==ERR_NOT_ENOUGH_RESOURCES){
                creep.memory.creepState = carryerState.toDropResource;
            }
        }else if(creep.memory.creepState == carryerState.toDropResource){
            if(Memory.config.toDropCount<roleConfig.toDropMaxCount){
                Memory.config.toDropCount++;
            }else{
                creep.memory.creepState = carryerState.searchContainer;
            }
            const tombstone = creep.pos.findClosestByRange(FIND_TOMBSTONES,{
                filter: (tombstone) => tombstone.store.getUsedCapacity(RESOURCE_ENERGY)>0
            });
            if(tombstone){
                if(roleConfig.isCarryerSay){
                    creep.say("🔍" + tombstone.store.getUsedCapacity(RESOURCE_ENERGY));
                }
                const res = creep.withdraw(tombstone);
                if(res==OK){
                    creep.memory.creepState = carryerState.toSpawn;
                }else if(res==ERR_NOT_IN_RANGE){
                    creep.moveTo(tombstone);
                }
                Memory.config.toDropCount--;
                return;
            }
            let dropped_resource = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES,{
                filter:(i)=>i.resourceType==RESOURCE_ENERGY
                    && i.amount>25
            });
            if(!dropped_resource){
                creep.memory.creepState = carryerState.searchContainer;
                Memory.config.toDropCount--;
                return;
            }
            if(roleConfig.isCarryerSay){
                creep.say("🔍" + dropped_resource.amount);
            }
            const res = creep.pickup(dropped_resource);
            if(res==OK){
                creep.memory.creepState = carryerState.toSpawn;
            }else if(res==ERR_NOT_IN_RANGE){
                creep.moveTo(dropped_resource);
            }
            Memory.config.toDropCount--;
        }else if(creep.memory.creepState == carryerState.toBeRecycle){
            const spawn = Game.spawns["Spawn1"];
            const res = spawn.recycleCreep(creep);
            if(res==ERR_NOT_IN_RANGE){
                creep.moveTo(spawn);
            }
        }else{
            creep.memory.creepState = carryerState.searchContainer;
        }
    }
    kale(creep){
        // creep.memory.creepState = carryerState.toContainer;
    }
}

module.exports = RoleCarryer.getInstance();