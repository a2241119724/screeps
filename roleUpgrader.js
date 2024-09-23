const roleConfig = require('roleConfig');
const roleCommon = require('roleCommon');
const tool = require('tool');
const Role = require('Role');

const upgraderState = {
    toSource:"toSource",
    toContainer:"toContainer",
    collectSource:"collectSource",
    toController:"toController",
    upgradeController:"upgradeController",
    searchContainer:"searchContainer",
    getFromStorage:"getFromStorage",
    getFromLink:"getFromLink",
    toDropResource:"toDropResource",
    toBeRecycle:"toBeRecycle"
};
const freeCapacity = [upgraderState.toSource,upgraderState.searchContainer,
    upgraderState.toContainer,upgraderState.collectSource,
    upgraderState.getFromStorage,upgraderState.toDropResource,
    upgraderState.getFromLink];

class RoleUpgrader extends Role{
    constructor(){
        super();
    }
    static getInstance(){
        if(!RoleUpgrader.instance){
            RoleUpgrader.instance = new RoleUpgrader();
        }
        return RoleUpgrader.instance;
    }
    create(index){
        const name = "Upgrader" + index;
        const spawn = Game.spawns["Spawn1"];
        const res = spawn.spawnCreep(tool.getComponentByLevel(roleConfig.upgraderComponent,roleConfig.upgraderComponentToEnergy), name, {
            memory:{ role: "upgrader" }
        });
        roleCommon.create(res, name, index, upgraderState.toContainer);
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
        if(roleConfig.isUpgraderSay){
            creep.say(creep.memory.creepState);
        }

        if(freeCapacity.includes(creep.memory.creepState)){
            // 找资源且自身满了
            if(creep.store.getFreeCapacity()==0){
                creep.memory.creepState = upgraderState.toController;
            }
        }else if(creep.memory.creepState==upgraderState.toBeRecycle){
        }else{
            if(creep.store.getUsedCapacity()==0){
                creep.memory.creepState = upgraderState.getFromLink;
            }
        }
        if(creep.memory.creepState == upgraderState.toSource){
            const source = Game.getObjectById(creep.memory.sourceId);
            const res = creep.harvest(source);
            if(res==OK){
                creep.memory.creepState = upgraderState.collectSource;
            }else if(res==ERR_NOT_IN_RANGE){
                creep.moveTo(source);
            }
        }else if(creep.memory.creepState == upgraderState.collectSource){
            const dropped_resource = creep.pos.lookFor(LOOK_RESOURCES)
            if(dropped_resource.length){
                if(roleConfig.isUpgraderSay){
                    creep.say("🔍" + dropped_resource[0].amount);
                }
                creep.pickup(dropped_resource[0]);
            }
            const source = Game.getObjectById(creep.memory.sourceId);
            const res = creep.harvest(source);
            if(res==ERR_NOT_IN_RANGE || res==ERR_NOT_ENOUGH_RESOURCES){
                creep.memory.creepState = upgraderState.toSource;
            }
            if(res==ERR_FULL || creep.store.getFreeCapacity() == 0){
                creep.memory.creepState = upgraderState.toController;
            }
        }else if(creep.memory.creepState == upgraderState.toController){
            const res = creep.transfer(creep.room.controller, RESOURCE_ENERGY);
            if(res==OK){
                creep.memory.creepState = upgraderState.upgradeController;
            }else if(res==ERR_NOT_ENOUGH_RESOURCES){
                creep.memory.creepState = upgraderState.toDropResource;
            }else if(res==ERR_NOT_IN_RANGE){
                creep.moveTo(creep.room.controller);
            }
        }else if(creep.memory.creepState == upgraderState.upgradeController){
            const res = creep.upgradeController(creep.room.controller);
            if(res==ERR_NOT_ENOUGH_RESOURCES){
                creep.memory.creepState = upgraderState.getFromLink;
            }
        }else if(creep.memory.creepState == upgraderState.searchContainer){
            const containers = creep.room.find(FIND_STRUCTURES, {
                filter: (i)=>{
                    return i.structureType==STRUCTURE_CONTAINER 
                    && Memory.container.pre[i.id]
                    && i.store.getUsedCapacity(RESOURCE_ENERGY)-Memory.container.pre[i.id].reserve>0
                }
            });
            if(!containers.length){
                creep.memory.creepState = upgraderState.getFromLink;
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
                creep.memory.creepState = upgraderState.getFromStorage;
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
            creep.memory.creepState = upgraderState.toContainer
        }else if(creep.memory.creepState == upgraderState.toContainer){
            if(!Memory.container.pre[creep.memory.containerId]){
                creep.memory.creepState = upgraderState.searchContainer;
                return;
            }
            if(roleConfig.isUpgraderSay){
                creep.say("toCo" + creep.store.getFreeCapacity());
            }
            if(!creep.memory.containerId){
                creep.memory.creepState = upgraderState.toDropResource;
                return;
            }
            const container = Game.getObjectById(creep.memory.containerId);
            if(!container){
                creep.memory.creepState = upgraderState.toDropResource;
                return;
            }
            const res = creep.withdraw(container,RESOURCE_ENERGY);
            if(res==OK || res==ERR_FULL){
                creep.memory.creepState = upgraderState.toController;
                Memory.container.pre[creep.memory.containerId].reserve -= creep.store.getFreeCapacity();
                Memory.container.pre[creep.memory.containerId].creepsId = Memory.container.pre[creep.memory.containerId].creepsId.filter(item=>item!=creep.id);
            }else if(res==ERR_NOT_IN_RANGE){
                creep.moveTo(container);
            }else if(res==ERR_NOT_ENOUGH_RESOURCES){
                Memory.container.pre[creep.memory.containerId].reserve -= creep.store.getFreeCapacity();
                Memory.container.pre[creep.memory.containerId].creepsId = Memory.container.pre[creep.memory.containerId].creepsId.filter(item=>item!=creep.id);
                creep.memory.creepState = upgraderState.toDropResource;
            }
        }else if(creep.memory.creepState == upgraderState.getFromStorage){
            const storage = creep.room.storage;
            if(!storage || !storage.store.getUsedCapacity(RESOURCE_ENERGY)){
                if(Memory.config.toDropCount<roleConfig.toDropMaxCount){
                    creep.memory.creepState = upgraderState.toDropResource;
                }else if(Memory.controller.upgrader.count>Memory.controller.upgrader.maxCount){
                    creep.memory.creepState = upgraderState.toBeRecycle;
                }
                return;
            }
            const res = creep.withdraw(storage,RESOURCE_ENERGY);
            if(res==OK){
                creep.memory.creepState = upgraderState.toController;
            }else if(res==ERR_NOT_IN_RANGE){
                creep.moveTo(storage);
            }else if(res==ERR_NOT_ENOUGH_RESOURCES){
                creep.memory.creepState = upgraderState.toDropResource;
            }else if(res==ERR_FULL){
                creep.memory.creepState = upgraderState.toController;
            }
        }else if(creep.memory.creepState == upgraderState.getFromLink){
            let link = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                filter: (i)=>i.structureType==STRUCTURE_LINK
                    && creep.pos.inRangeTo(i,4)
                    && i.store.getUsedCapacity(RESOURCE_ENERGY)
            });
            if(!link){
                creep.memory.creepState = upgraderState.toDropResource;
                return;
            }
            const res = creep.withdraw(link,RESOURCE_ENERGY);
            if(res==OK || res==ERR_FULL){
                creep.memory.creepState = upgraderState.toController;
            }else if(res==ERR_NOT_IN_RANGE){
                creep.moveTo(link);
            }else if(res==ERR_NOT_ENOUGH_RESOURCES){
                creep.memory.creepState = upgraderState.toDropResource;
            }
        }else if(creep.memory.creepState == upgraderState.toDropResource){
            if(Memory.config.toDropCount<roleConfig.toDropMaxCount){
                Memory.config.toDropCount++;
            }else{
                creep.memory.creepState = upgraderState.searchContainer;
            }
            const tombstone = creep.pos.findClosestByRange(FIND_TOMBSTONES,{
                filter: (tombstone) => tombstone.store.getUsedCapacity(RESOURCE_ENERGY)>0
            });
            if(tombstone){
                if(roleConfig.isUpgraderSay){
                    creep.say("🔍" + tombstone.store.getUsedCapacity(RESOURCE_ENERGY));
                }
                const res = creep.withdraw(tombstone);
                if(res==OK){
                    creep.memory.creepState = upgraderState.toController;
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
                creep.memory.creepState = upgraderState.searchContainer;
                Memory.config.toDropCount--;
                return;
            }
            if(roleConfig.isUpgraderSay){
                creep.say("🔍" + dropped_resource.amount);
            }
            const res = creep.pickup(dropped_resource);
            if(res==OK){
                creep.memory.creepState = upgraderState.toController;
            }else if(res==ERR_NOT_IN_RANGE){
                creep.moveTo(dropped_resource);
            }
            Memory.config.toDropCount--;
        }else if(creep.memory.creepState == upgraderState.toBeRecycle){
            const spawn = Game.spawns["Spawn1"];
            const res = spawn.recycleCreep(creep);
            if(res==ERR_NOT_IN_RANGE){
                creep.moveTo(spawn);
            }
        }else{
            creep.memory.creepState = upgraderState.searchContainer;
        }
	}
    kale(creep){
        // creep.memory.creepState = upgraderState.toContainer;
    }
};

module.exports = RoleUpgrader.getInstance();