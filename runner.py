"""Renderiza un día: lista de funciones lambda -> carpetas diaNN_v3 (IG) y diaNN_v3_tt (TikTok)."""
import os, sys
import estilos as E

def render(num, laminas, salida=None, solo=None):
    salida = salida or f"dia{num:02d}_v3"
    for fmt, carpeta in (("ig", salida), ("tt", salida + "_tt")):
        if solo and fmt not in solo: continue
        E.usar(fmt)
        os.makedirs(carpeta, exist_ok=True)
        ims = []
        for i, f in enumerate(laminas, 1):
            im = f()
            E.guardar(im, f"{carpeta}/{i:02d}.jpg")
            ims.append(im)
        E.hoja_contacto(ims, f"/tmp/dia{num:02d}_{fmt}.jpg", 300 if fmt == "ig" else 250)
        print(num, fmt, len(ims))
