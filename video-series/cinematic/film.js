(() => {
  const canvas = document.querySelector('canvas');
  const g = canvas.getContext('2d', {alpha: false});
  const W = 1080, H = 1920, TAU = Math.PI * 2;
  const ivory = '#F4EFE6', gold = '#C5A059', bright = '#FFF2CC', muted = '#ACA093';
  const score = {pulse: .625, chase: 60 / 108, rise: 29.111};
  let ep, assets, grain, moon, voice;
  const clamp = x => Math.min(1, Math.max(0, x));
  const mix = (a, b, t) => a + (b - a) * t;
  const ease = x => { const t = clamp(x); return t * t * (3 - 2 * t); };
  const reveal = (t, start, end, fade = .5) => ease((t - start) / fade) * ease((end - t) / fade);
  const ramp = (t, a, b) => ease((t - a) / (b - a));
  const frac = x => x - Math.floor(x);
  const noise = i => frac(Math.sin(i * 131.97 + .84) * 57234.63);
  const pulse = (t, start, length) => Math.exp(-frac((t - start) / length) * 6);
  const cues = [0, 6, 13, 20.222, 29.111, 35, 39, 45];

  const xy = (cx, cy, radius, angle) => [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius];
  function line(x1, y1, x2, y2, color, width = 1) {
    g.strokeStyle = color;
    g.lineWidth = width;
    g.beginPath();
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
    g.stroke();
  }
  function circle(x, y, radius, color, width = 1) {
    g.beginPath();
    g.arc(x, y, radius, 0, TAU);
    g.strokeStyle = color;
    g.lineWidth = width;
    g.stroke();
  }
  function dot(x, y, radius, color) {
    g.fillStyle = color;
    g.beginPath();
    g.arc(x, y, radius, 0, TAU);
    g.fill();
  }
  function text(value, x, y, size, {font = 'Daybreak, serif', color = ivory, align = 'center', alpha = 1, slant = 0, tracking = '0px'} = {}) {
    g.save();
    g.globalAlpha *= alpha;
    g.translate(x, y);
    g.transform(1, 0, slant, 1, 0, 0);
    g.font = `${size}px ${font}`;
    g.letterSpacing = tracking;
    g.textAlign = align;
    g.fillStyle = color;
    g.fillText(value, 0, 0, 895);
    g.restore();
  }
  const latin = (s, x, y, size, opt) => text(s, x, y, size, {font: 'Cinematic, serif', ...opt});

  function dial(x, y, r, t, alpha) {
    g.save();
    g.globalAlpha *= alpha;
    circle(x, y, r, gold);
    circle(x, y, r * .76, '#7A5C29');
    for (let k = 0; k < 72; k++) {
      const a = k * TAU / 72 + t * .018;
      const b = k % 6 === 0;
      line(...xy(x, y, r * (b ? .85 : .909), a), ...xy(x, y, r * .945, a), b ? gold : '#7A5C29');
    }
    for (let k = 0; k < 4; k++) {
      const a = k * Math.PI / 2 + t * .018;
      line(...xy(x, y, r * 1.01, a), ...xy(x, y, r * 1.105, a), gold);
      dot(...xy(x, y, r * 1.13, a), 1.7, bright);
    }
    g.restore();
  }
  function constellation(x, y, size, amount, withCards = false) {
    const points = [[.07,.19],[.23,.26],[.39,.32],[.56,.43],[.78,.43],[.75,.65],[.55,.61]];
    const connected = [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,3]];
    g.save();
    g.globalAlpha *= amount;
    for (const [a, b] of connected) {
      line(x + points[a][0] * size, y + points[a][1] * size, x + points[b][0] * size, y + points[b][1] * size, '#7A5C29');
    }
    for (const [u, v] of points) {
      if (withCards) card(assets.back, x + u * size, y + v * size, size * .14, -.12, 0, .88);
      else dot(x + u * size, y + v * size, 2.3, bright);
    }
    g.restore();
  }
  function sky(t, part) {
    g.fillStyle = '#0F0F11';
    g.fillRect(0, 0, W, H);
    const dawn = part >= 4 ? ramp(t, 29.111, 39) : 0;
    const light = g.createRadialGradient(mix(390, 540, dawn), mix(640, 510, dawn), 16, 540, 840, 850);
    light.addColorStop(0, `rgba(197,160,89,${.09 + dawn * .14})`);
    light.addColorStop(.62, 'rgba(122,92,41,.04)');
    light.addColorStop(1, 'rgba(15,15,17,0)');
    g.fillStyle = light;
    g.fillRect(0, 0, W, H);
    g.fillStyle = grain;
    g.globalAlpha = .06;
    g.fillRect(0, 0, W, H);
    g.globalAlpha = 1;
    for (let i = 0; i < 42; i++) {
      const x = 65 + noise(i * 4) * 950, y = 263 + noise(i * 4 + 1) * 1200;
      g.globalAlpha = .05 + noise(i * 4 + 2) * .21;
      dot(x, y, .55 + noise(i * 4 + 3) * 1.15, bright);
    }
    g.globalAlpha = 1;
    for (const [start, x, y, deg] of [[2.05,948,365,22],[11.85,883,412,26],[17.94,331,364,22],[26.45,958,440,24],[37.05,321,373,29]]) {
      if (t < start || t > start + 1.25) continue;
      const u = ease((t - start) / 1.25), angle = deg * Math.PI / 180;
      g.save();
      g.translate(x - Math.cos(angle) * u * 310, y + Math.sin(angle) * u * 310);
      g.rotate(-angle);
      g.globalAlpha = Math.sin(u * Math.PI) * .55;
      const trail = g.createLinearGradient(0, 0, 112, 0);
      trail.addColorStop(0, ivory);
      trail.addColorStop(1, 'transparent');
      line(0, 0, 112, 0, trail);
      dot(0, 0, 2, bright);
      g.restore();
    }
  }
  function moonAt(x, y, radius, t, alpha) {
    g.save();
    g.globalAlpha *= alpha;
    dial(x, y, radius * 1.47, t, .49);
    g.drawImage(moon, x - radius, y - radius, radius * 2, radius * 2);
    g.restore();
  }
  function card(img, x, y, width, roll = 0, turn = 0, pitch = 1, shine = 0, thickness = 3) {
    const height = width * (img === assets.back ? 5 / 3 : img.height / img.width);
    const face = Math.cos(turn);
    const side = Math.sin(turn);
    g.save();
    g.translate(x, y);
    g.rotate(roll);
    const wx = width * Math.max(.006, Math.abs(face));
    g.transform(wx / width, side * .12, 0, pitch, 0, 0);
    g.fillStyle = '#7A5C29';
    g.fillRect(-width / 2 + side * thickness, -height / 2 + thickness, width, height);
    g.drawImage(img, -width / 2, -height / 2, width, height);
    g.strokeStyle = 'rgba(197,160,89,.57)';
    g.lineWidth = 1;
    g.strokeRect(-width / 2, -height / 2, width, height);
    if (shine > .01) {
      const foil = g.createLinearGradient(-width / 2, 0, width / 2, height * .18);
      foil.addColorStop(0, 'transparent');
      foil.addColorStop(.52, `rgba(255,242,204,${shine})`);
      foil.addColorStop(.68, 'transparent');
      g.fillStyle = foil;
      g.fillRect(-width / 2, -height / 2, width, height);
    }
    g.restore();
  }
  function stack(x, y, width, tilt, pitch, depth, gloss) {
    const height = width * 5 / 3 * pitch;
    g.save();
    g.translate(x, y);
    g.rotate(tilt);
    const shine = g.createLinearGradient(-width / 2, 0, width / 2, 0);
    shine.addColorStop(0, '#392911');
    shine.addColorStop(.48, gold);
    shine.addColorStop(.69, `rgba(255,242,204,${.3 + gloss * .6})`);
    shine.addColorStop(1, '#6C5024');
    g.fillStyle = shine;
    g.fillRect(-width / 2, height / 2 - 1, width, depth);
    for (let y = 1; y < depth; y += 1.8) {
      line(-width / 2, height / 2 + y, width / 2, height / 2 + y, '#0F0F11', .5);
    }
    card(assets.back, 0, 0, width, 0, 0, pitch, gloss * .12);
    g.restore();
  }
  function fan(open, y, opacity, t, missing = false) {
    g.save();
    g.globalAlpha *= opacity;
    for (let i = 0; i < 78; i++) {
      if (missing && i === 39) continue;
      const p = (i - 38.5) / 38.5;
      const spread = ramp(open, Math.abs(p) * .12, 1);
      card(assets.back, 540 + p * 580 * spread, y + p * p * 232 * spread,
        116 + 18 * (1 - Math.abs(p)), p * .89 * spread, 0, .81,
        i % 9 === 0 ? .045 * pulse(t, 6, score.pulse) : 0);
    }
    g.restore();
  }
  function title(eyebrow, heading, y, alpha = 1) {
    latin(eyebrow, 540, y, 33, {color: gold, alpha, tracking: '5px'});
    text(heading, 540, y + 99, 75, {alpha, slant: -.11, tracking: '7px'});
  }
  function rule(y, size, alpha) {
    const gradient = g.createLinearGradient(540 - size / 2, 0, 540 + size / 2, 0);
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(.5, gold);
    gradient.addColorStop(1, 'transparent');
    g.save();
    g.globalAlpha *= alpha;
    line(540 - size / 2, y, 540 + size / 2, y, gradient);
    g.restore();
  }
  function intro(t) {
    const u = ramp(t, 0, 6);
    const focus = ramp(t, 2.65, 3.55);
    g.save();
    g.filter = `blur(${(focus * 3.3).toFixed(2)}px)`;
    moonAt(540, 578, 103 + u * 10, t, .82);
    constellation(139, 335, 257, ramp(t, .5, 3) * .5);
    g.restore();
    g.save();
    g.filter = `blur(${((1 - focus) * 3.8).toFixed(2)}px)`;
    stack(mix(565, 522, u), mix(914, 897, u), mix(650, 788, u), mix(-.23, -.16, u), mix(.25, .278, u), 38, focus * .75);
    g.restore();
    const alpha = ramp(t, .8, 2) * (1 - ramp(t, 5.55, 6));
    title('II  /  THE HIGH PRIESTESS', '她曾戴着女教皇的冠', 1175, alpha);
    rule(1334, 595, alpha * .62);
  }
  function shuffle(t) {
    const u = t - 6, beat = pulse(t, 6, score.pulse);
    const revealFan = ramp(t, 9.55, 12.63);
    if (t < 11.4) {
      g.save();
      g.globalAlpha *= 1 - revealFan;
      const separation = ramp(t, 6, 7.03) * (1 - ramp(t, 9.9, 11.4));
      const w = 395 + beat * 13;
      stack(540 - separation * 243, 787 - beat * 8, w, -.21, .42, 30, beat * .83);
      stack(540 + separation * 248, 933 - beat * 13, w, .17, .39, 28, beat * .84);
      for (let i = 0; i < 32; i++) {
        const phase = clamp((u - 1.08 - i * .075) / .65);
        if (!phase || phase === 1) continue;
        const bridge = Math.sin(phase * Math.PI);
        const side = i % 2 === 0 ? -1 : 1;
        card(assets.back, 540 + side * (1 - phase) * 248, 869 - bridge * (155 + i * 1.3),
          257 + beat * 5, side * .14 * (1 - phase), bridge * .4, .36, .1 + beat * .1, 4);
      }
      g.restore();
    }
    if (revealFan) fan(revealFan, 885, revealFan, t);
    const alpha = reveal(t, 7.4, 13.2, .6);
    title('THE BOOK  /  BEFORE 1909', '那本书，早在四百多年前', 1200, alpha);
  }
  function history(t) {
    const rise = ramp(t, 13, 14.35);
    const settle = ramp(t, 14.4, 16.62);
    const flip = ramp(t, 13.25, 14.62) * Math.PI;
    const blend = ramp(t, 16.5, 17.22);
    const y = mix(889, 756, rise);
    if (t < 15.1) fan(1, 885 + rise * 270, 1 - rise, t, true);
    if (blend < 1) {
      g.save();
      g.globalAlpha *= 1 - blend;
      card(Math.cos(flip) > 0 ? assets.back : assets.milan, mix(548, 509, settle), y - settle * 10,
        mix(133, 405, rise) + settle * 24, mix(.07, -.04, rise), Math.PI - flip,
        mix(.81, .99, rise), .065 * pulse(t, 6, score.pulse));
      g.restore();
    }
    if (blend > 0) {
      g.save();
      g.globalAlpha *= blend;
      card(assets.lyon, mix(516, 566, ramp(t, 17, 20.22)), 752, mix(409, 440, ramp(t, 17, 20.22)),
        .028, 0, 1, .04);
      g.restore();
    }
    const label = t < 16.8 ? '十五世纪 · 米兰手绘' : '1701–1715 · 里昂木刻';
    const name = t < 16.8 ? 'The Popess' : 'La Papesse';
    title(name, label, 1260, reveal(t, 13.8, 20.55, .55));
  }
  const details = [
    {at: 20.222, end: 22.444, xy: [.44, .536], to: [.488, .56], zoom: 2.13, tilt: -.055, label: 'TORA 卷轴', roman: 'I  /  THE SCROLL'},
    {at: 22.444, end: 24.667, xy: [.40, .182], to: [.48, .245], zoom: 2.19, tilt: .064, label: '石榴帷幕', roman: 'II  /  THE VEIL'},
    {at: 24.667, end: 26.889, xy: [.64, .77], to: [.58, .791], zoom: 2.08, tilt: -.03, label: '脚边新月', roman: 'III  /  THE CRESCENT'},
  ];
  function macro(t) {
    const shot = details.find(d => t < d.end) ?? details.at(-1);
    const pull = ramp(t, 26.889, 29.111);
    const u = ramp(t, shot.at, shot.end);
    const z = mix(shot.zoom + u * .14, 1.03, pull);
    const image = assets.front;
    const w = 530 * z, h = w * image.height / image.width;
    const x = mix(mix(shot.xy[0], shot.to[0], u), .5, pull);
    const y = mix(mix(shot.xy[1], shot.to[1], u), .49, pull);
    const beat = pulse(t, 18, score.chase);
    g.save();
    g.beginPath();
    g.rect(77, 317, 926, 868);
    g.clip();
    g.translate(540, 746);
    g.rotate(mix(shot.tilt * (1 - u * .6), 0, pull));
    g.drawImage(image, -x * w, -y * h, w, h);
    const flare = g.createLinearGradient(-490 + u * 700, -80, -160 + u * 700, 300);
    flare.addColorStop(0, 'transparent');
    flare.addColorStop(.5, `rgba(255,242,204,${beat * .11})`);
    flare.addColorStop(1, 'transparent');
    g.fillStyle = flare;
    g.globalCompositeOperation = 'screen';
    g.fillRect(-x * w, -y * h, w, h);
    g.restore();
    g.strokeStyle = 'rgba(197,160,89,.31)';
    g.strokeRect(77, 317, 926, 868);
    title(pull > .32 ? '1909  /  PAMELA COLMAN SMITH' : shot.roman,
      pull > .32 ? '帕梅拉·科尔曼·史密斯' : shot.label, 1265, .95);
  }
  function orbit(t) {
    const u = ramp(t, 29.111, 31.32), settle = ramp(t, 30.6, 34.7);
    const angle = Math.PI * (1 - u);
    dial(540, 718, 315 + settle * 24, t, .21 * u);
    card(u < .5 ? assets.back : assets.front, mix(542, 467, settle),
      751 - Math.sin(u * Math.PI) * 52, mix(491, 444, settle), -.11 * Math.sin(u * Math.PI), angle,
      mix(.86, .994, u), .36 * Math.exp(-Math.pow((u - .55) * 5, 2)), 12);
    const alpha = reveal(t, 30.2, 35.3, .7);
    latin('MORNING RITUAL', 540, 1246, 34, {color: gold, alpha, tracking: '5px'});
    text('留十分钟给自己', 540, 1340, 65, {alpha, slant: -.10, tracking: '5px'});
  }
  function gallery(t) {
    const u = ramp(t, 35, 37.45);
    const fold = ramp(t, 38.2, 39);
    const columns = 13, rows = 6;
    g.save();
    g.globalAlpha *= u * (1 - fold);
    constellation(82, 431, 405, u, true);
    moonAt(820, 583, 90, t, u);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const k = row * columns + col;
        if (k === 2) continue;
        const enter = ramp(t, 35.1 + k * .012, 36.17 + k * .012);
        if (enter) card(assets.back, 149 + col * 65, 811 + row * 76, 40 * enter);
      }
    }
    text('北斗七星', 251, 697, 28, {color: muted});
    text('天文历书', 820, 753, 28, {color: muted});
    latin('THE ATLAS  /  78', 540, 1305, 35, {color: gold, tracking: '5px'});
    text('七十八张牌 · 一页图鉴', 540, 1380, 55, {slant: -.1});
    g.restore();
    card(assets.front, mix(467, 279, u), mix(751, 811, u), mix(444, 39, u) * mix(1, .65, fold),
      0, 0, 1, .06);
  }
  function seal(t) {
    const alpha = ramp(t, 39, 39.64);
    const u = ramp(t, 39, 45);
    g.save();
    g.globalAlpha *= alpha;
    g.translate(540, 640);
    g.scale(1 + u * .03, 1 + u * .03);
    g.rotate((1 - u) * -.11);
    circle(-46, 0, 92, gold, 1.2);
    circle(46, 0, 92, gold, 1.2);
    dial(0, 0, 156, t, .23);
    const star = Array.from({length: 16}, (_, i) => xy(0, 0, i % 2 ? 7 : (i % 4 ? 20 : 30), i * TAU / 16));
    g.beginPath();
    g.moveTo(...star[0]);
    star.slice(1).forEach(p => g.lineTo(...p));
    g.closePath();
    g.fillStyle = bright;
    g.fill();
    g.restore();
    latin('DAYBREAK', 540, 928, 94, {alpha, tracking: '12px'});
    text('晨启塔罗', 540, 1027, 65, {alpha, slant: -.14, color: bright, tracking: '13px'});
    text('给自己十分钟，听见此刻的想法', 540, 1113, 30, {alpha, color: muted, tracking: '3px'});
    g.save();
    g.globalAlpha *= ramp(t, 39.5, 40.27);
    const chime = Math.max(0, 1 - Math.abs(t - 42.23) / .72);
    const sheen = g.createLinearGradient(246 + chime * 125, 0, 834, 0);
    sheen.addColorStop(0, '#7A5C29');
    sheen.addColorStop(.52, chime > .2 ? bright : gold);
    sheen.addColorStop(1, '#7A5C29');
    g.beginPath();
    g.roundRect(239, 1172, 602, 102, 49);
    g.fillStyle = 'rgba(15,15,17,.59)';
    g.fill();
    g.strokeStyle = sheen;
    g.lineWidth = 1.3;
    g.stroke();
    latin(ep.domain, 540, 1238, 57, {color: ivory, tracking: '3px'});
    g.restore();
    text('塔罗文化与艺术科普 · 内容仅供参考', 540, 1416, 24, {alpha, color: muted});
  }
  function masthead(t, part) {
    if (part === 6) return;
    const alpha = ramp(t, .2, 1.05);
    latin('DAYBREAK', 94, 251, 40, {align: 'left', alpha, tracking: '5px'});
    text('牌的故事  /  03', 986, 249, 24, {align: 'right', color: gold, alpha, tracking: '3px'});
    rule(276, 893, alpha * .38);
    for (let i = 0; i < 7; i++) {
      const x = 464 + i * 25;
      line(x, 1465, x + 13, 1465, i === part ? gold : 'rgba(197,160,89,.23)', i === part ? 2 : 1);
    }
  }
  function caption(t, part) {
    if (part !== 4) return;
    const line = voice.find(cue => t >= cue.at && t < cue.end);
    if (line) text(line.say, 540, 1416, 31, {alpha: reveal(t, line.at, line.end, .25), color: muted});
  }
  window.filmRender = function (seconds) {
    const t = Math.max(0, Math.min(45 - .0001, seconds));
    const part = cues.findIndex((_, i) => t < cues[i + 1]);
    sky(t, part);
    [intro, shuffle, history, macro, orbit, gallery, seal][part](t);
    masthead(t, part);
    caption(t, part);
  };
  window.filmInit = async function (data, media, lines) {
    ep = data;
    voice = lines;
    const names = Object.keys(media);
    const images = await Promise.all(names.map(async key => {
      const img = new Image();
      img.src = media[key];
      await img.decode();
      return img;
    }));
    assets = Object.fromEntries(names.map((key, index) => [key, images[index]]));
    const surface = document.createElement('canvas');
    surface.width = assets.texture.width;
    surface.height = assets.texture.height;
    const texture = surface.getContext('2d');
    texture.drawImage(assets.texture, 0, 0);
    moon = document.createElement('canvas');
    moon.width = moon.height = 270;
    const moonContext = moon.getContext('2d');
    const image = moonContext.createImageData(270, 270);
    shadeMoon(image.data, 270, texture.getImageData(0, 0, surface.width, surface.height),
      {elongation: 318, libLat: 0, libLon: 0});
    moonContext.putImageData(image, 0, 0);
    const paper = document.createElement('canvas');
    paper.width = paper.height = 96;
    const ink = paper.getContext('2d');
    const fibers = ink.createImageData(96, 96);
    for (let i = 0; i < fibers.data.length; i += 4) {
      const shade = noise(i) > .54 ? 235 : 0;
      fibers.data.set([shade, shade, shade, 155], i);
    }
    ink.putImageData(fibers, 0, 0);
    grain = g.createPattern(paper, 'repeat');
    await document.fonts.ready;
    await Promise.all([document.fonts.load('52px Daybreak'), document.fonts.load('500 52px Cinematic')]);
    window.filmRender(0);
  };
})();
