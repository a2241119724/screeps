let roleConfig = {
    isPrintLog: true,
    isStatistic: false,
    isShowPath: false,
    isKaleMaxCount: 10,
    toDropMaxCount: 2,
    //
    isSay: true,
    isHarvesterSay: false,
    isBuilderSay: false,
    isUpgraderSay: false,
    isCarryerSay: false,
    isWorkerSay: false,
    isAttackerSay: false,
    isSayName: false,
    isSayDeadTime: false,
    //
    builderMaxCount: 4,
    carryerMaxCount: -1,
    upgraderMaxCount: -1,
    harvesterMaxCount: -1,
    workerMaxCount: 3,
    attackerMaxCount:1,
    rangedAttackerMaxCount:1,
    // 1:300,2:550
    builderComponent: [
        [WORK,WORK,CARRY,MOVE], // 300
        [WORK,WORK,CARRY,CARRY,MOVE,MOVE], // 400
        [WORK,WORK,WORK,CARRY,CARRY,CARRY,MOVE,MOVE], // 550 1格/3tik
        [WORK,WORK,WORK,CARRY,CARRY,CARRY,MOVE,MOVE], // 550
        [WORK,WORK,WORK,CARRY,CARRY,CARRY,MOVE,MOVE], // 550
        [WORK,WORK,WORK,CARRY,CARRY,CARRY,MOVE,MOVE], // 550
        [WORK,WORK,WORK,CARRY,CARRY,CARRY,MOVE,MOVE], // 550
        [WORK,WORK,WORK,CARRY,CARRY,CARRY,MOVE,MOVE], // 550
    ], 
    carryerComponent: [
        [CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE], // 450 1格/2tik
        [CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE], // 450
        [CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE], // 450
        [CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE], // 450
        [CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE], // 450
        [CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE], // 450
        [CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE], // 450
    ],
    workerComponent: [
        [WORK,WORK,CARRY,MOVE], // 300
        [WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE], // 550
        [WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,MOVE], // 600
        [WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE], // 800 1格/4tik
        [WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE], // 800
        [WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE], // 800
        [WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE], // 800
        [WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE], // 800
        [WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE], // 800
    ],
    harvesterComponent: [
        [WORK,WORK,CARRY,MOVE], // 300
        [WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE], // 700 1格/3tik
        [WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE], // 700
        [WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE], // 700
        [WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE], // 700
        [WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE], // 700
        [WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE], // 700
        [WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE], // 700
    ],
    upgraderComponent: [
        [WORK,WORK,CARRY,MOVE], // 300
        [WORK,WORK,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE], // 550 1格/2tik
        [WORK,WORK,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE], // 550
        [WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE], // 750 1格/2tik
        [WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE], // 750 1格/2tik
        [WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE], // 750 1格/2tik
        [WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE], // 750 1格/2tik
        [WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE], // 750 1格/2tik
        [WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE], // 750 1格/2tik
        [WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE], // 750 1格/2tik
    ],
    attackerComponent: [
        [TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,ATTACK,ATTACK,MOVE,MOVE], // 310  1格/1tik
        [TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,ATTACK,ATTACK,MOVE,MOVE], // 310  1格/1tik
        [TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,
            ,MOVE,MOVE,MOVE,MOVE,
            ATTACK,ATTACK], // 460  1格/0.5tik
        [TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,
            TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,
            MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,
            ATTACK,ATTACK], // 640 1格/0.33tik
        [TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,
            TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,
            MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,
            ATTACK,ATTACK], // 640 1格/0.33tik
        [TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,
            TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,
            MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,
            ATTACK,ATTACK], // 640 1格/0.33tik
        [TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,
            TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,
            MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,
            ATTACK,ATTACK], // 640 1格/0.33tik
    ],
    rangedAttackerComponent: [
        [TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,
            MOVE,MOVE,
            RANGED_ATTACK,RANGED_ATTACK], // 500 1格/1tik
        [TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,
            MOVE,MOVE,
            RANGED_ATTACK,RANGED_ATTACK], // 500
        [TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,
            MOVE,MOVE,
            RANGED_ATTACK,RANGED_ATTACK], // 500
        [TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,
            TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,
            MOVE,MOVE,MOVE,MOVE,
            RANGED_ATTACK,RANGED_ATTACK], // 700 1格/0.5tik
        [TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,
            TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,
            MOVE,MOVE,MOVE,MOVE,
            RANGED_ATTACK,RANGED_ATTACK], // 700
        [TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,
            TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,
            MOVE,MOVE,MOVE,MOVE,
            RANGED_ATTACK,RANGED_ATTACK], // 700
        [TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,
            TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,
            MOVE,MOVE,MOVE,MOVE,
            RANGED_ATTACK,RANGED_ATTACK], // 700
    ],
};

function _builderMaxCountComponentToEnergy(componentToEnergy, component){
    roleConfig[componentToEnergy] = [];
    const len = roleConfig[component].length;
    for(let i=0;i<len;i++){
        let energy = 0;
        roleConfig[component][i].forEach(component=>{
            energy += BODYPART_COST[component];
        })
        roleConfig[componentToEnergy][i] = energy;
    }
}
function componentToEnergy(){
    _builderMaxCountComponentToEnergy("builderComponentToEnergy", "builderComponent");
    _builderMaxCountComponentToEnergy("upgraderComponentToEnergy", "upgraderComponent");
    _builderMaxCountComponentToEnergy("workerComponentToEnergy", "workerComponent");
    _builderMaxCountComponentToEnergy("attackerComponentToEnergy", "attackerComponent");
    _builderMaxCountComponentToEnergy("harvesterComponentToEnergy", "harvesterComponent");
    _builderMaxCountComponentToEnergy("carryerComponentToEnergy", "carryerComponent");
    _builderMaxCountComponentToEnergy("rangedAttackerComponentToEnergy", "rangedAttackerComponent");
}
componentToEnergy();

function init(){
    if(!Memory.config){
        Memory.config = {}
        Memory.config.level = 1;
    }
    if(roleConfig.isSay){
        roleConfig.isHarvesterSay = true;
        roleConfig.isBuilderSay = true;
        roleConfig.isUpgraderSay = true;
        roleConfig.isCarryerSay = true;
        roleConfig.isWorkerSay = true;
        roleConfig.isAttackerSay = true;
    }
}
init();

module.exports = roleConfig;