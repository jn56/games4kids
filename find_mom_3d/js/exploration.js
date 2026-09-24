'use strict';
// Optional conversations never modify quest milestones, inventory or checkpoints.
Meadow.Residents = {
  1:[
    {name:'桃桃',role:'果園園丁',kind:'cat',x:-25,z:10,color:0xd6a475,accent:0xb57064,place:'蘋果小園',lines:[['桃桃','我正把落下的蘋果分給鄰居。樹上的，留給明天。'],['小米','原來不是每顆蘋果，都要今天摘完。'],['桃桃','對呀。想做的事很多，就先照顧眼前這一件。']]},
    {name:'慢慢',role:'池邊畫家',kind:'turtle',x:25,z:12,color:0x95aa77,accent:0xb5bc86,place:'睡蓮畫亭',lines:[['慢慢','我畫了三次池塘，每次的倒影都不一樣。'],['小米','是你畫錯了嗎？'],['慢慢','不是喔，是風改變了水面。仔細看，就會有新發現。']]},
    {name:'啾啾',role:'野餐歌手',kind:'bird',x:0,z:31,color:0xe0bd66,accent:0x739cac,place:'風車野餐地',lines:[['啾啾','我把今天聽到的聲音，編進一首野餐歌。'],['小米','我的媽媽也會把我的名字唱進歌裡。'],['啾啾','那一定是一首，只有你們才知道的小小名曲。']]}
  ],
  2:[
    {name:'墨墨',role:'森林讀書人',kind:'cat',x:-25,z:9,color:0x8c9197,accent:0xb2a0c8,place:'樹蔭書屋',lines:[['墨墨','這本書的主角迷路了。我正在等她找到新朋友。'],['小米','你不先翻到最後一頁嗎？'],['墨墨','我想陪她走完中間那些，還不知道答案的日子。']]},
    {name:'苔苔',role:'苔蘚觀察員',kind:'turtle',x:25,z:13,color:0x7fa28b,accent:0x687f66,place:'苔蘚石庭',lines:[['苔苔','你聽，這邊的風聲像海，那邊像一把小刷子。'],['小米','我以為森林只有一種風聲。'],['苔苔','停一下再聽聽，安靜裡也有很多事情。']]},
    {name:'露露',role:'晨露收藏家',kind:'bird',x:1,z:31,color:0x98c4c9,accent:0xdbb56c,place:'晨露營地',lines:[['露露','我想收藏晨露，可是到了中午，它們就不見了。'],['小米','那不是很可惜嗎？'],['露露','所以我把它們畫下來。喜歡的東西，也能住在記憶裡。']]}
  ],
  3:[
    {name:'豆豆',role:'岸邊廚師',kind:'cat',x:-25,z:10,color:0xcbaa88,accent:0x719c93,place:'熱湯營地',lines:[['豆豆','這鍋湯多放了一把豆子。今天也許會有客人。'],['小米','你還不知道誰會來，就先煮好了？'],['豆豆','有人走了很遠的路，能喝到熱湯，我就很開心。']]},
    {name:'石石',role:'河岸記錄員',kind:'turtle',x:25,z:14,color:0x90a9a5,accent:0xa28b75,place:'河石展台',lines:[['石石','圓圓的河石以前也有尖角，是水慢慢磨平的。'],['小米','看起來很安靜，原來它走過好多地方。'],['石石','每顆石頭都有旅程，只是不急著說完。']]},
    {name:'帆帆',role:'紙船設計師',kind:'bird',x:0,z:31,color:0x9aafc6,accent:0xd6a477,place:'紙船工坊',lines:[['帆帆','我做了不會下水的紙船，放在桌上也能想像旅行。'],['小米','你的船想去哪裡？'],['帆帆','去每個有人等我回家的地方。你呢？'],['小米','我想去媽媽在的地方。']]}
  ],
  4:[
    {name:'眠眠',role:'月光茶師',kind:'cat',x:-25,z:6,color:0xb8a6bc,accent:0x858eaf,place:'月光茶席',lines:[['眠眠','夜裡的茶要慢慢吹，太著急會燙到舌頭。'],['小米','我心裡也有一件很著急的事。'],['眠眠','那就先吸一口氣。心裡留一點空位，才放得下勇氣。']]},
    {name:'圓圓',role:'星空畫家',kind:'turtle',x:25,z:13,color:0x8ba29f,accent:0xb2a0be,place:'星座畫台',lines:[['圓圓','同一群星星，有人看見船，有人看見一隻熊。'],['小米','我看起來像兩個牽著手的人。'],['圓圓','真好。星空也會記住，你心裡最在乎的樣子。']]},
    {name:'晚晚',role:'夜班信差',kind:'bird',x:-3,z:31,color:0xb4a1c6,accent:0xdbbd7f,place:'晚風郵亭',lines:[['晚晚','白天送信，晚上我就抬頭看看每扇亮著的窗。'],['小米','你在看誰還沒睡嗎？'],['晚晚','我在想，每一盞燈後面，會不會都有人等著一句「我回來了」。']]}
  ]
};

Meadow.Exploration = {
  expand(world,chapter){
    if(world.expanded)return;
    world.expanded=true;world.mapChapter=chapter;
    const A=Meadow.Art,root=world.root,colors=[0,0xa8b77c,0x739b84,0x90a39a,0x9393ae];
    // Enlarge the actual terrain and walk limits, without stretching characters or cutscenes.
    const ground=new THREE.Mesh(new THREE.CylinderGeometry(1,.985,1,96),A.material(colors[chapter]));
    ground.position.set(0,-.865,-1);ground.scale.set(45.5,1.6,50);ground.receiveShadow=true;root.add(ground);
    if(chapter===1)for(const m of root.children){if(m.isMesh&&m.position.z< -30&&m.scale.x>=9&&m.position.y===-1){m.position.x*=1.7;m.position.z-=32;}}
    if(chapter===2||chapter===3)this.river(world,chapter===2?-10.3:-11.4,chapter===2?-5.7:3.2,chapter===2?0x648e93:0x528eaa);
    if(chapter===2){for(let x=-39;x<=39;x+=1.3)if(Math.abs(x)>15)world.bush(x,-2.75,.8);}
    if(chapter===4){for(let x=-39;x<=39;x+=1.4)if(Math.abs(x)>13)A.part(root,'ball',0x85839f,[x,.37,-10.8],[.78,.56,.56]);}
    const routes=[[[0,11],[0,20],[0,31],[0,37]],[[-7,8],[-16,10],[-25,10],[-31,15]],[[8,9],[16,13],[25,13],[31,17]],[[-25,10],[-22,22],[0,26],[22,23],[25,13]]];
    if(chapter===1)routes.push([[-25,10],[-25,-4],[-22,-19],[0,-28],[23,-19],[25,13]],[[0,-14],[0,-28],[0,-37]]);
    routes.forEach(points=>world.path(points,2.2));
    world.residents=Meadow.Residents[chapter].map((data,i)=>{
      const npc={...data,id:`resident-${chapter}-${i}`};npc.mesh=this.character(root,npc);npc.label=world.label(npc.mesh,`${npc.name} · ${npc.role}`,2.6);npc.label.el.classList.add('chat-label');
      world.colliders.push({x:npc.x,z:npc.z,r:.45});
      this.restStop(world,npc,i);return npc;
    });
    const random=A.rng(940+chapter);
    for(let i=0;i<105;i++){
      const x=(random()-.5)*78,z=3+random()*36;
      if((x/39)**2+((z+1)/42)**2>.94||Math.hypot(x,z)<19||world.nearPath(x,z,2)||world.residents.some(n=>Math.hypot(x-n.x,z-n.z)<4.6))continue;
      if(i%3===0){
        if(chapter<=2)world.tree(x,z,.8+random()*.5,i%3);else world.tree(x,z,chapter===3?0x648584:0x737e9e);
      }else{
        const g=A.group(root,x,z);for(let j=0;j<3;j++)A.part(g,'ball',chapter===4?0xc2b6cf:0xc3caa0,[(j-1)*.19,.2,0],[.1,.28,.09],false);
      }
    }
    this.plantOuterMeadow(world,chapter);
    // Additional northern scenery is reachable in the meadow and after the river crossing.
    if(chapter===1||chapter===3){
      if(chapter===3)world.path([[0,-13],[0,-23],[-17,-27],[0,-34],[19,-25],[0,-23]],2);
      for(let i=0;i<15;i++){const a=i/14*Math.PI,x=Math.cos(a)*29,z=-18-Math.sin(a)*16;if(chapter===1)world.tree(x,z,.9,i%3);else world.tree(x,z);}
    }
  },
  plantOuterMeadow(world,chapter){
    const A=Meadow.Art,random=A.rng(301+chapter),positions=[];
    for(let i=0;i<1800;i++){
      const x=(random()-.5)*78,z=(random()-.5)*78+2;
      if(Math.hypot(x,z)<19||!world.canWalk(x,z)||world.nearPath(x,z,.75)||world.residents.some(n=>Math.hypot(x-n.x,z-n.z)<3.6))continue;
      positions.push({x,z});
    }
    // Hundreds of plants share two draw calls, keeping the bigger map light on phones.
    const stems=new THREE.InstancedMesh(A.geometries.cone,A.material(chapter===4?0xb2aec1:0x819c71),positions.length);
    const blooms=new THREE.InstancedMesh(A.geometries.ball,A.material(0xffffff),positions.length);
    const dummy=new THREE.Object3D(),palette=chapter===4?[0xdfd0e4,0xc6badb,0xf0d49a]:chapter===2?[0xb9d8c0,0xd9c6db,0xd1dca5]:[0xf4d58e,0xe4bca9,0xebe4bd];
    positions.forEach(({x,z},i)=>{
      const height=.18+random()*.18;dummy.position.set(x,height/2-.03,z);dummy.scale.set(.09,height,.09);dummy.rotation.set(0,random()*6,.15);dummy.updateMatrix();stems.setMatrixAt(i,dummy.matrix);
      dummy.position.y=height;dummy.scale.set(.10,.065,.10);dummy.updateMatrix();blooms.setMatrixAt(i,dummy.matrix);blooms.setColorAt(i,new THREE.Color(palette[i%palette.length]).convertSRGBToLinear());
    });
    stems.receiveShadow=blooms.receiveShadow=true;world.root.add(stems,blooms);
  },
  river(world,from,to,color){
    const vertices=[],indices=[];
    for(let i=0;i<=16;i++){const z=from+(to-from)*i/16,x=45.5*Math.sqrt(1-((z+1)/50)**2);vertices.push(-x,.021,z,x,.021,z);if(i<16){const n=i*2;indices.push(n,n+2,n+1,n+1,n+2,n+3);}}
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();world.root.add(new THREE.Mesh(geometry,Meadow.Art.material(color)));
  },
  character(root,npc){
    const A=Meadow.Art,g=A.group(root,npc.x,npc.z),body=A.group(g);npc.body=body;
    A.part(body,'ball',npc.color,[0,.73,0],[.48,.65,.38]);
    A.part(body,'ball',npc.color,[0,1.53,.08],[.48,.43,.38]);
    for(const s of [-1,1]){
      A.part(body,'ball',0x384741,[s*.18,1.58,.425],[.045,.06,.025]);
      A.part(body,'ball',npc.color,[s*.29,.16,.14],[.2,.14,.28]);
      A.part(body,'ball',npc.color,[s*.46,.81,.08],[.14,.33,.18]);
      if(npc.kind==='cat')A.part(body,'cone',npc.color,[s*.31,1.97,.01],[.2,.5,.17]);
    }
    if(npc.kind==='turtle'){
      A.part(body,'ball',npc.accent,[0,.75,-.3],[.63,.64,.4]);
      for(const s of [-1,1])A.part(body,'box',0x647b69,[s*.23,.78,-.68],[.035,.65,.035]);
    }else if(npc.kind==='bird'){
      const beak=A.part(body,'cone',0xd6aa61,[0,1.42,.53],[.17,.35,.14]);beak.rotation.x=Math.PI/2;
      A.part(body,'cone',npc.accent,[0,2.02,.03],[.13,.32,.12]);
    }else{
      const tail=A.part(body,'ball',npc.color,[.48,.58,-.34],[.17,.64,.17]);tail.rotation.z=-.6;
      A.part(body,'ball',0x8c6864,[0,1.4,.47],[.07,.05,.035]);
    }
    A.part(body,'cylinder',npc.accent,[0,1.16,.03],[.37,.14,.33]);
    A.part(body,'box',npc.accent,[-.2,.91,.4],[.17,.46,.055]);
    return g;
  },
  restStop(world,npc,index){
    const A=Meadow.Art,g=A.group(world.root,npc.x,npc.z);
    A.disk(g,world.mapChapter===4?0xb1a8b8:0xb6ba91,0,0,3.4,2.8,.01);
    const bench=A.group(g,-2,1.4);A.part(bench,'box',0xb7a17a,[0,.5,0],[1.6,.15,.6]);
    for(const x of [-.6,.6])A.part(bench,'box',0x8c8166,[x,.25,0],[.12,.5,.45]);
    world.colliders.push({x:npc.x-2,z:npc.z+1.4,r:.85});
    const table=A.group(g,1.8,-1.1);A.part(table,'cylinder',0xa08b6a,[0,.48,0],[.16,.96,.16]);A.part(table,'box',0xd2bb90,[0,1,0],[1.4,.12,1]);
    world.colliders.push({x:npc.x+1.8,z:npc.z-1.1,r:.85});
    if(index===0){
      if(world.mapChapter===2){for(let i=0;i<3;i++)A.part(table,'box',[0xb5a1c5,0x92ab9b,0xd6bc89][i],[0,1.13+i*.13,0],[.8,.12,.6]);}
      else if(world.mapChapter>=3){A.part(table,'cylinder',0x8c9696,[0,1.21,0],[.33,.3,.33]);A.disk(table,0xdebb72,0,0,.29,.29,1.37);for(const x of [-.5,.5])A.part(table,'cylinder',0xe4d5b6,[x,1.17,.12],[.12,.19,.12]);}
      else for(let i=0;i<3;i++)A.part(table,'ball',0xd5a970,[(i-1)*.32,1.2,.08],[.15,.17,.15]);
    }
    else if(index===1){const paper=A.part(table,'box',0xf1e3c2,[0,1.08,0],[1,.025,.75]);paper.rotation.y=.12;A.part(table,'ball',0x809bb4,[.2,1.12,0],[.19,.02,.15]);}
    else{const sail=A.part(table,'cone',0xeee2bc,[0,1.38,0],[.3,.55,.08]);sail.rotation.z=-.2;A.part(table,'box',0x9b9eb6,[0,1.15,0],[.7,.15,.25]);}
    const sign=A.group(g,-2.6,-1.5);A.part(sign,'cylinder',0x978166,[0,.7,0],[.06,1.4,.06]);A.part(sign,'box',0xe1d1aa,[0,1.25,0],[1.5,.42,.1]);
    const label=world.label(sign,npc.place,1.8);npc.placeLabel=label;label.el.classList.add('trail-label');
    // Landmarks beside the stopping places make the larger map recognisable.
    if(index===0){for(const s of [-1,1]){const tree=A.group(g,s*3.4,-3);A.part(tree,'cylinder',0x8f7d62,[0,1.3,0],[.18,2.6,.18]);A.part(tree,'ball',npc.accent,[0,2.7,0],[1.3,1.2,1.1]);world.colliders.push({x:npc.x+s*3.4,z:npc.z-3,r:.3});}}
    if(index===1){A.disk(g,0x9fc4c5,4,1,1.6,1.15,.035);world.colliders.push({x:npc.x+4,z:npc.z+1,r:1.6});}
    if(index===2){const tent=A.part(g,'cone',npc.accent,[0,1.2,-3.5],[2,2.4,1.7]);tent.rotation.y=Math.PI/4;world.colliders.push({x:npc.x,z:npc.z-3.5,r:1.7});}
  },
  update(world,time,player,state,reduced){
    const visible=state.mode==='playing'||state.mode==='dialogue';
    for(const npc of world.residents||[]){
      const p=player.mesh.position,d=Math.hypot(npc.x-p.x,npc.z-p.z);
      npc.label.enabled=visible&&d<4;npc.placeLabel.enabled=visible&&d<15&&d>5;
      if(visible&&d<10)npc.mesh.rotation.y=Math.atan2(p.x-npc.x,p.z-npc.z);
      if(state.mode!=='paused')npc.body.position.y=reduced?0:Math.sin(time*1.7+npc.x)*.025;
    }
  }
};
