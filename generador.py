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
def grano(im, fuerza=18):
    random.seed(7)
    n = Image.effect_noise((W, H), fuerza).convert("RGB")
    return ImageChops.overlay(im, Image.blend(Image.new("RGB", (W, H), (128, 128, 128)), n, 0.5))


def radial(centro_col, borde_col, cx=0.5, cy=0.42, r=0.95):
    g = Image.radial_gradient("L").resize((int(W * 2 * r), int(W * 2 * r)))
    m = Image.new("L", (W, H), 255)
    m.paste(g, (int(W * cx - g.width / 2), int(H * cy - g.height / 2)))
    return Image.composite(Image.new("RGB", (W, H), borde_col), Image.new("RGB", (W, H), centro_col), m)


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
    f = mont(24, "SemiBold")
    d.text((60, H - 70), HANDLE, font=f, fill=col)
    # puntos de progreso
    x = W - 60 - total * 22
    for i in range(total):
        r = 6 if i + 1 == n else 4
        c = col if i + 1 == n else tuple(int(v * 0.5) for v in col)
        d.ellipse((x + i * 22 - r, H - 57 - r, x + i * 22 + r, H - 57 + r), fill=c)


def terminar(base):
    return grano(base.convert("RGB"), 22)


# ---------- láminas ----------
def portada(l1, l2, l3, total):
    b = radial((70, 28, 18), OSCURO, cy=0.62).convert("RGBA")
    d = ImageDraw.Draw(b)
    for k, r in enumerate([520, 420]):
        espiral(d, W / 2, 900, r, (236, 178, 56, 40), 2, 6)
    pastilla(d, 0, 90, "TRAVIANI · SALCHICHA SICILIANA", mont(26, "ExtraBold"), DORADO, OSCURO, centrado=True)
    centrar(d, 170, l1, anton(210), CREMA)
    centrar(d, 400, l2, anton(150), DORADO)
    # abanico de empaques
    angs = [-24, -12, 0, 12, 24]
    orden = [0, 4, 1, 3, 2]
    for i in orden:
        p = empaque(i + 1, 520, -angs[i])
        cx = W / 2 + (i - 2) * 175
        cy = 960 + abs(i - 2) * 40
        pegar_producto(b, p, (int(cx - p.width / 2), int(cy - p.height / 2)),
                       brillo=(236, 150, 60) if i == 2 else None)
    d = ImageDraw.Draw(b)
    pastilla(d, 0, 1195, l3, mont(30, "ExtraBold"), CREMA, OSCURO, centrado=True)
    sticker(b, ["HECHO", "A MANO", "EN CARACAS"], 935, 660, 100, (226, 40, 28), CREMA, -14)
    pie(d, CREMA, 1, total)
    return terminar(b)


def lamina_sabor(nombre, n_sabor, descripcion, ideal, n, total):
    s = SABORES[nombre]
    b = radial(s["color"], s["oscuro"], cy=0.40, r=0.85).convert("RGBA")
    d = ImageDraw.Draw(b)
    espiral(d, W / 2, 520, 560, (255, 255, 255, 28), 3, 7)
    texto_gigante(b, nombre, (255, 255, 255), 55, 170)
    pastilla(ImageDraw.Draw(b), 60, 70, f"SABOR {n_sabor:02d}/05", mont(26, "ExtraBold"), (255, 255, 255), s["oscuro"])
    p = empaque(s["foto"], 700, -8)
    pegar_producto(b, p, ((W - p.width) // 2, 120), brillo=(255, 255, 230))
    # tarjeta inferior
    t = capa()
    td = ImageDraw.Draw(t)
    td.rounded_rectangle((50, 880, W - 50, H - 110), 44, fill=s["oscuro"] + (235,))
    b.alpha_composite(t)
    d = ImageDraw.Draw(b)
    centrar(d, 905, nombre, anton(118), CREMA)
    fd = mont(36, "Medium")
    y = 1062
    for l in envolver(d, descripcion, fd, 860):
        centrar(d, y, l, fd, (235, 225, 210)); y += 48
    pastilla(d, 0, y + 18, "IDEAL PARA  " + ideal.upper(), mont(28, "ExtraBold"), s["color"], (255, 255, 255), centrado=True)
    pie(d, CREMA, n, total)
    return terminar(b)


def lamina_lista(titulo, items, nota, n, total):
    b = radial((58, 30, 20), OSCURO, cy=0.35).convert("RGBA")
    d = ImageDraw.Draw(b)
    texto_gigante(b, "LIMPIA", (236, 178, 56), 22, 40, 330)
    centrar(d, 110, "INGREDIENTES", mont(34, "ExtraBold"), DORADO)
    centrar(d, 160, titulo, anton(150), CREMA)
    y = 430
    for i, it in enumerate(items):
        x = 90 if i % 2 == 0 else 560
        yy = y + (i // 2) * 250
        cl = capa(); ImageDraw.Draw(cl).rounded_rectangle((x, yy, x + 430, yy + 210), 36, fill=(255, 255, 255, 22), outline=DORADO + (255,), width=3)
        b.alpha_composite(cl); d = ImageDraw.Draw(b)
        d.ellipse((x + 30, yy + 30, x + 100, yy + 100), fill=DORADO)
        d.line([(x + 48, yy + 66), (x + 62, yy + 80), (x + 84, yy + 50)], fill=OSCURO, width=8, joint="curve")
        grande, chico = it
        d.text((x + 120, yy + 40), chico, font=mont(26, "ExtraBold"), fill=DORADO)
        d.text((x + 30, yy + 108), grande, font=anton(72), fill=CREMA)
    p = empaque(3, 330, 10)
    pegar_producto(b, p, (W - p.width - 30, 950), brillo=(236, 120, 40))
    d = ImageDraw.Draw(b)
    fn = mont(36, "SemiBold")
    yy = 1000
    for l in envolver(d, nota, fn, 560):
        d.text((90, yy), l, font=fn, fill=CREMA); yy += 50
    pie(d, CREMA, n, total)
    return terminar(b)


def lamina_cta(titulo, lineas, boton, precio, n, total):
    b = radial((250, 196, 80), (196, 118, 20), cy=0.55).convert("RGBA")
    d = ImageDraw.Draw(b)
    espiral(d, W / 2, 800, 620, (255, 255, 255, 45), 3, 7)
    y = 90
    for t in titulo:
        centrar(d, y, t, anton(150), OSCURO); y += 170
    ps = [empaque(k, 430, a) for k, a in [(1, 14), (5, -14), (3, 0)]]
    pos = [(W / 2 - 250, 760), (W / 2 + 250, 760), (W / 2, 720)]
    for p, (cx, cy) in zip(ps, pos):
        pegar_producto(b, p, (int(cx - p.width / 2), int(cy - p.height / 2)), brillo=(255, 240, 200))
    sticker(b, ["SOLO", precio, "1/2 KG"], 905, 640, 115, (226, 40, 28), CREMA, 12)
    d = ImageDraw.Draw(b)
    fb = mont(40, "ExtraBold")
    pastilla(d, 0, 1000, boton, fb, OSCURO, CREMA, pad=40, centrado=True)
    fl = mont(32, "Bold")
    yy = 1110
    for l in lineas:
        centrar(d, yy, l, fl, OSCURO); yy += 46
    pie(d, OSCURO, n, total)
    return terminar(b)
