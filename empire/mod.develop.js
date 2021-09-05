var modDevelop={
	run:function(room){
		if(room.memory.lv==0){
			if(room.find(FIND_MY_SPAWNS).length==0) return;
			room.memory.lv+=1;
			var spawn=room.find(FIND_MY_SPAWNS)[0];
			room.memory.centers['arrange_center']=[spawn.pos.x,spawn.pos.y];
			room.find_suitable_build_pos();
			room.construct(room.name,[spawn.pos.x,spawn.pos.y],STRUCTURE_SPAWN,1);
			room.memory.room_flags['core'].push(room.createFlag(room.memory.centers['energy_center'][0],room.memory.centers['energy_center'][1],'core_'+room.name,COLOR_RED,COLOR_RED));
			Game.flags[room.memory.room_flags['core'][0]].init_flag('core',room.name);
			Game.flags[room.memory.room_flags['core'][0]].memory.container_pos=room.memory.centers['energy_center'];
			room.construct(room.name,[room.memory.centers['energy_center'][0],room.memory.centers['energy_center'][1]],STRUCTURE_ROAD);
			room.memory.room_flags['controller'].push(room.createFlag(room.controller.pos,'controller_'+room.name,COLOR_BLUE,COLOR_BLUE));
			Game.flags[room.memory.room_flags['controller'][0]].init_flag('controller',room.name,room.controller.id);
			Game.flags[room.memory.room_flags['controller'][0]].build_road();
			var sources=room.find(FIND_SOURCES);
			sources.sort(function(a,b){return room.find_dis(a.pos,room.getPositionAt(room.memory.centers['energy_center'][0],room.memory.centers['energy_center'][1]))-room.find_dis(b.pos,room.getPositionAt(room.memory.centers['energy_center'][0],room.memory.centers['energy_center'][1]))})
			for(var i=0;i<sources.length;i++){
				var flag_name=room.createFlag(sources[i].pos,'harvest_'+room.name+'_'+String(i+1),COLOR_YELLOW,COLOR_YELLOW);
				room.memory.room_flags['source'].push(flag_name);
				Game.flags[flag_name].init_flag('source',room.name,sources[i].id);
				Game.flags[flag_name].build_road();
			}
			room.add_room_Task('spawn',{'urgent':0,'role':'upgrader','Mem':{number:room.memory.maintain['creep']['upgrader'],pos_neg:0}});
			room.add_room_Task('spawn',{'urgent':0,'role':'repairer','Mem':{number:room.memory.maintain['creep']['repairer'],pos_neg:0}});
			room.memory.maintain['creep']['repairer']+=1;
			room.memory.maintain['creep']['upgrader']+=1;
		}
		if(room.memory.lv==1&&room.controller.level>=2){
			room.memory.lv+=1;
			room.construct(room.name,[room.memory.centers['energy_center'][0],room.memory.centers['energy_center'][1]],STRUCTURE_CONTAINER);
			room.auto_construct(STRUCTURE_EXTENSION,5);
			for(var i=0;i<room.memory.room_flags['source'].length;i++) Game.flags[room.memory.room_flags['source'][i]].build_container();
			Game.flags[room.memory.room_flags['controller'][0]].build_container();
		}
		if(room.memory.lv==2&&room.controller.level>=3){
			room.memory.lv+=1;
			room.auto_construct(STRUCTURE_TOWER,1);
			room.auto_construct(STRUCTURE_EXTENSION,5);
		}
		if(room.memory.lv==3&&room.controller.level>=4){
			room.memory.lv+=1;
			room.construct(room.name,[room.memory.centers['energy_center'][0]-1,room.memory.centers['energy_center'][1]],STRUCTURE_STORAGE,1);
			room.auto_construct(STRUCTURE_EXTENSION,10);
		}
		if(room.memory.lv==4&&room.controller.level>=5){
			room.memory.lv+=1;
			Game.flags[room.memory.room_flags['core'][0]].build_link();
			Game.flags[room.memory.room_flags['source'][-1]].build_link();
			room.construct(room.name,[room.memory.centers['tower_center1'][0]+1,room.memory.centers['tower_center1'][1]],STRUCTURE_TOWER,1);
			room.auto_construct(STRUCTURE_EXTENSION,10);
		}
		if(room.memory.lv==5&&room.controller.level>=6){
			room.memory.lv+=1;
			room.auto_construct(STRUCTURE_EXTENSION,10);
			room.construct(room.name,[room.memory.centers['energy_center'][0],room.memory.centers['energy_center'][1]-1],STRUCTURE_TERMINAL,1);
			room.find_lab_center();
			room.construct(room.name,[room.memory.centers['lab_center1'][0]-1,room.memory.centers['lab_center1'][0]],STRUCTURE_LAB,1);
			room.construct(room.name,[room.memory.centers['lab_center1'][0],room.memory.centers['lab_center1'][0]-1],STRUCTURE_LAB,1);
			room.construct(room.name,[room.memory.centers['lab_center1'][0],room.memory.centers['lab_center1'][0]],STRUCTURE_LAB,1);
		}
		if(room.memory.lv==6&&room.controller.level>=7){
			room.memory.lv+=1;
			room.auto_construct(STRUCTURE_EXTENSION,10);
			room.construct(room.name,[room.memory.centers['tower_center1'][0]-1,room.memory.centers['tower_center1'][1]],STRUCTURE_TOWER,1);
			room.construct(room.name,[room.memory.centers['energy_center'][0],room.memory.centers['energy_center'][1]+1],STRUCTURE_FACTORY,1);
			room.construct(room.name,[room.memory.centers['tower_center2'][0],room.memory.centers['tower_center2'][1]+1],STRUCTURE_SPAWN,1);
			room.construct(room.name,[room.memory.centers['lab_center1'][0]+1,room.memory.centers['lab_center1'][0]],STRUCTURE_LAB,1);
			room.construct(room.name,[room.memory.centers['lab_center1'][0],room.memory.centers['lab_center1'][0]+1],STRUCTURE_LAB,1);
			room.construct(room.name,[room.memory.centers['lab_center2'][0]-1,room.memory.centers['lab_center2'][0]],STRUCTURE_LAB,1);
			delete room.memory.centers['energy_center'];
			delete room.memory.centers['lab_center1'];
		}
		if(room.memory.lv==7&&room.controller.level>=8){
			room.memory.lv+=1;
			room.auto_construct(STRUCTURE_EXTENSION,10);
			room.construct(room.name,[room.memory.centers['tower_center1'][0],room.memory.centers['tower_center1'][1]],STRUCTURE_TOWER,1);
			room.construct(room.name,[room.memory.centers['tower_center1'][0],room.memory.centers['tower_center1'][1]+1],STRUCTURE_TOWER,1);
			room.construct(room.name,[room.memory.centers['tower_center1'][0],room.memory.centers['tower_center1'][1]-1],STRUCTURE_TOWER,1);
			room.construct(room.name,[room.memory.centers['tower_center2'][0]+1,room.memory.centers['tower_center2'][1]],STRUCTURE_POWER_SPAWN,1);
			room.construct(room.name,[room.memory.centers['tower_center2'][0],room.memory.centers['tower_center2'][1]-1],STRUCTURE_NUKER,1);
			room.construct(room.name,[room.memory.centers['tower_center2'][0],room.memory.centers['tower_center2'][1]],STRUCTURE_OBSERVER,1);
			room.construct(room.name,[room.memory.centers['tower_center2'][0]-1,room.memory.centers['tower_center2'][1]],STRUCTURE_SPAWN,1);
			room.construct(room.name,[room.memory.centers['lab_center2'][0]+1,room.memory.centers['lab_center2'][0]],STRUCTURE_LAB,1);
			room.construct(room.name,[room.memory.centers['lab_center2'][0],room.memory.centers['lab_center2'][0]],STRUCTURE_LAB,1);
			room.construct(room.name,[room.memory.centers['lab_center2'][0],room.memory.centers['lab_center2'][0]-1],STRUCTURE_LAB,1);
			room.construct(room.name,[room.memory.centers['lab_center2'][0],room.memory.centers['lab_center2'][0]+1],STRUCTURE_LAB,1);
			delete room.memory.centers['tower_center1'];
			delete room.memory.centers['tower_center2'];
			delete room.memory.centers['lab_center2'];
		}
	}
};
module.exports=modDevelop;