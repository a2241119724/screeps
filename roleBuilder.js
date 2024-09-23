const roleConfig = require('roleConfig');
const roleCommon = require('roleCommon');
const tool = require('tool');
const Role = require('Role');

const builderState = {
    toSource:"toSource",
    toConstruct:"toConstruct",
    toContainer:"toContainer",
    collectSource:"collectSource",
    buildConstruct:"buildConstruct",
    searchConstruct:"searchConstruct",
    searchContainer:"searchContainer",
    getFromStorage:"getFromStorage",
    healStructure:"healStructure",
    searchHealer:"searchHealer",
    toDropResource:"toDropResource",
};

const freeCapacity = [builderState.toSource,builderState.searchContainer,
    builderState.toContainer,builderState.collectSource,
    builderState.getFromStorage,builderState.toDropResource];
const buildPriority = {
    extension:0,
    container:1,
    other:2
};

class RoleBuilder extends Role{
    constructor(){
        super();
    }
    static getInstance(){
        if(!RoleBuilder.instance){
            RoleBuilder.instance = new RoleBuilder();
        }
        return RoleBuilder.instance;
    }
    create(index){
        const name = "Builder" + index;
        const spawn = Game.spawns["Spawn1"];
        const res = spawn.spawnCreep(tool.getComponentByLevel(roleConfig.builderComponent,roleConfig.builderComponentToEnergy), name, {
            memory:{ role: "builder" }
        });
        roleCommon.create(res, name, index, builderState.searchContainer);
        const creep = Game.creeps[name];
        if(res==ERR_NAME_EXISTS){
            // add new attr
            if(!creep.memory.buildPriority){
                creep.memory.buildPriority = 0;
            }
        }else if(res==OK){
            // 0:优先建造container,1:优先建造extension,2:建造其他
            creep.memory.buildPriority = 0;
            if(roleConfig.isPrintLog){
                console.log(name + " is created");
            }
            return 1;
        }
        return 0;
    }
    run(creep) {
        if(roleConfig.isBuilderSay){
            creep.say(creep.memory.creepState);
        }

        if(freeCapacity.includes(creep.memory.creepState)){
            // 找资源且自身满了
            if(creep.store.getFreeCapacity()==0){
                creep.memory.creepState = builderState.searchConstruct;
            }
        }else{
            if(creep.store.getUsedCapacity()==0){
                creep.memory.creepState = builderState.toDropResource;
            }
        }
        if(creep.memory.creepState == builderState.toSource){
            const source = Game.getObjectById(creep.memory.sourceId);
            const res = creep.harvest(source);
            if(res==OK){
                creep.memory.creepState = builderState.collectSource;
            }else if(res==ERR_NOT_IN_RANGE){
                creep.moveTo(source);
            }
        }else if(creep.memory.creepState == builderState.searchConstruct){
            if(creep.room.find(FIND_CONSTRUCTION_SITES, {
                filter: (structure) => structure.structureType == STRUCTURE_EXTENSION
            }).length){
                creep.memory.buildPriority = buildPriority.extension;
            }else{
                if(creep.room.find(FIND_CONSTRUCTION_SITES, {
                    filter: (structure) => structure.structureType == STRUCTURE_CONTAINER
                }).length){
                    creep.memory.buildPriority = buildPriority.container;
                }else{
                    if(creep.room.find(FIND_CONSTRUCTION_SITES).length){
                        creep.memory.buildPriority = buildPriority.other;
                    }else{
                        creep.memory.creepState = builderState.searchHealer;
                        return;
                    }
                }
            }
            creep.memory.creepState = builderState.toConstruct;
        }else if(creep.memory.creepState == builderState.toConstruct){
            let target = null;
            if(creep.memory.buildPriority==buildPriority.extension){
                target = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES, {
                    filter: (i) => i.structureType == STRUCTURE_EXTENSION
                });
            }else if(creep.memory.buildPriority==buildPriority.container){
                target = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES, {
                    filter: (i) => i.structureType == STRUCTURE_CONTAINER
                });
            }else{
                target = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
            }
            if(!target){
                creep.memory.creepState = builderState.searchConstruct;
                return;
            }
            const res = creep.build(target);
            if(res==OK){
                creep.memory.creepState = builderState.buildConstruct;
            }else if(res==ERR_NOT_ENOUGH_RESOURCES){
                creep.memory.creepState = builderState.toDropResource;
            }else if(res==ERR_NOT_IN_RANGE){
                creep.moveTo(target);
            }
        }else if(creep.memory.creepState == builderState.collectSource){
            const dropped_resource = creep.pos.lookFor(LOOK_RESOURCES)
            if(dropped_resource.length){
                if(roleConfig.isBuilderSay){
                    creep.say("🔍" + dropped_resource[0].amount);
                }
                creep.pickup(dropped_resource[0]);
            }
            const source = Game.getObjectById(creep.memory.sourceId);
            const res = creep.harvest(source);
            if(res==ERR_NOT_IN_RANGE || res==ERR_NOT_ENOUGH_RESOURCES){
                creep.memory.creepState = builderState.toSource;
            }
            if(res==ERR_FULL || creep.store.getFreeCapacity()==0){
                creep.memory.creepState = builderState.searchConstruct;
            }
        }else if(creep.memory.creepState == builderState.buildConstruct){
            let target = null;
            if(creep.memory.buildPriority==buildPriority.extension){
                target = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES, {
                    filter: (i) => i.structureType == STRUCTURE_EXTENSION
                });
            }else if(creep.memory.buildPriority==buildPriority.container){
                target = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES, {
                    filter: (i) => i.structureType == STRUCTURE_CONTAINER
                });
            }else{
                target = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
            }
            if(!target){
                creep.memory.creepState = builderState.searchConstruct;
                return;
            }
            const res = creep.build(target);
            if(res==ERR_NOT_IN_RANGE){
                creep.memory.creepState = builderState.toConstruct
            }else if(res==ERR_NOT_ENOUGH_RESOURCES){
                creep.memory.creepState = builderState.toDropResource;
            }
        }else if(creep.memory.creepState == builderState.toContainer){
            if(!Memory.container.pre[creep.memory.containerId]){
                creep.memory.creepState = builderState.toDropResource;
                return;
            }
            if(roleConfig.isBuilderSay){
                creep.say("toCo" + creep.store.getFreeCapacity());
            }
            if(!creep.memory.containerId){
                creep.memory.creepState = builderState.toDropResource;
                return;
            }
            const container = Game.getObjectById(creep.memory.containerId);
            if(!container){
                creep.memory.creepState = builderState.toDropResource;
                return;
            }
            const res = creep.withdraw(container,RESOURCE_ENERGY);
            if(res==OK || res==ERR_FULL){
                Memory.container.pre[creep.memory.containerId].reserve -= creep.store.getFreeCapacity();
                Memory.container.pre[creep.memory.containerId].creepsId = Memory.container.pre[creep.memory.containerId].creepsId.filter(item=>item!=creep.id);
                creep.memory.creepState = builderState.searchConstruct;
            }else if(res==ERR_NOT_IN_RANGE){
                creep.moveTo(container);
            }else if(res==ERR_NOT_ENOUGH_RESOURCES){
                Memory.container.pre[creep.memory.containerId].reserve -= creep.store.getFreeCapacity();
                Memory.container.pre[creep.memory.containerId].creepsId = Memory.container.pre[creep.memory.containerId].creepsId.filter(item=>item!=creep.id);
                creep.memory.creepState = builderState.toDropResource;
            }
        }else if(creep.memory.creepState == builderState.getFromStorage){
            const storage = creep.room.storage;
            if(!storage || !storage.store.getUsedCapacity(RESOURCE_ENERGY)){
                if(!Memory.controller.worker.count){
                    creep.memory.creepState = builderState.toSource;
                }else if(Memory.config.toDropCount<roleConfig.toDropMaxCount){
                    creep.memory.creepState = builderState.toDropResource;
                }else if(Memory.controller.builder.count>Memory.controller.builder.maxCount){
                    creep.memory.creepState = builderState.toBeRecycle;
                }
                return;
            }
            const res = creep.withdraw(storage,RESOURCE_ENERGY);
            if(res==OK){
                creep.memory.creepState = builderState.searchConstruct;
            }else if(res==ERR_NOT_IN_RANGE){
                creep.moveTo(storage);
            }else if(res==ERR_NOT_ENOUGH_RESOURCES){
                creep.memory.creepState = builderState.toDropResource;
            }
        }else if(creep.memory.creepState == builderState.searchContainer){
            const containers = creep.room.find(FIND_STRUCTURES, {
                filter: (i)=>{
                    return i.structureType==STRUCTURE_CONTAINER 
                    && Memory.container.pre[i.id]
                    && i.store.getUsedCapacity(RESOURCE_ENERGY)-Memory.container.pre[i.id].reserve>0
                }
            });
            if(!containers.length){
                creep.memory.creepState = builderState.getFromStorage;
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
                creep.memory.creepState = builderState.getFromStorage;
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
            creep.memory.creepState = builderState.toContainer;
        }else if(creep.memory.creepState == builderState.healStructure){
            const structure = Game.getObjectById(creep.memory.healerId);
            const res = creep.repair(structure);
            if(res==OK){
                creep.memory.creepState = builderState.searchConstruct;
            }else if(res==ERR_NOT_IN_RANGE){
                creep.moveTo(structure);
            }
            if(creep.store.getUsedCapacity()==0){
                creep.memory.creepState = builderState.toContainer;
            }
        }else if(creep.memory.creepState == builderState.toDropResource){
            if(Memory.config.toDropCount<roleConfig.toDropMaxCount){
                Memory.config.toDropCount++;
            }else{
                creep.memory.creepState = builderState.searchContainer;
            }
            const tombstone = creep.pos.findClosestByRange(FIND_TOMBSTONES,{
                filter: (tombstone) => tombstone.store.getUsedCapacity(RESOURCE_ENERGY)>0
            });
            if(tombstone){
                if(roleConfig.isBuilderSay){
                    creep.say("🔍" + tombstone.store.getUsedCapacity(RESOURCE_ENERGY));
                }
                const res = creep.withdraw(tombstone);
                if(res==OK){
                    creep.memory.creepState = builderState.searchConstruct;
                }else if(res==ERR_NOT_IN_RANGE){
                    creep.moveTo(tombstone);
                }
                Memory.config.toDropCount--;
                return;
            }
            const dropped_resource = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES,{
                filter:(i)=>i.resourceType==RESOURCE_ENERGY
                    && i.amount>25
            });
            if(!dropped_resource){
                creep.memory.creepState = builderState.searchContainer;
                Memory.config.toDropCount--;
                return;
            }
            if(roleConfig.isBuilderSay){
                creep.say("🔍" + dropped_resource.amount);
            }
            const res = creep.pickup(dropped_resource);
            if(res==OK){
                creep.memory.creepState = builderState.searchConstruct;
            }else if(res==ERR_NOT_IN_RANGE){
                creep.moveTo(dropped_resource);
            }
            Memory.config.toDropCount--;
        }else if(creep.memory.creepState == builderState.searchHealer){
            let structure = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (i) => i.structureType==STRUCTURE_ROAD
                    && i.hits < i.hitsMax * 9 / 10
            });
            if(structure){
                creep.say("healRoad");
                creep.memory.healerId = structure.id; 
                creep.memory.creepState = builderState.healStructure;
                return;
            }
            structure = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (i) => i.structureType==STRUCTURE_CONTAINER
                && i.hits < i.hitsMax
            });
            if(structure){
                creep.say("healContainer");
                creep.memory.healerId = structure.id; 
                creep.memory.creepState = builderState.healStructure;
                return;
            }
            structure = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (i) => i.structureType==STRUCTURE_ROAD
                    && i.hits < i.hitsMax
            });
            if(structure){
                creep.say("healRoad");
                creep.memory.healerId = structure.id; 
                creep.memory.creepState = builderState.healStructure;
                return;
            }
        }else{
            creep.memory.creepState = builderState.searchConstruct;
        }
	}
    kale(creep){
        // creep.memory.creepState = builderState.searchContainer;
    }
};

module.exports = RoleBuilder.getInstance();