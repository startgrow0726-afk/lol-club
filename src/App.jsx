import { useState, useEffect, useCallback, useMemo } from "react";
import { saveData, subscribeData } from "./firebase";

const POS=["탑","정글","미드","원딜","서폿"];
const PI={"탑":"⚔️","정글":"🌿","미드":"🔮","원딜":"🏹","서폿":"🛡️"};
const PC={"탑":"#e84057","정글":"#2daf7f","미드":"#5383e8","원딜":"#e8a33d","서폿":"#9b59b6"};
const TC=["#e84057","#2daf7f","#5383e8","#e8a33d","#9b59b6","#e07c24"];
const posIdx=p=>POS.indexOf(p);

const INIT=[
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
const dn=m=>m?.nickname?`${m.realName} (${m.nickname})`:m?.realName||"";
const fixT=d=>{if(!d||!Array.isArray(d))return INIT;return d.map(t=>({...t,members:Array.isArray(t.members)?t.members:[]}))};
const fixM=d=>{if(!d)return[];if(!Array.isArray(d))return Object.values(d);return d};
const fixS=d=>{if(!d||typeof d!=="object")return{};const o={};Object.entries(d).forEach(([k,v])=>{if(Array.isArray(v)&&v.length>0)o[k]=v});return o};

export default function App(){
  const[teams,setTeams]=useState(INIT);
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
  const[ef,setEf]=useState(null);
  const[ev,setEv]=useState("");
  const[selSlots,setSelSlots]=useState([]);
  const[modal,setModal]=useState(false);
  const[matchMode,setMatchMode]=useState(10); // 5 or 10
  const[mDate,setMDate]=useState("");
  const[mTime,setMTime]=useState("20");
  const[mBlue,setMBlue]=useState([null,null,null,null,null]);
  const[mRed,setMRed]=useState([null,null,null,null,null]);
  const[pickSide,setPickSide]=useState(null);
  const[pickView,setPickView]=useState("team");
  const[detSlot,setDetSlot]=useState(null);
  const[confirm,setConfirm]=useState(null);
  const[addModal,setAddModal]=useState(null); // {teamIdx}
  const[addName,setAddName]=useState("");
  const[addNick,setAddNick]=useState("");
  const[addPos,setAddPos]=useState("미드");

  useEffect(()=>{
    const u1=subscribeData("teams",d=>{setTeams(fixT(d));setLoaded(true)});
    const u2=subscribeData("schedules",d=>setSched(fixS(d)));
    const u3=subscribeData("matches",d=>setMatches(fixM(d)));
    return()=>{u1();u2();u3()};
  },[]);

  const save=useCallback((t,s,m)=>{saveData("teams",t);saveData("schedules",s);saveData("matches",m)},[]);
  const flash=msg=>{setToast(msg);setTimeout(()=>setToast(""),2500)};
  const go=t=>{setAnim(false);setTimeout(()=>{setTab(t);setAnim(true);setDetSlot(null)},150)};
  const isAdmin=user?.isAdmin;

  // 팀에서 allMembers를 만들때 항상 최신 teams에서 가져옴
  const mbs=useMemo(()=>{
    const r=[];(Array.isArray(teams)?teams:[]).forEach((tm,ti)=>(Array.isArray(tm.members)?tm.members:[]).forEach(m=>r.push({...m,team:tm.name,teamIdx:ti})));
    return r;
  },[teams]);

  // findM: 항상 최신 mbs에서 검색 → 팀 이동 후에도 올바른 팀 표시
  const findM=useCallback(n=>mbs.find(m=>m.realName===n),[mbs]);
  const myMb=user&&!isAdmin?findM(user.name):null;
  const wk=gWE(4);
  const hrs=[12,13,14,15,16,17,18,19,20,21,22,23];
  const slotM=k=>sched[k]||[];

  // 포지션 순서로 정렬
  const sortByPos=arr=>[...arr].sort((a,b)=>posIdx(a.pos)-posIdx(b.pos));

  // 일정 등록한 사람 / 안 한 사람
  const checkedNames=useMemo(()=>{const s=new Set();Object.values(sched).forEach(v=>v.forEach(n=>s.add(n)));return s},[sched]);
  const unchecked=useMemo(()=>mbs.filter(m=>!checkedNames.has(m.realName)),[mbs,checkedNames]);

  // === AUTH ===
  const handleLogin=()=>{
    const n=loginName.trim();if(!n){flash("이름을 입력해주세요");return}
    if(n==="admin"){setUser({name:"admin",isAdmin:true});setTab("teams");flash("관리자 모드");return}
    const f=mbs.find(m=>m.realName===n);
    if(f){if(!f.nickname){setSetupMode(true);setSetupNick("");setSetupPos(f.pos)}else{setUser({name:n,isAdmin:false});flash(`${dn(f)}님, 환영합니다!`)}}
    else{setSetupMode(true);setSetupNick("");setSetupPos("미드")}
  };
  const handleSetup=()=>{
    const n=loginName.trim();let found=false;
    const nt=teams.map(t=>({...t,members:(t.members||[]).map(m=>{if(m.realName===n){found=true;return{...m,nickname:setupNick,pos:setupPos}}return m})}));
    if(!found){const li=nt.length-1;nt[li]={...nt[li],members:[...(nt[li].members||[]),{realName:n,pos:setupPos,nickname:setupNick}]};}
    setTeams(nt);save(nt,sched,matches);setSetupMode(false);setUser({name:n,isAdmin:false});flash("환영합니다!");
  };
  const logout=()=>{setUser(null);setLoginName("");setSetupMode(false);setTab("schedule");setSelSlots([])};

  // === ADMIN ===
  const saveField=(ti,mi,field,val)=>{const nt=teams.map((t,i)=>i===ti?{...t,members:(t.members||[]).map((m,j)=>j===mi?{...m,[field]:val}:m)}:t);setTeams(nt);save(nt,sched,matches);setEf(null);flash("저장됨")};
  const moveMember=(fi,mi,ti)=>{
    if(fi===ti)return;
    const nt=teams.map(t=>({...t,members:[...(t.members||[])]}));
    const[mb]=nt[fi].members.splice(mi,1);
    nt[ti].members.push(mb);
    setTeams(nt);save(nt,sched,matches);flash(`${mb.realName} → ${nt[ti].name}`);
  };
  const deleteMember=(ti,mi)=>{
    const name=teams[ti].members[mi].realName;
    setConfirm({msg:`"${name}" 삭제하시겠습니까?\n일정에서도 제거됩니다.`,onOk:()=>{
      const nt=teams.map((t,i)=>i===ti?{...t,members:t.members.filter((_,j)=>j!==mi)}:t);
      const ns={...sched};Object.keys(ns).forEach(k=>{ns[k]=ns[k].filter(n=>n!==name);if(!ns[k].length)delete ns[k]});
      setTeams(nt);setSched(ns);save(nt,ns,matches);setConfirm(null);flash(`${name} 삭제됨`);
    }});
  };
  const addMember=()=>{
    const n=addName.trim();if(!n){flash("이름을 입력하세요");return}
    if(mbs.find(m=>m.realName===n)){flash("이미 존재하는 이름입니다");return}
    const ti=addModal.teamIdx;
    const nt=teams.map((t,i)=>i===ti?{...t,members:[...(t.members||[]),{realName:n,pos:addPos,nickname:addNick}]}:t);
    setTeams(nt);save(nt,sched,matches);setAddModal(null);setAddName("");setAddNick("");setAddPos("미드");flash(`${n} 추가됨`);
  };
  const resetAll=()=>{setConfirm({msg:"모든 데이터를 초기화하시겠습니까?",onOk:()=>{setTeams(INIT);setSched({});setMatches([]);save(INIT,{},[]);setConfirm(null);flash("초기화 완료")}})};

  // === USER ===
  const saveMyNick=v=>{const nt=teams.map(t=>({...t,members:(t.members||[]).map(m=>m.realName===user.name?{...m,nickname:v}:m)}));setTeams(nt);save(nt,sched,matches);setEf(null);flash("닉네임 저장됨")};
  const saveMyPos=p=>{const nt=teams.map(t=>({...t,members:(t.members||[]).map(m=>m.realName===user.name?{...m,pos:p}:m)}));setTeams(nt);save(nt,sched,matches);flash("포지션 변경됨")};

  // === SCHEDULE ===
  const togSlot=(ds,h)=>{const k=`${ds}_${h}`;setSelSlots(p=>p.includes(k)?p.filter(x=>x!==k):[...p,k])};
  const submitSched=()=>{if(!selSlots.length){flash("시간을 선택해주세요");return}const ns={...sched};selSlots.forEach(k=>{if(!ns[k])ns[k]=[];if(!ns[k].includes(user.name))ns[k].push(user.name)});setSched(ns);save(teams,ns,matches);setSelSlots([]);flash("일정 등록됨")};
  const clearMy=()=>{const ns={...sched};Object.keys(ns).forEach(k=>{ns[k]=ns[k].filter(n=>n!==user.name);if(!ns[k].length)delete ns[k]});setSched(ns);save(teams,ns,matches);flash("일정 초기화됨")};
  const clearAllSched=()=>{setConfirm({msg:"전체 일정을 초기화하시겠습니까?",onOk:()=>{setSched({});save(teams,{},matches);setConfirm(null);flash("전체 일정 초기화됨")}})};
  const best=()=>Object.entries(sched).map(([k,v])=>({slot:k,count:v.length,members:v})).filter(e=>e.count>=5).sort((a,b)=>b.count-a.count).slice(0,10);

  // === MATCH ===
  const openModal=(mode)=>{setMatchMode(mode);setMDate(dS(wk[0]));setMTime("20");setMBlue([null,null,null,null,null]);setMRed([null,null,null,null,null]);setPickSide(null);setPickView("team");setModal(true)};
  const picked=()=>[...mBlue,...mRed].filter(Boolean).map(p=>p.name);
  const assign=(name)=>{if(!pickSide)return;const e={name,pos:POS[pickSide.idx]};if(pickSide.side==="blue"){const n=[...mBlue];n[pickSide.idx]=e;setMBlue(n)}else{const n=[...mRed];n[pickSide.idx]=e;setMRed(n)}setPickSide(null)};
  const rmSlot=(s,i)=>{if(s==="blue"){const n=[...mBlue];n[i]=null;setMBlue(n)}else{const n=[...mRed];n[i]=null;setMRed(n)}};
  const createMatch=()=>{
    const bp=mBlue.filter(Boolean).length,rp=mRed.filter(Boolean).length;
    if(matchMode===5){if(bp<3){flash("블루팀 3명 이상 필요");return}}
    else{if(bp+rp<6){flash("최소 6명 이상 배치해주세요");return}}
    const nm=[...matches,{id:Date.now(),date:mDate,time:+mTime,blue:mBlue,red:matchMode===5?null:mRed,mode:matchMode}];
    setMatches(nm);save(teams,sched,nm);setModal(false);flash("내전 등록됨!");
  };
  const delMatch=id=>{setConfirm({msg:"삭제하시겠습니까?",onOk:()=>{const nm=matches.filter(m=>m.id!==id);setMatches(nm);save(teams,sched,nm);setConfirm(null);flash("삭제됨")}})};
  const updMP=(mid,side,idx,pos)=>{const nm=matches.map(m=>{if(m.id!==mid)return m;const c={...m,[side]:[...m[side]]};if(c[side][idx])c[side][idx]={...c[side][idx],pos};return c});setMatches(nm);save(teams,sched,nm)};

  // === HELPERS ===
  const groupByTeam=(names)=>{
    const g={};names.forEach(n=>{const m=findM(n);const t=m?m.team:"미배정";if(!g[t])g[t]=[];g[t].push({name:n,...(m||{pos:"미드",nickname:"",team:"미배정"})})});
    const ord=teams.map(t=>t.name);
    return Object.entries(g).sort(([a],[b])=>(ord.indexOf(a)<0?99:ord.indexOf(a))-(ord.indexOf(b)<0?99:ord.indexOf(b)));
  };

  const renderTeamList=(names)=>{
    const g=groupByTeam(names);
    return<div style={S.tgWrap}>{g.map(([t,ms],gi)=><div key={gi} style={{...S.tgBox,borderLeftColor:TC[gi%6]+"66"}}>
      <div style={S.tgHead}><span style={{...S.tgBadge,background:TC[gi%6]+"18",color:TC[gi%6],borderColor:TC[gi%6]+"33"}}>{t}</span><span style={{fontSize:10,color:"#5b5a56"}}>{ms.length}명</span></div>
      {sortByPos(ms).map((m,j)=><div key={j} style={S.tgRow}><span style={{color:PC[m.pos]||"#888",marginRight:4,fontSize:12}}>{PI[m.pos]||"·"}</span><span style={{fontSize:12,color:"#f0e6d2"}}>{m.name}</span>{m.nickname&&<span style={{fontSize:10,color:"#5b5a56",marginLeft:3}}>({m.nickname})</span>}<span style={{fontSize:9,color:PC[m.pos]||"#5b5a56",marginLeft:"auto",opacity:.7}}>{m.pos}</span></div>)}
    </div>)}</div>;
  };

  if(!loaded)return<div style={S.load}><div style={S.spin}/></div>;

  // ═══ LOGIN ═══
  if(!user)return(
    <div style={S.root}>
      <div style={S.loginWrap}><div style={S.loginCard}>
        <div style={{fontSize:44,marginBottom:12}}>🎮</div>
        <h1 style={S.logoTitle}>e스포츠 클럽</h1>
        <p style={S.logoDesc}>내전 일정 관리</p>
        <div style={S.divider}/>
        {!setupMode?<div style={S.lf}>
          <input value={loginName} onChange={e=>setLoginName(e.target.value)} placeholder="이름을 입력하세요" style={S.lInput} onKeyDown={e=>e.key==="Enter"&&handleLogin()} autoFocus/>
          <button onClick={handleLogin} style={S.lBtn}>로그인</button>
        </div>:<div style={S.lf}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><span style={{fontSize:16,fontWeight:700,color:"#f0e6d2"}}>{loginName.trim()}</span><span style={S.tag}>초기 설정</span></div>
          <label style={S.lab}>닉네임 (소환사명)</label>
          <input value={setupNick} onChange={e=>setSetupNick(e.target.value)} placeholder="닉네임" style={S.lInput} autoFocus/>
          <label style={{...S.lab,marginTop:8}}>주 포지션</label>
          <div style={S.posRow}>{POS.map(p=><button key={p} onClick={()=>setSetupPos(p)} style={{...S.posBtn,...(setupPos===p?{borderColor:PC[p],background:PC[p]+"18",color:PC[p]}:{})}}>{PI[p]} {p}</button>)}</div>
          <div style={{display:"flex",gap:8,marginTop:12}}><button onClick={()=>setSetupMode(false)} style={S.ghost}>뒤로</button><button onClick={handleSetup} style={{...S.lBtn,flex:1}}>완료</button></div>
        </div>}
      </div></div>
      {toast&&<div style={S.toast}>{toast}</div>}
    </div>
  );

  const navs=isAdmin
    ?[{id:"teams",l:"인원 관리",i:"👥"},{id:"schedule",l:"일정 현황",i:"📊"},{id:"matches",l:"내전 관리",i:"🏆"}]
    :[{id:"myinfo",l:"내 정보",i:"👤"},{id:"schedule",l:"일정 등록",i:"📅"},{id:"overview",l:"일정 현황",i:"📊"},{id:"matches",l:"내전 목록",i:"🏆"}];

  // ── Side (match display) ──
  const Side=({label,color,icon,data,matchId,side})=>(
    <div style={S.sideCol}>
      <div style={{...S.sideTag,color,borderColor:color+"44"}}>{icon} {label}</div>
      {POS.map((pos,idx)=>{const p=(data||[])[idx];return<div key={idx} style={S.slotR}>
        <span style={{fontSize:12,color:PC[pos],minWidth:20}}>{PI[pos]}</span>
        {isAdmin&&p?<select value={p.pos||pos} onChange={e=>updMP(matchId,side,idx,e.target.value)} style={{...S.miniSel,color:PC[p.pos||pos]}}>{POS.map(pp=><option key={pp} value={pp}>{pp}</option>)}</select>
        :<span style={{fontSize:9,color:PC[pos],minWidth:28,opacity:.6}}>{pos}</span>}
        {p?<span style={{fontSize:12,color:p.name===user?.name?"#c8aa6e":"#cdcdcd",fontWeight:p.name===user?.name?700:400}}>{p.name}{(()=>{const m=findM(p.name);return m?.nickname?<span style={{color:"#5b5a56",fontSize:9}}> ({m.nickname})</span>:null})()}</span>
        :<span style={{fontSize:10,color:"#2a2d30"}}>—</span>}
      </div>})}
    </div>
  );

  // ── Pick Panel (match creation) ──
  const PickPanel=()=>{
    if(!pickSide)return null;
    const avail=mbs.filter(m=>!picked().includes(m.realName));
    return<div style={S.pickPanel}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <span style={{fontSize:12,color:"#c8aa6e"}}>{pickSide.side==="blue"?"🔷 블루":"🔶 레드"} {POS[pickSide.idx]} 선택</span>
        <div style={{display:"flex",gap:3}}><button onClick={()=>setPickView("team")} style={{...S.vTab,...(pickView==="team"?S.vTabA:{})}}>팀별</button><button onClick={()=>setPickView("pos")} style={{...S.vTab,...(pickView==="pos"?S.vTabA:{})}}>포지션별</button></div>
      </div>
      <div style={S.pickGrid}>
        {pickView==="team"?teams.map((t,ti)=>{const tm=avail.filter(m=>m.team===t.name);if(!tm.length)return null;return<div key={ti} style={S.pickBox}><div style={{fontSize:11,fontWeight:600,color:TC[ti%6],marginBottom:4}}>{t.name}</div>{sortByPos(tm).map((m,j)=><div key={j} onClick={()=>assign(m.realName)} style={S.pickChip}><span style={{fontSize:10,color:PC[m.pos],marginRight:3}}>{PI[m.pos]}</span><span style={{fontSize:11,color:"#f0e6d2"}}>{m.realName}</span></div>)}</div>})
        :POS.map(pos=>{const pm=avail.filter(m=>m.pos===pos);if(!pm.length)return null;return<div key={pos} style={S.pickBox}><div style={{fontSize:11,fontWeight:600,color:PC[pos],marginBottom:4}}>{PI[pos]} {pos}</div>{pm.map((m,j)=><div key={j} onClick={()=>assign(m.realName)} style={S.pickChip}><span style={{fontSize:11,color:"#f0e6d2"}}>{m.realName}</span><span style={{fontSize:8,color:"#5b5a56",marginLeft:3}}>{m.team}</span></div>)}</div>})}
      </div>
    </div>;
  };

  // ── Admin Schedule Table ──
  const AdminSchedTable=()=>{
    const allNames=mbs.map(m=>m.realName);
    return<div style={{marginTop:16}}>
      <h3 style={S.sub}>📋 인원별 일정 표</h3>
      <div style={{...S.cw,maxHeight:500}}><div style={{overflowX:"auto",overflowY:"auto",maxHeight:500}}>
        <table style={{...S.ct,minWidth:Math.max(500,wk.length*60+120)}}>
          <thead><tr>
            <th style={{...S.cTh,position:"sticky",left:0,zIndex:2,background:"#0f1318",minWidth:100}}>이름</th>
            {wk.map((d,i)=><th key={i} style={{...S.cTh,color:d.getDay()===0?"#e84057":"#5383e8"}}>{fD(d)}</th>)}
          </tr></thead>
          <tbody>
            {allNames.map((name,ni)=>{
              const mb=findM(name);
              const hasAny=checkedNames.has(name);
              return<tr key={ni} style={{background:hasAny?"transparent":"rgba(232,64,87,.03)"}}>
                <td style={{...S.cTi,position:"sticky",left:0,zIndex:1,background:hasAny?"#080c12":"#120d0d",minWidth:100,textAlign:"left",padding:"5px 8px",fontSize:11}}>
                  <span style={{color:mb?PC[mb.pos]:"#888",marginRight:3}}>{mb?PI[mb.pos]:"·"}</span>
                  <span style={{color:hasAny?"#f0e6d2":"#e84057"}}>{name}</span>
                  <span style={{color:"#33372c",fontSize:9,marginLeft:3}}>{mb?.team}</span>
                </td>
                {wk.map((d,di)=>{
                  // 이 날짜의 모든 시간대를 확인
                  const ds=dS(d);
                  const myHrs=hrs.filter(h=>slotM(`${ds}_${h}`).includes(name));
                  return<td key={di} style={{...S.cO,padding:"4px 3px",verticalAlign:"middle",background:myHrs.length>0?"rgba(45,175,127,.06)":"transparent"}}>
                    {myHrs.length>0?<div style={{display:"flex",flexWrap:"wrap",gap:1,justifyContent:"center"}}>
                      {myHrs.map(h=><span key={h} style={{fontSize:8,color:"#2daf7f",background:"rgba(45,175,127,.12)",borderRadius:2,padding:"0 3px"}}>{h}시</span>)}
                    </div>:<span style={{fontSize:9,color:"#2a2d30"}}>—</span>}
                  </td>;
                })}
              </tr>;
            })}
          </tbody>
        </table>
      </div></div>
    </div>;
  };

  // ── Unchecked Members ──
  const UncheckedSection=()=>{
    if(!unchecked.length)return<div style={{...S.infoBox,borderColor:"#2daf7f33"}}><span style={{color:"#2daf7f",fontSize:13}}>✅ 모든 인원이 일정을 등록했습니다!</span></div>;
    const grouped={};unchecked.forEach(m=>{const t=m.team;if(!grouped[t])grouped[t]=[];grouped[t].push(m)});
    return<div style={S.infoBox}>
      <div style={{fontSize:13,fontWeight:700,color:"#e84057",marginBottom:8}}>⚠️ 미등록 인원 ({unchecked.length}명)</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
        {Object.entries(grouped).map(([t,ms],i)=><div key={i}>
          <span style={{fontSize:10,color:"#5b5a56",marginBottom:2,display:"block"}}>{t}</span>
          {sortByPos(ms).map((m,j)=><div key={j} style={{display:"flex",alignItems:"center",gap:3,padding:"1px 0"}}>
            <span style={{fontSize:10,color:PC[m.pos]}}>{PI[m.pos]}</span>
            <span style={{fontSize:12,color:"#e84057"}}>{m.realName}</span>
          </div>)}
        </div>)}
      </div>
    </div>;
  };

  return(
    <div style={S.root}>
      <header style={S.hdr}><div style={S.hdrIn}>
        <div style={{display:"flex",alignItems:"center",gap:7}}><span style={{fontSize:18}}>🎮</span><h1 style={S.hdrTitle}>e스포츠 클럽</h1></div>
        <nav style={S.nav}>{navs.map(n=><button key={n.id} onClick={()=>go(n.id)} style={{...S.nb,...(tab===n.id?S.nbA:{})}}><span style={{marginRight:3,fontSize:12}}>{n.i}</span>{n.l}</button>)}</nav>
        <div style={S.uArea}><span style={S.uBadge}>{isAdmin?"🔧 관리자":`${PI[myMb?.pos]||"👤"} ${dn(myMb||{realName:user.name})}`}</span><button onClick={logout} style={S.logoutBtn}>로그아웃</button></div>
      </div></header>

      <main style={{...S.main,animation:anim?"fi .3s ease":"fo .15s ease"}}>

        {/* MY INFO */}
        {tab==="myinfo"&&!isAdmin&&myMb&&<div>
          <h2 style={S.st}>👤 내 정보</h2>
          <div style={S.myCard}>
            {[["이름",myMb.realName],["소속팀",myMb.team]].map(([l,v],i)=><div key={i} style={S.myRow}><span style={S.myL}>{l}</span><span style={S.myV}>{v}</span></div>)}
            <div style={S.myRow}><span style={S.myL}>닉네임</span>
              {ef==="myNick"?<span style={S.ie}><input value={ev} onChange={e=>setEv(e.target.value)} style={S.eIn} autoFocus onKeyDown={e=>{if(e.key==="Enter")saveMyNick(ev);if(e.key==="Escape")setEf(null)}}/><button onClick={()=>saveMyNick(ev)} style={S.okB}>✓</button><button onClick={()=>setEf(null)} style={S.noB}>✕</button></span>
              :<span style={S.myEdit} onClick={()=>{setEf("myNick");setEv(myMb.nickname)}}>{myMb.nickname||"닉네임 설정 +"}</span>}</div>
            <div style={S.myRow}><span style={S.myL}>포지션</span><div style={S.posRow}>{POS.map(p=><button key={p} onClick={()=>saveMyPos(p)} style={{...S.posBtn,...(myMb.pos===p?{borderColor:PC[p],background:PC[p]+"18",color:PC[p]}:{})}}>{PI[p]} {p}</button>)}</div></div>
            <div style={{...S.myRow,borderBottom:"none"}}><span style={S.myL}>내 일정</span><span style={S.myV}>{Object.values(sched).filter(v=>v.includes(user.name)).length}개 등록</span></div>
          </div>
        </div>}

        {/* TEAMS */}
        {tab==="teams"&&isAdmin&&<div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10,marginBottom:16}}>
            <h2 style={S.st}>👥 인원 · 팀 관리</h2>
            <button onClick={resetAll} style={S.danger}>🔄 전체 초기화</button>
          </div>
          <div style={S.teamGrid}>{teams.map((team,ti)=>{
            const sorted=sortByPos(((team.members||[]).map((m,mi)=>({...m,_mi:mi}))));
            return<div key={ti} style={{...S.teamCard,borderTopColor:TC[ti%6]+"55"}}>
              <div style={{...S.teamHd,background:`linear-gradient(90deg,${TC[ti%6]}12,transparent)`}}>
                <span style={{...S.teamBdg,background:TC[ti%6]+"22",color:TC[ti%6],borderColor:TC[ti%6]+"44"}}>{ti+1}</span>
                <span style={{fontSize:14,fontWeight:700,color:"#f0e6d2"}}>{team.name}</span>
                <span style={{fontSize:10,color:"#5b5a56",marginLeft:"auto"}}>{(team.members||[]).length}명</span>
                <button onClick={()=>{setAddModal({teamIdx:ti});setAddName("");setAddNick("");setAddPos("미드")}} style={S.addBtn} title="인원 추가">+</button>
              </div>
              {!sorted.length?<div style={{padding:16,textAlign:"center",color:"#33372c",fontSize:12}}>멤버 없음</div>
              :sorted.map((m)=>{const mi=m._mi;return<div key={mi} style={S.mRow}>
                <select value={m.pos} onChange={e=>saveField(ti,mi,"pos",e.target.value)} style={{...S.pSel,color:PC[m.pos]}}>{POS.map(p=><option key={p} value={p}>{PI[p]} {p}</option>)}</select>
                <div style={S.mInfo}>
                  {ef===`n${ti}${mi}`?<span style={S.ie}><input value={ev} onChange={e=>setEv(e.target.value)} style={S.eIn} autoFocus onKeyDown={e=>{if(e.key==="Enter")saveField(ti,mi,"realName",ev);if(e.key==="Escape")setEf(null)}}/><button onClick={()=>saveField(ti,mi,"realName",ev)} style={S.okB}>✓</button><button onClick={()=>setEf(null)} style={S.noB}>✕</button></span>
                  :<span style={S.nameT} onClick={()=>{setEf(`n${ti}${mi}`);setEv(m.realName)}}>{m.realName}</span>}
                  {ef===`k${ti}${mi}`?<span style={S.ie}><input value={ev} onChange={e=>setEv(e.target.value)} style={{...S.eIn,width:100}} placeholder="닉네임" autoFocus onKeyDown={e=>{if(e.key==="Enter")saveField(ti,mi,"nickname",ev);if(e.key==="Escape")setEf(null)}}/><button onClick={()=>saveField(ti,mi,"nickname",ev)} style={S.okB}>✓</button><button onClick={()=>setEf(null)} style={S.noB}>✕</button></span>
                  :<span style={{...S.nickT,...(m.nickname?{color:"#c8aa6e",borderColor:"#46371433"}:{})}} onClick={()=>{setEf(`k${ti}${mi}`);setEv(m.nickname)}}>{m.nickname||"+ 닉네임"}</span>}
                </div>
                <select value={ti} onChange={e=>moveMember(ti,mi,+e.target.value)} style={S.mvSel}>{teams.map((t2,i2)=><option key={i2} value={i2}>{t2.name}</option>)}</select>
                <button onClick={()=>deleteMember(ti,mi)} style={S.delMBtn}>✕</button>
              </div>})}
            </div>})}</div>
        </div>}

        {/* SCHEDULE (user) */}
        {tab==="schedule"&&!isAdmin&&<div>
          <h2 style={S.st}>📅 일정 등록</h2>
          <div style={{marginBottom:12,display:"flex",alignItems:"center",gap:10}}>
            <span style={S.selBadge}>{PI[myMb?.pos]||""} {dn(myMb||{realName:user.name})}</span>
            {selSlots.length>0&&<span style={{fontSize:12,color:"#c8aa6e"}}>{selSlots.length}개 선택</span>}
          </div>
          <div style={S.cw}><div style={S.csc}><table style={S.ct}><thead><tr><th style={S.cTh}>시간</th>{wk.map((d,i)=><th key={i} style={{...S.cTh,color:d.getDay()===0?"#e84057":"#5383e8"}}>{fD(d)}</th>)}</tr></thead><tbody>
            {hrs.map(h=><tr key={h}><td style={S.cTi}>{fT(h)}</td>{wk.map((d,di)=>{const ds=dS(d),k=`${ds}_${h}`,ex=slotM(k),c=ex.length,sl=selSlots.includes(k),dn2=ex.includes(user.name);
              return<td key={di} onClick={()=>!dn2&&togSlot(ds,h)} style={{...S.cC,...(sl?S.cSel:{}),...(dn2?S.cDone:{}),...(c>=10?{background:"rgba(200,170,110,.12)"}:c>=5?{background:"rgba(45,175,127,.07)"}:{})}}>
                {dn2?<span style={{fontSize:10,color:"#2daf7f",fontWeight:600}}>등록됨</span>:<>{c>0&&<div style={{fontSize:11,fontWeight:700,color:c>=5?"#c8aa6e":"#5b5a56"}}>{c}명</div>}{sl&&<div style={{fontSize:14,color:"#c8aa6e",fontWeight:700}}>✓</div>}{!c&&!sl&&<div style={{color:"#1a1e24",fontSize:10}}>·</div>}</>}
              </td>})}</tr>)}
          </tbody></table></div></div>
          <div style={S.actRow}><button onClick={submitSched} style={S.pri} disabled={!selSlots.length}>일정 등록하기</button><button onClick={clearMy} style={S.ghost}>내 일정 초기화</button></div>
        </div>}

        {/* SCHEDULE ADMIN */}
        {tab==="schedule"&&isAdmin&&<div>
          <h2 style={S.st}>📊 전체 일정 현황</h2>
          <UncheckedSection/>
          <h3 style={{...S.sub,marginTop:16}}>🔥 내전 가능 시간 <span style={{fontWeight:400,fontSize:12,color:"#5b5a56"}}>(5명 이상)</span></h3>
          {!best().length?<div style={S.empty}><p style={{color:"#5b5a56",fontSize:13}}>5명 이상 모이는 시간대가 없습니다</p></div>
          :<div style={S.bGrid}>{best().map((s,i)=>{const[ds,hr]=s.slot.split("_"),d=new Date(ds),total=mbs.length,ratio=s.count/total;
            return<div key={i} style={{...S.bCard,animationDelay:`${i*.05}s`,...(s.count===total?{borderColor:"#c8aa6e44"}:{})}} onClick={()=>setDetSlot(detSlot===s.slot?null:s.slot)}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <div><div style={{fontSize:14,fontWeight:700,color:"#f0e6d2"}}>{fD(d)}</div><div style={{fontSize:12,color:"#c8aa6e",marginTop:1}}>{fT(+hr)}</div></div>
                <div style={{textAlign:"right"}}><div style={{fontSize:26,fontWeight:900,color:s.count===total?"#2daf7f":"#c8aa6e",lineHeight:1}}>{s.count}</div><div style={{fontSize:9,color:"#5b5a56"}}>{total}명 중</div></div>
              </div>
              {/* progress bar */}
              <div style={{height:3,borderRadius:2,background:"#1e2328",marginBottom:6}}><div style={{height:3,borderRadius:2,background:ratio>=1?"#2daf7f":ratio>=0.5?"#c8aa6e":"#5b5a56",width:`${ratio*100}%`,transition:"width .3s"}}/></div>
              {s.count>=10?<span style={{...S.mBdg,background:"rgba(200,170,110,.12)",color:"#c8aa6e"}}>2경기 가능</span>:s.count>=5&&<span style={S.mBdg}>1경기 가능</span>}
              {s.count===total&&<span style={{...S.mBdg,background:"rgba(45,175,127,.12)",color:"#2daf7f",marginLeft:4}}>전원 참가!</span>}
              {detSlot===s.slot&&<div style={{marginTop:8}} onClick={e=>e.stopPropagation()}>{renderTeamList(s.members)}</div>}
            </div>})}</div>}
          <AdminSchedTable/>
          <div style={{textAlign:"center",marginTop:20}}><button onClick={clearAllSched} style={S.danger}>전체 일정 초기화</button></div>
        </div>}

        {/* OVERVIEW (user) */}
        {tab==="overview"&&!isAdmin&&<div>
          <h2 style={S.st}>📊 일정 현황</h2>
          <h3 style={S.sub}>🔥 내전 가능 시간</h3>
          {!best().length?<div style={S.empty}><p style={{color:"#5b5a56"}}>5명 이상 모이는 시간대가 없습니다</p></div>
          :<div style={S.bGrid}>{best().map((s,i)=>{const[ds,hr]=s.slot.split("_"),d=new Date(ds);
            return<div key={i} style={{...S.bCard,animationDelay:`${i*.05}s`}} onClick={()=>setDetSlot(detSlot===s.slot?null:s.slot)}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <div><div style={{fontSize:14,fontWeight:700,color:"#f0e6d2"}}>{fD(d)}</div><div style={{fontSize:12,color:"#c8aa6e"}}>{fT(+hr)}</div></div>
                <div style={{fontSize:26,fontWeight:900,color:"#c8aa6e"}}>{s.count}<span style={{fontSize:10,color:"#5b5a56"}}>명</span></div>
              </div>
              {s.count>=10?<span style={{...S.mBdg,background:"rgba(200,170,110,.12)",color:"#c8aa6e"}}>2경기</span>:s.count>=5&&<span style={S.mBdg}>1경기</span>}
              {detSlot===s.slot&&<div style={{marginTop:8}} onClick={e=>e.stopPropagation()}>{renderTeamList(s.members)}</div>}
            </div>})}</div>}
          <h3 style={{...S.sub,marginTop:24}}>📋 전체 캘린더</h3>
          <div style={S.cw}><div style={S.csc}><table style={S.ct}><thead><tr><th style={S.cTh}>시간</th>{wk.map((d,i)=><th key={i} style={{...S.cTh,color:d.getDay()===0?"#e84057":"#5383e8"}}>{fD(d)}</th>)}</tr></thead><tbody>
            {hrs.map(h=><tr key={h}><td style={S.cTi}>{fT(h)}</td>{wk.map((d,di)=>{const k=`${dS(d)}_${h}`,ex=slotM(k),c=ex.length;
              return<td key={di} style={{...S.cO,background:c>=10?"rgba(200,170,110,.16)":c>=5?"rgba(45,175,127,.08)":"transparent"}} onClick={()=>c>0&&setDetSlot(detSlot===k?null:k)}>
                {c>0?<div style={{fontSize:12,fontWeight:700,color:c>=10?"#c8aa6e":c>=5?"#2daf7f":"#5b5a56"}}>{c}명</div>:<span style={{color:"#151820",fontSize:10}}>·</span>}
              </td>})}</tr>)}
          </tbody></table></div></div>
        </div>}

        {/* MATCHES */}
        {tab==="matches"&&<div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10,marginBottom:16}}>
            <h2 style={S.st}>🏆 {isAdmin?"내전 관리":"내전 목록"}</h2>
            {isAdmin&&<div style={{display:"flex",gap:6}}>
              <button onClick={()=>openModal(5)} style={{...S.pri,fontSize:12}}>+ 5인 내전</button>
              <button onClick={()=>openModal(10)} style={{...S.pri,fontSize:12}}>+ 10인 내전</button>
            </div>}
          </div>
          {!matches.length?<div style={S.empty}><p style={{fontSize:40,marginBottom:8}}>🏆</p><p style={{color:"#5b5a56"}}>등록된 내전이 없습니다</p></div>
          :<div style={{display:"flex",flexDirection:"column",gap:14}}>
            {[...matches].reverse().map(match=>{
              const d=new Date(match.date),mode=match.mode||10;
              const imB=(match.blue||[]).some(p=>p?.name===user?.name);
              const imR=mode===10&&(match.red||[]).some(p=>p?.name===user?.name);
              const tot=[...(match.blue||[]),...(mode===10?(match.red||[]):[])].filter(Boolean).length;
              return<div key={match.id} style={{...S.matchCard,...(imB?{borderColor:"#5383e844"}:imR?{borderColor:"#e8405744"}:{})}}>
                <div style={S.matchHd}>
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <span style={{fontSize:15,fontWeight:700,color:"#f0e6d2"}}>{fD(d)} {fT(match.time)}</span>
                      <span style={{fontSize:10,padding:"1px 6px",borderRadius:8,background:mode===5?"#5383e818":"#9b59b618",color:mode===5?"#5383e8":"#9b59b6",border:`1px solid ${mode===5?"#5383e833":"#9b59b633"}`}}>{mode}인</span>
                    </div>
                    <div style={{fontSize:11,color:"#5b5a56",marginTop:2}}>{tot}명 참가{(imB||imR)&&<span style={{color:imB?"#5383e8":"#e84057"}}> · {imB?"블루":"레드"}팀</span>}</div>
                  </div>
                  {isAdmin&&<button onClick={()=>delMatch(match.id)} style={S.delBtn}>삭제</button>}
                </div>
                <div style={S.matchBody}>
                  <Side label={mode===5?"팀":"블루팀"} color="#5383e8" icon="🔷" data={match.blue} matchId={match.id} side="blue"/>
                  {mode===10&&<><div style={S.vs}>VS</div><Side label="레드팀" color="#e84057" icon="🔶" data={match.red} matchId={match.id} side="red"/></>}
                </div>
              </div>;
            })}
          </div>}
        </div>}
      </main>

      {/* MATCH MODAL */}
      {modal&&isAdmin&&<div style={S.ov} onClick={()=>setModal(false)}>
        <div style={{...S.mod,maxWidth:matchMode===5?420:660}} onClick={e=>e.stopPropagation()}>
          <h3 style={{fontSize:16,fontWeight:700,color:"#f0e6d2",marginBottom:14}}>{matchMode}인 내전 등록</h3>
          <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>
            <div style={{flex:1,minWidth:120}}><label style={S.lab}>날짜</label><select value={mDate} onChange={e=>setMDate(e.target.value)} style={{...S.sel,width:"100%"}}>{wk.map((d,i)=><option key={i} value={dS(d)}>{fD(d)}</option>)}</select></div>
            <div style={{flex:1,minWidth:100}}><label style={S.lab}>시간</label><select value={mTime} onChange={e=>setMTime(e.target.value)} style={{...S.sel,width:"100%"}}>{hrs.map(h=><option key={h} value={h}>{fT(h)}</option>)}</select></div>
          </div>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            <div style={{flex:1,minWidth:180}}>
              <div style={{fontSize:13,fontWeight:700,color:"#5383e8",marginBottom:6}}>{matchMode===5?"🔷 팀":"🔷 블루팀"}</div>
              {POS.map((pos,idx)=>{const p=mBlue[idx],act=pickSide?.side==="blue"&&pickSide?.idx===idx;
                return<div key={idx} style={{...S.pickSlot,...(act?{borderColor:"#5383e8",background:"#5383e80d"}:{})}}>
                  <span style={{color:PC[pos],fontSize:11,minWidth:46}}>{PI[pos]} {pos}</span>
                  {p?<div style={{display:"flex",alignItems:"center",gap:3,flex:1}}><span style={{fontSize:12,color:"#f0e6d2",flex:1}}>{p.name}</span><button onClick={()=>rmSlot("blue",idx)} style={{...S.noB,fontSize:9,padding:"1px 4px"}}>✕</button></div>
                  :<button onClick={()=>setPickSide({side:"blue",idx})} style={{...S.pickBtnS,...(act?{borderColor:"#5383e8",color:"#5383e8"}:{})}}>선택</button>}
                </div>})}
            </div>
            {matchMode===10&&<div style={{flex:1,minWidth:180}}>
              <div style={{fontSize:13,fontWeight:700,color:"#e84057",marginBottom:6}}>🔶 레드팀</div>
              {POS.map((pos,idx)=>{const p=mRed[idx],act=pickSide?.side==="red"&&pickSide?.idx===idx;
                return<div key={idx} style={{...S.pickSlot,...(act?{borderColor:"#e84057",background:"#e840570d"}:{})}}>
                  <span style={{color:PC[pos],fontSize:11,minWidth:46}}>{PI[pos]} {pos}</span>
                  {p?<div style={{display:"flex",alignItems:"center",gap:3,flex:1}}><span style={{fontSize:12,color:"#f0e6d2",flex:1}}>{p.name}</span><button onClick={()=>rmSlot("red",idx)} style={{...S.noB,fontSize:9,padding:"1px 4px"}}>✕</button></div>
                  :<button onClick={()=>setPickSide({side:"red",idx})} style={{...S.pickBtnS,...(act?{borderColor:"#e84057",color:"#e84057"}:{})}}>선택</button>}
                </div>})}
            </div>}
          </div>
          <PickPanel/>
          <div style={{display:"flex",gap:8,marginTop:16,justifyContent:"flex-end"}}><button onClick={()=>setModal(false)} style={S.ghost}>취소</button><button onClick={createMatch} style={S.pri}>등록</button></div>
        </div>
      </div>}

      {/* ADD MEMBER MODAL */}
      {addModal&&<div style={S.ov} onClick={()=>setAddModal(null)}>
        <div style={{...S.mod,maxWidth:360}} onClick={e=>e.stopPropagation()}>
          <h3 style={{fontSize:15,fontWeight:700,color:"#f0e6d2",marginBottom:14}}>인원 추가 — {teams[addModal.teamIdx]?.name}</h3>
          <label style={S.lab}>이름 *</label>
          <input value={addName} onChange={e=>setAddName(e.target.value)} placeholder="이름" style={{...S.lInput,marginBottom:8}} autoFocus onKeyDown={e=>e.key==="Enter"&&addMember()}/>
          <label style={S.lab}>닉네임</label>
          <input value={addNick} onChange={e=>setAddNick(e.target.value)} placeholder="닉네임 (선택)" style={{...S.lInput,marginBottom:8}}/>
          <label style={S.lab}>포지션</label>
          <div style={S.posRow}>{POS.map(p=><button key={p} onClick={()=>setAddPos(p)} style={{...S.posBtn,...(addPos===p?{borderColor:PC[p],background:PC[p]+"18",color:PC[p]}:{})}}>{PI[p]} {p}</button>)}</div>
          <div style={{display:"flex",gap:8,marginTop:14,justifyContent:"flex-end"}}><button onClick={()=>setAddModal(null)} style={S.ghost}>취소</button><button onClick={addMember} style={S.pri}>추가</button></div>
        </div>
      </div>}

      {/* DETAIL POPUP */}
      {detSlot&&(tab==="overview"||(tab==="schedule"&&isAdmin))&&!best().find(s=>s.slot===detSlot)&&slotM(detSlot).length>0&&(
        <div style={S.ov} onClick={()=>setDetSlot(null)}><div style={S.mod} onClick={e=>e.stopPropagation()}>
          <h3 style={{fontSize:14,fontWeight:700,color:"#f0e6d2",marginBottom:10}}>{(()=>{const[ds,hr]=detSlot.split("_");return`${fD(new Date(ds))} ${fT(+hr)}`})()}</h3>
          {renderTeamList(slotM(detSlot))}
          <button onClick={()=>setDetSlot(null)} style={{...S.ghost,marginTop:12,width:"100%"}}>닫기</button>
        </div></div>
      )}

      {/* CONFIRM */}
      {confirm&&<div style={S.ov} onClick={()=>setConfirm(null)}><div style={{...S.mod,maxWidth:340,textAlign:"center"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:28,marginBottom:8}}>⚠️</div>
        <p style={{color:"#f0e6d2",fontSize:13,whiteSpace:"pre-line",marginBottom:14}}>{confirm.msg}</p>
        <div style={{display:"flex",gap:8,justifyContent:"center"}}><button onClick={()=>setConfirm(null)} style={S.ghost}>취소</button><button onClick={confirm.onOk} style={{...S.danger,padding:"9px 22px"}}>확인</button></div>
      </div></div>}

      {toast&&<div style={S.toast}>{toast}</div>}
    </div>
  );
}

const S={
  root:{minHeight:"100vh",background:"linear-gradient(170deg,#010a13 0%,#0a1428 40%,#071222 100%)",fontFamily:"'Noto Sans KR',sans-serif",color:"#a09b8c"},
  load:{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#010a13"},
  spin:{width:36,height:36,border:"3px solid #1e2328",borderTopColor:"#c8aa6e",borderRadius:"50%",animation:"sp .8s linear infinite"},
  loginWrap:{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20},
  loginCard:{background:"linear-gradient(145deg,#1a1e24,#12151b)",border:"1px solid #463714",borderRadius:16,padding:"40px 36px",width:"100%",maxWidth:380,textAlign:"center",animation:"fi .5s ease,glow 4s ease-in-out infinite"},
  logoTitle:{fontFamily:"'Black Han Sans'",fontSize:28,background:"linear-gradient(180deg,#f0e6d2,#c8aa6e)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",lineHeight:1.2},
  logoDesc:{fontSize:13,color:"#5b5a56",marginTop:4},
  divider:{height:1,background:"linear-gradient(90deg,transparent,#463714,transparent)",margin:"20px 0"},
  lf:{display:"flex",flexDirection:"column",gap:10,textAlign:"left"},
  lInput:{background:"#080e18",border:"1px solid #2a2d30",borderRadius:8,color:"#f0e6d2",fontSize:14,padding:"11px 14px",width:"100%",fontFamily:"'Noto Sans KR'",outline:"none"},
  lBtn:{background:"linear-gradient(180deg,#c8aa6e,#785a28)",border:"none",borderRadius:8,padding:"12px",color:"#010a13",fontSize:15,fontWeight:700,fontFamily:"'Noto Sans KR'",boxShadow:"0 4px 16px rgba(200,170,110,.25)",cursor:"pointer"},
  tag:{fontSize:9,padding:"2px 8px",borderRadius:10,background:"rgba(200,170,110,.1)",color:"#c8aa6e"},
  posRow:{display:"flex",gap:4,flexWrap:"wrap"},
  posBtn:{padding:"5px 9px",borderRadius:6,border:"1px solid #2a2d30",background:"transparent",color:"#8c8c8c",fontSize:11,fontFamily:"'Noto Sans KR'",fontWeight:500,cursor:"pointer",transition:"all .15s"},
  hdr:{background:"linear-gradient(180deg,#1a1e24,#13161b)",borderBottom:"1px solid #463714",padding:"0 14px",position:"sticky",top:0,zIndex:100},
  hdrIn:{maxWidth:1200,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",flexWrap:"wrap",gap:8},
  hdrTitle:{fontFamily:"'Black Han Sans'",fontSize:15,background:"linear-gradient(180deg,#f0e6d2,#c8aa6e)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"},
  nav:{display:"flex",gap:3,flexWrap:"wrap"},
  nb:{padding:"5px 10px",border:"1px solid #222630",borderRadius:5,background:"transparent",color:"#6b6b6b",fontSize:11,fontFamily:"'Noto Sans KR'",fontWeight:500,cursor:"pointer",transition:"all .2s"},
  nbA:{background:"linear-gradient(180deg,#1e2328,#2a2210)",borderColor:"#785a28",color:"#f0e6d2",boxShadow:"0 2px 8px rgba(200,170,110,.1)"},
  uArea:{display:"flex",alignItems:"center",gap:6},
  uBadge:{fontSize:10,color:"#c8aa6e",padding:"4px 10px",borderRadius:10,background:"rgba(200,170,110,.06)",border:"1px solid #33291a",whiteSpace:"nowrap"},
  logoutBtn:{fontSize:9,color:"#5b5a56",background:"transparent",border:"1px solid #222630",borderRadius:4,padding:"4px 8px",fontFamily:"'Noto Sans KR'",cursor:"pointer"},
  main:{maxWidth:1200,margin:"0 auto",padding:"20px 14px 60px"},
  st:{fontFamily:"'Black Han Sans'",fontSize:20,color:"#f0e6d2",marginBottom:12},
  sub:{fontSize:14,color:"#f0e6d2",fontWeight:700,marginBottom:10},
  lab:{display:"block",fontSize:10,color:"#5b5a56",marginBottom:4,fontWeight:500},
  actRow:{display:"flex",gap:8,marginTop:14,justifyContent:"center",flexWrap:"wrap"},
  pri:{background:"linear-gradient(180deg,#c8aa6e,#785a28)",border:"none",borderRadius:6,padding:"9px 22px",color:"#010a13",fontSize:13,fontWeight:700,fontFamily:"'Noto Sans KR'",boxShadow:"0 2px 10px rgba(200,170,110,.2)",cursor:"pointer"},
  ghost:{background:"transparent",border:"1px solid #2a2d30",borderRadius:6,padding:"9px 18px",color:"#8c8c8c",fontSize:12,fontFamily:"'Noto Sans KR'",cursor:"pointer"},
  danger:{background:"transparent",border:"1px solid #e84057",borderRadius:6,padding:"7px 16px",color:"#e84057",fontSize:11,fontFamily:"'Noto Sans KR'",cursor:"pointer"},
  sel:{background:"#0d1117",border:"1px solid #2a2d30",borderRadius:5,color:"#f0e6d2",fontSize:12,padding:"8px 10px",fontFamily:"'Noto Sans KR'",cursor:"pointer"},
  selBadge:{display:"inline-block",background:"linear-gradient(135deg,#2a2210,#1a1408)",color:"#c8aa6e",padding:"5px 14px",borderRadius:14,fontSize:12,fontWeight:500,border:"1px solid #46371433"},
  infoBox:{padding:"14px 16px",borderRadius:8,border:"1px solid #e8405733",background:"rgba(232,64,87,.03)",marginBottom:16},
  myCard:{background:"linear-gradient(145deg,#12151b,#0d1017)",border:"1px solid #1e2328",borderRadius:10,overflow:"hidden",maxWidth:480},
  myRow:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 18px",borderBottom:"1px solid #1a1e24",gap:10,flexWrap:"wrap"},
  myL:{fontSize:12,color:"#5b5a56",fontWeight:500,minWidth:55},myV:{fontSize:14,color:"#f0e6d2",fontWeight:500},
  myEdit:{fontSize:13,color:"#c8aa6e",cursor:"pointer",padding:"4px 10px",borderRadius:4,border:"1px dashed #463714"},
  teamGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:12},
  teamCard:{background:"linear-gradient(145deg,#12151b,#0c0f15)",border:"1px solid #1e2328",borderTop:"2px solid",borderRadius:8,overflow:"hidden"},
  teamHd:{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderBottom:"1px solid #1e232866"},
  teamBdg:{width:22,height:22,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,border:"1px solid"},
  addBtn:{background:"transparent",border:"1px solid #2daf7f44",borderRadius:4,color:"#2daf7f",fontSize:14,fontWeight:700,padding:"0 7px",cursor:"pointer",marginLeft:4,lineHeight:"20px"},
  mRow:{display:"flex",alignItems:"center",padding:"5px 10px",gap:5,borderBottom:"1px solid #0d1117"},
  pSel:{background:"transparent",border:"1px solid #222630",borderRadius:4,padding:"2px 3px",fontSize:10,cursor:"pointer",fontFamily:"'Noto Sans KR'",color:"#8c8c8c",minWidth:74},
  mvSel:{background:"transparent",border:"1px solid #222630",borderRadius:4,padding:"2px 3px",fontSize:9,cursor:"pointer",fontFamily:"'Noto Sans KR'",color:"#5b5a56",minWidth:48},
  delMBtn:{background:"transparent",border:"1px solid #e8405722",borderRadius:4,padding:"2px 6px",color:"#e84057",fontSize:10,cursor:"pointer",opacity:.5},
  mInfo:{display:"flex",alignItems:"center",gap:5,flex:1,flexWrap:"wrap",minWidth:0},
  nameT:{fontSize:13,color:"#f0e6d2",fontWeight:600,cursor:"pointer",padding:"2px 5px",borderRadius:3},
  nickT:{fontSize:10,color:"#5b5a56",cursor:"pointer",padding:"2px 6px",borderRadius:3,border:"1px dashed #222630"},
  ie:{display:"inline-flex",alignItems:"center",gap:3},
  eIn:{background:"#080e18",border:"1px solid #463714",borderRadius:3,color:"#f0e6d2",fontSize:12,padding:"3px 7px",width:80,fontFamily:"'Noto Sans KR'"},
  okB:{background:"#2daf7f",color:"#fff",border:"none",borderRadius:3,padding:"2px 6px",fontSize:11,fontWeight:700,cursor:"pointer"},
  noB:{background:"#e84057",color:"#fff",border:"none",borderRadius:3,padding:"2px 6px",fontSize:11,fontWeight:700,cursor:"pointer"},
  cw:{border:"1px solid #1e2328",borderRadius:8,overflow:"hidden",background:"#0a0e14"},
  csc:{overflowX:"auto"},ct:{width:"100%",borderCollapse:"collapse",minWidth:500},
  cTh:{padding:"8px 4px",fontSize:10,fontWeight:500,color:"#6b6b6b",textAlign:"center",borderBottom:"1px solid #1a1e24",background:"#0f1318",whiteSpace:"nowrap"},
  cTi:{padding:"6px 8px",fontSize:10,color:"#5b5a56",textAlign:"center",borderRight:"1px solid #151820",whiteSpace:"nowrap",background:"#080c12"},
  cC:{padding:"6px 3px",textAlign:"center",cursor:"pointer",border:"1px solid #121620",minWidth:56,verticalAlign:"middle"},
  cSel:{background:"rgba(200,170,110,.14)",borderColor:"#785a28"},
  cDone:{background:"rgba(45,175,127,.07)",cursor:"default"},
  cO:{padding:"5px 3px",textAlign:"center",border:"1px solid #1a1e24",minWidth:56,verticalAlign:"top",cursor:"pointer"},
  empty:{textAlign:"center",padding:"32px 20px",border:"1px dashed #1e2328",borderRadius:8,background:"#080c1244"},
  bGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:10},
  bCard:{background:"linear-gradient(145deg,#161a20,#0f1318)",border:"1px solid #222630",borderRadius:8,padding:12,cursor:"pointer",transition:"all .2s",animation:"fi .3s ease both"},
  mBdg:{display:"inline-block",fontSize:10,padding:"2px 8px",borderRadius:10,background:"rgba(45,175,127,.1)",color:"#2daf7f",fontWeight:600},
  tgWrap:{display:"flex",flexDirection:"column",gap:5},
  tgBox:{background:"rgba(8,14,24,.5)",borderRadius:6,padding:"6px 8px",borderLeft:"3px solid #463714",border:"1px solid #1e232866"},
  tgHead:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3,paddingBottom:3,borderBottom:"1px solid #1a1e2444"},
  tgBadge:{fontSize:10,fontWeight:700,padding:"1px 8px",borderRadius:10,border:"1px solid"},
  tgRow:{display:"flex",alignItems:"center",gap:2,padding:"2px 0"},
  matchCard:{background:"linear-gradient(145deg,#12151b,#0c0f15)",border:"1px solid #1e2328",borderRadius:10,overflow:"hidden",transition:"border-color .2s"},
  matchHd:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",borderBottom:"1px solid #1a1e24",background:"linear-gradient(90deg,#161a20,#12151b)"},
  matchBody:{display:"flex",alignItems:"flex-start",padding:"14px 16px",gap:10,flexWrap:"wrap"},
  sideCol:{flex:1,minWidth:170},
  sideTag:{fontSize:12,fontWeight:700,marginBottom:8,padding:"4px 10px",borderRadius:6,border:"1px solid",display:"inline-flex",alignItems:"center",gap:4},
  vs:{display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:900,color:"#33291a",padding:"28px 6px 0",minWidth:28,fontFamily:"'Black Han Sans'"},
  slotR:{display:"flex",alignItems:"center",gap:5,padding:"3px 0",borderBottom:"1px solid #1a1e2433"},
  miniSel:{background:"transparent",border:"1px solid #222630",borderRadius:3,padding:"1px 2px",fontSize:9,cursor:"pointer",fontFamily:"'Noto Sans KR'",color:"#8c8c8c",minWidth:38},
  delBtn:{background:"transparent",border:"1px solid #e8405733",borderRadius:4,padding:"3px 10px",color:"#e84057",fontSize:10,fontFamily:"'Noto Sans KR'",cursor:"pointer"},
  ov:{position:"fixed",inset:0,background:"rgba(0,0,0,.78)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:14},
  mod:{background:"linear-gradient(145deg,#1a1e24,#12151b)",border:"1px solid #463714",borderRadius:12,padding:22,width:"100%",maxWidth:480,maxHeight:"88vh",overflow:"auto",animation:"mi .2s ease"},
  pickSlot:{display:"flex",alignItems:"center",gap:6,padding:"5px 8px",borderRadius:6,border:"1px solid #1a1e24",marginBottom:3,transition:"all .15s"},
  pickBtnS:{fontSize:10,padding:"3px 10px",borderRadius:4,border:"1px dashed #2a2d30",background:"transparent",color:"#5b5a56",fontFamily:"'Noto Sans KR'",cursor:"pointer"},
  pickPanel:{marginTop:12,padding:12,borderRadius:8,border:"1px solid #33291a",background:"#080e18"},
  vTab:{fontSize:10,padding:"3px 10px",borderRadius:4,border:"1px solid #2a2d30",background:"transparent",color:"#5b5a56",fontFamily:"'Noto Sans KR'",cursor:"pointer"},
  vTabA:{borderColor:"#c8aa6e",color:"#c8aa6e",background:"rgba(200,170,110,.06)"},
  pickGrid:{display:"flex",flexWrap:"wrap",gap:8,maxHeight:220,overflow:"auto",padding:"4px 0"},
  pickBox:{minWidth:90,flex:"1 1 90px"},
  pickChip:{display:"flex",alignItems:"center",padding:"3px 8px",borderRadius:4,border:"1px solid #1e2328",cursor:"pointer",background:"#0d1117",marginBottom:2,transition:"all .12s"},
  toast:{position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",background:"linear-gradient(135deg,#1a1e24,#2a2210)",border:"1px solid #c8aa6e",borderRadius:8,padding:"9px 20px",color:"#f0e6d2",fontSize:12,fontWeight:500,animation:"ti .3s ease",zIndex:300,boxShadow:"0 8px 28px rgba(0,0,0,.6)",whiteSpace:"nowrap"},
};
