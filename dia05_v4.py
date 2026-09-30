"""Día 5 v4: Cómo asar la espiral — empaque protagonista."""
import os
from PIL import Image
import generador as g
import disenos as D
from contenido import WA, ENTREGA
from comunes import portada_packs, pegar_empaque_en

ROJO = (196, 44, 26)


def laminas():
    esp = D.cargar("espiral.png")
    total = 6
    return [
        lambda: portada_packs("ASA BIEN", "SIN QUE SE DESARME", "TIP DE PARRILLERO", ["TIP", "DE", "ASADOR"],
                              [(3, -290, 60, 12, 0.88), (1, 290, 60, -12, 0.88), (5, 0, -10, 0, 1.0)], D.teal_bg, total,
                              brillo=(200, 255, 240), glow=(210, 255, 240, 95)),
        lambda: D.lamina_diagrama_pinchos(1, "CLAVA 2 PINCHOS EN CRUZ",
                                          "Atraviesa la espiral por el centro con dos pinchos cruzados. Así queda firme y no se abre.", 2, total),
        lambda: pegar_empaque_en(D.lamina_fuego(2, "FUEGO MEDIO, NO ALTO",
                                                "Con fuego alto se quema por fuera y queda cruda por dentro. A fuego medio se dora pareja y queda jugosa.", 3, total),
                                 5, 0.655 if not g.tt() else 0.625, 0.27 if not g.tt() else 0.15, -8),
        lambda: D.lamina_giro(3, "VOLTEA UNA SOLA VEZ",
                              "Espera a que se dore y se despegue sola. Gírala sosteniendo los dos pinchos.", 4, total),
        lambda: D.lamina_split(esp, (40, 50, 514, 400), "DORADA Y JUGOSA",
                               "Así queda. Sin romperse y con todo el sabor adentro.", 5, total, ROJO, None),
        lambda: D.lamina_cierre_parrilla("PIDE TU\nESPIRAL", ENTREGA + [WA], "PIDE DIRECTO CON NOSOTROS", total,
                                         fotos=(3, 5, 1), fondo="teal"),
    ]


def render(salida="dia05_v4"):
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
        S.save(f"/tmp/dia05_v4_{fmt}.jpg", quality=85)
        print(fmt, len(ims))


if __name__ == "__main__":
    render()
