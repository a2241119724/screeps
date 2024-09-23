const roleConfig = require('roleConfig');
const roleCommon = require('roleCommon');
const tool = require('tool');
const Role = require('Role');

const attackerState = {
    wander:"wander",
    attack:"attack"
};

class RoleAttacker extends Role {
    constructor(){
        super();
    }
    static getInstance(){
        if(!RoleAttacker.instance){
            RoleAttacker.instance = new RoleAttacker();
        }
        return RoleAttacker.instance;
    }
    create(index){
        const name = "Attacker" + index;
        const spawn = Game.spawns["Spawn1"];
        const res = spawn.spawnCreep(tool.getComponentByLevel(roleConfig.workerComponent,roleConfig.attackerComponentToEnergy), name, {
            memory:{ role: "attacker" }
        });
        roleCommon.create(res, name, index, attackerState.wander);
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
        
        if(creep.memory.creepState == attackerState.wander){
            const target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            if(target){
                creep.memory.creepState = attackerState.attack;
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
        }else if(creep.memory.creepState == attackerState.attack){
            const target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            if(target){
                if(creep.attack(target)==ERR_NOT_IN_RANGE){
                    creep.moveTo(target);
                }
            }else{
                creep.memory.creepState = attackerState.wander;
            }
        }else{
            creep.memory.creepState = attackerState.wander;
        }
	}
    kale(creep){
    }
};

module.exports = RoleAttacker.getInstance();