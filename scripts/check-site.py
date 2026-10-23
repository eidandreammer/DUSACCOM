from html.parser import HTMLParser
from pathlib import Path
import json, re
class SiteParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids=[];self.refs=[];self.assets=[];self.headings=[];self.errors=[];self.json_ld=[];self.in_json=False
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if 'id' in a:self.ids.append(a['id'])
        if tag=='img' and (not a.get('alt') or not a.get('width') or not a.get('height')):self.errors.append('Image needs alt, width and height')
        if tag=='input' and a.get('type')!='hidden' and not a.get('name'):self.errors.append('Unnamed input')
        for key in ['aria-describedby','aria-labelledby','aria-controls']:
            if key in a:self.refs.extend(a[key].split())
        href=a.get('href','')
        if href.startswith('#') and href!='#':self.refs.append(href[1:])
        for key in ['src','href']:
            if a.get(key,'').startswith('/') and not a[key].startswith('//'):self.assets.append(a[key])
        if tag in ['h1','h2','h3']:self.headings.append(tag)
        if tag=='script' and a.get('type')=='application/ld+json':self.in_json=True
    def handle_data(self,data):
        if self.in_json:self.json_ld.append(data)
    def handle_endtag(self,tag):
        if tag=='script':self.in_json=False
root=Path(__file__).resolve().parents[1]/'dist'
parser=SiteParser();parser.feed((root/'index.html').read_text())
assert not parser.errors,parser.errors
assert len(parser.ids)==len(set(parser.ids)),'Duplicate element IDs'
assert all(ref in parser.ids for ref in parser.refs),[ref for ref in parser.refs if ref not in parser.ids]
assert parser.headings.count('h1')==1,'Expected one main heading'
for asset in parser.assets:
    p=root/asset.lstrip('/')
    assert p.exists(),f'Missing local asset: {asset}'
for schema in parser.json_ld:json.loads(schema)
assert (root/'privacy/index.html').exists() and (root/'terms/index.html').exists()
size=sum(p.stat().st_size for p in root.rglob('*') if p.is_file())
print(f'PASS: semantic references, local links, image metadata, structured data, legal routes. Total static payload: {size/1024:.0f} KB.')
