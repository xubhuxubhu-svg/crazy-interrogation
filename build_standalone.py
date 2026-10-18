# 產生單一檔案的單人版（不含連線功能），可直接預覽或放到任何網站
import re,io
src=open('public/index.html',encoding='utf8').read()
head=re.search(r'<head>(.*)</head>',src,re.S).group(1)
head=re.sub(r'<meta charset[^>]*>\s*|<meta name="viewport"[^>]*>\s*','',head)
body=re.search(r'<body>(.*)</body>',src,re.S).group(1)
body=body.replace('<script src="socket.io/socket.io.js"></script>\n','')
for f in ['engine.js','render.js','music.js','app.js']:
    js=open('public/'+f,encoding='utf8').read()
    body=body.replace(f'<script src="{f}"></script>','<script>\n'+js+'\n</script>')
open('dist/standalone.html','w',encoding='utf8').write(head.strip()+'\n'+body.strip()+'\n')
