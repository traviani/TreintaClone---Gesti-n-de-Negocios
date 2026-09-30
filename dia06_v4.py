"""Día 6 v4: 5 formas de comerla — empaques grandes en cada lámina."""
import os
from PIL import Image
import generador as g
import disenos as D
from comunes import portada_packs, pegar_empaque_en
from contenido import WA, ENTREGA

ROJO = (196, 44, 26)


def dia(*a, post=None, **k):
    def f():
        im = D.lamina_dia(*a, **k)
        if post:
            im = pegar_empaque_en(im, *post[0], **post[1])
        return im
    return f


def laminas():
    pasta = D.cargar("pasta.png")
    arepa = D.cargar("arepa_ref.png").crop((0, 320, 432, 880))
    panini = D.cargar("panini_ref.png").crop((0, 70, 683, 400))
    parri = D.cargar("parrilla_ref.png")
    pizza = Image.open(f"{D.FOT}/pizza_recorte.png").convert("RGBA")
    total = 7
    T = g.tt()
    return [
        lambda: portada_packs("5 FORMAS", "DE COMERLA", "ESTA SEMANA", ["UNA POR", "DÍA"],
                              [(1, -330, 50, -12, 0.66), (4, 330, 50, 12, 0.66), (3, -170, 20, -6, 0.78),
                               (2, 170, 20, 6, 0.78), (5, 0, -10, 0, 0.92)],
                              D.mesa_bg if False else (lambda h: D._mesa_oscura(h, 4, 70)), total),
        dia("LUNES", "EN AREPA", "Asada y en rodajas, dentro de la arepa calientita. Desayuno venezolano con sabor siciliano.",
            "polaroid", (238, 192, 52), 2, total, foto=arepa, claro=True,
            post=((2, 0.575 if not T else 0.49, 0.33 if not T else 0.27, 8), dict(dx=300))),
        dia("MARTES", "EN PASTA", "Dorada en trozos y mezclada con salsa de tomate. Lista en 20 minutos.",
            "circulo", ROJO, 3, total, foto=pasta, caja=(150, 360, 690, 830),
            post=((1, 0.66 if not T else 0.52, 0.30 if not T else 0.25, -8), dict(dx=290))),
        dia("MIÉRCOLES", "EN PANINI", "Con pimentones asados y pan crujiente. El almuerzo rápido que sí llena.",
            "polaroid", (30, 120, 92), 4, total, foto=panini,
            post=((3, 0.57 if not T else 0.49, 0.33 if not T else 0.27, -8), dict(dx=-300))),
        dia("JUEVES", "EN PIZZA", "Sobre la masa, con queso y salsa. La pizza de jueves sube de nivel.",
            "recorte", (200, 84, 22), 5, total, foto=pizza, ghost="PIZZA", empaque_n=3),
        dia("VIERNES A DOMINGO", "A LA PARRILLA", "Entera, en espiral y con los panas. La forma clásica de comerla.",
            "circulo", (20, 105, 118), 6, total, foto=parri,
            post=((5, 0.62 if not T else 0.50, 0.30 if not T else 0.25, -8), dict(dx=290))),
        lambda: D.lamina_cierre_parrilla("¿CUÁL PRUEBAS\nPRIMERO?", ENTREGA + [WA], "PIDE DIRECTO CON NOSOTROS", total,
                                         fotos=(3, 4, 1), fondo="ambar"),
    ]


def render(salida="dia06_v4"):
    for fmt, carpeta in (("ig", salida), ("tt", salida + "_tt")):
        g.usar_formato(fmt)
        os.makedirs(carpeta, exist_ok=True)
        ims = []
        for i, f in enumerate(laminas(), 1):
            im = f()
            im.save(f"{carpeta}/{i:02d}.jpg", quality=90)
            ims.append(im)
        w = 300
        th = [im.resize((w, int(im.height * w / im.width))) for im in ims]
        S = Image.new("RGB", (len(th) * (w + 8), th[0].height), (20, 20, 20))
        for k, t in enumerate(th):
            S.paste(t, (k * (w + 8), 0))
        S.save(f"/tmp/dia06_v4_{fmt}.jpg", quality=85)
        print(fmt, len(ims))


if __name__ == "__main__":
    render()
