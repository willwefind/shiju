# -*- coding: utf-8 -*-
"""
公开前的脱敏闸：扫一遍全仓，看有没有不该出去的东西。

    python tools/check-public.py

有命中就非零退出。发布前跑一次，改了敏感行也要跑一次
（改字符串绕过规则、规则却没跟着改 —— 这个坑真的会咬人）。
"""
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP_DIRS = {'.git', 'node_modules'}
BIN_EXT = {'.ttf', '.otf', '.woff', '.woff2', '.png', '.jpg', '.jpeg', '.webp', '.zip', '.pdf'}

# 本来就该在仓里的「大东西」。闸报警必须是真问题 —— 只要有一次是误报，
# 人就开始整条无视它，那这道闸等于没有。
ALLOW = {'papers/letterpaper-20sets.pack.json'}

# 绝不能出现在公开仓里的东西
FORBIDDEN = [
    (r'[A-Za-z]:\\\\?(Users|CielApps|shiju|mufy)', '本机绝对路径'),
    (r'C:\\\\?Users\\\\?[A-Za-z0-9_]+', '本机用户目录'),
    (r'ciel-gamma|ciel-backend|ombre-brain|Ciel-Shared-State', '私人服务地址'),
    (r'(?i)(api[_-]?key|secret|token|password)\s*[:=]\s*["\'][A-Za-z0-9_\-]{16,}', '疑似凭证'),
    (r'onrender\.com|supabase\.co', '私人后端域名'),
    (r'小屋美化|悬案总账|定影信|晨报', '私人项目名'),
]

# 需要人来判断的（不自动拦，但要看见）
REVIEW = [
    (r'半边心', '这是她另一个私人项目的名字，出现在标语里'),
    (r'\bCiel\b', '私人 AI 伴侣的名字'),
    (r'\bDawn\b', '她的署名'),
    (r'定影', '私人栏目名'),
]


SELF = os.path.abspath(__file__)


def all_files():
    """全仓的文件。⚠️ .git 一定要跳 —— 它的 pack 文件轻易过 5MB，会把体积闸打成误报。"""
    for base, dirs, names in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for n in names:
            yield os.path.join(base, n)


def files():
    for p in all_files():
        # 规则表里本来就写着那些词，扫自己必然自咬
        if os.path.abspath(p) == SELF:
            continue
        if os.path.splitext(p)[1].lower() in BIN_EXT:
            continue
        yield p


def scan(rules):
    hits = []
    for p in files():
        try:
            text = open(p, encoding='utf-8').read()
        except Exception:
            continue
        for i, line in enumerate(text.splitlines(), 1):
            for pat, why in rules:
                if re.search(pat, line):
                    hits.append((os.path.relpath(p, ROOT), i, why, line.strip()[:90]))
    return hits


def main():
    out = os.fdopen(1, 'w', encoding='utf-8', closefd=False)
    bad = scan(FORBIDDEN)
    ask = scan(REVIEW)

    if bad:
        print('🔴 不能公开的内容：', file=out)
        for f, i, why, line in bad:
            print(f'   {f}:{i}  [{why}]  {line}', file=out)
    else:
        print('✅ 禁项零命中', file=out)

    if ask:
        print('\n🟡 要你自己看一眼的（不自动拦）：', file=out)
        seen = set()
        for f, i, why, line in ask:
            k = (f, why)
            if k in seen:
                continue
            seen.add(k)
            print(f'   {f}:{i}  [{why}]  {line}', file=out)

    # 素材包和大字体绝不能混进来 —— 除了 ALLOW 里那几个本来就该在的
    strays = [r for r in (os.path.relpath(p, ROOT).replace('\\', '/') for p in all_files()
                          if p.endswith('.pack.json') or os.path.getsize(p) > 5_000_000)
              if r not in ALLOW]
    if strays:
        print('\n🔴 体积超 5MB 或是素材包的文件：', file=out)
        for s in strays:
            print(f'   {s}', file=out)

    sys.exit(1 if (bad or strays) else 0)


if __name__ == '__main__':
    main()
