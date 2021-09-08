var moddevelop=require('mod.develop');
var mod_lis=[moddevelop];
const pri_list=['carrier','harvester','claimer','defender','reserver','upgrader','repairer','builder'];
const dir_list=[TOP,TOP_RIGHT,RIGHT,BOTTOM_RIGHT,BOTTOM,BOTTOM_LEFT,LEFT,TOP_LEFT];
const dir_dic={'0 -1':TOP,'1 -1':TOP_RIGHT,'-1 -1':TOP_LEFT,'1 0':RIGHT,'-1 0':LEFT,'1 1':BOTTOM_RIGHT,'-1 1':BOTTOM_LEFT,'0 1':BOTTOM};
Room.prototype.init_room=function(mod=0){
	const des=this.find(FIND_STRUCTURES,{filter:{structureType: STRUCTURE_WALL}});
	for(let obj of des) obj.destroy();
	this.memory.mod=mod;
	this.memory.lv=0;
	this.memory.urgent_status={'spawn':0};
	this.memory.creep_Task={'harvest':{'0':{}},'take':{'2':{},'1':{},'0':{},'-0.5':{},'-1':{}},'bring':{'0':{},'-0.5':{},'-1':{}},'build':{'spawn':{},'extension':{},'road':{},'tower':{},'container':{},'link':{},'storage':{}},'upgrade':{'0':{}},'repair':{'0':{}}};
	this.memory.virtual_creep_Task={'harvest':{'0':{}},'take':{'2':{},'1':{},'0':{},'-0.5':{},'-1':{}},'bring':{'0':{},'-0.5':{},'-1':{}},'build':{'spawn':{},'extension':{},'road':{},'tower':{},'container':{},'link':{},'storage':{}},'upgrade':{'0':{}},'repair':{'0':{}}};
	this.memory.room_Task={'spawn':[],'adjust_spawn_carry_task':[],'add_maintain_structure':[],'destory':[],'remove':[],'construct':[]};
	this.memory.room_Plan={};
	this.memory.room_rooms=[this.name];
	this.memory.room_structures={'spawn':[],'tower':[]};
	this.memory.room_flags={'core':[],'controller':[],'source':[]};
	this.memory.room_creeps={'carrier':[],'defender':[],'builder':[],'repairer':[],'upgrader':[]};
	this.memory.maintain={'creep':{'upgrader':0,'carrier':0,'defender':0,'builder':0,'repairer':0},'ac_creep':{'upgrader':0,'carrier':0,'defender':0,'builder':0,'repairer':0},'structure':[]};
	this.memory.centers={'arrange_center':-1,'energy_center':-1,'tower_center1':-1,'tower_center2':-1,'lab_center1':-1,'lab_center2':-1}
	this.memory.temp_keep={'harvest_energy':0,'consume_energy':0,'carry_energy':0,'last_harvest_energy':0,'last_consume_energy':0,'last_carry_energy':0};
	this.memory.long_keep={'building_status_dic':{}};
}
Room.prototype.add_virtual_creep_Task=function(type,status,id,info){
	if(id==-1) id='_'+type+'_'+info['room']+'_'+info['pos'][0]+'_'+info['pos'][1];
	info['status']=status;
	info['id']=id;
	this.memory.virtual_creep_Task[type][status][id]=info;
}
Room.prototype.add_creep_Task=function(type,status,id,info){
	if(!info['time']) info['time']=0;
	if(id[0]=='_'){
		if(type=='build'){
			var target=Game.rooms[info['room']].lookForAt(LOOK_CONSTRUCTION_SITES,info['pos'][0],info['pos'][1])[0];
			info['ammount']=target.progressTotal;
			info['ammount_all']=target.progressTotal;
			id=target.id;
		}
	}
	info['status']=status;
	info['id']=id;
	this.memory.creep_Task[type][status][id]=info;
}
Room.prototype.add_room_Plan=function(type,time,info){
	if(time<Game.time) this.add_room_Task(type,info);
	if(!this.memory.room_Plan[time]) this.memory.room_Plan[time]=[];
	this.memory.room_Plan[time].push({'type':type,'info':info});
}
Room.prototype.add_room_Task=function(type,info){
	this.memory.room_Task[type].push(info);
}
Room.prototype.advance_room_Plan=function(type,time,info){
	switch(type){
		case 'spawn':
			for(var i=0;i<this.memory.room_Plan[time].length;i++){
				if(this.memory.room_Plan[time][i]['info']['role']==info['role']&&this.memory.room_Plan[time][i]['info']['Mem']['number']==info['number']){
					if(info['flag_name'])
						if(!this.memory.room_Plan[time][i]['info']['Mem']['flag_name']||info['flag_name']!=this.memory.room_Plan[time][i]['info']['Mem']['flag_name'])
							continue;
					this.add_room_Task('spawn',this.memory.room_Plan[time][i]['info']);
					this.memory.room_Plan[time].splice(i,1);
					if(this.memory.room_Plan[time].length==0) delete this.memory.room_Plan[time];
					break;
				}
			}
			break;
		}
}
Room.prototype.manage_Plan=function(){
	if(this.memory.room_Plan[Game.time]){
		for(let A of this.memory.room_Plan[Game.time]) this.add_room_Task(A['type'],A['info']);
		delete this.memory.room_Plan[Game.time];
	}
}
Room.prototype.manage_creep_Task=function(){
	for(var type in this.memory.creep_Task)
		for(var status in this.memory.creep_Task[type]){
			var T=this.memory.creep_Task[type][status];
			for(var id in T){
				var obj=Game.getObjectById(id);
				if(!obj||T[id]['ammount_all']<=0){
					if(type=='build') this.add_room_Task("add_maintain_structure",{'room':T[id]['room'],'pos':T[id]['pos'],'type':status});
					delete T[id];
				}
			}
		}
	for(var type in this.memory.virtual_creep_Task)
		for(var status in this.memory.virtual_creep_Task[type]){
			var T=this.memory.virtual_creep_Task[type][status];
			for(var id in T){
				if(T[id]['time']<=Game.time){
					var T1=this.memory.creep_Task[type][status][id];
					if(T1) T1['ammount']-=(T[id]['ammount_all']-T[id]['ammount']);
					else this.add_creep_Task(type,status,id,{'method':T[id]['method'] ,'room':T[id]['room'],'pos':T[id]['pos'],'ammount':T[id]['ammount'],'ammount_all':T[id]['ammount_all']});
					delete T[id];
				}
			}
		}
}
Room.prototype.manage_room_Task=function(){
	for(var type in this.memory.room_Task){
		var T=this.memory.room_Task[type];
		if(T.length==0) continue;
		switch(type){
			case 'spawn':
				for(var i=0;i<T.length;i++){
					if(T[i]['Mem']['number']>=0){
						if(T[i]['Mem']['flag_name']){
							var flag=Game.flags[T[i]['Mem']['flag_name']];
							if(T[i]['Mem']['number']>=flag.memory.creep_detail['num']){
								flag.memory.ac_creep_num-=1;
								T.splice(i,1);
								i--;
							}
						}
						else if(T[i]['Mem']['number']>=this.memory.maintain['creep'][T[i]['role']]){
								this.memory.maintain['ac_creep'][T[i]['role']]-=1;
								T.splice(i,1);
								i--;
						}
					}
				}
				for(let each0 of this.memory.room_structures['spawn']){
					if(T.length==0) break;
					var current_spawn=Game.getObjectById(each0);
					if(!current_spawn) continue;
					if(current_spawn.spawning||current_spawn.memory.spawn_memory!=-1) continue;
					var spawn_choice=-1;
					for(var i=0;i<T.length;i++)
						if(T[i]['urgent']==1)
							spawn_choice=i;
					if(spawn_choice==-1){
						for(let pri_role of pri_list){
							for(var i=0;i<T.length;i++){
								if(T[i]['role']==pri_role){
									spawn_choice=i;
									break;
								}
							}
							if(spawn_choice!=-1){
								break;
							}
						}
					}
					if(T[spawn_choice]['Mem']['flag_name']){
						var flag_name=T[spawn_choice]['Mem']['flag_name'];
						var directions=current_spawn.memory.spawn_directions[flag_name];
						if(!directions){
							directions=[];
							var first_step=this.findPath(current_spawn.pos,Game.flags[flag_name].pos,{ignoreCreeps:1})[0];
							var best_dir_pos=dir_list.indexOf(dir_dic[[first_step.dx,first_step.dy].join(' ')]);
							for(let k of [0,1,-1,2,-2,3,-3,4]){
								var cur=best_dir_pos+k;
								if(cur<0) cur+=8;
								if(cur>7) cur-=8;
								directions.push(dir_list[cur]);
							}
							current_spawn.memory.spawn_directions[flag_name]=directions;
						}
						T[spawn_choice]['directions']=directions;
					}
					current_spawn.memory.spawn_memory=T[spawn_choice];
					T.splice(spawn_choice,1);
				}
				break;
			case 'adjust_spawn_carry_task':
				for(var id in this.memory.long_keep['building_status_dic']){
					var target=Game.getObjectById(id);
					if(!(target.structureType==STRUCTURE_SPAWN||target.structureType==STRUCTURE_EXTENSION)) continue;
					var status=this.memory.long_keep['building_status_dic'][id];
					var ac_store=target.store[RESOURCE_ENERGY],ac_cap=target.store.getFreeCapacity(RESOURCE_ENERGY);
					var Tasks=this.memory.creep_Task['take'][status],Tasks2=this.memory.creep_Task['bring'][status];
					if(Tasks[id]){
						Tasks[id]['ammount']+=ac_store-Tasks[id]['ammount_all'];
						Tasks[id]['ammount_all']=ac_store;
					}
					else if(ac_store>0) this.add_creep_Task('take',status,id,{'method':'withdraw','room':target.room.name,'pos':[target.pos.x,target.pos.y],'ammount':ac_store,'ammount_all':ac_store});
					if(Tasks2[id]){
						Tasks2[id]['ammount']+=ac_cap-Tasks2[id]['ammount_all'];
						Tasks2[id]['ammount_all']=ac_cap;
					}
					else if(ac_cap>0) this.add_creep_Task('bring',status,id,{'method':'transfer','room':target.room.name,'pos':[target.pos.x,target.pos.y],'ammount':ac_cap,'ammount_all':ac_cap});
				}
				this.memory.room_Task[type]=[];
				break;
			case 'add_maintain_structure':
				for(var i=0;i<T.length;i++){
					var targets=Game.rooms[T[i]['room']].lookForAt(LOOK_STRUCTURES,T[i]['pos'][0],T[i]['pos'][1]);
					for(let target of targets){
						if(target.structureType==T[i]['type']){
							this.memory.maintain['structure'].push({'room':T[i]['room'],'id':target.id,'pos':T[i]['pos'],'type':T[i]['type']});
							switch(T[i]['type']){
								case STRUCTURE_SPAWN:case STRUCTURE_EXTENSION:
									this.memory.long_keep['building_status_dic'][target.id]=-1;break;
								case STRUCTURE_TOWER:
									this.memory.long_keep['building_status_dic'][target.id]=-0.5;break;
								case STRUCTURE_STORAGE:
									this.memory.long_keep['building_status_dic'][target.id]=0;break;
							}
							if(T[i]['type']==STRUCTURE_SPAWN||T[i]['type']==STRUCTURE_TOWER){
								this.memory.room_structures[T[i]['type']].push(target.id);
								if(T[i]['type']==STRUCTURE_SPAWN) target.init_spawn();
							}
							else if(T[i]['type']==STRUCTURE_LINK){
								for(var type in this.memory.room_flags)
									for(let each of this.memory.room_flags[type])
										if(Game.flags[each].room.name==T[i]['room']&&Game.flags[each].memory.link_pos[0]==T[i]['pos'][0]&&Game.flags[each].memory.link_pos[1]==T[i]['pos'][1]){
											Game.flags[each].memory.link_id=target.id;
											if(type=='source'){
												this.memory.long_keep['building_status_dic'][target.id]=0;
												Game.flags[each].upgrade_creep();
											}
											else if(type=='controller') this.memory.long_keep['building_status_dic'][target.id]=0;
											else if(type=='core') this.memory.long_keep['building_status_dic'][target.id]=1;
										}
							}
							else if(T[i]['type']==STRUCTURE_CONTAINER){
								var lab=0;
								for(var type in this.memory.room_flags){
									for(let each of this.memory.room_flags[type]){
										if(Game.flags[each].room.name==T[i]['room']&&Game.flags[each].memory.container_pos[0]==T[i]['pos'][0]&&Game.flags[each].memory.container_pos[1]==T[i]['pos'][1]){
											Game.flags[each].memory.container_id=target.id;
											if(type=='source'){
												this.memory.long_keep['building_status_dic'][target.id]=1;
												Game.flags[each].upgrade_creep();
												if(this.memory.maintain['creep']['carrier']==0){
													this.memory.maintain['creep']['carrier']+=1;
													this.add_room_Task('spawn',{'urgent':0,'role':'carrier','Mem':{number:this.memory.maintain['creep']['carrier']-1,pos_neg:0}});
												}
											}
											else if(type=='controller') this.memory.long_keep['building_status_dic'][target.id]=-0.5;
											else if(type=='core') this.memory.long_keep['building_status_dic'][target.id]=0;
											lab=1;
											break;
										}
									}
									if(lab==1) break;
								}
							}
							if(this.memory.long_keep['building_status_dic'][target.id]&&this.memory.long_keep['building_status_dic'][target.id]!=1)
								this.add_creep_Task('bring',this.memory.long_keep['building_status_dic'][target.id],target.id,{'method':'transfer','room':this.name,'pos':[target.pos.x,target.pos.y],'ammount':target.store.getCapacity(RESOURCE_ENERGY),'ammount_all':target.store.getCapacity(RESOURCE_ENERGY)});
							break;
						}
					}
					T.splice(i,1);
					i--;
				}
				break;
			case 'destory':
				for(var i=0;i<T.length;i++){
					for(var j=0;j<this.memory.maintain['structure'].length;j++){
						if(this.memory.maintain['structure'][j]['id']==T[i]['id']){
							this.memory.maintain['structure'].splice(j,1);
							delete this.memory.long_keep['building_status_dic'][T[i]['id']];
							break;
						}
					}
					var obj=Game.getObjectById(T[i]['id']);
					if(obj){
						var destorySuccess=obj.destroy();
						if(destorySuccess==ERR_BUSY) break;
					}
					T.splice(i,1);
					i--;
				}
				break;
			case 'remove':
					for(var i=0;i<T.length;i++){
						var Tasks=this.memory.creep_Task['build'];
						for(var status in Tasks){
							if(Tasks[status][T[i]['id']]){
								delete Tasks[status][T[i]['id']];
								break;
							}
						}
						var obj=Game.getObjectById(T[i]['id']);
						if(obj) obj.remove();
						T.splice(i,1);
						i--;
					}
					break;
			case 'construct':
				for(var i=0;i<T.length;i++){
					var name;
					if(T[i]['type']==STRUCTURE_SPAWN) name='Spawn_'+this.name+'_'+parseInt(this.memory.room_structures['spawn'].length+1);
					var constructSuccess=Game.rooms[T[i]['room']].createConstructionSite(T[i]['pos'][0],T[i]['pos'][1],T[i]['type'],name);
					if(constructSuccess==ERR_FULL) break;
					else if(constructSuccess==OK) this.add_virtual_creep_Task('build',T[i]['type'],-1,{'room':T[i]['room'],'pos':T[i]['pos'],'time':Game.time+1});
					else continue;
					T.splice(i,1);
					i--;
				}
				break;
		}
	}
}
Room.prototype.manage_room=function(){
	//建筑维护（发布维修任务和重建任务)
	if(Game.time%100==0){
		for(var i=0;i<this.memory.maintain['structure'].length;i++){
			var info=this.memory.maintain['structure'][i];
			var target=Game.getObjectById(info['id']);
			if(target){
				if(target.hits<target.hitsMax*0.7){
					var T=this.memory.creep_Task['repair']['0'][info['id']];
					if(T){
						T['ammount']-=T['ammount_all']-(target.hitsMax-target.hits)/100;
						T['ammount_all']=(target.hitsMax-target.hits)/100;
					}
					else this.add_creep_Task('repair',0,info['id'],{'room':info['room'],'pos':info['pos'],'ammount':(target.hitsMax-target.hits)/100,'ammount_all':(target.hitsMax-target.hits)/100});
				}
			}
			else{
				this.construct(info['room'],info['pos'],info['type']);
				if(this.memory.long_keep['building_status_dic'][this.memory.maintain['structure'][i]['id']])
					delete this.memory.long_keep['building_status_dic'][this.memory.maintain['structure'][i]['id']];
				this.memory.maintain['structure'].splice(i,1);
				if(info['type']==STRUCTURE_SPAWN||STRUCTURE_TOWER)
					this.memory.room_structures[info['type']].splice(this.memory.room_structures[info['type']].indexOf(info['id']),1);
				i--;
			}
		}
	}
	//builder数量调节+carrier数量调节
	if(Game.time%100==0){
		if(this.memory.maintain['creep']['builder']<=this.memory.maintain['ac_creep']['builder']){
			if(1.25*this.memory.temp_keep['consume_energy']<this.memory.temp_keep['harvest_energy']){
					this.memory.maintain['creep']['builder']+=1;
					if(this.memory.maintain['creep']['builder']>this.memory.maintain['ac_creep']['builder'])
						this.add_room_Task('spawn',{'urgent':0,'role':'builder','Mem':{number:this.memory.maintain['creep']['builder']-1,pos_neg:0}});
				}
				else if(this.memory.temp_keep['consume_energy']>=1.25*this.memory.temp_keep['harvest_energy']&&this.memory.maintain['creep']['builder']>=1)
					this.memory.maintain['creep']['builder']-=1;
		}
		if(this.memory.maintain['creep']['carrier']>=1&&this.memory.maintain['creep']['carrier']<=this.memory.maintain['ac_creep']['carrier']){
			if(this.memory.temp_keep['consume_energy']<1.25*this.memory.temp_keep['harvest_energy']&&1.25*this.memory.temp_keep['carry_energy']<this.memory.temp_keep['consume_energy']){
					this.memory.maintain['creep']['carrier']+=1;
					if(this.memory.maintain['creep']['carrier']>this.memory.maintain['ac_creep']['carrier'])
						this.add_room_Task('spawn',{'urgent':0,'role':'carrier','Mem':{number:this.memory.maintain['creep']['carrier']-1,pos_neg:0}});
				}
				else if(1.25*this.memory.temp_keep['consume_energy']>=this.memory.temp_keep['harvest_energy']&&this.memory.temp_keep['carry_energy']>=1.25*this.memory.temp_keep['consume_energy']&&this.memory.maintain['creep']['carrier']>=2)
					this.memory.maintain['creep']['carrier']-=1;
		}
		//console.log('harvest',this.memory.temp_keep['harvest_energy']);
		//console.log('consume',this.memory.temp_keep['consume_energy']);
		//console.log('carry',this.memory.temp_keep['carry_energy']);
		this.memory.temp_keep['last_harvest_energy']=this.memory.temp_keep['harvest_energy']-0.5*this.memory.temp_keep['last_harvest_energy'];
		this.memory.temp_keep['last_consume_energy']=this.memory.temp_keep['consume_energy']-0.5*this.memory.temp_keep['last_consume_energy'];
		this.memory.temp_keep['last_carry_energy']=this.memory.temp_keep['carry_energy']-0.5*this.memory.temp_keep['last_carry_energy'];
		this.memory.temp_keep['harvest_energy']=this.memory.temp_keep['last_harvest_energy']/2;
		this.memory.temp_keep['consume_energy']=this.memory.temp_keep['last_consume_energy']/2;
		this.memory.temp_keep['carry_energy']=this.memory.temp_keep['last_carry_energy']/2;
	}
	//发布+矫正 pickup任务
	if(Game.time%20==0){
		var targets;
		for(let room of this.memory.room_rooms){
			if(this.memory.lv<6) targets=Game.rooms[room].find(FIND_DROPPED_RESOURCES,{fliter:{resourceType:RESOURCE_ENERGY}});
			else targets=Game.rooms[room].find(FIND_DROPPED_RESOURCES);
			for(let target of targets){
				var status=2;
				if(target.resourceType==RESOURCE_ENERGY) status=1;
				var T=this.memory.creep_Task['take'][status][target.id];
				if(T){
					T['ammount']-=T['ammount_all']-target.energy;
					T['ammount_all']=target.energy;
				}
				else this.add_creep_Task('take',status,target.id,{'method':'pickup','room':room,'pos':[target.pos.x,target.pos.y],'ammount':target.energy,'ammount_all':target.energy});
			}
		}
	}
	//矫正 withdraw和transfer任务 //spawn的自动产生在structure里矫正
	if(Game.time%200==0){
		for(var id in this.memory.long_keep['building_status_dic']){
			var target=Game.getObjectById(id),status=this.memory.long_keep['building_status_dic'][id];
			var ac_store=target.store[RESOURCE_ENERGY],ac_cap=target.store.getFreeCapacity(RESOURCE_ENERGY);
			var Tasks=this.memory.creep_Task['take'][status];
			if(Tasks[id]){
				Tasks[id]['ammount']+=ac_store-Tasks[id]['ammount_all'];
				Tasks[id]['ammount_all']=ac_store;
			}
			else if(ac_store>0) this.add_creep_Task('take',status,id,{'method':'withdraw','room':target.room.name,'pos':[target.pos.x,target.pos.y],'ammount':ac_store,'ammount_all':ac_store});
			if(status!=1){
				var Tasks2=this.memory.creep_Task['bring'][status];;
				if(Tasks2[id]){
					Tasks2[id]['ammount']+=ac_cap-Tasks2[id]['ammount_all'];
					Tasks2[id]['ammount_all']=ac_cap;
				}
				else if(ac_cap>0) this.add_creep_Task('bring',status,id,{'method':'transfer','room':target.room.name,'pos':[target.pos.x,target.pos.y],'ammount':ac_cap,'ammount_all':ac_cap});
			}
		}
	}
}
Room.prototype.auto_construct=function(type,num){
	for(var i=0;i<num;i++){
		console.log(type,num);
		this.construct(this.name,this.memory.build_pos[0],type);
		var pos=this.memory.build_pos[0];
		for(var each of [[pos[0]-1,pos[1]],[pos[0]+1,pos[1]],[pos[0],pos[1]-1],[pos[0],pos[1]+1]]){
			var lab=0;
			for(var each2 of this.memory.ori_build_pos)
				if(each2[0]==each[0]&&each2[1]==each[1])
					lab=1;
			if(lab==0) this.construct(this.name,each,STRUCTURE_ROAD);
		}
		this.memory.build_pos.splice(0,1);
	}
}
Room.prototype.construct=function(room,pos,type,auto=0){
	var things=Game.rooms[room].lookAt(pos[0],pos[1])
	var already_build=0;
	for(let thing of things){
		if(thing['type']=='terrain'&&thing['terrain']=='wall'){
			return;
		}
		if(thing['type']=='structure'&&thing['structure'].structureType!=type){
			if(!((type==STRUCTURE_LINK||type==STRUCTURE_CONTAINER)&&thing['structure'].structureType==STRUCTURE_ROAD)){
				this.add_room_Task('destory',{'id':thing['structure'].id});
			}
		}
		if(thing['type']=='constructionSite'&&thing['constructionSite'].structureType!=type){
			if(!((type==STRUCTURE_LINK||type==STRUCTURE_CONTAINER)&&thing['constructionSite'].structureType==STRUCTURE_ROAD)){
				this.add_room_Task('remove',{'id':thing['constructionSite'].id});
			}
		}
		if(thing['type']=='structure'&&thing['structure'].structureType==type) already_build=1;
		else if(thing['type']=='constructionSite'&&thing['constructionSite'].structureType==type) already_build=2;
	}
	if(auto==1){
		for(var each of [[pos[0]-1,pos[1]],[pos[0]+1,pos[1]],[pos[0],pos[1]-1],[pos[0],pos[1]+1]]){
			var lab=0;
			for(var each2 of this.memory.ori_build_pos)
				if(each2[0]==each[0]&&each2[1]==each[1])
					lab=1;
			if(lab==0) this.construct(this.name,each,STRUCTURE_ROAD);
		}
	}
	if(type==STRUCTURE_STORAGE) console.log("LLLLL",already_build);
	if(already_build==0){
		if(type==STRUCTURE_CONTAINER||type==STRUCTURE_LINK){
			if(this.memory.build_pos.indexOf(pos)!=-1)
				this.memory.build_pos.splice(this.memory.build_pos.indexOf(pos));
		}
		this.add_room_Task('construct',{'room':room,'pos':pos,'type':type});
	}
	else if(already_build==1){
		var lab=0;
		for(var j=0;j<this.memory.maintain['structure'].length;j++){
			if(this.memory.maintain['structure'][j]['pos'][0]==pos[0]&&this.memory.maintain['structure'][j]['pos'][1]==pos[1]&&this.memory.maintain['structure'][j]['room']==room&&this.memory.maintain['structure'][j]['type']==type){
				lab=1;
				break;
			}
		}
		if(lab==0) this.add_room_Task("add_maintain_structure",{'room':room,'pos':pos,'type':type});
	}
}
Room.prototype.suitable_for_build=function(room,pos){
	var things=Game.rooms[room].lookAt(pos.x,pos.y);
	for(let each of things){
		if(each['type']=='terrain'&&each['terrain']=='wall') return -1;
		if(each['type']=='structure'||each['type']=='constructionSite') return -1;
	}
	for(let T of this.memory.room_Task['construct'])
		if(T['room']==room&&T['pos'][0]==pos.x&&T['pos'][1]==pos.y)
			return -1;
	return 1;
}
Room.prototype.find_dis=function(start,end,range=0){
	if(start.roomName==end.roomName){
		var path=Game.rooms[start.roomName].findPath(start,end,{ignoreCreeps:1,range:range});
		return path.length;
	}
}
Room.prototype.build_way_to=function(start,end,range=0){
	if(start.roomName==end.roomName){
		var path=this.findPath(start,end,{ignoreCreeps:1,range:range});
		for(let part of path) this.construct(start.roomName,[part['x'],part['y']],STRUCTURE_ROAD);
		return path.length;
	}
}
Room.prototype.find_center=function(){
	const terrain=this.getTerrain();
	var base=new Array();
	for(var i=0;i<50;i++){
		base[i]=new Array();
		for(var j=0;j<50;j++)
			base[i][j]=1000;
	}
	function search(s){
		var t=JSON.parse(JSON.stringify(base));
		var s_l=[[s[0],s[1],0]];
		t[s[0]][s[1]]=0;
		while(s_l.length>0){
			for(let each of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]){
				var tx=s_l[0][0]+each[0];
				var ty=s_l[0][1]+each[1];
				if(tx>0&&tx<49&&ty>0&&ty<49){
					if(t[tx][ty]==1000){
						if(terrain.get(tx,ty)!=TERRAIN_MASK_WALL){
							s_l.push([tx,ty,s_l[0][2]+1]);
							t[tx][ty]=s_l[0][2]+1;
						}
					}
				}
			}
			s_l.shift();
		}
		lis.push(t);
	}
	var lis=[];
	search([this.controller.pos.x,this.controller.pos.y]);
	var sources=this.find(FIND_SOURCES);
	for(let each of sources) search([each.pos.x,each.pos.y]);
	var min_dis=1000;
	var pos_keep=[];
	for(var i=1;i<49;i++){
		for(var j=1;j<49;j++){
			var temp=0;
			for(let each of lis) temp+=each[i][j];
			if(temp<min_dis){
				min_dis=temp;
				pos_keep=[[i,j]];
			}
			else if(temp==min_dis){
				pos_keep.push([i,j]);
			}
		}
	}
	var wall_des=new Array();
	for(var i=0;i<50;i++){
		wall_des[i]=new Array();
		for(var j=0;j<50;j++)
			wall_des[i][j]=0;
	}
	for(var i=0;i<50;i++){
		for(var j=0;j<50;j++){
			if(terrain.get(i,j)==1){
				for(var k=1;k<5;k++){
					var ll1=[];
					var ll2=[];
					var ll3=[];
					var ll4=[];
					for(var q=-k;q<k;q++){
						ll1.push([q,-k]);
						ll2.push([q,k]);
					}
					for(var q=-k+1;q<k-1;q++){
						ll3.push([-k,q]);
						ll4.push([k,q]);
					}
					for(let ll of [ll1,ll2,ll3,ll4]){
						for(let each of ll){
							var tx=i+each[0];
							var ty=j+each[1];
							if(tx>=0&&tx<50&&ty>=0&&ty<50){
								wall_des[i+each[0]][j+each[1]]+=Math.pow(2,1-k);
							}
						}
					}
				}
			}
		}
	}
	var min_wall=1000;
	var pos_keep2=[];
	for(var i=0;i<pos_keep.length&&i<5;i++){
		for(var w=-5;w<5;w++){
			for(var e=-5;e<5;e++){
				var tx=w+pos_keep[i][0];
				var ty=e+pos_keep[i][1];
				if(tx>0&&tx<49&&ty>0&&ty<49){
					if(wall_des[tx][ty]<min_wall){
						min_wall=wall_des[tx][ty];
						pos_keep2=[[tx,ty,Math.abs(w)+Math.abs(e)]];
					}
					else if(wall_des[tx][ty]==min_wall){
						pos_keep2.push([tx,ty,Math.abs(w)+Math.abs(e)]);
					}
				}
			}
		}
	}
	var min_dis2=1000;
	var pos_keep3;
	for(let each of pos_keep2){
		if(each[2]<min_dis2){
			min_dis2=each[2];
			pos_keep3=[each[0],each[1]];
		}
	}
	this.memory.centers['arrange_center']=pos_keep3;
}
Room.prototype.find_lab_center=function(){
	var t_lis=[];
	for(let each of this.memory.build_pos){
		if(this.memory.build_pos.indexOf([each[0]-1,each[1]])!=-1&&this.memory.build_pos.indexOf([each[0]+1,each[1]])!=-1
		&&this.memory.build_pos.indexOf([each[0],each[1]-1])!=-1&&this.memory.build_pos.indexOf([each[0],each[1]+1])!=-1){
			t_lis.push(each);
		}
	}
	for(let each of t_lis){
		if(t_lis.indexOf([each[0]-2,each[1]-2])!=-1||t_lis.indexOf([each[0]-2,each[1]+2])!=-1
		||t_lis.indexOf([each[0]+2,each[1]-2])!=-1||t_lis.indexOf([each[0]+2,each[1]+2])!=-1){
			this.memory.lab_center_pos1=each;
			for(let each2 of [[each[0]-2,each[1]-2],[each[0]+2,each[1]-2],[each[0]-2,each[1]+2],[each[0]+2,each[1]+2]]){
				if(t_lis.indexOf(each2)!=-1){
					this.memory.lab_center_pos2=each2;
					break;
				}
			}
			break;
		}
	}
	for(let each of [this.memory.lab_center_pos1,this.memory.lab_center_pos2]){
		for(let pos of [each,[each[0]-1,each[1]],[each[0]+1,each[1]],[each[0],each[1]-1],[each[0],each[1]+1]]){
			this.memory.build_pos.splice(this.memory.build_pos.indexOf(pos));
		}
	}
}
Room.prototype.find_suitable_build_pos=function(){
	var arrange_center=this.memory.centers['arrange_center'];
	const terrain=this.getTerrain();
	const max_num=150;
	var look_lis=[[2,1],[1,-2],[-1,2],[-2,-1]];
	this.memory.build_pos=[];
	this.memory.ori_build_pos=[];
	while(1){
		var temp_lis=[];
		for(let each of look_lis){
			if(this.memory.centers['energy_center']==-1){
			    if(terrain.get(each[0]+arrange_center[0]+1,each[1]+arrange_center[1])!=1&&terrain.get(each[0]+arrange_center[0]-1,each[1]+arrange_center[1])!=1
			    &&terrain.get(each[0]+arrange_center[0],each[1]+arrange_center[1]+1)!=1&&terrain.get(each[0]+arrange_center[0],each[1]+arrange_center[1]-1)!=1){
					this.memory.centers['energy_center']=[each[0]+arrange_center[0],each[1]+arrange_center[1]];
				}
			}
			else if(this.memory.centers['tower_center2']==-1){
			    if(terrain.get(each[0]+arrange_center[0]+1,each[1]+arrange_center[1])!=1&&terrain.get(each[0]+arrange_center[0]-1,each[1]+arrange_center[1])!=1
			    &&terrain.get(each[0]+arrange_center[0],each[1]+arrange_center[1]+1)!=1&&terrain.get(each[0]+arrange_center[0],each[1]+arrange_center[1]-1)!=1){
					this.memory.centers['tower_center2']=[each[0]+arrange_center[0],each[1]+arrange_center[1]];
				}
			}
			else if(this.memory.centers['tower_center1']==-1){
			    if(terrain.get(each[0]+arrange_center[0]+1,each[1]+arrange_center[1])!=1&&terrain.get(each[0]+arrange_center[0]-1,each[1]+arrange_center[1])!=1
			    &&terrain.get(each[0]+arrange_center[0],each[1]+arrange_center[1]+1)!=1&&terrain.get(each[0]+arrange_center[0],each[1]+arrange_center[1]-1)!=1){
					this.memory.centers['tower_center1']=[each[0]+arrange_center[0],each[1]+arrange_center[1]];
				}
			}
			else{
				for(let each2 of [[each[0],each[1]],[each[0]+1,each[1]],[each[0]-1,each[1]],[each[0],each[1]+1],[each[0],each[1]-1]]){
					if(terrain.get(each2[0]+arrange_center[0],each2[1]+arrange_center[1])!=1){
						this.memory.build_pos.push([each2[0]+arrange_center[0],each2[1]+arrange_center[1]]);
						this.memory.ori_build_pos.push([each2[0]+arrange_center[0],each2[1]+arrange_center[1]]);
						if(this.memory.build_pos.length==max_num){
							break;
						}
					}
				}
			}
			if(this.memory.build_pos.length==max_num){
				break;
			}
			if(arrange_center[0]+each[0]+(each[0]+each[1])/Math.abs(each[0]+each[1])*2>=1&&arrange_center[0]+each[0]+(each[0]+each[1])/Math.abs(each[0]+each[1])*2<=48
			&&arrange_center[1]+each[1]+(each[0]+each[1])/Math.abs(each[0]+each[1])*2>=1&&arrange_center[1]+each[1]+(each[0]+each[1])/Math.abs(each[0]+each[1])*2<=48){
    			temp_lis.push([each[0]+(each[0]+each[1])/Math.abs(each[0]+each[1])*2,each[1]+(each[0]+each[1])/Math.abs(each[0]+each[1])*2]);			    
			}
			if(arrange_center[0]+each[0]+(each[0]-each[1])/Math.abs(each[0]-each[1])*2>=1&&arrange_center[0]+each[0]+each[0]+(each[0]-each[1])/Math.abs(each[0]-each[1])*2<=48
			&&arrange_center[1]+each[1]-(each[0]-each[1])/Math.abs(each[0]-each[1])*2>=1&&arrange_center[1]+each[1]-(each[0]-each[1])/Math.abs(each[0]-each[1])*2<=48){
       			temp_lis.push([each[0]+(each[0]-each[1])/Math.abs(each[0]-each[1])*2,each[1]-(each[0]-each[1])/Math.abs(each[0]-each[1])*2]);
			}
		}
		if(this.memory.build_pos.length==max_num){
			break;
		}
		look_lis=temp_lis;
	}
	const c_pos=new RoomPosition(arrange_center[0],arrange_center[1],this.name);
	const room_=this;
	function sort_dis(a,b){
		var pos1=new RoomPosition(a[0],a[1],room_.name);
		var pos2=new RoomPosition(b[0],b[1],room_.name);
		var dis1=room_.findPath(c_pos,pos1,{ignoreCreeps:1,ignoreDestructibleStructures:1}).length;
		var dis2=room_.findPath(c_pos,pos2,{ignoreCreeps:1,ignoreDestructibleStructures:1}).length;
		if(dis1>dis2){
		    return 1;
		}
		return -1;
	}
	this.memory.build_pos.sort(sort_dis);
}
Room.prototype.run_flags=function(){
	for(var each_class in this.memory.room_flags){
		for(let each of this.memory.room_flags[each_class]){
			Game.flags[each].run();
		}
	}
}
Room.prototype.run_structures=function(){
	for(var each_class in this.memory.room_structures){
		for(let each of this.memory.room_structures[each_class]){
			if(each_class=='tower') break;
			var target=Game.getObjectById(each);
			if(target) target.run();
		}
	}
}
Room.prototype.runMod=function(){
	if(this.memory.lv!=8) mod_lis[this.memory.mod].run(this);
	this.manage_room();
	this.manage_Plan();
	this.manage_room_Task();
	this.manage_creep_Task();
	this.run_flags();
	this.run_structures();
}