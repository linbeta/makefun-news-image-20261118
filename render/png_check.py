"""render/png_check.py: decode a rendered PNG with Pillow, check its size, and write a 300x300 preview.

    python3 -I render/png_check.py IMAGE.png [PREVIEW.png]

Prints one JSON line: {"ok": ..., "width", "height", "bytes", "mode", "preview"}; exits 1 if the PNG does not
decode fully, is not 1024x1024, or is over 1 MiB. The preview is RGB, resampled with Lanczos, for checking how the
poster reads at about 300 pixels across. Development tool only; main.ts does not use it.
"""
import json
import os
import sys

from PIL import Image

MAX_BYTES = 1048576


def main(argv):
    if len(argv) < 2:
        print(__doc__.strip(), file=sys.stderr)
        return 2
    path = argv[1]
    preview = argv[2] if len(argv) > 2 else None
    size = os.path.getsize(path)
    with Image.open(path) as im:
        fmt = im.format
        im.load()  # decodes every byte of image data; raises on a truncated or corrupt file
        result = {"format": fmt, "width": im.width, "height": im.height, "mode": im.mode, "bytes": size}
        if preview:
            im.convert("RGB").resize((300, 300), Image.LANCZOS).save(preview, optimize=True)
            result["preview"] = preview
    problems = []
    if fmt != "PNG":
        problems.append("not a PNG")
    if (result["width"], result["height"]) != (1024, 1024):
        problems.append("not 1024x1024")
    if size > MAX_BYTES:
        problems.append("over 1 MiB")
    result["ok"] = not problems
    result["problems"] = problems
    print(json.dumps(result))
    return 0 if result["ok"] else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
