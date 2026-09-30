"""Día 8 v4: Mito vs realidad (nitritos) — empaques grandes."""
import os
from PIL import Image, ImageDraw, ImageFilter
import generador as g
import disenos as D
from generador import (W, anton, mont, ancho, centrar, envolver, pastilla, pie, terminar, empaque, pegar_producto,
                       capa, CREMA, OSCURO, DORADO)
from comunes import portada_packs
from contenido import WA, ENTREGA

ROJO = (196, 44, 26)
VERDE = (30, 120, 92)


def rojo_bg(h):
    return D._fondo(h, "receta", 0)


def emoji(ch, lado):
    from PIL import ImageFont
    f = ImageFont.truetype("/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf", 109)
    im = Image.new("RGBA", (136, 128), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((0, 0), ch, font=f, embedded_color=True)
    im = im.crop(im.getbbox())
    esc = lado / max(im.size)
    return im.resize((int(im.width * esc), int(im.height * esc)), Image.LANCZOS).filter(ImageFilter.UnsharpMask(2, 80, 3))


def medalla(b, ch, cx, cy, dia, col=None):
    ref = Image.open(f"{D.FOT}/d08_lamina2_ref.png").convert("RGB")
    cy0 = 308 if ch == "\U0001F44E" else 758
    m = ref.crop((450 - 105, cy0 - 105, 450 + 105, cy0 + 105))
    mk = Image.new("L", m.size, 0)
    ImageDraw.Draw(mk).ellipse((105 - 99, 105 - 99, 105 + 99, 105 + 99), fill=255)
    m = m.convert("RGBA"); m.putalpha(mk)
    lado = int(dia * 1.06)
    m = m.resize((lado, lado), Image.LANCZOS).filter(ImageFilter.UnsharpMask(2, 70, 3))
    sh = capa(); ImageDraw.Draw(sh).ellipse((cx - lado // 2, cy - lado // 2 + 8, cx + lado // 2, cy + lado // 2 + 8), fill=(0, 0, 0, 70))
    b.alpha_composite(sh.filter(ImageFilter.GaussianBlur(14)))
    b.alpha_composite(m, (cx - lado // 2, cy - lado // 2))


def vs():
    T, h, o = g.tt(), D.H(), D.oy()
    b = Image.new("RGBA", (W, h), ROJO + (255,))
    mid = h // 2
    top = g._radial((214, 52, 30), (110, 20, 12), 0.3, mid * 0.5, 1.1, h).convert("RGBA")
    bot = g._radial((40, 150, 112), (10, 60, 44), 0.3, mid * 1.5, 1.1, h).convert("RGBA")
    b.alpha_composite(top)
    mk = Image.new("L", (W, h), 0)
    ImageDraw.Draw(mk).polygon([(0, mid + 70), (W, mid - 70), (W, h), (0, h)], fill=255)
    bot.putalpha(mk)
    sh = Image.new("RGBA", (W, h), (0, 0, 0, 0)); sh.putalpha(mk.point(lambda v: int(v * 0.5)))
    b.alpha_composite(sh.filter(ImageFilter.GaussianBlur(20)), (0, -14))
    b.alpha_composite(bot)
    d = ImageDraw.Draw(b)
    fb = mont(40 if T else 37, "SemiBold")

    def bloque(y, etiqueta, col_chip, txt_chip, lineas, marca):
        d.ellipse((60, y, 160, y + 100), fill=col_chip)
        if marca == "x":
            d.line([(86, y + 26), (134, y + 74)], fill=txt_chip, width=13)
            d.line([(134, y + 26), (86, y + 74)], fill=txt_chip, width=13)
        else:
            d.line([(84, y + 52), (105, y + 74), (138, y + 30)], fill=txt_chip, width=13, joint="curve")
        d.text((185, y - 12), etiqueta, font=anton(104 if T else 100), fill=CREMA)
        yy = y + (140 if T else 128)
        for l in lineas:
            for ln in envolver(d, l, fb, 440 if T else 470):
                d.text((70, yy), ln, font=fb, fill=(255, 240, 226)); yy += int(fb.size * 1.36)
            yy += 14
    y1 = o + (130 if T else 70)
    bloque(y1, "MITO", DORADO, OSCURO, ["Todas las salchichas llevan nitritos", "Sin conservantes se daña enseguida"], "x")
    y2 = mid + 150 + (60 if T else 0)
    bloque(y2, "REALIDAD", CREMA, VERDE, ["La nuestra no lleva nitritos", "Congelada dura hasta 3 meses"], "ok")
    dia = 330 if T else 290
    medalla(b, "\U0001F44E", W - dia // 2 - 70, y1 + (250 if T else 230), dia, (150, 26, 14))
    medalla(b, "\U0001F44D", W - dia // 2 - 70, y2 + (250 if T else 230), dia, (20, 92, 66))
    d = ImageDraw.Draw(b)
    d.ellipse((W // 2 - 50, mid - 50, W // 2 + 50, mid + 50), fill=DORADO)
    centrar(d, mid - 44, "VS", anton(64), OSCURO, W // 2 - 50, W // 2 + 50)
    if not T:
        pie(d, CREMA, 2, 5)
    return terminar(b)


def portada_avatar():
    T, h, o = g.tt(), D.H(), D.oy()
    foto = Image.open(f"{D.FOT}/d08_avatar.png").convert("RGB")
    esc = W / foto.width
    ph = foto.resize((W, int(foto.height * esc)), Image.LANCZOS).filter(ImageFilter.UnsharpMask(2, 60, 3)).convert("RGBA")
    hs = ph.height
    # ventana: IG termina justo debajo del paquete; TikTok muestra más mostrador
    fin = int(1080 * esc) if not T else hs
    top = h - fin if T else 0
    if not T:
        # alto visible de foto = h - ext_sup; ext_sup = h - fin
        ext = h - fin
    else:
        ext = h - hs
    ext = max(ext, 0)
    b = Image.new("RGBA", (W, h), (255, 255, 255, 255))
    franja = ph.crop((0, 0, W, 6)).resize((W, ext + 6), Image.BILINEAR) if ext > 0 else None
    if franja is not None:
        b.paste(franja, (0, 0))
    y_foto = ext
    b.alpha_composite(ph.crop((0, 0, W, h - ext)), (0, y_foto))
    # suavizar la unión
    d = ImageDraw.Draw(b)
    pastilla(d, 0, o + (40 if T else 26), "NITRITOS EN LA SALCHICHA", mont(30 if T else 27, "ExtraBold"), ROJO, CREMA, centrado=True)
    tam = 250 if T else 152
    l1, l2 = "¿MITO O", "REALIDAD?"
    while ancho(d, l2, anton(tam)) > W - 110:
        tam -= 6
    y = o + (120 if T else 84)
    centrar(d, y, l1, anton(tam), ROJO)
    centrar(d, y + int(tam * 1.06), l2, anton(tam), OSCURO)
    b.alpha_composite(D.degradado_v(W, h, int(h * 0.80), h, (12, 8, 6), 0, 120))
    d = ImageDraw.Draw(b)
    if not T:
        pastilla(d, 0, h - 112, "DESLIZA  \u2192", mont(28, "ExtraBold"), CREMA, OSCURO, centrado=True)
        pie(d, CREMA, 1, 5)
    return terminar(b)


def foto_titulo(archivo, lineas, cuerpo, n, total, cy=0.0, modo=None, tam_ig=150, tam_tt=180, cx=0.5, chip=None):
    """Foto a pantalla completa con titulo multilinea arriba y texto abajo."""
    T, h, o = g.tt(), D.H(), D.oy()
    foto = Image.open(f"{D.FOT}/{archivo}").convert("RGB")
    esc = W / foto.width
    hs = int(foto.height * esc)
    ph = foto.resize((W, hs), Image.LANCZOS).filter(ImageFilter.UnsharpMask(2, 60, 3)).convert("RGBA")
    if modo == "ancho" and hs < h:
        b = D.llenar(foto, W, h, 0.5, 0.5).filter(ImageFilter.GaussianBlur(28)).convert("RGBA")
        m = Image.new("L", (W, hs), 255)
        f = 90
        for k in range(f):
            v = int(255 * k / f)
            ImageDraw.Draw(m).line((0, k, W, k), fill=v)
            ImageDraw.Draw(m).line((0, hs - 1 - k, W, hs - 1 - k), fill=v)
        ph.putalpha(m)
        b.alpha_composite(ph, (0, (h - hs) // 2))
    elif hs >= h:
        y0 = int((hs - h) * cy)
        b = ph.crop((0, y0, W, y0 + h))
    else:
        b = D.llenar(foto, W, h, cx, cy).convert("RGBA")
    b.alpha_composite(D.degradado_v(W, h, 0, int(h * (0.30 if T else 0.34)), (10, 6, 5), 215, 0))
    b.alpha_composite(D.degradado_v(W, h, int(h * (0.54 if T else 0.60)), h, (10, 6, 5), 0, 245))
    d = ImageDraw.Draw(b)
    tam = tam_tt if T else tam_ig
    while max(ancho(d, t, anton(tam)) for t, _ in lineas) > W - 120:
        tam -= 6
    y = o + (90 if T else 60)
    if chip:
        pastilla(d, 70, y, chip, mont(30 if T else 28, "ExtraBold"), OSCURO, DORADO)
        y += 80
    for txt, col in lineas:
        d.text((66, y), txt, font=anton(tam), fill=col, stroke_width=3, stroke_fill=(20, 10, 8)); y += int(tam * 1.1)
    fc = mont(44 if T else 40, "SemiBold")
    lin = g._lineas(d, cuerpo, fc, W - 160)
    fondo = 1490 if T else h - 120
    yy = fondo - len(lin) * int(fc.size * 1.4)
    for l in lin:
        d.text((80, yy), l, font=fc, fill=(250, 240, 226)); yy += int(fc.size * 1.4)
    if not T:
        pie(d, CREMA, n, total)
    return terminar(b)


def cierre_mesa(titulo, lineas, boton, total, fotos=(2, 3, 1)):
    T, h, o = g.tt(), D.H(), D.oy()
    foto = Image.open(f"{D.FOT}/d08_mesa.png").convert("RGB")
    b = D.llenar(foto, W, h, 0.5, 0.5).filter(ImageFilter.GaussianBlur(7)).convert("RGBA")
    b.alpha_composite(Image.new("RGBA", (W, h), (8, 10, 12, 150)))
    b.alpha_composite(D.viñeta if False else Image.new("RGBA", (W, h), (0, 0, 0, 0)))
    d = ImageDraw.Draw(b)
    ft = anton(150 if T else 138)
    y = o + (50 if T else 80)
    for l in g._lineas(d, titulo, ft, W - 120):
        centrar(d, y, l, ft, CREMA); y += int(ft.size * 1.12)
    alto = 560 if T else 420
    cy = max(y + alto // 2 + 20, o + (700 if T else 690))
    ps = [empaque(k, alto, a) for k, a in zip(fotos, (14, -14, 0))]
    pos = [(W / 2 - 260, cy + 40), (W / 2 + 260, cy + 40), (W / 2, cy)]
    for p, (px, py) in zip(ps, pos):
        pegar_producto(b, p, (int(px - p.width / 2), int(py - p.height / 2)), brillo=(255, 235, 200))
    d = ImageDraw.Draw(b)
    yb = int(cy + alto / 2 + 40)
    pastilla(d, 0, yb, boton, mont(42 if T else 38, "ExtraBold"), DORADO, OSCURO, pad=40, centrado=True)
    yy = yb + 110
    for l in lineas:
        fl = mont(34 if T else 30, "Bold")
        centrar(d, yy, l, fl, CREMA); yy += int(fl.size * 1.4)
    if not T:
        pie(d, CREMA, total, total)
    return terminar(b)


def texto_pack(lineas, sub, n, total, pack, fondo, col_pack=-10, tint=(6, 4, 4, 50)):
    T, h, o = g.tt(), D.H(), D.oy()
    b = fondo(h)
    b.alpha_composite(Image.new("RGBA", (W, h), tint))
    d = ImageDraw.Draw(b)
    tam = 190 if T else 158
    while max(ancho(d, t, anton(tam)) for t, _ in lineas) > W - 150:
        tam -= 6
    y = o + (150 if T else 110)
    for txt, col in lineas:
        d.text((70, y), txt, font=anton(tam), fill=col); y += int(tam * 1.12)
    y += 34
    fs = mont(44 if T else 38, "SemiBold")
    for l in envolver(d, sub, fs, 470):
        d.text((74, y), l, font=fs, fill=(244, 232, 216)); y += int(fs.size * 1.4)
    alto = 740 if T else 600
    p = empaque(pack, alto, col_pack)
    cy = min(h - alto // 2 + 20, y + 30 + alto // 2)
    pegar_producto(b, p, (W - p.width + 5, int(cy - p.height // 2)), brillo=(255, 200, 120))
    d = ImageDraw.Draw(b)
    if not T:
        pie(d, CREMA, n, total)
    return terminar(b)


def laminas():
    total = 5
    return [
        portada_avatar,
        vs,
        lambda: foto_titulo("d08_nitritos.png", [("¿QUÉ SON LOS", CREMA), ("NITRITOS?", DORADO)],
                            "Aditivos que se usan en muchos embutidos para conservar el color y alargar la vida del producto.",
                            3, total, cy=0.0, modo="ancho" if g.tt() else None),
        lambda: foto_titulo("d08_mesa.png", [("¿QUÉ LLEVA", CREMA), ("LA NUESTRA?", DORADO)],
                            "Carne magra de cerdo, sal, pimienta y semillas de hinojo. Molida, aderezada y embutida a mano.",
                            4, total, cy=0.42),
        lambda: cierre_mesa("COMENTA OTRO\nMITO", ["Lo aclaramos en el próximo post", "Pide por WhatsApp", WA],
                            "ESCRÍBENOS POR WHATSAPP", total),
    ]


def render(salida="dia08_v4"):
    for fmt, carpeta in (("ig", salida), ("tt", salida + "_tt")):
        g.usar_formato(fmt)
        os.makedirs(carpeta, exist_ok=True)
        ims = []
        for i, f in enumerate(laminas(), 1):
            im = f()
            im.save(f"{carpeta}/{i:02d}.jpg", quality=90)
            ims.append(im)
        w = 360 if fmt == "ig" else 300
        th = [im.resize((w, int(im.height * w / im.width))) for im in ims]
        S = Image.new("RGB", (len(th) * (w + 8), th[0].height), (20, 20, 20))
        for k, t in enumerate(th):
            S.paste(t, (k * (w + 8), 0))
        S.save(f"/tmp/dia08_v4_{fmt}.jpg", quality=85)
        print(fmt, len(ims))


if __name__ == "__main__":
    render()
