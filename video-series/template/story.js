const storyImage = () => `/public/rws/${EP.card}.webp`;
const storyCardPath = shot => shot.image ?? storyImage();
const storyCardScene = shot => ['hook', 'story', 'glance'].includes(shot?.scene);
const storyAssets = new Map();
const continuousCardStarts = new Set();
let storyMeteors = [];
let storySegment;

function initStorySky(timeline) {
  const sky = $('daybreakSky');
  const cues = timeline.filter(shot => shot.meteor);
  if (!cues.length) return;
  for (const [x, y, opacity] of [
    [10, 20, .16], [13, 28, .23], [6, 35, .14], [18, 43, .13], [8, 48, .19],
    [88, 18, .22], [91, 25, .17], [85, 35, .13], [94, 40, .24], [90, 54, .16],
  ]) {
    const star = document.createElement('span');
    star.className = 'story-star';
    Object.assign(star.style, {left: `${x}%`, top: `${y}%`, opacity});
    sky.append(star);
  }
  storyMeteors = cues.map(({start, meteor: {at, x, y, angle = 25}}) => {
    const meteor = document.createElement('span');
    meteor.className = 'story-meteor';
    Object.assign(meteor.style, {left: `${x * 100}%`, top: `${y * 100}%`});
    sky.append(meteor);
    // 复用网站流星的尾迹形状和速度曲线，按视频时间取帧。
    const distance = 310;
    const radians = angle * Math.PI / 180;
    const dx = -Math.cos(radians) * distance;
    const dy = Math.sin(radians) * distance;
    const rotate = `rotate(${-angle}deg)`;
    const duration = 1250;
    const animation = meteor.animate([
      {transform: `${rotate} scaleX(.2)`, translate: '0 0', opacity: 0},
      {opacity: .72, offset: .18},
      {transform: `${rotate} scaleX(1)`, opacity: .64, offset: .55},
      {transform: `${rotate} scaleX(.6)`, translate: `${dx}px ${dy}px`, opacity: 0},
    ], {duration, easing: 'cubic-bezier(.3,.1,.4,1)', fill: 'both'});
    animation.pause();
    animation.currentTime = 0;
    return {animation, start: start + at, duration};
  });
}

async function initDaybreak(ep, copy) {
  document.body.classList.add('story-daybreak');
  $('daybreakSeries').textContent = `${copy.series}  /  ${String(ep.no).padStart(2, '0')}`;
  $('p4').textContent = copy.daybreakPromo;

  // 网站日历的四极与 72 格观测度盘。
  const axes = [0, 90, 180, 270].map(deg => `<g transform="rotate(${deg})">
    <path d="M0 -104 V-112" stroke-opacity=".6"/>
    <path d="M0 -118.6 L1.1 -116.5 L0 -114.4 L-1.1 -116.5Z" fill="currentColor" stroke="none"/>
  </g>`).join('');
  const ticks = Array.from({length: 72}, (_, i) => {
    const major = i % 6 === 0;
    return `<path d="M0 -${major ? 86 : 91} V-96" transform="rotate(${i * 5})"
      stroke-opacity="${major ? .45 : .22}"/>`;
  }).join('');
  $('daybreakDial').innerHTML = `<circle r="104" stroke-opacity=".34"/>${axes}${ticks}`;

  // 用网站自己的投影和贴图画一枚固定的残月。
  const {MOON_TEXTURE, shadeMoon} = await import('./site-moon.js');
  const texture = new Image();
  texture.src = '/public' + MOON_TEXTURE;
  await texture.decode();
  const buffer = document.createElement('canvas');
  buffer.width = texture.naturalWidth;
  buffer.height = texture.naturalHeight;
  const source = buffer.getContext('2d');
  source.drawImage(texture, 0, 0);
  const target = $('daybreakMoon').querySelector('canvas').getContext('2d');
  const size = target.canvas.width;
  const moon = target.createImageData(size, size);
  shadeMoon(moon.data, size, source.getImageData(0, 0, buffer.width, buffer.height),
    {elongation: 318, libLat: 0, libLon: 0});
  target.putImageData(moon, 0, 0);
}

async function initStory(ep, timeline, back, copy) {
  document.body.classList.add('story');
  $('brand').firstChild.textContent = `DAYBREAK · ${copy.series} `;
  $('epno').textContent = String(ep.no).padStart(2, '0');
  $('nextT').textContent = ep.next?.nameZh ?? '';
  $('nextK').textContent = `NEXT · ${copy.next}`;
  $('eraK').textContent = copy.era;
  $('compareK').textContent = copy.compare;
  $('personK').textContent = copy.person;
  $('p2').textContent = copy.brand;
  $('p4').textContent = copy.promo.join('\n');
  $('p5').textContent = copy.features;
  $('disc').textContent = copy.disclaimer;
  for (const id of ['back', 'nextBack', 'promoBack']) $(id).innerHTML = back;

  const paths = new Set([storyImage()]);
  for (const [index, shot] of timeline.entries()) {
    if (shot.image) paths.add(shot.image);
    if (shot.portrait) paths.add(shot.portrait);
    for (const card of shot.cards ?? []) if (card.image) paths.add(card.image);
    const previous = timeline[index - 1];
    if (storyCardScene(previous) && storyCardScene(shot) && storyCardPath(previous) === storyCardPath(shot)) {
      const last = previous.motion?.at(-1)?.slice(1);
      const first = shot.motion?.[0]?.slice(1);
      if (last && first && last.every((value, axis) => value === first[axis])) {
        continuousCardStarts.add(shot);
      }
    }
  }
  await Promise.all([...paths].map(async path => {
    const image = new Image();
    image.src = path;
    await image.decode().catch(() => { throw Error(`无法读取素材 ${path}`); });
    storyAssets.set(path, image);
  }));
  const fontSample = JSON.stringify([ep, copy]);
  if (ep.layout === 'daybreak') {
    initStorySky(timeline);
    await initDaybreak(ep, copy);
  }
  await Promise.all([
    ep.layout === 'daybreak' ? document.fonts.load('400 40px DaybreakSerif', fontSample) : null,
    document.fonts.load('300 40px "Noto Serif SC"', fontSample),
    document.fonts.load('400 40px "Noto Serif SC"', fontSample),
    document.fonts.load('400 40px Cinzel'),
    document.fonts.load('400 40px "Cormorant Garamond"'),
  ]);
}

function setStoryShot(shot) {
  const scene = shot.scene;
  if (storyCardScene(shot)) {
    const path = storyCardPath(shot);
    const {naturalWidth: width, naturalHeight: height} = storyAssets.get(path);
    if ($('cardImg').getAttribute('src') !== path) $('cardImg').src = path;
    Object.assign($('cam').style, {width: `${width}px`, height: `${height}px`, transformOrigin: '0 0'});
    $('marks').setAttribute('viewBox', `0 0 ${width} ${height}`);
    $('marks').replaceChildren();
    if (scene === 'glance' && shot.ring) {
      const [x, y, rx, ry = rx] = shot.ring;
      const ring = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
      for (const [key, value] of Object.entries({
        cx: x * width, cy: y * height, rx: rx * width, ry: ry * height,
        fill: 'none', stroke: '#E6D2B5', 'stroke-width': 1, 'vector-effect': 'non-scaling-stroke',
      })) ring.setAttribute(key, value);
      $('marks').append(ring);
    }
    $('kicker').textContent = shot.label?.s ?? '';
    $('label').textContent = shot.label?.t ?? '';
  }
  if (scene === 'era') {
    $('eraYear').textContent = shot.year;
    $('eraPlace').textContent = shot.place;
  }
  if (scene === 'compare') {
    $('compareCards').replaceChildren(...shot.cards.map(card => {
      const figure = document.createElement('figure');
      const img = storyAssets.get(card.image ?? storyImage()).cloneNode();
      const caption = document.createElement('figcaption');
      caption.textContent = card.caption;
      figure.append(img, caption);
      return figure;
    }));
  }
  if (scene === 'person') {
    $('personName').textContent = shot.name;
    $('personYears').textContent = shot.years ?? '';
    $('personBio').textContent = shot.bio ?? '';
    $('personPortrait').hidden = !shot.portrait;
    if (shot.portrait) $('personPortrait').src = shot.portrait;
    $('storyPerson').classList.toggle('with-portrait', Boolean(shot.portrait));
  }
  $('hookText').textContent = scene === 'hook' ? shot.sub : '';
  $('quote').textContent = scene === 'quote' ? shot.quote : '';
  $('sub').textContent = ['hook', 'quote', 'promo'].includes(scene) ? '' : shot.sub ?? '';
}

function storyCamera(shot, elapsed, progress) {
  if (shot.motion) {
    const index = shot.motion.findIndex(([at]) => at >= progress && at > 0);
    const end = index < 0 ? shot.motion.length - 1 : index;
    const [startAt, ...start] = shot.motion[end - 1];
    const [endAt, ...target] = shot.motion[end];
    const u = clamp((progress - startAt) / (endAt - startAt));
    const smooth = u * u * (3 - 2 * u);
    return start.map((value, axis) => lerp(value, target[axis], smooth));
  }
  const [x, y, zoom] = shot.focus ?? [.5, .5, 1.04];
  const movement = ease(elapsed / 1.15);
  return [lerp(.5, x, movement), lerp(.5, y, movement), lerp(1, zoom, movement) * (1 + .018 * progress)];
}

function renderStoryCard(shot, time, elapsed) {
  const image = storyAssets.get(storyCardPath(shot));
  const {naturalWidth: width, naturalHeight: height} = image;
  const fit = EP.layout === 'daybreak' ? Math.min(560 / width, 778 / height) : Math.min(620 / width, 832 / height);
  const duration = shot.end - shot.start;
  const [x, y, zoom] = storyCamera(shot, elapsed, clamp(elapsed / duration));
  const scale = fit * zoom;
  const centerX = width * x;
  const centerY = height * y;
  const cameraY = clamp(450 - scale * centerY, Math.min(0, 900 - height * scale), Math.max(0, 900 - height * scale));
  const flip = shot.scene === 'hook' ? 180 * (1 - ease((elapsed - .22) / .9)) : 0;
  $('cam').style.transform = `translate(${540 - centerX * scale}px,${cameraY}px) scale(${scale})`;
  $('flip').style.transform = `rotateY(${flip}deg)`;
  const ring = $('marks').firstElementChild;
  if (ring) {
    const delay = shot.ringAt == null ? .95 : shot.ringAt * duration;
    ring.style.opacity = win(time, shot.start + delay, shot.end, .5, .3).o;
  }
}

function renderStory(time) {
  const shotIndex = TL.findIndex(s => time < s.end);
  const shot = TL[shotIndex] ?? TL.at(-1);
  if (shot !== storySegment) {
    setStoryShot(shot);
    storySegment = shot;
  }
  const scene = shot.scene;
  const elapsed = time - shot.start;
  const fade = (delay = 0, duration = .5) => win(time, shot.start + delay, shot.end, duration, .3);
  const w = fade();
  const card = storyCardScene(shot);
  const promo = scene === 'promo';
  const daybreak = EP.layout === 'daybreak';
  const header = promo ? 0 : win(time, 0, 1e9, .8).o;
  vis('brand', daybreak ? 0 : header * (scene === 'era' ? .56 : 1));
  vis('daybreakHeader', daybreak ? header : 0);
  $('astro').style.opacity = daybreak ? 0 : scene === 'era' ? .18 : .66;
  if (daybreak) {
    for (const {animation, start, duration} of storyMeteors) {
      animation.currentTime = clamp((time - start) * 1000, 0, duration);
    }
    $('daybreakMoon').classList.toggle('outro', promo);
    $('daybreakDial').setAttribute('transform', `rotate(${time * .8})`);
    vis('daybreakMoon', promo || scene === 'era' ? fade(0, .55).o : 0);
  }
  const cardIn = continuousCardStarts.has(shot) ? shot.start - .5 : shot.start;
  const cardOut = continuousCardStarts.has(TL[shotIndex + 1]) ? 1e9 : shot.end;
  $('stage').style.opacity = card ? win(time, cardIn, cardOut, .5, .3).o : 0;
  if (card) renderStoryCard(shot, time, elapsed);
  vis('kicker', card && shot.label?.s ? fade(.34).o : 0);
  vis('label', card && shot.label?.t ? fade(.42).o : 0);
  vis('hookText', scene === 'hook' ? fade(.86, .55).o : 0);
  vis('sub', $('sub').textContent ? fade(.16).o : 0);

  vis('storyEra', scene === 'era' ? w.o : 0, (1 - w.i) * 12);
  if (scene === 'era') $('eraRule').style.transform = `scaleX(${ease((elapsed - .2) / .8)})`;
  vis('storyCompare', scene === 'compare' ? w.o : 0);
  if (scene === 'compare') {
    const cards = [...$('compareCards').children];
    const last = cards.at(-1);
    const linger = Math.max(shot.start + 2.15, shot.end - 1.2);
    const centerProgress = ease((time - linger) / .85);
    const centerShift = daybreak && shot.keepLast && centerProgress && cards.length > 1
      ? (cards[0].offsetLeft - last.offsetLeft) / 2 : 0;
    cards.forEach((item, index) => {
      const enter = fade(.18 + index * .42, .55);
      const leave = shot.keepLast && item !== last ? ease((time - linger) / .55) : 0;
      const slide = item === last && centerShift ? `translateX(${centerShift * centerProgress}px)` : '';
      vis(item, enter.o * (1 - leave), (1 - enter.i) * 14, slide);
    });
  }
  vis('storyPerson', scene === 'person' ? w.o : 0, (1 - w.i) * 14);
  vis('quote', scene === 'quote' ? fade(.24, .7).o : 0);
  vis('quoteRule', scene === 'quote' ? fade(.85).o : 0);

  vis('nextBack', scene === 'next' ? w.o : 0, (1 - w.i) * 20, `rotateY(${5 * Math.sin(elapsed * 1.2)}deg)`);
  vis('nextK', scene === 'next' ? fade(.28).o : 0);
  vis('nextT', scene === 'next' ? fade(.46).o : 0);
  const endElements = daybreak
    ? [['p1', .2], ['p2', .35], ['p4', .5], ['disc', .6]]
    : [
    ['promoBack', 0], ['p1', .35], ['p2', .53], ['p3', .78],
    ['p4', .97], ['p5', 1.22], ['disc', 1.42],
  ];
  for (const [id, delay] of endElements) {
    const f = fade(delay, .68);
    vis(id, promo ? f.o : 0, (1 - f.i) * 12);
  }
}
