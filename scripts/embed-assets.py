"""Refresh the self-contained RPG theme in index.html from assets/."""
from pathlib import Path
import base64
import re

root = Path(__file__).resolve().parent.parent
css = (root / 'assets/rpg-theme.css').read_text(encoding='utf-8')
sky_data = base64.b64encode((root / 'assets/sky-realm.png').read_bytes()).decode('ascii')
css = css.replace("url('sky-realm.png')", 'var(--realm-sky)')
for filename in ['realm-enemies.png']:
    data = base64.b64encode((root / 'assets' / filename).read_bytes()).decode('ascii')
    # Use direct URLs: large CSS custom-property values exceed browser limits.
    css = css.replace(f"url('{filename}')", f'url("data:image/png;base64,{data}")')
theme = '<style id="rpg-theme">\n' + css + '\n</style>'
index = root / 'index.html'
html = index.read_text(encoding='utf-8')
pattern = r'<style id="rpg-theme">[\s\S]*?</style>|<link rel="stylesheet" href="assets/rpg-theme.css">'
html, count = re.subn(pattern, lambda _: theme, html)
assert count == 1, 'Expected exactly one RPG theme to replace'
background_script = '''<script id="realm-background">
(function(){
  var raw=atob('%s'),bytes=new Uint8Array(raw.length);
  for(var i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
  var url=URL.createObjectURL(new Blob([bytes],{type:'image/png'}));
  document.documentElement.style.setProperty('--realm-sky','url("'+url+'")');
})();
</script>''' % sky_data
background_pattern = r'<script id="realm-background">[\s\S]*?</script>'
if re.search(background_pattern, html):
    html = re.sub(background_pattern, lambda _: background_script, html)
else:
    html = html.replace('</head>', background_script + '\n</head>')
index.write_text(html, encoding='utf-8', newline='\n')
print('Embedded RPG background, enemies and CSS in index.html.')
