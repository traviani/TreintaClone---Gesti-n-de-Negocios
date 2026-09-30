"""Día 9 v4: Arepa con Tradizionale — el plato protagonista y el paquete grande."""
import os
from PIL import Image
import generador as g
import disenos as D
from dia08_v4 import foto_titulo
from dia02_v4 import lista_con_empaque
from contenido import WA, ENTREGA

ROJO = (196, 44, 26)
CRE, DOR = g.CREMA, g.DORADO


def laminas():
    arepa = D.cargar("arepa_limpia.png")
    total = 5
    return [
        lambda: foto_titulo("arepa_limpia.png", [("AREPA CON", CRE), ("TRADIZIONALE", DOR)],
                            "El desayuno venezolano con acento siciliano.", 1, total, cy=0.12, cx=0.3, chip="DESAYUNO · 10 MIN"),
        lambda: lista_con_empaque("INGREDIENTES", ["1 Tradizionale", "2 arepas recién hechas", "Queso blanco rallado",
                                                   "Aguacate (opcional)"], 2, total, 2, dy_tt=90),
        lambda: D.lamina_dia("PASO 1", "ASÁLA", "En sartén o plancha a fuego medio, 12 a 15 minutos volteando, hasta que esté bien cocida.",
                             "grafico", (196, 44, 26), 3, total, empaque_n=2, ghost="12 MIN"),
        lambda: D.lamina_dia("PASO 2", "RELLENA", "Rodajas finas dentro de la arepa abierta, con queso blanco y aguacate si quieres.",
                             "circulo", (30, 120, 92), 4, total, foto=arepa, caja=(90, 400, 470, 700)),
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
