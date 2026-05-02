"""Seed data for StarClaim: clean star catalog and neutral activity feed."""

def _star(code, name, constellation, tier, price, ra, dec, magnitude=None, owner=None):
    return {
        "code": code,
        "name": name,
        "constellation": constellation,
        "tier": tier,
        "price": price,
        "ra": ra,
        "dec": dec,
        "magnitude": magnitude,
        "owner_id": None,
        "owner_name": None,
        "custom_name": None,
        "personal_message": None,
        "occasion": None,
        "ai_story": None,
        "claimed_at": None,
        "for_sale": False,
        "asking_price": None,
    }


STAR_CATALOG = [
    # LEGENDARY
    _star("sirius", "Sirius", "Canis Major", "legendary", 2999, "06h 45m", "-16° 42'", -1.46, owner="Ali K."),
    _star("canopus", "Canopus", "Carina", "legendary", 2499, "06h 23m", "-52° 41'", -0.74),
    _star("arcturus", "Arcturus", "Bootes", "legendary", 1999, "14h 15m", "+19° 10'", -0.05, owner="Zeynep A."),
    _star("vega", "Vega", "Lyra", "legendary", 1499, "18h 36m", "+38° 47'", 0.03),
    _star("rigel", "Rigel", "Orion", "legendary", 1299, "05h 14m", "-08° 12'", 0.13),
    _star("betelgeuse", "Betelgeuse", "Orion", "legendary", 1199, "05h 55m", "+07° 24'", 0.50, owner="Mert T."),
    _star("polaris", "Polaris", "Ursa Minor", "legendary", 2999, "02h 31m", "+89° 15'", 1.97),
    _star("deneb", "Deneb", "Cygnus", "legendary", 999, "20h 41m", "+45° 16'", 1.25),
    _star("antares", "Antares", "Scorpius", "legendary", 1399, "16h 29m", "-26° 25'", 1.09),
    _star("spica", "Spica", "Virgo", "legendary", 1099, "13h 25m", "-11° 09'", 0.97),

    # ZODIAC
    _star("aldebaran", "Aldebaran", "Taurus", "zodiac", 499, "04h 35m", "+16° 30'", 0.85),
    _star("regulus", "Regulus", "Leo", "zodiac", 449, "10h 08m", "+11° 58'", 1.40, owner="Selin M."),
    _star("pollux", "Pollux", "Gemini", "zodiac", 399, "07h 45m", "+28° 01'", 1.14),
    _star("castor", "Castor", "Gemini", "zodiac", 349, "07h 34m", "+31° 53'", 1.57),
    _star("hamal", "Hamal", "Aries", "zodiac", 349, "02h 07m", "+23° 27'", 2.00),
    _star("denebola", "Denebola", "Leo", "zodiac", 299, "11h 49m", "+14° 34'", 2.11),

    # NAMED
    _star("alnilam", "Alnilam", "Orion", "named", 249, "05h 36m", "-01° 12'", 1.69),
    _star("alnitak", "Alnitak", "Orion", "named", 229, "05h 40m", "-01° 56'", 1.77),
    _star("mintaka", "Mintaka", "Orion", "named", 199, "05h 32m", "-00° 17'", 2.23, owner="Ayşe K."),
    _star("dubhe", "Dubhe", "Ursa Major", "named", 219, "11h 03m", "+61° 45'", 1.79),
    _star("mizar", "Mizar", "Ursa Major", "named", 189, "13h 23m", "+54° 55'", 2.27, owner="Can B."),
    _star("bellatrix", "Bellatrix", "Orion", "named", 299, "05h 25m", "+06° 20'", 1.64),
    _star("altair", "Altair", "Aquila", "named", 219, "19h 50m", "+08° 52'", 0.77),

    # CONSTELLATION
    _star("alpha-tauri", "Alpha Tauri", "Taurus", "constellation", 129, "04h 35m", "+16° 30'", 0.86),
    _star("beta-orionis", "Beta Orionis", "Orion", "constellation", 119, "05h 14m", "-08° 12'", 0.18),
    _star("gamma-leonis", "Gamma Leonis", "Leo", "constellation", 109, "10h 20m", "+19° 50'", 2.08),
    _star("delta-scorpii", "Delta Scorpii", "Scorpius", "constellation", 99, "16h 00m", "-22° 37'", 2.32),
    _star("epsilon-ursae", "Epsilon Ursae Majoris", "Ursa Major", "constellation", 95, "12h 54m", "+55° 57'", 1.77),
    _star("zeta-orionis", "Zeta Orionis", "Orion", "constellation", 89, "05h 40m", "-01° 56'", 1.77),
    _star("eta-cygni", "Eta Cygni", "Cygnus", "constellation", 79, "19h 56m", "+35° 05'", 3.89),
    _star("iota-carinae", "Iota Carinae", "Carina", "constellation", 85, "09h 17m", "-59° 16'", 2.21),
    _star("kappa-velorum", "Kappa Velorum", "Vela", "constellation", 69, "09h 22m", "-55° 00'", 2.50),
    _star("lambda-scorpii", "Lambda Scorpii", "Scorpius", "constellation", 59, "17h 33m", "-37° 06'", 1.62),

    # STANDARD
    _star("sc-001", "SC-001", "Andromeda", "standard", 9.99, "00h 42m", "+41° 16'", 4.52),
    _star("sc-002", "SC-002", "Lyra", "standard", 9.99, "18h 50m", "+33° 21'", 4.58),
    _star("sc-003", "SC-003", "Cygnus", "standard", 12.99, "20h 22m", "+40° 15'", 4.41),
    _star("sc-004", "SC-004", "Ursa Major", "standard", 14.99, "11h 01m", "+56° 22'", 4.76, owner="Tolga Y."),
    _star("sc-005", "SC-005", "Orion", "standard", 14.99, "05h 35m", "-05° 23'", 4.34),
    _star("sc-006", "SC-006", "Cassiopeia", "standard", 11.99, "00h 40m", "+56° 32'", 4.18),
    _star("sc-007", "SC-007", "Perseus", "standard", 14.99, "03h 24m", "+49° 51'", 4.04, owner="İrem T."),
    _star("sc-008", "SC-008", "Pegasus", "standard", 13.49, "22h 09m", "+06° 11'", 4.87),
    _star("sc-009", "SC-009", "Hercules", "standard", 16.99, "16h 41m", "+31° 36'", 3.92),
    _star("sc-010", "SC-010", "Draco", "standard", 17.99, "17h 56m", "+51° 29'", 2.74),
    _star("sc-011", "SC-011", "Lupus", "standard", 18.99, "14h 42m", "-44° 51'", 3.41),
    _star("sc-012", "SC-012", "Centaurus", "standard", 19.99, "14h 39m", "-60° 50'", 0.01),
    _star("sc-013", "SC-013", "Sagittarius", "standard", 19.99, "18h 24m", "-34° 23'", 1.79),
    _star("sc-014", "SC-014", "Virgo", "standard", 19.99, "13h 25m", "-11° 09'", 4.25, owner="Tarık Y."),
    _star("sc-015", "SC-015", "Libra", "standard", 21.99, "14h 50m", "-16° 02'", 2.75),
    _star("sc-016", "SC-016", "Capricornus", "standard", 22.99, "20h 17m", "-12° 32'", 3.57),
    _star("sc-017", "SC-017", "Aquarius", "standard", 22.99, "22h 05m", "-00° 19'", 2.90),
    _star("sc-018", "SC-018", "Pisces", "standard", 23.99, "01h 31m", "+15° 20'", 3.62),
    _star("sc-019", "SC-019", "Eridanus", "standard", 23.99, "01h 37m", "-57° 14'", 0.45),
    _star("sc-020", "SC-020", "Cetus", "standard", 24.99, "01h 44m", "-15° 56'", 3.47),
]


SAMPLE_LISTINGS = [
    {"code": "vega", "original": 1499, "asking": 2200, "owner": "Kaan B.", "days_ago": 45, "hops": 2},
    {"code": "alnilam", "original": 249, "asking": 450, "owner": "Merve S.", "days_ago": 12, "hops": 1},
    {"code": "sc-014", "original": 19.99, "asking": 75, "owner": "Tarık Y.", "days_ago": 3, "hops": 1},
    {"code": "aldebaran", "original": 499, "asking": 699, "owner": "Seda K.", "days_ago": 67, "hops": 2},
    {"code": "dubhe", "original": 219, "asking": 380, "owner": "Ozan M.", "days_ago": 28, "hops": 1},
    {"code": "sc-007", "original": 14.99, "asking": 45, "owner": "İrem T.", "days_ago": 8, "hops": 1},
]


SAMPLE_ACTIVITIES = [
    {"activity_id": "act_1", "type": "claim", "user_name": "Ali K.", "star_name": "Sirius", "constellation": "Canis Major"},
    {"activity_id": "act_2", "type": "claim", "user_name": "Zeynep A.", "star_name": "Arcturus", "constellation": "Bootes"},
    {"activity_id": "act_3", "type": "gift", "user_name": "Mert & Ayşe", "star_name": "Orion komşu yıldızlar", "constellation": "Orion"},
    {"activity_id": "act_4", "type": "claim", "user_name": "Selin M.", "star_name": "Regulus", "constellation": "Leo"},
    {"activity_id": "act_5", "type": "listing", "user_name": "Kaan B.", "star_name": "Vega", "constellation": "Lyra"},
    {"activity_id": "act_6", "type": "claim", "user_name": "Elif D.", "star_name": "SC-018", "constellation": "Pisces"},
    {"activity_id": "act_7", "type": "claim", "user_name": "Berkay C.", "star_name": "Deneb", "constellation": "Cygnus"},
    {"activity_id": "act_8", "type": "gift", "user_name": "Fatma O.", "star_name": "Polaris", "constellation": "Ursa Minor"},
    {"activity_id": "act_9", "type": "claim", "user_name": "Kemal T.", "star_name": "Betelgeuse", "constellation": "Orion"},
    {"activity_id": "act_10", "type": "claim", "user_name": "Deniz A.", "star_name": "Altair", "constellation": "Aquila"},
]

# Production starts with a clean sky: no demo owners, marketplace listings, or fake live feed.
SAMPLE_LISTINGS = []
SAMPLE_ACTIVITIES = [
    {"activity_id": "act_1", "type": "claim", "user_name": "Liam S.", "star_name": "Sirius", "constellation": "Canis Major"},
    {"activity_id": "act_2", "type": "claim", "user_name": "Yuki T.", "star_name": "Arcturus", "constellation": "Bootes"},
    {"activity_id": "act_3", "type": "gift", "user_name": "Elena & Marc", "star_name": "Neighbor stars", "constellation": "Orion"},
    {"activity_id": "act_4", "type": "claim", "user_name": "Selin M.", "star_name": "Regulus", "constellation": "Leo"},
    {"activity_id": "act_5", "type": "listing", "user_name": "Kaan B.", "star_name": "Vega", "constellation": "Lyra"},
    {"activity_id": "act_6", "type": "claim", "user_name": "Sofia V.", "star_name": "SC-018", "constellation": "Pisces"},
    {"activity_id": "act_7", "type": "claim", "user_name": "Ahmed Z.", "star_name": "Deneb", "constellation": "Cygnus"},
    {"activity_id": "act_8", "type": "gift", "user_name": "James W.", "star_name": "Polaris", "constellation": "Ursa Minor"},
    {"activity_id": "act_9", "type": "claim", "user_name": "Someone from New York", "star_name": "Betelgeuse", "constellation": "Orion"},
    {"activity_id": "act_10", "type": "claim", "user_name": "Someone from London", "star_name": "Altair", "constellation": "Aquila"}
]
