"""Día 4: El domingo no es domingo sin parrilla. python3 dia04.py"""
import os
from PIL import Image
import generador as g
import disenos as D
from contenido import WA

CRE, DOR = g.CREMA, g.DORADO


def laminas():
    total = 5
    return [
        lambda: D.portada_parrilla("DOMINGO", "DE FAMILIA", "EL MEJOR PLAN", ["PARA", "TODA LA", "FAMILIA"], total, fondo="mesa"),
        lambda: D.lamina_texto_parrilla([("EL DOMINGO", CRE), ("NO ES DOMINGO", CRE), ("SIN ESTO.", DOR)],
                                        "La parrilla prendida y todos en la mesa.", 2, total, empaque_n=2, fondo="mesa"),
        lambda: D.lamina_bandas("EL DOMINGO\nPERFECTO LLEVA", [("LA FAMILIA", "Todos en la mesa, sin apuro."),
                                                              ("LA PARRILLA", "Prendida desde temprano."),
                                                              ("EL PAN", "Calientito, para armar el sándwich.")], 3, total),
        lambda: D.lamina_cantidades("¿CUÁNTOS\nPAQUETES PIDO?", [(4, 2), (6, 3), (8, 4)], 4, total),
        lambda: D.lamina_cierre_parrilla("DELIVERY\nGRATIS", ["Desde 4 paquetes", "Despachos solo en Caracas", WA],
                                         "PIDE PARA ESTE DOMINGO", total, fotos=(5, 3, 2), fondo="mesa"),
    ]


def render(salida="dia04_v2"):
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
        S.save(f"/tmp/dia04_{fmt}.jpg", quality=85)
        print(fmt, len(ims))


if __name__ == "__main__":
    render()
