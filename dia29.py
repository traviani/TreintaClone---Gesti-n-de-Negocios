"""Día 29 — Salchicha con papas doradas (COLLAGE kraft)."""
import collage as C, runner
from estilos import WA
ENT = ["Delivery gratis desde 4 paquetes", "Despachos solo en Caracas"]
def laminas():
    T = 6
    return [
        lambda: C.portada(["SALCHICHA CON", "PAPAS", "DORADAS"], "Un plato, cero complicaciones.", 5, ["papa", "limon", "fuego"], ["AL", "HORNO", "FÁCIL"], T, seed=11),
        lambda: C.lista("INGREDIENTES", ["1 espiral (tu sabor favorito)", "4 papas medianas", "Aceite, sal y romero", "1 limón"], 2, T, "papa", ["limon", "hoja"], seed=12),
        lambda: C.paso("1", "PAPAS AL HORNO", "Córtalas en gajos, con aceite y sal. 200 °C por 20 minutos.", 3, T, ("cluster", [("papa", 0, 0.03, 0.78, -6), ("fuego", 0.3, 0.3, 0.3, 8), ("reloj", -0.3, -0.3, 0.3, -8)]), ["limon", "hoja"], v=0, seed=13, bloque_col=(214, 57, 36)),
        lambda: C.paso("2", "LA ESPIRAL ENCIMA", "Colócala sobre las papas y hornea 20 a 25 minutos más, volteándola a la mitad.", 4, T, ("foto", "espiral"), ["papa", "hoja"], v=1, seed=14, bloque_col=(150, 176, 132)),
        lambda: C.paso("3", "SIRVE CON LIMÓN", "Bien cocida por dentro, dorada por fuera y un toque de limón.", 5, T, ("cluster", [("limon", 0, 0, 0.8, 0), ("papa", -0.22, 0.3, 0.42, -14), ("hoja", 0.3, -0.3, 0.3, 14)]), ["tenedor", "estrella"], v=2, seed=15, nota="¡a comer!"),
        lambda: C.cierre("PIDE TU\nFAVORITA", ENT, f"ESCRÍBENOS · {WA}", [1, 5, 3], T, seed=16),
    ]
if __name__ == "__main__":
    runner.render(29, laminas())
