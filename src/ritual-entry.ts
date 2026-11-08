import {BRAND_PROMISE} from './site.ts';

export const ritualPromise=`<p class="brand-promise"><span>${BRAND_PROMISE}</span><span>白话解读 · 免费 · 无需注册</span></p>`;

export function quickDrawButton(disabled=false){
 return `<button type="button" class="primary draw"${disabled?' disabled':''}><span class="draw-star" aria-hidden="true">✦</span><span class="draw-main">替我选一张<small aria-hidden="true">DRAW ON MY BEHALF</small></span><span class="draw-arrow" aria-hidden="true"><svg viewBox="0 0 34 10"><path d="M0 5H33M28 1L33 5L28 9"/></svg></span></button>`;
}
