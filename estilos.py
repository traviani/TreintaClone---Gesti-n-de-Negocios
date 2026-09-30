"""Núcleo compartido de diseño v3 (collage, brutalista, revista, italiano, chat, cuaderno, riso).
Todo se dibuja dentro de un 'marco seguro' que cambia según el formato:
  IG 1080x1350 -> marco (60,60,960,1230)
  TT 1080x1920 -> marco (60,175,890,1340)  (evita barra superior, botones a la derecha y texto inferior)
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops, ImageOps, ImageEnhance
import numpy as np, random, math, os, functools

FONTS = "/home/claude/fonts"
FOT = "/home/claude/fotos"
REC = FOT + "/recorte"
HANDLE = "@ilsicilianogourmet_"
WA = "+58 422 646 8537"

_fmt = {"tt": False}


def usar(f):
    _fmt["tt"] = (f == "tt")


def tt():
    return _fmt["tt"]


def H():
    return 1920 if tt() else 1350


W = 1080


def marco():
    return (60, 175, 890, 1340) if tt() else (60, 60, 960, 1230)


def mx(f):  # fracción horizontal del marco -> px
    x, y, w, h = marco(); return int(x + f * w)


def my(f):
    x, y, w, h = marco(); return int(y + f * h)


# ---------------------------------------------------------------- fuentes
_FN = {"anton": "Anton-Regular.ttf", "caveat": "Caveat-Bold.ttf", "play": "Playfair-Black.ttf",
       "playb": "Playfair-Bold.ttf", "playi": "Playfair-BoldItalic.ttf", "fred": "Fredoka-Bold.ttf",
       "fredr": "Fredoka-Regular.ttf", "fredm": "Fredoka-SemiBold.ttf", "marker": "PermanentMarker.ttf",
       "dm": "DMSerif.ttf", "dmi": "DMSerif-Italic.ttf", "bebas": "BebasNeue.ttf", "mono": "SpaceMono-Bold.ttf",
       "monor": "SpaceMono.ttf"}


@functools.lru_cache(None)
def F(nombre, size):
    if nombre.startswith("mont"):
        peso = {"mont": "Bold", "montx": "ExtraBold", "montm": "SemiBold", "montb": "Black", "montr": "Medium"}[nombre]
        f = ImageFont.truetype(f"{FONTS}/Montserrat%5Bwght%5D.ttf", size)
        f.set_variation_by_name(peso)
        return f
    return ImageFont.truetype(f"{FONTS}/{_FN[nombre]}", size)


def envolver(txt, f, maxw):
    out = []
    for par in txt.split("\n"):
        cur = ""
        for w in par.split(" "):
            t = (cur + " " + w).strip()
            if f.getlength(t) <= maxw or not cur:
                cur = t
            else:
                out.append(cur); cur = w
        out.append(cur)
    return out


def ajustar(txt, nombre, maxw, maxh, ini, mini=22, inter=1.1):
    s = ini
    while s >= mini:
        f = F(nombre, s)
        ls = envolver(txt, f, maxw)
        if len(ls) * s * inter <= maxh and all(f.getlength(l) <= maxw + 1 for l in ls):
            return f, ls, s
        s -= 2
    f = F(nombre, mini)
    return f, envolver(txt, f, maxw), mini


def ajuste_items(items, nombre, maxw, maxh, ini, mini=22, inter=1.3):
    """Tamaño de fuente para que cada item quepa en UNA línea y toda la lista en maxh."""
    s = ini
    while s >= mini:
        f = F(nombre, s)
        if all(f.getlength(i) <= maxw for i in items) and len(items) * s * inter <= maxh:
            return f, items, s
        s -= 2
    return F(nombre, mini), items, mini


def capa_texto(lineas, f, fill, align="left", lh=None, stroke=0, sfill=(0, 0, 0), sombra=None, track=0):
    lh = lh or int(f.size * 1.1)
    if track:
        ancho = lambda s: sum(f.getlength(c) + track for c in s) - track
    else:
        ancho = lambda s: f.getlength(s)
    w = max(ancho(l) for l in lineas)
    pad = stroke + (max(abs(sombra[0]), abs(sombra[1])) if sombra else 0) + 8
    L = Image.new("RGBA", (int(w) + 2 * pad, lh * len(lineas) + 2 * pad + f.size // 3), (0, 0, 0, 0))
    d = ImageDraw.Draw(L)
    for i, l in enumerate(lineas):
        lw = ancho(l)
        x = pad if align == "left" else (pad + (w - lw) / 2 if align == "center" else pad + w - lw)
        y = pad + i * lh

        def dib(xx, yy, col, st, sf):
            if track:
                cx = xx
                for c in l:
                    d.text((cx, yy), c, font=f, fill=col, stroke_width=st, stroke_fill=sf)
                    cx += f.getlength(c) + track
            else:
                d.text((xx, yy), l, font=f, fill=col, stroke_width=st, stroke_fill=sf)
        if sombra:
            dib(x + sombra[0], y + sombra[1], sombra[2], stroke, sombra[2])
        dib(x, y, fill, stroke, sfill)
    bb = L.getbbox()
    if bb:
        m = 4
        L = L.crop((max(bb[0] - m, 0), max(bb[1] - m, 0), min(bb[2] + m, L.width), min(bb[3] + m, L.height)))
    return L


def poner(im, capa, x, y, anchor="lt", ang=0):
    if ang:
        capa = capa.rotate(ang, resample=Image.BICUBIC, expand=True)
    w, h = capa.size
    ax, ay = anchor[0], anchor[1]
    x0 = x if ax == "l" else (x - w // 2 if ax == "c" else x - w)
    y0 = y if ay == "t" else (y - h // 2 if ay == "m" else y - h)
    im.paste(capa, (int(x0), int(y0)), capa)
    return (int(x0), int(y0), int(x0 + w), int(y0 + h))


def T(im, txt, nombre, size, fill, x, y, anchor="lt", maxw=None, maxh=None, align=None, mini=22, inter=1.1,
      lh=None, ang=0, **fx):
    """Texto con ajuste automático. Devuelve bbox en el lienzo."""
    if maxw is None:
        maxw = W
    if maxh is None:
        maxh = 4000
    f, ls, s = ajustar(txt, nombre, maxw, maxh, size, mini, inter)
    if align is None:
        align = {"l": "left", "c": "center", "r": "right"}[anchor[0]]
    capa = capa_texto(ls, f, fill, align, lh or int(s * inter), **fx)
    return poner(im, capa, x, y, anchor, ang)


# ---------------------------------------------------------------- imágenes
@functools.lru_cache(None)
def _img(p):
    return Image.open(p).convert("RGBA")


def img(p):
    return _img(p).copy()


def prod(n):
    return img(f"{REC}/{n}.png")


def plato(nombre):
    p = f"{FOT}/platos/{nombre}.png"
    return img(p) if os.path.exists(p) else None


def recortar(im):
    bb = im.split()[3].getbbox()
    return im.crop(bb) if bb else im


def escalar(im, ancho=None, alto=None):
    w, h = im.size
    if ancho:
        alto = int(h * ancho / w)
    else:
        ancho = int(w * alto / h)
    return im.resize((int(ancho), int(alto)), Image.LANCZOS)


def cubrir(im, w, h, foco=(0.5, 0.5)):
    """Recorta la imagen para llenar w x h (como background-size: cover)."""
    iw, ih = im.size
    k = max(w / iw, h / ih)
    r = im.resize((max(int(iw * k), w), max(int(ih * k), h)), Image.LANCZOS)
    x = int((r.width - w) * foco[0]); y = int((r.height - h) * foco[1])
    return r.crop((x, y, x + w, y + h))


def mascara_rr(w, h, r):
    m = Image.new("L", (w * 2, h * 2), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, w * 2 - 1, h * 2 - 1), r * 2, fill=255)
    return m.resize((w, h), Image.LANCZOS)


def mascara_arco(w, h):
    m = Image.new("L", (w * 2, h * 2), 0)
    d = ImageDraw.Draw(m)
    d.ellipse((0, 0, w * 2 - 1, w * 2 - 1), fill=255)
    d.rectangle((0, w, w * 2 - 1, h * 2 - 1), fill=255)
    return m.resize((w, h), Image.LANCZOS)


def mascara_circ(d):
    m = Image.new("L", (d * 2, d * 2), 0)
    ImageDraw.Draw(m).ellipse((0, 0, d * 2 - 1, d * 2 - 1), fill=255)
    return m.resize((d, d), Image.LANCZOS)


def con_mascara(foto, mascara):
    f = foto.convert("RGBA")
    f.putalpha(mascara)
    return f


def contorno(obj, g, col):
    a = obj.split()[3]
    pad = g * 2 + 4
    big = Image.new("L", (obj.width + pad * 2, obj.height + pad * 2), 0)
    big.paste(a, (pad, pad))
    m = big.filter(ImageFilter.GaussianBlur(g / 1.6)).point(lambda v: 255 if v > 14 else 0)
    m = m.filter(ImageFilter.GaussianBlur(0.8))
    out = Image.new("RGBA", big.size, col + (255,) if len(col) == 3 else col)
    out.putalpha(m)
    base = Image.new("RGBA", big.size, (0, 0, 0, 0))
    base.paste(obj, (pad, pad))
    return Image.alpha_composite(out, base)


def sombra_dura(obj, dx, dy, col):
    a = obj.split()[3]
    sil = Image.new("RGBA", obj.size, col + (255,))
    sil.putalpha(a)
    out = Image.new("RGBA", (obj.width + abs(dx), obj.height + abs(dy)), (0, 0, 0, 0))
    ox = max(dx, 0); oy = max(dy, 0)
    out.paste(sil, (ox, oy), sil)
    out.alpha_composite(obj, (ox - dx if dx > 0 else 0, oy - dy if dy > 0 else 0)) if False else None
    base = Image.new("RGBA", out.size, (0, 0, 0, 0))
    px = 0 if dx > 0 else -dx
    py = 0 if dy > 0 else -dy
    base.paste(obj, (px, py), obj)
    return Image.alpha_composite(out, base)


def sombra_suave(obj, blur=22, op=110, dy=18, col=(0, 0, 0)):
    pad = blur * 3
    a = obj.split()[3]
    big = Image.new("L", (obj.width + pad * 2, obj.height + pad * 2), 0)
    big.paste(a, (pad, pad + dy))
    big = big.filter(ImageFilter.GaussianBlur(blur)).point(lambda v: int(v * op / 255))
    sh = Image.new("RGBA", big.size, col + (255,))
    sh.putalpha(big)
    base = Image.new("RGBA", big.size, (0, 0, 0, 0))
    base.paste(obj, (pad, pad), obj)
    return Image.alpha_composite(sh, base)


def pegatina(obj, g=10, col=(255, 255, 255), suave=True):
    o = contorno(obj, g, col)
    return sombra_suave(o, 14, 100, 10) if suave else o


def rotar(obj, ang):
    return obj.rotate(ang, resample=Image.BICUBIC, expand=True) if ang else obj


def pegar(im, obj, cx, cy, ang=0, anchor="cm"):
    o = rotar(obj, ang)
    w, h = o.size
    ax, ay = anchor[0], anchor[1]
    x0 = cx if ax == "l" else (cx - w // 2 if ax == "c" else cx - w)
    y0 = cy if ay == "t" else (cy - h // 2 if ay == "m" else cy - h)
    im.paste(o, (int(x0), int(y0)), o)
    return (int(x0), int(y0), int(x0 + w), int(y0 + h))


# ---------------------------------------------------------------- efectos de color
def halftone(obj, celda=12, col=(20, 20, 20), fondo=None, ang=45, gamma=1.0, k=0.8, invertir=False):
    """Convierte un recorte en puntos de trama. Dibuja solo donde hay alfa."""
    obj = obj.convert("RGBA")
    w, h = obj.size
    gray = np.array(ImageOps.autocontrast(obj.convert("L"), cutoff=2)).astype(float) / 255.0
    if invertir:
        gray = 1 - gray
    S = 2
    m = Image.new("L", (w * S, h * S), 0)
    d = ImageDraw.Draw(m)
    a = math.radians(ang); ca, sa = math.cos(a), math.sin(a)
    diag = int(math.hypot(w, h) / celda) + 2
    cx0, cy0 = w / 2, h / 2
    for i in range(-diag, diag):
        for j in range(-diag, diag):
            u, v = i * celda, j * celda
            x = cx0 + u * ca - v * sa
            y = cy0 + u * sa + v * ca
            if 0 <= x < w and 0 <= y < h:
                lum = gray[int(y), int(x)]
                r = celda * k * (1 - lum) ** gamma
                if r > 0.6:
                    d.ellipse(((x - r) * S, (y - r) * S, (x + r) * S, (y + r) * S), fill=255)
    m = m.resize((w, h), Image.LANCZOS)
    alfa = obj.split()[3]
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    if fondo is not None:
        bg = Image.new("RGBA", (w, h), fondo + (255,))
        bg.putalpha(alfa)
        out = bg
    dots = Image.new("RGBA", (w, h), col + (255,))
    dots.putalpha(ImageChops.multiply(m, alfa))
    out.alpha_composite(dots)
    return out


def duotono(obj, osc, cla):
    obj = obj.convert("RGBA")
    g = ImageOps.autocontrast(obj.convert("L"), cutoff=1)
    col = ImageOps.colorize(g, osc, cla).convert("RGBA")
    col.putalpha(obj.split()[3])
    return col


def tinta(obj, col):
    s = Image.new("RGBA", obj.size, col + (255,))
    s.putalpha(obj.split()[3])
    return s


def grano(im, fuerza=14, op=0.5, seed=7):
    w, h = im.size
    n = Image.effect_noise((w, h), fuerza).convert("RGB")
    g = Image.blend(Image.new("RGB", (w, h), (128, 128, 128)), n, op)
    return ImageChops.overlay(im, g)


# ---------------------------------------------------------------- fondos
def lienzo(col):
    return Image.new("RGB", (W, H()), col)


def papel(col, seed=1, fibras=True, fuerza=10):
    w, h = W, H()
    rnd = np.random.RandomState(seed)
    base = np.ones((h, w, 3)) * np.array(col, dtype=float)
    lo = rnd.randn(h // 40 + 2, w // 40 + 2)
    lo = np.array(Image.fromarray(((lo - lo.min()) / (lo.max() - lo.min()) * 255).astype("uint8")).resize((w, h), Image.BICUBIC)).astype(float) / 255 - 0.5
    base += lo[..., None] * fuerza * 1.2
    hi = rnd.randn(h, w) * fuerza * 0.35
    base += hi[..., None]
    im = Image.fromarray(np.clip(base, 0, 255).astype("uint8"))
    if fibras:
        L = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        d = ImageDraw.Draw(L)
        r = random.Random(seed)
        for _ in range(int(w * h / 2200)):
            x, y = r.uniform(0, w), r.uniform(0, h)
            l = r.uniform(8, 34); a = r.uniform(0, math.pi)
            c = (255, 255, 255, 34) if r.random() < 0.5 else (60, 40, 20, 26)
            d.line((x, y, x + l * math.cos(a), y + l * math.sin(a)), fill=c, width=1)
        im = im.convert("RGBA"); im.alpha_composite(L); im = im.convert("RGB")
    return im


def cuadros(c1, c2, paso=96, op=0.55):
    """Mantel de cuadros (gingham): c1 fondo claro, c2 color del cuadro."""
    w, h = W, H()
    yy, xx = np.mgrid[0:h, 0:w]
    vx = ((xx // paso) % 2 == 0).astype(float)
    vy = ((yy // paso) % 2 == 0).astype(float)
    a = np.clip(vx * op + vy * op, 0, 1)
    a2 = a * 0 + np.where((vx > 0) & (vy > 0), op * 1.35, np.where((vx > 0) | (vy > 0), op * 0.85, 0))
    base = np.ones((h, w, 3)) * np.array(c1, dtype=float)
    col = np.array(c2, dtype=float)
    out = base * (1 - a2[..., None]) + col * a2[..., None]
    return Image.fromarray(np.clip(out, 0, 255).astype("uint8"))


def cuadricula(bg, linea, paso=54, grosor=2, margen=(0, 0)):
    im = Image.new("RGB", (W, H()), bg)
    d = ImageDraw.Draw(im)
    for x in range(margen[0] % paso, W, paso):
        d.line((x, 0, x, H()), fill=linea, width=grosor)
    for y in range(margen[1] % paso, H(), paso):
        d.line((0, y, W, y), fill=linea, width=grosor)
    return im


def puntos(bg, col, paso=34, r=4):
    S = 2
    m = Image.new("L", (W * S, H() * S), 0)
    d = ImageDraw.Draw(m)
    for y in range(0, H() + paso, paso):
        off = (paso // 2) if (y // paso) % 2 else 0
        for x in range(-paso, W + paso, paso):
            d.ellipse(((x + off - r) * S, (y - r) * S, (x + off + r) * S, (y + r) * S), fill=255)
    m = m.resize((W, H()), Image.LANCZOS)
    im = Image.new("RGB", (W, H()), bg)
    im.paste(Image.new("RGB", (W, H()), col), (0, 0), m)
    return im


def rayos(c1, c2, n=18, centro=(0.5, 0.45)):
    w, h = W, H()
    yy, xx = np.mgrid[0:h, 0:w]
    ang = np.arctan2(yy - h * centro[1], xx - w * centro[0])
    k = (np.floor((ang + math.pi) / (2 * math.pi) * n * 2) % 2).astype(bool)
    out = np.where(k[..., None], np.array(c1), np.array(c2)).astype("uint8")
    return Image.fromarray(out)


def diagonal(c1, c2, paso=60, ang=45):
    w, h = W, H()
    yy, xx = np.mgrid[0:h, 0:w]
    a = math.radians(ang)
    u = xx * math.cos(a) + yy * math.sin(a)
    k = (np.floor(u / paso) % 2).astype(bool)
    return Image.fromarray(np.where(k[..., None], np.array(c1), np.array(c2)).astype("uint8"))


def damero(c1, c2, paso=90):
    w, h = W, H()
    yy, xx = np.mgrid[0:h, 0:w]
    k = ((xx // paso + yy // paso) % 2).astype(bool)
    return Image.fromarray(np.where(k[..., None], np.array(c1), np.array(c2)).astype("uint8"))


def degradado(c1, c2, vertical=True):
    w, h = W, H()
    t = np.linspace(0, 1, h if vertical else w)
    t = t[:, None] if vertical else t[None, :]
    a = np.array(c1, dtype=float); b = np.array(c2, dtype=float)
    arr = a + (b - a) * t[..., None]
    arr = np.broadcast_to(arr, (h, w, 3))
    return Image.fromarray(arr.astype("uint8"))


def radial(c_centro, c_borde, cx=0.5, cy=0.4, r=0.9):
    w, h = W, H()
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.sqrt((xx - w * cx) ** 2 + (yy - h * cy) ** 2) / (w * r)
    t = np.clip(d, 0, 1)[..., None]
    arr = np.array(c_centro, dtype=float) * (1 - t) + np.array(c_borde, dtype=float) * t
    return Image.fromarray(arr.astype("uint8"))


# ---------------------------------------------------------------- dibujo suavizado
class AA:
    """Capa de dibujo con antialiasing (sobremuestreo x3) sobre una región del lienzo."""

    def __init__(s, im, box=None, k=3):
        s.im = im; s.k = k
        s.box = tuple(int(v) for v in (box or (0, 0, im.width, im.height)))
        x0, y0, x1, y1 = s.box
        s.L = Image.new("RGBA", ((x1 - x0) * k, (y1 - y0) * k), (0, 0, 0, 0))
        s.d = ImageDraw.Draw(s.L)

    def __enter__(s):
        return s

    def _p(s, pts):
        x0, y0 = s.box[0], s.box[1]
        return [((x - x0) * s.k, (y - y0) * s.k) for x, y in pts]

    def poly(s, pts, fill=None, outline=None, w=0):
        s.d.polygon(s._p(pts), fill=fill, outline=outline)
        if outline and w:
            p = s._p(pts)
            s.d.line(p + [p[0]], fill=outline, width=int(w * s.k), joint="curve")

    def line(s, pts, fill, w=4):
        p = s._p(pts)
        s.d.line(p, fill=fill, width=int(w * s.k), joint="curve")
        r = w * s.k / 2
        for x, y in (p[0], p[-1]):
            s.d.ellipse((x - r, y - r, x + r, y + r), fill=fill)

    def ellipse(s, bb, fill=None, outline=None, w=0):
        p = s._p([(bb[0], bb[1]), (bb[2], bb[3])])
        s.d.ellipse((p[0][0], p[0][1], p[1][0], p[1][1]), fill=fill, outline=outline, width=int(w * s.k))

    def rect(s, bb, fill=None, outline=None, w=0, r=0):
        p = s._p([(bb[0], bb[1]), (bb[2], bb[3])])
        if r:
            s.d.rounded_rectangle((p[0][0], p[0][1], p[1][0], p[1][1]), r * s.k, fill=fill, outline=outline, width=int(w * s.k))
        else:
            s.d.rectangle((p[0][0], p[0][1], p[1][0], p[1][1]), fill=fill, outline=outline, width=int(w * s.k))

    def __exit__(s, *a):
        out = s.L.resize(((s.box[2] - s.box[0]), (s.box[3] - s.box[1])), Image.LANCZOS)
        s.im.paste(out, (s.box[0], s.box[1]), out)


def estrella(aa, cx, cy, r1, r2, n=12, fill=None, outline=None, w=0, rot=0):
    pts = []
    for i in range(n * 2):
        r = r1 if i % 2 == 0 else r2
        a = rot + math.pi * i / n
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    aa.poly(pts, fill=fill, outline=outline, w=w)


def chispa(aa, cx, cy, r, col):
    pts = []
    for i in range(8):
        rr = r if i % 2 == 0 else r * 0.22
        a = math.pi / 4 * i - math.pi / 2
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    aa.poly(pts, fill=col)


def bezier(p0, p1, p2, n=40):
    return [((1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0],
             (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]) for t in [i / n for i in range(n + 1)]]


def flecha(im, p0, p1, curva=60, col=(20, 20, 20), w=6):
    mid = ((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2)
    dx, dy = p1[0] - p0[0], p1[1] - p0[1]
    l = math.hypot(dx, dy) or 1
    ctrl = (mid[0] - dy / l * curva, mid[1] + dx / l * curva)
    pts = bezier(p0, ctrl, p1)
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    box = (int(min(xs)) - 40, int(min(ys)) - 40, int(max(xs)) + 40, int(max(ys)) + 40)
    with AA(im, box) as aa:
        aa.line(pts, col, w)
        a = math.atan2(pts[-1][1] - pts[-4][1], pts[-1][0] - pts[-4][0])
        for s_ in (2.5, -2.5):
            aa.line([pts[-1], (pts[-1][0] - 34 * math.cos(a + 0.45 * s_ / 2.5), pts[-1][1] - 34 * math.sin(a + 0.45 * s_ / 2.5))], col, w)


def garabato(im, x0, x1, y, amp=10, col=(20, 20, 20), w=5, n=9):
    pts = []
    for i in range(n * 8 + 1):
        t = i / (n * 8)
        pts.append((x0 + (x1 - x0) * t, y + amp * math.sin(t * n * math.pi * 2)))
    with AA(im, (int(x0) - 10, int(y - amp) - 12, int(x1) + 10, int(y + amp) + 12)) as aa:
        aa.line(pts, col, w)


def marcador(im, bb, col, seed=0, pad=10, op=235):
    """Resaltado tipo marcador detrás de un texto (bb=(x0,y0,x1,y1))."""
    r = random.Random(seed)
    x0, y0, x1, y1 = bb[0] - pad, bb[1] - pad // 2, bb[2] + pad, bb[3] + pad // 2
    pts = [(x0 + r.uniform(-4, 4), y0 + r.uniform(-3, 3)), (x1 + r.uniform(-6, 6), y0 + r.uniform(-3, 3)),
           (x1 + r.uniform(-6, 6), y1 + r.uniform(-3, 3)), (x0 + r.uniform(-4, 4), y1 + r.uniform(-3, 3))]
    with AA(im, (int(x0) - 20, int(y0) - 20, int(x1) + 20, int(y1) + 20)) as aa:
        aa.poly(pts, fill=col + (op,))


def circulo_mano(im, bb, col, w=7, seed=0, vueltas=1.06):
    r = random.Random(seed)
    cx, cy = (bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2
    rx, ry = (bb[2] - bb[0]) / 2, (bb[3] - bb[1]) / 2
    pts = []
    a0 = r.uniform(0, 6.28)
    n = 90
    for i in range(int(n * vueltas) + 1):
        t = i / n
        a = a0 + t * 2 * math.pi
        k = 1 + 0.05 * math.sin(t * 5 + seed) + 0.04 * t
        pts.append((cx + rx * k * math.cos(a), cy + ry * k * math.sin(a)))
    with AA(im, (int(cx - rx - 40), int(cy - ry - 40), int(cx + rx + 40), int(cy + ry + 40))) as aa:
        aa.line(pts, col, w)


def subrayado(im, x0, x1, y, col, w=8, seed=0):
    r = random.Random(seed)
    pts = [(x0 + (x1 - x0) * i / 14, y + r.uniform(-3, 3)) for i in range(15)]
    with AA(im, (int(x0) - 10, int(y) - 14, int(x1) + 10, int(y) + 14)) as aa:
        aa.line(pts, col, w)


def rasgado(w, h, col, seed=0, borde=(250, 246, 236), amp=9, lados="tb", gb=7, grano_f=True):
    """Tira de papel rasgado (RGBA). Lados con borde irregular: t,b,l,r."""
    r = random.Random(seed)
    pad = 14
    W2, H2 = w + pad * 2, h + pad * 2

    def contorno_pts(inset, jit):
        pts = []
        xs = list(range(0, w + 1, 9)) + [w]
        ys = list(range(0, h + 1, 9)) + [h]
        for x in xs:  # arriba
            pts.append((pad + x, pad + inset + (r.uniform(0, jit) if "t" in lados else 0)))
        for y in ys:  # derecha
            pts.append((pad + w - inset - (r.uniform(0, jit) if "r" in lados else 0), pad + y))
        for x in reversed(xs):  # abajo
            pts.append((pad + x, pad + h - inset - (r.uniform(0, jit) if "b" in lados else 0)))
        for y in reversed(ys):  # izquierda
            pts.append((pad + inset + (r.uniform(0, jit) if "l" in lados else 0), pad + y))
        return pts
    m1 = Image.new("L", (W2, H2), 0); ImageDraw.Draw(m1).polygon(contorno_pts(0, amp), fill=255)
    m2 = Image.new("L", (W2, H2), 0); ImageDraw.Draw(m2).polygon(contorno_pts(gb, amp * 0.8), fill=255)
    m2 = ImageChops.multiply(m1, m2)
    out = Image.new("RGBA", (W2, H2), borde + (255,)); out.putalpha(m1.filter(ImageFilter.GaussianBlur(0.6)))
    core = Image.new("RGBA", (W2, H2), col + (255,)); core.putalpha(m2.filter(ImageFilter.GaussianBlur(0.6)))
    out.alpha_composite(core)
    if grano_f:
        n = Image.effect_noise((W2, H2), 12).convert("L")
        nn = Image.merge("RGBA", (n, n, n, Image.new("L", (W2, H2), 22)))
        nn.putalpha(ImageChops.multiply(out.split()[3], Image.new("L", (W2, H2), 22)))
        out.alpha_composite(nn)
    return out


def cinta(w, h, col=(250, 224, 130), ang=0, op=215):
    L = Image.new("RGBA", (w + 16, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(L)
    z = 6
    pts = [(8, 0)]
    for i in range(0, h, z * 2):
        pts.append((0, i + z)); pts.append((8, i + z * 2))
    pts2 = [(w + 8, 0)]
    for i in range(0, h, z * 2):
        pts2.append((w + 16, i + z)); pts2.append((w + 8, i + z * 2))
    d.polygon([(8, 0), (w + 8, 0), (w + 8, h), (8, h)], fill=col + (op,))
    d.polygon(pts + [(8, h)], fill=col + (op,))
    d.polygon(pts2 + [(w + 8, h)], fill=col + (op,))
    for x in range(14, w + 4, 18):
        d.line((x, 0, x + 6, h), fill=(255, 255, 255, 38), width=3)
    return rotar(L, ang)


def nota_adhesiva(w, h, col, ang=0, seed=0):
    pad = 24
    L = Image.new("RGBA", (w + pad * 2, h + pad * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(L)
    d.rectangle((pad, pad, pad + w, pad + h), fill=col + (255,))
    # degradado sutil abajo
    g = Image.new("L", (w, h), 0)
    gd = ImageDraw.Draw(g)
    for y in range(h):
        gd.line((0, y, w, y), fill=int(40 * (y / h) ** 2))
    dark = Image.new("RGBA", (w, h), (90, 60, 0, 255)); dark.putalpha(g)
    L.alpha_composite(dark, (pad, pad))
    # esquina doblada
    c = 54
    d.polygon([(pad + w - c, pad + h), (pad + w, pad + h - c), (pad + w, pad + h)], fill=(255, 255, 255, 0))
    return rotar(sombra_suave(L, 12, 100, 10), ang)


def polaroid(foto, ancho=520, pie="", ang=0, cinta_c=(250, 224, 130), pie_col=(40, 30, 20), cinta_on=True, marco_col=(252, 250, 244)):
    lado = int(ancho * 0.86)
    pw, ph = ancho, int(ancho * 1.22)
    P = Image.new("RGBA", (pw, ph), marco_col + (255,))
    f = cubrir(foto.convert("RGB"), lado, lado)
    P.paste(f, ((pw - lado) // 2, int(ancho * 0.07)))
    if pie:
        T(P, pie, "caveat", int(ancho * 0.11), pie_col, pw // 2, int(ancho * 0.07) + lado + int(ancho * 0.03), "ct", maxw=pw - 40)
    P = sombra_suave(P, 18, 120, 16)
    if cinta_on:
        c = cinta(int(ancho * 0.34), 40, cinta_c, -4)
        P.alpha_composite(c, (P.width // 2 - c.width // 2, 10)) if False else P.paste(c, (P.width // 2 - c.width // 2, 6), c)
    return rotar(P, ang)


def sello(im, lineas, cx, cy, r, fondo, tinta_c, ang=-10, forma="estrella", fuente="anton", borde=None, bw=0):
    """Sticker circular o de estrella con texto centrado."""
    caja = r * 2 + 40
    S = Image.new("RGBA", (caja, caja), (0, 0, 0, 0))
    with AA(S) as aa:
        c = caja / 2
        if forma == "estrella":
            estrella(aa, c, c, r, r * 0.84, 16, fill=fondo, outline=borde, w=bw)
        elif forma == "circulo":
            aa.ellipse((c - r, c - r, c + r, c + r), fill=fondo, outline=borde, w=bw)
        else:
            aa.rect((c - r, c - r * 0.8, c + r, c + r * 0.8), fill=fondo, outline=borde, w=bw, r=int(r * 0.18))
    n = len(lineas)
    tam = int(r * (0.46 if n == 1 else 0.38 if n == 2 else 0.31))
    bloque = Image.new("RGBA", (caja, caja), (0, 0, 0, 0))
    fs = F(fuente, tam)
    capa = capa_texto(lineas, fs, tinta_c, "center", int(tam * 1.02))
    if capa.width > r * 1.55:
        k = r * 1.55 / capa.width
        capa = capa.resize((int(capa.width * k), int(capa.height * k)), Image.LANCZOS)
    S.paste(capa, ((caja - capa.width) // 2, (caja - capa.height) // 2), capa)
    S = sombra_suave(S, 10, 90, 8) if forma != "caja" else S
    return pegar(im, S, cx, cy, ang)


def pie_marca(im, col, n, total, estilo="punto", y=None, fuente="montm", sombra=None):
    """Pie discreto dentro del marco: @usuario + progreso."""
    x0, y0, w, h = marco()
    y = y if y is not None else y0 + h - 6
    T(im, HANDLE, fuente, 25, col, x0, y, "lb")
    if estilo == "punto":
        gap = 22; tot = total * gap
        with AA(im, (x0 + w - tot - 10, y - 40, x0 + w + 10, y + 6)) as aa:
            for i in range(total):
                cx = x0 + w - tot + i * gap + 8
                aa.ellipse((cx - 6, y - 22, cx + 6, y - 10), fill=col + (255,) if i + 1 == n else col + (90,))
    elif estilo == "num":
        T(im, f"{n:02d}/{total:02d}", "mono", 25, col, x0 + w, y, "rb")
    elif estilo == "flecha":
        if n < total:
            T(im, "DESLIZA  →", "montx", 24, col, x0 + w, y, "rb", track=3)
        else:
            T(im, f"{n}/{total}", "montx", 24, col, x0 + w, y, "rb")


def guardar(im, ruta, calidad=90):
    os.makedirs(os.path.dirname(ruta), exist_ok=True)
    im.convert("RGB").save(ruta, quality=calidad)


def hoja_contacto(ims, salida, w=320):
    th = [i.resize((w, int(i.height * w / i.width)), Image.LANCZOS) for i in ims]
    S = Image.new("RGB", (len(th) * (w + 8) + 8, th[0].height + 16), (16, 16, 16))
    for k, t in enumerate(th):
        S.paste(t, (8 + k * (w + 8), 8))
    S.save(salida, quality=85)
