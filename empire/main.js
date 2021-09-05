require('prototype.flag');
require('prototype.room');
require('prototype.creep');
require('prototype.structure');
require('movement_optimization');
function deal_death(name){
	if(Memory.creeps[name].contracted_Task){
		for(var j=0;j<Memory.creeps[name].contracted_Task.length;j++){
			var room=Game.rooms[Memory.creeps[name].center_room];
			if(room){
				var R=Memory.creeps[name].contracted_Task[j];
				var T=room.memory.creep_Task[R['type']][R['status']][R['id']];
				if(T){
					T['ammount_all']-=R['ammount_all']-R['ammount'];
					T['ammount']+=R['ammount'];
				}
			}
		}
	}
	if(Memory.creeps[name].flag_name){
		var flag=Game.flags[Memory.creeps[name].flag_name];
		if(flag){
			flag.memory.flag_creeps.splice(flag.memory.flag_creeps.indexOf(name),1);
			var time=Memory.creeps[name].plan_time;
			if(Game.rooms[flag.memory.center_room]&&time>Game.time) Game.rooms[flag.memory.center_room].advance_room_Plan('spawn',time,{'role':Memory.creeps[name].role,'number':Memory.creeps[name].number,'flag_name':Memory.creeps[name].flag_name});
		}
	}
	else if(Memory.creeps[name].center_room){
		var room=Game.rooms[Memory.creeps[name].center_room];
		if(room){
			room.memory.room_creeps[Memory.creeps[name].role].splice(room.memory.room_creeps[Memory.creeps[name].role].indexOf(name),1);
			var time=Memory.creeps[name].plan_time;
			if(time>Game.time)
				Game.rooms[Memory.creeps[name].center_room].advance_room_Plan('spawn',time,{'role':Memory.creeps[name].role,'number':Memory.creeps[name].number});
		}
	}
	delete Memory.creeps[name];
}
function deal_memory(){
	for(var name in Memory.spawns)
		if(!Game.spawns[name]) delete Memory.spawns[name];
	for(var name in Memory.flags)
		if(!Game.flags[name]) delete Memory.flags[name];
	for(var name in Memory.rooms)
		if(!Game.rooms[name]) delete Memory.rooms[name];
}
module.exports.loop=function(){
	//console.log(Game.time%100);
	if(Game.time%1000==0) deal_memory();
	for(var name in Game.rooms){
		if(Game.rooms[name].controller.my){
			if(Game.rooms[name].memory.lv>=0) Game.rooms[name].runMod();
			else if(Game.rooms[name].controller.level>=1) Game.rooms[name].init_room(0);
		}
	}
	for(var name in Memory.creeps){
		if(!Game.creeps[name]) deal_death(name);
		else Game.creeps[name].runRole();
	}
}
