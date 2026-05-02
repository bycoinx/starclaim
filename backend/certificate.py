"""PDF certificate generator using ReportLab — no external font dependency."""
from io import BytesIO
from datetime import datetime
from io import BytesIO
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.colors import HexColor, Color
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
import math
import random


COLOR_BG = HexColor("#050A1A")
COLOR_BG2 = HexColor("#0A1628")
COLOR_GOLD = HexColor("#C9A84C")
COLOR_GOLD_LIGHT = HexColor("#E0BB6A")
COLOR_TEXT = HexColor("#F0F4FF")
COLOR_MUTED = HexColor("#8899BB")


def _draw_starfield(c, width, height, count=120):
    rng = random.Random(42)
    for _ in range(count):
        x = rng.uniform(0, width)
        y = rng.uniform(0, height)
        r = rng.uniform(0.3, 1.4)
        opacity = rng.uniform(0.2, 0.9)
        # white tint with opacity
        c.setFillColorRGB(1, 1, 1, alpha=opacity)
        c.circle(x, y, r, stroke=0, fill=1)
    # a few gold accent stars
    c.setFillColor(COLOR_GOLD, alpha=0.7)
    for _ in range(8):
        x = rng.uniform(0, width)
        y = rng.uniform(0, height)
        r = rng.uniform(0.6, 1.6)
        c.circle(x, y, r, stroke=0, fill=1)


def _draw_corner(c, x, y, size, rotate=0):
    c.saveState()
    c.translate(x, y)
    c.rotate(rotate)
    c.setStrokeColor(COLOR_GOLD)
    c.setLineWidth(0.8)
    # ornate corner motif
    c.line(0, 0, size, 0)
    c.line(0, 0, 0, size)
    c.line(size * 0.2, 0, size * 0.2, size * 0.4)
    c.line(0, size * 0.2, size * 0.4, size * 0.2)
    c.setLineWidth(0.4)
    c.circle(size * 0.5, size * 0.5, size * 0.12, stroke=1, fill=0)
    c.restoreState()


def generate_certificate(
    *,
    star_name: str,
    constellation: str,
    custom_name: str,
    personal_message: str,
    occasion: str,
    ra: str,
    dec: str,
    owner_name: str,
    issue_date: str | None = None,
    story: str | None = None,
    language: str = "TR",
) -> bytes:
    """Return PDF bytes for a StarClaim certificate."""
    buf = BytesIO()
    page = landscape(A4)
    width, height = page
    c = canvas.Canvas(buf, pagesize=page)

    # Background
    c.setFillColor(COLOR_BG)
    c.rect(0, 0, width, height, stroke=0, fill=1)
    # Inner darker panel for depth
    c.setFillColor(COLOR_BG2)
    c.rect(20, 20, width - 40, height - 40, stroke=0, fill=1)

    _draw_starfield(c, width, height, count=180)

    # Gold double border
    c.setStrokeColor(COLOR_GOLD)
    c.setLineWidth(2)
    c.rect(28, 28, width - 56, height - 56, stroke=1, fill=0)
    c.setLineWidth(0.5)
    c.rect(36, 36, width - 72, height - 72, stroke=1, fill=0)

    # Corner ornaments
    s = 28
    _draw_corner(c, 44, 44, s, 0)
    _draw_corner(c, width - 44, 44, s, 90)
    _draw_corner(c, width - 44, height - 44, s, 180)
    _draw_corner(c, 44, height - 44, s, 270)

    # Brand
    c.setFont("Times-Roman", 11)
    c.setFillColor(COLOR_GOLD)
    c.drawCentredString(width / 2, height - 64, "✦  S T A R C L A I M  ✦")

    label = "CERTIFICATE OF NAMING" if language.upper() == "EN" else "YILDIZ ADLANDIRMA SERTİFİKASI"
    c.setFont("Times-Roman", 10)
    c.setFillColor(COLOR_MUTED)
    c.drawCentredString(width / 2, height - 84, label)

    # Custom name (the heart of the cert)
    c.setFont("Times-Bold", 36)
    c.setFillColor(COLOR_GOLD_LIGHT)
    c.drawCentredString(width / 2, height - 140, custom_name or star_name)

    # Star reference + constellation
    c.setFont("Times-Italic", 13)
    c.setFillColor(COLOR_TEXT)
    sub = f"({star_name} · {constellation})"
    c.drawCentredString(width / 2, height - 162, sub)

    # Gold horizontal divider
    c.setStrokeColor(COLOR_GOLD)
    c.setLineWidth(0.6)
    c.line(width / 2 - 110, height - 178, width / 2 + 110, height - 178)

    # Personal message / story (italic)
    c.setFont("Times-Italic", 11)
    c.setFillColor(COLOR_TEXT)
    text = story or personal_message or ""
    if text:
        # Word-wrap manually
        max_chars = 95
        lines = []
        for paragraph in text.split("\n"):
            words = paragraph.split()
            cur = ""
            for w in words:
                if len(cur) + len(w) + 1 > max_chars:
                    lines.append(cur)
                    cur = w
                else:
                    cur = (cur + " " + w).strip()
            if cur:
                lines.append(cur)
            lines.append("")
        y = height - 210
        for line in lines[:9]:
            c.drawCentredString(width / 2, y, line)
            y -= 16

    # Coordinates panel
    c.setFont("Courier", 9)
    c.setFillColor(COLOR_MUTED)
    c.drawCentredString(width / 2, 130, f"RA  ·  {ra}        DEC  ·  {dec}")

    # Owner & date
    issue = issue_date or datetime.utcnow().strftime("%d %b %Y")
    c.setFont("Times-Roman", 10)
    c.setFillColor(COLOR_GOLD)
    owner_label = "OWNER" if language.upper() == "EN" else "SAHİBİ"
    date_label = "ISSUED" if language.upper() == "EN" else "VERİLİŞ"
    c.drawString(80, 92, f"{owner_label}")
    c.drawRightString(width - 80, 92, f"{date_label}")
    c.setFont("Times-Roman", 12)
    c.setFillColor(COLOR_TEXT)
    c.drawString(80, 76, owner_name)
    c.drawRightString(width - 80, 76, issue)

    # Signature line
    c.setStrokeColor(COLOR_GOLD)
    c.setLineWidth(0.5)
    c.line(80, 70, 200, 70)
    c.line(width - 200, 70, width - 80, 70)

    # Footer tagline
    c.setFont("Times-Italic", 9)
    c.setFillColor(COLOR_MUTED)
    tag = "“Stars are eternal, so are memories.”" if language.upper() == "EN" else "“Yıldızlar sonsuz, anılar da öyle.”"
    c.drawCentredString(width / 2, 50, tag)

    c.showPage()
    c.save()
    return buf.getvalue()


from io import BytesIO
