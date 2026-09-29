"""Generador de carruseles Il Siciliano Gourmet / Traviani (1080x1350)."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

W, H = 1080, 1350
FONTS = "/home/claude/fonts"
FOTOS = "/home/claude/fotos"
CREMA = (246, 241, 231)
OSCURO = (38, 24, 20)
DORADO = (224, 170, 60)
HANDLE = "@ilsicilianogourmet_"

SABORES = {
    "FINOCCHIO":    dict(foto="1.jpeg", color=(141, 186, 58)),
    "TRADIZIONALE": dict(foto="2.jpeg", color=(214, 36, 110)),
    "PEPERONCINO":  dict(foto="3.jpeg", color=(208, 38, 30)),
    "PECORINO":     dict(foto="4.jpeg", color=(38, 170, 160)),
    "PARRILLERA":   dict(foto="5.jpeg", color=(226, 172, 52)),
}


def anton(size):
    return ImageFont.truetype(f"{FONTS}/Anton-Regular.ttf", size)


def mont(size, peso="Bold"):
    f = ImageFont.truetype(f"{FONTS}/Montserrat%5Bwght%5D.ttf", size)
    f.set_variation_by_name(peso)
    return f


def centrar(d, y, texto, fuente, color):
    w = d.textlength(texto, font=fuente)
    d.text(((W - w) / 2, y), texto, font=fuente, fill=color)


def envolver(d, texto, fuente, ancho):
    lineas, actual = [], ""
    for p in texto.split():
        prueba = (actual + " " + p).strip()
        if d.textlength(prueba, font=fuente) <= ancho:
            actual = prueba
        else:
            lineas.append(actual)
            actual = p
    lineas.append(actual)
    return lineas


def foto_redondeada(nombre, lado, radio=40):
    im = Image.open(f"{FOTOS}/{nombre}").convert("RGB").resize((lado, lado), Image.LANCZOS)
    m = Image.new("L", (lado, lado), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, lado, lado), radio, fill=255)
    return im, m


def pegar_con_sombra(lienzo, im, mascara, xy):
    sombra = Image.new("RGBA", (im.width + 80, im.height + 80), (0, 0, 0, 0))
    ImageDraw.Draw(sombra).rounded_rectangle((40, 50, im.width + 40, im.height + 50), 40, fill=(0, 0, 0, 90))
    sombra = sombra.filter(ImageFilter.GaussianBlur(22))
    lienzo.paste(sombra, (xy[0] - 40, xy[1] - 40), sombra)
    lienzo.paste(im, xy, mascara)


def pie(d, color, n=None, total=None):
    f = mont(26, "SemiBold")
    d.text((70, H - 80), HANDLE, font=f, fill=color)
    if n:
        t = f"{n}/{total}"
        d.text((W - 70 - d.textlength(t, font=f), H - 80), t, font=f, fill=color)


def portada(titulo1, titulo2, subtitulo, total):
    im = Image.new("RGB", (W, H), OSCURO)
    d = ImageDraw.Draw(im)
    centrar(d, 120, "TRAVIANI", mont(34, "ExtraBold"), DORADO)
    centrar(d, 200, titulo1, anton(190), CREMA)
    centrar(d, 400, titulo2, anton(118), DORADO)
    lado, sep = 184, 16
    x0 = (W - (5 * lado + 4 * sep)) // 2
    for i, s in enumerate(SABORES.values()):
        f, m = foto_redondeada(s["foto"], lado, 28)
        pegar_con_sombra(im, f, m, (x0 + i * (lado + sep), 660))
    fs = mont(40, "Medium")
    for i, l in enumerate(envolver(d, subtitulo, fs, 860)):
        centrar(d, 920 + i * 56, l, fs, CREMA)
    centrar(d, 1130, "DESLIZA  →", mont(34, "ExtraBold"), DORADO)
    pie(d, (150, 130, 120), 1, total)
    return im


def lamina_sabor(nombre, descripcion, ideal, n, total):
    s = SABORES[nombre]
    im = Image.new("RGB", (W, H), CREMA)
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, W, 700), fill=s["color"])
    f, m = foto_redondeada(s["foto"], 620)
    pegar_con_sombra(im, f, m, ((W - 620) // 2, 110))
    centrar(d, 770, nombre, anton(130), OSCURO)
    fd = mont(40, "Medium")
    y = 950
    for l in envolver(d, descripcion, fd, 900):
        centrar(d, y, l, fd, OSCURO)
        y += 54
    y += 30
    fi = mont(34, "Bold")
    txt = f"IDEAL PARA: {ideal.upper()}"
    w = d.textlength(txt, font=fi)
    d.rounded_rectangle(((W - w) / 2 - 30, y - 14, (W + w) / 2 + 30, y + 58), 36, fill=s["color"])
    centrar(d, y, txt, fi, (255, 255, 255))
    pie(d, (120, 100, 90), n, total)
    return im


def lamina_lista(titulo, items, nota, n, total):
    im = Image.new("RGB", (W, H), OSCURO)
    d = ImageDraw.Draw(im)
    centrar(d, 130, titulo, anton(120), DORADO)
    fi = mont(48, "Bold")
    y = 400
    for it in items:
        d.ellipse((150, y + 8, 196, y + 54), fill=DORADO)
        d.line([(161, y + 32), (170, y + 42), (186, y + 21)], fill=OSCURO, width=6, joint="curve")
        d.text((230, y), it, font=fi, fill=CREMA)
        y += 120
    fn = mont(38, "Medium")
    y += 40
    for l in envolver(d, nota, fn, 860):
        centrar(d, y, l, fn, (210, 195, 180))
        y += 54
    pie(d, (150, 130, 120), n, total)
    return im


def lamina_cta(titulo, lineas, boton, n, total):
    im = Image.new("RGB", (W, H), DORADO)
    d = ImageDraw.Draw(im)
    y = 200
    for t in titulo:
        centrar(d, y, t, anton(150), OSCURO)
        y += 190
    fl = mont(42, "SemiBold")
    y += 40
    for l in lineas:
        centrar(d, y, l, fl, OSCURO)
        y += 70
    fb = mont(46, "ExtraBold")
    w = d.textlength(boton, font=fb)
    y += 50
    d.rounded_rectangle(((W - w) / 2 - 50, y - 20, (W + w) / 2 + 50, y + 80), 50, fill=OSCURO)
    centrar(d, y, boton, fb, CREMA)
    pie(d, OSCURO, n, total)
    return im
