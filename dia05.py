"""Día 5: Cómo asar la espiral sin que se desarme. python3 dia05.py"""
import os
from PIL import Image
import generador as g
import disenos as D
from contenido import WA, ENTREGA

ROJO = (196, 44, 26)


def laminas():
    esp = D.cargar("espiral.png")
    total = 6
    return [
        lambda: D.portada_parrilla("ASA BIEN", "SIN QUE SE DESARME", "TIP DE PARRILLERO", ["TIP", "DE", "ASADOR"], total, fondo="teal"),
        lambda: D.lamina_diagrama_pinchos(1, "CLAVA 2 PINCHOS EN CRUZ",
                                          "Atraviesa la espiral por el centro con dos pinchos cruzados. Así queda firme y no se abre.", 2, total),
        lambda: D.lamina_fuego(2, "FUEGO MEDIO, NO ALTO",
                               "Con fuego alto se quema por fuera y queda cruda por dentro. A fuego medio se dora pareja y queda jugosa.", 3, total),
        lambda: D.lamina_giro(3, "VOLTEA UNA SOLA VEZ",
                              "Espera a que se dore y se despegue sola. Gírala sosteniendo los dos pinchos.", 4, total),
        lambda: D.lamina_foto_completa(esp, 0.5, 0.45, None, "DORADA Y JUGOSA",
                                       "Así queda. Sin romperse y con todo el sabor adentro.", 5, total, ROJO, "RESULTADO"),
        lambda: D.lamina_cierre_parrilla("PIDE TU\nESPIRAL", ENTREGA + [WA], "PIDE DIRECTO CON NOSOTROS", total,
                                         fotos=(3, 5, 1), fondo="teal"),
    ]


def render(salida="dia05_v2"):
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
        S.save(f"/tmp/dia05_{fmt}.jpg", quality=85)
        print(fmt, len(ims))


if __name__ == "__main__":
    render()
