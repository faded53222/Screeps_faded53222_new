const { max } = require('lodash');
var roleworker=require('role.worker');
var role_dic={'harvester':roleworker,'builder':roleworker,'upgrader':roleworker,'repairer':roleworker,'carrier':roleworker};
Creep.prototype.contract_Task=function(){
	var t_TAS0,t_DEM0,t_TAS1,t_DEM1,t_eff0=0,t_eff1=0,c_room=this.room,c_pos=this.pos;
	if(this.store.getCapacity()){
		if(Game.rooms[this.memory.center_room].memory.urgent_status['spawn']==1){
			t_TAS0=this.memory.get_e_tasks['spawn'],t_DEM0=this.memory.get_e_demands['spawn'];
			t_TAS1=this.memory.use_e_tasks['spawn'],t_DEM1=this.memory.use_e_demands['spawn'];
		}
		else{
			t_TAS0=this.memory.get_e_tasks['normal'],t_DEM0=this.memory.get_e_demands['normal'];
			t_TAS1=this.memory.use_e_tasks['normal'],t_DEM1=this.memory.use_e_demands['normal'];
		}
		if(this.store.getFreeCapacity()>0){
			for(var i=0;i<t_TAS0.length;i++){
				var type=t_TAS0[i],demands=t_DEM0[i],Task,t_ammount;
				if(demands['id']){
					if(!Game.getObjectById(demands['id'])) continue;
					for(var status in Game.rooms[this.memory.center_room].memory.creep_Task[type]){
						var T=Game.rooms[this.memory.center_room].memory.creep_Task[type][status][demands['id']];
						if(T){
							Task=T;
							break;
						}
						var VT=Game.rooms[this.memory.center_room].memory.virtual_creep_Task[type][status][demands['id']];
						if(VT){
							Task=VT;
							break;
						}
					}
					if(!Task) continue;
					if(Task['ammount_all']<=this.store.getCapacity()/10) continue;
					if(type=='harvest'&&!this.store.getCapacity()){
						if(Task['ammount']>0) t_ammount=Task['ammount'];
						else t_ammount=Task['ammount_all'];
					}
					else{
						if(Task['ammount']>this.store.getCapacity()/10) t_ammount=Math.min(Task['ammount'],this.store.getFreeCapacity());
						else t_ammount=Math.min(Task['ammount_all'],this.store.getFreeCapacity());
					}
					t_eff0=t_ammount/(1+Math.max(Task['time']-Game.time,c_room.find_dis(c_pos,Game.rooms[Task['room']].getPositionAt(Task['pos'][0],Task['pos'][1]))));
				}
				else{
					var Tasks={};
					for(let demand of demands){
						var T=Game.rooms[this.memory.center_room].memory.creep_Task[type][demand];
						if(T) Tasks=Object.assign(Tasks,T);
						var VT=Game.rooms[this.memory.center_room].memory.virtual_creep_Task[type][demand];
						if(VT) Tasks=Object.assign(Tasks,VT);
					}
					if(Object.keys(Tasks).length==0) continue;
					if(type=='harvest'){
						Task=Object.values(Tasks)[Math.round(Math.random()*(Object.keys(Tasks).length-1))];
						if(Task['ammount']>this.store.getCapacity()/10) t_ammount=Math.min(Task['ammount'],this.store.getFreeCapacity());
						else{
							if(Task['ammount_all']>this.store.getCapacity()/10) t_ammount=Math.min(Task['ammount_all'],this.store.getFreeCapacity());
							else continue;
						}
						t_eff0=t_ammount/(1+Math.max(Task['time']-Game.time,c_room.find_dis(c_pos,Game.rooms[Task['room']].getPositionAt(Task['pos'][0],Task['pos'][1]))));
					}
					else{
						var lab=0;
						for(var iter=0;iter<2;iter++){
							for(let each of Object.values(Tasks)){
								if(iter==0&&each['ammount']<=this.store.getCapacity()/10) continue;
								if(iter==1&&each['ammount_all']<=this.store.getCapacity()/10) continue;
								lab=1;
								if(iter==0) t_ammount=Math.min(each['ammount'],this.store.getFreeCapacity());
								else t_ammount=Math.min(each['ammount_all'],this.store.getFreeCapacity());
								var c_eff=t_ammount/(1+Math.max(each['time']-Game.time,c_room.find_dis(c_pos,Game.rooms[each['room']].getPositionAt(each['pos'][0],each['pos'][1]))));
								if(c_eff>t_eff0) t_eff0=c_eff;
							}
							if(lab==1) break;
						}
						if(lab==0) continue;
					}
				}
				if(type=='harvest') t_eff0/=5;
				break;
			}
		}
		if(this.store[RESOURCE_ENERGY]>0){
			for(var i=0;i<t_TAS1.length;i++){
				var type=t_TAS1[i],demands=t_DEM1[i],Task,t_ammount;
				if(demands['id']){
					if(!Game.getObjectById(demands['id'])) continue;
					for(var status in Game.rooms[this.memory.center_room].memory.creep_Task[type]){
						var T=Game.rooms[this.memory.center_room].memory.creep_Task[type][status][demands['id']];
						if(T){
							Task=T;
							break;
						}
						var VT=Game.rooms[this.memory.center_room].memory.virtual_creep_Task[type][status][demands['id']];
						if(VT){
							Task=VT;
							break;
						}
					}
					if(!Task) continue;
					if(Task['ammount_all']<=0) continue;
					if(Task['ammount']>0) t_ammount=Math.min(Task['ammount'],this.store[RESOURCE_ENERGY]);
					else t_ammount=Math.min(Task['ammount_all'],this.store[RESOURCE_ENERGY]);
					t_eff1=t_ammount/(1+Math.max(Task['time']-Game.time,c_room.find_dis(c_pos,Game.rooms[Task['room']].getPositionAt(Task['pos'][0],Task['pos'][1]))));
				}
				else{
					var Tasks={};
					for(let demand of demands){
						var T=Game.rooms[this.memory.center_room].memory.creep_Task[type][demand];
						if(T) Tasks=Object.assign(Tasks,T);
						if(type!='build'){
							var VT=Game.rooms[this.memory.center_room].memory.virtual_creep_Task[type][demand];
							if(VT) Tasks=Object.assign(Tasks,VT);
						}
					}
					if(Object.keys(Tasks).length==0) continue;
					var lab=0;
					for(var iter=0;iter<2;iter++){
						for(let each of Object.values(Tasks)){
							if(iter==0&&each['ammount']<=0) continue;
							if(iter==1&&each['ammount_all']<=0) continue;
							lab=1;
							if(iter==0) t_ammount=Math.min(each['ammount'],this.store[RESOURCE_ENERGY]);
							else t_ammount=Math.min(each['ammount_all'],this.store[RESOURCE_ENERGY]);
							if(type=='build'&&each['ammount']<=t_ammount){
								t_eff1=10000;
								break;
							}
							var c_eff=t_ammount/(1+Math.max(each['time']-Game.time,c_room.find_dis(c_pos,Game.rooms[each['room']].getPositionAt(each['pos'][0],each['pos'][1]))));
							if(c_eff>t_eff1) t_eff1=c_eff;
						}
						if(lab==1||(lab==0&&type=='build')) break;
					}
					if(lab==0) continue;
				}
			}
		}
		if(t_eff0==0&&t_eff1==0) return;
	}
	var c_ammount=this.store.getFreeCapacity();
	if(!this.store.getCapacity()||(t_eff0>=t_eff1&&c_ammount>0)){
		var TAS,DEM,eff_keep=0;
		if(Game.rooms[this.memory.center_room].memory.urgent_status['spawn']==1) TAS=this.memory.get_e_tasks['spawn'],DEM=this.memory.get_e_demands['spawn'];
		else TAS=this.memory.get_e_tasks['normal'],DEM=this.memory.get_e_demands['normal'];
		for(var i=0;i<TAS.length;i++){
			var type=TAS[i],demands=DEM[i],Task,t_ammount,c_eff;
			if(!this.store.getCapacity()&&type!='harvest') continue;
			if(demands['id']){
				if(!Game.getObjectById(demands['id'])) continue;
				for(var status in Game.rooms[this.memory.center_room].memory.creep_Task[type]){
					var T=Game.rooms[this.memory.center_room].memory.creep_Task[type][status][demands['id']];
					if(T){
						Task=T;
						break;
					}
					var VT=Game.rooms[this.memory.center_room].memory.virtual_creep_Task[type][status][demands['id']];
					if(VT){
						Task=VT;
						break;
					}
				}
				if(!Task) continue;
				if(Task['ammount_all']<=this.store.getCapacity()/10) continue;
				if(type=='harvest'&&!this.store.getCapacity()){
					if(Task['ammount']>this.store.getCapacity()/10) t_ammount=Task['ammount'];
					else t_ammount=Task['ammount_all'];
				}
				else{
					if(Task['ammount']>this.store.getCapacity()/10) t_ammount=Math.min(Task['ammount'],c_ammount);
					else t_ammount=Math.min(Task['ammount_all'],c_ammount);
				}
				c_eff=t_ammount/(1+Math.max(Task['time']-Game.time,c_room.find_dis(c_pos,Game.rooms[Task['room']].getPositionAt(Task['pos'][0],Task['pos'][1]))));
				if(type=='harvest') c_eff/=5;
				if(c_eff<eff_keep/2) continue;
				eff_keep=c_eff;
				var keep_T={'type':type,'room':Task['room'],'pos':Task['pos'],'ammount':t_ammount,'ammount_all':t_ammount,'method':Task['method'],'id':Task['id'],'status':Task['status'],'time':Task['time']};
				if(Task['detail']) keep_T['detail']=Task['detail'];
				this.memory.contracted_Task.push(keep_T);
				
				if(!this.store.getCapacity()&&type=='harvest') c_ammount=0;
				else c_ammount-=t_ammount;
				Task['ammount']-=t_ammount;
				c_room=Game.rooms[Task['room']];
				c_pos=Game.rooms[Task['room']].getPositionAt(Task['pos'][0],Task['pos'][1]);
			}
			else{
				while(1){
					var Tasks={},lab=0;
					for(let demand of demands){
						var T=Game.rooms[this.memory.center_room].memory.creep_Task[type][demand];
						if(T) Tasks=Object.assign(Tasks,T);
						var VT=Game.rooms[this.memory.center_room].memory.virtual_creep_Task[type][demand];
						if(VT) Tasks=Object.assign(Tasks,VT);
					}
					if(Object.keys(Tasks)==0) break;
					if(type=='harvest'){
						Task=Object.values(Tasks)[Math.round(Math.random()*(Object.keys(Tasks).length-1))];
						if(Task['ammount']>this.store.getCapacity()/10) t_ammount=Math.min(Task['ammount'],c_ammount);
						else{
							if(Task['ammount_all']>this.store.getCapacity()/10) t_ammount=Math.min(Task['ammount_all'],this.store.getFreeCapacity());
							else break;
						}
						c_eff=t_ammount/(1+Math.max(Task['time']-Game.time,c_room.find_dis(c_pos,Game.rooms[Task['room']].getPositionAt(Task['pos'][0],Task['pos'][1]))));
						c_eff/=5;
						if(c_eff<eff_keep/2) break;
						eff_keep=c_eff;
					}
					else{
						var max_eff=0;
						for(var iter=0;iter<2;iter++){
							for(let each of Object.values(Tasks)){
								if(iter==0&&each['ammount']<=this.store.getCapacity()/10) continue;
								if(iter==1&&each['ammount_all']<=this.store.getCapacity()/10) continue;
								lab=iter+1;
								if(iter==0) t_ammount=Math.min(each['ammount'],c_ammount);
								else t_ammount=Math.min(each['ammount_all'],c_ammount);
								var c_eff=t_ammount/(1+Math.max(each['time']-Game.time,c_room.find_dis(c_pos,Game.rooms[each['room']].getPositionAt(each['pos'][0],each['pos'][1]))));
								if(c_eff>max_eff){
									max_eff=c_eff;
									Task=each;
								}
							}
							if(lab==1||(lab==0&&!(type=='take'&&demands[0]==-1))) break;
						}
						if(lab==0) break;
					}
					if(max_eff<eff_keep/2){
						if(!(type=='take'&&demands[0]==-1)) break;
						if(max_eff<eff_keep/10) break;
					}
					eff_keep=max_eff;
					var keep_T={'type':type,'room':Task['room'],'pos':Task['pos'],'ammount':t_ammount,'ammount_all':t_ammount,'method':Task['method'],'id':Task['id'],'status':Task['status'],'time':Task['time']};
					if(Task['detail']) keep_T['detail']=Task['detail'];
					this.memory.contracted_Task.push(keep_T);
					c_ammount-=t_ammount;
					Task['ammount']-=t_ammount;
					c_room=Game.rooms[Task['room']];
					c_pos=Game.rooms[Task['room']].getPositionAt(Task['pos'][0],Task['pos'][1]);
					if(c_ammount==0||lab==2) break;
				}
			}
			if(c_ammount==0) break;
		}
	}
	c_ammount=this.store[RESOURCE_ENERGY]+this.store.getFreeCapacity()-c_ammount;
	if(this.store.getCapacity()&&c_ammount>0){
		var TAS,DEM,eff_keep=0;
		if(Game.rooms[this.memory.center_room].memory.urgent_status['spawn']==1) TAS=this.memory.use_e_tasks['spawn'],DEM=this.memory.use_e_demands['spawn'];
		else TAS=this.memory.use_e_tasks['normal'],DEM=this.memory.use_e_demands['normal'];
		for(var i=0;i<TAS.length;i++){
			var type=TAS[i],demands=DEM[i],Task,t_ammount,c_eff;
			if(demands['id']){
				if(!Game.getObjectById(demands['id'])) continue;
				for(var status in Game.rooms[this.memory.center_room].memory.creep_Task[type]){
					var T=Game.rooms[this.memory.center_room].memory.creep_Task[type][status][demands['id']];
					if(T){
						Task=T;
						break;
					}
					var VT=Game.rooms[this.memory.center_room].memory.virtual_creep_Task[type][demand];
					if(VT){
						Task=VT;
						break;
					}
				}
				if(!Task) continue;
				if(Task['ammount_all']<=0) continue;
				if(Task['ammount']>0) t_ammount=Math.min(Task['ammount'],c_ammount);
				else t_ammount=Math.min(Task['ammount_all'],c_ammount);
				c_eff=t_ammount/(1+Math.max(Task['time']-Game.time,c_room.find_dis(c_pos,Game.rooms[Task['room']].getPositionAt(Task['pos'][0],Task['pos'][1]))));
				if(c_eff<eff_keep/2) continue;
				eff_keep=c_eff;
				var keep_T={'type':type,'room':Task['room'],'pos':Task['pos'],'ammount':t_ammount,'ammount_all':t_ammount,'method':Task['method'],'id':Task['id'],'status':Task['status'],'time':Task['time']};
				if(Task['detail']) keep_T['detail']=Task['detail'];
				this.memory.contracted_Task.push(keep_T);
				if(!this.store.getCapacity()&&type=='harvest') c_ammount=0;
				else if(type!='sign') c_ammount-=t_ammount;
				Task['ammount']-=t_ammount;
				c_room=Game.rooms[Task['room']];
				c_pos=Game.rooms[Task['room']].getPositionAt(Task['pos'][0],Task['pos'][1]);
			}
			else{
				while(1){
					var Tasks={},lab=0;
					for(let demand of demands){
						var T=Game.rooms[this.memory.center_room].memory.creep_Task[type][demand];
						if(Object.keys(T).length>0) Tasks=Object.assign(Tasks,T);
						if(type!='build'){
							var VT=Game.rooms[this.memory.center_room].memory.virtual_creep_Task[type][demand];
							if(VT) Tasks=Object.assign(Tasks,VT);
						}
					}
					if(Object.keys(Tasks)==0) break;
					var max_eff=0;
					for(var iter=0;iter<2;iter++){
						for(let each of Object.values(Tasks)){
							if(iter==0&&each['ammount']<=0) continue;
							if(iter==1&&each['ammount_all']<=0) continue;
							lab=iter+1;
							if(iter==0) t_ammount=Math.min(each['ammount'],c_ammount);
							else t_ammount=Math.min(each['ammount_all'],c_ammount);
							var c_eff=t_ammount/(1+Math.max(each['time']-Game.time,c_room.find_dis(c_pos,Game.rooms[each['room']].getPositionAt(each['pos'][0],each['pos'][1]))));
							if(type=='build'&&each['ammount']<=t_ammount) c_eff+=10000;
							if(c_eff>max_eff){
								max_eff=c_eff;
								Task=each;
							}
						}
						if(lab==1||(lab==0&&!(type=='upgrade'||(type=='bring'&&demands[0]==-1)||type=='harvest'))) break;
					}
					if(lab==0) break;
					if(max_eff<eff_keep/2){
						if(!(type=='bring'&&demands[0]==-1)) break;
						if(max_eff<eff_keep/10) break;
					}
					eff_keep=max_eff;
					if(eff_keep>10000) eff_keep-=10000;
					var keep_T={'type':type,'room':Task['room'],'pos':Task['pos'],'ammount':t_ammount,'ammount_all':t_ammount,'method':Task['method'],'id':Task['id'],'status':Task['status'],'time':Task['time']};
					if(Task['detail']) keep_T['detail']=Task['detail'];
					this.memory.contracted_Task.push(keep_T);
					c_ammount-=t_ammount;
					Task['ammount']-=t_ammount;
					c_room=Game.rooms[Task['room']];
					c_pos=Game.rooms[Task['room']].getPositionAt(Task['pos'][0],Task['pos'][1]);
					if(c_ammount==0||lab==2) break;
				}
			}
			if(c_ammount==0) break;
		}
	}
}
Creep.prototype.execute_Task=function(){
	if(Game.rooms[this.memory.center_room].memory.urgent_status['spawn']==1&&this.memory.role=='builder'||this.memory.role=='upgrader'||this.memory.role=='repairer')
		Game.rooms[this.memory.center_room].memory.temp_keep['consume_energy']+=this.memory.work_parts*2;
	if(this.memory.cool_down_tick>0){
		this.memory.cool_down_tick-=1;
		if(Game.rooms[this.memory.center_room].memory.urgent_status['spawn']==0){
			if(this.memory.role=='carrier') Game.rooms[this.memory.center_room].memory.temp_keep['carry_energy']+=this.memory.carry_parts*2;
			else if(this.memory.role=='builder'||this.memory.role=='upgrader'||this.memory.role=='repairer') Game.rooms[this.memory.center_room].memory.temp_keep['consume_energy']+=this.memory.work_parts*2;	
		}
		return;
	}
	if(this.memory.contracted_Task.length==0) this.contract_Task();
	if(this.memory.contracted_Task.length==0){
		this.memory.cool_down_tick=5;
		return;
	}
	switch(this.memory.contracted_Task[0]['type']){
		case 'upgrade':case 'build':case 'repair':case 'harvest':this.work_(this.memory.contracted_Task['0']['type']);break;
		case 'take':case 'bring':case 'sign':this.carry_(this.memory.contracted_Task[0]['type'],this.memory.contracted_Task[0]['method']);break;
	}
}
Creep.prototype.work_=function(type){
	var C_Task=this.memory.contracted_Task[0];
	if(this.memory.id_keep==C_Task['id']){
		var done=Math.abs(this.store[RESOURCE_ENERGY]-this.memory.energy_keep);
		this.memory.energy_keep=this.store[RESOURCE_ENERGY];
		if(done>0){
			C_Task['ammount']-=done;
			if(type=='harvest') Game.rooms[this.memory.center_room].memory.temp_keep['harvest_energy']+=done;
			else Game.rooms[this.memory.center_room].memory.temp_keep['consume_energy']+=done;
		}
		if(C_Task['ammount']<=0||(type=='harvest'&&this.store.getFreeCapacity()==0)||(type!='harvest'&&this.store.getUsedCapacity()==0)){
			var Task=Game.rooms[this.memory.center_room].memory.creep_Task[type][C_Task['status']][C_Task['id']];
			if(Task){
				Task['ammount_all']-=C_Task['ammount_all']-C_Task['ammount'];
				Task['ammount']+=C_Task['ammount'];
			}
			this.memory.contracted_Task.splice(0,1);
			this.execute_Task();
			return 0;
		}
	}
	this.memory.id_keep=C_Task['id'];
	var target=Game.getObjectById(C_Task['id']);
	if(target==null){
		var Task=Game.rooms[this.memory.center_room].memory.creep_Task[type][C_Task['status']][C_Task['id']];
		if(Task) delete Game.rooms[this.memory.center_room].memory.creep_Task[type][C_Task['status']][C_Task['id']];
		this.memory.contracted_Task.splice(0,1);
		this.execute_Task();
		return 0;
	}
	var sta;
	switch(type){
		case'upgrade':sta=this.upgradeController(target);break;
		case'build':sta=this.build(target);break;
		case'repair':sta=this.repair(target);break;
		case'harvest':sta=this.harvest(target);break;
	}
	if(sta==ERR_NOT_IN_RANGE){
		if(this.memory.flag_name){
			var flag=Game.flags[this.memory.flag_name];
			if(flag.memory.container_id){
				if(this.moveTo(new RoomPosition(flag.memory.container_pos[0],flag.memory.container_pos[1],flag.room.name)));
				else if(this.store.getCapacity()) this.moveTo(target);
			}
			else this.moveTo(target);
		}
		else this.moveTo(target);
	}
	else if(sta==OK){
		if(!this.store.getCapacity()){
			Game.rooms[this.memory.center_room].memory.temp_keep['harvest_energy']+=this.memory.work_parts*2;
			C_Task['ammount']-=this.memory.work_parts*2
		}
		if(Math.random()>0.1) this.memory.dontPullMe=true;
		if(type=='repair'&&Game.getObjectById(C_Task['id']).hits==Game.getObjectById(C_Task['id']).hitsMax){
			var Task=Game.rooms[this.memory.center_room].memory.creep_Task[type][C_Task['status']][C_Task['id']];
			if(Task) delete Game.rooms[this.memory.center_room].memory.creep_Task[type][C_Task['status']][C_Task['id']];
			this.memory.contracted_Task.splice(0,1);
			if(this.memory.contracted_Task.length>0) this.execute_Task();
			return 0;
		}
	}
	else if(sta==ERR_NOT_ENOUGH_RESOURCES){
		var Task=Game.rooms[this.memory.center_room].memory.creep_Task[type][C_Task['status']][C_Task['id']];
		if(Task){
			Task['ammount_all']-=C_Task['ammount_all']-C_Task['ammount'];
			Task['ammount']+=C_Task['ammount'];
		}
		this.memory.contracted_Task.splice(0,1);
		if(this.memory.contracted_Task.length>0) this.execute_Task();
		return 0;
	}
	else if(sta==ERR_INVALID_TARGET||sta==ERR_FULL){
		if(sta==ERR_FULL&&this.memory.contracted_Task[0]['time']-Game.time>0) return 0;
		var Task=Game.rooms[this.memory.center_room].memory.creep_Task[type][C_Task['status']][C_Task['id']];
		if(Task) delete Game.rooms[this.memory.center_room].memory.creep_Task[type][C_Task['status']][C_Task['id']];
		this.memory.contracted_Task.splice(0,1);
		if(this.memory.contracted_Task.length>0) this.execute_Task();
		return 0;
	}
	return 1;
}
Creep.prototype.carry_=function(type,method){
	var C_Task=this.memory.contracted_Task[0],done=0;
	if(this.memory.id_keep==C_Task['id']){
		done=Math.abs(this.store[RESOURCE_ENERGY]-this.memory.energy_keep);
		this.memory.energy_keep=this.store[RESOURCE_ENERGY];
		if(done>0){
			C_Task['ammount']-=done;
			if(this.memory.role!='harvester'&&C_Task['status']==1&&method=='withdraw') Game.rooms[this.memory.center_room].memory.temp_keep['carry_energy']+=done;
			if(this.memory.role=='harvester'&&C_Task['status']!=1&&method=='transfer') Game.rooms[this.memory.center_room].memory.temp_keep['carry_energy']+=done;
		}
	}
	this.memory.id_keep=C_Task['id'];
	if(done>0||(this.store.getFreeCapacity()==0&&type=='take')||(this.store.getUsedCapacity()==0&&type=='bring')){
		var Task=Game.rooms[this.memory.center_room].memory.creep_Task[type][C_Task['status']][C_Task['id']];
		if(Task){
			Task['ammount_all']-=C_Task['ammount_all']-C_Task['ammount'];
			Task['ammount']+=C_Task['ammount'];
		}
		if((method=='withdraw'&&C_Task['status']!=1)||method=='transfer'){
			var method2,type2;
			if(method=='withdraw'){
				method2='transfer';
				type2='bring';
			}
			else{
				method2='withdraw';
				type2='take';
			}
			var Task2=Game.rooms[this.memory.center_room].memory.creep_Task[type2][C_Task['status']][C_Task['id']];
			if(Task2){
				Task2['ammount_all']+=C_Task['ammount_all']-C_Task['ammount'];
				Task2['ammount']+=C_Task['ammount_all']-C_Task['ammount'];
			}
			else if(C_Task['ammount_all']-C_Task['ammount']>0) Game.rooms[this.memory.center_room].add_creep_Task(type2,C_Task['status'],C_Task['id'],{'method':method2,'room':C_Task['room'],'pos':C_Task['pos'],'ammount':C_Task['ammount_all']-C_Task['ammount'],'ammount_all':C_Task['ammount_all']-C_Task['ammount']});
		}
		this.memory.contracted_Task.splice(0,1);
		this.execute_Task();
		return 0;
	}
	var target=Game.getObjectById(C_Task['id']);
	if(target==null){
		var Task=Game.rooms[this.memory.center_room].memory.creep_Task[type][C_Task['status']][C_Task['id']];
		if(Task) delete Game.rooms[this.memory.center_room].memory.creep_Task[type][C_Task['status']][C_Task['id']];
		this.memory.contracted_Task.splice(0,1);
		this.execute_Task();
		return 0;
	}
	var sta;
	switch(method){
		case'withdraw':sta=this.withdraw(target,RESOURCE_ENERGY);break;
		case'transfer':sta=this.transfer(target,RESOURCE_ENERGY);break;
		case'pickup':sta=this.pickup(target);break;
		case'sign':sta=this.signController(target,C_Task['detail']);break;
	}
	if(sta==ERR_NOT_IN_RANGE) this.moveTo(target);
	else if(sta==ERR_NOT_ENOUGH_RESOURCES){
		var Task=Game.rooms[this.memory.center_room].memory.creep_Task[type][C_Task['status']][C_Task['id']];
		if(Task){
			Task['ammount_all']-=C_Task['ammount_all']-C_Task['ammount'];
			Task['ammount']+=C_Task['ammount'];
		}
		if((method=='withdraw'&&C_Task['status']!=1)||method=='transfer'){
			var method2,type2;
			if(method=='withdraw'){
				method2='transfer';
				type2='bring';
			}
			else{
				method2='withdraw';
				type2='take';
			}
			var Task2=Game.rooms[this.memory.center_room].memory.creep_Task[type2][C_Task['status']][C_Task['id']];
			if(Task2){
				Task2['ammount_all']+=C_Task['ammount_all']-C_Task['ammount'];
				Task2['ammount']+=C_Task['ammount_all']-C_Task['ammount'];
			}
			else if(C_Task['ammount_all']-C_Task['ammount']>0) Game.rooms[this.memory.center_room].add_creep_Task(type2,C_Task['status'],C_Task['id'],{'method':method2,'room':C_Task['room'],'pos':C_Task['pos'],'ammount':C_Task['ammount_all']-C_Task['ammount'],'ammount_all':C_Task['ammount_all']-C_Task['ammount']});
		}
		this.memory.contracted_Task.splice(0,1);
		if(this.memory.contracted_Task.length>0) this.execute_Task();
		return 0;
	}
	else if(sta==ERR_INVALID_TARGET||sta==ERR_FULL||(sta==OK&&type=='sign')){
		if(sta==ERR_FULL&&this.memory.contracted_Task[0]['time']-Game.time>0) return 0;
		var Task=Game.rooms[this.memory.center_room].memory.creep_Task[type][C_Task['status']][C_Task['id']];
		if(Task) delete Game.rooms[this.memory.center_room].memory.creep_Task[type][C_Task['status']][C_Task['id']];
		this.memory.contracted_Task.splice(0,1);
		if(this.memory.contracted_Task.length>0) this.execute_Task();
		return 0;
	}
	return 1;
}
Creep.prototype.go_to_room=function(room_name=-1){
	if(room_name==-1){
		if(!this.memory.target_room){
			return 0;
		}
		if(this.memory.target_room) return 0;
		room_name=this.memory.target_room;
	}
	if(this.room.name!=room_name){
		var exit=this.room.findExitTo(room_name);
		this.moveTo(this.pos.findClosestByRange(exit));
		return 1;
	}
	return 0;
}
Creep.prototype.backhome=function(){
	if(this.room.name!=this.memory.center_room){
		var exit=this.room.findExitTo(this.memory.center_room);
		this.moveTo(this.pos.findClosestByPath(exit));
		return;
	}
	this.memory.backing_home=0;
}
Creep.prototype.renew=function(){
	this.memory.renewing=1;
	if(this.memory.center_room)
		if(this.room.name!=this.memory.center_room){
			this.memory.backing_home=1;
			return;
		}
	else if(this.memory.flag_name)
		if(this.room.name!=Game.flags[this.memory.flag_name].memory.center_room){
			this.memory.backing_home=1;
			return;
		}
	if(this.memory.target_spawn==null){
		this.memory.target_spawn=this.pos.findClosestByPath(FIND_MY_SPAWNS,{
			filter: function(object){return object.spawning==0&&object.memory.renewing==0}});
		if(this.memory.target_spawn==null){
			this.memory.target_spawn=this.pos.findClosestByPath(FIND_MY_SPAWNS);
		}
	}
	this.transfer(this.memory.target_spawn,RESOURCE_ENERGY);
	var sta=this.memory.target_spawn.renewCreep(this);
	if(sta==0){
		this.memory.target_spawn.memory.renewing=1;
	}
	else if(sta==ERR_NOT_IN_RANGE){
		this.moveTo(this.memory.target_spawn);
	}
	else if(sta==ERR_FULL){
		this.memory.target_spawn.memory.renewing=0;
		this.memory.renewing=0;
		this.memory.target_spawn=null;
	}
}
Creep.prototype.recycle=function(){
	this.memory.recycling=1;
	if(this.memory.center_room)
		if(this.room.name!=this.memory.center_room){
			this.memory.backing_home=1;
			return;
		}
	else if(this.memory.flag_name)
		if(this.room.name!=Game.flags[this.memory.flag_name].memory.center_room){
			this.memory.backing_home=1;
			return;
		}
	if(this.memory.target_spawn==null) this.memory.target_spawn=this.pos.findClosestByPath(FIND_MY_SPAWNS).name;
	var spawn=Game.spawns[this.memory.target_spawn];
	this.transfer(spawn,RESOURCE_ENERGY);
	var sta=spawn.recycleCreep(this);
	if(sta==ERR_NOT_IN_RANGE) this.moveTo(spawn);
}
Creep.prototype.runRole=function(){
	this.memory.dontPullMe=false;
	if(this.memory.backing_home) this.backhome();
	else if(this.memory.recycling) this.recycle();
	//else if(this.memory.renewing) this.renew();
	else role_dic[this.memory.role].run(this);
};