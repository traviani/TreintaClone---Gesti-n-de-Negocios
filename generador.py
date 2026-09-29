"""Generador de carruseles Il Siciliano Gourmet / Traviani v2 (1080x1350)."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops
import math, random

W, H = 1080, 1350
FONTS = "/home/claude/fonts"
REC = "/home/claude/fotos/recorte"
CREMA = (250, 243, 228)
OSCURO = (24, 14, 12)
DORADO = (236, 178, 56)
HANDLE = "@ilsicilianogourmet_"

SABORES = {
    "FINOCCHIO":    dict(foto=1, color=(132, 190, 40), oscuro=(22, 52, 10)),
    "TRADIZIONALE": dict(foto=2, color=(228, 40, 120), oscuro=(70, 6, 36)),
    "PEPERONCINO":  dict(foto=3, color=(226, 40, 28), oscuro=(64, 6, 4)),
    "PECORINO":     dict(foto=4, color=(30, 180, 168), oscuro=(4, 52, 50)),
    "PARRILLERA":   dict(foto=5, color=(240, 176, 40), oscuro=(84, 42, 4)),
}


def anton(s):
    return ImageFont.truetype(f"{FONTS}/Anton-Regular.ttf", s)


def mont(s, peso="Bold"):
    f = ImageFont.truetype(f"{FONTS}/Montserrat%5Bwght%5D.ttf", s)
    f.set_variation_by_name(peso)
    return f


# ---------- fondos ----------
# FORMATO: "ig" = 1080x1350 (Instagram 4:5) | "tt" = 1080x1920 (TikTok 9:16)
FORMATO = "ig"
TT_H, TT_OY = 1920, 150   # en TikTok el diseño baja 150 px (zona segura superior)
_fondo = {}


def grano(im, fuerza=18):
    w, h = im.size
    random.seed(7)
    n = Image.effect_noise((w, h), fuerza).convert("RGB")
    return ImageChops.overlay(im, Image.blend(Image.new("RGB", (w, h), (128, 128, 128)), n, 0.5))


def _radial(centro_col, borde_col, cx, cy_px, r, h):
    import numpy as np
    yy, xx = np.mgrid[0:h, 0:W]
    dist = np.sqrt((xx - W * cx) ** 2 + (yy - cy_px) ** 2) / (W * r)
    m = Image.fromarray((np.clip(dist, 0, 1) * 255).astype("uint8"), "L")
    return Image.composite(Image.new("RGB", (W, h), borde_col), Image.new("RGB", (W, h), centro_col), m)


def radial(centro_col, borde_col, cx=0.5, cy=0.42, r=0.95):
    """Devuelve el lienzo de trabajo 1080x1350. En TikTok es transparente y el fondo
    se pinta a pantalla completa en terminar()."""
    return _radial(centro_col, borde_col, cx, H * cy, r, H)


def usar_formato(f):
    """'ig' = 1080x1350 | 'tt' = 1080x1920 con diseño propio para pantalla completa."""
    global FORMATO, H
    FORMATO = f
    H = 1920 if f == "tt" else 1350


def tt():
    return FORMATO == "tt"


def espiral(d, cx, cy, rmax, color, ancho=3, vueltas=5):
    pts = []
    for i in range(0, 360 * vueltas, 4):
        t = math.radians(i)
        r = rmax * i / (360 * vueltas)
        pts.append((cx + r * math.cos(t), cy + r * math.sin(t)))
    d.line(pts, fill=color, width=ancho)


def capa():
    return Image.new("RGBA", (W, H), (0, 0, 0, 0))


# ---------- producto ----------
def empaque(n, alto, angulo=0):
    im = Image.open(f"{REC}/{n}.png").convert("RGBA")
    a = im.split()[3].point(lambda v: 255 if v > 30 else 0)
    im = im.crop(a.getbbox())
    im = im.resize((int(im.width * alto / im.height), alto), Image.LANCZOS)
    return im.rotate(angulo, expand=True, resample=Image.BICUBIC)


def pegar_producto(base, prod, xy, brillo=None):
    x, y = xy
    if brillo:
        g = capa()
        gd = ImageDraw.Draw(g)
        cx, cy = x + prod.width / 2, y + prod.height / 2
        R = max(prod.size) * 0.62
        gd.ellipse((cx - R, cy - R, cx + R, cy + R), fill=brillo + (120,))
        base.alpha_composite(g.filter(ImageFilter.GaussianBlur(90)))
    sh = Image.new("RGBA", prod.size, (0, 0, 0, 0))
    sh.putalpha(prod.split()[3].point(lambda v: int(v * 0.65)))
    s = capa()
    s.paste(sh, (x + 25, y + 45), sh)
    base.alpha_composite(s.filter(ImageFilter.GaussianBlur(28)))
    base.alpha_composite(prod, (x, y))


# ---------- texto ----------
def ancho(d, t, f):
    return d.textlength(t, font=f)


def centrar(d, y, t, f, col, x0=0, x1=W):
    d.text((x0 + (x1 - x0 - ancho(d, t, f)) / 2, y), t, font=f, fill=col)


def envolver(d, texto, f, maxw):
    out, cur = [], ""
    for p in texto.split():
        q = (cur + " " + p).strip()
        if ancho(d, q, f) <= maxw:
            cur = q
        else:
            out.append(cur); cur = p
    out.append(cur)
    return out


def texto_gigante(base, t, col, alpha, y, tam=None):
    f = anton(tam or 400)
    if tam is None:
        d0 = ImageDraw.Draw(base)
        while ancho(d0, t, f) > W * 1.25 and f.size > 120:
            f = anton(f.size - 10)
    c = capa()
    d = ImageDraw.Draw(c)
    centrar(d, y, t, f, col + (alpha,))
    base.alpha_composite(c)


def sticker(base, lineas, cx, cy, r, fondo, tinta, ang=-12):
    s = Image.new("RGBA", (r * 2 + 20, r * 2 + 20), (0, 0, 0, 0))
    d = ImageDraw.Draw(s)
    # borde dentado
    pts = []
    for i in range(48):
        t = math.radians(i * 7.5)
        rr = r if i % 2 == 0 else r * 0.92
        pts.append((r + 10 + rr * math.cos(t), r + 10 + rr * math.sin(t)))
    d.polygon(pts, fill=fondo)
    d.ellipse((10 + r * 0.16, 10 + r * 0.16, 10 + r * 1.84, 10 + r * 1.84), outline=tinta, width=3)
    tams = [int(r * 0.30), int(r * 0.42), int(r * 0.24)]
    total = sum(tams[:len(lineas)]) + 6 * (len(lineas) - 1)
    y = r + 10 - total / 2 - 4
    for i, l in enumerate(lineas):
        f = anton(tams[i]) if i == 1 else mont(tams[i], "ExtraBold")
        centrar(d, y, l, f, tinta, 0, s.width)
        y += tams[i] + 6
    s = s.rotate(ang, expand=True, resample=Image.BICUBIC)
    base.alpha_composite(s, (int(cx - s.width / 2), int(cy - s.height / 2)))


def pastilla(d, x, y, t, f, fondo, tinta, pad=26, centrado=False):
    w = ancho(d, t, f)
    if centrado:
        x = (W - w) / 2 - pad
    d.rounded_rectangle((x, y, x + w + pad * 2, y + f.size + 30), 60, fill=fondo)
    d.text((x + pad, y + 12), t, font=f, fill=tinta)


def pie(d, col, n, total):
    # En TikTok la franja inferior (~380 px) la tapa el texto de la app: el pie sube.
    y = 1500 if tt() else H - 70
    f = mont(26 if tt() else 24, "SemiBold")
    d.text((60, y), HANDLE, font=f, fill=col)
    x = W - 60 - total * 22
    for i in range(total):
        r = 6 if i + 1 == n else 4
        c = col if i + 1 == n else tuple(int(v * 0.5) for v in col)
        d.ellipse((x + i * 22 - r, y + 13 - r, x + i * 22 + r, y + 13 + r), fill=c)


def terminar(base):
    return grano(base.convert("RGB"), 22)


# ---------- láminas ----------
# Zona segura TikTok: arriba 150 px, abajo 400 px, derecha ~130 px (botones).
def portada(l1, l2, l3, total):
    T = tt()
    b = radial((70, 28, 18), OSCURO, cy=0.60 if T else 0.62, r=1.1 if T else 0.95).convert("RGBA")
    d = ImageDraw.Draw(b)
    ecy = 1060 if T else 900
    for r in ([640, 520] if T else [520, 420]):
        espiral(d, W / 2, ecy, r, (236, 178, 56, 40), 2, 6)
    pastilla(d, 0, 170 if T else 90, "TRAVIANI · SALCHICHA SICILIANA", mont(30 if T else 26, "ExtraBold"), DORADO, OSCURO, centrado=True)
    centrar(d, 270 if T else 170, l1, anton(225 if T else 210), CREMA)
    centrar(d, 530 if T else 400, l2, anton(165 if T else 150), DORADO)
    angs = [-24, -12, 0, 12, 24]
    orden = [0, 4, 1, 3, 2]
    alto, paso, cy0, caida = (640, 190, 1130, 50) if T else (520, 175, 960, 40)
    for i in orden:
        p = empaque(i + 1, alto, -angs[i])
        cx = W / 2 + (i - 2) * paso
        cy = cy0 + abs(i - 2) * caida
        pegar_producto(b, p, (int(cx - p.width / 2), int(cy - p.height / 2)),
                       brillo=(236, 150, 60) if i == 2 else None)
    d = ImageDraw.Draw(b)
    pastilla(d, 0, 1420 if T else 1195, l3, mont(36 if T else 30, "ExtraBold"), CREMA, OSCURO, centrado=True)
    if T:
        sticker(b, ["HECHO", "A MANO", "EN CARACAS"], 880, 860, 110, (226, 40, 28), CREMA, -14)
    else:
        sticker(b, ["HECHO", "A MANO", "EN CARACAS"], 935, 660, 100, (226, 40, 28), CREMA, -14)
    if not T:
        pie(d, CREMA, 1, total)
    return terminar(b)


def lamina_sabor(nombre, n_sabor, descripcion, ideal, n, total):
    T = tt()
    s = SABORES[nombre]
    b = radial(s["color"], s["oscuro"], cy=0.34 if T else 0.40, r=1.0 if T else 0.85).convert("RGBA")
    d = ImageDraw.Draw(b)
    espiral(d, W / 2, 660 if T else 520, 640 if T else 560, (255, 255, 255, 28), 3, 7)
    if T:  # nombre gigante apilado en 2 niveles para llenar el alto
        texto_gigante(b, nombre, (255, 255, 255), 50, 230)
        texto_gigante(b, nombre, (255, 255, 255), 25, 720)
    else:
        texto_gigante(b, nombre, (255, 255, 255), 55, 170)
    pastilla(ImageDraw.Draw(b), 60, 170 if T else 70, f"SABOR {n_sabor:02d}/05", mont(30 if T else 26, "ExtraBold"), (255, 255, 255), s["oscuro"])
    p = empaque(s["foto"], 880 if T else 700, -8)
    pegar_producto(b, p, ((W - p.width) // 2, 250 if T else 120), brillo=(255, 255, 230))
    top, bot = (1150, 1470) if T else (880, H - 110)
    t = capa()
    ImageDraw.Draw(t).rounded_rectangle((50, top, W - 50, bot), 44, fill=s["oscuro"] + (235,))
    b.alpha_composite(t)
    d = ImageDraw.Draw(b)
    centrar(d, top + 20, nombre, anton(128 if T else 118), CREMA)
    fd = mont(38 if T else 36, "Medium")
    y = top + (190 if T else 182)
    for l in envolver(d, descripcion, fd, 860):
        centrar(d, y, l, fd, (235, 225, 210)); y += 50
    pastilla(d, 0, y + 18, "IDEAL PARA  " + ideal.upper(), mont(30 if T else 28, "ExtraBold"), s["color"], (255, 255, 255), centrado=True)
    if not T:
        pie(d, CREMA, n, total)
    return terminar(b)


def lamina_lista(titulo, items, nota, n, total):
    T = tt()
    b = radial((58, 30, 20), OSCURO, cy=0.35).convert("RGBA")
    d = ImageDraw.Draw(b)
    texto_gigante(b, "LIMPIA", (236, 178, 56), 22, 140 if T else 40, 330)
    centrar(d, 200 if T else 110, "INGREDIENTES", mont(36 if T else 34, "ExtraBold"), DORADO)
    centrar(d, 260 if T else 160, titulo, anton(135 if T else 150), CREMA)
    # En TikTok: tarjetas en una columna, anchas y altas
    for i, (grande, chico) in enumerate(items):
        if T:
            x, yy, w, h = 70, 520 + i * 200, 700, 170
        else:
            x, yy, w, h = (90 if i % 2 == 0 else 560), 430 + (i // 2) * 250, 430, 210
        cl = capa()
        ImageDraw.Draw(cl).rounded_rectangle((x, yy, x + w, yy + h), 36, fill=(255, 255, 255, 22), outline=DORADO + (255,), width=3)
        b.alpha_composite(cl); d = ImageDraw.Draw(b)
        cy = yy + (h // 2 if T else 65)
        cx0 = x + 30
        d.ellipse((cx0, cy - 35, cx0 + 70, cy + 35), fill=DORADO)
        d.line([(cx0 + 18, cy), (cx0 + 32, cy + 14), (cx0 + 54, cy - 16)], fill=OSCURO, width=8, joint="curve")
        if T:
            d.text((x + 130, yy + 22), chico, font=mont(28, "ExtraBold"), fill=DORADO)
            d.text((x + 130, yy + 58), grande, font=anton(80), fill=CREMA)
        else:
            d.text((x + 120, yy + 40), chico, font=mont(26, "ExtraBold"), fill=DORADO)
            d.text((x + 30, yy + 108), grande, font=anton(72), fill=CREMA)
    if T:
        p = empaque(3, 560, 12)
        pegar_producto(b, p, (W - p.width + 150, 640), brillo=(236, 120, 40))
    else:
        p = empaque(3, 330, 10)
        pegar_producto(b, p, (W - p.width - 30, 950), brillo=(236, 120, 40))
    d = ImageDraw.Draw(b)
    fn = mont(40 if T else 36, "SemiBold")
    yy = 1340 if T else 1000
    for l in envolver(d, nota, fn, 900 if T else 560):
        (centrar(d, yy, l, fn, CREMA) if T else d.text((90, yy), l, font=fn, fill=CREMA)); yy += 54
    if not T:
        pie(d, CREMA, n, total)
    return terminar(b)


def lamina_cta(titulo, lineas, boton, precio, n, total):
    T = tt()
    b = radial((250, 196, 80), (196, 118, 20), cy=0.48 if T else 0.55, r=1.1 if T else 0.95).convert("RGBA")
    d = ImageDraw.Draw(b)
    espiral(d, W / 2, 900 if T else 800, 700 if T else 620, (255, 255, 255, 45), 3, 7)
    y = 180 if T else 90
    for t in titulo:
        centrar(d, y, t, anton(150 if T else 150), OSCURO); y += 180 if T else 170
    alto = 560 if T else 430
    cyl, cyc, dx = (880, 840, 270) if T else (760, 720, 250)
    ps = [empaque(k, alto, a) for k, a in [(1, 14), (5, -14), (3, 0)]]
    pos = [(W / 2 - dx, cyl), (W / 2 + dx, cyl), (W / 2, cyc)]
    for p, (cx, cy) in zip(ps, pos):
        pegar_producto(b, p, (int(cx - p.width / 2), int(cy - p.height / 2)), brillo=(255, 240, 200))
    if T:
        sticker(b, ["SOLO", precio, "1/2 KG"], 870, 700, 120, (226, 40, 28), CREMA, 12)
    else:
        sticker(b, ["SOLO", precio, "1/2 KG"], 905, 640, 115, (226, 40, 28), CREMA, 12)
    d = ImageDraw.Draw(b)
    fb = mont(44 if T else 40, "ExtraBold")
    pastilla(d, 0, 1210 if T else 1000, boton, fb, OSCURO, CREMA, pad=44 if T else 40, centrado=True)
    fl = mont(36 if T else 32, "Bold")
    yy = 1340 if T else 1110
    for l in lineas:
        centrar(d, yy, l, fl, OSCURO); yy += 52 if T else 46
    if not T:
        pie(d, OSCURO, n, total)
    return terminar(b)
