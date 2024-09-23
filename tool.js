const roleConfig = require('roleConfig');

class Tool{
    constructor(){}
    static getInstance(){
        if(!Tool.instance){
            Tool.instance = new Tool();
        }
        return Tool.instance;
    }
    showPath(creep,goal){
        if(roleConfig.isShowPath){
            const paths = PathFinder.search(creep.pos, goal.pos,{
                // 我们需要把默认的移动成本设置的更高一点
                // 这样我们就可以在 roomCallback 里把道路移动成本设置的更低
                plainCost: 2,
                swampCost: 10,
                roomCallback: function(roomName) {
                    const room = Game.rooms[roomName];
                    // 但是由于 PathFinder 支持跨多房间检索
                    // 所以你要更加小心！
                    if (!room) return;
                    const costs = new PathFinder.CostMatrix;
                    room.find(FIND_STRUCTURES).forEach(function(struct) {
                        if (struct.structureType === STRUCTURE_ROAD) {
                            // 相对于平原，寻路时将更倾向于道路
                            costs.set(struct.pos.x, struct.pos.y, 1);
                        } else if (struct.structureType !== STRUCTURE_CONTAINER 
                            && (struct.structureType !== STRUCTURE_RAMPART 
                            || !struct.my)) {
                            // 不能穿过无法行走的建筑
                            costs.set(struct.pos.x, struct.pos.y, 0xff);
                        }
                    });
                    // 躲避房间中的 creep
                    room.find(FIND_CREEPS).forEach(function(creep) {
                        costs.set(creep.pos.x, creep.pos.y, 0xff);
                    });
                    return costs;
                },
            });
            creep.room.visual.line(creep.pos,paths.path[0],{color:creep.memory.pathColor})
            const len = paths.path.length;
            for(let i=0;i<len-1;i++){
                creep.room.visual.line(paths.path[i],paths.path[i+1],{color:creep.memory.pathColor});
            }
            creep.room.visual.circle(paths.path[-1],{fill:'red',radius:0.5});
        }
    }
    updateMemory(){
        const pre_copy = {};
        Object.assign(pre_copy,Memory.container.pre);
        // 提升效率
        const containers = Game.spawns["Spawn1"].room.find(FIND_STRUCTURES, {
            filter: { structureType: STRUCTURE_CONTAINER }
        });
        Memory.container.pre = {};
        containers.forEach(container=>{
            Memory.container.pre[container.id] = {};
            Memory.container.pre[container.id].creepsId = [];
            Memory.container.pre[container.id].reserve = 0;
            Memory.container.pre[container.id].preStore = 0;
        })
        Object.values(Game.creeps).forEach(creep=>{
            const containerId = creep.memory.containerId;
            if(Memory.container.pre[containerId] && creep.memory.creepState == 'toContainer'){
                Memory.container.pre[containerId].creepsId.push(creep.id);
                Memory.container.pre[containerId].reserve += creep.store.getFreeCapacity();
            }
        })
    }
    getComponentByLevel(component,componentToEnergy,isHarvester=false){
        const spawn = Game.spawns["Spawn1"];
        let level = spawn.room.controller.level;
        let totalEnergy = 0;
        if(isHarvester){
            totalEnergy = spawn.room.energyAvailable;
        }else{
            totalEnergy = spawn.room.energyCapacityAvailable;
        }
        level = Math.min(level,component.length);
        while(level){
            if(componentToEnergy[level-1]>totalEnergy){
                level--;
            }else{
                return component[level-1];
            }
        }
        return component[0];
    }
}

module.exports = Tool.getInstance();