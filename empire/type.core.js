var typeCore={
    run:function(flag){
        if(flag.room.memory.room_structures['tower'].length>0){
            var target=flag.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            if(target) flag.memory.attack_target=target.id;
            else flag.memory.attack_target=0;
            var target=flag.pos.findClosestByRange(FIND_MY_CREEPS,{
                filter: function(object){return object.hits<object.hitsMax;}});
            if(target) flag.memory.heal_target=target.id;
            else flag.memory.heal_target=0;
            var target=flag.room.findClosestByRange(FIND_STRUCTURES,{
                filter: object=>object.hits<object.hitsMax*0.2
                &&object.structureType!=STRUCTURE_WALL});
            if(target) flag.memory.repair_target=target.id;
            else flag.memory.repair_target=0;
        }
    }
}
module.exports=typeCore;