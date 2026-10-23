"""Locandine nel nuovo stile: domanda grande, disegno, edizioni, prossimo gruppo, QR e contatti."""
import json
import urllib.parse
from pathlib import Path

import segno

HERE = Path(__file__).parent
WA = "393470515781"

PHONE_ICON = '<svg viewBox="0 0 24 24"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z"/></svg>'
MAIL_ICON = '<svg viewBox="0 0 24 24"><path d="M4 5h16c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V7c0-1.1.9-2 2-2zm8 7 8-5H4l8 5zm0 2L4 9v8h16V9l-8 5z"/></svg>'

# Disegni semplici, uno per tema. {a} {b} {c} {l} {d} sono i colori della palette.
ART = {
    "knot": '<path d="M20 300 C80 300 70 200 130 210 S200 330 150 330 S90 230 160 180 S260 230 210 290 S120 280 170 140 S290 120 260 220 S300 300 360 300" fill="none" stroke="{l}" stroke-width="14" stroke-linecap="round"/><circle cx="360" cy="300" r="16" fill="{c}"/>',
    "faces": ''.join(
        f'<g transform="translate({x} {y})"><circle r="62" fill="{col}"/><circle cx="-20" cy="-12" r="7" fill="{{d}}"/><circle cx="20" cy="-12" r="7" fill="{{d}}"/><path d="{m}" fill="none" stroke="{{d}}" stroke-width="7" stroke-linecap="round"/></g>'
        for x, y, col, m in [
            (110, 110, "{c}", "M-24 16 Q0 38 24 16"),
            (260, 110, "{b}", "M-24 26 Q0 6 24 26"),
            (110, 260, "{l}", "M-22 20 L22 20"),
            (260, 260, "#B9A6E6", "M-24 12 Q0 40 24 12"),
        ]
    ),
    "bowl": '<path d="M40 200 h300 c0 90-70 140-150 140 S40 290 40 200z" fill="{l}"/><rect x="30" y="186" width="320" height="22" rx="11" fill="{c}"/><rect x="250" y="40" width="20" height="170" rx="10" fill="{l}" transform="rotate(25 260 125)"/><ellipse cx="292" cy="58" rx="28" ry="40" fill="{l}" transform="rotate(25 292 58)"/><path d="M190 300c-30-20-36-36-26-48 8-9 20-7 26 2 6-9 18-11 26-2 10 12 4 28-26 48z" fill="{c}"/>',
    "clock": '<circle cx="190" cy="190" r="150" fill="{l}" stroke="{d}" stroke-width="14"/><path d="M190 190V95M190 190l70 45" stroke="{d}" stroke-width="16" stroke-linecap="round"/><circle cx="190" cy="190" r="14" fill="{c}"/>'
    + ''.join(f'<rect x="184" y="52" width="12" height="26" rx="6" fill="{{d}}" transform="rotate({r} 190 190)"/>' for r in range(0, 360, 30)),
    "onesie": '<path d="M120 60 h140 l70 60 -40 50 -30-20 V310 l-40 44 h-32 q-8-40-28-40 q-20 0-28 40 h-32 l-40-44 V170 l-30 20 -40-50z" fill="{l}"/><circle cx="170" cy="335" r="5" fill="{c}"/><circle cx="210" cy="335" r="5" fill="{c}"/><path d="M160 60c0 26 60 26 60 0" fill="none" stroke="{c}" stroke-width="10"/><path d="M190 250c-34-22-40-40-29-53 9-10 22-8 29 2 7-10 20-12 29-2 11 13 5 31-29 53z" fill="{c}"/>',
    "bubbles": '<path d="M30 60h220a30 30 0 0 1 30 30v100a30 30 0 0 1-30 30H120l-50 44v-44H60a30 30 0 0 1-30-30V90a30 30 0 0 1 30-30z" fill="{l}"/><path d="M160 200h170a30 30 0 0 1 30 30v80a30 30 0 0 1-30 30h-10v40l-46-40H160a30 30 0 0 1-30-30v-80a30 30 0 0 1 30-30z" fill="{c}"/><circle cx="100" cy="140" r="12" fill="{d}"/><circle cx="150" cy="140" r="12" fill="{d}"/><circle cx="200" cy="140" r="12" fill="{d}"/>',
    "sprout": '<rect x="70" y="300" width="240" height="60" rx="18" fill="{c}"/><path d="M190 300V120" stroke="{l}" stroke-width="16" stroke-linecap="round"/><path d="M190 200c-70 0-110-40-110-100 70 0 110 40 110 100z" fill="{l}"/><path d="M190 160c60 0 100-34 100-90-60 0-100 34-100 90z" fill="{b}"/>',
    "phone": '<rect x="95" y="20" width="190" height="340" rx="34" fill="{l}" stroke="{d}" stroke-width="10" transform="rotate(10 190 190)"/><g transform="rotate(10 190 190)"><rect x="163" y="34" width="54" height="8" rx="4" fill="{d}"/>' + ''.join(f'<rect x="{x}" y="{y}" width="44" height="44" rx="12" fill="{col}"/>' for x, y, col in [(125, 70, "{b}"), (190, 70, "{c}"), (125, 130, "#9ad0ec"), (190, 130, "#6fb7b7"), (125, 190, "#f4a6a6"), (190, 190, "{d}")]) + '</g>',
    "signpost": '<rect x="176" y="40" width="28" height="330" rx="10" fill="{l}"/><path d="M60 80h200l50 40-50 40H60z" fill="{c}"/><path d="M320 190H120l-50 40 50 40h200z" fill="{b}"/><rect x="120" y="360" width="140" height="20" rx="10" fill="{l}"/>',
}


def qr(slug, nome, dark):
    msg = f"Ciao Simona, vorrei informazioni sull'incontro {nome}"
    url = f"https://wa.me/{WA}?text={urllib.parse.quote(msg)}"
    path = HERE / f"qr-{slug}.svg"
    segno.make(url, error="m").save(str(path), scale=8, border=1, dark=dark)
    return path.name


def build(p):
    a, b, c, l, d = (p["palette"][k] for k in ("bg", "blob1", "blob2", "light", "dark"))
    art = ART[p["art"]].replace("{{d}}", "{d}").format(a=a, b=b, c=c, l=l, d=d)
    dates = p.get("dates") or ["[data]", "[data]", "[data]"]
    place = p.get("place", "[luogo]")
    qr_file = qr(p["slug"], p["nome"], d)
    html = f"""<!doctype html><html lang="it"><head><meta charset="utf-8"><link rel="stylesheet" href="fonts-local.css">
<style>
*{{box-sizing:border-box;margin:0;padding:0}}
body{{width:939px;height:1331px;overflow:hidden;font-family:Montserrat,sans-serif;background:{a};color:#fff;position:relative}}
.blob{{position:absolute;border-radius:50%}}
.b1{{width:520px;height:520px;background:{b};right:-160px;top:-150px}}
.b2{{width:300px;height:300px;background:{c};left:-110px;top:470px;opacity:.9}}
.b3{{width:180px;height:180px;background:{l};right:80px;top:560px;opacity:.55}}
.art{{position:absolute;right:70px;top:110px;width:330px;height:330px;filter:drop-shadow(0 18px 28px rgba(0,0,0,.22))}}
.badge{{position:absolute;left:60px;top:60px;display:flex;align-items:center;gap:16px;background:#fffaf2;color:{d};border-radius:60px;padding:10px 26px 10px 10px}}
.badge img{{width:74px;height:74px;border-radius:50%;object-fit:cover;object-position:58% 28%}}
.badge b{{display:block;font-size:16px;font-weight:800}}.badge span{{font-size:13px;font-weight:500}}
.q{{position:absolute;left:60px;top:220px;width:{p.get("qwidth", 520)}px;font-family:Fredoka,sans-serif;font-weight:700;font-size:{p.get("qsize", 60)}px;line-height:1.08}}
.q em{{font-style:normal;color:{p["palette"].get("em", c)}}}
.title{{position:absolute;left:60px;top:{p.get("ttop", 700)}px;right:60px;background:#fffaf2;color:{d};border-radius:28px;padding:34px 40px}}
.title small{{display:block;font-size:16px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:{p["palette"].get("label", b)}}}
.title h1{{font-family:Fredoka,sans-serif;font-weight:700;font-size:{p.get("tsize", 54)}px;line-height:1.05;margin-top:8px}}
.title p{{font-size:18px;line-height:1.45;margin-top:10px;color:#4a4a4a}}
.bul{{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:16px;padding-top:14px;border-top:1.5px dashed {p["palette"].get("label", b)}55}}
.bul span{{font-size:15px;font-weight:700;line-height:1.35;padding-left:26px;position:relative;color:{d}}}
.bul span::before{{content:"";position:absolute;left:0;top:2px;width:17px;height:17px;border-radius:50%;background:{b}}}
.bul span::after{{content:"";position:absolute;left:5px;top:6px;width:6px;height:3px;border-left:2.5px solid #fff;border-bottom:2.5px solid #fff;transform:rotate(-45deg)}}
.notes{{position:absolute;left:60px;top:{p.get("ntop", 480)}px;width:600px;height:190px}}
.note{{position:absolute;background:#fffaf2;color:{d};font-family:Caveat,cursive;font-weight:700;font-size:29px;line-height:1.1;padding:12px 20px 14px;border-radius:6px;box-shadow:0 10px 22px rgba(0,0,0,.2);white-space:nowrap}}
.note::before{{content:"";position:absolute;top:-9px;left:50%;width:62px;height:18px;margin-left:-31px;background:{c};opacity:.75;transform:rotate(-3deg)}}
.n1{{left:0;top:6px;transform:rotate(-4deg)}}.n2{{left:250px;top:66px;transform:rotate(3deg)}}.n3{{left:40px;top:122px;transform:rotate(-1.5deg)}}
.info2{{position:absolute;left:60px;right:60px;top:1030px;display:grid;grid-template-columns:1fr 170px;gap:16px;height:168px}}
.info2>div{{border-radius:20px;padding:20px 26px}}
.info2 b{{display:block;font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:{p["palette"].get("em", c)};line-height:1.35}}
.past{{background:rgba(255,255,255,.13)}}
.past ul{{list-style:none;margin-top:8px;display:grid;gap:5px}}.past ul.two{{grid-template-columns:1fr 1fr;gap:6px 10px}}
.place{{display:block;font-style:normal;font-size:14px;font-weight:600;margin-top:3px;opacity:.9}}
.past li{{white-space:nowrap;font-size:15px;font-weight:700;padding-left:18px;position:relative}}
.past li::before{{content:"";position:absolute;left:0;top:6px;width:10px;height:10px;border-radius:50%;background:{l}}}
.next{{background:{b}}}
.next b{{color:#fffaf2}}
.next .big{{display:block;font-family:Fredoka,sans-serif;font-weight:700;font-size:38px;margin:6px 0 8px}}
.next span{{display:block;font-size:18px;font-weight:600;line-height:1.4}}
.info2 .qr{{background:#fffaf2;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:12px}}
.info2 .qr img{{width:108px;height:108px}}.info2 .qr span{{color:{d};font-size:12px;font-weight:700;margin-top:4px;text-align:center}}
.foot{{position:absolute;left:60px;right:60px;bottom:30px;background:#fffaf2;color:{d};border-radius:22px;padding:16px 26px;display:flex;align-items:center;justify-content:space-between;gap:20px}}
.foot .lab{{font-size:13px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:{p["palette"].get("label", b)}}}
.foot .it{{display:flex;align-items:center;gap:12px}}
.foot svg{{width:30px;height:30px;fill:{d};flex:none}}
.foot small{{display:block;font-size:12px;font-weight:600;color:#7a8a90}}
.foot strong{{display:block;font-size:21px;font-weight:800;line-height:1.2}}
.count{{display:block;font-family:Fredoka,sans-serif;font-weight:700;font-size:26px;margin:4px 0 2px}}.count strong{{font-size:58px;line-height:1;color:{p["palette"].get("em", c)};margin-right:6px}}
</style></head><body>
<div class="blob b1"></div>
<svg class="art" viewBox="0 0 380 380">{art}</svg>
<div class="badge"><img src="simona-cappello.jpg" alt=""><div><b>Dott.ssa Simona Cappello</b><span>Psicologa e coach</span></div></div>
<p class="q">{p["question"]}</p>
<div class="notes">{"".join(f'<span class="note n{i+1}">{t}</span>' for i, t in enumerate(p.get("thoughts", [])))}</div>
<div class="title"><small>{p["label"]}</small><h1>{p["title"]}</h1><p>{p["text"]}</p><div class="bul">{"".join(f"<span>{x}</span>" for x in p.get("bullets", []))}</div></div>
<div class="info2">
<div class="next"><b>Prossimi incontri</b><span class="big">Nuovi gruppi in formazione</span><span>Posti limitati. Vuoi farne parte? Per date, costi, orari e luogo inquadra il QR e scrivimi.</span></div>
<div class="qr"><img src="{qr_file}" alt=""><span>Iscriviti<br>su WhatsApp</span></div>
</div>
<div class="foot"><span class="lab">Contatti</span><span class="it">{PHONE_ICON}<span><small>Telefono e WhatsApp</small><strong>347 051 5781</strong></span></span><span class="it">{MAIL_ICON}<span><small>Email</small><strong>simonacappello@gmail.com</strong></span></span></div>
</body></html>"""
    out = HERE / f"alt-{p['slug']}.html"
    out.write_text(html, encoding="utf-8")
    return p["slug"]


if __name__ == "__main__":
    for p in json.loads((HERE / "alt-posters.json").read_text(encoding="utf-8")):
        print("alt-" + build(p))
