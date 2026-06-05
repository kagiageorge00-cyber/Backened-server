import os, re, glob
root = os.getcwd()
assets = {os.path.normpath(p).replace('\\','/') for p in glob.glob('assets/images/**/*', recursive=True) if os.path.isfile(p)}
refs = set()
for dirpath, _, files in os.walk('lib'):
    for fn in files:
        if fn.endswith('.dart'):
            with open(os.path.join(dirpath, fn), 'r', encoding='utf-8') as f:
                for line in f:
                    refs.update(re.findall(r"['\"](assets/images/[A-Za-z0-9_./-]+)['\"]", line))
miss = sorted([r for r in refs if os.path.normpath(os.path.join(root, r)).replace('\\','/') not in assets])
print('missing count', len(miss))
for m in miss:
    print(m)
