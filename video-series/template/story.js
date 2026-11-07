const storyImage = () => `/public/rws/${EP.card}.webp`;
const storyAssets = new Map();
let storySegment;

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
  for (const shot of timeline) {
    if (shot.image) paths.add(shot.image);
    if (shot.portrait) paths.add(shot.portrait);
    for (const card of shot.cards ?? []) if (card.image) paths.add(card.image);
  }
  await Promise.all([...paths].map(async path => {
    const image = new Image();
    image.src = path;
    await image.decode().catch(() => { throw Error(`无法读取素材 ${path}`); });
    storyAssets.set(path, image);
  }));
  const fontSample = JSON.stringify([ep, copy]);
  await Promise.all([
    document.fonts.load('300 40px "Noto Serif SC"', fontSample),
    document.fonts.load('400 40px "Noto Serif SC"', fontSample),
    document.fonts.load('400 40px Cinzel'),
    document.fonts.load('400 40px "Cormorant Garamond"'),
  ]);
}

function setStoryShot(shot) {
  const scene = shot.scene;
  if (['hook', 'story', 'glance'].includes(scene)) {
    const path = shot.image ?? storyImage();
    const {naturalWidth: width, naturalHeight: height} = storyAssets.get(path);
    $('cardImg').src = path;
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

function renderStoryCard(shot, time, elapsed) {
  const image = storyAssets.get(shot.image ?? storyImage());
  const {naturalWidth: width, naturalHeight: height} = image;
  const fit = Math.min(620 / width, 832 / height);
  const [x, y, zoom] = shot.focus ?? [.5, .5, 1.04];
  const movement = ease(elapsed / 1.15);
  const drift = clamp(elapsed / (shot.end - shot.start));
  const scale = fit * lerp(1, zoom, movement) * (1 + .018 * drift);
  const centerX = width * lerp(.5, x, movement);
  const centerY = height * lerp(.5, y, movement);
  const cameraY = clamp(450 - scale * centerY, Math.min(0, 900 - height * scale), Math.max(0, 900 - height * scale));
  const flip = shot.scene === 'hook' ? 180 * (1 - ease((elapsed - .22) / .9)) : 0;
  $('cam').style.transform = `translate(${540 - centerX * scale}px,${cameraY}px) scale(${scale})`;
  $('flip').style.transform = `rotateY(${flip}deg)`;
  const ring = $('marks').firstElementChild;
  if (ring) ring.style.opacity = win(time, shot.start + .95, shot.end, .5, .3).o;
}

function renderStory(time) {
  const shot = TL.find(s => time < s.end) ?? TL.at(-1);
  if (shot !== storySegment) {
    setStoryShot(shot);
    storySegment = shot;
  }
  const scene = shot.scene;
  const elapsed = time - shot.start;
  const fade = (delay = 0, duration = .5) => win(time, shot.start + delay, shot.end, duration, .3);
  const w = fade();
  const card = ['hook', 'story', 'glance'].includes(scene);
  const promo = scene === 'promo';
  vis('brand', promo ? 0 : win(time, 0, 1e9, .8).o * (scene === 'era' ? .56 : 1));
  $('astro').style.opacity = scene === 'era' ? .18 : .66;
  $('stage').style.opacity = card ? w.o : 0;
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
    cards.forEach((item, index) => {
      const enter = fade(.18 + index * .42, .55);
      const leave = shot.keepLast && index < cards.length - 1
        ? ease((time - Math.max(shot.start + 2.15, shot.end - 1.2)) / .55) : 0;
      vis(item, enter.o * (1 - leave), (1 - enter.i) * 14);
    });
  }
  vis('storyPerson', scene === 'person' ? w.o : 0, (1 - w.i) * 14);
  vis('quote', scene === 'quote' ? fade(.24, .7).o : 0);
  vis('quoteRule', scene === 'quote' ? fade(.85).o : 0);

  vis('nextBack', scene === 'next' ? w.o : 0, (1 - w.i) * 20, `rotateY(${5 * Math.sin(elapsed * 1.2)}deg)`);
  vis('nextK', scene === 'next' ? fade(.28).o : 0);
  vis('nextT', scene === 'next' ? fade(.46).o : 0);
  for (const [id, delay] of [
    ['promoBack', 0], ['p1', .35], ['p2', .53], ['p3', .78],
    ['p4', .97], ['p5', 1.22], ['disc', 1.42],
  ]) {
    const f = fade(delay, .68);
    vis(id, promo ? f.o : 0, (1 - f.i) * 12);
  }
}
