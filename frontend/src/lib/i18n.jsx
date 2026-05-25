import React, { createContext, useContext, useMemo, useState, useCallback } from "react";

const DICT = {
  TR: {
    nav_home: "Ana Sayfa",
    nav_pick: "Yıldızını Seç",
    nav_market: "Marketplace",
    nav_stories: "Hikayeler",
    nav_about: "Hakkımızda",
    nav_login: "Giriş Yap",
    nav_claim: "Yıldız Al",
    nav_dashboard: "Yıldızlarım",
    nav_logout: "Çıkış",

    hero_title: "Gökyüzünde\nSonsuz Bir İz Bırak",
    hero_sub: "Kendi yıldızını sahiplen. İsim ver. Hikayeni yaz. Sevdiklerinle komşu ol.",
    hero_cta_pick: "Yıldızını Seç",
    hero_cta_how: "Nasıl Çalışır?",
    hero_counter_prefix: "Bu gece",
    hero_counter_suffix: "yıldız sahiplenildi",

    how_title: "3 Adımda Gökyüzüne Adını Yaz",
    how_1_t: "Yıldızını Seç",
    how_1_d: "Binlerce yıldız arasından sana özel olanı bul. Burcuna göre, takımyıldızına göre veya nadir yıldızlar arasından seç.",
    how_2_t: "İsim Ver",
    how_2_d: "Yıldıza istediğin ismi ver. Sevdiğine özel bir mesaj ekle. Yapay zeka kişisel hikayeni yazar.",
    how_3_t: "Sertifikanı Al",
    how_3_d: "Altın kenarlıklı dijital sertifikan anında hazır. İstersen fiziksel baskıyla gönderelim.",

    zodiac_title: "Burcuna Göre Yıldızını Bul",
    zodiac_sub: "Her burç takımyıldızında seni bekleyen yıldızlar var",

    pricing_title: "Hangi Yıldız Seni Bekliyor?",
    pricing_sub: "5 farklı kademe — her bütçeye, her anıya",

    gift_title: "Hediye Olarak Gönder",
    gift_sub: "Doğum günü, yıldönümü, mezuniyet — en anlamlı hediye gökyüzünden gelir",
    gift_cta: "Hediye Olarak Al",

    social_title: "Sevdiklerinle Komşu Ol",
    social_sub: "Aynı takımyıldızından yıldız alın — gökyüzünde yan yana olun",
    social_couple_t: "Çiftler",
    social_couple_d: "İki yıldız, bir hikaye. Orion'da yan yana iki yıldız sahiplenin.",
    social_friends_t: "Arkadaşlar",
    social_friends_d: "Aynı takımyıldızını paylaşın. Grup haritasında hep birliktesiniz.",
    social_family_t: "Aile",
    social_family_d: "Her aile üyesine bir yıldız. Gökyüzünde aile ağacınız.",

    vision_mission_title: "Misyonumuz",
    vision_mission_p1: "Bir çiçek solar. Bir kutu küçülür. Ama bir yıldız — o orada kalır. Milyonlarca yıl boyunca, her gece. StarClaim'i sevdiklerimize verebileceğimiz en kalıcı hediyeyi mümkün kılmak için kurduk.",
    vision_mission_p2: "Hikayeler, anılar ve mesajlar — hepsi gökyüzüne yazılır. Yapay zeka ile kişiselleştirilir, altın kenarlıklı bir sertifikayla sunulur, Marketplace'te el değiştirir. Her yıldız bir anı taşır.",
    
    vision_pillars_1_t: "Gizlilik Katmanı",
    vision_pillars_1_d: "Monero ve Zcash mantığından ilham alan ZK-proof mimarisiyle mesaj, görsel ve ses gibi kişisel veriler sunucuda açık metin olarak tutulmaz.",
    vision_pillars_2_t: "n8n Otomasyonu",
    vision_pillars_2_d: "Satın alma, AI hikaye üretimi, PDF sertifika, e-posta ve fiziksel baskı siparişi sıfır manuel operasyon prensibiyle birbirine bağlanır.",
    vision_pillars_3_t: "NFT Mülkiyeti",
    vision_pillars_3_d: "Yıldızlar ERC-721 uyumlu benzersiz varlıklara dönüştürülür; sahiplik, transfer ve miras senaryoları zincir üstünde kanıtlanabilir hale gelir.",

    about_title: "Gökyüzü, Hepimizin",
    about_sub: "StarClaim, anıları sonsuza taşımak için doğdu.",
    about_contact_title: "İletişim",
    about_contact_sub: "Bir yıldız için özel bir ricamız mı var? Hemen yazın.",

    stories_title: "Gökyüzünde İz Bırakanlar",
    stories_sub: "Gerçek insanlar, gerçek anılar — yıldızlara yazılmış.",
    stories_featured_title: "Betelgeuse'u Babama Adadım",
    stories_featured_p: "Babam hayatını kaybettiğinde gökyüzünde ona bir yer istedim. Orion'un omzundaki bu kırmızı dev, onun bana bıraktığı bütün hikayelerin evi oldu. Bir yıldız verdim — ama o bana bir galaksi kadar sessiz, bir o kadar derin bir anı bıraktı…",
    stories_guide_title: "Astronomi Rehberi",

    market_preview_title: "Yıldız Al-Sat Marketplace",
    market_preview_sub: "Yıldızlar el değiştirir, değer kazanır. Sen de yatırım yap.",
    market_cta: "Marketplace'e Git",
    market_commission: "Aldığın yıldızı istediğin fiyata satışa koy. Her ikinci el satıştan yalnızca %10 platform komisyonu alınır.",

    testimonial_title: "Gökyüzünde İz Bırakanlar",
    faq_title: "Sıkça Sorulan Sorular",

    newsletter_title: "Gökyüzü Haberleri",
    newsletter_sub: "Meteor yağmurları, özel kampanyalar ve yeni yıldız haberleri için abone ol",
    newsletter_cta: "Abone Ol",
    newsletter_small: "Spam yok. İstediğin zaman çık.",

    picker_title: "Yıldızını Seç",
    picker_sub: "Binlerce yıldız arasından sana özel olanı bul",
    picker_tier: "Kademe",
    picker_constellation: "Takımyıldızı",
    picker_sort: "Sıralama",
    picker_price: "Fiyat aralığı",
    picker_only_available: "Sadece müsait",
    picker_claim: "Sahiplen",
    picker_view: "Marketplace'te Gör",
    picker_available: "Müsait",
    picker_owned_by: "Sahibi",

    market_title: "Yıldız Marketplace'i",
    market_sub: "Sahiplerinden yıldız satın al. Kendi yıldızını sat. Değer kazan.",
    market_banner: "Yıldız al → İstersen sat → %10 komisyon → Herkes kazanır",
    market_original: "Orijinal",
    market_asking: "İstenen",
    market_buy: "Satın Al",
    market_offer: "Teklif Ver",
    market_days_ago: "gün önce sahiplendi",
    market_commission_box: "StarClaim her satıştan yalnızca %10 komisyon alır. Geri kalan %90 satıcıya ödenir.",

    tier_legendary: "Efsanevi",
    tier_zodiac: "Zodyak",
    tier_named: "İsimli",
    tier_constellation: "Takımyıldızı",
    tier_standard: "Standart",

    checkout_step_personalize: "Kişiselleştir",
    checkout_step_package: "Paket",
    checkout_step_preview: "Önizleme",
    checkout_step_payment: "Ödeme",
    checkout_step_done: "Tamam",
    checkout_name_label: "Yıldıza vereceğin isim",
    checkout_name_ph: "Örn: Ayşe'nin Yıldızı",
    checkout_message_label: "Kişisel mesaj / adanma",
    checkout_message_ph: "En fazla 200 karakter",
    checkout_occasion_label: "Özel gün",
    checkout_gift_label: "Hediye olarak göndereceğim",
    checkout_recipient_name: "Alıcı adı",
    checkout_recipient_email: "Alıcı email",
    checkout_generate_story: "AI Hikaye Oluştur",
    checkout_generating: "Yıldız için şiir yazılıyor...",
    checkout_pay_now: "Ödemeyi Tamamla",
    checkout_secure: "Güvenli ödeme — SSL şifreli",
    checkout_success: "Tebrikler! Yıldız artık senin.",
    checkout_download: "Sertifikayı İndir",
    checkout_share: "Arkadaşlarınla paylaş",
    checkout_next: "Devam",
    checkout_back: "Geri",
    checkout_total: "Toplam",

    occasions: {
      general: "Genel",
      birthday: "Doğum Günü",
      anniversary: "Yıldönümü",
      valentines: "Sevgililer",
      graduation: "Mezuniyet",
      newborn: "Yeni Doğan",
      memorial: "Anma",
      friendship: "Arkadaşlık",
      thanks: "Teşekkür",
    },
  },
  EN: {
    nav_home: "Home",
    nav_pick: "Pick Your Star",
    nav_market: "Marketplace",
    nav_stories: "Stories",
    nav_about: "About",
    nav_login: "Sign In",
    nav_claim: "Claim a Star",
    nav_dashboard: "My Stars",
    nav_logout: "Log out",

    hero_title: "Leave an Eternal\nMark in the Sky",
    hero_sub: "Own a star. Name it. Write your story. Be neighbors with the ones you love.",
    hero_cta_pick: "Claim Your Star",
    hero_cta_how: "How It Works",
    hero_counter_prefix: "Tonight",
    hero_counter_suffix: "stars were claimed",

    how_title: "Three Steps to the Stars",
    how_1_t: "Pick Your Star",
    how_1_d: "Find yours among thousands. Filter by zodiac, constellation, or rarity.",
    how_2_t: "Name It",
    how_2_d: "Give it any name. Add a personal note. Our AI writes you a heartfelt story.",
    how_3_t: "Receive Certificate",
    how_3_d: "A gold-bordered digital certificate lands instantly. Physical print optional.",

    zodiac_title: "Find Your Star by Zodiac",
    zodiac_sub: "Every zodiac constellation has a star waiting for you",

    pricing_title: "Which Star Awaits You?",
    pricing_sub: "Five tiers — a memory for every budget",

    gift_title: "Send It as a Gift",
    gift_sub: "Birthday, anniversary, graduation — the most meaningful gift comes from the sky",
    gift_cta: "Gift a Star",

    social_title: "Be Neighbors With Loved Ones",
    social_sub: "Claim stars from the same constellation — stand side by side in the sky",
    social_couple_t: "Couples",
    social_couple_d: "Two stars, one story. Own two adjacent stars in Orion.",
    social_friends_t: "Friends",
    social_friends_d: "Share the same constellation. Always together on the group map.",
    social_family_t: "Family",
    social_family_d: "A star for every member. Your family tree in the sky.",

    vision_mission_title: "Our Mission",
    vision_mission_p1: "Flowers fade. Boxes shrink. But a star stays — for millions of years, every single night. We founded StarClaim to make the most permanent gift we can give those we love.",
    vision_mission_p2: "Stories, memories, messages — all written into the sky. Personalized with AI, delivered as a gold-bordered certificate, passed on through the Marketplace. Every star carries a memory.",

    vision_pillars_1_t: "Privacy Layer",
    vision_pillars_1_d: "Inspired by Monero and Zcash, our ZK-proof architecture ensures personal data like messages, images, and audio are never stored as plain text on the server.",
    vision_pillars_2_t: "n8n Automation",
    vision_pillars_2_d: "Purchasing, AI story generation, PDF certificates, emails, and physical print orders are all connected through a zero-manual-operation principle.",
    vision_pillars_3_t: "NFT Ownership",
    vision_pillars_3_d: "Stars are transformed into ERC-721 compatible unique assets; ownership, transfer, and legacy scenarios become provable on-chain.",

    about_title: "The Sky is Ours",
    about_sub: "StarClaim was born to carry memories into eternity.",
    about_contact_title: "Contact",
    about_contact_sub: "Special request for a star? Drop us a line.",

    stories_title: "Those Who Left Their Mark",
    stories_sub: "Real people, real memories — written in the stars.",
    stories_featured_title: "I Dedicated Betelgeuse to My Father",
    stories_featured_p: "When my father passed away, I wanted a place for him in the sky. This red giant on Orion's shoulder became the home of all the stories he left me. I gave a star — but he left me a memory as silent and as deep as a galaxy…",
    stories_guide_title: "Astronomy Guide",

    market_preview_title: "Star Marketplace",
    market_preview_sub: "Stars change hands and gain value. Invest too.",
    market_cta: "Open Marketplace",
    market_commission: "List your star at any price. Only 10% platform commission on resales.",

    testimonial_title: "Those Who Left Their Mark",
    faq_title: "Frequently Asked",

    newsletter_title: "Sky News",
    newsletter_sub: "Subscribe for meteor showers, special campaigns, new star drops",
    newsletter_cta: "Subscribe",
    newsletter_small: "No spam. Unsubscribe anytime.",

    picker_title: "Pick Your Star",
    picker_sub: "Find yours among thousands",
    picker_tier: "Tier",
    picker_constellation: "Constellation",
    picker_sort: "Sort",
    picker_price: "Price range",
    picker_only_available: "Available only",
    picker_claim: "Claim",
    picker_view: "View on Marketplace",
    picker_available: "Available",
    picker_owned_by: "Owned by",

    market_title: "Star Marketplace",
    market_sub: "Buy from owners. Sell your star. Gain value.",
    market_banner: "Buy → List → 10% commission → Everyone wins",
    market_original: "Original",
    market_asking: "Asking",
    market_buy: "Buy",
    market_offer: "Make Offer",
    market_days_ago: "days ago",
    market_commission_box: "StarClaim charges only 10% on resales. Sellers keep 90%.",

    tier_legendary: "Legendary",
    tier_zodiac: "Zodiac",
    tier_named: "Named",
    tier_constellation: "Constellation",
    tier_standard: "Standard",

    checkout_step_personalize: "Personalize",
    checkout_step_package: "Package",
    checkout_step_preview: "Preview",
    checkout_step_payment: "Payment",
    checkout_step_done: "Done",
    checkout_name_label: "Give your star a name",
    checkout_name_ph: "e.g. Emma's Star",
    checkout_message_label: "Personal message / dedication",
    checkout_message_ph: "Max 200 characters",
    checkout_occasion_label: "Occasion",
    checkout_gift_label: "Send as a gift",
    checkout_recipient_name: "Recipient name",
    checkout_recipient_email: "Recipient email",
    checkout_generate_story: "Generate AI Story",
    checkout_generating: "Writing a poem for your star...",
    checkout_pay_now: "Complete Payment",
    checkout_secure: "Secure payment — SSL encrypted",
    checkout_success: "Congratulations! The star is yours.",
    checkout_download: "Download Certificate",
    checkout_share: "Share",
    checkout_next: "Next",
    checkout_back: "Back",
    checkout_total: "Total",

    occasions: {
      general: "General",
      birthday: "Birthday",
      anniversary: "Anniversary",
      valentines: "Valentine's",
      graduation: "Graduation",
      newborn: "Newborn",
      memorial: "Memorial",
      friendship: "Friendship",
      thanks: "Thank You",
    },
  },
};

const LangContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem("sc_lang") || "TR");
  const toggle = useCallback(() => {
    setLang((l) => {
      const n = l === "TR" ? "EN" : "TR";
      localStorage.setItem("sc_lang", n);
      return n;
    });
  }, []);
  const t = useCallback((key) => {
    const parts = key.split(".");
    let cur = DICT[lang];
    for (const p of parts) {
      if (cur && Object.prototype.hasOwnProperty.call(cur, p)) cur = cur[p];
      else return key;
    }
    return cur;
  }, [lang]);
  const value = useMemo(() => ({ lang, setLang, toggle, t }), [lang, t, toggle]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useT() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useT must be used within LanguageProvider");
  return ctx;
}
