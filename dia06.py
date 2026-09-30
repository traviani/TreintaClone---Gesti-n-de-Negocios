"""Día 6: 5 formas de comerla esta semana. python3 dia06.py"""
import os
from PIL import Image
import generador as g
import disenos as D
from contenido import WA, ENTREGA

ROJO = (196, 44, 26)


def laminas():
    pasta, panini, esp = D.cargar("pasta.png"), D.cargar("panini.png").crop((0, 242, 452, 650)), D.cargar("espiral.png")
    fotos = dict(pasta=pasta, panini=panini, parrilla=esp)
    total = 7
    return [
        lambda: D.portada_formas(total, fotos),
        lambda: D.lamina_dia("LUNES", "EN AREPA", "Asada y en rodajas, dentro de la arepa calientita. Desayuno venezolano con sabor siciliano.",
                             "grafico", (238, 192, 52), 2, total, empaque_n=2, claro=True, ghost="AREPA"),
        lambda: D.lamina_dia("MARTES", "EN PASTA", "Dorada en trozos y mezclada con salsa de tomate. Lista en 20 minutos.",
                             "circulo", ROJO, 3, total, foto=pasta, caja=(150, 360, 690, 830)),
        lambda: D.lamina_dia("MIÉRCOLES", "EN PANINI", "Con pimentones asados y pan crujiente. El almuerzo rápido que sí llena.",
                             "polaroid", (30, 120, 92), 4, total, foto=panini, caja=(0, 0, 452, 408)),
        lambda: D.lamina_dia("JUEVES", "EN PIZZA", "En rodajas sobre la masa, con queso y salsa. La pizza de jueves sube de nivel.",
                             "grafico", (226, 112, 30), 5, total, empaque_n=3, ghost="PIZZA"),
        lambda: D.lamina_foto_completa(esp, 0.5, 0.45, None, "A LA PARRILLA",
                                       "Entera, en espiral y con los panas. La forma clásica de comerla.", 6, total, ROJO, "FIN DE SEMANA"),
        lambda: D.lamina_cierre_parrilla("¿CUÁL PRUEBAS\nPRIMERO?", ENTREGA + [WA], "PIDE DIRECTO CON NOSOTROS", total,
                                         fotos=(3, 5, 1), fondo="ambar"),
    ]


def render(salida="dia06_v2"):
    for fmt, carpeta in (("ig", salida), ("tt", salida + "_tt")):
        g.usar_formato(fmt)
        os.makedirs(carpeta, exist_ok=True)
        ims = []
        for i, f in enumerate(laminas(), 1):
            im = f()
            im.save(f"{carpeta}/{i:02d}.jpg", quality=90)
            ims.append(im)
        w = 300 if fmt == "ig" else 255
        th = [im.resize((w, int(im.height * w / im.width))) for im in ims]
        S = Image.new("RGB", (len(th) * (w + 8), th[0].height), (20, 20, 20))
        for k, t in enumerate(th):
            S.paste(t, (k * (w + 8), 0))
        S.save(f"/tmp/dia06_{fmt}.jpg", quality=85)
        print(fmt, len(ims))


if __name__ == "__main__":
    render()
