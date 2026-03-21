import { useState, useEffect, useCallback, useMemo } from "react";

const POSITIONS = ["탑","정글","미드","원딜","서폿"];
const PI = {"탑":"⚔️","정글":"🌿","미드":"🔮","원딜":"🏹","서폿":"🛡️"};
const PC = {"탑":"#e84057","정글":"#2daf7f","미드":"#5383e8","원딜":"#e8a33d","서폿":"#9b59b6"};

const INIT_TEAMS = [
  {name:"1팀",members:[{realName:"임장혁",pos:"탑",nickname:""},{realName:"한서우",pos:"정글",nickname:""},{realName:"강세형",pos:"미드",nickname:""},{realName:"윤지후",pos:"원딜",nickname:""},{realName:"김연수",pos:"서폿",nickname:""}]},
  {name:"2팀",members:[{realName:"박시우",pos:"탑",nickname:""},{realName:"신민철",pos:"정글",nickname:""},{realName:"김민후",pos:"미드",nickname:""},{realName:"김건민",pos:"원딜",nickname:""},{realName:"황정호",pos:"서폿",nickname:""}]},
  {name:"3팀",members:[{realName:"김민관",pos:"탑",nickname:""},{realName:"이기웅",pos:"정글",nickname:""},{realName:"강경무",pos:"미드",nickname:""},{realName:"최주혁",pos:"원딜",nickname:""},{realName:"권민성",pos:"서폿",nickname:""}]},
  {name:"4팀",members:[{realName:"최우진",pos:"탑",nickname:""},{realName:"황동건",pos:"정글",nickname:""},{realName:"한서진",pos:"미드",nickname:""},{realName:"김영광",pos:"원딜",nickname:""},{realName:"최승재",pos:"서폿",nickname:""}]},
  {name:"5팀",members:[{realName:"성윤",pos:"탑",nickname:""},{realName:"박진우",pos:"정글",nickname:""},{realName:"박정훈",pos:"미드",nickname:""},{realName:"안준모",pos:"원딜",nickname:""},{realName:"차예준",pos:"서폿",nickname:""}]},
  {name:"6팀",members:[{realName:"김승우",pos:"탑",nickname:""},{realName:"김민찬",pos:"정글",nickname:""},{realName:"김태건",pos:"미드",nickname:""},{realName:"노경우",pos:"원딜",nickname:""},{realName:"이세경",pos:"서폿",nickname:""}]},
];

const fD=d=>{const w=["일","월","화","수","목","금","토"];return`${d.getMonth()+1}/${d.getDate()}(${w[d.getDay()]})`};
const fT=h=>`${h<12?"오전":"오후"} ${h===0?12:h>12?h-12:h}시`;
const dS=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const gWE=(w=4)=>{const r=[],n=new Date();n.setHours(0,0,0,0);for(let i=0;i<w*7;i++){const d=new Date(n);d.setDate(n.getDate()+i);if(d.getDay()===0||d.getDay()===6)r.push(d)}return r};
const dn=m=>m.nickname?`${m.realName} (${m.nickname})`:m.realName;
const aM=t=>{const r=[];(Array.isArray(t)?t:[]).forEach(tm=>(Array.isArray(tm.members)?tm.members:[]).forEach(m=>r.push({...m,team:tm.name})));return r};

// 데이터 정규화 - 빈 배열/깨진 데이터 방어
const fixTeams=data=>{
  if(!data||!Array.isArray(data))return INIT_TEAMS;
  return data.map(t=>({...t,members:Array.isArray(t.members)?t.members:[]}));
};
const fixMatches=data=>{
  if(!data)return[];
  if(!Array.isArray(data))return Object.values(data);
  return data;
};
const fixSched=data=>{
  if(!data||typeof data!=="object")return{};
  const out={};
  Object.entries(data).forEach(([k,v])=>{if(Array.isArray(v)&&v.length>0)out[k]=v});
  return out;
};

export default function App(){
  const[teams,setTeams]=useState(INIT_TEAMS);
  const[sched,setSched]=useState({});
  const[matches,setMatches]=useState([]);
  const[loaded,setLoaded]=useState(false);
  const[user,setUser]=useState(null);
  const[loginName,setLoginName]=useState("");
  const[setupMode,setSetupMode]=useState(false);
  const[setupNick,setSetupNick]=useState("");
  const[setupPos,setSetupPos]=useState("미드");
  const[tab,setTab]=useState("schedule");
  const[anim,setAnim]=useState(true);
  const[toast,setToast]=useState("");
  const[editField,setEditField]=useState(null);
  const[editVal,setEditVal]=useState("");
  const[selSlots,setSelSlots]=useState([]);
  const[modal,setModal]=useState(false);
  const[mDate,setMDate]=useState("");
  const[mTime,setMTime]=useState("20");
  const[mBlue,setMBlue]=useState([null,null,null,null,null]);
  const[mRed,setMRed]=useState([null,null,null,null,null]);
  const[pickSide,setPickSide]=useState(null);
  const[detSlot,setDetSlot]=useState(null);

  useEffect(()=>{(async()=>{
    try{const r=await window.storage.get("ec4-teams");if(r)setTeams(fixTeams(JSON.parse(r.value)))}catch{}
    try{const r=await window.storage.get("ec4-sched");if(r)setSched(fixSched(JSON.parse(r.value)))}catch{}
    try{const r=await window.storage.get("ec4-match");if(r)setMatches(fixMatches(JSON.parse(r.value)))}catch{}
    setLoaded(true);
  })()},[]);

  const persist=useCallback(async(t,s,m)=>{
    try{await window.storage.set("ec4-teams",JSON.stringify(t))}catch{}
    try{await window.storage.set("ec4-sched",JSON.stringify(s))}catch{}
    try{await window.storage.set("ec4-match",JSON.stringify(m))}catch{}
  },[]);

  const flash=msg=>{setToast(msg);setTimeout(()=>setToast(""),2500)};
  const go=t=>{setAnim(false);setTimeout(()=>{setTab(t);setAnim(true);setDetSlot(null)},140)};
  const isAdmin=user?.isAdmin;
  const members=useMemo(()=>aM(teams),[teams]);
  const findMb=n=>members.find(m=>m.realName===n);
  const myMb=user&&!user.isAdmin?findMb(user.name):null;
  const weekends=gWE(4);
  const hours=[12,13,14,15,16,17,18,19,20,21,22,23];
  const slotMb=k=>sched[k]||[];

  // ADMIN: 데이터 초기화
  const resetAllData=()=>{
    setTeams(INIT_TEAMS);setSched({});setMatches([]);
    persist(INIT_TEAMS,{},[]);
    flash("모든 데이터가 초기화되었습니다");
  };

  const handleLogin=()=>{
    const name=loginName.trim();
    if(!name){flash("이름을 입력해주세요");return}
    if(name==="admin"){setUser({name:"admin",isAdmin:true});setTab("teams");flash("관리자 모드");return}
    const found=members.find(m=>m.realName===name);
    if(found){
      if(!found.nickname){setSetupMode(true);setSetupNick("");setSetupPos(found.pos)}
      else{setUser({name,isAdmin:false});flash(`${dn(found)}님, 환영합니다!`)}
    }else{setSetupMode(true);setSetupNick("");setSetupPos("미드")}
  };
  const handleSetup=()=>{
    const name=loginName.trim();let found=false;
    const nt=teams.map(t=>({...t,members:(t.members||[]).map(m=>{if(m.realName===name){found=true;return{...m,nickname:setupNick,pos:setupPos}}return m})}));
    if(!found){const li=nt.length-1;nt[li]={...nt[li],members:[...(nt[li].members||[]),{realName:name,pos:setupPos,nickname:setupNick}]};}
    setTeams(nt);persist(nt,sched,matches);setSetupMode(false);setUser({name,isAdmin:false});flash(`${setupNick?`${name} (${setupNick})`:name}님, 환영합니다!`);
  };
  const logout=()=>{setUser(null);setLoginName("");setSetupMode(false);setTab("schedule");setSelSlots([])};

  const saveField=(ti,mi,field,val)=>{
    const nt=teams.map((t,i)=>i===ti?{...t,members:(t.members||[]).map((m,j)=>j===mi?{...m,[field]:val}:m)}:t);
    setTeams(nt);persist(nt,sched,matches);setEditField(null);flash("저장됨");
  };
  const moveMember=(fromTi,mi,toTi)=>{
    if(fromTi===toTi)return;
    const nt=teams.map(t=>({...t,members:[...(t.members||[])]}));
    const[member]=nt[fromTi].members.splice(mi,1);
    nt[toTi].members.push(member);
    setTeams(nt);persist(nt,sched,matches);flash(`${member.realName} → ${nt[toTi].name}`);
  };
  const saveMyNick=nick=>{const nt=teams.map(t=>({...t,members:(t.members||[]).map(m=>m.realName===user.name?{...m,nickname:nick}:m)}));setTeams(nt);persist(nt,sched,matches);setEditField(null);flash("닉네임 저장됨")};
  const saveMyPos=pos=>{const nt=teams.map(t=>({...t,members:(t.members||[]).map(m=>m.realName===user.name?{...m,pos}:m)}));setTeams(nt);persist(nt,sched,matches);flash("포지션 변경됨")};

  const toggleSlot=(ds,h)=>{const k=`${ds}_${h}`;setSelSlots(p=>p.includes(k)?p.filter(x=>x!==k):[...p,k])};
  const submitSched=()=>{if(!selSlots.length){flash("시간을 선택해주세요");return}const ns={...sched};selSlots.forEach(k=>{if(!ns[k])ns[k]=[];if(!ns[k].includes(user.name))ns[k].push(user.name)});setSched(ns);persist(teams,ns,matches);setSelSlots([]);flash("일정 등록됨")};
  const clearMy=()=>{const ns={...sched};Object.keys(ns).forEach(k=>{ns[k]=ns[k].filter(n=>n!==user.name);if(!ns[k].length)delete ns[k]});setSched(ns);persist(teams,ns,matches);flash("일정 초기화됨")};
  const clearAll=()=>{setSched({});persist(teams,{},matches);flash("전체 일정 초기화됨")};
  const bestSlots=()=>Object.entries(sched).map(([k,v])=>({slot:k,count:v.length,members:v})).filter(e=>e.count>=5).sort((a,b)=>b.count-a.count).slice(0,8);

  const openModal=()=>{setMDate(dS(weekends[0]));setMTime("20");setMBlue([null,null,null,null,null]);setMRed([null,null,null,null,null]);setPickSide(null);setModal(true)};
  const allPicked=()=>[...mBlue,...mRed].filter(Boolean).map(p=>p.name);
  const assignPlayer=(name)=>{if(!pickSide)return;const entry={name,pos:POSITIONS[pickSide.idx]};if(pickSide.side==="blue"){const n=[...mBlue];n[pickSide.idx]=entry;setMBlue(n)}else{const n=[...mRed];n[pickSide.idx]=entry;setMRed(n)}setPickSide(null)};
  const removeSlot=(side,idx)=>{if(side==="blue"){const n=[...mBlue];n[idx]=null;setMBlue(n)}else{const n=[...mRed];n[idx]=null;setMRed(n)}};
  const createMatch=()=>{
    const bp=mBlue.filter(Boolean),rp=mRed.filter(Boolean);
    if(bp.length+rp.length<4){flash("최소 4명 이상 배치해주세요");return}
    const nm=[...matches,{id:Date.now(),date:mDate,time:+mTime,blue:mBlue,red:mRed}];
    setMatches(nm);persist(teams,sched,nm);setModal(false);flash("내전 등록됨!");
  };
  const delMatch=id=>{const nm=matches.filter(m=>m.id!==id);setMatches(nm);persist(teams,sched,nm);flash("삭제됨")};
  const updateMatchPos=(matchId,side,idx,newPos)=>{
    const nm=matches.map(m=>{if(m.id!==matchId)return m;const clone={...m,[side]:[...m[side]]};if(clone[side][idx])clone[side][idx]={...clone[side][idx],pos:newPos};return clone;});
    setMatches(nm);persist(teams,sched,nm);flash("포지션 변경됨");
  };

  if(!loaded)return<div style={S.load}><div style={S.spin}/></div>;

  if(!user)return(
    <div style={S.root}><style>{CSS}</style>
      <div style={S.loginWrap}><div style={S.loginCard}>
        <div style={{fontSize:48,marginBottom:8}}>🎮</div>
        <h1 style={S.loginTitle}>e스포츠 클럽 일정 관리</h1>
        <p style={S.loginSub}>이름을 입력하여 로그인하세요</p>
        {!setupMode?(<div style={S.loginForm}>
          <input value={loginName} onChange={e=>setLoginName(e.target.value)} placeholder="이름 입력" style={S.loginInput} onKeyDown={e=>e.key==="Enter"&&handleLogin()} autoFocus/>
          <button onClick={handleLogin} style={S.loginBtn}>로그인</button>
        </div>):(<div style={S.loginForm}>
          <div style={S.setupHdr}><span style={{fontSize:16,fontWeight:700,color:"#f0e6d2"}}>{loginName.trim()}</span><span style={S.setupTag}>초기 설정</span></div>
          <div><label style={S.lab}>닉네임 (소환사명)</label><input value={setupNick} onChange={e=>setSetupNick(e.target.value)} placeholder="닉네임" style={S.loginInput} autoFocus/></div>
          <div><label style={S.lab}>주 포지션</label><div style={S.posRow}>{POSITIONS.map(p=><button key={p} onClick={()=>setSetupPos(p)} style={{...S.posBtn,...(setupPos===p?{borderColor:PC[p],background:PC[p]+"20",color:PC[p]}:{})}}>{PI[p]} {p}</button>)}</div></div>
          <div style={{display:"flex",gap:8,marginTop:8}}><button onClick={()=>setSetupMode(false)} style={S.gho}>뒤로</button><button onClick={handleSetup} style={{...S.loginBtn,flex:1}}>완료</button></div>
        </div>)}
      </div></div>
      {toast&&<div style={S.toast}>{toast}</div>}
    </div>
  );

  const navItems=isAdmin
    ?[{id:"teams",l:"인원 관리",i:"👥"},{id:"schedule",l:"일정 현황",i:"📊"},{id:"matches",l:"내전 관리",i:"🏆"}]
    :[{id:"myinfo",l:"내 정보",i:"👤"},{id:"schedule",l:"일정 등록",i:"📅"},{id:"overview",l:"일정 현황",i:"📊"},{id:"matches",l:"내전 목록",i:"🏆"}];

  return(
    <div style={S.root}><style>{CSS}</style>
      <header style={S.hdr}><div style={S.hdrIn}>
        <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:20}}>🎮</span><h1 style={S.logoT}>e스포츠 클럽</h1></div>
        <nav style={S.nav}>{navItems.map(t=><button key={t.id} onClick={()=>go(t.id)} style={{...S.nb,...(tab===t.id?S.nbA:{})}}><span style={{marginRight:3}}>{t.i}</span>{t.l}</button>)}</nav>
        <div style={S.uArea}><span style={S.uBadge}>{isAdmin?"🔧 관리자":`${PI[myMb?.pos]||"👤"} ${dn(myMb||{realName:user.name,nickname:""})}`}</span><button onClick={logout} style={S.logoutBtn}>로그아웃</button></div>
      </div></header>

      <main style={{...S.main,animation:anim?"fi .3s ease":"fo .14s ease"}}>

        {tab==="myinfo"&&!isAdmin&&myMb&&<div>
          <div style={S.sh}><h2 style={S.st}>👤 내 정보</h2></div>
          <div style={S.myCard}>
            <div style={S.myRow}><span style={S.myL}>이름</span><span style={S.myV}>{myMb.realName}</span></div>
            <div style={S.myRow}><span style={S.myL}>소속팀</span><span style={S.myV}>{myMb.team}</span></div>
            <div style={S.myRow}><span style={S.myL}>닉네임</span>
              {editField==="myNick"?<span style={S.ie}><input value={editVal} onChange={e=>setEditVal(e.target.value)} style={S.eIn} autoFocus onKeyDown={e=>{if(e.key==="Enter")saveMyNick(editVal);if(e.key==="Escape")setEditField(null)}}/><button onClick={()=>saveMyNick(editVal)} style={S.okB}>✓</button><button onClick={()=>setEditField(null)} style={S.noB}>✕</button></span>
              :<span style={S.myEdit} onClick={()=>{setEditField("myNick");setEditVal(myMb.nickname)}}>{myMb.nickname||"닉네임 설정 +"}</span>}</div>
            <div style={S.myRow}><span style={S.myL}>포지션</span><div style={S.posRow}>{POSITIONS.map(p=><button key={p} onClick={()=>saveMyPos(p)} style={{...S.posBtn,...(myMb.pos===p?{borderColor:PC[p],background:PC[p]+"20",color:PC[p]}:{})}}>{PI[p]} {p}</button>)}</div></div>
            <div style={{...S.myRow,borderBottom:"none"}}><span style={S.myL}>내 일정</span><span style={S.myV}>{Object.values(sched).filter(v=>v.includes(user.name)).length}개 등록</span></div>
          </div>
        </div>}

        {tab==="teams"&&isAdmin&&<div>
          <div style={{...S.sh,display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
            <div><h2 style={S.st}>👥 인원 · 팀 관리</h2><p style={S.sd}>이름·닉네임 클릭 수정 / 드롭다운으로 팀 이동</p></div>
            <button onClick={resetAllData} style={S.dan}>🔄 전체 데이터 초기화</button>
          </div>
          <div style={S.tg}>{teams.map((team,ti)=><div key={ti} style={S.tc}>
            <div style={S.thd}><span style={S.tBd}>{ti+1}</span><span style={S.tNm}>{team.name}</span><span style={S.tCn}>{(team.members||[]).length}명</span></div>
            {(team.members||[]).length===0?<div style={{padding:"16px",textAlign:"center",color:"#5b5a56",fontSize:12}}>멤버가 없습니다</div>
            :(team.members||[]).map((m,mi)=><div key={mi} style={S.mr}>
              <select value={m.pos} onChange={e=>saveField(ti,mi,"pos",e.target.value)} style={{...S.pSl,color:PC[m.pos]}}>{POSITIONS.map(p=><option key={p} value={p}>{PI[p]} {p}</option>)}</select>
              <div style={S.mI}>
                {editField===`n${ti}${mi}`?<span style={S.ie}><input value={editVal} onChange={e=>setEditVal(e.target.value)} style={S.eIn} autoFocus onKeyDown={e=>{if(e.key==="Enter")saveField(ti,mi,"realName",editVal);if(e.key==="Escape")setEditField(null)}}/><button onClick={()=>saveField(ti,mi,"realName",editVal)} style={S.okB}>✓</button><button onClick={()=>setEditField(null)} style={S.noB}>✕</button></span>
                :<span style={S.nm} onClick={()=>{setEditField(`n${ti}${mi}`);setEditVal(m.realName)}}>{m.realName}</span>}
                {editField===`k${ti}${mi}`?<span style={S.ie}><input value={editVal} onChange={e=>setEditVal(e.target.value)} style={{...S.eIn,width:110}} placeholder="닉네임" autoFocus onKeyDown={e=>{if(e.key==="Enter")saveField(ti,mi,"nickname",editVal);if(e.key==="Escape")setEditField(null)}}/><button onClick={()=>saveField(ti,mi,"nickname",editVal)} style={S.okB}>✓</button><button onClick={()=>setEditField(null)} style={S.noB}>✕</button></span>
                :<span style={{...S.nk,...(m.nickname?{color:"#c8aa6e",borderColor:"#46371444"}:{})}} onClick={()=>{setEditField(`k${ti}${mi}`);setEditVal(m.nickname)}}>{m.nickname||"+ 닉네임"}</span>}
              </div>
              <select value={ti} onChange={e=>moveMember(ti,mi,+e.target.value)} style={S.mvSl}>{teams.map((t2,i2)=><option key={i2} value={i2}>{t2.name}</option>)}</select>
            </div>)}
          </div>)}</div>
        </div>}

        {tab==="schedule"&&!isAdmin&&<div>
          <div style={S.sh}><h2 style={S.st}>📅 일정 등록</h2><p style={S.sd}>가능한 주말 시간을 클릭하세요</p></div>
          <div style={{marginBottom:14}}><span style={S.selB}>{PI[myMb?.pos]||""} {dn(myMb||{realName:user.name,nickname:""})}</span>{selSlots.length>0&&<span style={{fontSize:12,color:"#c8aa6e",marginLeft:10}}>{selSlots.length}개 선택</span>}</div>
          {renderCal(true)}
          <div style={S.schAct}><button onClick={submitSched} style={S.pri} disabled={!selSlots.length}>일정 등록하기</button><button onClick={clearMy} style={S.gho}>내 일정 초기화</button></div>
        </div>}

        {tab==="schedule"&&isAdmin&&<div>
          <div style={S.sh}><h2 style={S.st}>📊 전체 일정 현황</h2></div>
          {renderBest()}
          <h3 style={{...S.sub,marginTop:28}}>📋 전체 캘린더</h3>{renderCal(false)}
          <div style={{textAlign:"center",marginTop:24}}><button onClick={clearAll} style={S.dan}>전체 일정 초기화</button></div>
        </div>}

        {tab==="overview"&&!isAdmin&&<div>
          <div style={S.sh}><h2 style={S.st}>📊 일정 현황</h2></div>
          {renderBest()}
          <h3 style={{...S.sub,marginTop:28}}>📋 전체 캘린더</h3>{renderCal(false)}
        </div>}

        {tab==="matches"&&<div>
          <div style={{...S.sh,display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
            <div><h2 style={S.st}>🏆 {isAdmin?"내전 관리":"내전 목록"}</h2></div>
            {isAdmin&&<button onClick={openModal} style={{...S.pri,fontSize:13}}>+ 내전 등록</button>}
          </div>
          {!matches.length?<div style={S.empty}><p style={{fontSize:44,marginBottom:8}}>🏆</p><p style={{color:"#5b5a56"}}>등록된 내전이 없습니다</p></div>
          :<div style={{display:"flex",flexDirection:"column",gap:16}}>
            {[...matches].reverse().map(match=>{
              const d=new Date(match.date);const imB=(match.blue||[]).some(p=>p&&p.name===user.name);const imR=(match.red||[]).some(p=>p&&p.name===user.name);const tot=[...(match.blue||[]),...(match.red||[])].filter(Boolean).length;
              return<div key={match.id} style={{...S.mCard,...(imB||imR?{borderColor:imB?"#5383e8":"#e84057"}:{})}}>
                <div style={S.mHd}><div><div style={{fontSize:16,fontWeight:700,color:"#f0e6d2"}}>{fD(d)} {fT(match.time)}</div><div style={{fontSize:11,color:"#5b5a56",marginTop:2}}>{tot}명 참가{(imB||imR)&&<span style={{color:imB?"#5383e8":"#e84057"}}> · {imB?"블루":"레드"}팀</span>}</div></div>{isAdmin&&<button onClick={()=>delMatch(match.id)} style={S.delB}>삭제</button>}</div>
                <div style={S.matchBody}>
                  <div style={S.sideCol}><div style={{...S.sideLabel,color:"#5383e8",borderColor:"#5383e844"}}>🔷 블루팀</div>{POSITIONS.map((pos,idx)=>{const p=(match.blue||[])[idx];return<div key={idx} style={S.slotRow}><span style={{...S.slotPos,color:PC[pos]}}>{PI[pos]}</span>{isAdmin&&p?<select value={p.pos||pos} onChange={e=>updateMatchPos(match.id,"blue",idx,e.target.value)} style={{...S.miniSel,color:PC[p.pos||pos]}}>{POSITIONS.map(pp=><option key={pp} value={pp}>{pp}</option>)}</select>:<span style={{fontSize:10,color:PC[pos],minWidth:28}}>{pos}</span>}{p?<span style={{fontSize:12,color:p.name===user.name?"#c8aa6e":"#f0e6d2",fontWeight:p.name===user.name?700:400}}>{p.name}{(()=>{const mb=findMb(p.name);return mb?.nickname?<span style={{color:"#5b5a56",fontSize:10}}> ({mb.nickname})</span>:null})()}</span>:<span style={{fontSize:11,color:"#2a2d30"}}>—</span>}</div>})}</div>
                  <div style={S.vsDiv}>VS</div>
                  <div style={S.sideCol}><div style={{...S.sideLabel,color:"#e84057",borderColor:"#e8405744"}}>🔶 레드팀</div>{POSITIONS.map((pos,idx)=>{const p=(match.red||[])[idx];return<div key={idx} style={S.slotRow}><span style={{...S.slotPos,color:PC[pos]}}>{PI[pos]}</span>{isAdmin&&p?<select value={p.pos||pos} onChange={e=>updateMatchPos(match.id,"red",idx,e.target.value)} style={{...S.miniSel,color:PC[p.pos||pos]}}>{POSITIONS.map(pp=><option key={pp} value={pp}>{pp}</option>)}</select>:<span style={{fontSize:10,color:PC[pos],minWidth:28}}>{pos}</span>}{p?<span style={{fontSize:12,color:p.name===user.name?"#c8aa6e":"#f0e6d2",fontWeight:p.name===user.name?700:400}}>{p.name}{(()=>{const mb=findMb(p.name);return mb?.nickname?<span style={{color:"#5b5a56",fontSize:10}}> ({mb.nickname})</span>:null})()}</span>:<span style={{fontSize:11,color:"#2a2d30"}}>—</span>}</div>})}</div>
                </div>
              </div>;
            })}
          </div>}
        </div>}
      </main>

      {modal&&isAdmin&&<div style={S.ov} onClick={()=>setModal(false)}>
        <div style={{...S.mod,maxWidth:640}} onClick={e=>e.stopPropagation()}>
          <h3 style={{fontSize:17,fontWeight:700,color:"#f0e6d2",marginBottom:14}}>내전 등록 (10인 내전)</h3>
          <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}>
            <div style={{flex:1,minWidth:130}}><label style={S.lab}>날짜</label><select value={mDate} onChange={e=>setMDate(e.target.value)} style={{...S.sel,width:"100%"}}>{weekends.map((d,i)=><option key={i} value={dS(d)}>{fD(d)}</option>)}</select></div>
            <div style={{flex:1,minWidth:100}}><label style={S.lab}>시간</label><select value={mTime} onChange={e=>setMTime(e.target.value)} style={{...S.sel,width:"100%"}}>{hours.map(h=><option key={h} value={h}>{fT(h)}</option>)}</select></div>
          </div>
          <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
            <div style={{flex:1,minWidth:200}}><div style={{fontSize:13,fontWeight:700,color:"#5383e8",marginBottom:8}}>🔷 블루팀</div>{POSITIONS.map((pos,idx)=>{const p=mBlue[idx];const act=pickSide?.side==="blue"&&pickSide?.idx===idx;return<div key={idx} style={{...S.pickSlot,...(act?{borderColor:"#5383e8",background:"rgba(83,131,232,.08)"}:{})}}><span style={{color:PC[pos],fontSize:12,minWidth:50}}>{PI[pos]} {pos}</span>{p?<div style={{display:"flex",alignItems:"center",gap:4,flex:1}}><span style={{fontSize:12,color:"#f0e6d2"}}>{p.name}</span><button onClick={()=>removeSlot("blue",idx)} style={{...S.noB,fontSize:9,padding:"1px 4px"}}>✕</button></div>:<button onClick={()=>setPickSide({side:"blue",idx})} style={{...S.pickBtn,...(act?{borderColor:"#5383e8",color:"#5383e8"}:{})}}>선택</button>}</div>})}</div>
            <div style={{flex:1,minWidth:200}}><div style={{fontSize:13,fontWeight:700,color:"#e84057",marginBottom:8}}>🔶 레드팀</div>{POSITIONS.map((pos,idx)=>{const p=mRed[idx];const act=pickSide?.side==="red"&&pickSide?.idx===idx;return<div key={idx} style={{...S.pickSlot,...(act?{borderColor:"#e84057",background:"rgba(232,64,87,.08)"}:{})}}><span style={{color:PC[pos],fontSize:12,minWidth:50}}>{PI[pos]} {pos}</span>{p?<div style={{display:"flex",alignItems:"center",gap:4,flex:1}}><span style={{fontSize:12,color:"#f0e6d2"}}>{p.name}</span><button onClick={()=>removeSlot("red",idx)} style={{...S.noB,fontSize:9,padding:"1px 4px"}}>✕</button></div>:<button onClick={()=>setPickSide({side:"red",idx})} style={{...S.pickBtn,...(act?{borderColor:"#e84057",color:"#e84057"}:{})}}>선택</button>}</div>})}</div>
          </div>
          {pickSide&&<div style={S.pickPanel}><div style={{fontSize:11,color:"#c8aa6e",marginBottom:6}}>{pickSide.side==="blue"?"🔷 블루":"🔶 레드"}팀 {POSITIONS[pickSide.idx]} 선택</div><div style={S.pGrid}>{members.filter(m=>!allPicked().includes(m.realName)).map((m,i)=><div key={i} onClick={()=>assignPlayer(m.realName)} style={S.chip}><span style={{fontSize:11,marginRight:2}}>{PI[m.pos]}</span><span style={{fontSize:12,color:"#f0e6d2"}}>{m.realName}</span>{m.nickname&&<span style={{fontSize:9,color:"#5b5a56",marginLeft:2}}>({m.nickname})</span>}<span style={{fontSize:9,color:"#5b5a56",marginLeft:3}}>{m.team}</span></div>)}</div></div>}
          <div style={{display:"flex",gap:10,marginTop:18,justifyContent:"flex-end"}}><button onClick={()=>setModal(false)} style={S.gho}>취소</button><button onClick={createMatch} style={S.pri}>등록</button></div>
        </div>
      </div>}

      {detSlot&&(tab==="overview"||(tab==="schedule"&&isAdmin))&&!bestSlots().find(s=>s.slot===detSlot)&&slotMb(detSlot).length>0&&(
        <div style={S.ov} onClick={()=>setDetSlot(null)}><div style={S.mod} onClick={e=>e.stopPropagation()}>
          <h3 style={{fontSize:15,fontWeight:700,color:"#f0e6d2",marginBottom:10}}>{(()=>{const[ds,hr]=detSlot.split("_");return`${fD(new Date(ds))} ${fT(+hr)}`})()}</h3>
          <div style={S.dList}>{slotMb(detSlot).map((n,j)=>{const mb=findMb(n);return<div key={j} style={S.dRow}><span style={{color:mb?PC[mb.pos]:"#8c8c8c",marginRight:5}}>{mb?PI[mb.pos]:"·"}</span><span style={{color:"#f0e6d2",fontSize:13}}>{n}</span>{mb?.nickname&&<span style={{color:"#5b5a56",fontSize:10,marginLeft:4}}>({mb.nickname})</span>}{mb&&<span style={{fontSize:10,color:"#5b5a56",marginLeft:"auto"}}>{mb.team}</span>}</div>})}</div>
          <button onClick={()=>setDetSlot(null)} style={{...S.gho,marginTop:14,width:"100%"}}>닫기</button>
        </div></div>
      )}
      {toast&&<div style={S.toast}>{toast}</div>}
    </div>
  );

  function renderCal(interactive){
    return<div style={S.cw}><div style={S.csc}><table style={S.ct}><thead><tr><th style={S.cTh}>시간</th>{weekends.map((d,i)=><th key={i} style={{...S.cTh,color:d.getDay()===0?"#e84057":"#5383e8"}}>{fD(d)}</th>)}</tr></thead><tbody>
      {hours.map(h=><tr key={h}><td style={S.cTi}>{fT(h)}</td>{weekends.map((d,di)=>{const ds=dS(d),k=`${ds}_${h}`,ex=slotMb(k),c=ex.length;if(interactive){const sel=selSlots.includes(k),done=ex.includes(user.name);return<td key={di} onClick={()=>!done&&toggleSlot(ds,h)} style={{...S.cC,...(sel?S.cSel:{}),...(done?S.cDone:{}),...(c>=10?{background:"rgba(200,170,110,.13)"}:c>=5?{background:"rgba(45,175,127,.08)"}:{})}}>{done?<span style={{fontSize:11,color:"#2daf7f",fontWeight:600}}>등록됨</span>:<>{c>0&&<div style={{fontSize:12,fontWeight:700,color:c>=5?"#c8aa6e":"#5b5a56"}}>{c}명</div>}{sel&&<div style={{fontSize:15,color:"#c8aa6e",fontWeight:700}}>✓</div>}{!c&&!sel&&<div style={{color:"#1e2328"}}>·</div>}</>}</td>}return<td key={di} style={{...S.oC,background:c>=10?"rgba(200,170,110,.18)":c>=5?"rgba(45,175,127,.1)":"transparent",borderColor:c>=10?"#785a28":c>=5?"#2d6b50":"#1a1e24"}} onClick={()=>c>0&&setDetSlot(detSlot===k?null:k)}>{c>0?<div><div style={{fontSize:13,fontWeight:700,color:c>=10?"#c8aa6e":c>=5?"#2daf7f":"#5b5a56"}}>{c}명</div><div style={{display:"flex",flexWrap:"wrap",justifyContent:"center",gap:1,marginTop:1}}>{ex.slice(0,3).map((n,j)=><span key={j} style={{fontSize:8,color:"#5b5a56"}}>{n}</span>)}{c>3&&<span style={{fontSize:8,color:"#c8aa6e"}}>+{c-3}</span>}</div></div>:<span style={{color:"#151820"}}>·</span>}</td>})}</tr>)}
    </tbody></table></div></div>;
  }
  function renderBest(){
    return<><h3 style={S.sub}>🔥 내전 가능 시간 (5명 이상)</h3>{!bestSlots().length?<div style={S.empty}><p style={{color:"#5b5a56"}}>5명 이상 모이는 시간대가 없습니다</p></div>:<div style={S.bGrid}>{bestSlots().map((s,i)=>{const[ds,hr]=s.slot.split("_"),d=new Date(ds);return<div key={i} style={{...S.bCard,animationDelay:`${i*.06}s`}} onClick={()=>setDetSlot(detSlot===s.slot?null:s.slot)}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:15,fontWeight:700,color:"#f0e6d2"}}>{fD(d)}</div><div style={{fontSize:13,color:"#c8aa6e",marginTop:2}}>{fT(+hr)}</div></div><div style={{textAlign:"right"}}><div style={{fontSize:28,fontWeight:900,color:"#c8aa6e",lineHeight:1}}>{s.count}</div><div style={{fontSize:10,color:"#5b5a56"}}>명</div></div></div>{s.count>=10&&<span style={S.mBdg}>2경기 가능</span>}{s.count>=5&&s.count<10&&<span style={S.mBdg}>1경기 가능</span>}{detSlot===s.slot&&<div style={S.dList}>{s.members.map((n,j)=>{const mb=findMb(n);return<div key={j} style={S.dRow}><span style={{color:mb?PC[mb.pos]:"#8c8c8c",marginRight:4,fontSize:13}}>{mb?PI[mb.pos]:"·"}</span><span style={{color:"#f0e6d2",fontSize:13}}>{n}</span>{mb?.nickname&&<span style={{color:"#5b5a56",fontSize:10,marginLeft:4}}>({mb.nickname})</span>}{mb&&<span style={{fontSize:10,color:"#5b5a56",marginLeft:"auto"}}>{mb.team}</span>}</div>})}</div>}</div>})}</div>}</>;
  }
}

const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&family=Black+Han+Sans&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:#0d1117}::-webkit-scrollbar-thumb{background:#463714;border-radius:3px}
@keyframes fi{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes fo{from{opacity:1}to{opacity:0}}
@keyframes ti{from{transform:translateX(-50%) translateY(30px);opacity:0}to{transform:translateX(-50%) translateY(0);opacity:1}}
@keyframes sp{to{transform:rotate(360deg)}}
@keyframes mi{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
@keyframes glow{0%,100%{box-shadow:0 0 20px rgba(200,170,110,.15)}50%{box-shadow:0 0 40px rgba(200,170,110,.3)}}
button{cursor:pointer;transition:all .15s}button:hover{filter:brightness(1.12)}button:active{transform:scale(.97)}button:disabled{opacity:.4;cursor:not-allowed;filter:none;transform:none}
select:focus,input:focus{outline:none;border-color:#c8aa6e!important}td{transition:background .12s}
`;

const S={
  root:{minHeight:"100vh",background:"linear-gradient(180deg,#010a13 0%,#0a1428 50%,#091428 100%)",fontFamily:"'Noto Sans KR',sans-serif",color:"#a09b8c"},
  load:{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#010a13"},
  spin:{width:36,height:36,border:"3px solid #1e2328",borderTopColor:"#c8aa6e",borderRadius:"50%",animation:"sp .8s linear infinite"},
  loginWrap:{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20},
  loginCard:{background:"linear-gradient(145deg,#1e2328,#13161b)",border:"1px solid #463714",borderRadius:16,padding:36,width:"100%",maxWidth:400,textAlign:"center",animation:"fi .4s ease,glow 3s ease-in-out infinite"},
  loginTitle:{fontFamily:"'Black Han Sans'",fontSize:24,background:"linear-gradient(180deg,#f0e6d2,#c8aa6e)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:4},
  loginSub:{fontSize:12,color:"#5b5a56",marginBottom:24},
  loginForm:{display:"flex",flexDirection:"column",gap:12,textAlign:"left"},
  loginInput:{background:"#0a1428",border:"1px solid #33372c",borderRadius:8,color:"#f0e6d2",fontSize:14,padding:"12px 14px",width:"100%",fontFamily:"'Noto Sans KR'",outline:"none"},
  loginBtn:{background:"linear-gradient(180deg,#c8aa6e,#785a28)",border:"none",borderRadius:8,padding:"12px",color:"#010a13",fontSize:15,fontWeight:700,fontFamily:"'Noto Sans KR'",boxShadow:"0 4px 16px rgba(200,170,110,.3)",cursor:"pointer"},
  setupHdr:{display:"flex",alignItems:"center",gap:8,padding:"8px 0",marginBottom:4},
  setupTag:{fontSize:10,padding:"2px 8px",borderRadius:4,background:"rgba(200,170,110,.12)",color:"#c8aa6e"},
  posRow:{display:"flex",gap:4,flexWrap:"wrap"},
  posBtn:{padding:"6px 10px",borderRadius:6,border:"1px solid #2a2d30",background:"transparent",color:"#8c8c8c",fontSize:11,fontFamily:"'Noto Sans KR'",fontWeight:500,cursor:"pointer",transition:"all .15s"},
  hdr:{background:"linear-gradient(180deg,#1e2328,#151820)",borderBottom:"2px solid #463714",padding:"0 12px",position:"sticky",top:0,zIndex:100},
  hdrIn:{maxWidth:1200,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",flexWrap:"wrap",gap:8},
  logoT:{fontFamily:"'Black Han Sans'",fontSize:15,background:"linear-gradient(180deg,#f0e6d2,#c8aa6e)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"},
  nav:{display:"flex",gap:3,flexWrap:"wrap"},
  nb:{padding:"5px 10px",border:"1px solid #2a2d30",borderRadius:4,background:"transparent",color:"#8c8c8c",fontSize:11,fontFamily:"'Noto Sans KR'",fontWeight:500,cursor:"pointer",transition:"all .15s"},
  nbA:{background:"linear-gradient(180deg,#1e2328,#463714)",borderColor:"#c8aa6e",color:"#f0e6d2",boxShadow:"0 0 10px rgba(200,170,110,.12)"},
  uArea:{display:"flex",alignItems:"center",gap:6},
  uBadge:{fontSize:11,color:"#c8aa6e",padding:"4px 10px",borderRadius:12,background:"rgba(200,170,110,.08)",border:"1px solid #46371444",whiteSpace:"nowrap"},
  logoutBtn:{fontSize:10,color:"#5b5a56",background:"transparent",border:"1px solid #2a2d30",borderRadius:4,padding:"4px 8px",fontFamily:"'Noto Sans KR'",cursor:"pointer"},
  main:{maxWidth:1200,margin:"0 auto",padding:"18px 14px 60px"},
  sh:{marginBottom:16},st:{fontFamily:"'Black Han Sans'",fontSize:21,color:"#f0e6d2",marginBottom:3},sd:{fontSize:11,color:"#5b5a56"},
  sub:{fontSize:14,color:"#f0e6d2",fontWeight:700,marginBottom:12},lab:{display:"block",fontSize:10,color:"#5b5a56",marginBottom:4,fontWeight:500},
  myCard:{background:"linear-gradient(145deg,#13161b,#0d1117)",border:"1px solid #1e2328",borderRadius:10,overflow:"hidden",maxWidth:500},
  myRow:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 18px",borderBottom:"1px solid #1a1e24",gap:12,flexWrap:"wrap"},
  myL:{fontSize:12,color:"#5b5a56",fontWeight:500,minWidth:60},myV:{fontSize:14,color:"#f0e6d2",fontWeight:500},
  myEdit:{fontSize:13,color:"#c8aa6e",cursor:"pointer",padding:"4px 10px",borderRadius:4,border:"1px dashed #463714"},
  tg:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:12},
  tc:{background:"linear-gradient(145deg,#13161b,#0d1117)",border:"1px solid #1e2328",borderRadius:8,overflow:"hidden"},
  thd:{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",background:"linear-gradient(90deg,#463714,#1e2328)",borderBottom:"1px solid #33372c"},
  tBd:{width:24,height:24,borderRadius:"50%",background:"linear-gradient(135deg,#c8aa6e,#785a28)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#010a13"},
  tNm:{fontSize:14,fontWeight:700,color:"#f0e6d2"},tCn:{fontSize:10,color:"#5b5a56",marginLeft:"auto"},
  mr:{display:"flex",alignItems:"center",padding:"5px 12px",gap:6,borderBottom:"1px solid #13161b"},
  pSl:{background:"#0d1117",border:"1px solid #2a2d30",borderRadius:4,padding:"3px 4px",fontSize:11,cursor:"pointer",fontFamily:"'Noto Sans KR'",color:"#8c8c8c",minWidth:78},
  mvSl:{background:"#0d1117",border:"1px solid #2a2d30",borderRadius:4,padding:"3px 4px",fontSize:10,cursor:"pointer",fontFamily:"'Noto Sans KR'",color:"#5b5a56",minWidth:52},
  mI:{display:"flex",alignItems:"center",gap:5,flex:1,flexWrap:"wrap",minWidth:0},
  nm:{fontSize:13,color:"#f0e6d2",fontWeight:600,cursor:"pointer",padding:"2px 5px",borderRadius:3},
  nk:{fontSize:10,color:"#5b5a56",cursor:"pointer",padding:"2px 6px",borderRadius:3,border:"1px dashed #2a2d30"},
  ie:{display:"inline-flex",alignItems:"center",gap:3},
  eIn:{background:"#0a1428",border:"1px solid #463714",borderRadius:3,color:"#f0e6d2",fontSize:12,padding:"3px 7px",width:80,fontFamily:"'Noto Sans KR'"},
  okB:{background:"#2daf7f",color:"#fff",border:"none",borderRadius:3,padding:"2px 6px",fontSize:11,fontWeight:700,cursor:"pointer"},
  noB:{background:"#e84057",color:"#fff",border:"none",borderRadius:3,padding:"2px 6px",fontSize:11,fontWeight:700,cursor:"pointer"},
  sel:{background:"#13161b",border:"1px solid #33372c",borderRadius:5,color:"#f0e6d2",fontSize:12,padding:"8px 10px",minWidth:200,fontFamily:"'Noto Sans KR'",cursor:"pointer"},
  selB:{display:"inline-block",background:"linear-gradient(135deg,#463714,#785a28)",color:"#f0e6d2",padding:"5px 14px",borderRadius:16,fontSize:12,fontWeight:500},
  cw:{border:"1px solid #1e2328",borderRadius:8,overflow:"hidden",background:"#0d1117"},
  csc:{overflowX:"auto"},ct:{width:"100%",borderCollapse:"collapse",minWidth:500},
  cTh:{padding:"8px 5px",fontSize:10,fontWeight:500,color:"#8c8c8c",textAlign:"center",borderBottom:"1px solid #1a1e24",background:"#13161b",whiteSpace:"nowrap"},
  cTi:{padding:"6px 8px",fontSize:10,color:"#5b5a56",textAlign:"center",borderRight:"1px solid #1a1e24",whiteSpace:"nowrap",background:"#0a0e14"},
  cC:{padding:"7px 3px",textAlign:"center",cursor:"pointer",border:"1px solid #151820",minWidth:60,verticalAlign:"middle"},
  cSel:{background:"rgba(200,170,110,.15)",borderColor:"#785a28"},
  cDone:{background:"rgba(45,175,127,.08)",cursor:"default"},
  oC:{padding:"5px 3px",textAlign:"center",border:"1px solid #1a1e24",minWidth:60,verticalAlign:"top",cursor:"pointer"},
  schAct:{display:"flex",gap:10,marginTop:16,justifyContent:"center",flexWrap:"wrap"},
  pri:{background:"linear-gradient(180deg,#c8aa6e,#785a28)",border:"none",borderRadius:5,padding:"9px 24px",color:"#010a13",fontSize:13,fontWeight:700,fontFamily:"'Noto Sans KR'",boxShadow:"0 3px 10px rgba(200,170,110,.25)",cursor:"pointer",transition:"all .15s"},
  gho:{background:"transparent",border:"1px solid #33372c",borderRadius:5,padding:"9px 18px",color:"#8c8c8c",fontSize:12,fontFamily:"'Noto Sans KR'",cursor:"pointer",transition:"all .15s"},
  dan:{background:"transparent",border:"1px solid #e84057",borderRadius:5,padding:"8px 20px",color:"#e84057",fontSize:11,fontFamily:"'Noto Sans KR'",cursor:"pointer"},
  delB:{background:"transparent",border:"1px solid #e8405744",borderRadius:4,padding:"3px 10px",color:"#e84057",fontSize:10,fontFamily:"'Noto Sans KR'",cursor:"pointer"},
  empty:{textAlign:"center",padding:"36px 20px",border:"1px dashed #1e2328",borderRadius:8,background:"#0d111744"},
  bGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:10},
  bCard:{background:"linear-gradient(145deg,#1a1e24,#111318)",border:"1px solid #33372c",borderRadius:8,padding:12,cursor:"pointer",transition:"all .2s",animation:"fi .3s ease both"},
  mBdg:{marginTop:6,display:"inline-block",fontSize:10,padding:"2px 8px",borderRadius:3,background:"rgba(45,175,127,.12)",color:"#2daf7f",fontWeight:600},
  dList:{marginTop:8,borderTop:"1px solid #1e2328",paddingTop:6,display:"flex",flexDirection:"column",gap:3},
  dRow:{display:"flex",alignItems:"center",gap:2,padding:"2px 0"},
  mCard:{background:"linear-gradient(145deg,#13161b,#0d1117)",border:"1px solid #1e2328",borderRadius:10,overflow:"hidden"},
  mHd:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 18px",borderBottom:"1px solid #1e2328",background:"linear-gradient(90deg,#1a1e24,#13161b)"},
  matchBody:{display:"flex",alignItems:"flex-start",padding:"16px 18px",gap:12,flexWrap:"wrap"},
  sideCol:{flex:1,minWidth:180},
  sideLabel:{fontSize:13,fontWeight:700,marginBottom:8,padding:"4px 10px",borderRadius:6,border:"1px solid",display:"inline-flex",alignItems:"center",gap:4},
  vsDiv:{display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:900,color:"#463714",padding:"30px 8px 0",minWidth:30,fontFamily:"'Black Han Sans'"},
  slotRow:{display:"flex",alignItems:"center",gap:6,padding:"4px 0",borderBottom:"1px solid #1a1e2444"},
  slotPos:{fontSize:13,minWidth:20},
  miniSel:{background:"transparent",border:"1px solid #2a2d30",borderRadius:3,padding:"1px 2px",fontSize:10,cursor:"pointer",fontFamily:"'Noto Sans KR'",color:"#8c8c8c",minWidth:40},
  ov:{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:16},
  mod:{background:"linear-gradient(145deg,#1e2328,#13161b)",border:"1px solid #463714",borderRadius:10,padding:22,width:"100%",maxWidth:520,maxHeight:"85vh",overflow:"auto",animation:"mi .2s ease"},
  pickSlot:{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:6,border:"1px solid #1e2328",marginBottom:4,transition:"all .15s"},
  pickBtn:{fontSize:10,padding:"3px 10px",borderRadius:4,border:"1px dashed #33372c",background:"transparent",color:"#5b5a56",fontFamily:"'Noto Sans KR'",cursor:"pointer"},
  pickPanel:{marginTop:14,padding:12,borderRadius:8,border:"1px solid #463714",background:"#0d1117"},
  pGrid:{display:"flex",flexWrap:"wrap",gap:5,maxHeight:200,overflow:"auto",padding:"6px 0"},
  chip:{display:"flex",alignItems:"center",padding:"4px 9px",borderRadius:5,border:"1px solid #2a2d30",cursor:"pointer",transition:"all .12s",background:"#13161b"},
  toast:{position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",background:"linear-gradient(135deg,#1e2328,#463714)",border:"1px solid #c8aa6e",borderRadius:8,padding:"9px 20px",color:"#f0e6d2",fontSize:12,fontWeight:500,animation:"ti .3s ease",zIndex:300,boxShadow:"0 8px 28px rgba(0,0,0,.5)",whiteSpace:"nowrap"},
};
