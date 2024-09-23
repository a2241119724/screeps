const roleConfig = require('roleConfig');
const roleCommon = require('roleCommon');
const tool = require('tool');
const Role = require('Role');

const attackerState = {
    toNextRoom:"toNextRoom",
    searchRoom:"searchRoom",
    attack:"attack"
};

class RoleInvader extends Role {
    constructor(){
        super();
        this.direction = [[1,0],[0,1],[-1,0],[0,-1]];
    }
    static getInstance(){
        if(!RoleInvader.instance){
            RoleInvader.instance = new RoleInvader();
        }
        return RoleInvader.instance;
    }
    create(index){
        const name = "Attacker" + index;
        const spawn = Game.spawns["Spawn1"];
        const res = spawn.spawnCreep(tool.getComponentByLevel(roleConfig.workerComponent,roleConfig.attackerComponentToEnergy), name, {
            memory:{ role: "invader" }
        });
        roleCommon.create(res, name, index, attackerState.searchEnemy);
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
        
        if(creep.memory.creepState == attackerState.attack){
            const target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            if(target){
                if(creep.attack(target)==ERR_NOT_IN_RANGE){
                    creep.moveTo(target);
                }
            }else{
                creep.memory.creepState = attackerState.toNextRoom;
            }
        }if(creep.memory.creepState == attackerState.toNextRoom){
            creep.room.findExitTo(nextRoom)
        }if(creep.memory.creepState == attackerState.searchRoom){
            const currRoom = /W(\d+)N(\d+)/.exec(Game.spawns['Spawn1'].room.name);
            const x = parseInt(currRoom[1]);
            const y = parseInt(currRoom[2]);
            for(let i=0;i<4;i++){
                let nextRoom = "W"+(x+this.direction[i][0])+"N"+(y+this.direction[i][1]);
                if(!Game.map.isRoomAvailable(nextRoom)){
                    continue;
                }
                if(1){
                    creep.memory.creepState = attackerState.attack;
                    return;
                }
            }
        }else{
            creep.memory.creepState = attackerState.attack;
        }
	}
    kale(creep){
    }
};

module.exports = RoleInvader.getInstance();