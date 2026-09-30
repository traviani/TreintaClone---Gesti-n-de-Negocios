"""Día 4 v4: Domingo de familia — empaques grandes, sin repetir foto."""
import os
from PIL import Image, ImageDraw, ImageFilter
import generador as g
import disenos as D
from generador import (W, anton, mont, ancho, centrar, envolver, sticker, pastilla, pie, terminar, capa, empaque,
                       pegar_producto, CREMA, OSCURO, DORADO)
from contenido import WA

CRE, DOR = g.CREMA, g.DORADO
ROJO = (196, 44, 26)


def portada():
    T, h, o = g.tt(), D.H(), D.oy()
    b = D._mesa_oscura(h, 4, 70)
    glow = Image.new("RGBA", (W, h), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse((60, int(h * 0.42), W - 60, int(h * 0.98)), fill=(255, 170, 70, 120))
    b.alpha_composite(glow.filter(ImageFilter.GaussianBlur(110)))
    alto = 620 if T else 560
    cy = int(h * (0.68 if T else 0.69))
    for k, dx, dy, ang in ((3, -300, 60, 12), (2, 300, 60, -12), (5, 0, -10, 0)):
        p = empaque(k, alto if k == 5 else int(alto * 0.88), ang)
        pegar_producto(b, p, (W // 2 + dx - p.width // 2, cy + dy - p.height // 2), brillo=(255, 170, 70))
    d = ImageDraw.Draw(b)
    D.pastilla(d, 0, o + (28 if T else 50), "EL MEJOR PLAN", mont(30 if T else 27, "ExtraBold"), DORADO, OSCURO, centrado=True)
    tam = 300 if T else 225
    while ancho(d, "DOMINGO", anton(tam)) > W - 100:
        tam -= 6
    centrar(d, o + (100 if T else 105), "DOMINGO", anton(tam), CREMA)
    t2 = int(tam * 0.56)
    centrar(d, o + (100 if T else 105) + int(tam * 1.13), "DE FAMILIA", anton(t2), DORADO)
    sticker(b, ["PARA", "TODA LA", "FAMILIA"], 900, int(h * 0.88), 106, DORADO, OSCURO, 10)
    d = ImageDraw.Draw(b)
    if not T:
        pastilla(d, 0, h - 112, "DESLIZA  →", mont(28, "ExtraBold"), CREMA, OSCURO, centrado=True)
        pie(d, CREMA, 1, 5)
    return terminar(b)


def texto_con_empaque():
    T, h, o = g.tt(), D.H(), D.oy()
    b = D._mesa_oscura(h, 11, 105)
    d = ImageDraw.Draw(b)
    lineas = [("EL DOMINGO", CRE), ("NO ES DOMINGO", CRE), ("SIN ESTO.", DOR)]
    tam = 190 if T else 158
    while max(ancho(d, t, anton(tam)) for t, _ in lineas) > W - 150:
        tam -= 6
    y = o + (150 if T else 110)
    for txt, col in lineas:
        d.text((70, y), txt, font=anton(tam), fill=col); y += int(tam * 1.12)
    y += 10
    fs = mont(46 if T else 40, "SemiBold")
    for l in envolver(d, "La parrilla prendida y todos en la mesa.", fs, W - 200):
        d.text((74, y), l, font=fs, fill=(244, 232, 216)); y += int(fs.size * 1.4)
    alto = 760 if T else 600
    p = empaque(2, alto, -10)
    cy = min(h - alto // 2 + 10, y + 40 + alto // 2)
    pegar_producto(b, p, (W // 2 + 120 - p.width // 2, int(cy - p.height // 2)), brillo=(255, 150, 60))
    d = ImageDraw.Draw(b)
    if not T:
        pie(d, CREMA, 2, 5)
    return terminar(b)


def cantidades():
    T, h, o = g.tt(), D.H(), D.oy()
    b = D._mesa_oscura(h, 6)
    d = ImageDraw.Draw(b)
    ft = anton(108 if T else 92)
    y = o + (30 if T else 60)
    for l in "¿CUÁNTOS\nPAQUETES PIDO?".split("\n"):
        d.text((70, y), l, font=ft, fill=CREMA); y += int(ft.size * 1.1)
    y += 22
    alto = 330 if T else 272
    sab = (5, 2, 1, 3)
    for pers, paq in ((4, 2), (6, 3), (8, 4)):
        cl = capa()
        ImageDraw.Draw(cl).rounded_rectangle((50, y + 12, W - 50, y + alto + 12), 36, fill=(0, 0, 0, 120))
        b.alpha_composite(cl.filter(ImageFilter.GaussianBlur(14)))
        ImageDraw.Draw(b).rounded_rectangle((50, y, W - 50, y + alto), 36, fill=CREMA)
        ImageDraw.Draw(b).rounded_rectangle((50, y, 330, y + alto), 36, fill=ROJO)
        ImageDraw.Draw(b).rectangle((290, y, 330, y + alto), fill=ROJO)
        d = ImageDraw.Draw(b)
        centrar(d, y + alto * 0.12, str(pers), anton(170 if T else 140), CREMA, 50, 330)
        centrar(d, y + alto * 0.12 + (190 if T else 158), "PERSONAS", mont(28, "ExtraBold"), (255, 226, 200), 50, 330)
        ph = int(alto * 0.96)
        ps = [empaque(sab[k], ph, (-6, 4, -3, 6)[k]) for k in range(paq)]
        paso = int(ps[0].width * 0.58)
        x = 350
        for p in ps:
            pegar_producto(b, p, (x, int(y + (alto - p.height) // 2)))
            x += paso
        d = ImageDraw.Draw(b)
        et = f"{paq} PAQUETES"
        pastilla(d, W - 70 - ancho(d, et, mont(28, "ExtraBold")) - 52, y + alto - 62, et, mont(28, "ExtraBold"), OSCURO, CREMA, pad=26)
        y += alto + 24
    if not T:
        pie(d, CREMA, 4, 5)
    return terminar(b)


def laminas():
    esp = D.cargar("espiral.png")
    total = 5
    return [
        portada,
        texto_con_empaque,
        lambda: D.lamina_split(esp, (0, 90, 554, 470), "EL DOMINGO PERFECTO LLEVA",
                               "La familia en la mesa, sin apuro. La parrilla prendida desde temprano. Y pan calientito para armar el sándwich.",
                               3, total, ROJO),
        cantidades,
        lambda: D.lamina_cierre_parrilla("DELIVERY\nGRATIS", ["Desde 4 paquetes", "Despachos solo en Caracas", WA],
                                         "PIDE PARA ESTE DOMINGO", total, fotos=(5, 3, 2), fondo="mesa"),
    ]


def render(salida="dia04_v4"):
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
        S.save(f"/tmp/dia04_v4_{fmt}.jpg", quality=85)
        print(fmt, len(ims))


if __name__ == "__main__":
    render()
