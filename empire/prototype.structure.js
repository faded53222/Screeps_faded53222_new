const C=(arr)=>[].concat(...arr);
const R=(arr,repeats)=>[].concat([].concat(...Array.from({length:repeats},()=>arr)));
const body_price={'move':50,'work':100,'carry':50,'attack':80,'ranged_attack':150,'heal':250,'claim':600,'tough':10}
Spawn.prototype.init_spawn=function(){
	this.memory.spawn_directions={};
	this.memory.spawn_memory=-1;
	this.memory.urgent_spawn_count=0;
}
Spawn.prototype.run=function(){
	if(this.room.energyAvailable<300){
		var T=this.room.memory.creep_Task['take']['-1'][this.id],T2=this.room.memory.creep_Task['bring']['-1'][this.id];
		if(T){
			T['ammount']+=1;
			T['ammount_all']+=1;
		}
		else this.room.add_creep_Task('take',-1,this.id,{'method':'withdraw','room':this.room.name,'pos':[this.pos.x,this.pos.y],'ammount':1,'ammount_all':1});
		if(T2){
			T2['ammount']-=1;
			T2['ammount_all']-=1;
		}
		this.room.memory.temp_keep['harvest_energy']+=1;
	}
	if(this.memory.spawn_memory==-1) return;
	var role=this.memory.spawn_memory['role'],Mem=this.memory.spawn_memory['Mem'],Name,Body,dire=this.memory.spawn_memory['directions'];
	if(Mem['flag_name']){
		Name=Mem['flag_name']+'_'+Mem['number'];
		Body=Game.flags[Mem['flag_name']].memory.creep_detail['Body'];
		for(var key in Game.flags[Mem['flag_name']].memory.creep_detail['Mem']) Mem[key]=Game.flags[Mem['flag_name']].memory.creep_detail['Mem'][key];
	}
	else Name=this.room.name+'_'+role+'_'+Mem['number'];
	if(Mem['pos_neg']==0) Name+='<';
	else Name+='>';
	if(Mem['flag_name']) Mem['plan_time']=Game.time+1500-Game.flags[Mem['flag_name']].memory.move_time;
	else Mem['plan_time']=Game.time+1500;
	var common_Mem={role:role,center_room:this.room.name,renewing:0,recycling:0,backing_home:0,contracted_Task:[],energy_keep:0,id_keep:0,cool_down_tick:0};
	for(var key in common_Mem) Mem[key]=common_Mem[key];
	var tm={},tm0={},num;
	if(role=='harvester'||role=='builder'||role=='repairer'||role=='upgrader'||role=='carrier'){
		if(role=='harvester'){
			if(this.room.memory.lv>1&&this.memory.urgent_spawn_count>=150){
				Body=C([R([WORK],2),R([CARRY],1),R([MOVE],1)]);
				tm0={'work_parts':2};
			}
		}
		else if(role=='carrier'){
			num=Math.floor(this.room.energyCapacityAvailable/150);
			if(this.room.memory.lv>1&&this.memory.urgent_spawn_count>=150) num=2;
			Body=C([R([CARRY],num*2),R([MOVE],num)]);
			tm0={'carry_parts':2*num};
		}
		else{
			num=Math.floor(this.room.energyCapacityAvailable/200);
			if(this.room.memory.lv>1&&this.memory.urgent_spawn_count>=150) num=1;
			Body=C([R([WORK],num),R([CARRY],num),R([MOVE],num)]);
			tm0={'work_parts':num};
		}
		switch(role){
			case 'harvester':tm={get_e_tasks:{'normal':['harvest','take'],'spawn':['take','harvest']},
			get_e_demands:{'normal':[{id:Mem['work_id']},{id:Game.flags[Mem['flag_name']].memory.container_id}],'spawn':[{id:Game.flags[Mem['flag_name']].memory.container_id},{id:Mem['work_id']}]},
			use_e_tasks:{'normal':['bring','bring','bring'],'spawn':['bring','bring']},
			use_e_demands:{'normal':[{id:Game.flags[Mem['flag_name']].memory.link_id},{id:Game.flags[Mem['flag_name']].memory.container_id},[-1,0,-0.5]],'spawn':[{id:Game.flags[Mem['flag_name']].memory.link_id},[-1]]}};break;			
			case 'builder':tm={get_e_tasks:{'normal':['take','take'],'spawn':['take']},
			get_e_demands:{'normal':[[0,1,-0.5],[-1]],'spawn':[[0,1,-0.5]]},
			use_e_tasks:{'normal':['build','build','build','build','build','build','build','upgrade','repair'],'spawn':['bring']},
			use_e_demands:{'normal':[['spawn'],['extension'],['road'],['tower'],['container'],['link'],['storage'],[0],[0]],'spawn':[[-1]]}};break;
			case 'repairer':tm={get_e_tasks:{'normal':['take','take'],'spawn':['take']},
			get_e_demands:{'normal':[[0,1,-0.5],[-1]],'spawn':[[0,1,-0.5]]},
			use_e_tasks:{'normal':['repair','build','build','build','build','build','build','build','upgrade'],'spawn':['bring']},
			use_e_demands:{'normal':[[0],['spawn'],['extension'],['road'],['tower'],['container'],['link'],['storage'],[0]],'spawn':[[-1]]}};break;
			case 'upgrader':tm={get_e_tasks:{'normal':['take','take'],'spawn':['take']},
			get_e_demands:{'normal':[[0,1,-0.5],[-1]],'spawn':[[0,1,-0.5]]},
			use_e_tasks:{'normal':['upgrade','build','build','build','build','build','build','build','repair'],'spawn':['bring']},
			use_e_demands:{'normal':[[0],['spawn'],['extension'],['road'],['tower'],['container'],['link'],['storage'],[0]],'spawn':[[-1]]}};break;
			case 'carrier':tm={get_e_tasks:{'normal':['take','take','take'],'spawn':['take','take','take']},
			get_e_demands:{'normal':[[1],[0],[-0.5]],'spawn':[[1],[0],[-0.5]]},
			use_e_tasks:{'normal':['bring','bring','bring'],'spawn':['bring','bring','bring']},
			use_e_demands:{'normal':[[-1],[-0.5],[0]],'spawn':[[-1],[-0.5],[0]]}};break;
		}
	}
	for(var key in tm0) Mem[key]=tm0[key];
	for(var key in tm) Mem[key]=tm[key];
	var spawnSuccess=this.spawnCreep(Body,Name,{memory:Mem,directions:dire});
	if(spawnSuccess==0){
		if(Mem['number']>=0){
			if(Mem['flag_name']){
				if(Game.flags[Mem['flag_name']].memory.ac_creep_num<Game.flags[Mem['flag_name']].memory.creep_detail['num'])
					Game.flags[Mem['flag_name']].memory.ac_creep_num+=1;
			}
			else if(this.room.memory.maintain['ac_creep'][role]<this.room.memory.maintain['creep'][role]) this.room.memory.maintain['ac_creep'][role]+=1;
		}
		for(let each of Body) this.room.memory.temp_keep['consume_energy']+=body_price[each];
		this.room.add_room_Task('adjust_spawn_carry_task',{});
		for(var id in this.room.memory.long_keep['building_status_dic']){
			var target=Game.getObjectById(id);
			if(target.structureType==STRUCTURE_SPAWN||target.structureType==STRUCTURE_EXTENSION){
				var cap=target.store.getCapacity(RESOURCE_ENERGY);
				this.room.add_virtual_creep_Task('bring',-1,id,{'method':'transfer','room':target.room.name,'pos':[target.pos.x,target.pos.y],'ammount':cap,'ammount_all':cap,'time':Game.time+1});
			}
		}
		if(!Mem['temp']==1){
			if(Mem['flag_name']) Game.flags[Mem['flag_name']].memory.flag_creeps.push(Name);
			else this.room.memory.room_creeps[role].push(Name);
			var new_Mem={'number':Mem['number'],'pos_neg':(Mem['pos_neg']+1)%2}
			if(Mem['flag_name']) new_Mem['flag_name']=Mem['flag_name']
			this.room.add_room_Plan('spawn',Mem['plan_time'],{'urgent':0,'role':role,'Mem':new_Mem});
		}
		this.room.memory.urgent_status['spawn']=0;
		this.memory.urgent_spawn_count=0;
		this.memory.spawn_memory=-1;
	}
	else if(spawnSuccess==-6){
			this.memory.urgent_spawn_count+=1;
			if(this.memory.urgent_spawn_count>=50) this.room.memory.urgent_status['spawn']=1;
		}
	else{
		console.log('ERROR SPAWN',spawnSuccess);
		this.room.memory.urgent_status['spawn']=0;
		this.memory.urgent_spawn_count=0;
		this.memory.spawn_memory=-1;
	}
	return spawnSuccess;
}
/*
var common_repair_source_keep=1000;
StructureTower.prototype.run=function(){
		var target=this.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
		if(target!=undefined){
			this.attack(target);
			return;
		}
		var target=this.pos.findClosestByRange(FIND_MY_CREEPS,{
			filter: function(object){return object.hits<object.hitsMax;}});
		if(target){
			this.heal(target);
			return;
		}
		if(this.store[RESOURCE_ENERGY]<500||this.room.memory.urgent_status['spawn']==1||this.room.memory.emergency>0){
			return;
		}
		if(this.room.storage!=null){
			if(this.room.storage.store[RESOURCE_ENERGY]<common_repair_source_keep){
				return;
			}
		}
		var targets=this.room.find(FIND_STRUCTURES,{
			filter: object=>object.hits<object.hitsMax
			&&object.structureType!=STRUCTURE_WALL&&object.structureType!=STRUCTURE_RAMPART});
		targets.sort((a,b)=>(a.hits)-(b.hits));
		if(targets.length>0){
			this.repair(targets[0]);
			return;
		}
		if(this.room.energyCapacityAvailable>this.room.energyAvailable*2){
			return;
		}
		if(this.room.storage){
			if(this.room.storage.store[RESOURCE_ENERGY]<this.room.memory.wall_limit){
				return;
			}
		}
		if(this.store[RESOURCE_ENERGY]>=499){
			var targets=this.room.find(FIND_STRUCTURES,{
				filter: object=>object.hits<object.hitsMax
				&&(object.structureType==STRUCTURE_WALL||object.structureType==STRUCTURE_RAMPART)&&object.hits<this.room.memory.wall_limit});
			targets.sort((a,b)=>(a.hits)-(b.hits));
			if(targets.length>0){
				this.repair(targets[0]);
			}
		}
};
StructureLink.prototype.run=function(){
	var links=_.filter(Game.structures,s=>s.structureType==STRUCTURE_LINK);
	for(let link of links){
		if(link.pos.x!=link.room.memory.center_link[0]||link.pos.y!=link.room.memory.center_link[1]){
			var things=link.room.lookAt(link.room.memory.center_link[0],link.room.memory.center_link[1]);
			for(var tem=0;tem<things.length;tem++){
				if(things[tem]['type']=='structure'&&things[tem]['structure'].structureType==STRUCTURE_LINK){
					link.transferEnergy(things[tem]['structure']);
					break;
				}
			}
		}
	}
};
*/