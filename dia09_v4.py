"""Día 9 v4: Arepa con Tradizionale — el plato protagonista y el paquete grande."""
import os
from PIL import Image
import generador as g
import disenos as D
from dia08_v4 import foto_titulo
from dia02_v4 import lista_con_empaque
from contenido import WA, ENTREGA

g.FACTOR = 1.4  # textos más grandes para verse bien en el teléfono
ROJO = (196, 44, 26)
CRE, DOR = g.CREMA, g.DORADO


def ingredientes():
    from PIL import ImageDraw, ImageFilter
    from generador import W, anton, mont, pastilla, pie, terminar, CREMA, OSCURO, DORADO
    T, h, o = g.tt(), D.H(), D.oy()
    foto = Image.open(f"{D.FOT}/d09_ingredientes.png").convert("RGB")
    b = D.llenar(foto, W, h, 0.5, 0.40 if not T else 0.5).convert("RGBA")
    b.alpha_composite(D.degradado_v(W, h, 0, int(h * 0.26), (10, 6, 5), 215, 0))
    b.alpha_composite(D.degradado_v(W, h, int(h * (0.44 if T else 0.50)), h, (10, 6, 5), 0, 248))
    d = ImageDraw.Draw(b)
    ft = anton(150 if T else 140)
    d.text((66, o + (80 if T else 40)), "INGREDIENTES", font=ft, fill=CRE, stroke_width=3, stroke_fill=(20, 10, 8))
    fb = mont(44 if T else 40, "SemiBold")
    bloques = [("PARA LA AREPA", "Harina de maíz, sal y agua."),
               ("PARA RELLENAR", "Queso mozzarella, tomate y salchicha siciliana Traviani.")]
    alto = 0
    for et, tx in bloques:
        alto += 90 + len(g._lineas(d, tx, fb, W - 160)) * int(fb.size * 1.36) + 26
    y = (1490 if T else h - 110) - alto
    for et, tx in bloques:
        pastilla(d, 70, y, et, mont(30, "ExtraBold"), DOR, OSCURO)
        y += 92
        for l in g._lineas(d, tx, fb, W - 160):
            d.text((76, y), l, font=fb, fill=(250, 240, 226)); y += int(fb.size * 1.36)
        y += 26
    if not T:
        pie(d, CRE, 2, 5)
    return terminar(b)


def laminas():
    total = 5
    return [
        lambda: foto_titulo("arepa_limpia.png", [("SALCHICHA", CRE), ("SICILIANA", DOR)],
                            "Arepa con Tradizionale: el desayuno venezolano con acento siciliano.", 1, total,
                            cy=0.12, cx=0.3, chip="AREPA · 10 MIN"),
        ingredientes,
        lambda: foto_titulo("d09_arepas_asando.png", [("PASO 1", DOR), ("A LA SARTÉN", CRE)],
                            "Arepas en el budare o sartén a fuego medio. La salchicha, 12 a 15 minutos volteando, hasta que esté bien cocida.",
                            3, total, modo="ancho", tam_ig=140, tam_tt=160),
        lambda: foto_titulo("arepa_limpia.png", [("PASO 2", DOR), ("RELLENA", CRE)],
                            "Rodajas finas dentro de la arepa abierta, con queso blanco y aguacate si quieres.",
                            4, total, cy=0.5, cx=0.3),
        lambda: D.lamina_cierre_parrilla("PIDE TU\nTRADIZIONALE", ENTREGA + [WA], "PIDE DIRECTO CON NOSOTROS", total,
                                         fotos=(2, 5, 1), fondo="ambar"),
    ]


def render(salida="dia09_v4"):
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
        S.save(f"/tmp/dia09_v4_{fmt}.jpg", quality=85)
        print(fmt, len(ims))


if __name__ == "__main__":
    render()
