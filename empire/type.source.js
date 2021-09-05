var typeSource={
    run:function(flag){
        if(Game.rooms[flag.memory.center_room].energyCapacityAvailable!=flag.memory.room_cap){
            flag.memory.room_cap=Game.rooms[flag.memory.center_room].energyCapacityAvailable;
            flag.upgrade_creep();
        }
        if(Game.time%20==0){
            var target=Game.getObjectById(flag.memory.serve_id);
            var T=Game.rooms[flag.memory.center_room].memory.creep_Task['harvest'][0][target.id];
            if(T){
                T['ammount']+=target.energy-T['ammount_all'];
                T['ammount_all']=target.energy;
            }
            else{
                if(target.energy>0) Game.rooms[flag.memory.center_room].add_creep_Task('harvest',0,target.id,{'room':flag.room.name,'pos':[flag.pos.x,flag.pos.y],'ammount':target.energy,'ammount_all':target.energy});
                else{
                    var T2=Game.rooms[flag.memory.center_room].memory.virtual_creep_Task['harvest'][0][target.id];
                    if(!T2&&target.ticksToRegeneration) Game.rooms[flag.memory.center_room].add_virtual_creep_Task('harvest',0,target.id,{'room':flag.room.name,'pos':[flag.pos.x,flag.pos.y],'ammount':target.energyCapacity,'ammount_all':target.energyCapacity,'time':Game.time+target.ticksToRegeneration});
                }
            }
            var target=Game.getObjectById(flag.memory.container_id);
            if(target){
                var ac_store=target.store[RESOURCE_ENERGY],T=Game.rooms[flag.memory.center_room].memory.creep_Task['take'][1][target.id];
                if(T){
                    T['ammount']+=ac_store-T['ammount_all'];
                    T['ammount_all']=ac_store;
                }
                else if(ac_store>0) Game.rooms[flag.memory.center_room].add_creep_Task('take',1,target.id,{'method':'withdraw','room':target.room.name,'pos':[target.pos.x,target.pos.y],'ammount':ac_store,'ammount_all':ac_store});
            }
        }
    }
    ,
    get_most_efficiency_worker:function(flag,type){
        var total=Game.rooms[flag.memory.center_room].energyCapacityAvailable/50;
        var keep=[];
        var move_time_keep;
        if(type==0){//无container
            var max_eff=0;
            for(let move=1;move<=total/2;move++){
                for(let carry=1;carry<total-move-2;carry++){
                    for(let work=1;work<=(total-move-carry)/2;work++){
                        var t_keep=0;
                        for(let num=1;num<6;num++){
                            var work_time=Math.ceil((carry*50)/(work*2))
                            var speed2=work+carry-2*move,speed1=work-2*move;
                            if(speed2<0) speed2=0; if(speed1<0) speed1=0;
                            speed2+=1; speed1+=1;
                            var move_time=(speed1+speed2)*flag.memory.dis;
                            var work_time_rate=work_time/(work_time+move_time);
                            if(num*work_time_rate>flag.memory.work_place){work_time_rate=work_time_rate*(flag.memory.work_place/(num*work_time_rate));}
                            var all_time=work_time/work_time_rate;
                            var max_work_power=Game.getObjectById(flag.memory.serve_id).energyCapacity/300;
                            var work_power=num*carry*50/all_time;
                            if(work_power>max_work_power){work_power=max_work_power;}
                            var eff=work_power-num*(work*100+carry*50+move*50)/1500;
                            if(eff>max_eff){
                                max_eff=eff;
                                keep=[num,work,carry,move];
                                move_time_keep=speed1*flag.memory.dis;
                            }
                            if(eff<t_keep){
                                break;
                            }
                            t_keep=eff;
                        }
                    }
                }
            }
            flag.memory.move_time=move_time_keep;
            return keep;
        }
        if(type==1){//有container 无link
            var max_eff=0;
            for(let move=1;move<=total/2;move++){
                for(let work=1;work<=(total-move)/2;work++){
                    var num=1;
                    var speed1=work-2*move;
                    if(speed1<0) speed1=0;
                    speed1+=1;
                    var move_time=speed1*flag.memory.dis;
                    var work_time_rate=(1500-move_time)/1500;
                    var max_work_power=Game.getObjectById(flag.memory.serve_id).energyCapacity/300;
                    var work_power=work_time_rate*work*2;
                    if(work_power>max_work_power){work_power=max_work_power;}
                    var eff=work_power-num*(work*100+move*50)/1500;
                    if(eff>max_eff){
                        max_eff=eff;
                        keep=[num,work,0,move];
                        move_time_keep=speed1*flag.memory.dis;
                    }                
                }
            }
            flag.memory.move_time=move_time_keep;
            return keep;
        }
        if(type==2){//有link
            var max_eff=0;
            for(let move=1;move<=total/2;move++){
                for(let carry=1;carry<total-move-2;carry++){
                    for(let work=1;work<=(total-move-carry)/2;work++){
                        var work_time=Math.ceil((carry*50)/(work*2));
                        var speed1=work-2*move;
                        if(speed1<0) speed1=0;
                        speed1+=1;
                        var move_time=(speed2)*flag.memory.dis;
                        var work_time_rate=(1500-move_time)/1500;
                        work_time_rate=work_time_rate*work_time/(1+work_time);
                        var all_time=work_time/work_time_rate;
                        var max_work_power=Game.getObjectById(flag.memory.serve_id).energyCapacity/300;
                        var work_power=num*carry*50/all_time;
                        if(work_power>max_work_power){work_power=max_work_power;}
                        var eff=work_power-num*(work*100+carry*50+move*50)/1500;
                        if(eff>max_eff){
                            max_eff=eff;
                            keep=[num,work,carry,move];
                            move_time_keep=speed1*flag.memory.dis;
                        }
                    }
                }
            }
            flag.memory.move_time=move_time_keep;
            return keep;
        }
    }
}
module.exports=typeSource;