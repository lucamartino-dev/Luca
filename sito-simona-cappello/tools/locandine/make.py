"""Genera le locandine degli incontri nello stile di quella sul burnout."""
import json, sys
from pathlib import Path

HERE = Path(__file__).parent

ICONS = {
    "flower": '<svg viewBox="0 0 24 24"><path d="M12 2c1.7 0 3 1.6 3 3.5 0 .5-.1 1-.3 1.4.4-.2.9-.3 1.4-.3C18 6.6 19.6 8 19.6 9.6c0 1.2-.8 2.2-1.9 2.6 1.1.4 1.9 1.4 1.9 2.6 0 1.7-1.6 3-3.5 3-.5 0-1-.1-1.4-.3.2.4.3.9.3 1.4 0 1.9-1.3 3.1-3 3.1s-3-1.2-3-3.1c0-.5.1-1 .3-1.4-.4.2-.9.3-1.4.3-1.9 0-3.5-1.3-3.5-3 0-1.2.8-2.2 1.9-2.6-1.1-.4-1.9-1.4-1.9-2.6C4.4 8 6 6.6 7.9 6.6c.5 0 1 .1 1.4.3-.2-.4-.3-.9-.3-1.4C9 3.6 10.3 2 12 2z"/></svg>',
    "peak": '<svg viewBox="0 0 24 24"><path d="M2 21l6.5-12 3 5 3.5-9L22 21z"/></svg>',
    "heart": '<svg viewBox="0 0 24 24"><path d="M12 21s-8-5.3-8-11.2C4 6.6 6.4 4.5 9 4.5c1.3 0 2.4.6 3 1.6.6-1 1.7-1.6 3-1.6 2.6 0 5 2.1 5 5.3C20 15.7 12 21 12 21z"/></svg>',
}

TEMPLATE = """<!doctype html><html lang="it"><head><meta charset="utf-8">
<link rel="stylesheet" href="fonts-local.css">
<style>
*{{box-sizing:border-box;margin:0;padding:0}}
body{{width:939px;height:1331px;background:#fff;font-family:Montserrat,sans-serif;color:#3a3a3a;overflow:hidden}}
.photo{{position:absolute;inset:0 0 auto 0;height:600px;background:{photo_bg};background-size:cover;background-position:{photo_pos}}}
.photo .ph{{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-size:28px;letter-spacing:.1em;opacity:.8}}
.tear{{position:absolute;top:540px;left:0;width:939px;height:90px}}
.badge{{position:absolute;top:22px;right:30px;width:300px;text-align:center}}
.scallop{{width:210px;height:210px;margin:0 auto;background:#fff;clip-path:polygon({scallop});display:flex;align-items:center;justify-content:center}}
.scallop img{{width:178px;height:178px;border-radius:50%;object-fit:cover;object-position:58% 28%}}
.label{{margin-top:-14px;background:#fff;border-radius:60px;padding:12px 14px 14px;position:relative}}
.label b{{display:block;white-space:nowrap;font-weight:800;font-size:15px;letter-spacing:.02em}}
.label span{{display:block;font-size:12.5px;font-weight:500;line-height:1.35;margin-top:3px}}
.tag{{position:absolute;top:640px;left:0;right:0;text-align:center;font-size:21px;font-weight:500;letter-spacing:.02em;line-height:1.45;text-transform:uppercase;padding:0 120px}}
.title{{position:absolute;top:735px;left:0;right:0;text-align:center;font-family:'Great Vibes',cursive;color:#2f2f2f;line-height:1}}
.title .l1{{font-size:{size1}px;display:block}}
.title .l2{{font-size:{size2}px;display:block;margin-top:24px}}
.brush{{position:absolute;top:{brush_top}px;left:50%;transform:translateX(-50%);width:420px;height:16px;border-radius:8px;background:#4f8d8f;opacity:.85}}
.cols{{position:absolute;top:985px;left:70px;right:70px;display:grid;grid-template-columns:1fr 1fr 1fr}}
.col{{text-align:center;padding:0 24px}}
.col+.col{{border-left:1.5px solid #9a9a9a}}
.col svg{{width:34px;height:34px;fill:#4f8d8f;margin-bottom:12px}}
.col h3{{font-size:17px;font-weight:800;text-transform:uppercase;line-height:1.3;margin-bottom:12px}}
.col p{{font-size:14px;line-height:1.5}}
.foot{{position:absolute;left:0;right:0;bottom:0;height:78px;background:#4f8d8f;color:#fff;display:flex;align-items:center;justify-content:center;gap:34px;font-size:17px;font-weight:600;letter-spacing:.02em}}
</style></head><body>
<div class="photo">{placeholder}</div>
<svg class="tear" viewBox="0 0 939 90" preserveAspectRatio="none"><path fill="#fff" d="M0 48 C40 30 70 60 110 44 S170 20 210 40 S280 70 320 46 S380 22 430 38 S500 64 540 42 S600 18 650 36 S720 62 760 40 S830 22 870 44 S920 52 939 36 L939 90 L0 90 Z"/></svg>
<div class="badge"><div class="scallop"><img src="simona-cappello.jpg" alt=""></div>
<div class="label"><b>DOTT.SSA SIMONA CAPPELLO</b><span>{role}</span></div></div>
<p class="tag">{tagline}</p>
<div class="title"><span class="l1">{title1}</span><span class="l2">{title2}</span></div>
<div class="brush"></div>
<div class="cols">{cols}</div>
<div class="foot"><span>Info e prenotazioni</span><span>347 051 5781</span><span>simonacappello@gmail.com</span></div>
</body></html>"""


def scallop(n=22, r1=50, r2=46):
    import math
    pts = []
    for i in range(n * 2):
        a = math.pi * i / n
        r = r1 if i % 2 == 0 else r2
        pts.append(f"{50 + r * math.cos(a):.2f}% {50 + r * math.sin(a):.2f}%")
    return ",".join(pts)


def build(p):
    cols = "".join(
        f'<div class="col">{ICONS[ic]}<h3>{h}</h3><p>{t}</p></div>' for ic, h, t in p["cols"]
    )
    photo = p.get("photo")
    html = TEMPLATE.format(
        photo_bg=f"url('{photo}')" if photo else "linear-gradient(135deg,#8aa49a,#c9b8a3)",
        photo_pos=p.get("photo_pos", "center"),
        placeholder="" if photo else '<div class="ph">FOTO DA INSERIRE</div>',
        scallop=scallop(),
        role=p.get("role", "PSICOLOGA, INGEGNERE E<br>COACH PROFESSIONISTA"),
        tagline=p["tagline"],
        title1=p["title1"],
        title2=p["title2"],
        size1=p.get("size1", 92),
        size2=p.get("size2", 84),
        brush_top=p.get("brush_top", 820),
        cols=cols,
    )
    out = HERE / f"{p['slug']}.html"
    out.write_text(html, encoding="utf-8")
    return out


if __name__ == "__main__":
    for p in json.loads((HERE / "posters.json").read_text(encoding="utf-8")):
        print(build(p))
