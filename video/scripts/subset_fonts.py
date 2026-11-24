# 从 src/ep*/copy.ts 抽出全部字符，把思源宋体（Noto Serif CJK SC）和思源黑体（Noto Sans CJK SC）切成小的 woff2，放进 public/fonts/。
# 这样出片不依赖本机装没装字体。用法（在 video/ 里）：python3 scripts/subset_fonts.py [字体目录]
# 需要 fonttools 和 brotli（pip install fonttools brotli），以及系统的 Noto CJK 字体（apt-get install fonts-noto-cjk）。
import glob, sys, string
from fontTools.ttLib import TTCollection
from fontTools import subset
src = sys.argv[1] if len(sys.argv) > 1 else '/usr/share/fonts/opentype/noto'
chars = set(string.printable) | set('“”‘’「」：，。？、—·…')
for p in glob.glob('src/ep*/copy.ts'):
    chars |= set(open(p, encoding='utf-8').read())
text = ''.join(sorted(c for c in chars if c.isprintable()))
def pick(ttc):
    for f in TTCollection(ttc).fonts:
        if f['name'].getDebugName(1).endswith(' SC'):
            return f
    raise SystemExit('没找到 SC 字体：' + ttc)
for ttc, out in [('NotoSerifCJK-Regular.ttc', 'serif-regular'), ('NotoSerifCJK-Bold.ttc', 'serif-bold'), ('NotoSansCJK-Regular.ttc', 'sans-regular')]:
    font = pick(f'{src}/{ttc}')
    opts = subset.Options(); opts.flavor = 'woff2'; opts.layout_features = ['*']
    s = subset.Subsetter(opts); s.populate(text=text); s.subset(font)
    font.flavor = 'woff2'; font.save(f'public/fonts/{out}.woff2')
    print(out, len(text), '字')
