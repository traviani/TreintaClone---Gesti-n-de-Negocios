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
def portada_parrilla(l1, l2, etiqueta, sello, total, fondo="parrilla"):
    """Portada: título gigante sobre parrilla con la espiral como protagonista."""
    T, h, o = g.tt(), H(), oy()
    b = parrilla_bg(h, ang=-14 if not T else -12) if fondo == "parrilla" else (teal_bg(h) if fondo == "teal" else mesa_bg(h, 4))
    if fondo == "parrilla":
        humo(b, h, 0, int(h * 0.3))
    d = ImageDraw.Draw(b)
    # resplandor bajo la salchicha
    cy_s = int(h * (0.615 if T else 0.71))
    glow = capa() if not T else Image.new("RGBA", (W, h), (0, 0, 0, 0))
    glow = Image.new("RGBA", (W, h), (0, 0, 0, 0))
    gcol = {"parrilla": (255, 110, 20, 140), "mesa": (255, 190, 90, 110)}.get(fondo, (210, 255, 240, 95))
    ImageDraw.Draw(glow).ellipse((60, cy_s - 480, W - 60, cy_s + 480), fill=gcol)
    b.alpha_composite(glow.filter(ImageFilter.GaussianBlur(110)))
    sp = espiral_cutout(960 if T else 880)
    pegar_producto(b, sp, (W // 2 - sp.width // 2, cy_s - sp.height // 2))
    viñeta(b, h)
    # oscurece la zona del título para que se lea
    b.alpha_composite(degradado_v(W, h, 0, int(h * 0.36), (10, 6, 5) if fondo != "teal" else (2, 28, 28), 190, 0))
    d = ImageDraw.Draw(b)
    pastilla(d, 0, o + (28 if T else 50), etiqueta, mont(30 if T else 27, "ExtraBold"), DORADO, OSCURO, centrado=True)
    tam = 330 if T else 225
    while ancho(d, l1, anton(tam)) > W - 90:
        tam -= 6
    centrar(d, o + (100 if T else 105), l1, anton(tam), CREMA)
    y2 = o + (100 if T else 105) + int(tam * 1.13)
    t2 = int(tam * 0.56)
    while ancho(d, l2, anton(t2)) > W - 90:
        t2 -= 4
    centrar(d, y2, l2, anton(t2), DORADO)
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


def lamina_texto_parrilla(lineas, sub, n, total, empaque_n=5, seed=11, fondo="parrilla"):
    """Frase grande sobre la parrilla. lineas = [(texto, color)], con un empaque asomando abajo."""
    T, h, o = g.tt(), H(), oy()
    b = parrilla_bg(h, ang=-8, seed=seed, calor=0.6) if fondo == "parrilla" else _fondo(h, fondo, seed)
    b.alpha_composite(Image.new("RGBA", (W, h), (10, 6, 5, 105 if fondo == "parrilla" else 120)))
    if fondo == "parrilla":
        humo(b, h, 0, int(h * 0.3), seed=4)
    viñeta(b, h)
    d = ImageDraw.Draw(b)
    tam = 190 if T else 158
    while max(ancho(d, t, anton(tam)) for t, _ in lineas) > W - 150:
        tam -= 6
    y = o + (150 if T else 130)
    for txt, col in lineas:
        d.text((70, y), txt, font=anton(tam), fill=col); y += int(tam * 1.12)
    y += 20
    fs = mont(46 if T else 40, "SemiBold")
    for l in envolver(d, sub, fs, W - 300):
        d.text((74, y), l, font=fs, fill=(244, 232, 216)); y += int(fs.size * 1.4)
    alto = 700 if T else 560
    p = empaque(empaque_n, alto, -14)
    pegar_producto(b, p, (W - p.width + 80, int(y + 50) if T else h - int(alto * 0.78)), brillo=(255, 150, 50))
    d = ImageDraw.Draw(b)
    if not T:
        pie(d, CREMA, n, total)
    return terminar(b)


def mesa_bg(h, seed=4):
    """Mesa de madera con tablones, veta vertical y luz cálida al centro."""
    import numpy as np
    rnd = np.random.RandomState(seed)
    gran = np.array(Image.fromarray((rnd.rand(max(2, h // 30), W // 2) * 255).astype("uint8")).resize((W, h), Image.BICUBIC), dtype=float) / 255
    fino = np.array(Image.fromarray((rnd.rand(h // 2, W // 3) * 255).astype("uint8")).resize((W, h), Image.BICUBIC), dtype=float) / 255
    tex = 0.65 * gran + 0.35 * fino
    oscuro, claro = np.array([62, 36, 20.]), np.array([158, 102, 58.])
    img = oscuro + (claro - oscuro) * tex[..., None]
    pw = W // 5 + 1
    for i in range(5):
        x0, x1 = i * pw, min(W, i * pw + pw)
        img[:, x0:x1, :] += rnd.uniform(-22, 22)
        img[:, x0:x0 + 5, :] *= 0.3
    yy, xx = np.mgrid[0:h, 0:W]
    d = np.sqrt(((xx - W / 2) / (W * 0.7)) ** 2 + ((yy - h * 0.5) / (h * 0.6)) ** 2)
    img *= (1.18 - 0.62 * np.clip(d, 0, 1.2))[..., None]
    return Image.fromarray(np.clip(img, 0, 255).astype("uint8"), "RGB").convert("RGBA")


def teal_bg(h):
    c, o = g.PALETAS["tip"]
    b = g._radial(c, o, 0.5, h * 0.42, 1.1, h).convert("RGBA")
    gr = Image.new("RGBA", (W, h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(gr)
    for x in range(0, W, 60):
        gd.line((x, 0, x, h), fill=(255, 255, 255, 16), width=2)
    for y in range(0, h, 60):
        gd.line((0, y, W, y), fill=(255, 255, 255, 16), width=2)
    b.alpha_composite(gr)
    return b


def _fondo(h, fondo, seed):
    if fondo == "azul":
        c, o = g.PALETAS["mayorista"]
        b = g._radial(tuple(int(v * 1.05) for v in c), o, 0.5, h * 0.4, 1.1, h).convert("RGBA")
        espiral(ImageDraw.Draw(b), W / 2, h * 0.45, 720, (255, 255, 255, 30), 3, 7)
        return b
    if fondo == "ambar":
        b = g._radial((214, 120, 24), (74, 34, 4), 0.5, h * 0.42, 1.1, h).convert("RGBA")
        espiral(ImageDraw.Draw(b), W / 2, h * 0.45, 720, (255, 255, 255, 30), 3, 7)
        return b
    if fondo == "teal":
        return teal_bg(h)
    if fondo == "mesa":
        return mesa_bg(h, seed)
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


def _mesa_oscura(h, seed=4, alfa=125):
    b = mesa_bg(h, seed)
    b.alpha_composite(Image.new("RGBA", (W, h), (12, 7, 5, alfa)))
    viñeta(b, h)
    return b


def lamina_bandas(titulo, filas, n, total, col=(196, 44, 26)):
    """Tres bandas de color con una palabra grande y una línea de texto. filas = [(palabra, texto)]."""
    T, h, o = g.tt(), H(), oy()
    b = _mesa_oscura(h, 5)
    d = ImageDraw.Draw(b)
    ft = anton(118 if T else 100)
    y = o + (40 if T else 70)
    for l in titulo.split("\n"):
        d.text((70, y), l, font=ft, fill=CREMA); y += int(ft.size * 1.1)
    y += 26
    alto = 310 if T else 250
    estilos = [(col, CREMA, (255, 226, 200)), (DORADO, OSCURO, (70, 40, 14)), (CREMA, OSCURO, (90, 60, 40))]
    for i, (pal, txt) in enumerate(filas):
        fb, ct, cs = estilos[i % 3]
        x0 = 50 + (40 if i % 2 else 0)
        sh = capa(); ImageDraw.Draw(sh).rounded_rectangle((x0, y + 12, W - 50 - (0 if i % 2 else 40), y + alto + 12), 34, fill=(0, 0, 0, 120))
        b.alpha_composite(sh.filter(ImageFilter.GaussianBlur(14)))
        ImageDraw.Draw(b).rounded_rectangle((x0, y, W - 50 - (0 if i % 2 else 40), y + alto), 34, fill=fb)
        d = ImageDraw.Draw(b)
        fp = anton(112 if T else 96)
        while ancho(d, pal, fp) > W - x0 - 160:
            fp = anton(fp.size - 6)
        d.text((x0 + 44, y + (48 if T else 34)), pal, font=fp, fill=ct)
        fc = mont(42 if T else 36, "SemiBold")
        yy = y + (48 if T else 34) + int(fp.size * 1.25)
        for l in envolver(d, txt, fc, W - x0 - 180):
            d.text((x0 + 46, yy), l, font=fc, fill=cs); yy += int(fc.size * 1.35)
        y += alto + 26
    if not T:
        pie(d, CREMA, n, total)
    return terminar(b)


def lamina_cantidades(titulo, filas, n, total, sabores=(3, 2, 1, 5)):
    """Guía visual: tarjetas con personas a la izquierda y los paquetes dibujados a la derecha. filas = [(personas, paquetes)]."""
    T, h, o = g.tt(), H(), oy()
    b = _mesa_oscura(h, 6)
    d = ImageDraw.Draw(b)
    ft = anton(108 if T else 92)
    y = o + (30 if T else 60)
    for l in titulo.split("\n"):
        d.text((70, y), l, font=ft, fill=CREMA); y += int(ft.size * 1.1)
    y += 22
    alto = 330 if T else 272
    for i, (pers, paq) in enumerate(filas):
        cl = capa()
        ImageDraw.Draw(cl).rounded_rectangle((50, y + 12, W - 50, y + alto + 12), 36, fill=(0, 0, 0, 120))
        b.alpha_composite(cl.filter(ImageFilter.GaussianBlur(14)))
        ImageDraw.Draw(b).rounded_rectangle((50, y, W - 50, y + alto), 36, fill=CREMA)
        ImageDraw.Draw(b).rounded_rectangle((50, y, 330, y + alto), 36, fill=(196, 44, 26))
        ImageDraw.Draw(b).rectangle((290, y, 330, y + alto), fill=(196, 44, 26))
        d = ImageDraw.Draw(b)
        centrar(d, y + alto * 0.12, str(pers), anton(170 if T else 140), CREMA, 50, 330)
        centrar(d, y + alto * 0.12 + (190 if T else 158), "PERSONAS", mont(28, "ExtraBold"), (255, 226, 200), 50, 330)
        ph = int(alto * 0.80)
        ps = [empaque(sabores[k % len(sabores)], ph, (-6, 4, -3, 6)[k % 4]) for k in range(paq)]
        paso = int(ps[0].width * 0.74)
        x = 360
        for p in ps:
            pegar_producto(b, p, (x, int(y + (alto - ph) * 0.35)))
            x += paso
        d = ImageDraw.Draw(b)
        et = f"{paq} PAQUETES"
        pastilla(d, W - 70 - ancho(d, et, mont(28, "ExtraBold")) - 52, y + alto - 62, et, mont(28, "ExtraBold"), OSCURO, CREMA, pad=26)
        y += alto + 24
    if not T:
        pie(d, CREMA, n, total)
    return terminar(b)


# ---------- diagramas (tips) ----------
def _cabecera(b, num, titulo, color=None):
    T, o = g.tt(), oy()
    d = ImageDraw.Draw(b)
    x = 80
    if num is not None:
        d.ellipse((x, o + 60, x + 120, o + 180), fill=DORADO)
        centrar(d, o + 60 + 6, str(num), anton(100), OSCURO, x, x + 120)
        x += 150
    ft = anton(108 if T else 96)
    y = o + (50 if T else 54)
    for l in g._lineas(d, titulo, ft, W - x - 60):
        d.text((x, y), l, font=ft, fill=CREMA); y += int(ft.size * 1.12)
    return y


def _cuerpo_abajo(b, cuerpo, n, total, col=CREMA):
    T, h = g.tt(), H()
    d = ImageDraw.Draw(b)
    fc = mont(44 if T else 40, "SemiBold")
    lin = g._lineas(d, cuerpo, fc, W - 160)
    fondo = 1490 if T else h - 120
    y = fondo - len(lin) * int(fc.size * 1.4)
    for l in lin:
        d.text((80, y), l, font=fc, fill=col); y += int(fc.size * 1.4)
    if not T:
        pie(d, col, n, total)
    return fondo - len(lin) * int(fc.size * 1.4)


def _top_cuerpo(cuerpo):
    T, h = g.tt(), H()
    d = ImageDraw.Draw(Image.new("RGB", (10, 10)))
    fc = mont(44 if T else 40, "SemiBold")
    n = len(g._lineas(d, cuerpo, fc, W - 160))
    return (1490 if T else h - 120) - n * int(fc.size * 1.4)


def _pincho(b, p1, p2, grosor=18):
    """Pincho de acero con brillo y sombra."""
    k = 3
    w, h = b.size
    capa_ = Image.new("RGBA", (w * k, h * k), (0, 0, 0, 0))
    d = ImageDraw.Draw(capa_)
    s = lambda p: (p[0] * k, p[1] * k)
    d.line([s((p1[0] + 10, p1[1] + 16)), s((p2[0] + 10, p2[1] + 16))], fill=(0, 0, 0, 130), width=grosor * k)
    cap = Image.new("RGBA", (w * k, h * k), (0, 0, 0, 0))
    sh = capa_.filter(ImageFilter.GaussianBlur(10 * k))
    d2 = ImageDraw.Draw(cap)
    d2.line([s(p1), s(p2)], fill=(150, 156, 162, 255), width=grosor * k)
    d2.line([s((p1[0] - 3, p1[1] - 3)), s((p2[0] - 3, p2[1] - 3))], fill=(238, 241, 244, 255), width=int(grosor * k * 0.32))
    for p in (p1, p2):
        r = grosor * 0.9 * k
        d2.ellipse((p[0] * k - r, p[1] * k - r, p[0] * k + r, p[1] * k + r), fill=(120, 126, 132, 255))
        r2 = r * 0.55
        d2.ellipse((p[0] * k - r2, p[1] * k - r2, p[0] * k + r2, p[1] * k + r2), fill=(222, 226, 230, 255))
    full = Image.alpha_composite(sh, cap).resize((w, h), Image.LANCZOS)
    b.alpha_composite(full)


def lamina_diagrama_pinchos(num, titulo, cuerpo, n, total):
    T, h, o = g.tt(), H(), oy()
    b = teal_bg(h)
    yt = _cabecera(b, num, titulo)
    sp = espiral_cutout(620 if T else 640, 0)
    cx, cy = W // 2, int(yt + (200 if T else 170) + sp.height / 2)
    pegar_producto(b, sp, (cx - sp.width // 2, cy - sp.height // 2))
    R = sp.width * 0.62
    d45 = R * 0.7071
    for (a, c) in (((cx - d45 - 30, cy - d45 - 30), (cx + d45 + 30, cy + d45 + 30)), ((cx + d45 + 30, cy - d45 - 30), (cx - d45 - 30, cy + d45 + 30))):
        _pincho(b, a, c)
    d = ImageDraw.Draw(b)
    for k, (px, py) in enumerate([(cx - d45 - 70, cy - d45 - 70), (cx + d45 + 70, cy - d45 - 70)], 1):
        d.ellipse((px - 34, py - 34, px + 34, py + 34), fill=DORADO)
        centrar(d, py - 30, str(k), anton(56), OSCURO, px - 40, px + 40)
    _cuerpo_abajo(b, cuerpo, n, total)
    return terminar(b)


def lamina_fuego(num, titulo, cuerpo, n, total):
    import numpy as np
    T, h, o = g.tt(), H(), oy()
    b = parrilla_bg(h, ang=-8, seed=12, calor=0.55)
    b.alpha_composite(Image.new("RGBA", (W, h), (10, 6, 5, 135)))
    viñeta(b, h)
    yt = _cabecera(b, num, titulo)
    y0 = int(yt + (330 if T else 140))
    x0, x1, alto = 90, W - 90, 92 if not T else 130
    grad = np.zeros((alto, x1 - x0, 4), dtype="uint8")
    cols = [(70, 160, 235), (250, 195, 50), (225, 40, 28)]
    for x in range(x1 - x0):
        t = x / (x1 - x0 - 1) * 2
        i = min(int(t), 1)
        f = t - i
        c = [int(cols[i][k] + (cols[i + 1][k] - cols[i][k]) * f) for k in range(3)]
        grad[:, x, :3] = c
        grad[:, x, 3] = 255
    barra = Image.fromarray(grad, "RGBA")
    m = Image.new("L", barra.size, 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, barra.width - 1, alto - 1), alto // 2, fill=255)
    barra.putalpha(m)
    sh = Image.new("RGBA", b.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle((x0, y0 + 12, x1, y0 + alto + 12), alto // 2, fill=(0, 0, 0, 130))
    b.alpha_composite(sh.filter(ImageFilter.GaussianBlur(14)))
    b.alpha_composite(barra, (x0, y0))
    d = ImageDraw.Draw(b)
    etiquetas = [("BAJO", x0 + 90), ("MEDIO", (x0 + x1) // 2), ("ALTO", x1 - 90)]
    for et, cx_ in etiquetas:
        centrar(d, y0 + alto + 34, et, anton(58 if T else 50), CREMA, cx_ - 150, cx_ + 150)
    # marcador en MEDIO
    mx = (x0 + x1) // 2
    r = 74 if T else 64
    d.ellipse((mx - r, y0 + alto // 2 - r, mx + r, y0 + alto // 2 + r), fill=CREMA, outline=(40, 120, 70), width=10)
    d.line([(mx - r * 0.42, y0 + alto // 2), (mx - r * 0.1, y0 + alto // 2 + r * 0.34), (mx + r * 0.46, y0 + alto // 2 - r * 0.36)], fill=(40, 140, 80), width=14, joint="curve")
    # X en ALTO
    ax, ay = x1 - 90, y0 + alto // 2
    d.ellipse((ax - 52, ay - 52, ax + 52, ay + 52), fill=CREMA)
    d.line([(ax - 26, ay - 26), (ax + 26, ay + 26)], fill=(200, 30, 26), width=13)
    d.line([(ax + 26, ay - 26), (ax - 26, ay + 26)], fill=(200, 30, 26), width=13)
    pastilla(d, mx - 120, y0 - 80, "USA ESTE", mont(30, "ExtraBold"), DORADO, OSCURO, pad=28)
    _cuerpo_abajo(b, cuerpo, n, total)
    return terminar(b)


def lamina_giro(num, titulo, cuerpo, n, total):
    T, h, o = g.tt(), H(), oy()
    b = teal_bg(h)
    yt = _cabecera(b, num, titulo)
    sp = espiral_cutout(520 if T else 540, 0)
    cx, cy = W // 2, int(yt + (200 if T else 190) + sp.height / 2)
    pegar_producto(b, sp, (cx - sp.width // 2, cy - sp.height // 2), brillo=(200, 255, 240))
    k = 3
    R = sp.width * 0.64
    lay = Image.new("RGBA", (W * k, h * k), (0, 0, 0, 0))
    ld = ImageDraw.Draw(lay)
    box = ((cx - R) * k, (cy - R) * k, (cx + R) * k, (cy + R) * k)
    ang0, ang1 = 130, 400
    ld.arc(box, ang0, ang1, fill=DORADO + (255,), width=30 * k)
    import math as _m
    t = _m.radians(ang1)
    px, py = cx + R * _m.cos(t), cy + R * _m.sin(t)
    tx, ty = -_m.sin(t), _m.cos(t)     # tangente (sentido horario en pantalla)
    nx, ny = _m.cos(t), _m.sin(t)
    L, A = 78, 62
    pts = [(px + tx * L, py + ty * L), (px + nx * A - tx * 14, py + ny * A - ty * 14), (px - nx * A - tx * 14, py - ny * A - ty * 14)]
    ld.polygon([(x * k, y * k) for x, y in pts], fill=DORADO + (255,))
    lay = lay.resize((W, h), Image.LANCZOS)
    sh = lay.filter(ImageFilter.GaussianBlur(10))
    sh.putalpha(sh.split()[3].point(lambda v: int(v * 0.5)))
    b.alpha_composite(sh, (8, 12))
    b.alpha_composite(lay)
    d = ImageDraw.Draw(b)
    ytop = _cuerpo_abajo(b, cuerpo, n, total)
    pastilla(d, 0, min(int(cy + R + 50), ytop - 110), "UNA SOLA VEZ", mont(40 if T else 36, "ExtraBold"), CREMA, OSCURO, pad=40, centrado=True)
    return terminar(b)


# ---------- día 6: formas de comerla ----------
def _circulo(b, im, cx, cy, dia, borde=(250, 243, 228), grosor=14):
    ph = llenar(im, dia, dia, 0.5, 0.5).convert("RGBA")
    m = Image.new("L", (dia, dia), 0); ImageDraw.Draw(m).ellipse((0, 0, dia - 1, dia - 1), fill=255)
    ph.putalpha(m)
    sh = capa(); ImageDraw.Draw(sh).ellipse((cx - dia // 2, cy - dia // 2 + 18, cx + dia // 2, cy + dia // 2 + 18), fill=(0, 0, 0, 120))
    b.alpha_composite(sh.filter(ImageFilter.GaussianBlur(18)))
    ImageDraw.Draw(b).ellipse((cx - dia // 2 - grosor, cy - dia // 2 - grosor, cx + dia // 2 + grosor, cy + dia // 2 + grosor), fill=borde)
    b.alpha_composite(ph, (cx - dia // 2, cy - dia // 2))


def _disco_empaque(b, n_emp, cx, cy, dia, col):
    sh = capa(); ImageDraw.Draw(sh).ellipse((cx - dia // 2, cy - dia // 2 + 18, cx + dia // 2, cy + dia // 2 + 18), fill=(0, 0, 0, 120))
    b.alpha_composite(sh.filter(ImageFilter.GaussianBlur(18)))
    ImageDraw.Draw(b).ellipse((cx - dia // 2 - 14, cy - dia // 2 - 14, cx + dia // 2 + 14, cy + dia // 2 + 14), fill=CREMA)
    ImageDraw.Draw(b).ellipse((cx - dia // 2, cy - dia // 2, cx + dia // 2, cy + dia // 2), fill=col)
    p = empaque(n_emp, int(dia * 0.98), -10)
    pegar_producto(b, p, (cx - p.width // 2, cy - p.height // 2 + 6))


def portada_formas(total, fotos):
    """Portada con cinco círculos, uno por forma de comerla. fotos = dict(pasta, panini, parrilla) de PIL."""
    T, h, o = g.tt(), H(), oy()
    b = _fondo(h, "ambar", 0)
    d = ImageDraw.Draw(b)
    pastilla(d, 0, o + (28 if T else 50), "ESTA SEMANA", mont(30 if T else 27, "ExtraBold"), DORADO, OSCURO, centrado=True)
    tam = 300 if T else 235
    while ancho(d, "5 FORMAS", anton(tam)) > W - 90:
        tam -= 6
    centrar(d, o + (100 if T else 105), "5 FORMAS", anton(tam), CREMA)
    t2 = int(tam * 0.62)
    centrar(d, o + (100 if T else 105) + int(tam * 1.13), "DE COMERLA", anton(t2), DORADO)
    dia = 310
    y1 = (975 if T else 720)
    y2 = y1 + dia + (90 if T else 75)
    xs3 = [W // 2 - dia - 40, W // 2, W // 2 + dia + 40]
    xs2 = [W // 2 - dia // 2 - 20, W // 2 + dia // 2 + 20]
    items = [("LUN", ("emp", 2, (236, 190, 50))), ("MAR", ("img", fotos["pasta"].crop((150, 360, 690, 830)))),
             ("MIÉ", ("img", fotos["panini"].crop((110, 0, 430, 330)))),
             ("JUE", ("img", fotos["pizza"].crop((120, 40, 1180, 900)))), ("FIN", ("img", fotos["parrilla"]))]
    pos = [(xs3[0], y1), (xs3[1], y1), (xs3[2], y1), (xs2[0], y2), (xs2[1], y2)]
    for (et, (tipo, *a)), (cx, cy) in zip(items, pos):
        if tipo == "img":
            _circulo(b, a[0], cx, cy, dia)
        else:
            _disco_empaque(b, a[0], cx, cy, dia, a[1])
        d = ImageDraw.Draw(b)
        pastilla(d, cx - 70, cy + dia // 2 - 34, et, mont(26, "ExtraBold"), OSCURO, CREMA, pad=20, centrado=False)
    d = ImageDraw.Draw(b)
    if not T:
        pastilla(d, 0, h - 112, "DESLIZA  →", mont(28, "ExtraBold"), CREMA, OSCURO, centrado=True)
        pie(d, CREMA, 1, total)
    return terminar(b)


def lamina_dia(dia_txt, forma, texto, modo, col, n, total, foto=None, caja=None, empaque_n=None, claro=False, ghost=None):
    """Una forma de comerla: chip del día, título grande y una imagen en círculo, polaroid o gráfico con empaque."""
    T, h, o = g.tt(), H(), oy()
    oscuro = tuple(int(v * 0.32) for v in col)
    b = g._radial(col, oscuro, 0.3, h * 0.3, 1.15, h).convert("RGBA")
    tinta = OSCURO if claro else CREMA
    d = ImageDraw.Draw(b)
    espiral(d, W, 0, 760, (255, 255, 255, 26) if not claro else (0, 0, 0, 22), 3, 7)
    pastilla(d, 70, o + 56, dia_txt, mont(32 if T else 30, "ExtraBold"), OSCURO if not claro else CREMA, DORADO if not claro else OSCURO)
    ft = anton(170 if T else 150)
    y = o + (150 if T else 140)
    d.text((66, y), forma, font=ft, fill=tinta)
    y_fin = y + int(ft.size * 1.15)
    disp = _top_cuerpo(texto) - 40 - y_fin
    if modo == "circulo":
        dia = min(820 if T else 700, disp - 50, W - 140)
        _circulo(b, foto.crop(caja) if caja else foto, W // 2, int(y_fin + 40 + dia / 2), dia, borde=tinta if claro else CREMA)
    elif modo == "polaroid":
        ph = foto.crop(caja) if caja else foto
        pw = min(860 if T else 780, int((disp - 150) * ph.width / ph.height))
        ph = ph.resize((pw, int(ph.height * pw / ph.width)), Image.LANCZOS).filter(ImageFilter.UnsharpMask(2, 60, 3))
        marco = Image.new("RGBA", (pw + 56, ph.height + 56 + 70), (250, 246, 238, 255))
        marco.paste(ph, (28, 28))
        marco = marco.rotate(-4, expand=True, resample=Image.BICUBIC)
        sh = Image.new("RGBA", b.size, (0, 0, 0, 0))
        px, py = (W - marco.width) // 2, int(y_fin + 30)
        sh.paste((0, 0, 0, 140), (px + 14, py + 26, px + marco.width - 6, py + marco.height + 16))
        b.alpha_composite(sh.filter(ImageFilter.GaussianBlur(24)))
        b.alpha_composite(marco, (px, py))
    elif modo == "recorte":
        pz = foto
        ancho_px = min(W - 60, int((disp - 60) * pz.width / pz.height))
        pz = pz.resize((ancho_px, int(pz.height * ancho_px / pz.width)), Image.LANCZOS).rotate(-3, expand=True, resample=Image.BICUBIC)
        gh = Image.new("RGBA", (W, h), (0, 0, 0, 0))
        fg = anton(520 if T else 420)
        ImageDraw.Draw(gh).text((-20, y_fin + (60 if T else 20)), ghost or forma.split()[-1], font=fg, fill=(255, 255, 255, 38))
        b.alpha_composite(gh)
        py = int(y_fin + 20 + (disp - pz.height) / 2) - (90 if empaque_n else 0)
        pegar_producto(b, pz, ((W - pz.width) // 2, py), brillo=(255, 200, 120))
        if empaque_n:
            pk = empaque(empaque_n, int(disp * 0.42), 8)
            pegar_producto(b, pk, (W - pk.width - 40, py + pz.height - int(pk.height * 0.62)))
    else:  # grafico
        gh = Image.new("RGBA", (W, h), (0, 0, 0, 0))
        fg = anton(520 if T else 420)
        ImageDraw.Draw(gh).text((-20, y_fin + (60 if T else 20)), ghost or forma.split()[-1], font=fg, fill=(255, 255, 255, 38) if not claro else (0, 0, 0, 30))
        b.alpha_composite(gh)
        alto = min(880 if T else 700, disp - 70)
        p = empaque(empaque_n, alto, -10)
        pegar_producto(b, p, (W // 2 - p.width // 2 + 60, int(y_fin + 30)), brillo=(255, 230, 190))
    _cuerpo_abajo(b, texto, n, total, tinta)
    return terminar(b)


# ---------- día 7: mayoristas ----------
def portada_recorte(recorte, l1, l2, etiqueta, sello, total, empaque_n, fondo="azul"):
    T, h, o = g.tt(), H(), oy()
    b = _fondo(h, fondo, 0)
    d = ImageDraw.Draw(b)
    pastilla(d, 0, o + (28 if T else 50), etiqueta, mont(30 if T else 27, "ExtraBold"), DORADO, OSCURO, centrado=True)
    tam = 300 if T else 225
    while ancho(d, l1, anton(tam)) > W - 90:
        tam -= 6
    centrar(d, o + (100 if T else 105), l1, anton(tam), CREMA)
    t2 = int(tam * 0.56)
    while ancho(d, l2, anton(t2)) > W - 90:
        t2 -= 4
    centrar(d, o + (100 if T else 105) + int(tam * 1.13), l2, anton(t2), DORADO)
    cy = int(h * (0.62 if T else 0.64))
    pw = W - 40
    pz = recorte.resize((pw, int(recorte.height * pw / recorte.width)), Image.LANCZOS).rotate(-3, expand=True, resample=Image.BICUBIC)
    gl = Image.new("RGBA", (W, h), (0, 0, 0, 0))
    ImageDraw.Draw(gl).ellipse((60, cy - 330, W - 60, cy + 330), fill=(255, 200, 120, 90))
    b.alpha_composite(gl.filter(ImageFilter.GaussianBlur(110)))
    pegar_producto(b, pz, ((W - pz.width) // 2, cy - pz.height // 2))
    pk = empaque(empaque_n, 620 if T else 480, 8)
    pegar_producto(b, pk, (W - pk.width - 20, cy + pz.height // 2 - int(pk.height * 0.45)), brillo=(255, 235, 190))
    sticker(b, sello, 175, cy - pz.height // 2 - 10, 112 if T else 100, DORADO, OSCURO, -10)
    d = ImageDraw.Draw(b)
    if not T:
        pastilla(d, 0, h - 112, "DESLIZA  →", mont(28, "ExtraBold"), CREMA, OSCURO, centrado=True)
        pie(d, CREMA, 1, total)
    return terminar(b)


def lamina_abanico(titulo, chips, n, total, fondo="azul", sabores=(4, 2, 1, 3, 5)):
    """Cinco empaques en abanico con etiquetas de uso debajo."""
    T, h, o = g.tt(), H(), oy()
    b = _fondo(h, fondo, 0)
    d = ImageDraw.Draw(b)
    ft = anton(124 if T else 110)
    y = o + (50 if T else 80)
    for l in g._lineas(d, titulo, ft, W - 120):
        centrar(d, y, l, ft, CREMA); y += int(ft.size * 1.1)
    cy = int(y + (560 if T else 400))
    alto = 640 if T else 470
    angs = [-18, -9, 0, 9, 18]
    dx = [-400, -205, 0, 205, 400]
    dy = [60, 15, 0, 15, 60]
    orden = [0, 4, 1, 3, 2]
    for i in orden:
        p = empaque(sabores[i], alto if i != 2 else int(alto * 1.08), angs[i])
        pegar_producto(b, p, (W // 2 + dx[i] - p.width // 2, cy + dy[i] - p.height // 2), brillo=(255, 235, 190) if i == 2 else None)
    d = ImageDraw.Draw(b)
    yy = cy + alto // 2 + (120 if T else 90)
    f = mont(36 if T else 32, "ExtraBold")
    ws = [ancho(d, c, f) + 70 for c in chips]
    x = (W - sum(ws) - 20 * (len(chips) - 1)) / 2
    for c, w_ in zip(chips, ws):
        d.rounded_rectangle((x, yy, x + w_, yy + 72), 40, fill=CREMA)
        d.text((x + 35, yy + 14), c, font=f, fill=OSCURO)
        x += w_ + 20
    if not T:
        pie(d, CREMA, n, total)
    return terminar(b)


def lamina_checks(titulo, items, n, total, fondo="azul", recorte=None):
    """Lista de garantías con checks dorados sobre tarjeta crema."""
    T, h, o = g.tt(), H(), oy()
    b = _fondo(h, fondo, 0)
    d = ImageDraw.Draw(b)
    ft = anton(120 if T else 106)
    y = o + (50 if T else 70)
    for l in g._lineas(d, titulo, ft, W - 140):
        d.text((70, y), l, font=ft, fill=CREMA); y += int(ft.size * 1.1)
    y += 30
    fi = mont(46 if T else 40, "ExtraBold")
    paso = 150 if T else 122
    alto = len(items) * paso + 50
    cl = capa(); ImageDraw.Draw(cl).rounded_rectangle((50, y + 14, W - 50, y + alto + 14), 40, fill=(0, 0, 0, 120))
    b.alpha_composite(cl.filter(ImageFilter.GaussianBlur(16)))
    ImageDraw.Draw(b).rounded_rectangle((50, y, W - 50, y + alto), 40, fill=CREMA)
    d = ImageDraw.Draw(b)
    yy = y + 40
    for it in items:
        cx, cy_ = 120, yy + 38
        d.ellipse((cx - 38, cy_ - 38, cx + 38, cy_ + 38), fill=(30, 120, 92))
        d.line([(cx - 17, cy_ + 1), (cx - 5, cy_ + 14), (cx + 19, cy_ - 13)], fill=CREMA, width=10, joint="curve")
        d.text((190, yy + 6), it, font=fi, fill=OSCURO)
        yy += paso
    if recorte is not None:
        yb = y + alto + 10
        disp = (1490 if T else h - 120) - yb
        if disp > 160:
            pw = min(W - 60, int(disp * 1.05 * recorte.width / recorte.height))
            pz = recorte.resize((pw, int(recorte.height * pw / recorte.width)), Image.LANCZOS)
            pegar_producto(b, pz, ((W - pz.width) // 2, int(yb + (disp - pz.height) / 2)))
    if not T:
        pie(d, CREMA, n, total)
    return terminar(b)
