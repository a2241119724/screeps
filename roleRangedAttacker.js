const roleConfig = require('roleConfig');
const roleCommon = require('roleCommon');
const tool = require('tool');
const Role = require('Role');

const rangedAttackerState = {
    wander:"wander",
    attack:"attack"
};

class RoleRangedAttacker extends Role {
    constructor(){
        super();
    }
    static getInstance(){
        if(!RoleRangedAttacker.instance){
            RoleRangedAttacker.instance = new RoleRangedAttacker();
        }
        return RoleRangedAttacker.instance;
    }
    create(index){
        const name = "RangedAttacker" + index;
        const spawn = Game.spawns["Spawn1"];
        const res = spawn.spawnCreep(tool.getComponentByLevel(roleConfig.rangedAttackerComponent,roleConfig.rangedAttackerComponentToEnergy), name, {
            memory:{ role: "rangedattacker" }
        });
        roleCommon.create(res, name, index, rangedAttackerState.wander);
        const creep = Game.creeps[name];
        if(res==ERR_NAME_EXISTS){
            // add new attr
            if(!creep.memory.wanderFlag){
                creep.memory.wanderFlag = 0;
            }
        }else if(res==OK){
            if(roleConfig.isPrintLog){
                console.log(name + " is created");
            }
            creep.memory.wanderFlag = 0;
            return 1;
        }
        return 0;
    }
    run(creep) {
        if(roleConfig.isAttackerSay){
            creep.say(creep.memory.creepState);
        }
        
        if(creep.memory.creepState == rangedAttackerState.wander){
            const target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            if(target){
                creep.memory.creepState = rangedAttackerState.attack;
                return;
            }
            const flags = creep.room.find(FIND_FLAGS, {
                filter: (flag) => flag.name.indexOf("wander")>=0
            });
            const flag = flags[creep.memory.wanderFlag];
            if(creep.pos.isNearTo(flag)){
                creep.memory.wanderFlag = (creep.memory.wanderFlag+1)%flags.length;
            }else{
                creep.moveTo(flag);
            }
        }else if(creep.memory.creepState == rangedAttackerState.attack){
            const target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            if(target){
                if(creep.rangedAttack(target)==ERR_NOT_IN_RANGE){
                    creep.moveTo(target);
                }
            }else{
                creep.memory.creepState = rangedAttackerState.wander;
            }
        }else{
            creep.memory.creepState = rangedAttackerState.wander;
        }
	}
    kale(creep){
    }
};

module.exports = RoleRangedAttacker.getInstance();