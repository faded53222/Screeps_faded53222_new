var typesource=require('type.source');
var typecontroller=require('type.controller');
var typecore=require('type.core');
var type_dic={'source':typesource,'controller':typecontroller,'core':typecore};
var flag_creep_dic={'source':'harvester','controller':'upgrader','core':'carrier'};
const C=(arr)=>[].concat(...arr);
const R=(arr,repeats)=>[].concat([].concat(...Array.from({length:repeats},()=>arr)));
Flag.prototype.init_flag=function(type,room_name,serve_id=-1){
    this.memory.type=type;
    this.memory.flag_creeps=[];
    this.memory.creep_detail={'Body':[],'num':0,'Mem':{}};
    this.memory.ac_creep_num=0;
    this.memory.center_room=room_name;
    this.memory.lv=0;
    this.memory.room_cap=0;
    this.memory.container_pos=[-1,-1];
    this.memory.container_id=-1;
    this.memory.link_pos=[-1,-1];
    this.memory.link_id=-1;
    this.memory.upgrading=0;
    if(serve_id!=-1) this.memory.serve_id=serve_id;
}
Flag.prototype.run=function(){
    type_dic[this.memory.type].run(this);
}
Flag.prototype.upgrade_creep=function(){
    var type=0;
    if(this.memory.container_id==-1) type=0;
    else if(this.memory.link_id==-1) type=1;
    else type=2;
    var info=this.get_most_efficiency_worker(type);
    var Body=C([R([WORK],info[1]),R([CARRY],info[2]),R([MOVE],info[3])]);
    var Mem={flag_name:this.name,work_id:this.memory.serve_id,work_parts:info[1]},ac_num=this.memory.ac_creep_num;
    this.memory.creep_detail={'Body':Body,'num':info[0],'Mem':Mem}
    for(let i=0;i<info[0]-ac_num;i++)
        Game.rooms[this.memory.center_room].add_room_Task('spawn',{'urgent':0,'role':flag_creep_dic[this.memory.type],'Mem':{flag_name:this.name,number:i+ac_num,pos_neg:0}});
}
Flag.prototype.build_road=function(range=0){
    var a_s=[];
    const terrain=this.room.getTerrain();
    for(let i of [-1,0,1]){
        for(let j of [-1,0,1]){
            if(i==0&&j==0) continue;
            if(terrain.get(this.pos.x+i,this.pos.y+j)!=1)
                a_s.push([this.pos.x+i,this.pos.y+j]);
        }
    }
    if(this.memory.type=='source') this.memory.work_place=a_s.length;
    var min_dist=1000;
    var min_keep=[0,0];
    for(let g of a_s){
        var dist=this.room.find_dis(Game.rooms[this.memory.center_room].getPositionAt(Game.rooms[this.memory.center_room].memory.centers['arrange_center'][0],Game.rooms[this.memory.center_room].memory.centers['arrange_center'][1]),this.room.getPositionAt(g[0],g[1]));
        if(dist<min_dist){
            min_dist=dist;
            min_keep=g;
        }
    }
    if(this.memory.center_room==this.room.name){
        if(this.room.memory.build_pos.indexOf(min_keep)) this.room.memory.build_pos.splice(this.room.memory.build_pos.indexOf(min_keep),1);
        this.room.memory.ori_build_pos.push(min_keep);
    }
    this.memory.container_pos=min_keep;
    this.memory.dis=min_dist;
    Game.rooms[this.memory.center_room].build_way_to(Game.rooms[this.memory.center_room].getPositionAt(Game.rooms[this.memory.center_room].memory.centers['arrange_center'][0],Game.rooms[this.memory.center_room].memory.centers['arrange_center'][1]),this.room.getPositionAt(min_keep[0],min_keep[1]),range);
}
Flag.prototype.build_container=function(){
        Game.rooms[this.memory.center_room].construct(this.room.name,this.memory.container_pos,STRUCTURE_CONTAINER);
        for(let i of [-1,0,1]){
            for(let j of [-1,0,1]){
                if(i==0&&j==0) continue;
                if(Game.rooms[this.memory.center_room].suitable_for_build(this.room.name,this.room.getPositionAt(this.memory.container_pos[0]+i,this.memory.container_pos[1]+j))==1){
                    this.memory.link_pos=[this.memory.container_pos[0]+i,this.memory.container_pos[1]+j];
                    if(this.memory.center_room==this.room.name){
                        this.room.memory.ori_build_pos.push(this.memory.link_pos);
                        if(this.room.memory.build_pos.indexOf(this.memory.link_pos)) this.room.memory.build_pos.splice(this.room.memory.build_pos.indexOf(this.memory.link_pos),1);
                    }
                    return;
                }
            }
        }
}
Flag.prototype.build_link=function(){
    Game.rooms[this.memory.center_room].construct(this.room.name,this.memory.link_pos,STRUCTURE_LINK);
}
Flag.prototype.get_most_efficiency_worker=function(type){
    return type_dic[this.memory.type].get_most_efficiency_worker(this,type);
}