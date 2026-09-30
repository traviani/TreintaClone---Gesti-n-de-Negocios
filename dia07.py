"""Día 7: Para restaurantes y pizzerías de Caracas. python3 dia07.py"""
import os
from PIL import Image
import generador as g
import disenos as D
from contenido import WA

CRE, DOR = g.CREMA, g.DORADO


def laminas():
    pizza = Image.open(f"{D.FOT}/pizza_recorte.png").convert("RGBA")
    total = 6
    return [
        lambda: D.portada_recorte(pizza, "DIFERENCIA", "TU CARTA", "PARA NEGOCIOS · CARACAS", ["HECHA", "A MANO", "EN CARACAS"], total, 1),
        lambda: D.lamina_texto_parrilla([("¿QUIERES ALGO", CRE), ("QUE NADIE MÁS", CRE), ("TIENE EN", CRE), ("TU CARTA?", DOR)],
                                        "Un ingrediente que hace distinta tu pizza.", 2, total, empaque_n=1, fondo="azul"),
        lambda: D.lamina_producto_split(1, "SALCHICHA SICILIANA ARTESANAL",
                                        "Enrollada en espiral, delgada y hecha a mano en Caracas. Lista para pizza, pasta y antipasto.", 3, total, (40, 96, 190),
                                        None, fondo="azul"),
        lambda: D.lamina_abanico("5 SABORES PARA TU COCINA", ["PIZZA", "PASTA", "ANTIPASTO"], 4, total),
        lambda: D.lamina_checks("CALIDAD QUE\nSE NOTA", ["Sin nitritos", "Sin conservantes químicos", "Sin gluten", "Hecha a mano en Caracas"], 5, total, recorte=pizza),
        lambda: D.lamina_cierre_parrilla("PRECIO AL\nMAYOR", ["Despachos solo en Caracas", WA], "ESCRÍBENOS POR WHATSAPP", total,
                                         fotos=(3, 5, 1), precio=None, fondo="azul"),
    ]


def render(salida="dia07_v2"):
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
        S.save(f"/tmp/dia07_{fmt}.jpg", quality=85)
        print(fmt, len(ims))


if __name__ == "__main__":
    render()
