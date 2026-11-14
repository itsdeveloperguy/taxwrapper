#!/usr/bin/env python3
"""Create a new feature folder with a clean starter page and register it.

Usage:  python3 scripts/new_feature.py <kebab-name> "<Title>"
Example: python3 scripts/new_feature.py gst-rate-finder "GST Rate Finder"

Creates features/<name>/{<name>.html,<name>.css,<name>.js}.
The page reuses the shared header, footer and script order of an existing page
(features/image-resizer), replaces the content with a small placeholder, and adds
the page to TW_PAGES in assets/js/utils.js (use twPage('<name>') to link to it).
Add menu links by hand in the <header> of each page (see README).
"""
import os, re, sys

if len(sys.argv) < 3 or not re.fullmatch(r'[a-z][a-z0-9-]*', sys.argv[1]):
    sys.exit('Usage: new_feature.py <kebab-name> "<Title>"')
n, t = sys.argv[1], sys.argv[2]
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
d = os.path.join(root, 'features', n)
if os.path.exists(d):
    sys.exit('features/%s already exists' % n)

src = open(os.path.join(root, 'features', 'image-resizer', 'image-resizer.html'), encoding='utf-8').read()
a = src.index('<main')
b = src.index('</main>') + len('</main>')
f = src.index('<footer')
main = ('<main id="top">\n<section class="alt %s"><div class="w">\n'
        '<div class="sh"><h2>%s</h2><p>Describe this feature in one line.</p></div>\n'
        '<!-- Put the feature markup here. Use ids prefixed with "%s-". -->\n'
        '</div></section>\n</main>\n\n') % (n, t, n)
html = src[:a] + main + src[f:]
html = re.sub(r'<title>.*?</title>', '<title>%s – Tax Wrapper</title>' % t, html, flags=re.S)
html = html.replace('image-resizer.css', n + '.css').replace('image-resizer.js', n + '.js')
html = html.replace('href="image-resizer.html"', 'href="../image-resizer/image-resizer.html"')  # menu link was relative to the template's own folder
assert 'rz_' not in html, 'resizer markup left behind'

os.makedirs(d)
open(os.path.join(d, n + '.html'), 'w', encoding='utf-8').write(html)
open(os.path.join(d, n + '.css'), 'w', encoding='utf-8').write('/* %s styles. Scope everything under .%s */\n' % (t, n))
open(os.path.join(d, n + '.js'), 'w', encoding='utf-8').write(
    '/* %s. Classic script; shared helpers ($, esc, fmt, snack, twUser...) come from assets/js/utils.js */\n'
    '(function(){\n  "use strict";\n})();\n' % t)

u = os.path.join(root, 'assets', 'js', 'utils.js')
s = open(u, encoding='utf-8').read()
key = "'%s'" % n if '-' in n else n
entry = "%s:'features/%s/%s.html'" % (key, n, n)
if entry not in s:
    s2 = re.sub(r"(var TW_PAGES=\{[^}]*)\}", lambda m: m.group(1) + ',' + entry + '}', s, count=1)
    if s2 == s:
        print('WARNING: could not register in TW_PAGES; add %s by hand' % entry)
    else:
        open(u, 'w', encoding='utf-8').write(s2)
print('Created features/%s/ and registered twPage(%s) in assets/js/utils.js' % (n, key))
print('Next: build the feature, then add a menu link in each page header if needed.')
