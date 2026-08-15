(()=>{
  const style=document.createElement('style');
  style.textContent='.history-head{display:flex;align-items:center;gap:8px}.history-title{flex:1}.history-actions{display:flex;gap:6px}.history-actions .btn{padding:7px 10px;font-size:12px}.btn.danger{background:#2b1d22;color:var(--danger)}.skipExercise{margin-top:8px}.exercise.skipped{opacity:.65}.exercise.skipped .sets,.exercise.skipped .addSet,.exercise.skipped textarea{display:none}.skip-label{margin-top:9px;padding:9px 10px;border-radius:10px;background:#2a2417;color:#ffd166;font-weight:700}';
  document.head.appendChild(style);

  const finishBtn=document.getElementById('saveWorkout');
  if(finishBtn) finishBtn.textContent='Finish Workout';

  function enhanceCards(){
    document.querySelectorAll('.setrow select').forEach(sel=>{
      if(![...sel.options].some(o=>o.value==='Drop Set / Failure')){
        const opt=document.createElement('option');opt.value='Drop Set / Failure';opt.textContent='Drop Set / Failure';sel.appendChild(opt);
      }
    });
    document.querySelectorAll('.exercise').forEach(card=>{
      if(card.querySelector('.skipExercise')) return;
      const btn=document.createElement('button');btn.className='btn full skipExercise';btn.textContent='Skip Exercise';
      const add=card.querySelector('.addSet'); if(add) add.after(btn);
      btn.onclick=()=>{
        const skipped=!card.classList.contains('skipped');
        card.classList.toggle('skipped',skipped);
        card.dataset.skipped=skipped?'true':'false';
        btn.textContent=skipped?'Undo Skip':'Skip Exercise';
        let label=card.querySelector('.skip-label');
        if(skipped){if(!label){label=document.createElement('div');label.className='skip-label';label.textContent='SKIPPED';card.querySelector('.suggestion').after(label)}}
        else if(label) label.remove();
        saveDraft();
      };
    });
  }
  const originalRender=render;
  render=function(){originalRender();enhanceCards();};
  const observer=new MutationObserver(enhanceCards);observer.observe(document.getElementById('workout'),{childList:true,subtree:true});

  const originalCollect=collect;
  collect=function(){
    const data=originalCollect();
    const cards=[...document.querySelectorAll('.exercise')];
    data.exercises.forEach((e,i)=>{e.skipped=cards[i]?.dataset.skipped==='true'});
    return data;
  };

  window.editWorkout=function(date){
    const h=getHistory(),w=h.find(x=>x.date===date);if(!w)return;daySelect.value=w.day;const obj={};
    w.exercises.forEach(e=>obj[e.name]={sets:e.sets,notes:e.notes||'',skipped:!!e.skipped});
    localStorage.setItem(draftKey(w.day),JSON.stringify(obj));localStorage.setItem('gym-editing-date',date);render();
    w.exercises.forEach(e=>{if(!e.skipped)return;const card=[...document.querySelectorAll('.exercise')].find(c=>c.querySelector('h2')?.textContent===e.name);if(card&&!card.classList.contains('skipped'))card.querySelector('.skipExercise')?.click()});
    window.scrollTo({top:0,behavior:'smooth'});alert('Workout loaded for editing. Tap Finish Workout when done.');
  };

  window.deleteWorkout=function(date){const h=getHistory(),w=h.find(x=>x.date===date);if(!w)return;if(!confirm(`Delete ${w.day} from ${new Date(w.date).toLocaleString()}? This cannot be undone.`))return;setHistory(h.filter(x=>x.date!==date));if(localStorage.getItem('gym-editing-date')===date){localStorage.removeItem('gym-editing-date');localStorage.removeItem(draftKey(w.day))}render()};

  renderHistory=function(){const h=getHistory().slice(0,8);historyEl.innerHTML=h.length?'':'<div class="small">No workouts saved yet.</div>';h.forEach(w=>{const div=document.createElement('div');div.className='history-item';const d=new Date(w.date),skipped=(w.exercises||[]).filter(e=>e.skipped).map(e=>e.name);div.innerHTML=`<div class="history-head"><div class="history-title"><strong>${w.day}</strong><div class="small">${d.toLocaleString()}${skipped.length?` • Skipped: ${skipped.join(', ')}`:''}</div></div><div class="history-actions"><button class="btn editHistory">Edit</button><button class="btn danger deleteHistory">Delete</button></div></div>`;div.querySelector('.editHistory').onclick=()=>window.editWorkout(w.date);div.querySelector('.deleteHistory').onclick=()=>window.deleteWorkout(w.date);historyEl.appendChild(div)})};

  if(finishBtn)finishBtn.onclick=()=>{const data=collect(),editingDate=localStorage.getItem('gym-editing-date');let h=getHistory();if(editingDate){data.date=editingDate;h=h.filter(w=>w.date!==editingDate);localStorage.removeItem('gym-editing-date')}h.unshift(data);setHistory(h.slice(0,300));localStorage.removeItem(draftKey(data.day));render();alert(editingDate?'Workout updated':'Workout finished')};
  const clearBtn=document.getElementById('clearWorkout');if(clearBtn)clearBtn.onclick=()=>{if(confirm('Clear today’s entries?')){localStorage.removeItem(draftKey(daySelect.value));localStorage.removeItem('gym-editing-date');render()}};
  enhanceCards();renderHistory();
})();