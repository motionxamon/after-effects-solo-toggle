const fs=require('fs'),vm=require('vm'),assert=require('assert');
const path=require('path');
const distribution=process.argv[2] || 'Solo_Toggle.jsx';
let code=fs.readFileSync(path.join(__dirname,'..',distribution),'utf8');new vm.Script(code);
if(distribution==='Solo_Toggle_Panel.jsx') {
 const start=code.indexOf('/* CORE START */')+'/* CORE START */'.length,end=code.indexOf('/* CORE END */');
 code='(function(){\n'+code.slice(start,end)+'\n})();';
}
class CompItem{constructor(id,layers){this.id=id;this.layers=layers;this.comment='User notes\nKeep this';this.selectedLayers=[];this.hideShyLayers=false;}get numLayers(){return this.layers.length;}layer(i){return this.layers[i-1];}}
function layer(id,enabled=true,solo=false,locked=false,shy=false){let e=enabled,s=solo,h=shy;return {id,locked,get shy(){return h;},set shy(v){if(this.locked)throw Error('locked');if(this.failShy){this.failShy=false;throw Error('Shy switch failed');}h=v;},get enabled(){return e;},set enabled(v){if(this.locked)throw Error('locked');if(this.failOnce){this.failOnce=false;throw Error('switch failed');}e=v;},get solo(){return s;},set solo(v){if(this.locked)throw Error('locked');if(!e)throw Error('Solo flag can not be set on a layer if the layer is not enabled.');s=v;}};}
let alerts=[],undos=0;const comp=new CompItem(100,[layer(1,true,true),layer(2,false,false,true),layer(3,true,false,true)]);
const app={project:{activeItem:comp},beginUndoGroup(){undos++;},endUndoGroup(){undos--;}};
function run(){vm.runInNewContext(code,{CompItem,app,alert:m=>alerts.push(m)});assert.equal(undos,0);}
function states(){return comp.layers.map(l=>[l.id,l.enabled,l.solo,l.locked]);}
const initial=states(),comment=comp.comment;
comp.selectedLayers=[comp.layers[1]];run();assert.deepStrictEqual(states(),[[1,false,false,false],[2,true,false,true],[3,false,false,true]]);assert(comp.comment.includes('SoloToggle:v2'));assert.equal(alerts.length,0);assert(comp.hideShyLayers);assert.deepStrictEqual(comp.layers.map(l=>l.shy),[true,false,true]);
// Fresh JS execution, reordered / renamed layers, and empty selection still restore by ID.
comp.layers.reverse();comp.selectedLayers=[];run();assert.deepStrictEqual(states().sort((a,b)=>a[0]-b[0]),initial);assert.equal(comp.comment,comment);assert(!comp.hideShyLayers);assert(comp.layers.every(l=>!l.shy));
// No selection outside isolation does nothing.
run();assert.equal(alerts.length,1);assert.equal(comp.comment,comment);
// Layers added/deleted during isolation are handled without corrupting other layers.
comp.selectedLayers=[comp.layers[0]];run();comp.layers.pop();const added=layer(4,false,true,true);comp.layers.push(added);comp.selectedLayers=[];run();assert.deepStrictEqual([added.enabled,added.solo,added.locked],[false,true,true]);assert.equal(comp.comment,comment);
// A failed switch rolls back visibility, native Solo, locks and the persisted state.
comp.selectedLayers=[comp.layers[1]];const before=states();comp.layers[1].failOnce=true;run();assert.deepStrictEqual(states(),before);assert.equal(comp.comment,comment);assert.equal(alerts.length,2);
// Separate compositions isolate independently.
const other=new CompItem(200,[layer(10),layer(11,true,false,true)]);other.selectedLayers=[other.layers[0]];app.project.activeItem=other;run();assert(!other.layers[1].enabled);app.project.activeItem=comp;comp.selectedLayers=[comp.layers[0]];run();app.project.activeItem=other;other.selectedLayers=[];run();assert(other.layers[1].enabled);app.project.activeItem=comp;run();
// Recover the saved v1 state after the old script failed on its second press.
const damaged=new CompItem(300,[layer(20,false,false,true),layer(21,false,false,true),layer(22,true,false)]);
damaged.comment='Original notes\n[[SoloToggle:v1:300;20,1,1;21,1,0;22,0,0]]';
app.project.activeItem=damaged;const alertCount=alerts.length;run();
assert.deepStrictEqual(damaged.layers.map(l=>[l.enabled,l.solo,l.locked]),[[true,true,true],[true,false,true],[false,false,false]]);
assert.equal(damaged.comment,'Original notes');assert.equal(alerts.length,alertCount);
let roundTrips=0;
// Exhaust all enabled/Solo/Shy/lock combinations, prior Hide Shy and nonempty selections.
for(let bits=0;bits<256;bits++)for(let hide=0;hide<2;hide++)for(let mask=1;mask<4;mask++){
 const ls=[layer(40,!!(bits&1),!!(bits&2),!!(bits&4),!!(bits&8)),layer(41,!!(bits&16),!!(bits&32),!!(bits&64),!!(bits&128))];
 const c=new CompItem(400,ls);c.hideShyLayers=!!hide;c.selectedLayers=ls.filter((l,i)=>mask&(1<<i));
 const snap=ls.map(l=>[l.enabled,l.solo,l.shy,l.locked]),n=alerts.length;app.project.activeItem=c;run();
 assert(c.hideShyLayers);ls.forEach((l,i)=>{assert.equal(l.enabled,!!(mask&(1<<i)));assert.equal(l.shy,!(mask&(1<<i)));assert(!l.solo);assert.equal(l.locked,snap[i][3]);});
 c.selectedLayers=[];run();assert.deepStrictEqual(ls.map(l=>[l.enabled,l.solo,l.shy,l.locked]),snap);assert.equal(c.hideShyLayers,!!hide);assert.equal(alerts.length,n);roundTrips++;
}
function capture(c){return {comment:c.comment,hide:c.hideShyLayers,ls:c.layers.map(l=>[l.enabled,l.solo,l.shy,l.locked])};}
function restoreMock(c,s){c.comment=s.comment;c.hideShyLayers=s.hide;c.layers.forEach((l,i)=>{l.locked=false;l.enabled=true;l.solo=s.ls[i][1];l.enabled=s.ls[i][0];l.shy=s.ls[i][2];l.locked=s.ls[i][3];});}
const edge=new CompItem(500,[layer(50,true,false,true,true),layer(51,false,false,true,false)]);edge.hideShyLayers=true;edge.selectedLayers=[edge.layers[0]];app.project.activeItem=edge;
const originalEdge=capture(edge);run();const isolatedEdge=capture(edge);
// Simulate AE Undo then Redo; state is part of the same project undo transaction.
restoreMock(edge,originalEdge);run();assert.deepStrictEqual(capture(edge),isolatedEdge);run();assert.deepStrictEqual(capture(edge),originalEdge);
restoreMock(edge,isolatedEdge);run();assert.deepStrictEqual(capture(edge),originalEdge);
// Saving/reloading a project retains comp state and persistent IDs; no JS globals required.
run();const reload=new CompItem(500,edge.layers.map(l=>layer(l.id,l.enabled,l.solo,l.locked,l.shy)));reload.comment=edge.comment;reload.hideShyLayers=edge.hideShyLayers;app.project.activeItem=reload;run();assert.deepStrictEqual(capture(reload),originalEdge);
// Notes appended during isolation survive restoring the state block.
app.project.activeItem=edge;edge.comment+='\nNew user note';edge.selectedLayers=[];run();assert.equal(edge.comment,originalEdge.comment+'\nNew user note');
// Shy setter failure restores every affected switch and the composition toolbar button.
edge.selectedLayers=[edge.layers[0]];const beforeShy=capture(edge);edge.layers[1].failShy=true;const errorsBefore=alerts.length;run();assert.deepStrictEqual(capture(edge),beforeShy);assert.equal(alerts.length,errorsBefore+1);
// A restore failure leaves isolation metadata intact, so a subsequent press can retry.
edge.selectedLayers=[edge.layers[1]];run();const beforeRestore=capture(edge);edge.layers[0].failOnce=true;run();assert.deepStrictEqual(capture(edge),beforeRestore);run();assert.deepStrictEqual(capture(edge),beforeShy);
// Damaged state and copied/imported state stop before touching any switches.
for(const marker of ['\n[[SoloToggle:v2:500;0;50,1,0,7]]','\n[[SoloToggle:v2:999;0;50,1,0,0]]','\n[[SoloToggle:v2:500;0;50,1,0,0;50,1,0,0]]','\n[[SoloToggle:v2:broken']){
 edge.comment=marker;const b=capture(edge),n=alerts.length;run();assert.deepStrictEqual(capture(edge),b);assert.equal(alerts.length,n+1);
}
// No active composition and unsupported AE IDs produce one message without side effects.
app.project.activeItem=null;run();const oldAE=new CompItem(600,[layer(undefined)]);oldAE.selectedLayers=oldAE.layers;app.project.activeItem=oldAE;const oldSnapshot=capture(oldAE);run();assert.deepStrictEqual(capture(oldAE),oldSnapshot);
console.log(`PASS: ${roundTrips} exhaustive round trips; viewer/timeline isolation, locks, native Solo, v1 recovery, Undo/Redo model, reload, reorder, added/deleted layers, comments, failure/retry and malformed/copied state.`);
