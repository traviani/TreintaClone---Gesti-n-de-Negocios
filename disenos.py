"""Diseños con fotos reales (v4): parrilla generada, portada con espiral, láminas de foto completa,
divididas y circulares. Comparte helpers con generador.py."""
import random, math
from PIL import Image, ImageDraw, ImageFilter, ImageChops
import generador as g
from generador import (W, anton, mont, ancho, centrar, envolver, sticker, pastilla, pie, terminar,
                       espiral, capa, empaque, pegar_producto, CREMA, OSCURO, DORADO, radial)

FOT = "/home/claude/fotos"


def H():
    return g.H


def oy():
    return 150 if g.tt() else 0


# ---------- fotos ----------
def cargar(nombre):
    return Image.open(f"{FOT}/{nombre}").convert("RGB")


def llenar(im, w, h, cx=0.5, cy=0.5):
    """Recorta y escala la foto para cubrir w x h (cx, cy = punto de interés 0-1)."""
    esc = max(w / im.width, h / im.height)
    n = im.resize((int(im.width * esc) + 1, int(im.height * esc) + 1), Image.LANCZOS)
    x = int((n.width - w) * cx)
    y = int((n.height - h) * cy)
    n = n.crop((x, y, x + w, y + h))
    return n.filter(ImageFilter.UnsharpMask(2, 60, 3))


def recorte_foto(im, caja):
    return im.crop(caja)


def degradado_v(w, h, y0, y1, col, a0, a1):
    """Capa RGBA con degradado vertical de alfa entre y0 y y1."""
    import numpy as np
    arr = np.zeros((h, w, 4), dtype="uint8")
    arr[..., 0], arr[..., 1], arr[..., 2] = col
    ys = np.arange(h)
    t = np.clip((ys - y0) / max(1, (y1 - y0)), 0, 1)
    arr[..., 3] = ((a0 + (a1 - a0) * t)[:, None] * np.ones((1, w))).astype("uint8")
    return Image.fromarray(arr, "RGBA")


# ---------- parrilla ----------
def parrilla_bg(h, ang=-14, seed=3, calor=0.75):
    rnd = random.Random(seed)
    big = int((W ** 2 + h ** 2) ** 0.5) + 160
    base = (14, 9, 8)
    glow = Image.new("RGB", (big, big), base)
    gd = ImageDraw.Draw(glow)
    for _ in range(70):
        x, y, r = rnd.randint(0, big), rnd.randint(0, big), rnd.randint(40, 150)
        col = rnd.choice([(255, 110, 20), (240, 70, 10), (255, 165, 40)])
        gd.ellipse((x - r, y - r, x + r, y + r), fill=col)
    glow = glow.filter(ImageFilter.GaussianBlur(45))
    glow = Image.blend(Image.new("RGB", glow.size, base), glow, calor)
    bars = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    bd = ImageDraw.Draw(bars)
    step, bw = 78, 26
    for y in range(0, big, step):
        bd.rectangle((0, y, big, y + bw), fill=(40, 36, 34, 255))
        bd.rectangle((0, y, big, y + 5), fill=(128, 116, 104, 255))
        bd.rectangle((0, y + bw - 7, big, y + bw), fill=(14, 12, 12, 255))
    for x in range(-100, big, 460):
        bd.rectangle((x, 0, x + 24, big), fill=(34, 30, 28, 255))
        bd.rectangle((x, 0, x + 4, big), fill=(96, 88, 80, 255))
    sombra = bars.split()[3].filter(ImageFilter.GaussianBlur(9)).point(lambda v: int(v * 0.6))
    glow = Image.composite(Image.new("RGB", glow.size, (0, 0, 0)), glow, sombra).convert("RGBA")
    glow.alpha_composite(bars)
    rot = glow.rotate(ang, resample=Image.BICUBIC)
    x0, y0 = (big - W) // 2, (big - h) // 2
    return rot.crop((x0, y0, x0 + W, y0 + h))


def humo(b, h, y_ini, y_fin, seed=5, n=9, alfa=34):
    rnd = random.Random(seed)
    c = Image.new("RGBA", (W, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(c)
    for _ in range(n):
        x, y = rnd.randint(-100, W + 100), rnd.randint(y_ini, y_fin)
        rx, ry = rnd.randint(120, 300), rnd.randint(60, 160)
        d.ellipse((x - rx, y - ry, x + rx, y + ry), fill=(235, 225, 215, alfa))
    b.alpha_composite(c.filter(ImageFilter.GaussianBlur(60)))


def viñeta(b, h, fuerza=170):
    import numpy as np
    yy, xx = np.mgrid[0:h, 0:W]
    dist = np.sqrt(((xx - W / 2) / (W * 0.75)) ** 2 + ((yy - h / 2) / (h * 0.7)) ** 2)
    a = (np.clip(dist - 0.45, 0, 1) * fuerza * 1.6).clip(0, fuerza).astype("uint8")
    v = Image.new("RGBA", (W, h), (0, 0, 0, 0))
    v.putalpha(Image.fromarray(a, "L"))
    b.alpha_composite(v)


def espiral_cutout(ancho_px, ang=-6):
    im = Image.open(f"{FOT}/espiral_recorte.png").convert("RGBA")
    a = im.split()[3]
    # quita los palitos finos que sobresalen
    a = a.filter(ImageFilter.MinFilter(7)).filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.GaussianBlur(1.2))
    im.putalpha(a)
    im = im.crop(a.point(lambda v: 255 if v > 40 else 0).getbbox())
    im = im.resize((ancho_px, int(im.height * ancho_px / im.width)), Image.LANCZOS)
    rgb = im.convert("RGB").filter(ImageFilter.UnsharpMask(2, 70, 3))
    rgb.putalpha(im.split()[3])
    return rgb.rotate(ang, expand=True, resample=Image.BICUBIC)


# ---------- láminas ----------
def portada_parrilla(l1, l2, etiqueta, sello, total):
    """Portada: título gigante sobre parrilla con la espiral como protagonista."""
    T, h, o = g.tt(), H(), oy()
    b = parrilla_bg(h, ang=-14 if not T else -12)
    humo(b, h, 0, int(h * 0.3))
    d = ImageDraw.Draw(b)
    # resplandor bajo la salchicha
    cy_s = int(h * (0.615 if T else 0.71))
    glow = capa() if not T else Image.new("RGBA", (W, h), (0, 0, 0, 0))
    glow = Image.new("RGBA", (W, h), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse((60, cy_s - 480, W - 60, cy_s + 480), fill=(255, 110, 20, 140))
    b.alpha_composite(glow.filter(ImageFilter.GaussianBlur(110)))
    sp = espiral_cutout(960 if T else 880)
    pegar_producto(b, sp, (W // 2 - sp.width // 2, cy_s - sp.height // 2))
    viñeta(b, h)
    # oscurece la zona del título para que se lea
    b.alpha_composite(degradado_v(W, h, 0, int(h * 0.36), (10, 6, 5), 190, 0))
    d = ImageDraw.Draw(b)
    pastilla(d, 0, o + (28 if T else 50), etiqueta, mont(30 if T else 27, "ExtraBold"), DORADO, OSCURO, centrado=True)
    tam = 330 if T else 225
    centrar(d, o + (100 if T else 105), l1, anton(tam), CREMA)
    y2 = o + (100 if T else 105) + int(tam * 1.13)
    centrar(d, y2, l2, anton(int(tam * 0.56)), DORADO)
    sticker(b, sello, 890 if T else 905, int(h * (0.79 if T else 0.78)), 118 if T else 106, DORADO, OSCURO, 10)
    d = ImageDraw.Draw(b)
    if not T:
        pastilla(d, 0, h - 112, "DESLIZA  →", mont(28, "ExtraBold"), CREMA, OSCURO, centrado=True)
        pie(d, CREMA, 1, total)
    return terminar(b)


def lamina_foto_completa(foto, cx, cy, num, titulo, cuerpo, n, total, col=(226, 60, 36), etiqueta=None):
    """La foto ocupa toda la lámina; abajo un degradado oscuro con número grande y texto."""
    T, h, o = g.tt(), H(), oy()
    b = llenar(foto, W, h, cx, cy).convert("RGBA")
    b.alpha_composite(degradado_v(W, h, int(h * (0.36 if T else 0.42)), int(h * (0.80 if T else 0.86)), (12, 7, 6), 0, 235))
    b.alpha_composite(degradado_v(W, h, 0, 260, (12, 7, 6), 150, 0))
    d = ImageDraw.Draw(b)
    ft, fc = anton(116 if T else 104), mont(44 if T else 40, "SemiBold")
    tl = g._lineas(d, titulo, ft, W - 160)
    cl = g._lineas(d, cuerpo, fc, W - 160)
    alto_txt = len(tl) * int(ft.size * 1.14) + 20 + len(cl) * int(fc.size * 1.4)
    fondo = 1480 if T else h - 130
    y = fondo - alto_txt
    # número en círculo
    r = 62
    if num is not None:
        d.ellipse((80, y - 2 * r - 26, 80 + 2 * r, y - 26), fill=col)
        centrar(d, y - 2 * r - 26 + 8, str(num), anton(88), CREMA, 80, 80 + 2 * r)
    for l in tl:
        d.text((80, y), l, font=ft, fill=CREMA); y += int(ft.size * 1.14)
    y += 20
    for l in cl:
        d.text((80, y), l, font=fc, fill=(244, 232, 216)); y += int(fc.size * 1.4)
    if etiqueta:
        pastilla(d, 80, o + 40, etiqueta, mont(28, "ExtraBold"), col, CREMA)
    if not T:
        pie(d, CREMA, n, total)
    return terminar(b)


def lamina_split(foto, caja, titulo, cuerpo, n, total, col=(190, 40, 24), num=None):
    """Foto arriba con corte diagonal; panel de color abajo con el texto."""
    T, h, o = g.tt(), H(), oy()
    alto_f = int(h * (0.50 if T else 0.52))
    b = Image.new("RGBA", (W, h), col + (255,))
    b = radial(tuple(int(v * 0.85) for v in col), tuple(int(v * 0.3) for v in col), cy=0.8, r=1.1).convert("RGBA")
    ph = llenar(foto.crop(caja), W, alto_f + 120, 0.5, 0.5).convert("RGBA")
    mask = Image.new("L", (W, alto_f + 120), 0)
    ImageDraw.Draw(mask).polygon([(0, 0), (W, 0), (W, alto_f), (0, alto_f + 110)], fill=255)
    ph.putalpha(mask)
    sh = Image.new("RGBA", ph.size, (0, 0, 0, 0)); sh.putalpha(mask.point(lambda v: int(v * 0.6)))
    b.alpha_composite(sh.filter(ImageFilter.GaussianBlur(24)), (0, 18))
    b.alpha_composite(ph, (0, 0))
    d = ImageDraw.Draw(b)
    y = alto_f + 150
    if num:
        gh = capa() if not T else Image.new("RGBA", (W, h), (0, 0, 0, 0))
        gh = Image.new("RGBA", (W, h), (0, 0, 0, 0))
        ImageDraw.Draw(gh).text((W - 300, alto_f + 40), num, font=anton(420 if T else 380), fill=(255, 255, 255, 34))
        b.alpha_composite(gh)
        d = ImageDraw.Draw(b)
    ft, fc = anton(112 if T else 100), mont(44 if T else 39, "Medium")
    for l in g._lineas(d, titulo, ft, W - 150):
        d.text((80, y), l, font=ft, fill=CREMA); y += int(ft.size * 1.15)
    y += 18
    for l in g._lineas(d, cuerpo, fc, W - 160):
        d.text((80, y), l, font=fc, fill=(255, 236, 212)); y += int(fc.size * 1.4)
    if not T:
        pie(d, CREMA, n, total)
    return terminar(b)


def lamina_ingredientes(foto, caja, titulo, items, n, total, col=(190, 40, 24)):
    """Fondo crema con foto circular y lista con puntos de color."""
    T, h, o = g.tt(), H(), oy()
    b = radial((252, 246, 236), (230, 214, 192), cy=0.35, r=1.15).convert("RGBA")
    d = ImageDraw.Draw(b)
    espiral(d, W, 0, 700, col + (40,), 3, 7)
    dia = 520 if T else 440
    cx, cy = W - dia // 2 - 40, o + (300 if T else 270)
    ph = llenar(foto.crop(caja), dia, dia, 0.5, 0.5).convert("RGBA")
    m = Image.new("L", (dia, dia), 0); ImageDraw.Draw(m).ellipse((0, 0, dia - 1, dia - 1), fill=255)
    ph.putalpha(m)
    aro = capa(); ImageDraw.Draw(aro).ellipse((cx - dia // 2 - 16, cy - dia // 2 - 16, cx + dia // 2 + 16, cy + dia // 2 + 16), fill=col + (255,))
    sh = capa(); ImageDraw.Draw(sh).ellipse((cx - dia // 2, cy - dia // 2 + 24, cx + dia // 2, cy + dia // 2 + 24), fill=(0, 0, 0, 110))
    b.alpha_composite(sh.filter(ImageFilter.GaussianBlur(22)))
    b.alpha_composite(aro)
    b.alpha_composite(ph, (cx - dia // 2, cy - dia // 2))
    d = ImageDraw.Draw(b)
    y = o + (80 if T else 70)
    ft = anton(100 if T else 105)
    for l in titulo.split("\n"):
        d.text((70, y), l, font=ft, fill=OSCURO); y += int(ft.size * 1.05)
    d.rectangle((72, y + 6, 72 + 110, y + 18), fill=col)
    y = max(y + 60, cy + dia // 2 + 70)
    fi = mont(46 if T else 40, "Bold")
    for it in items:
        d.ellipse((80, y + 16, 106, y + 42), fill=col)
        for j, l in enumerate(envolver(d, it, fi, W - 240)):
            d.text((130, y + j * 52), l, font=fi, fill=(52, 36, 30))
        y += (98 if T else 84) + 52 * (len(envolver(d, it, fi, W - 240)) - 1)
    if not T:
        pie(d, OSCURO, n, total)
    return terminar(b)


def lamina_cierre_parrilla(titulo, lineas, boton, total, fotos=(5, 1, 2), precio="$10", fondo="parrilla"):
    """Cierre sobre parrilla con empaques y llamado a la acción."""
    T, h, o = g.tt(), H(), oy()
    b = _fondo(h, fondo, 8)
    if fondo == "parrilla":
        humo(b, h, 0, int(h * 0.3), seed=2)
        viñeta(b, h)
    d = ImageDraw.Draw(b)
    ft = anton(150 if T else 138)
    y = o + (50 if T else 80)
    tl = g._lineas(d, titulo, ft, W - 120)
    for l in tl:
        centrar(d, y, l, ft, CREMA); y += int(ft.size * 1.12)
    alto = 560 if T else 420
    cy = max(y + alto // 2 + 20, o + (700 if T else 690))
    ps = [empaque(k, alto, a) for k, a in zip(fotos, (14, -14, 0))]
    pos = [(W / 2 - 260, cy + 40), (W / 2 + 260, cy + 40), (W / 2, cy)]
    for p, (px, py) in zip([ps[0], ps[1], ps[2]], pos):
        pegar_producto(b, p, (int(px - p.width / 2), int(py - p.height / 2)), brillo=(255, 170, 70))
    if precio:
        sticker(b, ["SOLO", precio, "1/2 KG"], 890, int(cy - alto / 2 + 40), 110, (226, 40, 28), CREMA, 12)
    d = ImageDraw.Draw(b)
    yb = int(cy + alto / 2 + 40)
    pastilla(d, 0, yb, boton, mont(42 if T else 38, "ExtraBold"), DORADO, OSCURO, pad=40, centrado=True)
    yy = yb + 110
    for l in lineas:
        centrar(d, yy, l, mont(34 if T else 30, "Bold"), CREMA); yy += 48
    if not T:
        pie(d, CREMA, total, total)
    return terminar(b)


def lamina_texto_parrilla(lineas, sub, n, total, empaque_n=5, seed=11):
    """Frase grande sobre la parrilla. lineas = [(texto, color)], con un empaque asomando abajo."""
    T, h, o = g.tt(), H(), oy()
    b = parrilla_bg(h, ang=-8, seed=seed, calor=0.6)
    b.alpha_composite(Image.new("RGBA", (W, h), (10, 6, 5, 105)))
    humo(b, h, 0, int(h * 0.3), seed=4)
    viñeta(b, h)
    d = ImageDraw.Draw(b)
    tam = 190 if T else 158
    y = o + (150 if T else 130)
    for txt, col in lineas:
        d.text((70, y), txt, font=anton(tam), fill=col); y += int(tam * 1.12)
    y += 20
    fs = mont(46 if T else 40, "SemiBold")
    for l in envolver(d, sub, fs, W - 300):
        d.text((74, y), l, font=fs, fill=(244, 232, 216)); y += int(fs.size * 1.4)
    alto = 700 if T else 560
    p = empaque(empaque_n, alto, -14)
    pegar_producto(b, p, (W - p.width + 80, 1290 if T else h - int(alto * 0.78)), brillo=(255, 150, 50))
    d = ImageDraw.Draw(b)
    if not T:
        pie(d, CREMA, n, total)
    return terminar(b)


def _fondo(h, fondo, seed):
    if fondo == "parrilla":
        return parrilla_bg(h, ang=10 if seed == 8 else -14, seed=seed, calor=0.55 if seed == 8 else 0.85)
    c, o = g.PALETAS["receta"]
    b = g._radial(c, o, 0.5, h * 0.4, 1.1, h).convert("RGBA")
    espiral(ImageDraw.Draw(b), W / 2, h * 0.45, 720, (255, 255, 255, 34), 3, 7)
    return b


def lamina_producto_split(empaque_n, titulo, cuerpo, n, total, col=(196, 44, 26), sello=None, fondo="parrilla", prop_extra=None):
    """Arriba: parrilla con el empaque grande (corte diagonal). Abajo: panel de color con texto."""
    T, h, o = g.tt(), H(), oy()
    alto_f = int(h * (0.52 if T else 0.50))
    b = radial(tuple(int(v * 0.85) for v in col), tuple(int(v * 0.3) for v in col), cy=0.8, r=1.1).convert("RGBA")
    top = _fondo(alto_f + 120, fondo, 6)
    ImageDraw.Draw(top)
    gl = Image.new("RGBA", top.size, (0, 0, 0, 0))
    ImageDraw.Draw(gl).ellipse((150, 60, W - 150, alto_f + 60), fill=(255, 120, 30, 130))
    top.alpha_composite(gl.filter(ImageFilter.GaussianBlur(90)))
    alto = int(alto_f * 0.95)
    p = empaque(empaque_n, alto, -8)
    pegar_producto(top, p, (W // 2 - p.width // 2, 10 + (alto_f - alto) // 2), brillo=(255, 170, 70))
    if prop_extra:
        for nombre, alt, (px, py), ang in prop_extra:
            pp = prop(nombre, alt, ang)
            pegar_producto(top, pp, (px, py))
    mask = Image.new("L", top.size, 0)
    ImageDraw.Draw(mask).polygon([(0, 0), (W, 0), (W, alto_f), (0, alto_f + 110)], fill=255)
    top.putalpha(mask)
    sh = Image.new("RGBA", top.size, (0, 0, 0, 0)); sh.putalpha(mask.point(lambda v: int(v * 0.6)))
    b.alpha_composite(sh.filter(ImageFilter.GaussianBlur(24)), (0, 18))
    b.alpha_composite(top, (0, 0))
    if sello:
        sticker(b, sello, 900, int(alto_f * 0.30), 108, DORADO, OSCURO, 10)
    d = ImageDraw.Draw(b)
    y = alto_f + 150
    ft, fc = anton(124 if T else 112), mont(44 if T else 39, "Medium")
    for l in g._lineas(d, titulo, ft, W - 150):
        d.text((80, y), l, font=ft, fill=CREMA); y += int(ft.size * 1.15)
    y += 18
    for l in g._lineas(d, cuerpo, fc, W - 160):
        d.text((80, y), l, font=fc, fill=(255, 236, 212)); y += int(fc.size * 1.4)
    if not T:
        pie(d, CREMA, n, total)
    return terminar(b)


# ---------- recortes de props (de la foto de la pasta) ----------
def prop(nombre, alto, ang=0):
    im = Image.open(f"{FOT}/prop_{nombre}.png").convert("RGBA")
    a = im.split()[3].point(lambda v: 255 if v > 30 else 0)
    im = im.crop(a.getbbox())
    im = im.resize((int(im.width * alto / im.height), alto), Image.LANCZOS)
    rgb = im.convert("RGB").filter(ImageFilter.UnsharpMask(2, 60, 3))
    rgb.putalpha(im.split()[3])
    return rgb.rotate(ang, expand=True, resample=Image.BICUBIC)


def portada_foto(foto, l1, l2, etiqueta, sello, total, cx=0.5, cy=0.5):
    """Portada con la foto a pantalla completa y el título sobre un degradado oscuro."""
    T, h, o = g.tt(), H(), oy()
    b = llenar(foto, W, h, cx, cy).convert("RGBA")
    b.alpha_composite(degradado_v(W, h, 0, int(h * 0.56), (12, 6, 5), 235, 0))
    b.alpha_composite(degradado_v(W, h, int(h * 0.80), h, (12, 6, 5), 0, 170))
    d = ImageDraw.Draw(b)
    pastilla(d, 0, o + (28 if T else 50), etiqueta, mont(30 if T else 27, "ExtraBold"), DORADO, OSCURO, centrado=True)
    tam = 320 if T else 235
    while ancho(d, l1, anton(tam)) > W - 100:
        tam -= 6
    f1 = anton(tam)
    d.text(((W - ancho(d, l1, f1)) / 2, o + (100 if T else 105)), l1, font=f1, fill=CREMA, stroke_width=4, stroke_fill=(20, 10, 8))
    t2 = int(tam * 0.56)
    while ancho(d, l2, anton(t2)) > W - 100:
        t2 -= 4
    f2 = anton(t2)
    d.text(((W - ancho(d, l2, f2)) / 2, o + (100 if T else 105) + int(tam * 1.13)), l2, font=f2, fill=DORADO, stroke_width=4, stroke_fill=(20, 10, 8))
    sticker(b, sello, 900 if T else 905, int(h * (0.80 if T else 0.80)), 118 if T else 106, DORADO, OSCURO, 10)
    d = ImageDraw.Draw(b)
    if not T:
        pastilla(d, 0, h - 112, "DESLIZA  →", mont(28, "ExtraBold"), CREMA, OSCURO, centrado=True)
        pie(d, CREMA, 1, total)
    return terminar(b)


def lamina_paso_props(titulo, cuerpo, num, n, total, props):
    """Fondo rojo tomate con número gigante de fondo y recortes de ingredientes. props = [(nombre, alto, (x, y), ang)]
    con coordenadas para IG; en TikTok se escalan y se bajan."""
    T, h, o = g.tt(), H(), oy()
    c, oc = g.PALETAS["receta"]
    b = g._radial(c, oc, 0.3, h * 0.25, 1.15, h).convert("RGBA")
    gh = Image.new("RGBA", (W, h), (0, 0, 0, 0))
    ImageDraw.Draw(gh).text((W - 560, o + (60 if T else 40)), num, font=anton(980 if T else 860), fill=(255, 255, 255, 26))
    b.alpha_composite(gh)
    k = 1.3 if T else 1.0
    for nombre, alto, (px, py), ang in props:
        p = prop(nombre, int(alto * k), ang)
        pegar_producto(b, p, (px, int(py * k) + (o if T else 0)))
    d = ImageDraw.Draw(b)
    d.ellipse((80, o + 90, 80 + 130, o + 220), fill=DORADO)
    centrar(d, o + 90 + 10, num, anton(108), OSCURO, 80, 210)
    y = o + (330 if T else 290)
    ft, fc = anton(118 if T else 106), mont(44 if T else 40, "SemiBold")
    for l in g._lineas(d, titulo, ft, 640):
        d.text((80, y), l, font=ft, fill=CREMA); y += int(ft.size * 1.14)
    y += 22
    for l in g._lineas(d, cuerpo, fc, 620):
        d.text((82, y), l, font=fc, fill=(255, 236, 212)); y += int(fc.size * 1.42)
    if not T:
        pie(d, CREMA, n, total)
    return terminar(b)
