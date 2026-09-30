"""Estilo COLLAGE: papel kraft, tiras rasgadas, cinta, pegatinas, notas a mano."""
import random
from estilos import *
import estilos as E
import visual as V

INK = (32, 24, 20)
CREMA = (250, 244, 230)
ROJO = (214, 57, 36)
MOST = (238, 178, 36)
VERDE = (72, 112, 70)
SALVIA = (150, 176, 132)
KRAFT = (203, 168, 124)


def base(col=KRAFT, seed=1):
    im = grano(papel(col, seed), 12, 0.35)
    if tt():  # zona inferior (texto de TikTok encima): palabra fantasma + cinta
        cap = capa_texto(["TRAVIANI"], F("anton", 330), tuple(max(c - 26, 0) for c in col))
        im.paste(cap, ((W - cap.width) // 2, H() - cap.height - 40), cap)
    return im


def tira(im, txt, cx, cy, size, fondo=CREMA, tinta_c=INK, ang=0, maxw=900, seed=0, amp=8, padx=44, pady=22, align="center", fuente="anton"):
    f, ls, s = ajustar(txt, fuente, maxw - 2 * padx, 700, size, 26, 1.04)
    capa = capa_texto(ls, f, tinta_c, align, int(s * 1.04))
    w, h = capa.width + padx * 2, capa.height + pady * 2
    st = rasgado(w, h, fondo, seed, amp=amp)
    st.paste(capa, (14 + padx, 14 + pady), capa)
    st = sombra_suave(st, 9, 85, 7)
    pegar(im, st, cx, cy, ang)
    return (cx - w // 2, cy - h // 2, cx + w // 2, cy + h // 2)


def bloque(im, cx, cy, w, h, col, ang=0, seed=0, amp=16):
    b = rasgado(int(w), int(h), col, seed, amp=amp, lados="tblr", gb=9)
    b = sombra_suave(b, 12, 80, 9)
    pegar(im, b, cx, cy, ang)


def titulo_tiras(im, lineas, x0, y0, size, colores, angs=None, maxw=900, centro=False):
    y = y0
    bb = None
    for i, (l, (fondo, tinta_c)) in enumerate(zip(lineas, colores)):
        ang = (angs[i] if angs else (-2 if i % 2 == 0 else 1.6))
        f = F("anton", size)
        w = int(f.getlength(l)) + 88
        cx = mx(0.5) if centro else x0 + w // 2 + (i % 2) * 26
        h = int(size * 1.06) + 44
        bb = tira(im, l, cx, y + h // 2, size, fondo, tinta_c, ang, maxw=maxw, seed=i + 3)
        y = bb[3] - 8
    return bb[3]


def tarjeta(im, txt, cx, y, w, size=46, fuente="montm", fondo=CREMA, tinta_c=INK, ang=0, pad=40, seed=0, cintas=True,
            maxh=None, inter=1.3, cinta_c=(250, 224, 130)):
    f, ls, s = ajustar(txt, fuente, w - 2 * pad, (maxh or 2000) - 2 * pad, size, 26, inter)
    capa = capa_texto(ls, f, tinta_c, "left", int(s * inter))
    h = capa.height + 2 * pad
    card = rasgado(w, h, fondo, seed, amp=6, lados="tb")
    card.paste(capa, (14 + pad, 14 + pad), capa)
    card = sombra_suave(card, 12, 90, 9)
    pegar(im, card, cx, y + h // 2, ang)
    if cintas:
        for sx in (-1, 1):
            c = cinta(150, 44, cinta_c, 28 * sx + ang)
            pegar(im, c, cx + sx * (w // 2 - 34), y + 6, 0)
    return (cx - w // 2, y, cx + w // 2, y + h)


def numero(im, n, cx, cy, r=78, fondo=ROJO, tinta_c=CREMA, ang=-8):
    S = Image.new("RGBA", (r * 2 + 30, r * 2 + 30), (0, 0, 0, 0))
    with AA(S) as aa:
        c = r + 15
        estrella(aa, c, c, r, r * 0.9, 14, fill=fondo)
    capa = capa_texto([str(n)], F("marker", int(r * 1.15)), tinta_c)
    S.paste(capa, ((S.width - capa.width) // 2, (S.height - capa.height) // 2), capa)
    S = sombra_suave(S, 8, 90, 7)
    pegar(im, S, cx, cy, ang)


def _hero(im, spec, cx, cy, alto, ang, maxw=None):
    V.poner_obj(im, spec, cx, cy, alto, ang, 11, maxw=maxw)


def _extras(im, extras, slots, ftop, fh):
    """Coloca iconos en huecos libres. slots: (fx, fy, frac_alto, ang) relativos al área libre."""
    x0, y0, w, h = marco()
    for spec, (fx, fy, fa, ang) in zip(extras or [], slots):
        V.poner_obj(im, spec, x0 + fx * w, ftop + fy * fh, int(fa * h), ang, 9)


def doodles(im, semilla=0, col=INK, n=4):
    r = random.Random(semilla)
    x0, y0, w, h = marco()
    for _ in range(n):
        x = r.randint(x0 + 20, x0 + w - 20); y = r.randint(y0 + 20, y0 + h - 60)
        with AA(im, (x - 30, y - 30, x + 30, y + 30)) as aa:
            chispa(aa, x, y, r.randint(10, 17), col + (170,))


def portada(lineas, sub, hero, extras, sello_txt, total, bg=KRAFT, seed=1, cols=None, bloque_col=MOST, hero_alto=0.56):
    im = base(bg, seed)
    x0, y0, w, h = marco()
    cols = cols or [(CREMA, INK), (ROJO, CREMA), (CREMA, INK), (MOST, INK)]
    size = 124 if not tt() else 116
    # bloque de color + objeto principal
    hy = my(0.66)
    bloque(im, mx(0.58), hy, w * 0.86, h * 0.52, bloque_col, 3, seed + 5)
    _hero(im, hero, mx(0.64), hy, int(h * hero_alto), 5, int(w * 0.66))
    for spec, (fx, fy, fa, ang) in zip(extras or [], [(0.14, 0.86, 0.17, -12), (0.30, 0.66, 0.15, 10), (0.9, 0.93, 0.13, 8)]):
        V.poner_obj(im, spec, mx(fx), my(fy), int(fa * h), ang, 9)
    bt = titulo_tiras(im, lineas, x0 - 6, y0 + 6, size, cols)
    bb = T(im, sub, "caveat", 62, INK, x0 + 6, bt + 22, "lt", maxw=int(w * 0.66), align="left")
    marcador(im, (bb[0], bb[1] + 8, bb[2], bb[3] - 4), (255, 225, 90), 2, 12, 150)
    T(im, sub, "caveat", 62, INK, x0 + 6, bt + 22, "lt", maxw=int(w * 0.66), align="left")
    if sello_txt:
        sello(im, sello_txt, x0 + w - 92, bt + 54, 92, MOST if bloque_col != MOST else ROJO, INK if bloque_col != MOST else CREMA, -12)
    pie_marca(im, INK, 1, total, "flecha")
    return im


def paso(num, titulo, cuerpo, n, total, hero, extras=None, v=0, bg=KRAFT, seed=2, size=80, nota=None, bloque_col=MOST):
    im = base(bg, seed)
    x0, y0, w, h = marco()
    if v == 0:
        if num not in (None, ""):
            numero(im, num, x0 + 82, y0 + 92)
            bb = tira(im, titulo, x0 + 200 + (w - 200) // 2, y0 + 92, size, CREMA, INK, -1.6, maxw=w - 200, seed=n)
        else:
            bb = tira(im, titulo, x0 + w // 2, y0 + 92, size, CREMA, INK, -1.6, maxw=w, seed=n)
        bc = tarjeta(im, cuerpo, mx(0.5), bb[3] + 44, int(w * 0.94), 46, seed=n + 4)
        ftop = bc[3] + 10; fh = y0 + h - 50 - ftop
        bloque(im, mx(0.62), ftop + fh * 0.5, w * 0.8, fh * 0.92, bloque_col, -3, seed + 7)
        _hero(im, hero, mx(0.66), ftop + fh * 0.5, int(min(fh * 1.0, h * 0.58)), 6, int(w * 0.68))
        _extras(im, extras, [(0.13, 0.36, 0.17, -10), (0.22, 0.78, 0.15, 12)], ftop, fh)
        if nota:
            T(im, nota, "caveat", 58, INK, x0 + 8, ftop + fh * 0.98, "lb", maxw=int(w * 0.34), ang=6)
    elif v == 1:
        ch = int(h * 0.46)
        bloque(im, mx(0.42), y0 + ch * 0.52, w * 0.78, ch * 0.98, bloque_col, 2, seed + 7)
        _hero(im, hero, mx(0.42), y0 + ch * 0.52, int(ch * 1.0), -6, int(w * 0.72))
        if num not in (None, ""):
            numero(im, num, x0 + w - 88, y0 + 96, 90, ROJO, CREMA, 8)
        ty = y0 + ch + 34
        bb = tira(im, titulo, mx(0.5), ty + 70, size, ROJO, CREMA, 1.4, maxw=w, seed=n)
        bc = tarjeta(im, cuerpo, mx(0.5), bb[3] + 40, int(w * 0.96), 46, ang=-0.6, seed=n + 4)
        if extras:
            for spec, (fx, fy, fa, ang) in zip(extras, [(0.88, 0.30, 0.15, 10), (0.90, 0.56, 0.12, -8)]):
                V.poner_obj(im, spec, mx(fx), y0 + fy * ch * 1.6, int(fa * h), ang, 9)
    else:
        if num not in (None, ""):
            numero(im, num, x0 + 82, y0 + 88)
        tx = x0 + 190 + (w - 190) // 2 if num not in (None, "") else x0 + w // 2
        bb = tira(im, titulo, tx, y0 + 88, size, CREMA, INK, 1.2, maxw=w - 190 if num not in (None, "") else w, seed=n)
        cw = int(w * 0.56)
        bc = tarjeta(im, cuerpo, x0 + cw // 2, bb[3] + 56, cw, 42, ang=-1.2, seed=n + 5)
        ftop = bb[3] + 30; fh = y0 + h - 50 - ftop
        bloque(im, x0 + w * 0.76, ftop + fh * 0.56, w * 0.52, fh * 0.96, bloque_col, 3, seed + 8)
        _hero(im, hero, x0 + w * 0.76, ftop + fh * 0.52, int(min(fh * 0.92, h * 0.6)), 7, int(w * 0.46))
        _extras(im, extras, [(0.13, 0.84, 0.17, -8), (0.34, 0.92, 0.14, 10)], bc[3], y0 + h - 50 - bc[3])
    doodles(im, n + seed)
    pie_marca(im, INK, n, total, "flecha")
    return im


def lista(titulo, items, n, total, hero=None, extras=None, bg=KRAFT, seed=3, marca="check", bloque_col=MOST, size=64):
    im = base(bg, seed)
    x0, y0, w, h = marco()
    bb = tira(im, titulo, mx(0.5), y0 + 88, 92, ROJO, CREMA, -1.5, maxw=w, seed=n)
    f, ls, s = ajustar("\n".join(items), "caveat", w - 210, int(h * 0.46), size, 34, 1.06)
    alto_item = int(s * 1.45)
    ph = alto_item * len(items) + 80
    pw = int(w * 0.95)
    card = rasgado(pw, ph, (252, 249, 238), seed + n, amp=7, lados="tb")
    d = ImageDraw.Draw(card)
    for i in range(len(items)):
        yy = 14 + 54 + i * alto_item + int(s * 1.08)
        d.line((14 + 40, yy, 14 + pw - 40, yy), fill=(170, 200, 225), width=2)
    card = sombra_suave(card, 12, 90, 9)
    cy = bb[3] + 44 + ph // 2
    pegar(im, card, mx(0.5), cy, -0.8)
    top = cy - ph // 2
    for i, it in enumerate(items):
        yy = top + 14 + 40 + i * alto_item
        cx0 = mx(0.5) - pw // 2 + 14 + 40
        with AA(im, (cx0 - 6, yy - 6, cx0 + 64, yy + 70)) as aa:
            aa.rect((cx0, yy + 6, cx0 + 46, yy + 52), outline=INK + (255,), w=5, r=6)
            if marca == "check":
                aa.line([(cx0 + 8, yy + 28), (cx0 + 20, yy + 44), (cx0 + 56, yy - 4)], ROJO + (255,), 8)
        T(im, it, "caveat", s, INK, cx0 + 78, yy + 2, "lt", maxw=pw - 210)
    for sx in (-1, 1):
        pegar(im, cinta(150, 44, (250, 224, 130), 26 * sx), mx(0.5) + sx * (pw // 2 - 34), top + 12)
    ftop = top + ph + 14
    fh = y0 + h - 50 - ftop
    if hero is not None and fh > 200:
        bloque(im, mx(0.64), ftop + fh * 0.5, w * 0.76, fh * 0.94, bloque_col, -3, seed + 9)
        _hero(im, hero, mx(0.66), ftop + fh * 0.5, int(min(fh * 1.0, h * 0.44)), 6, int(w * 0.62))
        _extras(im, extras, [(0.13, 0.40, 0.16, -10), (0.24, 0.80, 0.14, 12)], ftop, fh)
    doodles(im, n + seed)
    pie_marca(im, INK, n, total, "flecha")
    return im


def frase(lineas, sub, n, total, hero=None, extras=None, bg=KRAFT, seed=5, cols=None, size=132, bloque_col=MOST):
    """Declaración grande en tiras + subtítulo manuscrito + objeto."""
    im = base(bg, seed)
    x0, y0, w, h = marco()
    cols = cols or [(ROJO, CREMA), (CREMA, INK), (CREMA, INK)]
    bt = titulo_tiras(im, lineas, x0, y0 + 10, size, cols, centro=False)
    bb = T(im, sub, "caveat", 64, INK, x0 + 8, bt + 26, "lt", maxw=int(w * 0.94), align="left")
    marcador(im, (bb[0], bb[1] + 8, bb[2], bb[3] - 4), (255, 225, 90), 3, 12, 150)
    T(im, sub, "caveat", 64, INK, x0 + 8, bt + 26, "lt", maxw=int(w * 0.94), align="left")
    ftop = bb[3] + 16
    fh = y0 + h - 50 - ftop
    if hero is not None and fh > 180:
        bloque(im, mx(0.6), ftop + fh * 0.5, w * 0.78, fh * 0.94, bloque_col, 3, seed + 6)
        _hero(im, hero, mx(0.62), ftop + fh * 0.5, int(min(fh * 1.0, h * 0.5)), -5, int(w * 0.7))
        _extras(im, extras, [(0.13, 0.36, 0.17, -10), (0.22, 0.80, 0.15, 12)], ftop, fh)
    doodles(im, n + seed)
    pie_marca(im, INK, n, total, "flecha")
    return im


def cierre(titulo, lineas, boton, objs, total, bg=KRAFT, seed=4, n=None, tcols=None):
    im = base(bg, seed)
    x0, y0, w, h = marco()
    n = n or total
    tl = titulo.split("\n")
    size = 106
    btn_cy = y0 + h - 106
    lines_h = 62 * len(lineas)
    lines_top = btn_cy - 48 - 20 - lines_h
    tit_h = len(tl) * (int(size * 1.06) + 44 - 8) + 8
    tit_top = lines_top - 18 - tit_h
    avail = tit_top - y0 - 6
    k = len(objs)
    fan_h = int(min(avail * 0.98, h * 0.40))
    cyf = y0 + avail // 2 + 10
    bloque(im, mx(0.5), cyf, w * 0.98, avail * 0.96, MOST, -1.5, seed + 3)
    for i, o in enumerate(objs):
        px = mx(0.5) + int((i - (k - 1) / 2) * w * (0.34 if k <= 3 else 0.22))
        ang = (i - (k - 1) / 2) * 10
        V.poner_obj(im, o, px, cyf + abs(i - (k - 1) / 2) * 22, int(fan_h * (0.94 if i % 2 == 0 else 0.86)), ang, 11)
    titulo_tiras(im, tl, x0, tit_top, size, tcols or [(ROJO, CREMA), (CREMA, INK)], [-2, 1.4], maxw=w, centro=True)
    yy = lines_top
    for l in lineas:
        T(im, l, "caveat", 54, INK, mx(0.5), yy, "ct", maxw=w)
        yy += 62
    bw, bh = int(w * 0.94), 96
    btn = Image.new("RGBA", (bw + 14, bh + 14), (0, 0, 0, 0))
    with AA(btn) as aa:
        aa.rect((14, 14, bw + 14, bh + 14), fill=INK + (255,), r=22)
        aa.rect((0, 0, bw, bh), fill=ROJO + (255,), outline=INK + (255,), w=5, r=22)
    T(btn, boton, "anton", 42, CREMA, bw // 2, bh // 2 + 2, "cm", maxw=bw - 40)
    pegar(im, btn, mx(0.5), btn_cy, -1)
    pie_marca(im, INK, n, total, "flecha")
    return im
