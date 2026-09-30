"""Piezas compartidas v4: portada con empaques grandes."""
from PIL import Image, ImageDraw, ImageFilter
import generador as g
import disenos as D
from generador import (W, anton, mont, ancho, centrar, sticker, pastilla, pie, terminar, empaque, pegar_producto,
                       CREMA, OSCURO, DORADO)


def portada_packs(l1, l2, etiqueta, sello, packs, fondo, total, brillo=(255, 170, 70), glow=(255, 170, 70, 120)):
    """packs = [(n_empaque, dx, dy, ang, escala)] centrados en la mitad baja. fondo: fn(h) -> RGBA."""
    T, h, o = g.tt(), D.H(), D.oy()
    b = fondo(h)
    gl = Image.new("RGBA", (W, h), (0, 0, 0, 0))
    ImageDraw.Draw(gl).ellipse((60, int(h * 0.42), W - 60, int(h * 0.98)), fill=glow)
    b.alpha_composite(gl.filter(ImageFilter.GaussianBlur(110)))
    alto = 620 if T else 560
    cy = int(h * (0.68 if T else 0.69))
    for k, dx, dy, ang, esc in packs:
        p = empaque(k, int(alto * esc), ang)
        pegar_producto(b, p, (W // 2 + dx - p.width // 2, cy + dy - p.height // 2), brillo=brillo)
    d = ImageDraw.Draw(b)
    pastilla(d, 0, o + (28 if T else 50), etiqueta, mont(30 if T else 27, "ExtraBold"), DORADO, OSCURO, centrado=True)
    tam = 300 if T else 225
    while ancho(d, l1, anton(tam)) > W - 100:
        tam -= 6
    centrar(d, o + (100 if T else 105), l1, anton(tam), CREMA)
    t2 = int(tam * 0.56)
    while ancho(d, l2, anton(t2)) > W - 100:
        t2 -= 4
    centrar(d, o + (100 if T else 105) + int(tam * 1.13), l2, anton(t2), DORADO)
    sticker(b, sello, 900, int(h * 0.88), 106, DORADO, OSCURO, 10)
    d = ImageDraw.Draw(b)
    if not T:
        pastilla(d, 0, h - 112, "DESLIZA  →", mont(28, "ExtraBold"), CREMA, OSCURO, centrado=True)
        pie(d, CREMA, 1, total)
    return terminar(b)


def pegar_empaque_en(im, n, cy_rel, alto_rel, ang=0, dx=0, brillo=(255, 200, 120)):
    im = im.convert("RGBA")
    h = im.height
    p = empaque(n, int(h * alto_rel), ang)
    pegar_producto(im, p, (im.width // 2 + dx - p.width // 2, int(h * cy_rel) - p.height // 2), brillo=brillo)
    return im.convert("RGB")
