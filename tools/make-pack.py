# -*- coding: utf-8 -*-
"""
把一堆信纸图片打包成拾句能导入的素材包（.json）。

    python make-pack.py <图片目录> [输出.json]

规则：
  · 竖版和横版**成对**：文件名里带 portrait / 竖 的算竖版，带 landscape / 横 的算横版，
    去掉这些词之后名字相同的两张，算作同一套。只有一张也行，另一个方向会用它顶上。
  · 竖版建议 2160×2700（4:5），横版 2700×2160（5:4）—— 拾句的卡片就是这个尺寸，
    对上了一个像素都不用裁。
  · 输出的图统一转成 WebP，默认 q88。这种平色带纹理的纸压得极狠
    （实测 3.6MB 的 PNG 压到 25KB，1:1 看不出差别）。

需要 Pillow：  pip install pillow
"""
import sys, os, io, re, json, base64

try:
    from PIL import Image
except ImportError:
    sys.exit('需要 Pillow：pip install pillow')

QUALITY = 88
ORIENT = [(r'(portrait|竖版?|vertical)', 'portrait'),
          (r'(landscape|横版?|horizontal)', 'landscape')]


def classify(name):
    for pat, kind in ORIENT:
        if re.search(pat, name, re.I):
            return kind, re.sub(pat, '', name, flags=re.I)
    return None, name


def clean(s):
    return re.sub(r'[_\-\s]{2,}', '_', s).strip('_- ').strip() or 'paper'


def encode(path):
    im = Image.open(path).convert('RGB')
    buf = io.BytesIO()
    im.save(buf, 'WEBP', quality=QUALITY, method=6)
    mean = [round(sum(c) / len(c)) for c in zip(*im.resize((32, 32)).getdata())]
    return 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode(), mean, im.size


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    src = sys.argv[1]
    dst = sys.argv[2] if len(sys.argv) > 2 else 'my-papers.pack.json'
    out = os.fdopen(1, 'w', encoding='utf-8', closefd=False)

    files = [f for f in sorted(os.listdir(src))
             if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp', '.bmp'))]
    if not files:
        sys.exit(f'{src} 里没找到图片')

    sets = {}
    for f in files:
        stem = os.path.splitext(f)[0]
        stem = re.sub(r'\d{3,4}x\d{3,4}', '', stem)          # 去掉尺寸后缀
        kind, base = classify(stem)
        key = clean(base)
        data, mean, size = encode(os.path.join(src, f))
        rec = sets.setdefault(key, {'key': key, 'cn': key[:8], 'en': key, 'group': 'custom'})
        rec[kind or 'portrait'] = data
        rec['mean'] = mean
        print(f'  {f}  {size[0]}×{size[1]}  →  {key} / {kind or "portrait（未标方向）"}', file=out)

    for r in sets.values():                                   # 缺哪个方向就用另一个顶上
        r.setdefault('portrait', r.get('landscape'))
        r.setdefault('landscape', r.get('portrait'))

    pack = {'version': 1, 'name': os.path.basename(os.path.abspath(src)),
            'sets': list(sets.values())}
    with open(dst, 'w', encoding='utf-8') as fh:
        json.dump(pack, fh, ensure_ascii=False, separators=(',', ':'))

    mb = os.path.getsize(dst) / 1e6
    print(f'\n{dst}  {mb:.2f} MB  {len(sets)} 套', file=out)
    if mb > 8:
        print('⚠️ 包有点大，油猴的存储会吃力。可以调小 QUALITY 或者少放几套。', file=out)
    print('用法：拾句面板 → 纸 → 「＋包」→ 选这个 json，导一次就常驻。', file=out)


if __name__ == '__main__':
    main()
