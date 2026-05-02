"""Resend email sender — non-blocking via asyncio.to_thread.

Sends purchase confirmation + certificate PDF (as attachment) to either the
buyer or, if it's a gift order, to the recipient email.
"""
from __future__ import annotations
import asyncio
import base64
import logging
import os
from typing import Optional

import resend

logger = logging.getLogger("starclaim.email")

RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "StarClaim <onboarding@resend.dev>")

if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY


def _build_html(*, custom_name: str, star_name: str, constellation: str,
                personal_message: str, owner_name: str, language: str = "TR",
                is_gift: bool = False, sender_name: str = "") -> str:
    if language.upper() == "EN":
        greeting = f"Dear {owner_name}," if not is_gift else f"Dear {owner_name}, you've received a star from {sender_name}!"
        intro = "A star is now yours. Forever."
        msg_label = "Personal message:"
        cert_note = "Your gold-bordered certificate is attached as a PDF."
        sign = "With light from the cosmos,"
        team = "The StarClaim Team"
    else:
        greeting = f"Sevgili {owner_name}," if not is_gift else f"Sevgili {owner_name}, {sender_name} sana bir yıldız hediye etti!"
        intro = "Bir yıldız artık senin. Sonsuza kadar."
        msg_label = "Kişisel mesaj:"
        cert_note = "Altın kenarlıklı sertifikan PDF olarak ektedir."
        sign = "Kozmostan ışıkla,"
        team = "StarClaim Ekibi"

    msg_block = ""
    if personal_message:
        msg_block = f"""
        <tr><td style="padding:20px 32px 8px 32px;">
          <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#8899BB;">{msg_label}</div>
          <div style="margin-top:8px;font-style:italic;color:#F0F4FF;font-family:Georgia,serif;font-size:15px;line-height:1.6;border-left:2px solid #C9A84C;padding-left:14px;">{personal_message}</div>
        </td></tr>"""

    return f"""<!doctype html>
<html><body style="margin:0;background:#050A1A;font-family:Arial,Helvetica,sans-serif;color:#F0F4FF;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#050A1A;padding:32px 0;">
  <tr><td align="center">
    <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0"
           style="background:#0A1628;border:1px solid rgba(201,168,76,0.25);border-radius:18px;overflow:hidden;">
      <tr>
        <td align="center" style="padding:40px 32px 8px 32px;">
          <div style="font-size:11px;letter-spacing:6px;color:#C9A84C;">✦  S T A R C L A I M  ✦</div>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding:24px 32px 0 32px;">
          <div style="font-family:Georgia,serif;font-size:28px;color:#E0BB6A;letter-spacing:0.02em;">{custom_name}</div>
          <div style="font-family:Georgia,serif;font-style:italic;font-size:14px;color:#8899BB;margin-top:6px;">({star_name} · {constellation})</div>
        </td>
      </tr>
      <tr><td style="padding:24px 32px 0 32px;"><div style="height:1px;background:linear-gradient(90deg,transparent,#C9A84C,transparent);"></div></td></tr>
      <tr>
        <td style="padding:24px 32px;color:#F0F4FF;font-size:15px;line-height:1.6;">
          <p style="margin:0 0 12px 0;">{greeting}</p>
          <p style="margin:0;font-family:Georgia,serif;font-style:italic;color:#E0BB6A;">{intro}</p>
        </td>
      </tr>
      {msg_block}
      <tr>
        <td style="padding:8px 32px 28px 32px;color:#8899BB;font-size:13px;line-height:1.6;">
          {cert_note}
        </td>
      </tr>
      <tr><td style="padding:0 32px 24px 32px;"><div style="height:1px;background:rgba(255,255,255,0.06);"></div></td></tr>
      <tr>
        <td style="padding:8px 32px 32px 32px;color:#8899BB;font-size:13px;">
          {sign}<br/>
          <span style="color:#C9A84C;">{team}</span>
        </td>
      </tr>
    </table>
    <div style="margin-top:14px;color:#5A6A8A;font-size:11px;">© 2026 StarClaim · Yıldızlar sonsuz, anılar da öyle.</div>
  </td></tr>
</table>
</body></html>"""


async def send_certificate_email(
    *,
    to_email: str,
    custom_name: str,
    star_name: str,
    constellation: str,
    personal_message: str,
    owner_name: str,
    pdf_bytes: bytes,
    language: str = "TR",
    is_gift: bool = False,
    sender_name: str = "",
) -> Optional[str]:
    """Send certificate email with PDF attachment. Returns email id or None on failure."""
    if not RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not set; skipping email send")
        return None

    subject = (
        f"✦ Your star {custom_name} is ready"
        if language.upper() == "EN"
        else f"✦ Yıldızın {custom_name} hazır"
    )

    html = _build_html(
        custom_name=custom_name,
        star_name=star_name,
        constellation=constellation,
        personal_message=personal_message,
        owner_name=owner_name,
        language=language,
        is_gift=is_gift,
        sender_name=sender_name,
    )

    params = {
        "from": SENDER_EMAIL,
        "to": [to_email],
        "subject": subject,
        "html": html,
        "attachments": [
            {
                "filename": f"StarClaim-{custom_name.replace(' ', '_')}-Certificate.pdf",
                "content": base64.b64encode(pdf_bytes).decode("ascii"),
            }
        ],
    }
    try:
        result = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Resend email sent to {to_email}: {result.get('id') if isinstance(result, dict) else result}")
        return result.get("id") if isinstance(result, dict) else None
    except Exception as e:
        logger.exception(f"Resend email failed: {e}")
        return None
