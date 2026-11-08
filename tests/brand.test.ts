import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {pageMeta} from '../src/meta.ts';
import {BRAND_NAME,BRAND_TITLE,BRAND_PROMISE,SITE_SHARE_IMAGE} from '../src/site.ts';

test('installed app and share previews use the same Daybreak identity',()=>{
 const manifest=JSON.parse(readFileSync('legacy-static/manifest.webmanifest','utf8'));
 assert.equal(manifest.name,BRAND_TITLE);
 assert.equal(manifest.short_name,BRAND_NAME);
 assert(manifest.description.startsWith(BRAND_PROMISE));
 const home=pageMeta('/',null);
 const ritual=pageMeta('/ritual/','今日塔罗');
 assert.equal(home.openGraph?.siteName,BRAND_TITLE);
 assert.equal(ritual.openGraph?.siteName,BRAND_TITLE);
 assert.equal(ritual.openGraph?.url,'/ritual/');
 assert.deepEqual(ritual.openGraph?.images,home.openGraph?.images);
 const png=readFileSync(`public${SITE_SHARE_IMAGE}`);
 assert.deepEqual([png.readUInt32BE(16),png.readUInt32BE(20)],[1200,630]);
});
