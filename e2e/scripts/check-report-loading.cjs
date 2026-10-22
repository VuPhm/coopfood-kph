// Production mock build: deferred feature loading, recovery and direct entry.
const {chromium,expect}=require('@playwright/test');
const base=process.env.STORE_PREVIEW_URL||'http://127.0.0.1:4247';
(async()=>{const b=await chromium.launch();try{
for(const mode of ['delay','fail']){const p=await b.newPage({viewport:{width:390,height:844},serviceWorkers:'block'});let release;const pause=new Promise(r=>release=r);let requested=false;
await p.route('**/assets/store-report-hub-*.js',async r=>{requested=true;if(mode==='fail')return r.abort();await pause;await r.continue();});
await p.goto(base+'/#home');await expect(p.getByRole('button',{name:'Tài khoản và cửa hàng',exact:true})).toBeEnabled();expect(requested).toBe(false);
await p.locator('.store-launcher-grid').getByRole('button',{name:'Báo cáo',exact:true}).click();await expect(p.locator('.store-header h1')).toHaveText('Báo cáo');await expect(p.locator('.store-mobile-toolbar')).toBeVisible();
if(mode==='delay'){await expect(p.getByRole('status')).toContainText('Đang tải báo cáo');release();await expect(p.getByRole('heading',{name:'Chọn báo cáo',exact:true})).toBeVisible();await p.getByRole('button',{name:/^Báo cáo tổng hợp/}).click();await expect(p.locator('.report-composer')).toBeVisible();}
else{await expect(p.getByRole('alert')).toContainText('Chưa tải được giao diện');await expect(p.getByRole('button',{name:'Tải lại ứng dụng',exact:true})).toBeVisible();await expect(p.locator('.store-header h1')).toHaveText('Báo cáo');}
expect(requested).toBe(true);console.log('PASS deferred reports',mode);await p.close();}
const p=await b.newPage({viewport:{width:390,height:844},serviceWorkers:'block'});await p.goto(base+'/#reports');await expect(p.getByRole('heading',{name:'Chọn báo cáo',exact:true})).toBeVisible();await p.close();console.log('PASS direct report entry');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
