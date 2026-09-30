"""Día 10 v4: Conservación (congelada, refrigerada, descongelar). Las fotos reales se leen de /home/claude/fotos/d10_*.png;
si aún no existen se usa un marcador de posición que dice qué foto va ahí."""
import os
from PIL import Image, ImageDraw, ImageFilter
import generador as g
import disenos as D
from generador import W, mont, anton, CREMA, DORADO, OSCURO
from comunes import portada_packs
from dia08_v4 import foto_titulo, cierre_mesa
from contenido import WA

g.FACTOR = 1.4
CRE, DOR = g.CREMA, g.DORADO
FOTOS = {
    "congelador": ("d10_congelador.png", "FOTO 1 · CONGELADOR ABIERTO CON PAQUETES"),
    "nevera": ("d10_nevera.png", "FOTO 2 · NEVERA CON PAQUETE Y TERMÓMETRO"),
    "descongelar": ("d10_descongelar.png", "FOTO 3 · PAQUETE EN PLATO EN LA NEVERA"),
}


def foto(clave):
    arch, etiqueta = FOTOS[clave]
    ruta = f"{D.FOT}/{arch}"
    if os.path.exists(ruta):
        return ruta
    ph = f"/tmp/ph_{clave}.png"
    im = Image.new("RGB", (572, 1024), (150, 168, 184))
    d = ImageDraw.Draw(im)
    for y in range(1024):
        v = int(120 + 70 * y / 1024)
        d.line((0, y, 572, y), fill=(v - 10, v + 4, v + 16))
    d.rectangle((40, 250, 532, 780), outline=(255, 255, 255), width=6)
    f = mont(40, "ExtraBold")
    yy = 420
    for l in g._lineas(d, etiqueta, f, 440):
        d.text((70, yy), l, font=f, fill=(255, 255, 255)); yy += 60
    im.save(ph)
    return ph


def laminas():
    total = 5
    return [
        lambda: portada_packs("¿NO LA VAS", "A USAR HOY?", "CÓMO CONSERVARLA", ["FRESCA", "SIEMPRE"],
                              [(1, -330, 50, -12, 0.66), (2, 330, 50, 12, 0.66), (4, -170, 20, -6, 0.78),
                               (3, 170, 20, 6, 0.78), (5, 0, -10, 0, 0.92)],
                              lambda h: D._fondo(h, "azul", 3), total, brillo=(200, 225, 255), glow=(120, 180, 255, 140)),
        lambda: foto_titulo(foto("congelador"), [("CONGELADA", CRE), ("3 MESES", DOR)],
                            "Guárdala en su empaque al vacío, sin abrir, en el congelador.", 2, total, cy=0.74, chip="DURA HASTA"),
        lambda: foto_titulo(foto("nevera"), [("REFRIGERADA", CRE), ("3 DÍAS", DOR)],
                            "En la nevera a 4 °C o menos. Después de eso, al congelador.", 3, total, cy=0.4, chip="MÁXIMO"),
        lambda: foto_titulo(foto("descongelar"), [("CÓMO", CRE), ("DESCONGELAR", DOR)],
                            "Pásala del congelador a la nevera la noche anterior. Nunca al sol ni en agua caliente.", 4, total, cy=0.4),
        lambda: cierre_mesa("GUARDA\nESTE POST", ["Compártelo con quien deja la carne afuera", "Pide por WhatsApp", WA],
                            "ESCRÍBENOS POR WHATSAPP", total, fotos=(4, 1, 3)),
    ]


def render(salida="dia10_v4"):
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
        S.save(f"/tmp/dia10_v4_{fmt}.jpg", quality=85)
        print(fmt, len(ims))


if __name__ == "__main__":
    render()
