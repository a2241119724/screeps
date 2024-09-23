let Role = require('Role');

class RoleCommon extends Role{
    constructor(){
        super();
    }
    create(res, name, index, state, sourceId=0){
        const creep = Game.creeps[name];
        if(res==ERR_NAME_EXISTS){
            // add new attr
            if(!creep.memory.creepState){
                creep.memory.creepState = state;
            }
            if(!creep.memory.sourceId){
                if(sourceId){
                    creep.memory.sourceId = sourceId;
                }else{
                    const sources = Game.spawns['Spawn1'].room.find(FIND_SOURCES);
                    creep.memory.sourceId = sources[index%sources.length].id;
                }
            }
            // 卡了
            if(!creep.memory.kale){
                creep.memory.kale = {};
                creep.memory.kale.kaleCount = 0;
                creep.memory.kale.posX = creep.pos.x;
                creep.memory.kale.posY = creep.pos.y;
                creep.memory.kale.currEnergy = 0;
            }
            if(!creep.memory.pathColor){
                creep.memory.pathColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
            }
            //
        }else if(res==OK){
            creep.memory.creepState = state;
            if(sourceId){
                creep.memory.sourceId = sourceId;
            }else{
                const sources = Game.spawns['Spawn1'].room.find(FIND_SOURCES);
                creep.memory.sourceId = sources[index%sources.length].id;
            }
            // 卡了
            creep.memory.kale = {};
            creep.memory.kale.kaleCount = 0;
            creep.memory.kale.posX = creep.pos.x;
            creep.memory.kale.posY = creep.pos.y;
            creep.memory.kale.currEnergy = 0;
            creep.memory.pathColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
            //
        }
    }
}

module.exports = new RoleCommon();