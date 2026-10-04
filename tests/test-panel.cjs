const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.join(__dirname,'..');
const panelCode=fs.readFileSync(path.join(root,'Solo_Toggle_Panel.jsx'),'utf8');
const scriptCode=fs.readFileSync(path.join(root,'Solo_Toggle.jsx'),'utf8');
class CompItem {constructor(){this.id=1;this.comment='Notes';this.hideShyLayers=false;this.layers=[{id:10,enabled:true,solo:false,shy:false,locked:false},{id:11,enabled:true,solo:false,shy:false,locked:true}];this.selectedLayers=[this.layers[0]];}get numLayers(){return this.layers.length;}layer(i){return this.layers[i-1];}}
class Panel {constructor(){this.children=[];this.layout={layout(){},resize(){}};}add(type,bounds,image,props){const control={enabled:true,type,image,props};this.children.push(control);return control;}}
class Window extends Panel {center(){this.centered=true;}show(){this.shown=true;}}
const comp=new CompItem(),alerts=[];
const app={project:{activeItem:comp},beginUndoGroup(){},endUndoGroup(){}};
let count=0;const ScriptUI={newImage(data){count++;assert(Buffer.from(data,'latin1').equals(fs.readFileSync(path.join(root,'assets/solo-s-40.png'))));return {data};}};
// Opening a docked panel must not isolate anything or create another window.
const dock=new Panel();
vm.runInNewContext(panelCode.replace('})(this);','})(testHost);'),{testHost:dock,Panel,Window,CompItem,ScriptUI,app,alert:m=>alerts.push(m)});assert.equal(dock.children.length,1);assert.equal(dock.children[0].type,'iconbutton');assert(!comp.hideShyLayers);assert.equal(count,1);
const button=dock.children[0];button.onClick();assert(comp.hideShyLayers);assert(!comp.layers[1].enabled);assert(comp.layers[1].shy);assert(comp.layers[1].locked);assert(button.enabled);
// Restoring through the standalone distribution after using the panel.
vm.runInNewContext(scriptCode,{CompItem,app,alert:m=>alerts.push(m)});assert(!comp.hideShyLayers);assert(comp.layers[1].enabled);assert(!comp.layers[1].shy);assert.equal(comp.comment,'Notes');
// Starting through standalone and restoring through the existing docked panel.
vm.runInNewContext(scriptCode,{CompItem,app,alert:m=>alerts.push(m)});comp.selectedLayers=[];button.onClick();assert(!comp.hideShyLayers);assert(comp.layers[1].enabled);assert.equal(comp.comment,'Notes');assert.equal(alerts.length,0);
// The palette opens with one button; unsupported embedded-image hosts get a text S.
const windows=[];class CapturedWindow extends Window {constructor(){super();windows.push(this);}}
vm.runInNewContext(panelCode,{Panel,Window:CapturedWindow,CompItem,ScriptUI:{newImage(){throw Error('unsupported');}},app,alert:m=>alerts.push(m)});
assert.equal(windows.length,1);assert(windows[0].shown);assert(windows[0].centered);assert.equal(windows[0].children.length,1);assert.equal(windows[0].children[0].type,'button');assert.equal(windows[0].children[0].image,'S');
app.project.activeItem=null;button.onClick();assert(button.enabled);assert.equal(alerts.length,1);
assert(!/\bFile\s*\(/.test(panelCode));assert(!/\$\.evalFile/.test(panelCode));
console.log('PASS: one-button docking/palette model, no isolation on panel open, exact embedded PNG bytes, cross-version toggles, text fallback and button recovery.');
