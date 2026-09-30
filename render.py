import sys, os
from PIL import Image
import contenido as C
def render(d, fmt, vista=True):
    ims = C.generar(d, fmt)
    carp = f"dia{d:02d}" + ("_tt" if fmt == "tt" else "")
    os.makedirs(carp, exist_ok=True)
    for f in os.listdir(carp): os.remove(os.path.join(carp, f))
    for i, im in enumerate(ims, 1): im.save(f"{carp}/{i:02d}.jpg", quality=90)
    if vista:
        sz = (270, 338) if fmt == "ig" else (216, 384)
        c = Image.new("RGB", (sz[0] * len(ims), sz[1]), "white")
        for i, im in enumerate(ims): c.paste(im.resize(sz), (i * sz[0], 0))
        c.save(f"/tmp/v_{carp}.jpg", quality=85)
    return len(ims)
if __name__ == "__main__":
    for a in sys.argv[2:]:
        print(a, render(int(a), sys.argv[1]))
