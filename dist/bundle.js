"use strict";(()=>{function d(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function b(e){try{let t=new URL(e);if(t.protocol==="http:"||t.protocol==="https:")return e}catch{}return""}function g(e,t){document.getElementById("modal-overlay")?.remove();let r=document.createElement("div");r.id="modal-overlay",r.className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50";let a=document.createElement("div");a.className="bg-gray-800 border border-gray-700 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl";let i=document.createElement("p");i.className="text-white text-center mb-6 text-base leading-relaxed",i.textContent=e,a.appendChild(i);let l=document.createElement("div");if(l.className="flex gap-3 justify-center",t){let c=document.createElement("button");c.className="flex-1 py-2.5 rounded-xl bg-gray-600 hover:bg-gray-500 text-white font-semibold transition",c.textContent="\u041E\u0442\u043C\u0435\u043D\u0430",c.onclick=()=>r.remove(),l.appendChild(c);let x=document.createElement("button");x.className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold transition",x.textContent="\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044C",x.onclick=()=>{r.remove(),t()},l.appendChild(x)}else{let c=document.createElement("button");c.className="px-10 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition",c.textContent="OK",c.onclick=()=>r.remove(),l.appendChild(c)}a.appendChild(l),r.appendChild(a),r.addEventListener("click",c=>{c.target===r&&r.remove()}),document.body.appendChild(r)}function G(e){let t=Math.floor((Date.now()-e)/6e4);if(t<1)return"\u0442\u043E\u043B\u044C\u043A\u043E \u0447\u0442\u043E";if(t<60)return`${t} \u043C\u0438\u043D. \u043D\u0430\u0437\u0430\u0434`;let r=Math.floor(t/60);return r<24?`${r} \u0447. \u043D\u0430\u0437\u0430\u0434`:`${Math.floor(r/24)} \u0434. \u043D\u0430\u0437\u0430\u0434`}function O(e,t){let r=new Blob([JSON.stringify(e,null,2)],{type:"application/json"}),a=URL.createObjectURL(r),i=document.createElement("a");i.href=a,i.download=t,i.click(),URL.revokeObjectURL(a)}var D="clu_packs",K="clu_character_sets",J="clu_saves";function I(){try{let e=JSON.parse(localStorage.getItem(D)??"[]");return Array.isArray(e)?e:[]}catch{return[]}}function S(e){localStorage.setItem(D,JSON.stringify(e))}function M(){try{let e=JSON.parse(localStorage.getItem(K)??"[]");return Array.isArray(e)?e:[]}catch{return[]}}function E(e){localStorage.setItem(K,JSON.stringify(e))}function f(){try{let e=JSON.parse(localStorage.getItem(J)??"[]");return Array.isArray(e)?e:[]}catch{return[]}}function A(e){let t=f(),r=t.findIndex(l=>l.id===e.id),a=e.unlockedUpTo>=0?e.characterSet.characters[e.unlockedUpTo]?.name??"":"",i={id:e.id,playerName:e.playerName,packTitle:e.pack.title,charName:a,questionProgress:`${e.currentIndex+1} / ${e.shuffledQuestions.length}`,totalStars:e.totalStars,savedAt:Date.now(),state:e};r>=0?t[r]=i:t.unshift(i),localStorage.setItem(J,JSON.stringify(t))}function H(e){let t=f().filter(r=>r.id!==e);localStorage.setItem(J,JSON.stringify(t))}async function V(){try{let t=await(await fetch("packs/index.json")).json();return Promise.all(t.map(r=>fetch(`packs/${r}`).then(a=>a.json())))}catch{return[]}}async function Y(){try{let t=await(await fetch("characters/index.json")).json();return Promise.all(t.map(r=>fetch(`characters/${r}`).then(a=>a.json())))}catch{return[]}}var o=null,j=null,y=0,h=()=>{},Z=[],ee=[];function te(e){h=e}async function re(){[Z,ee]=await Promise.all([V(),Y()])}function ae(){return f().length>0}function fe(){return[...Z,...I()]}function he(){return[...ee,...M()]}function se(e){let t=fe(),r=he(),a=t.length>0&&r.length>0;if(e.innerHTML=`
    <div class="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-950">
      <h1 class="text-3xl font-bold mb-8">\u041D\u043E\u0432\u0430\u044F \u0438\u0433\u0440\u0430</h1>

      <div class="w-full max-w-md space-y-5">

        <div>
          <label class="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">\u0418\u043C\u044F \u0438\u0433\u0440\u043E\u043A\u0430</label>
          <input id="inp-name" type="text" maxlength="40" placeholder="\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0438\u043C\u044F..."
            class="w-full bg-gray-800 text-white rounded-xl px-4 py-3 border border-gray-700 focus:outline-none focus:border-indigo-500" />
        </div>

        <div>
          <label class="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">\u041F\u0430\u043A\u0435\u0442 \u0432\u043E\u043F\u0440\u043E\u0441\u043E\u0432</label>
          ${t.length>0?`<select id="sel-pack" class="w-full bg-gray-800 text-white rounded-xl px-4 py-3 border border-gray-700 focus:outline-none focus:border-indigo-500">
                ${t.map((i,l)=>`<option value="${l}">${d(i.title)} (${i.questions.length} \u0432\u043E\u043F\u0440. \xB7 ${i.starsPerCorrect}\u2605)</option>`).join("")}
               </select>`:'<div class="bg-gray-800 text-red-400 rounded-xl px-4 py-3 text-sm">\u041D\u0435\u0442 \u043F\u0430\u043A\u0435\u0442\u043E\u0432. \u0421\u043E\u0437\u0434\u0430\u0439\u0442\u0435 \u0432 \xAB\u0420\u0435\u0434\u0430\u043A\u0442\u043E\u0440\u0435 \u0432\u043E\u043F\u0440\u043E\u0441\u043E\u0432\xBB.</div>'}
        </div>

        <div>
          <label class="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">\u041D\u0430\u0431\u043E\u0440 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436\u0435\u0439</label>
          ${r.length>0?`<select id="sel-chars" class="w-full bg-gray-800 text-white rounded-xl px-4 py-3 border border-gray-700 focus:outline-none focus:border-indigo-500">
                ${r.map((i,l)=>`<option value="${l}">${d(i.title)} (${i.characters.length} \u043F\u0435\u0440\u0441.)</option>`).join("")}
               </select>`:'<div class="bg-gray-800 text-red-400 rounded-xl px-4 py-3 text-sm">\u041D\u0435\u0442 \u043D\u0430\u0431\u043E\u0440\u043E\u0432. \u0421\u043E\u0437\u0434\u0430\u0439\u0442\u0435 \u0432 \xAB\u0420\u0435\u0434\u0430\u043A\u0442\u043E\u0440\u0435 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436\u0435\u0439\xBB.</div>'}
          <div id="compat-warning"></div>
        </div>

        <div>
          <label class="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">\u0422\u0430\u0439\u043C\u0435\u0440 \u043D\u0430 \u0432\u043E\u043F\u0440\u043E\u0441 (\u0441\u0435\u043A, 0 = \u0431\u0435\u0437 \u0442\u0430\u0439\u043C\u0435\u0440\u0430)</label>
          <input id="inp-timer" type="number" min="0" max="300" value="0"
            class="w-full bg-gray-800 text-white rounded-xl px-4 py-3 border border-gray-700 focus:outline-none focus:border-indigo-500" />
        </div>

        <button id="btn-start"
          class="w-full py-4 rounded-xl font-bold text-lg transition
            ${a?"bg-indigo-600 hover:bg-indigo-500 text-white":"bg-gray-700 text-gray-500 cursor-not-allowed"}"
          ${a?"":"disabled"}>
          \u041D\u0430\u0447\u0430\u0442\u044C \u0438\u0433\u0440\u0443
        </button>

        <button id="btn-back"
          class="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold transition">
          \u041D\u0430\u0437\u0430\u0434
        </button>

      </div>
    </div>
  `,a){let i=e.querySelector("#sel-pack"),l=e.querySelector("#sel-chars"),c=()=>{let x=t[parseInt(i.value)],v=r[parseInt(l.value)],u=e.querySelector("#compat-warning");if(!x||!v){u.innerHTML="";return}let p=x.questions.length*x.starsPerCorrect,m=[...v.characters].sort((Q,be)=>Q.cost-be.cost),k=m[m.length-1]?.cost??0,z=m.filter(Q=>Q.cost<=p).length;z===0?u.innerHTML=`<div class="mt-2 px-3 py-2 bg-red-950 border border-red-800 rounded-xl text-red-300 text-xs">
          \u26D4 \u041D\u0435\u043B\u044C\u0437\u044F \u043E\u0442\u043A\u0440\u044B\u0442\u044C \u043D\u0438 \u043E\u0434\u043D\u043E\u0433\u043E \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436\u0430 \u2014 \u043C\u0430\u043A\u0441. ${p}\u2605, \u0430 \u0441\u0430\u043C\u044B\u0439 \u0434\u0435\u0448\u0451\u0432\u044B\u0439 \u0441\u0442\u043E\u0438\u0442 ${m[0]?.cost??0}\u2605
        </div>`:p<k?u.innerHTML=`<div class="mt-2 px-3 py-2 bg-yellow-950 border border-yellow-800 rounded-xl text-yellow-300 text-xs">
          \u26A0 \u041C\u043E\u0436\u043D\u043E \u043E\u0442\u043A\u0440\u044B\u0442\u044C ${z} \u0438\u0437 ${m.length} \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436\u0435\u0439 (\u043C\u0430\u043A\u0441. ${p}\u2605, \u043D\u0443\u0436\u043D\u043E ${k}\u2605)
        </div>`:u.innerHTML=`<div class="mt-2 px-3 py-2 bg-green-950 border border-green-800 rounded-xl text-green-400 text-xs">
          \u2713 \u0412\u0441\u0435 ${m.length} ${ye(m.length,"\u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436","\u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436\u0430","\u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436\u0435\u0439")} \u043E\u0442\u043A\u0440\u044B\u0432\u0430\u0435\u043C\u044B (\u043C\u0430\u043A\u0441. ${p}\u2605 \u043F\u0440\u0438 \u043D\u0443\u0436\u043D\u044B\u0445 ${k}\u2605)
        </div>`};i.addEventListener("change",c),l.addEventListener("change",c),c(),e.querySelector("#btn-start")?.addEventListener("click",()=>{let x=e.querySelector("#inp-name").value.trim(),v=parseInt(i.value),u=parseInt(l.value),p=Math.max(0,parseInt(e.querySelector("#inp-timer").value)||0);ke(t[v],r[u],p,x)})}e.querySelector("#btn-back")?.addEventListener("click",()=>h("home"))}function ye(e,t,r,a){let i=e%100;if(i>=11&&i<=14)return a;switch(e%10){case 1:return t;case 2:case 3:case 4:return r;default:return a}}function we(e){let t=[...e];for(let r=t.length-1;r>0;r--){let a=Math.floor(Math.random()*(r+1));[t[r],t[a]]=[t[a],t[r]]}return t}function ke(e,t,r,a){let i=[...t.characters].sort((l,c)=>l.cost-c.cost);o={id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),playerName:a,pack:e,characterSet:{...t,characters:i},shuffledQuestions:we(e.questions),currentIndex:0,totalStars:0,timerSeconds:r,unlockedUpTo:-1},A(o),h("game"),R()}function ne(e){let t=f().find(r=>r.id===e);t&&(o=t.state,h("game"),R())}function R(){if(!o)return;w();let e=document.getElementById("screen-game"),t=o.characterSet.characters,r=o.unlockedUpTo>=0?t[o.unlockedUpTo]??null:null,a=t[o.unlockedUpTo+1]??null,i=o.shuffledQuestions[o.currentIndex],l=r?.cost??0,c=a?.cost??l,x=a?Math.min(100,Math.max(0,(o.totalStars-l)/(c-l)*100)):100,v=a?Math.max(0,a.cost-o.totalStars):0,u=(p,m="")=>{let k=p?b(p):"";return k?`<img src="${k}" alt="" class="${m}" />`:null};e.innerHTML=`
    <div class="h-screen flex flex-col bg-gray-950">

      <!-- Main -->
      <div class="flex flex-1 min-h-0">

        <!-- Center: question -->
        <div class="flex-1 flex flex-col items-center justify-center gap-5 p-8 overflow-y-auto">

          ${o.timerSeconds>0?`<div id="timer-display" class="text-6xl font-black text-white leading-none">${o.timerSeconds}</div>`:""}

          ${u(i.imageUrl,"max-h-[55vh] max-w-full w-full object-contain rounded-2xl")??""}

          <div class="text-2xl font-semibold text-center max-w-2xl leading-relaxed">
            ${d(i.text)}
          </div>

          <button id="btn-show-answer"
            class="py-3 px-10 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-lg transition">
            \u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u043E\u0442\u0432\u0435\u0442
          </button>

          <div id="answer-block" class="hidden w-full max-w-xl flex flex-col gap-4">
            <div class="bg-gray-800 border border-gray-700 rounded-xl p-4 text-center">
              <div class="text-xs text-gray-400 uppercase tracking-wider mb-1">\u041E\u0442\u0432\u0435\u0442</div>
              <div class="text-xl font-bold text-green-400">${d(i.answer)}</div>
            </div>
            <div class="flex gap-3">
              <button id="btn-wrong"
                class="flex-1 py-4 bg-red-700 hover:bg-red-600 text-white rounded-2xl font-bold text-lg transition shadow-lg shadow-red-950/50 flex flex-col items-center gap-0.5">
                <span class="text-2xl">\u2715</span>
                <span>\u041D\u0435\u0432\u0435\u0440\u043D\u043E</span>
              </button>
              <button id="btn-correct"
                class="flex-1 py-4 bg-green-700 hover:bg-green-600 text-white rounded-2xl font-bold text-lg transition shadow-lg shadow-green-950/50 flex flex-col items-center gap-0.5">
                <span class="text-2xl">\u2713</span>
                <span>\u041F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u043E +${o.pack.starsPerCorrect}\u2605</span>
              </button>
            </div>
          </div>

        </div>

        <!-- Right panel: character progression -->
        <div class="w-[27%] flex-shrink-0 bg-gray-900 border-l border-gray-800 flex flex-col">

          <!-- Stars -->
          <div class="px-4 py-3 border-b border-gray-800 text-center flex-shrink-0">
            <div class="text-xs text-gray-500 uppercase tracking-widest mb-1">\u0417\u0432\u0451\u0437\u0434\u044B</div>
            <div class="text-yellow-400 font-black text-4xl">\u2605 ${o.totalStars}</div>
          </div>

          <!-- Current character -->
          <div class="flex-1 flex flex-col items-center px-4 pt-3 pb-2 min-h-0">
            <div class="text-xs text-gray-500 uppercase tracking-widest mb-2 flex-shrink-0">\u0422\u0435\u043A\u0443\u0449\u0438\u0439</div>
            <div class="flex-1 w-full min-h-0 flex items-center justify-center">
              ${r?(()=>{let p=r.imageUrl?b(r.imageUrl):"";return p?`<img src="${p}" alt="" class="max-h-full max-w-full object-contain rounded-3xl" />`:'<div class="w-full h-full bg-gray-700 rounded-3xl flex items-center justify-center text-7xl">\u265F</div>'})():'<div class="w-full h-full bg-gray-800 rounded-3xl flex items-center justify-center text-6xl opacity-40">\u{1F512}</div>'}
            </div>
            ${r?`<div class="font-black text-xl text-center mt-2 flex-shrink-0">${d(r.name)}</div>
                 <div class="text-yellow-400 text-sm mt-0.5 flex-shrink-0">\u2605 ${r.cost}</div>`:'<div class="text-gray-600 text-sm mt-2 flex-shrink-0">\u0415\u0449\u0451 \u043D\u0435 \u043E\u0442\u043A\u0440\u044B\u0442\u043E</div>'}
          </div>

          <!-- Progress bar -->
          <div class="px-4 py-2 flex-shrink-0">
            ${a?`<div class="text-xs text-gray-500 text-center mb-1.5">\u0414\u043E ${d(a.name)}: ${v}\u2605</div>
                 <div class="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                   <div class="bg-yellow-400 h-3 rounded-full transition-all duration-500" style="width:${x}%"></div>
                 </div>`:'<div class="text-center text-yellow-400 font-bold text-sm">\u2726 \u041C\u0430\u043A\u0441\u0438\u043C\u0443\u043C \u0434\u043E\u0441\u0442\u0438\u0433\u043D\u0443\u0442! \u2726</div>'}
          </div>

          <!-- Next character -->
          <div class="flex-1 flex flex-col items-center px-4 pt-2 pb-3 border-t border-gray-800 min-h-0">
            <div class="text-xs text-gray-500 uppercase tracking-widest mb-2 flex-shrink-0">\u0421\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0439</div>
            <div class="flex-1 w-full min-h-0 flex items-center justify-center">
              ${a?(()=>{let p=a.imageUrl?b(a.imageUrl):"";return p?`<img src="${p}" alt="" class="max-h-full max-w-full object-contain rounded-3xl opacity-35 grayscale" />`:'<div class="w-full h-full bg-gray-800 rounded-3xl flex items-center justify-center text-7xl opacity-35">\u{1F512}</div>'})():'<div class="w-full h-full bg-gray-800 rounded-3xl flex items-center justify-center text-8xl">\u{1F3C6}</div>'}
            </div>
            ${a?`<div class="font-bold text-lg text-center mt-2 text-gray-400 flex-shrink-0">${d(a.name)}</div>
                 <div class="text-yellow-400 text-sm mt-0.5 opacity-50 flex-shrink-0">\u2605 ${a.cost}</div>`:'<div class="font-bold text-lg text-center mt-2 text-gray-500 flex-shrink-0">\u0424\u0438\u043D\u0430\u043B!</div>'}
          </div>

          <!-- Bottom controls -->
          <div class="px-4 pb-4 flex-shrink-0 border-t border-gray-800 pt-3 space-y-2">
            <button id="btn-all-chars"
              class="w-full h-11 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold transition border border-gray-700 hover:border-gray-500 flex items-center justify-center gap-2">
              <span class="text-lg">\u{1F3C5}</span> \u0412\u0441\u0435 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436\u0438
            </button>

            <div class="flex gap-2">
              <!-- Question progress -->
              <div class="relative flex-1 h-11 rounded-xl overflow-hidden bg-gray-800 border border-gray-700">
                <div class="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 transition-all duration-500"
                  style="width:${Math.round((o.currentIndex+1)/o.shuffledQuestions.length*100)}%"></div>
                <span class="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white drop-shadow">
                  ${o.currentIndex+1} / ${o.shuffledQuestions.length}
                </span>
              </div>

              <!-- Exit -->
              <button id="btn-exit"
                class="h-11 px-4 bg-gray-800 hover:bg-red-950 text-gray-300 hover:text-red-300 rounded-xl font-semibold text-sm transition border border-gray-700 hover:border-red-800 flex-shrink-0">
                \u0412\u044B\u0445\u043E\u0434
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  `,e.querySelector("#btn-show-answer")?.addEventListener("click",()=>{e.querySelector("#btn-show-answer")?.classList.add("hidden"),e.querySelector("#answer-block")?.classList.remove("hidden"),w()}),e.querySelector("#btn-correct")?.addEventListener("click",()=>W(!0)),e.querySelector("#btn-wrong")?.addEventListener("click",()=>W(!1)),e.querySelector("#btn-all-chars")?.addEventListener("click",()=>Se()),e.querySelector("#btn-exit")?.addEventListener("click",()=>{g("\u0412\u044B\u0439\u0442\u0438 \u0438\u0437 \u0438\u0433\u0440\u044B? \u041F\u0440\u043E\u0433\u0440\u0435\u0441\u0441 \u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D.",()=>{w(),h("home")})}),o.timerSeconds>0&&ie(o.timerSeconds)}function Se(){if(!o)return;document.getElementById("all-chars-overlay")?.remove();let e=j!==null,t=y;w();let r=o.characterSet.characters,a=r[r.length-1]?.cost??0,i=document.createElement("div");i.id="all-chars-overlay",i.className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4";let l=(x,v)=>{let u=x?b(x):"";return u?`<img src="${u}" alt="" class="${`w-24 h-24 object-contain rounded-xl mb-2 ${v?"":"grayscale opacity-30"}`}" />`:`<div class="${`w-24 h-24 rounded-xl mb-2 flex items-center justify-center text-4xl
      ${v?"bg-gray-700":"bg-gray-800 opacity-30"}`}">${v?"\u265F":"\u{1F512}"}</div>`};i.innerHTML=`
    <div class="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[85vh]">

      <!-- Header -->
      <div class="flex items-center justify-between px-5 py-4 border-b border-gray-800">
        <div>
          <div class="font-bold text-lg">\u0412\u0441\u0435 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436\u0438</div>
          <div class="text-xs text-gray-400 mt-0.5">
            \u041D\u0430\u0431\u0440\u0430\u043D\u043E: <span class="text-yellow-400 font-bold">\u2605 ${o.totalStars}</span>
            &nbsp;\xB7&nbsp;
            \u0414\u043B\u044F \u0432\u0441\u0435\u0445: <span class="text-gray-300 font-semibold">\u2605 ${a}</span>
          </div>
        </div>
        <button id="btn-close-overlay"
          class="text-gray-400 hover:text-white text-2xl leading-none transition w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-800">
          \xD7
        </button>
      </div>

      <!-- Overall progress bar -->
      <div class="px-5 py-3 border-b border-gray-800">
        <div class="flex justify-between text-xs text-gray-500 mb-1.5">
          <span>\u041E\u0431\u0449\u0438\u0439 \u043F\u0440\u043E\u0433\u0440\u0435\u0441\u0441</span>
          <span>${Math.round(Math.min(100,o.totalStars/(a||1)*100))}%</span>
        </div>
        <div class="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
          <div class="bg-yellow-400 h-2.5 rounded-full transition-all"
            style="width:${Math.min(100,o.totalStars/(a||1)*100)}%"></div>
        </div>
      </div>

      <!-- Characters grid -->
      <div class="grid grid-cols-4 gap-4 p-5 overflow-y-auto flex-1">
        ${r.map((x,v)=>{let u=v<=o.unlockedUpTo;return`
            <div class="flex flex-col items-center rounded-xl p-3
              ${u?"bg-gray-800 border border-gray-700":"bg-gray-900 border border-gray-800"}">
              ${l(x.imageUrl,u)}
              <div class="text-xs font-semibold text-center leading-tight
                ${u?"text-white":"text-gray-600"}">
                ${d(x.name)}
              </div>
              <div class="text-xs mt-1 ${u?"text-yellow-400":"text-gray-700"}">
                ${u?"\u2713":"\u{1F512}"} \u2605 ${x.cost}
              </div>
            </div>
          `}).join("")}
      </div>

    </div>
  `,document.body.appendChild(i);let c=()=>{i.remove(),e&&t>0&&ie(t)};i.querySelector("#btn-close-overlay")?.addEventListener("click",c),i.addEventListener("click",x=>{x.target===i&&c()})}function ie(e){w(),y=e,F(),j=window.setInterval(()=>{y--,F(),y<=0&&(w(),document.getElementById("btn-show-answer")?.classList.add("hidden"),document.getElementById("answer-block")?.classList.remove("hidden"))},1e3)}function w(){j!==null&&(clearInterval(j),j=null)}function F(){let e=document.getElementById("timer-display");e&&(e.textContent=String(y),y<=5?e.className="text-6xl font-black text-red-500 leading-none":y<=10?e.className="text-6xl font-black text-yellow-400 leading-none":e.className="text-6xl font-black text-white leading-none")}function W(e){if(o){if(w(),e){o.totalStars+=o.pack.starsPerCorrect;let t=o.characterSet.characters,r=null;for(;o.unlockedUpTo+1<t.length&&o.totalStars>=t[o.unlockedUpTo+1].cost;)o.unlockedUpTo++,r=t[o.unlockedUpTo];if(A(o),r){let i=o.unlockedUpTo>=t.length-1?()=>{o.currentIndex++,H(o.id),oe(),h("results")}:()=>X();Ee(r,i);return}}X()}}function Ee(e,t){let r=document.createElement("div");r.className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50";let a=e.imageUrl?b(e.imageUrl):"";r.innerHTML=`
    <div class="text-center px-6">
      <div class="text-6xl mb-4">\u{1F389}</div>
      <div class="text-yellow-400 text-3xl font-black mb-4">\u041D\u043E\u0432\u044B\u0439 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436!</div>
      ${a?`<img src="${a}" alt="${d(e.name)}"
             class="w-36 h-36 object-contain mx-auto mb-4 rounded-2xl" />`:'<div class="w-36 h-36 bg-gray-700 rounded-2xl mx-auto mb-4 flex items-center justify-center text-6xl">\u2B50</div>'}
      <div class="text-3xl font-bold text-white mb-1">${d(e.name)}</div>
      <div class="text-gray-400 text-sm mb-8">\u041E\u0442\u043A\u0440\u044B\u0442 \u0437\u0430 ${e.cost} \u0437\u0432\u0451\u0437\u0434</div>
      <button id="btn-unlock-ok"
        class="py-3 px-12 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-2xl text-lg transition">
        \u041F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u0442\u044C
      </button>
    </div>
  `,document.body.appendChild(r),r.querySelector("#btn-unlock-ok")?.addEventListener("click",()=>{r.remove(),t()})}function X(){if(o){if(o.currentIndex++,o.currentIndex>=o.shuffledQuestions.length){H(o.id),oe(),h("results");return}A(o),R()}}function oe(){if(!o)return;let e=document.getElementById("screen-results"),t=o.characterSet.characters,r=o.unlockedUpTo>=0?t.slice(0,o.unlockedUpTo+1):[],a=o.unlockedUpTo>=0?t[o.unlockedUpTo]??null:null,i=(l,c)=>{let x=l?b(l):"";return x?`<img src="${x}" alt="" class="${c}" />`:`<div class="${c} bg-gray-700 flex items-center justify-center text-4xl">\u2B50</div>`};e.innerHTML=`
    <div class="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-950">
      <div class="text-6xl mb-3">\u{1F3C6}</div>
      <h1 class="text-3xl font-black text-yellow-400 mb-1">\u0418\u0433\u0440\u0430 \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u0430!</h1>
      <div class="text-gray-400 mb-8 text-sm">
        ${o.currentIndex} / ${o.shuffledQuestions.length} \u0432\u043E\u043F\u0440\u043E\u0441\u043E\u0432 \xB7 ${o.totalStars} \u0437\u0432\u0451\u0437\u0434 \u043D\u0430\u0431\u0440\u0430\u043D\u043E
      </div>

      <div class="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center w-full max-w-xs mb-6">
        <div class="text-xs text-gray-400 uppercase tracking-wider mb-3">\u0424\u0438\u043D\u0430\u043B\u044C\u043D\u044B\u0439 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436</div>
        ${a?`${i(a.imageUrl,"w-32 h-32 object-contain mx-auto mb-3 rounded-xl")}
             <div class="text-2xl font-bold">${d(a.name)}</div>`:`<div class="w-32 h-32 bg-gray-800 rounded-xl mx-auto mb-3 flex items-center justify-center text-5xl">\u{1F614}</div>
             <div class="text-xl font-bold text-gray-500">\u041D\u0438 \u043E\u0434\u043D\u043E\u0433\u043E \u043D\u0435 \u043E\u0442\u043A\u0440\u044B\u0442\u043E</div>`}
        <div class="text-yellow-400 mt-1 text-sm">\u2605 ${o.totalStars}</div>
      </div>

      ${r.length>1?`
        <div class="w-full max-w-md mb-8">
          <div class="text-xs text-gray-500 uppercase tracking-wider text-center mb-3">
            \u041E\u0442\u043A\u0440\u044B\u0442\u043E: ${r.length} / ${t.length}
          </div>
          <div class="flex flex-wrap gap-2 justify-center">
            ${r.map(l=>`
              <div class="flex flex-col items-center bg-gray-900 border border-gray-800 rounded-xl p-2 w-20">
                ${i(l.imageUrl,"w-12 h-12 object-contain rounded-lg")}
                <div class="text-xs text-center text-gray-300 mt-1 leading-tight">${d(l.name)}</div>
              </div>
            `).join("")}
          </div>
        </div>
      `:""}

      <button id="btn-home"
        class="py-3 px-10 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-lg transition">
        \u041D\u0430 \u0433\u043B\u0430\u0432\u043D\u0443\u044E
      </button>
    </div>
  `,e.querySelector("#btn-home")?.addEventListener("click",()=>{o=null,h("home")})}var B=()=>{};function le(e){B=e}var s=de();function de(){return{packs:[],view:"list",editIdx:-1,pack:{title:"",questions:[],starsPerCorrect:3},expandedQ:-1}}function ce(e){s=de(),s.packs=I(),L(e)}function L(e){s.view==="list"?U(e):$e(e)}function U(e){e.innerHTML=`
    <div class="min-h-screen flex flex-col bg-gray-950">

      <div class="flex items-center gap-3 px-5 py-4 bg-gray-900 border-b border-gray-800">
        <button id="pe-back" class="text-gray-400 hover:text-white transition text-sm">\u2190 \u041D\u0430\u0437\u0430\u0434</button>
        <h1 class="text-xl font-bold flex-1">\u0420\u0435\u0434\u0430\u043A\u0442\u043E\u0440 \u0432\u043E\u043F\u0440\u043E\u0441\u043E\u0432</h1>
        <label class="cursor-pointer text-sm text-indigo-400 hover:text-indigo-300 transition">
          \u0418\u043C\u043F\u043E\u0440\u0442
          <input id="pe-import" type="file" accept=".json" class="hidden" />
        </label>
        <button id="pe-new" class="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition">
          + \u041D\u043E\u0432\u044B\u0439 \u043F\u0430\u043A\u0435\u0442
        </button>
      </div>

      <div class="flex-1 p-4 max-w-2xl mx-auto w-full">
        ${s.packs.length===0?'<div class="text-gray-500 text-center mt-20 text-sm">\u041D\u0435\u0442 \u043F\u0430\u043A\u0435\u0442\u043E\u0432. \u0421\u043E\u0437\u0434\u0430\u0439\u0442\u0435 \u043F\u0435\u0440\u0432\u044B\u0439!</div>':s.packs.map((t,r)=>`
            <div class="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-center gap-3 mb-2">
              <div class="flex-1 min-w-0">
                <div class="font-semibold truncate">${d(t.title)}</div>
                <div class="text-xs text-gray-400">${t.questions.length} \u0432\u043E\u043F\u0440\u043E\u0441\u043E\u0432 \xB7 ${t.starsPerCorrect}\u2605 \u0437\u0430 \u043E\u0442\u0432\u0435\u0442</div>
              </div>
              <button data-edit="${r}" class="text-sm text-indigo-400 hover:text-indigo-300 transition">\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C</button>
              <button data-copy="${r}" class="text-sm text-green-400 hover:text-green-300 transition">\u041A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C</button>
              <button data-export="${r}" class="text-sm text-gray-400 hover:text-gray-300 transition">\u042D\u043A\u0441\u043F\u043E\u0440\u0442</button>
              <button data-del="${r}" class="text-sm text-red-400 hover:text-red-300 transition">\u0423\u0434\u0430\u043B\u0438\u0442\u044C</button>
            </div>
          `).join("")}
      </div>

    </div>
  `,e.querySelector("#pe-back")?.addEventListener("click",()=>B("home")),e.querySelector("#pe-new")?.addEventListener("click",()=>{s.editIdx=-1,s.pack={title:"",questions:[],starsPerCorrect:3},s.view="edit",s.expandedQ=-1,L(e)}),e.querySelector("#pe-import")?.addEventListener("change",t=>{let r=t.target.files?.[0];if(!r)return;let a=new FileReader;a.onload=i=>{try{let l=JSON.parse(i.target?.result);if(!l.title||!Array.isArray(l.questions))throw new Error;s.packs.push(l),S(s.packs),U(e)}catch{g("\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u0444\u043E\u0440\u043C\u0430\u0442 \u0444\u0430\u0439\u043B\u0430")}},a.readAsText(r)}),e.querySelectorAll("[data-edit]").forEach(t=>{t.addEventListener("click",()=>{let r=parseInt(t.dataset.edit);s.editIdx=r,s.pack=JSON.parse(JSON.stringify(s.packs[r])),s.view="edit",s.expandedQ=-1,L(e)})}),e.querySelectorAll("[data-export]").forEach(t=>{t.addEventListener("click",()=>{let r=parseInt(t.dataset.export);O(s.packs[r],`${s.packs[r].title||"pack"}.json`)})}),e.querySelectorAll("[data-del]").forEach(t=>{t.addEventListener("click",()=>{let r=parseInt(t.dataset.del);g(`\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u043F\u0430\u043A\u0435\u0442 \xAB${d(s.packs[r].title)}\xBB?`,()=>{s.packs.splice(r,1),S(s.packs),U(e)})})}),e.querySelectorAll("[data-copy]").forEach(t=>{t.addEventListener("click",()=>{let r=parseInt(t.dataset.copy),a=JSON.parse(JSON.stringify(s.packs[r]));a.title+=" (\u043A\u043E\u043F\u0438\u044F)",s.packs.push(a),S(s.packs),U(e)})})}function $e(e){let t=s.pack;e.innerHTML=`
    <div class="min-h-screen flex flex-col bg-gray-950">

      <div class="flex items-center gap-3 px-5 py-4 bg-gray-900 border-b border-gray-800">
        <button id="pe-edit-back" class="text-gray-400 hover:text-white transition text-sm">\u2190 \u041D\u0430\u0437\u0430\u0434</button>
        <h1 class="text-xl font-bold flex-1">${s.editIdx===-1?"\u041D\u043E\u0432\u044B\u0439 \u043F\u0430\u043A\u0435\u0442":"\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u043F\u0430\u043A\u0435\u0442"}</h1>
        <button id="pe-save" class="py-2 px-4 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold transition">
          \u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C
        </button>
      </div>

      <div class="flex-1 p-4 max-w-2xl mx-auto w-full space-y-4">

        <div class="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
          <div>
            <label class="text-xs text-gray-400 uppercase tracking-wider">\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043F\u0430\u043A\u0435\u0442\u0430</label>
            <input id="pe-title" type="text" value="${d(t.title)}" placeholder="\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435..."
              class="w-full bg-gray-800 text-white rounded-xl px-4 py-2 mt-1 border border-gray-700 focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label class="text-xs text-gray-400 uppercase tracking-wider">\u0417\u0432\u0451\u0437\u0434 \u0437\u0430 \u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u044B\u0439 \u043E\u0442\u0432\u0435\u0442</label>
            <input id="pe-stars" type="number" min="1" max="100" value="${t.starsPerCorrect}"
              class="w-full bg-gray-800 text-white rounded-xl px-4 py-2 mt-1 border border-gray-700 focus:outline-none focus:border-indigo-500" />
          </div>
        </div>

        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-400 uppercase tracking-wider font-semibold">\u0412\u043E\u043F\u0440\u043E\u0441\u044B (${t.questions.length})</div>
          <button id="pe-add-q" class="py-1.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition">
            + \u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C
          </button>
        </div>

        <div id="pe-qlist">${xe(t.questions)}</div>

        ${s.editIdx!==-1?`
          <button id="pe-del-pack"
            class="w-full py-3 rounded-xl font-semibold transition text-red-400 hover:text-red-300 border border-red-900 hover:bg-red-900/20">
            \u0423\u0434\u0430\u043B\u0438\u0442\u044C \u043F\u0430\u043A\u0435\u0442
          </button>
        `:""}

      </div>
    </div>
  `;let r=e.querySelector("#pe-title"),a=e.querySelector("#pe-stars");r.addEventListener("input",()=>{s.pack.title=r.value}),a.addEventListener("input",()=>{s.pack.starsPerCorrect=Math.max(1,parseInt(a.value)||1)}),e.querySelector("#pe-edit-back")?.addEventListener("click",()=>{s.view="list",s.packs=I(),L(e)}),e.querySelector("#pe-save")?.addEventListener("click",()=>{if(!s.pack.title.trim()){g("\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043F\u0430\u043A\u0435\u0442\u0430");return}s.editIdx===-1?s.packs.push(s.pack):s.packs[s.editIdx]=s.pack,S(s.packs),s.view="list",L(e)}),e.querySelector("#pe-del-pack")?.addEventListener("click",()=>{g(`\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u043F\u0430\u043A\u0435\u0442 \xAB${d(s.pack.title)}\xBB?`,()=>{s.packs.splice(s.editIdx,1),S(s.packs),s.view="list",L(e)})}),e.querySelector("#pe-add-q")?.addEventListener("click",()=>{s.pack.questions.push({text:"",answer:"",imageUrl:""}),s.expandedQ=s.pack.questions.length-1,P(e),setTimeout(()=>{e.querySelector(`[data-qrow="${s.expandedQ}"]`)?.scrollIntoView({behavior:"smooth",block:"center"})},50)}),ue(e)}function xe(e){return e.length===0?'<div class="text-gray-500 text-center py-8 text-sm">\u041D\u0435\u0442 \u0432\u043E\u043F\u0440\u043E\u0441\u043E\u0432. \u041D\u0430\u0436\u043C\u0438\u0442\u0435 \xAB+ \u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C\xBB.</div>':e.map((t,r)=>{let a=s.expandedQ===r;return`
      <div data-qrow="${r}" class="bg-gray-900 border border-gray-800 rounded-xl mb-2 overflow-hidden">
        <div class="flex items-center gap-3 px-4 py-3 cursor-pointer select-none" data-qtoggle="${r}">
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium truncate ${t.text?"text-white":"text-gray-500 italic"}">
              ${t.text?d(t.text):"\u0411\u0435\u0437 \u0442\u0435\u043A\u0441\u0442\u0430"}
            </div>
            <div class="text-xs text-gray-400 truncate">${t.answer?d(t.answer):"\u0411\u0435\u0437 \u043E\u0442\u0432\u0435\u0442\u0430"}</div>
          </div>
          <div class="flex gap-0.5 flex-shrink-0">
            <button data-qup="${r}" class="text-gray-400 hover:text-white transition px-2 py-1 text-sm" title="\u0412\u0432\u0435\u0440\u0445">\u2191</button>
            <button data-qdn="${r}" class="text-gray-400 hover:text-white transition px-2 py-1 text-sm" title="\u0412\u043D\u0438\u0437">\u2193</button>
            <button data-qdel="${r}" class="text-red-400 hover:text-red-300 text-sm transition px-2 py-1">\u2715</button>
          </div>
          <span class="text-gray-600 text-sm flex-shrink-0">${a?"\u25B2":"\u25BC"}</span>
        </div>
        ${a?`
          <div class="px-4 pb-4 pt-3 space-y-2 border-t border-gray-800">
            <div>
              <label class="text-xs text-gray-400">\u0412\u043E\u043F\u0440\u043E\u0441</label>
              <textarea data-qtext="${r}" rows="2" placeholder="\u0422\u0435\u043A\u0441\u0442 \u0432\u043E\u043F\u0440\u043E\u0441\u0430..."
                class="w-full bg-gray-800 text-white rounded-lg px-3 py-2 mt-1 text-sm border border-gray-700 focus:outline-none focus:border-indigo-500 resize-none">${d(t.text)}</textarea>
            </div>
            <div>
              <label class="text-xs text-gray-400">\u041E\u0442\u0432\u0435\u0442</label>
              <input data-qans="${r}" type="text" value="${d(t.answer)}" placeholder="\u041F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u044B\u0439 \u043E\u0442\u0432\u0435\u0442..."
                class="w-full bg-gray-800 text-white rounded-lg px-3 py-2 mt-1 text-sm border border-gray-700 focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label class="text-xs text-gray-400">\u0418\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0435 (URL, \u043D\u0435\u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E)</label>
              <input data-qimg="${r}" type="text" value="${d(t.imageUrl??"")}" placeholder="https://..."
                class="w-full bg-gray-800 text-white rounded-lg px-3 py-2 mt-1 text-sm border border-gray-700 focus:outline-none focus:border-indigo-500" />
            </div>
          </div>
        `:""}
      </div>
    `}).join("")}function P(e){let t=e.querySelector("#pe-qlist");t&&(t.innerHTML=xe(s.pack.questions)),ue(e)}function ue(e){e.querySelectorAll("[data-qtoggle]").forEach(t=>{t.addEventListener("click",r=>{let a=r.target;if(a.hasAttribute("data-qdel")||a.hasAttribute("data-qup")||a.hasAttribute("data-qdn"))return;let i=parseInt(t.dataset.qtoggle);s.expandedQ=s.expandedQ===i?-1:i,P(e)})}),e.querySelectorAll("[data-qdel]").forEach(t=>{t.addEventListener("click",r=>{r.stopPropagation();let a=parseInt(t.dataset.qdel);s.pack.questions.splice(a,1),s.expandedQ===a?s.expandedQ=-1:s.expandedQ>a&&s.expandedQ--,P(e)})}),e.querySelectorAll("[data-qup]").forEach(t=>{t.addEventListener("click",r=>{r.stopPropagation();let a=parseInt(t.dataset.qup);a!==0&&([s.pack.questions[a-1],s.pack.questions[a]]=[s.pack.questions[a],s.pack.questions[a-1]],s.expandedQ===a?s.expandedQ=a-1:s.expandedQ===a-1&&(s.expandedQ=a),P(e))})}),e.querySelectorAll("[data-qdn]").forEach(t=>{t.addEventListener("click",r=>{r.stopPropagation();let a=parseInt(t.dataset.qdn);a>=s.pack.questions.length-1||([s.pack.questions[a+1],s.pack.questions[a]]=[s.pack.questions[a],s.pack.questions[a+1]],s.expandedQ===a?s.expandedQ=a+1:s.expandedQ===a+1&&(s.expandedQ=a),P(e))})}),e.querySelectorAll("[data-qtext]").forEach(t=>{t.addEventListener("input",()=>{s.pack.questions[parseInt(t.dataset.qtext)].text=t.value})}),e.querySelectorAll("[data-qans]").forEach(t=>{t.addEventListener("input",()=>{s.pack.questions[parseInt(t.dataset.qans)].answer=t.value})}),e.querySelectorAll("[data-qimg]").forEach(t=>{t.addEventListener("input",()=>{s.pack.questions[parseInt(t.dataset.qimg)].imageUrl=t.value})})}var n=pe();function pe(){return{sets:[],view:"list",editIdx:-1,set:{title:"",characters:[]},expandedC:-1}}function ge(e){n=pe(),n.sets=M(),q(e)}function q(e){n.view==="list"?N(e):Le(e)}function N(e){e.innerHTML=`
    <div class="min-h-screen flex flex-col bg-gray-950">

      <div class="flex items-center gap-3 px-5 py-4 bg-gray-900 border-b border-gray-800">
        <button id="ce-back" class="text-gray-400 hover:text-white transition text-sm">\u2190 \u041D\u0430\u0437\u0430\u0434</button>
        <h1 class="text-xl font-bold flex-1">\u0420\u0435\u0434\u0430\u043A\u0442\u043E\u0440 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436\u0435\u0439</h1>
        <label class="cursor-pointer text-sm text-indigo-400 hover:text-indigo-300 transition">
          \u0418\u043C\u043F\u043E\u0440\u0442
          <input id="ce-import" type="file" accept=".json" class="hidden" />
        </label>
        <button id="ce-new" class="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition">
          + \u041D\u043E\u0432\u044B\u0439 \u043D\u0430\u0431\u043E\u0440
        </button>
      </div>

      <div class="flex-1 p-4 max-w-2xl mx-auto w-full">
        ${n.sets.length===0?'<div class="text-gray-500 text-center mt-20 text-sm">\u041D\u0435\u0442 \u043D\u0430\u0431\u043E\u0440\u043E\u0432. \u0421\u043E\u0437\u0434\u0430\u0439\u0442\u0435 \u043F\u0435\u0440\u0432\u044B\u0439!</div>':n.sets.map((t,r)=>`
            <div class="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-center gap-3 mb-2">
              <div class="flex-1 min-w-0">
                <div class="font-semibold truncate">${d(t.title)}</div>
                <div class="text-xs text-gray-400">${t.characters.length} \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436\u0435\u0439</div>
              </div>
              <button data-edit="${r}" class="text-sm text-indigo-400 hover:text-indigo-300 transition">\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C</button>
              <button data-copy="${r}" class="text-sm text-green-400 hover:text-green-300 transition">\u041A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C</button>
              <button data-export="${r}" class="text-sm text-gray-400 hover:text-gray-300 transition">\u042D\u043A\u0441\u043F\u043E\u0440\u0442</button>
              <button data-del="${r}" class="text-sm text-red-400 hover:text-red-300 transition">\u0423\u0434\u0430\u043B\u0438\u0442\u044C</button>
            </div>
          `).join("")}
      </div>

    </div>
  `,e.querySelector("#ce-back")?.addEventListener("click",()=>B("home")),e.querySelector("#ce-new")?.addEventListener("click",()=>{n.editIdx=-1,n.set={title:"",characters:[]},n.view="edit",n.expandedC=-1,q(e)}),e.querySelector("#ce-import")?.addEventListener("change",t=>{let r=t.target.files?.[0];if(!r)return;let a=new FileReader;a.onload=i=>{try{let l=JSON.parse(i.target?.result);if(!l.title||!Array.isArray(l.characters))throw new Error;n.sets.push(l),E(n.sets),N(e)}catch{g("\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u0444\u043E\u0440\u043C\u0430\u0442 \u0444\u0430\u0439\u043B\u0430")}},a.readAsText(r)}),e.querySelectorAll("[data-edit]").forEach(t=>{t.addEventListener("click",()=>{let r=parseInt(t.dataset.edit);n.editIdx=r,n.set=JSON.parse(JSON.stringify(n.sets[r])),n.view="edit",n.expandedC=-1,q(e)})}),e.querySelectorAll("[data-export]").forEach(t=>{t.addEventListener("click",()=>{let r=parseInt(t.dataset.export);O(n.sets[r],`${n.sets[r].title||"characters"}.json`)})}),e.querySelectorAll("[data-del]").forEach(t=>{t.addEventListener("click",()=>{let r=parseInt(t.dataset.del);g(`\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u043D\u0430\u0431\u043E\u0440 \xAB${d(n.sets[r].title)}\xBB?`,()=>{n.sets.splice(r,1),E(n.sets),N(e)})})}),e.querySelectorAll("[data-copy]").forEach(t=>{t.addEventListener("click",()=>{let r=parseInt(t.dataset.copy),a=JSON.parse(JSON.stringify(n.sets[r]));a.title+=" (\u043A\u043E\u043F\u0438\u044F)",n.sets.push(a),E(n.sets),N(e)})})}function Le(e){let t=n.set;e.innerHTML=`
    <div class="min-h-screen flex flex-col bg-gray-950">

      <div class="flex items-center gap-3 px-5 py-4 bg-gray-900 border-b border-gray-800">
        <button id="ce-edit-back" class="text-gray-400 hover:text-white transition text-sm">\u2190 \u041D\u0430\u0437\u0430\u0434</button>
        <h1 class="text-xl font-bold flex-1">${n.editIdx===-1?"\u041D\u043E\u0432\u044B\u0439 \u043D\u0430\u0431\u043E\u0440":"\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u043D\u0430\u0431\u043E\u0440"}</h1>
        <button id="ce-save" class="py-2 px-4 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold transition">
          \u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C
        </button>
      </div>

      <div class="flex-1 p-4 max-w-2xl mx-auto w-full space-y-4">

        <div class="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <label class="text-xs text-gray-400 uppercase tracking-wider">\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043D\u0430\u0431\u043E\u0440\u0430</label>
          <input id="ce-title" type="text" value="${d(t.title)}" placeholder="\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435..."
            class="w-full bg-gray-800 text-white rounded-xl px-4 py-2 mt-1 border border-gray-700 focus:outline-none focus:border-indigo-500" />
        </div>

        <div class="text-xs text-gray-500 px-1">
          \u{1F4A1} \u041F\u0435\u0440\u0441\u043E\u043D\u0430\u0436\u0438 \u0441\u043E\u0440\u0442\u0438\u0440\u0443\u044E\u0442\u0441\u044F \u043F\u043E \u0441\u0442\u043E\u0438\u043C\u043E\u0441\u0442\u0438 \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438. \u0427\u0435\u043C \u0432\u044B\u0448\u0435 \u0441\u0442\u043E\u0438\u043C\u043E\u0441\u0442\u044C, \u0442\u0435\u043C \u043F\u043E\u0437\u0436\u0435 \u043E\u0442\u043A\u0440\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436.
        </div>

        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-400 uppercase tracking-wider font-semibold">\u041F\u0435\u0440\u0441\u043E\u043D\u0430\u0436\u0438 (${t.characters.length})</div>
          <button id="ce-add-c" class="py-1.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition">
            + \u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C
          </button>
        </div>

        <div id="ce-clist">${ve(t.characters)}</div>

        ${n.editIdx!==-1?`
          <button id="ce-del-set"
            class="w-full py-3 rounded-xl font-semibold transition text-red-400 hover:text-red-300 border border-red-900 hover:bg-red-900/20">
            \u0423\u0434\u0430\u043B\u0438\u0442\u044C \u043D\u0430\u0431\u043E\u0440
          </button>
        `:""}

      </div>
    </div>
  `;let r=e.querySelector("#ce-title");r.addEventListener("input",()=>{n.set.title=r.value}),e.querySelector("#ce-edit-back")?.addEventListener("click",()=>{n.view="list",n.sets=M(),q(e)}),e.querySelector("#ce-save")?.addEventListener("click",()=>{if(!n.set.title.trim()){g("\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043D\u0430\u0431\u043E\u0440\u0430");return}n.editIdx===-1?n.sets.push(n.set):n.sets[n.editIdx]=n.set,E(n.sets),n.view="list",q(e)}),e.querySelector("#ce-del-set")?.addEventListener("click",()=>{g(`\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u043D\u0430\u0431\u043E\u0440 \xAB${d(n.set.title)}\xBB?`,()=>{n.sets.splice(n.editIdx,1),E(n.sets),n.view="list",q(e)})}),e.querySelector("#ce-add-c")?.addEventListener("click",()=>{n.set.characters.push({name:"",cost:0,imageUrl:""}),n.expandedC=n.set.characters.length-1,$(e),setTimeout(()=>{e.querySelector(`[data-crow="${n.expandedC}"]`)?.scrollIntoView({behavior:"smooth",block:"center"})},50)}),me(e)}function ve(e){return e.length===0?'<div class="text-gray-500 text-center py-8 text-sm">\u041D\u0435\u0442 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436\u0435\u0439. \u041D\u0430\u0436\u043C\u0438\u0442\u0435 \xAB+ \u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C\xBB.</div>':e.map((t,r)=>{let a=n.expandedC===r,i=t.imageUrl?b(t.imageUrl):"";return`
      <div data-crow="${r}" class="bg-gray-900 border border-gray-800 rounded-xl mb-2 overflow-hidden">
        <div class="flex items-center gap-3 px-4 py-3 cursor-pointer select-none" data-ctoggle="${r}">
          ${i?`<img src="${i}" class="w-8 h-8 object-contain rounded flex-shrink-0" />`:'<div class="w-8 h-8 bg-gray-700 rounded flex-shrink-0 flex items-center justify-center text-sm">\u265F</div>'}
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium ${t.name?"text-white":"text-gray-500 italic"}">
              ${t.name?d(t.name):"\u0411\u0435\u0437 \u0438\u043C\u0435\u043D\u0438"}
            </div>
            <div class="text-xs text-yellow-400">\u2605 ${t.cost}</div>
          </div>
          <div class="flex gap-0.5 flex-shrink-0">
            <button data-cup="${r}" class="text-gray-400 hover:text-white transition px-2 py-1 text-sm" title="\u0412\u0432\u0435\u0440\u0445">\u2191</button>
            <button data-cdn="${r}" class="text-gray-400 hover:text-white transition px-2 py-1 text-sm" title="\u0412\u043D\u0438\u0437">\u2193</button>
            <button data-cdel="${r}" class="text-red-400 hover:text-red-300 text-sm transition px-2 py-1">\u2715</button>
          </div>
          <span class="text-gray-600 text-sm flex-shrink-0">${a?"\u25B2":"\u25BC"}</span>
        </div>
        ${a?`
          <div class="px-4 pb-4 pt-3 space-y-2 border-t border-gray-800">
            <div>
              <label class="text-xs text-gray-400">\u0418\u043C\u044F \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436\u0430</label>
              <input data-cname="${r}" type="text" value="${d(t.name)}" placeholder="\u0418\u043C\u044F..."
                class="w-full bg-gray-800 text-white rounded-lg px-3 py-2 mt-1 text-sm border border-gray-700 focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label class="text-xs text-gray-400">\u0421\u0442\u043E\u0438\u043C\u043E\u0441\u0442\u044C (\u2605 \u0434\u043B\u044F \u043E\u0442\u043A\u0440\u044B\u0442\u0438\u044F)</label>
              <input data-ccost="${r}" type="number" min="0" value="${t.cost}"
                class="w-full bg-gray-800 text-white rounded-lg px-3 py-2 mt-1 text-sm border border-gray-700 focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label class="text-xs text-gray-400">\u0418\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0435 (URL, \u043D\u0435\u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E)</label>
              <input data-cimg="${r}" type="text" value="${d(t.imageUrl??"")}" placeholder="https://..."
                class="w-full bg-gray-800 text-white rounded-lg px-3 py-2 mt-1 text-sm border border-gray-700 focus:outline-none focus:border-indigo-500" />
            </div>
            ${i?`
              <div>
                <div class="text-xs text-gray-400 mb-1">\u041F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440</div>
                <img src="${i}" class="h-16 object-contain rounded" onerror="this.style.display='none'" />
              </div>
            `:""}
          </div>
        `:""}
      </div>
    `}).join("")}function $(e){let t=e.querySelector("#ce-clist");t&&(t.innerHTML=ve(n.set.characters)),me(e)}function me(e){e.querySelectorAll("[data-ctoggle]").forEach(t=>{t.addEventListener("click",r=>{let a=r.target;if(a.hasAttribute("data-cup")||a.hasAttribute("data-cdn")||a.hasAttribute("data-cdel"))return;let i=parseInt(t.dataset.ctoggle);n.expandedC=n.expandedC===i?-1:i,$(e)})}),e.querySelectorAll("[data-cdel]").forEach(t=>{t.addEventListener("click",r=>{r.stopPropagation();let a=parseInt(t.dataset.cdel);n.set.characters.splice(a,1),n.expandedC===a?n.expandedC=-1:n.expandedC>a&&n.expandedC--,$(e)})}),e.querySelectorAll("[data-cup]").forEach(t=>{t.addEventListener("click",r=>{r.stopPropagation();let a=parseInt(t.dataset.cup);a!==0&&([n.set.characters[a-1],n.set.characters[a]]=[n.set.characters[a],n.set.characters[a-1]],n.expandedC===a?n.expandedC=a-1:n.expandedC===a-1&&(n.expandedC=a),$(e))})}),e.querySelectorAll("[data-cdn]").forEach(t=>{t.addEventListener("click",r=>{r.stopPropagation();let a=parseInt(t.dataset.cdn);a>=n.set.characters.length-1||([n.set.characters[a+1],n.set.characters[a]]=[n.set.characters[a],n.set.characters[a+1]],n.expandedC===a?n.expandedC=a+1:n.expandedC===a+1&&(n.expandedC=a),$(e))})}),e.querySelectorAll("[data-cname]").forEach(t=>{t.addEventListener("input",()=>{n.set.characters[parseInt(t.dataset.cname)].name=t.value})}),e.querySelectorAll("[data-ccost]").forEach(t=>{t.addEventListener("input",()=>{n.set.characters[parseInt(t.dataset.ccost)].cost=Math.max(0,parseInt(t.value)||0)})}),e.querySelectorAll("[data-cimg]").forEach(t=>{t.addEventListener("input",()=>{n.set.characters[parseInt(t.dataset.cimg)].imageUrl=t.value,$(e)})})}var qe=["home","setup","game","results","pack-editor","character-editor"];function T(e){return document.getElementById(`screen-${e}`)}function C(e){qe.forEach(t=>T(t).classList.add("hidden")),T(e).classList.remove("hidden"),e==="home"?_():e==="setup"?se(T("setup")):e==="pack-editor"?ce(T("pack-editor")):e==="character-editor"&&ge(T("character-editor"))}function _(){let e=T("home"),t=ae();e.innerHTML=`
    <div class="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-950">

      <div class="text-8xl mb-4 select-none">\u265F</div>
      <h1 class="text-5xl font-black tracking-tight mb-2">Chess Level Up</h1>
      <p class="text-gray-400 mb-12 text-center text-sm">
        \u041E\u0442\u0432\u0435\u0447\u0430\u0439 \u043D\u0430 \u0432\u043E\u043F\u0440\u043E\u0441\u044B \u2014 \u043E\u0442\u043A\u0440\u044B\u0432\u0430\u0439 \u043D\u043E\u0432\u044B\u0445 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436\u0435\u0439!
      </p>

      <div class="w-full max-w-xs space-y-3">

        <button id="btn-new"
          class="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-xl transition shadow-lg shadow-indigo-900/30">
          \u041D\u043E\u0432\u0430\u044F \u0438\u0433\u0440\u0430
        </button>

        ${t?`
          <button id="btn-continue"
            class="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-black rounded-2xl font-bold text-xl transition shadow-lg shadow-yellow-900/30">
            \u041F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u0442\u044C
          </button>
        `:""}

        <button id="btn-pack-ed"
          class="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-2xl font-semibold transition">
          \u0420\u0435\u0434\u0430\u043A\u0442\u043E\u0440 \u0432\u043E\u043F\u0440\u043E\u0441\u043E\u0432
        </button>

        <button id="btn-char-ed"
          class="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-2xl font-semibold transition">
          \u0420\u0435\u0434\u0430\u043A\u0442\u043E\u0440 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436\u0435\u0439
        </button>

      </div>
    </div>
  `,e.querySelector("#btn-new")?.addEventListener("click",()=>C("setup")),e.querySelector("#btn-continue")?.addEventListener("click",()=>Te()),e.querySelector("#btn-pack-ed")?.addEventListener("click",()=>C("pack-editor")),e.querySelector("#btn-char-ed")?.addEventListener("click",()=>C("character-editor"))}function Te(){if(document.getElementById("save-picker-overlay")?.remove(),f().length===0){_();return}let t=document.createElement("div");t.id="save-picker-overlay",t.className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4";let r=()=>{let i=f();return i.length===0?'<div class="text-gray-500 text-center py-8 text-sm">\u041D\u0435\u0442 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0439</div>':i.map(l=>`
          <div class="bg-gray-800 border border-gray-700 rounded-xl p-4 flex items-start gap-4">
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-white truncate">${d(l.playerName||"\u0411\u0435\u0437 \u0438\u043C\u0435\u043D\u0438")}</div>
              <div class="text-sm text-gray-400 mt-0.5">${d(l.packTitle)}</div>
              <div class="text-xs text-gray-500 mt-0.5">
                ${l.charName?d(l.charName)+" \xB7 ":""}\u0412\u043E\u043F\u0440\u043E\u0441 ${d(l.questionProgress)}
              </div>
              <div class="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                <span class="text-yellow-400">\u2605 ${l.totalStars}</span>
                <span>${G(l.savedAt)}</span>
              </div>
            </div>
            <div class="flex flex-col gap-2 flex-shrink-0">
              <button data-resume="${l.id}"
                class="py-1.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition">
                \u25B6 \u0418\u0433\u0440\u0430\u0442\u044C
              </button>
              <button data-delete="${l.id}"
                class="py-1.5 px-4 bg-gray-700 hover:bg-red-800 text-gray-300 hover:text-white rounded-lg text-sm transition">
                \u0423\u0434\u0430\u043B\u0438\u0442\u044C
              </button>
            </div>
          </div>
        `).join("")};t.innerHTML=`
    <div class="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
      <div class="flex items-center justify-between px-5 py-4 border-b border-gray-800">
        <h2 class="text-lg font-bold">\u041F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u0442\u044C \u0438\u0433\u0440\u0443</h2>
        <button id="sp-close"
          class="text-gray-400 hover:text-white text-2xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-800 transition">
          \xD7
        </button>
      </div>
      <div id="sp-list" class="p-4 space-y-3 max-h-96 overflow-y-auto">
        ${r()}
      </div>
    </div>
  `;let a=()=>{t.querySelectorAll("[data-resume]").forEach(i=>{i.addEventListener("click",()=>{t.remove(),ne(i.dataset.resume)})}),t.querySelectorAll("[data-delete]").forEach(i=>{i.addEventListener("click",()=>{g("\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u044D\u0442\u043E \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0435?",()=>{H(i.dataset.delete);let l=t.querySelector("#sp-list");l&&(l.innerHTML=r()),a(),f().length===0&&(t.remove(),_())})})})};a(),t.querySelector("#sp-close")?.addEventListener("click",()=>t.remove()),t.addEventListener("click",i=>{i.target===t&&t.remove()}),document.body.appendChild(t)}async function Ce(){te(C),le(C),await re(),C("home")}document.addEventListener("DOMContentLoaded",()=>{Ce()});})();
//# sourceMappingURL=bundle.js.map
