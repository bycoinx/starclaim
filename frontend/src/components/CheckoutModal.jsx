import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Star, Check, Sparkles, Gift, CreditCard, PartyPopper, ChevronRight, ChevronLeft, Download, Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useT } from "../lib/i18n";
import { useAuth } from "../lib/auth";

const STEPS = ["personalize", "package", "preview", "payment", "done"];

export default function CheckoutModal({ open, onOpenChange, star }) {
  const { t, lang } = useT();
  const { user, login } = useAuth();
  const [step, setStep] = useState(0);
  const [customName, setCustomName] = useState("");
  const [message, setMessage] = useState("");
  const [occasion, setOccasion] = useState("general");
  const [isGift, setIsGift] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [pkg, setPkg] = useState("standard");
  const [story, setStory] = useState("");
  const [loadingStory, setLoadingStory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (open && star) {
      setStep(0);
      setCustomName("");
      setMessage("");
      setOccasion("general");
      setIsGift(false);
      setRecipientName("");
      setRecipientEmail("");
      setPkg(star.tier === "standard" ? "standard" : star.tier === "legendary" ? "legendary" : "constellation");
      setStory("");
      setOrder(null);
    }
  }, [open, star]);

  if (!star) return null;

  const addOns = 0;
  const total = star.price + addOns;

  const next = async () => {
    if (step === 0) {
      if (!customName.trim()) { toast.error(lang === "TR" ? "Yıldıza bir isim vermelisin" : "Name the star"); return; }
      if (isGift && !recipientEmail) { toast.error(lang === "TR" ? "Alıcı emaili gerekli" : "Recipient email required"); return; }
    }
    if (step === 1 && !story) {
      setLoadingStory(true);
      try {
        const { data } = await api.post("/ai/story", {
          star_name: star.name,
          constellation: star.constellation,
          custom_name: customName,
          personal_message: message,
          occasion,
          language: lang,
        });
        setStory(data.story);
      } catch (e) {
        toast.error(lang === "TR" ? "Hikaye oluşturulamadı, devam edebilirsin" : "Story failed, continuing anyway");
        setStory("");
      } finally {
        setLoadingStory(false);
      }
    }
    if (step === 3) {
      if (!user) {
        toast.info(lang === "TR" ? "Önce giriş yap" : "Sign in first");
        login();
        return;
      }
      setSubmitting(true);
      try {
        const { data } = await api.post("/checkout/session", {
          star_id: star.star_id,
          custom_name: customName,
          personal_message: message,
          occasion,
          package: pkg,
          gift: isGift,
          recipient_name: recipientName || null,
          recipient_email: recipientEmail || null,
          ai_story: story || "",
          language: lang,
          origin_url: window.location.origin,
        });
        if (data?.url) {
          window.location.href = data.url;
        } else {
          toast.error(lang === "TR" ? "Stripe oturumu oluşturulamadı" : "Could not create Stripe session");
        }
      } catch (e) {
        toast.error(e?.response?.data?.detail || "Checkout failed");
      } finally {
        setSubmitting(false);
      }
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const back = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="checkout-modal"
        className="max-w-2xl bg-[#0A1628]/95 border-sc-gold/20 text-sc-text backdrop-blur-xl p-0 overflow-hidden"
      >
        <DialogTitle className="sr-only">StarClaim Checkout</DialogTitle>
        <DialogDescription className="sr-only">Yıldız sahiplenme akışı</DialogDescription>
        {/* header */}
        <div className="px-8 pt-8 pb-5 border-b border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] tracking-[0.3em] uppercase text-sc-gold/80">
                {t("nav_claim")}
              </div>
              <div className="font-display text-2xl mt-1">
                <span className="gold-gradient-text">{star.name}</span>
                <span className="text-sc-text-muted text-base"> · {star.constellation}</span>
              </div>
            </div>
            <div className="font-display text-2xl text-sc-gold">${total}</div>
          </div>
          {/* stepper */}
          <div className="flex gap-2 mt-2">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-all ${
                  i <= step ? "bg-sc-gold" : "bg-white/10"
                }`}
              />
            ))}
          </div>
        </div>

        {/* body */}
        <div className="px-8 py-8 max-h-[65vh] overflow-y-auto">
          {step === 0 && (
            <div className="space-y-5 animate-fade-up">
              <div>
                <Label className="text-xs text-sc-text-muted uppercase tracking-widest">{t("checkout_name_label")}</Label>
                <Input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder={t("checkout_name_ph")}
                  data-testid="checkout-custom-name"
                  className="mt-2 bg-sc-mid/40 border-white/10 text-sc-text placeholder:text-sc-text-muted/60 font-accent italic text-lg py-6"
                />
              </div>
              <div>
                <Label className="text-xs text-sc-text-muted uppercase tracking-widest">{t("checkout_message_label")}</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, 200))}
                  placeholder={t("checkout_message_ph")}
                  data-testid="checkout-message"
                  className="mt-2 bg-sc-mid/40 border-white/10 text-sc-text placeholder:text-sc-text-muted/60 font-accent italic min-h-[100px]"
                />
                <div className="text-[10px] text-sc-text-muted text-right mt-1">{message.length}/200</div>
              </div>
              <div>
                <Label className="text-xs text-sc-text-muted uppercase tracking-widest">{t("checkout_occasion_label")}</Label>
                <Select value={occasion} onValueChange={setOccasion}>
                  <SelectTrigger data-testid="checkout-occasion" className="mt-2 bg-sc-mid/40 border-white/10 text-sc-text">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-sc-mid border-white/10 text-sc-text">
                    {["general", "birthday", "anniversary", "valentines", "graduation", "newborn", "memorial", "friendship", "thanks"].map((k) => (
                      <SelectItem key={k} value={k}>{t(`occasions.${k}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between glass rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <Gift className="w-4 h-4 text-sc-gold" />
                  <span className="text-sm">{t("checkout_gift_label")}</span>
                </div>
                <Switch checked={isGift} onCheckedChange={setIsGift} data-testid="checkout-gift-toggle" />
              </div>
              {isGift && (
                <div className="grid grid-cols-2 gap-3 animate-fade-up">
                  <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder={t("checkout_recipient_name")} className="bg-sc-mid/40 border-white/10 text-sc-text" data-testid="checkout-recipient-name" />
                  <Input type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} placeholder={t("checkout_recipient_email")} className="bg-sc-mid/40 border-white/10 text-sc-text" data-testid="checkout-recipient-email" />
                </div>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4 animate-fade-up">
              <div className="text-sm text-sc-text-muted mb-2">
                {lang === "TR" ? "Bu yıldız için önerilen paketler:" : "Recommended packages:"}
              </div>
              {[
                { id: "standard", name: lang === "TR" ? "Standart ★" : "Standard ★", price: star.price, inc: lang === "TR" ? "Dijital sertifika + AI hikaye + koordinatlar" : "Digital cert + AI story + coordinates" },
                { id: "constellation", name: lang === "TR" ? "Takımyıldızı ✦" : "Constellation ✦", price: Math.round(star.price * 1.2), inc: lang === "TR" ? "Fiziksel sertifika + gökyüzü haritası + AI görseli" : "Physical cert + sky map + AI image" },
                { id: "legendary", name: lang === "TR" ? "Efsanevi 👑" : "Legendary 👑", price: Math.round(star.price * 1.6), inc: lang === "TR" ? "Her şey + koleksiyoner paketi + özel destek" : "Everything + collector bundle + VIP support" },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPkg(p.id)}
                  data-testid={`pkg-${p.id}`}
                  className={`w-full text-left glass rounded-xl p-5 border transition-all ${
                    pkg === p.id ? "border-sc-gold/70 bg-sc-gold/5" : "border-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-display text-lg">{p.name}</div>
                    <div className="font-display text-sc-gold">${p.price}</div>
                  </div>
                  <div className="text-xs text-sc-text-muted mt-2">{p.inc}</div>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-up">
              <div className="glass-gold rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute inset-0 nebula-bg opacity-60 pointer-events-none" />
                <div className="relative text-center">
                  <div className="text-[10px] tracking-[0.4em] uppercase text-sc-gold mb-3">
                    Certificate of Naming
                  </div>
                  <div className="font-display text-3xl gold-gradient-text mb-1">{customName || star.name}</div>
                  <div className="font-accent italic text-sc-text-muted">({star.name} · {star.constellation})</div>
                  <div className="divider-gold my-5" />
                  {loadingStory ? (
                    <div className="text-sc-text-muted flex items-center justify-center gap-2 py-6">
                      <Loader2 className="w-4 h-4 animate-spin" /> {t("checkout_generating")}
                    </div>
                  ) : story ? (
                    <p className="font-accent italic text-sc-text/90 text-base leading-relaxed whitespace-pre-line max-h-48 overflow-y-auto">
                      {story}
                    </p>
                  ) : (
                    <p className="text-sc-text-muted italic">{message || (lang === "TR" ? "Yıldızının hikayesi burada görünecek." : "Your star's story appears here.")}</p>
                  )}
                  <div className="divider-gold my-5" />
                  <div className="grid grid-cols-2 gap-3 text-[11px] text-sc-text-muted font-mono">
                    <div>RA · {star.ra}</div>
                    <div>Dec · {star.dec}</div>
                  </div>
                  <div className="mt-4 text-[10px] text-sc-text-muted tracking-widest uppercase">
                    StarClaim · {new Date().toLocaleDateString(lang === "TR" ? "tr-TR" : "en-US")}
                  </div>
                </div>
              </div>
              <div className="text-center mt-4 text-xs text-sc-text-muted">
                {lang === "TR" ? "Sertifikan böyle görünecek." : "This is how your certificate will look."}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 animate-fade-up">
              <div className="glass rounded-xl p-5 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-sc-text-muted">{star.name}</span><span>${star.price}</span></div>
                <div className="flex justify-between text-sm text-sc-text-muted"><span>{lang === "TR" ? "Paket" : "Package"}</span><span>{pkg}</span></div>
                <div className="divider-gold my-3" />
                <div className="flex justify-between font-display text-lg"><span>{t("checkout_total")}</span><span className="gold-gradient-text">${total}</span></div>
              </div>
              <div className="glass-gold rounded-xl p-6 text-center">
                <CreditCard className="w-6 h-6 text-sc-gold mx-auto mb-3" strokeWidth={1.4} />
                <div className="font-display text-lg mb-2">
                  {lang === "TR" ? "Stripe ile güvenli ödeme" : "Secure payment with Stripe"}
                </div>
                <p className="text-xs text-sc-text-muted leading-relaxed">
                  {lang === "TR"
                    ? "Tıkladığında Stripe'ın güvenli ödeme sayfasına yönlendirileceksin. Kart bilgilerin asla bizim sunucularımızdan geçmez."
                    : "You'll be redirected to Stripe's secure checkout. Your card details never touch our servers."}
                </p>
                <div className="text-[10px] text-sc-text-muted tracking-widest uppercase mt-4">
                  {lang === "TR" ? "Test modu • 4242 4242 4242 4242 • İstediğin tarih • Herhangi bir CVC" : "Test mode • 4242 4242 4242 4242 • Any future date • Any CVC"}
                </div>
              </div>
              {!user && (
                <div className="text-xs text-sc-gold/90 text-center">
                  {lang === "TR" ? "Devam etmek için Google ile giriş yap." : "Sign in with Google to continue."}
                </div>
              )}
            </div>
          )}

          {step === 4 && order && (
            <div className="text-center py-6 animate-fade-up">
              <div className="flex justify-center mb-5">
                <div className="relative">
                  <div className="absolute inset-0 blur-2xl bg-sc-gold/40 rounded-full" />
                  <div className="relative w-20 h-20 rounded-full border border-sc-gold/40 flex items-center justify-center bg-[#0A1628]">
                    <Star className="w-10 h-10 fill-sc-gold text-sc-gold" strokeWidth={1.2} />
                  </div>
                </div>
              </div>
              <div className="font-display text-2xl gold-gradient-text mb-2">{t("checkout_success")}</div>
              <div className="font-accent italic text-sc-text-muted mb-6">
                {customName} · {star.name}
              </div>
              <div className="flex justify-center gap-3">
                <button className="btn-gold text-sm py-2.5" data-testid="checkout-download">
                  <span className="inline-flex items-center gap-2"><Download className="w-4 h-4" /> {t("checkout_download")}</span>
                </button>
                <button className="btn-ghost text-sm py-2.5" data-testid="checkout-share">
                  <span className="inline-flex items-center gap-2"><Share2 className="w-4 h-4" /> {t("checkout_share")}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* footer actions */}
        {step < 4 && (
          <div className="px-8 py-5 border-t border-white/5 flex items-center justify-between">
            <button
              onClick={back}
              disabled={step === 0}
              className="btn-ghost text-sm py-2 px-4 disabled:opacity-30"
              data-testid="checkout-back"
            >
              <span className="inline-flex items-center gap-1"><ChevronLeft className="w-4 h-4" /> {t("checkout_back")}</span>
            </button>
            <button
              onClick={next}
              disabled={submitting || loadingStory}
              className="btn-gold text-sm py-2.5 px-6"
              data-testid="checkout-next"
            >
              <span className="inline-flex items-center gap-1.5">
                {submitting || loadingStory ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {step === 3 ? t("checkout_pay_now") : t("checkout_next")}
                {step < 3 && !submitting && <ChevronRight className="w-4 h-4" />}
              </span>
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
