const roleConfig = require('roleConfig');
const roleCommon = require('roleCommon');
const tool = require('tool');
const Role = require('Role');

const workerState = {
    toSource:"toSource",
    toContainer:"toContainer",
    collectSource:"collectSource",
    toSpawn:"toSpawn",
    toExtension:"toExtension",
    toStorage:"toStorage",
    toLink:"toLink"
};
const freeCapacity = [workerState.toSource,workerState.collectSource];

class RoleWorker extends Role{
    constructor(){
        super();
        this.check_source_distribution = this.check_source_distribution.bind(this);
    }
    static getInstance(){
        if(!RoleWorker.instance){
            RoleWorker.instance = new RoleWorker();
        }
        return RoleWorker.instance;
    }
    create(index, sourceId){
        const name = "Worker" + index;
        const spawn = Game.spawns["Spawn1"];
        const res = spawn.spawnCreep(tool.getComponentByLevel(roleConfig.workerComponent,roleConfig.workerComponentToEnergy), name, {
            memory:{ role: "worker" }
        });
        roleCommon.create(res, name, index, workerState.toSource, sourceId);
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
        if(roleConfig.isWorkerSay){
            creep.say(creep.memory.creepState);
        }

        if(freeCapacity.includes(creep.memory.creepState)){
            // 找资源且自身满了
            if(creep.store.getFreeCapacity()==0){
                if(Math.random()<0.5){
                    creep.memory.creepState = workerState.toContainer;
                }else{
                    creep.memory.creepState = workerState.toLink;
                }
            }
        }else{
            if(creep.store.getUsedCapacity()==0){
                creep.memory.creepState = workerState.toSource;
            }
        }
        if(creep.memory.creepState == workerState.toSource){
            const source = Game.getObjectById(creep.memory.sourceId);
            const res = creep.harvest(source);
            if(res==OK){
                creep.memory.creepState = workerState.collectSource;
            }else if(res==ERR_NOT_IN_RANGE || res==ERR_NOT_ENOUGH_RESOURCES){
                creep.moveTo(source);
            }
        }else if(creep.memory.creepState == workerState.toContainer){
            const container = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (i)=>i.structureType==STRUCTURE_CONTAINER
                    && i.store.getFreeCapacity(RESOURCE_ENERGY)>0
            });
            if(!container){
                if(creep.store.getUsedCapacity()==0){
                    creep.memory.creepState = workerState.toSource;
                }else{
                    creep.memory.creepState = workerState.toExtension;
                }
                return;
            }
            // toSpawn
            if(creep.pos.getRangeTo(Game.spawns["Spawn1"])<creep.pos.getRangeTo(container)){
                creep.memory.creepState = workerState.toExtension;
                return;
            }
            const res = creep.transfer(container,RESOURCE_ENERGY);
            if(res==ERR_FULL){
                creep.memory.creepState = workerState.toExtension;
            }else if(res==ERR_NOT_ENOUGH_RESOURCES){
                creep.memory.creepState = workerState.toSource;
            }else if(res==ERR_NOT_IN_RANGE){
                creep.moveTo(container);
            }
        }else if(creep.memory.creepState == workerState.collectSource){
            const dropped_resource = creep.pos.lookFor(LOOK_RESOURCES)
            if(dropped_resource.length){
                if(roleConfig.isWorkerSay){
                    creep.say("🔍" + dropped_resource[0].amount);
                }
                creep.pickup(dropped_resource[0]);
            }
            const source = Game.getObjectById(creep.memory.sourceId);
            const res = creep.harvest(source);
            if(res==ERR_NOT_IN_RANGE || res==ERR_NOT_ENOUGH_RESOURCES){
                creep.memory.creepState = workerState.toSource;
            }
            if(res==ERR_FULL){
                if(Math.random()<0.5){
                    creep.memory.creepState = workerState.toContainer;
                }else{
                    creep.memory.creepState = workerState.toLink;
                }
            }
        }else if(creep.memory.creepState == workerState.toSpawn){
            const spawn = Game.spawns["Spawn1"];
            if(spawn.store.getFreeCapacity(RESOURCE_ENERGY)==0){
                creep.memory.creepState = workerState.toStorage;
                return;
            }
            const res = creep.transfer(spawn,RESOURCE_ENERGY);
            if(res==ERR_NOT_ENOUGH_RESOURCES){
                creep.memory.creepState = workerState.toSource;
            }else if(res==ERR_FULL){
                creep.memory.creepState = workerState.toStorage;
            }else if(res==ERR_NOT_IN_RANGE){
                creep.moveTo(spawn);
            }
        }else if(creep.memory.creepState == workerState.toExtension){
            const extension = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                filter: (i)=>i.structureType==STRUCTURE_EXTENSION 
                    && i.store.getFreeCapacity(RESOURCE_ENERGY)>0
            });
            if(!extension){
                creep.memory.creepState = workerState.toSpawn;
                return;
            }
            const res = creep.transfer(extension,RESOURCE_ENERGY);
            if(res==ERR_NOT_ENOUGH_RESOURCES){
                creep.memory.creepState = workerState.toSource;
            }else if(res==ERR_FULL){
                creep.memory.creepState = workerState.toSpawn;
            }else if(res==ERR_NOT_IN_RANGE){
                creep.moveTo(extension);
            }
        }else if(creep.memory.creepState == workerState.toStorage){
            const storage = creep.room.storage;
            if(!storage){
                creep.memory.creepState = workerState.toContainer;
                return;
            }
            const res = creep.transfer(storage,RESOURCE_ENERGY)
            if(res==ERR_NOT_ENOUGH_RESOURCES){
                creep.memory.creepState = workerState.toSource;
            }else if(res==ERR_NOT_IN_RANGE){
                creep.moveTo(storage);
            }
        }else if(creep.memory.creepState == workerState.toLink){
            const linkFrom = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                filter: (i)=>i.structureType==STRUCTURE_LINK
                    && creep.pos.inRangeTo(i,4)
                    && !i.cooldown
            });
            if(!linkFrom){
                creep.memory.creepState = workerState.toContainer;
                return;
            }
            const res = creep.transfer(linkFrom,RESOURCE_ENERGY);
            if(res==OK || res==ERR_NOT_ENOUGH_RESOURCES){
                const linkTo = creep.room.controller.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                    filter: (i)=>i.structureType==STRUCTURE_LINK && i.id!=linkFrom.id
                });
                if(linkTo){
                    linkFrom.transferEnergy(linkTo);
                }
                creep.memory.creepState = workerState.toSource;
            }else if(res==ERR_NOT_IN_RANGE){
                creep.moveTo(linkFrom);
            }else if(res==ERR_FULL){
                const linkTo = creep.room.controller.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                    filter: (i)=>i.structureType==STRUCTURE_LINK && i.id!=linkFrom.id
                });
                if(linkTo){
                    linkFrom.transferEnergy(linkTo);
                }
                creep.memory.creepState = workerState.toContainer;
            }
        }else{
            creep.memory.creepState = workerState.toSource;
        }
	}
    kale(creep){
        // creep.memory.creepState = workerState.toSource;
    }
    init(){
        const spawn = Game.spawns["Spawn1"];
        const sources = spawn.room.find(FIND_SOURCES);
        const workerNumBySource = {};
        const terrain = spawn.room.getTerrain()
        sources.forEach(source => {
            workerNumBySource[source.id] = 0;
            workerNumBySource[source.id] += terrain.get(source.pos.x-1,source.pos.y-1)!=TERRAIN_MASK_WALL;
            workerNumBySource[source.id] += terrain.get(source.pos.x-1,source.pos.y)!=TERRAIN_MASK_WALL;
            workerNumBySource[source.id] += terrain.get(source.pos.x-1,source.pos.y+1)!=TERRAIN_MASK_WALL;
            workerNumBySource[source.id] += terrain.get(source.pos.x,source.pos.y-1)!=TERRAIN_MASK_WALL;
            workerNumBySource[source.id] += terrain.get(source.pos.x,source.pos.y+1)!=TERRAIN_MASK_WALL;
            workerNumBySource[source.id] += terrain.get(source.pos.x+1,source.pos.y-1)!=TERRAIN_MASK_WALL;
            workerNumBySource[source.id] += terrain.get(source.pos.x+1,source.pos.y)!=TERRAIN_MASK_WALL;
            workerNumBySource[source.id] += terrain.get(source.pos.x+1,source.pos.y+1)!=TERRAIN_MASK_WALL;
        });
        // this.workerNumBySource = workerNumBySource.concat(); // []深拷贝
        this.workerNumBySource = {};
        Object.assign(this.workerNumBySource,workerNumBySource) // {}深拷贝
        return workerNumBySource;
    }
    check_source_distribution(){
        const workerNumBySource = {};
        Object.assign(workerNumBySource,this.workerNumBySource) // {}深拷贝
        //
        const spawn = Game.spawns["Spawn1"];
        const containers = spawn.room.find(FIND_STRUCTURES, {
            filter: { structureType: STRUCTURE_CONTAINER }
        });
        const source2container = {};
        containers.forEach((container)=>{
            let source = container.pos.findClosestByRange(FIND_SOURCES);
            source2container[source.id]++;
        })
        //
        const workers = spawn.room.find(FIND_MY_CREEPS, {
            filter: (creep) => creep.memory.role == "worker"
        });
        const sources = spawn.room.find(FIND_SOURCES);
        workers.forEach((worker)=>{
            workerNumBySource[worker.memory.sourceId]--;
            // 若该资源旁边没有位置重新分配
            if(workerNumBySource[worker.memory.sourceId] < 0){
                console.log("worker 资源分配 error!!!");
                workerNumBySource[worker.memory.sourceId]++;
                // 若已经满，分配给其他source
                const len = sources.length;
                for(let j=0;j<len;j++){
                    if(workerNumBySource[sources[j].id]>0){
                        worker.memory.sourceId = sources[j].id;
                        workerNumBySource[sources[j].id]--;
                        break;
                    }
                }
            }
            // 若资源旁边没有container，重新分配
            if(!source2container[worker.memory.sourceId]){
                // 优先分配给有container的source
                const len = sources.length;
                for(let j=0;j<len;j++){
                    if(source2container[sources[j].id]>0 && workerNumBySource[sources[j].id]>0){
                        worker.memory.sourceId = sources[j].id;
                        workerNumBySource[sources[j].id]--;
                        break;
                    }
                }
            }
        });
        Memory.controller.worker.workerNumBySource = workerNumBySource;
    }
};

module.exports = RoleWorker.getInstance();