const roleHarvester = require('roleHarvester');
const roleUpgrader = require('roleUpgrader');
const roleBuilder = require('roleBuilder');
const controller = require('controller');
const roleWorker = require('roleWorker');
const roleCarryer = require('roleCarryer');
const roleConfig = require('roleConfig');
const roleAttacker = require('roleAttacker');
const roleRangedAttacker = require('roleRangedAttacker');
const structureTower = require('structureTower');
const tool = require('./tool');

const commonState = {
    getLife: "getLife"
}

class Main{
    constructor(){
        this.time = [0,0,0,0,0,0,0,0,0,0];
        this.loop = this.loop.bind(this);
        this.init();
    }
    static getInstance(){
        if(!Main.instance){
            Main.instance = new Main();
        }
        return Main.instance;
    }
    loop(){
        this._loop();
        this._loop();
    }
    _loop(){
        this.death();
        if(Game.spawns['Spawn1']){
            structureTower.run();
            let timeIndex = 0;
            Memory.config.toDropCount = 0;
            this.exeByFixTime(timeIndex++,5,controller.create);
            // this.exeByFixTime(timeIndex++,Object.keys(Game.creeps).length+1,controller.create);
            Object.entries(Game.creeps).forEach(([name,creep])=>{
                // 如果他卡了
                this.kale(creep,name);
                this.exeRunByFunctionName(creep,name);
                if(roleConfig.isSayName){
                    creep.say(name);
                }
                const time = Math.floor(creep.ticksToLive/150);
                if(!time){
                    if(roleConfig.isSayDeadTime){
                        creep.say("💔"+creep.ticksToLive);
                    }
                    // 不救超出数量的creep
                    if(creep.ticksToLive==120 && Memory.controller[creep.memory.role].count<=Memory.controller[creep.memory.role].maxCount){
                        console.log(creep.name+" is healed");
                        creep.memory.creepState = commonState.getLife;
                    }
                }else if(time==1){
                    if(roleConfig.isSayDeadTime){
                        creep.say("☠️我快死了");
                    }
                }else{
                    if(roleConfig.isSayDeadTime){
                        creep.say("🕛".repeat(time));
                    }
                }
                if(creep.memory.creepState == 'toDropResource') {
                    Memory.config.toDropCount++;
                }
            })
            this.exeByFixTime(timeIndex++,5,controller.buildRoad);
            this.exeByFixTime(timeIndex++,5,this.updateMemory);
            controller.statistic();
            this.exeByFixTime(timeIndex++,5,roleWorker.check_source_distribution);
        }else{
            console.log('No spawn available');
        }
    }
    exeRunByFunctionName(creep,name){
        if(creep.memory.creepState == commonState.getLife) {
            creep.say("getLife");
            const spawn = Game.spawns['Spawn1'];
            const res = spawn.renewCreep(creep);
            if(res == ERR_FULL || res == ERR_NOT_ENOUGH_ENERGY) {
                creep.memory.creepState = "";
            }else if(res == OK) {
                creep.say("🩷舒服了");
            }else if(res == ERR_NOT_IN_RANGE) {
                creep.moveTo(spawn);
            }
        }else{
            this.exeByFunctionName(creep,"run",name);
        }
    }
    // 根据名字执行函数
    exeByFunctionName(creep,funName,name){
        if(creep.memory.role == 'harvester') {
            roleHarvester[funName](creep);
        }else if(creep.memory.role == 'upgrader') {
            roleUpgrader[funName](creep);
        }else if(creep.memory.role == 'builder') {
            roleBuilder[funName](creep);
        }else if(creep.memory.role == 'worker') {
            roleWorker[funName](creep);
        }else if(creep.memory.role == 'carryer') {
            roleCarryer[funName](creep);
        }else if(creep.memory.role == 'attacker') {
            roleAttacker[funName](creep);
        }else if(creep.memory.role == 'rangedattacker') {
            roleRangedAttacker[funName](creep);
        }else{
            // 若内存被删除，重新赋值
            creep.memory.role = name.match(/^[a-zA-Z]+/)[0].toLowerCase();
        }
    }
    // 根据固定时间执行函数
    exeByFixTime(index,fixTime,fun,...args){
        this.time[index]++;
        if(this.time[index]>=fixTime){
            fun(...args);
            this.time[index] = 0;
        }
    }
    kale(creep,name){
        if(creep.memory.creepState == commonState.getLife) return;
        if(creep.store.getUsedCapacity()==creep.memory.kale.currEnergy && creep.memory.kale.posX==creep.pos.x && creep.memory.kale.posY==creep.pos.y){
            creep.memory.kale.kaleCount++;
            if(creep.memory.kale.kaleCount>=roleConfig.isKaleMaxCount){
                creep.say("kale");
                creep.moveTo(Game.flags["Kale"]); // 实际上是仅移动一格
                this.exeByFunctionName(creep,"kale",name);
                creep.memory.kale.kaleCount = 0;
            }
        }else{
            creep.memory.kale.kaleCount = 0;
            creep.memory.kale.posX = creep.pos.x;
            creep.memory.kale.posY = creep.pos.y;
            creep.memory.kale.currEnergy = creep.store.getUsedCapacity();
        }
    }
    updateMemory(){
        const spawn = Game.spawns['Spawn1'];
        const containerNum = spawn.room.find(FIND_STRUCTURES, {
            filter: { structureType: STRUCTURE_CONTAINER }
        }).length;
        Memory.controller.worker.maxCount = Math.min(containerNum * 2,roleConfig.workerMaxCount);
        Memory.controller.carryer.maxCount = Math.min(Math.max(Memory.controller.worker.count,1),spawn.room.find(FIND_SOURCES).length)*2;
        if(Memory.controller.carryer.count){
            // 设计为0时，创建逻辑有问题
            Memory.controller.harvester.maxCount = 1;
        }else{
            Memory.controller.harvester.maxCount = 4 - Memory.controller.worker.count;
        }
        if(Memory.controller.worker.count<Memory.controller.worker.maxCount){
            Memory.controller.builder.maxCount = 1;
            Memory.controller.attacker.maxCount = 0;
            Memory.controller.rangedattacker.maxCount = 0;
        }else{
            Memory.controller.builder.maxCount = roleConfig.builderMaxCount;
            const energy = spawn.room.storage.store.getUsedCapacity(RESOURCE_ENERGY);
            if(energy>10000){
                Memory.controller.upgrader.maxCount = Math.floor(Memory.controller.worker.count * 3 / 2);
            }else{
                Memory.controller.upgrader.maxCount = Memory.controller.worker.count;
            }
            if(energy>100000){
                Memory.controller.attacker.maxCount = roleConfig.attackerMaxCount * 2;
                Memory.controller.rangedattacker.maxCount = roleConfig.rangedAttackerMaxCount * 2;
            }else{
                Memory.controller.attacker.maxCount = roleConfig.attackerMaxCount;
                Memory.controller.rangedattacker.maxCount = roleConfig.rangedAttackerMaxCount;
            }
        }
        tool.updateMemory();
    }
    death(){
        const tombstones = Game.spawns['Spawn1'].room.find(FIND_TOMBSTONES,{
            filter: (tombstone) => Game.time-tombstone.deathTime==1 
                && tombstone.creep.my
        });
        tombstones.forEach(tombstone=>{
            const creep = tombstone.creep;
            if(roleConfig.isPrintLog){
                console.log(creep.name+' is dead');
            }
            if(Memory.controller[creep.memory.role]){
                Memory.controller[creep.memory.role].count--;
                if(creep.memory.role=='worker'){
                    Memory.controller.worker.workerNumBySource[creep.memory.sourceId]++;
                }
                // 死亡时，移除内存
                delete Memory.creeps[creep.name];
                controller.create();
                // 
                this.updateMemory();
            }
        })
    }
    init(){
        const _moveTo = Creep.prototype.moveTo;
        Creep.prototype.moveTo = function(target, opts){
            _moveTo.call(this,target,opts);
            tool.showPath(this,target);
        }
    }
}

module.exports.loop = Main.getInstance().loop;