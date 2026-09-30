"""Día 2 v3: Viernes de parrilla (sin panini). python3 dia02_v2.py"""
import os
from PIL import Image
import generador as g
import disenos as D
from contenido import WA, ENTREGA

ROJO = (196, 44, 26)
DOR = g.DORADO
CRE = g.CREMA


def laminas():
    esp = D.cargar("espiral.png")
    total = 6
    return [
        lambda: D.portada_parrilla("VIERNES", "DE PARRILLA", "PLAN DE FIN DE SEMANA", ["TE LO", "GANASTE", "HOY"], total),
        lambda: D.lamina_texto_parrilla([("¿CANSADO DE", CRE), ("UNA SEMANA", CRE), ("COMPLETA DE", CRE), ("TRABAJO?", DOR)],
                                        "Este viernes se acabó.", 2, total),
        lambda: D.lamina_foto_completa(esp, 0.5, 0.45, None, "OLVÍDATE DE TODO",
                                       "Cierra la laptop, apaga el teléfono del trabajo y enciende la parrilla.", 3, total, ROJO, "ESTE VIERNES"),
        lambda: D.lamina_ingredientes(esp, (60, 60, 500, 500), "EL PLAN\nPERFECTO",
                                      ["Cervezas bien frías", "Tus panas de siempre", "Música y buena conversación",
                                       "La parrilla encendida"], 4, total, ROJO),
        lambda: D.lamina_producto_split(5, "EL SABOR DE HOY: PARRILLERA",
                                        "Pensada para el carbón. Enrollada en espiral, delgada y hecha a mano en Caracas.", 5, total, ROJO,
                                        ["HECHA", "A MANO", "EN CARACAS"]),
        lambda: D.lamina_cierre_parrilla("TE LO\nGANASTE", ENTREGA + [WA], "PIDE DIRECTO CON NOSOTROS", total),
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
