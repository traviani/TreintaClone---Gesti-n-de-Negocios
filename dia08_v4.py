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


def medalla(b, ch, cx, cy, dia, col):
    sh = capa(); ImageDraw.Draw(sh).ellipse((cx - dia // 2, cy - dia // 2 + 16, cx + dia // 2, cy + dia // 2 + 16), fill=(0, 0, 0, 130))
    b.alpha_composite(sh.filter(ImageFilter.GaussianBlur(16)))
    dd = ImageDraw.Draw(b)
    dd.ellipse((cx - dia // 2 - 12, cy - dia // 2 - 12, cx + dia // 2 + 12, cy + dia // 2 + 12), fill=CREMA)
    dd.ellipse((cx - dia // 2, cy - dia // 2, cx + dia // 2, cy + dia // 2), fill=col)
    e = emoji(ch, int(dia * 0.62))
    b.alpha_composite(e, (cx - e.width // 2, cy - e.height // 2 + 4))


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
        lambda: portada_packs("¿MITO O", "REALIDAD?", "NITRITOS EN LA SALCHICHA", ["LA", "VERDAD"],
                              [(2, -290, 50, -12, 0.82), (1, 290, 50, 12, 0.82), (3, 0, -10, 0, 1.0)],
                              rojo_bg, total, brillo=(255, 220, 160), glow=(255, 150, 80, 130)),
        vs,
        lambda: texto_pack([("¿QUÉ SON", CREMA), ("LOS", CREMA), ("NITRITOS?", DORADO)],
                           "Aditivos que se usan en muchos embutidos para conservar el color y alargar la vida del producto.",
                           3, total, 4, D.teal_bg, 10),
        lambda: D.lamina_producto_split(5, "¿QUÉ LLEVA LA NUESTRA?",
                                        "Carne seleccionada, especias y sabor. Molida, aderezada y embutida a mano.",
                                        4, total, VERDE, None, fondo="teal"),
        lambda: D.lamina_cierre_parrilla("COMENTA OTRO\nMITO", ["Lo aclaramos en el próximo post", "Pide por WhatsApp", WA],
                                         "ESCRÍBENOS POR WHATSAPP", total, fotos=(2, 3, 1), fondo="teal"),
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
