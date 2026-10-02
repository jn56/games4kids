'use strict';
// Optional resident stories use their own save fields; they never unlock main-story gates.
Meadow.SideStories={
  stories:[
    {title:'沒寫名字的野餐畫',reward:'一家人的野餐畫',
      begin:['我找到一幅沒署名的野餐畫，角落畫著一把藍傘。','池邊的慢慢也許認得。願意散步時幫我問問嗎？'],
      middle:['這是啾啾小時候和奶奶野餐的地方！','請告訴南邊的啾啾：藍傘下，還留著一個位置。'],
      end:['那是奶奶等我的位置！我以為這幅畫弄丟了。','請替我謝謝桃桃。我想邀她一起野餐，不讓那個位置空著。'],
      finish:['原來畫裡留著一份想念。謝謝你把故事送回去。','我們一起畫了張小小副本，收進你的旅途回憶吧。'],
      secret:['偷偷告訴你：畫裡的太陽，其實是奶奶畫歪的煎蛋！','她說，野餐的天空也該香噴噴的。']},
    {title:'森林裡的晚安聲',reward:'晚安風鈴譜',
      begin:['書裡夾著半首晚安歌：「風走過樹梢……」','東邊的苔苔最會聽森林，請他聽聽後半句吧。'],
      middle:['風鈴後還有滴答聲，像晨露掉在葉子上。','到南邊找露露，她常哼這個旋律。'],
      end:['「我把想念輕輕放好。」是姐姐教我的後半句。','把這句帶給墨墨吧。住得遠，也能唱同一首晚安歌。'],
      finish:['歌終於完整了！我把旋律記成一張晚安風鈴譜。','有些陪伴聽不見腳步，卻能在心裡留下聲音。'],
      secret:['姐姐最早唱的是「我把襪子輕輕放好」。','因為我總把襪子丟在床上！後來才改成想念。']},
    {title:'漂回來的紙船',reward:'平安紙船',
      begin:['我撿到一艘紙船，上面只寫著「今天也平安」。','請問問東邊的石石，河上還有沒有這樣的船？'],
      middle:['我看過相同的折痕，船頭還有一顆小星星。','南邊的帆帆折船時，也會留下這顆星。'],
      end:['那是我和哥哥約好的平安船。他在上游照顧外婆。','請告訴豆豆：哥哥平安，我也會寫信回去。'],
      finish:['短短一句平安，就能讓等消息的人鬆一口氣。','帆帆送來一艘紀念紙船，謝謝你幫消息找到家。'],
      secret:['星星其實能打開，裡面畫著哥哥最怕的青蛙。','這是我們約好的暗號：看到就知道是彼此。']},
    {title:'留給晚歸人的燈',reward:'窗邊星燈圖',
      begin:['我想替夜裡回家的人留盞燈，卻不知道畫什麼。','東邊的圓圓看了好多星星，也許能幫忙。'],
      middle:['畫兩顆靠近的星星吧，一顆等候，一顆回家。','請問問南邊的晚晚，誰最需要看見這盞燈？'],
      end:['巡林員常忙到很晚，他的家人總在窗邊留燈。','告訴眠眠，燈上可以寫：「晚一點也沒關係，平安回來。」'],
      finish:['星燈畫好了，就放在窗邊，陪大家走完最後一段路。','這張星燈圖送給你。回家有時就是一句簡單的問候。'],
      secret:['郵差的小祕密：我曾把自己的晚餐當信送出去。','收件人回送一封信，裡面寫著「湯很好喝」！']}
  ],
  appendJournal(g){
    const notes=[];
    this.stories.forEach((story,i)=>{const stage=g.state.sideStories[i];if(!stage)return;
      const cast=Meadow.Residents[i+1],next=[0,1,2,0][stage];
      notes.push({name:'旅途小事',text:stage===4?'已收藏：'+story.reward+(g.state.sideSecrets[i]?'（彩蛋也找到了）':'。再找'+cast[2].name+'聊聊。'):'「'+story.title+'」：下一站找'+cast[next].name+'（'+cast[next].place+'）。'});
    });
    Meadow.FamilyStories.stories.forEach((story,i)=>{
      const stage=g.state.familyStories[i];if(!stage)return;
      notes.push({name:'旅途小事',text:stage>=3?'已收藏：'+story.title+'。回去找兩位朋友，還有小祕密。':'「'+story.title+'」：下一站找'+Meadow.Residents[i+1][4].name+'。'});
    });
    if(!notes.length)return;
    if(g.state.mode==='dialogue')g.dialogue.show([...g.dialogue.lines,...notes]);
    else if(g.state.mode==='puzzle'){const section=document.createElement('section'),heading=document.createElement('h3');heading.textContent='旅途小事';section.append(heading);notes.forEach(note=>{const p=document.createElement('p');p.textContent=note.text;section.append(p);});document.getElementById('puzzle-stage').append(section);}
  },
  talk(g,npc){
    const c=g.state.chapter-1,index=g.world.residents.indexOf(npc),story=this.stories[c],stage=g.state.sideStories[c];
    if(index>2){Meadow.FamilyStories.talk(g,npc,index);return;}
    const cast=g.world.residents,expected=[0,1,2,0][stage];let lines=npc.lines.map(([name,text])=>({name,text})),advance=false,egg=false;
    if(stage<4&&index===expected){
      const part=[story.begin,story.middle,story.end,story.finish][stage];
      lines=(stage===0?lines:[]).concat(part.map(text=>({name:npc.name,text})));advance=true;
    }else if(stage>0&&stage<4&&index===0){
      lines=[{name:npc.name,text:'「'+story.title+'」還差一點：去找'+cast[expected].name+'聊聊，再回來告訴我吧。'}];
    }else if(stage===4&&index===0){
      lines=[{name:npc.name,text:'「'+story.reward+'」已經收進你的旅途回憶。謝謝你！'},{name:npc.name,text:'再去找'+cast[2].name+'聊聊吧，好像還藏了一個小祕密。'}];
    }else if(stage===4&&index===2){lines=story.secret.map(text=>({name:npc.name,text}));egg=true;}
    g.dialogue.show(lines,()=>{
      if(advance){g.state.sideStories[c]=stage+1;g.saveProgress();g.refresh();g.audio.chime();g.toast(stage===3?'旅途回憶：'+story.reward:'小支線：'+story.title+' · 下一站 '+cast[[1,2,0][stage]].name);}
      if(egg&&!g.state.sideSecrets[c]){g.state.sideSecrets[c]=true;g.saveProgress();g.toast('發現彩蛋：'+story.title);}
    });
  }
};
