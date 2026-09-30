"""Día 3: Pasta con Finocchio en 20 minutos. python3 dia03.py"""
import os
from PIL import Image
import generador as g
import disenos as D
from contenido import WA, ENTREGA

ROJO = (196, 44, 26)


def laminas():
    foto = D.cargar("pasta.png")
    plato = foto.crop((150, 360, 690, 830))
    salch = foto.crop((150, 385, 690, 800))
    zoom = foto.crop((90, 300, 750, 1024))
    total = 7
    return [
        lambda: D.portada_foto(foto, "PASTA", "CON FINOCCHIO", "RECETA · SALCHICHA SICILIANA", ["LISTA EN", "20", "MIN"], total),
        lambda: D.lamina_ingredientes(plato, (0, 0, 540, 470), "LO QUE\nNECESITAS",
                                      ["1 paquete de Finocchio Traviani", "400 g de pasta corta", "2 tazas de salsa de tomate",
                                       "Ajo, albahaca y aceite de oliva", "Queso pecorino rallado"], 2, total, ROJO),
        lambda: D.lamina_split(salch, (0, 0, 540, 415), "DORA LA SALCHICHA",
                               "Córtala en trozos y dórala en la sartén a fuego medio, hasta que tome color por fuera.", 3, total, ROJO, "1"),
        lambda: D.lamina_paso_props("PREPARA LA SALSA",
                                    "En la misma sartén, sofríe el ajo y agrega la salsa de tomate. Deja que hierva suave unos 8 minutos.", "2", 4, total,
                                    [("tomates", 420, (650, 60), 8), ("albahaca", 330, (640, 820), -6), ("chile", 230, (470, 1000), 25)]),
        lambda: D.lamina_foto_completa(zoom, 0.5, 0.33, 3, "MEZCLA Y SIRVE",
                                       "Une la pasta con la salsa y los trozos de salchicha. Sirve con pecorino y albahaca fresca.", 5, total, ROJO, "PASO 3"),
        lambda: D.lamina_producto_split(1, "EL HINOJO PERFUMA LA SALSA",
                                        "Cocina la salsa en la misma sartén donde doraste la salchicha: toma todo el sabor del hinojo.", 6, total, ROJO,
                                        ["TIP", "DE", "COCINA"], fondo="rojo",
                                        prop_extra=[("albahaca", 300, (20, 20), -10), ("tomates", 240, (800, 560), 0)]),
        lambda: D.lamina_cierre_parrilla("PIDE TU\nFINOCCHIO", ENTREGA + [WA], "PIDE DIRECTO CON NOSOTROS", total,
                                         fotos=(3, 2, 1), fondo="rojo"),
    ]


def render(salida="dia03_v2"):
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
        S.save(f"/tmp/dia03_{fmt}.jpg", quality=85)
        print(fmt, len(ims))


if __name__ == "__main__":
    render()
