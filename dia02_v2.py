"""Día 2 v2: Panini a la brasa con fotos reales. python3 dia02_v2.py"""
import os, sys
from PIL import Image
import generador as g
import disenos as D
from contenido import WA, ENTREGA

ROJO = (196, 44, 26)


def laminas():
    pan = D.cargar("panini.png").crop((0, 242, 452, 650))
    esp = D.cargar("espiral.png")
    total = 6
    return [
        lambda: D.portada_parrilla("PANINI", "A LA BRASA", "RECETA · SALCHICHA SICILIANA", ["LISTO EN", "15", "MIN"], total),
        lambda: D.lamina_ingredientes(pan, (150, 0, 452, 228), "LO QUE\nNECESITAS",
                                      ["1 salchicha siciliana Traviani (Parrillera)", "2 pimentones, rojo y verde",
                                       "1 cebolla en tiras", "Pan baguette o ciabatta", "Aceite de oliva, sal y pimienta"], 2, total, ROJO),
        lambda: D.lamina_foto_completa(esp, 0.5, 0.45, 1, "ASA LA SALCHICHA",
                                       "Fuego medio, sin apuro. Voltea una sola vez hasta que quede dorada por fuera y jugosa por dentro.", 3, total, ROJO, "PASO 1"),
        lambda: D.lamina_split(pan, (0, 0, 452, 344), "ASA LOS PIMENTONES",
                               "En la misma parrilla, con la cebolla. Aceite de oliva, sal y unos minutos hasta que se ablanden.", 4, total, ROJO, "2"),
        lambda: D.lamina_foto_completa(pan, 0.85, 0.5, 3, "ARMA EL PAN",
                                       "Abre el pan, mete la salchicha y llénalo de pimentones y cebolla. Listo para morder.", 5, total, ROJO, "PASO 3"),
        lambda: D.lamina_cierre_parrilla("PIDE TU\nPARRILLERA", ENTREGA + [WA], "ESCRÍBENOS POR WHATSAPP", total),
    ]


def render(salida="dia02_v2"):
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
        S.save(f"/tmp/dia02_v2_{fmt}.jpg", quality=85)
        print(fmt, len(ims))


if __name__ == "__main__":
    render()
