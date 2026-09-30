"""Día 7 v4: para restaurantes y pizzerías de Caracas — empaques grandes."""
import os
from PIL import Image, ImageDraw
import generador as g
import disenos as D
from generador import (W, anton, mont, ancho, centrar, envolver, pie, terminar, empaque, pegar_producto, CREMA, DORADO)
from comunes import portada_packs
from dia02_v4 import lista_con_empaque
from contenido import WA

CRE, DOR = g.CREMA, g.DORADO
AZUL = (40, 96, 190)


def azul(h, seed=0):
    return D._fondo(h, "azul", seed)


def texto_con_empaque():
    T, h, o = g.tt(), D.H(), D.oy()
    b = azul(h, 11)
    b.alpha_composite(Image.new("RGBA", (W, h), (6, 10, 30, 70)))
    d = ImageDraw.Draw(b)
    lineas = [("¿QUIERES ALGO", CRE), ("QUE NADIE MÁS", CRE), ("TIENE EN", CRE), ("TU CARTA?", DOR)]
    tam = 190 if T else 158
    while max(ancho(d, t, anton(tam)) for t, _ in lineas) > W - 150:
        tam -= 6
    y = o + (150 if T else 110)
    for txt, col in lineas:
        d.text((70, y), txt, font=anton(tam), fill=col); y += int(tam * 1.12)
    y += 10
    fs = mont(46 if T else 40, "SemiBold")
    for l in envolver(d, "Un ingrediente que hace distinta tu pizza.", fs, 500 if not T else 520):
        d.text((74, y), l, font=fs, fill=(244, 232, 216)); y += int(fs.size * 1.4)
    alto = 820 if T else 620
    p = empaque(1, alto, -10)
    cy = min(h - alto // 2 + 20, y + 30 + alto // 2)
    pegar_producto(b, p, (W - p.width + 5, int(cy - p.height // 2)), brillo=(255, 200, 120))
    d = ImageDraw.Draw(b)
    if not T:
        pie(d, CREMA, 2, 6)
    return terminar(b)


def laminas():
    total = 6
    return [
        lambda: portada_packs("DIFERENCIA", "TU CARTA", "PARA NEGOCIOS · CARACAS", ["HECHA", "A MANO", "EN CARACAS"],
                              [(3, -290, 40, -10, 0.84), (1, 290, 40, 10, 0.84), (5, 0, -10, 0, 1.0)],
                              azul, total, brillo=(255, 220, 160), glow=(120, 170, 255, 130)),
        texto_con_empaque,
        lambda: D.lamina_producto_split(4, "SALCHICHA SICILIANA ARTESANAL",
                                        "Enrollada en espiral, delgada y hecha a mano en Caracas. Lista para pizza, pasta y antipasto.",
                                        3, total, AZUL, None, fondo="azul"),
        lambda: D.lamina_abanico("5 SABORES PARA TU COCINA", ["PIZZA", "PASTA", "ANTIPASTO"], 4, total),
        lambda: lista_con_empaque("CALIDAD QUE\nSE NOTA", ["Sin nitritos", "Sin conservantes químicos", "Sin gluten",
                                                          "Hecha a mano en Caracas"], 5, total, 2, col=AZUL),
        lambda: D.lamina_cierre_parrilla("TRABAJEMOS\nJUNTOS", ["Despachos solo en Caracas", WA], "ESCRÍBENOS POR WHATSAPP", total,
                                         fotos=(4, 2, 5), precio=None, fondo="azul"),
    ]


def render(salida="dia07_v4"):
    for fmt, carpeta in (("ig", salida), ("tt", salida + "_tt")):
        g.usar_formato(fmt)
        os.makedirs(carpeta, exist_ok=True)
        ims = []
        for i, f in enumerate(laminas(), 1):
            im = f()
            im.save(f"{carpeta}/{i:02d}.jpg", quality=90)
            ims.append(im)
        w = 330 if fmt == "ig" else 280
        th = [im.resize((w, int(im.height * w / im.width))) for im in ims]
        S = Image.new("RGB", (len(th) * (w + 8), th[0].height), (20, 20, 20))
        for k, t in enumerate(th):
            S.paste(t, (k * (w + 8), 0))
        S.save(f"/tmp/dia07_v4_{fmt}.jpg", quality=85)
        print(fmt, len(ims))


if __name__ == "__main__":
    render()
