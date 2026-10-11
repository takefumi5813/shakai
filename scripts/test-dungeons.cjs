const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),cp=require('node:child_process');
(async()=>{
 const html=fs.readFileSync('index.html','utf8'),old=cp.execFileSync('git',['show','HEAD:index.html'],{maxBuffer:32e6}).toString();
 for(const id of ['data','cfg','figs']){const re=new RegExp('<script id="'+id+'"[^>]*>([\\s\\S]*?)</script>');assert.equal(html.match(re)[1],old.match(re)[1]);}
 const server=require('node:http').createServer((q,r)=>{r.setHeader('Content-Type','text/html; charset=utf-8');r.end(html)});await new Promise(r=>server.listen(8788,'127.0.0.1',r));
 const browser=await chromium.launch({...(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {}),headless:true});
 try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:8788');await page.click('#openbook');
 assert.equal(await page.locator('#modes button').count(),3);
 assert.equal(await page.locator('#modes button').last().isDisabled(),true);
 const result=await page.evaluate(()=>{
  const a=window.__ichimon,p=a.P(),s=a.S();
  let spans=0;for(const j of a.JOBS){p.job=j.id;spans+=a.jobLevelSpan();}if(spans!==899)throw Error('spans '+spans);
  p.job='nojob';p.jobs={nojob:1};p.abil=['nojob'];
  a.trainAbilities(true);if(a.masteryCount('nojob')!==0)throw Error('normal training');
  for(const q of a.dueFor('next'))s[q.id]={l:1,d:Date.now()+3600000};
  if(a.dueFor('gnorev').length && a.deepUnlocked())throw Error('one pool unlock');
  for(const q of a.dueFor('gnorev'))s[q.id]={l:1,d:Date.now()+3600000};
  if(!a.deepUnlocked())throw Error('unlock');a.buildHome();return spans;
 });assert.equal(result,899);
 await page.locator('#modes button').last().click();
 await page.evaluate(()=>{const a=window.__ichimon;a.trainAbilities(false);if(a.masteryCount('nojob'))throw Error('wrong training');for(let i=0;i<999;i++)a.trainAbilities(true);if(a.masteryLv('nojob')>=99)throw Error('early 99');a.trainAbilities(true);if(a.masteryLv('nojob')!==99)throw Error('99');});
 await page.click('#jobbtn');assert.match(await page.locator('#jobtiers').innerText(),/Lv.99/);await page.click('#jobsclose');
 await page.screenshot({path:'../dungeon-menu.png',fullPage:true});
 await page.evaluate(()=>{const a=window.__ichimon;const q=a.dueFor('all')[0];a.P().mastery={nojob:0};a.begin();a.answer(true);});await page.waitForTimeout(1700);
 assert.equal(await page.evaluate(()=>window.__ichimon.masteryCount('nojob')),1);
 await page.evaluate(()=>window.__ichimon.undo());assert.equal(await page.evaluate(()=>window.__ichimon.masteryCount('nojob')),0);
 await page.evaluate(()=>{const a=window.__ichimon;for(const q of a.DATA)delete a.S()[q.id];a.buildHome();});
 assert.equal(await page.locator('#modes button').last().isDisabled(),true);assert.deepEqual(errors,[]);
 console.log('PASS: level 900, unchanged question data, locks/relocks, deep-only correct-answer mastery, Lv99 at 1000, undo, mobile rendering');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
