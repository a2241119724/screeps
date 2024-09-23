const roleHarvester = require('roleHarvester')
const roleUpgrader = require('roleUpgrader');
const roleBuilder = require('roleBuilder');
const roleWorker = require('roleWorker');
const roleCarryer = require('roleCarryer');
const roleAttacker = require('roleAttacker');
const Role = require('Role');
const roleConfig = require('roleConfig');
const roleRangedAttacker = require('roleRangedAttacker');
const tool = require('./tool');

class RoleCount{
    constructor(maxCount, count, index){
        this.maxCount = maxCount; // 活跃的最大数量
        this.count = count; // 记录包括死亡的所有数量
        this.index = index; // 用于轮流创建
    }
}

class Controller extends Role{
    constructor(){
        super();
        this.init();
        this.directArr=[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]
        const spawn = Game.spawns["Spawn1"];
        const sources = spawn.room.find(FIND_SOURCES);
        const len = sources.length;
        this.source2container = {};
        this.containers_pos = [];
        for(let i=0;i<len;i++){
            this.containers_pos[i] = this.findPosOfContainer(sources[i]);
        }
        // 将类当作普通函数时，this指向undefined，所以需要绑定this
        this.create = this.create.bind(this);
        this.buildRoad = this.buildRoad.bind(this);
        this.statistic = this.statistic.bind(this);
    }
    static getInstance(){
        if(!Controller.instance){
            Controller.instance = new Controller();
        }
        return Controller.instance;
    }
    create(){
        // controller.print();
        const spawn = Game.spawns["Spawn1"];
        const level = spawn.room.controller.level;
        const sources = spawn.room.find(FIND_SOURCES);
        const harvester = Memory.controller.harvester;
        if(harvester.maxCount && harvester.count<harvester.maxCount){
            harvester.count = harvester.count + roleHarvester.create(harvester.index);
            harvester.index = (++harvester.index) % harvester.maxCount;
        }
        if(harvester.count && harvester.maxCount){
            const len = sources.length;
            this.containers_pos.forEach((container_pos)=>{
                spawn.room.createConstructionSite(container_pos.x, container_pos.y, STRUCTURE_CONTAINER);
            })
            const builder = Memory.controller.builder;
            if(builder.maxCount && builder.count < builder.maxCount){
                builder.count = builder.count + roleBuilder.create(builder.index);
                builder.index = (++builder.index) % builder.maxCount;
            }
            const upgrader = Memory.controller.upgrader;
            if(upgrader.maxCount && upgrader.count < upgrader.maxCount){
                upgrader.count = upgrader.count + roleUpgrader.create(upgrader.index);
                upgrader.index = (++upgrader.index) % upgrader.maxCount;
            }
            const carryer = Memory.controller.carryer;
            if(carryer.maxCount && carryer.count < carryer.maxCount){
                carryer.count = carryer.count + roleCarryer.create(carryer.index);
                carryer.index = (++carryer.index) % carryer.maxCount;
            }
            const worker = Memory.controller.worker;
            if (worker.maxCount && worker.count < worker.maxCount) {
                // 根据source所能分配的worker数量来分配
                let flag = false;
                for(let i=0;i<len;i++){
                    if(Memory.controller.worker.workerNumBySource[sources[i].id]>0){
                        const res = roleWorker.create(worker.index, sources[i].id);
                        worker.count = worker.count + res;
                        worker.index = (++worker.index) % worker.maxCount;
                        if(res){
                            Memory.controller.worker.workerNumBySource[sources[i].id]--;
                        }
                        flag = true;
                        break;
                    }
                }
                if(!flag){
                    roleWorker.create(worker.index)
                    worker.index = (++worker.index) % worker.maxCount;
                }
            }
        }
        if(level>=3){
            const attacker = Memory.controller.attacker;
            if(attacker.maxCount && attacker.count<attacker.maxCount){
                const res = roleAttacker.create(attacker.index);
                attacker.count = attacker.count + res;
                attacker.index = (++attacker.index) % attacker.maxCount;
            }
            const rangedAttacker = Memory.controller.rangedattacker;
            if(rangedAttacker.maxCount && rangedAttacker.count<rangedAttacker.maxCount){
                const res = roleRangedAttacker.create(rangedAttacker.index);
                rangedAttacker.count = rangedAttacker.count + res;
                rangedAttacker.index = (++rangedAttacker.index) % rangedAttacker.maxCount;
            }
        }
    }
    buildRoad(){
        const spawn = Game.spawns["Spawn1"];
        if(this.roadMaxCount){
            let roadCount = spawn.room.find(FIND_MY_STRUCTURES, {
                filter: { structureType: STRUCTURE_ROAD }
            }).length + spawn.room.find(FIND_CONSTRUCTION_SITES, {
                filter: { structureType: STRUCTURE_ROAD }
            }).length;
            if(roadCount>=this.roadMaxCount){
                return;
            }
        }
        // 根据现有需要建设的建筑数量设置Builder的最大数量
        let _builderMaxCount = roleConfig.builderMaxCount;
        if(!spawn.pos.findClosestByRange(FIND_CONSTRUCTION_SITES)){
            if(!spawn.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (structure) => structure.structureType==STRUCTURE_ROAD 
                    && structure.hits < structure.hitsMax
                })){
                _builderMaxCount = 0;
            }
        }
        Memory.controller.builder.maxCount = _builderMaxCount;
        //
        spawn.room.find(FIND_SOURCES).forEach((source)=>{
            const paths = PathFinder.search(source.pos,spawn.pos)
            paths.path.forEach(path=>{
                spawn.room.createConstructionSite(path.x, path.y, STRUCTURE_ROAD);
            })
        })
        // 给spawn上下左右加ROAD
        if(this.isBuild(spawn.pos.x+1,spawn.pos.y)){
            spawn.room.createConstructionSite(spawn.pos.x+1, spawn.pos.y, STRUCTURE_ROAD);
        }
        if(this.isBuild(spawn.pos.x-1,spawn.pos.y)){
            spawn.room.createConstructionSite(spawn.pos.x-1, spawn.pos.y, STRUCTURE_ROAD);
        }
        if(this.isBuild(spawn.pos.x,spawn.pos.y+1)){
            spawn.room.createConstructionSite(spawn.pos.x, spawn.pos.y+1, STRUCTURE_ROAD);
        }
        if(this.isBuild(spawn.pos.x,spawn.pos.y-1)){
            spawn.room.createConstructionSite(spawn.pos.x, spawn.pos.y-1, STRUCTURE_ROAD);
        }
        // 给extensions上下左右加ROAD
        spawn.room.find(FIND_MY_STRUCTURES, {
            filter: { structureType: STRUCTURE_EXTENSION }
        }).forEach((extension)=>{
            if(this.isBuild(extension.pos.x+1,extension.pos.y)){
                spawn.room.createConstructionSite(extension.pos.x+1, extension.pos.y, STRUCTURE_ROAD);
            }
            if(this.isBuild(extension.pos.x-1,extension.pos.y)){
                spawn.room.createConstructionSite(extension.pos.x-1, extension.pos.y, STRUCTURE_ROAD);
            }
            if(this.isBuild(extension.pos.x,extension.pos.y+1)){
                spawn.room.createConstructionSite(extension.pos.x, extension.pos.y+1, STRUCTURE_ROAD);
            }
            if(this.isBuild(extension.pos.x,extension.pos.y-1)){
                spawn.room.createConstructionSite(extension.pos.x, extension.pos.y-1, STRUCTURE_ROAD);
            }
        });
        if(!this.roadMaxCount){
            this.roadMaxCount = spawn.room.find(FIND_MY_STRUCTURES, {
                filter: { structureType: STRUCTURE_ROAD }
            }).length + spawn.room.find(FIND_CONSTRUCTION_SITES, {
                filter: { structureType: STRUCTURE_ROAD }
            }).length;
        }
    }
    isBuild(x,y){
        let objs = Game.spawns["Spawn1"].room.lookAt(x, y);
        let len = objs.length;
        for(let i=0;i<len;i++){
            if(objs[i].type=="structure" || objs[i].type=="constructionSite"||
                (objs[i].type=="terrain" && objs[i].terrain=="swamp")){
                return false;
            }
        }
        return true;
    }
    print(){
        const harvester = Memory.controller.harvester;
        console.log("Harvester:"+harvester.count+"/"+harvester.maxCount);
        const upgrader = Memory.controller.upgrader;
        console.log("Upgrader:"+upgrader.count+"/"+upgrader.maxCount);
        const builder = Memory.controller.builder;
        console.log("Builder:"+builder.count+"/"+builder.maxCount);
        const worker = Memory.controller.worker;
        console.log("Worker:"+worker.count+"/"+worker.maxCount);
        const carryer = Memory.controller.carryer;
        console.log("Carryer:"+carryer.count+"/"+carryer.maxCount);
        const container = Memory.container;
        console.log("Container:"+container.count+"/"+container.maxCount);
    }
    findPosOfContainer(source){
        if(this.source2container[source.id]){
            return this.source2container[source.id];
        }
        const len = this.directArr.length;
        const terrain = Game.spawns["Spawn1"].room.getTerrain();
        let offset = 1;
        while(true){
            for(let i=0;i<len;i++){
                let isFind = true;
                let x = source.pos.x + this.directArr[i][0];
                let y = source.pos.y + this.directArr[i][1];
                const res = terrain.get(x,y);
                if(res!=TERRAIN_MASK_WALL){
                    x = x + this.directArr[i][0] * offset;
                    y = y + this.directArr[i][1] * offset;
                    for(let j=0;j<len;j++){
                        const xx = x + this.directArr[j][0];
                        const yy = y + this.directArr[j][1];
                        if(terrain.get(xx,yy)==TERRAIN_MASK_WALL){
                            isFind = false;
                            break;
                        }
                    }
                }else{
                    isFind = false; 
                }
                if(isFind){
                    this.source2container[source.id] = {x:x,y:y}
                    return {x:x,y:y};
                }
            }
            offset++;
        }
    }
    init(){
        const spawn = Game.spawns["Spawn1"];
        let _builderMaxCount = roleConfig.builderMaxCount;
        const sources_len = spawn.room.find(FIND_SOURCES).length;

        Memory.controller = {};
        Memory.controller.harvester = new RoleCount(roleConfig.harvesterMaxCount,0,0);
        Memory.controller.upgrader = new RoleCount(roleConfig.upgraderMaxCount,0,0);
        if(!spawn.room.find(FIND_CONSTRUCTION_SITES).length){
            _builderMaxCount = 0;
        }
        Memory.controller.builder = new RoleCount(_builderMaxCount,0,0);
        const containerNum = spawn.room.find(FIND_STRUCTURES, {
            filter: { structureType: STRUCTURE_CONTAINER }
        }).length;
        Memory.controller.worker = new RoleCount(Math.min(containerNum * 2,roleConfig.workerMaxCount),0,0);
        Memory.controller.carryer = new RoleCount(roleConfig.carryerMaxCount,0,0);
        Memory.controller.attacker = new RoleCount(roleConfig.attackerMaxCount,0,0);
        Memory.controller.rangedattacker = new RoleCount(roleConfig.attackerMaxCount,0,0);
        Memory.config.toDropCount = 0;
        const workerNumBySource = roleWorker.init();
        Object.entries(Game.creeps).forEach(([name,creep])=>{
            if(!Memory.controller[creep.memory.role]){
                creep.memory.role = name.match(/^[a-zA-Z]+/)[0].toLowerCase();
            }
            Memory.controller[creep.memory.role].count++;
            if(creep.memory.role=='worker'){
                workerNumBySource[creep.memory.sourceId]--;
            }
            if(creep.memory.creepState == "toDropResource"){
                Memory.config.toDropCount++;
            }
        })
        Memory.controller.upgrader.maxCount = Memory.controller.worker.count*2;
        Memory.controller.carryer.maxCount = Math.min(Memory.controller.worker.count,sources_len);
        //
        Memory.controller.worker.workerNumBySource = workerNumBySource;
        //
        if(!Memory.container){
            Memory.container = new RoleCount(sources_len,0,0);
        }
        Memory.container.count = spawn.room.find(FIND_STRUCTURES, {
            filter: (i) => i.structureType == STRUCTURE_CONTAINER
        }).length;
        Memory.container.index = Memory.container.count % Memory.container.maxCount;
        // 统计
        this.statistic_spawn = spawn;
        this.statistic_extensions = spawn.room.find(FIND_MY_STRUCTURES, {
            filter: { structureType: STRUCTURE_EXTENSION }
        });
        if(!Memory.statistic){
            Memory.statistic = {};
            if(!Memory.statistic.energy){
                Memory.statistic.energy = 0;
            }
            if(!Memory.statistic.energy_time){
                Memory.statistic.energy_time = 0;
            }
        }
        tool.updateMemory();
    }
    statistic(){
        const spawn = Game.spawns["Spawn1"];
        const extensions = spawn.room.find(FIND_MY_STRUCTURES, {
            filter: { structureType: STRUCTURE_EXTENSION }
        });
        
        let energyNum = spawn.store[RESOURCE_ENERGY]-this.statistic_spawn.store[RESOURCE_ENERGY];
        if(energyNum>0){
            Memory.statistic.energy = Memory.statistic.energy + energyNum;
        }
        if(energyNum!=0){
            this.statistic_spawn = spawn;
        }
        const len = extensions.length;
        for(let i=0;i<len;i++){
            if(!this.statistic_extensions[i]){
                this.statistic_extensions[i] = extensions[i];
            }
            energyNum = extensions[i].store[RESOURCE_ENERGY]-this.statistic_extensions[i].store[RESOURCE_ENERGY];
            if(energyNum>0){
                Memory.statistic.energy = Memory.statistic.energy + energyNum;
            }
            if(energyNum!=0){
                this.statistic_extensions[i] = extensions[i];
            }
        }
        Memory.statistic.energy_time++;
        if(Memory.statistic.energy_time%10==0 && roleConfig.isStatistic){
            console.log("energy/time:"+Memory.statistic.energy/Memory.statistic.energy_time);
        }
        if(Memory.statistic.energy_time==1000){
            Memory.statistic.energy = 0;
            Memory.statistic.energy_time = 0;
        }
    }
}

module.exports = Controller.getInstance();