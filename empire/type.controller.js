const level_tick=[100,20000,10000,20000,40000,80000,120000,150000,200000];
var typecontroller={
    run:function(flag){
        if(Game.time%20==0){
            var target=Game.getObjectById(flag.memory.serve_id);
            if(!target) return;
            var tick_a=(level_tick[target.level]-target.ticksToDowngrade)/100;
            if(target.level==8&&target.ticksToDowngrade>100000) tick_a=0;
            var ammount=Math.max(target.progressTotal-target.progress,tick_a);
            var T=Game.rooms[flag.memory.center_room].memory.creep_Task['upgrade'][0][target.id];
            if(T){
                T['ammount']+=ammount-T['ammount_all'];
                T['ammount_all']=ammount;
            }
            else if(ammount>0) Game.rooms[flag.memory.center_room].add_creep_Task('upgrade',0,target.id,{'room':flag.room.name,'pos':[flag.pos.x,flag.pos.y],'ammount':ammount,'ammount_all':ammount});
        }
    }
}
module.exports=typecontroller;