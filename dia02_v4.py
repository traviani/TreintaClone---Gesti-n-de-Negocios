"""Día 2 v4: Viernes de parrilla — producto protagonista, una foto distinta por lámina."""
import os
from PIL import Image, ImageDraw
import generador as g
import disenos as D
from generador import W, anton, mont, envolver, pie, terminar, radial, espiral, empaque, pegar_producto, CREMA, OSCURO, DORADO
from contenido import WA, ENTREGA

ROJO = (196, 44, 26)


def lista_con_empaque(titulo, items, n, total, emp, col=ROJO, dy_tt=0):
    T, h, o = g.tt(), D.H(), D.oy()
    b = radial((252, 246, 236), (230, 214, 192), cy=0.35, r=1.15).convert("RGBA")
    espiral(ImageDraw.Draw(b), W, 0, 700, col + (40,), 3, 7)
    alto = 820 if T else 640
    p = empaque(emp, alto, 9)
    cy = o + (520 + dy_tt if T else 470)
    pegar_producto(b, p, (W - p.width + 60, cy - p.height // 2), brillo=(255, 140, 70))
    d = ImageDraw.Draw(b)
    y = o + (80 if T else 70)
    ft = anton(100 if T else 105)
    for l in titulo.split("\n"):
        d.text((70, y), l, font=ft, fill=OSCURO); y += int(ft.size * 1.05)
    d.rectangle((72, y + 6, 72 + 110, y + 18), fill=col)
    y = max(y + 60, cy + alto // 2 + 30) if not T else max(y + 60, cy + alto // 2 + 30)
    y = min(y, h - 4 * 84 - 120)
    fi = mont(46 if T else 40, "Bold")
    for it in items:
        d.ellipse((80, y + 16, 106, y + 42), fill=col)
        d.text((130, y), it, font=fi, fill=(52, 36, 30))
        y += 98 if T else 84
    if not T:
        pie(d, OSCURO, n, total)
    return terminar(b)


def laminas():
    esp = D.cargar("espiral.png")
    total = 6
    return [
        lambda: D.portada_parrilla("VIERNES", "DE PARRILLA", "PLAN DE FIN DE SEMANA", ["TE LO", "GANASTE", "HOY"], total),
        lambda: D.lamina_texto_parrilla([("¿CANSADO DE", g.CREMA), ("UNA SEMANA", g.CREMA), ("COMPLETA DE", g.CREMA), ("TRABAJO?", g.DORADO)],
                                        "Este viernes se acabó.", 2, total),
        lambda: D.lamina_split(esp, (0, 90, 554, 470), "OLVÍDATE DE TODO",
                               "Cierra la laptop, apaga el teléfono del trabajo y enciende la parrilla.", 3, total, ROJO),
        lambda: lista_con_empaque("EL PLAN\nPERFECTO", ["Cervezas bien frías", "Tus panas de siempre", "Música y buena conversación",
                                                        "La parrilla encendida"], 4, total, 3),
        lambda: D.lamina_producto_split(5, "EL SABOR DE HOY: PARRILLERA",
                                        "Pensada para el carbón. Enrollada en espiral, delgada y hecha a mano en Caracas.", 5, total, ROJO,
                                        ["HECHA", "A MANO", "EN CARACAS"]),
        lambda: D.lamina_cierre_parrilla("TE LO\nGANASTE", ENTREGA + [WA], "PIDE DIRECTO CON NOSOTROS", total),
    ]


def render(salida="dia02_v4"):
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
        S.save(f"/tmp/dia02_v4_{fmt}.jpg", quality=85)
        print(fmt, len(ims))


if __name__ == "__main__":
    render()
