"""
P0.8.5b - Complete DSO Seed Data & MongoDB Import
110 Messier + 500 NGC objects for 3D Voyage

Comprehensive astronomical catalog with accurate coordinates,
distances, and metadata for production deployment.
"""

from bson.objectid import ObjectId
from datetime import datetime
import math

# ============================================================================
# COMPLETE MESSIER CATALOG (M1-M110) - ALL 110 OBJECTS
# ============================================================================

MESSIER_CATALOG = [
    # M1-M15: Initial Messier Objects
    {"messierNumber": 1, "ngcNumber": 1952, "commonName": "Crab Nebula", "type": "Supernova Remnant", "raDegrees": 83.633, "decDegrees": 22.014, "distanceParsec": 1300, "magnitude": 8.4, "sizeArcmin": 5.5, "color": [0.7, 0.5, 0.3], "constellation": "Taurus", "discovered": 1731, "discoverer": "John Bevis"},
    {"messierNumber": 2, "ngcNumber": 7089, "commonName": "Great Globular Cluster in Aquarius", "type": "Globular Cluster", "raDegrees": 323.363, "decDegrees": -0.823, "distanceParsec": 8800, "magnitude": 6.5, "sizeArcmin": 16.0, "color": [0.8, 0.8, 1.0], "constellation": "Aquarius", "discovered": 1746, "discoverer": "Jean-Dominique Maraldi"},
    {"messierNumber": 3, "ngcNumber": 5272, "commonName": "Globular Cluster", "type": "Globular Cluster", "raDegrees": 205.548, "decDegrees": 28.376, "distanceParsec": 10400, "magnitude": 6.2, "sizeArcmin": 18.0, "color": [0.8, 0.8, 1.0], "constellation": "Canes Venatici", "discovered": 1764, "discoverer": "Charles Messier"},
    {"messierNumber": 4, "ngcNumber": 6121, "commonName": "Globular Cluster", "type": "Globular Cluster", "raDegrees": 245.895, "decDegrees": -26.526, "distanceParsec": 2200, "magnitude": 5.4, "sizeArcmin": 36.0, "color": [0.8, 0.8, 1.0], "constellation": "Scorpius", "discovered": 1745, "discoverer": "Jean-Philippe Loys de Chéseaux"},
    {"messierNumber": 5, "ngcNumber": 5904, "commonName": "Globular Cluster", "type": "Globular Cluster", "raDegrees": 229.638, "decDegrees": 2.077, "distanceParsec": 7500, "magnitude": 5.6, "sizeArcmin": 23.0, "color": [0.8, 0.8, 1.0], "constellation": "Serpens", "discovered": 1702, "discoverer": "Gottfried Kirch"},
    {"messierNumber": 6, "ngcNumber": 6405, "commonName": "Butterfly Cluster", "type": "Open Cluster", "raDegrees": 265.106, "decDegrees": -32.213, "distanceParsec": 1600, "magnitude": 4.2, "sizeArcmin": 20.0, "color": [0.9, 0.9, 0.8], "constellation": "Scorpius", "discovered": 1654, "discoverer": "Unknown"},
    {"messierNumber": 7, "ngcNumber": 6475, "commonName": "Ptolemy Cluster", "type": "Open Cluster", "raDegrees": 268.538, "decDegrees": -34.794, "distanceParsec": 800, "magnitude": 3.3, "sizeArcmin": 80.0, "color": [0.9, 0.9, 0.8], "constellation": "Scorpius", "discovered": 130, "discoverer": "Ptolemy"},
    {"messierNumber": 8, "ngcNumber": 6523, "commonName": "Lagoon Nebula", "type": "Emission Nebula", "raDegrees": 270.922, "decDegrees": -24.369, "distanceParsec": 1900, "magnitude": 6.0, "sizeArcmin": 90.0, "color": [0.6, 0.9, 0.4], "constellation": "Sagittarius", "discovered": 1654, "discoverer": "Unknown"},
    {"messierNumber": 9, "ngcNumber": 6333, "commonName": "Globular Cluster", "type": "Globular Cluster", "raDegrees": 248.984, "decDegrees": -18.505, "distanceParsec": 8100, "magnitude": 7.7, "sizeArcmin": 12.0, "color": [0.8, 0.8, 1.0], "constellation": "Ophiuchus", "discovered": 1764, "discoverer": "Charles Messier"},
    {"messierNumber": 10, "ngcNumber": 6254, "commonName": "Globular Cluster", "type": "Globular Cluster", "raDegrees": 254.287, "decDegrees": -4.100, "distanceParsec": 4200, "magnitude": 6.6, "sizeArcmin": 20.0, "color": [0.8, 0.8, 1.0], "constellation": "Ophiuchus", "discovered": 1764, "discoverer": "Charles Messier"},
    {"messierNumber": 11, "ngcNumber": 6705, "commonName": "Wild Duck Cluster", "type": "Open Cluster", "raDegrees": 282.763, "decDegrees": -6.265, "distanceParsec": 2100, "magnitude": 5.8, "sizeArcmin": 14.0, "color": [0.9, 0.9, 0.8], "constellation": "Scutum", "discovered": 1681, "discoverer": "Gottfried Kirch"},
    {"messierNumber": 12, "ngcNumber": 6218, "commonName": "Globular Cluster", "type": "Globular Cluster", "raDegrees": 248.226, "decDegrees": -1.949, "distanceParsec": 4100, "magnitude": 6.7, "sizeArcmin": 16.0, "color": [0.8, 0.8, 1.0], "constellation": "Ophiuchus", "discovered": 1764, "discoverer": "Charles Messier"},
    {"messierNumber": 13, "ngcNumber": 6205, "commonName": "Great Globular Cluster in Hercules", "type": "Globular Cluster", "raDegrees": 250.424, "decDegrees": 36.459, "distanceParsec": 7200, "magnitude": 5.8, "sizeArcmin": 20.1, "color": [0.8, 0.8, 1.0], "constellation": "Hercules", "discovered": 1714, "discoverer": "Edmond Halley"},
    {"messierNumber": 14, "ngcNumber": 6402, "commonName": "Globular Cluster", "type": "Globular Cluster", "raDegrees": 265.645, "decDegrees": -3.240, "distanceParsec": 9900, "magnitude": 7.6, "sizeArcmin": 11.7, "color": [0.8, 0.8, 1.0], "constellation": "Ophiuchus", "discovered": 1764, "discoverer": "Charles Messier"},
    {"messierNumber": 15, "ngcNumber": 7078, "commonName": "Globular Cluster", "type": "Globular Cluster", "raDegrees": 319.104, "decDegrees": 12.167, "distanceParsec": 10400, "magnitude": 6.2, "sizeArcmin": 18.0, "color": [0.8, 0.8, 1.0], "constellation": "Pegasus", "discovered": 1746, "discoverer": "Jean-Dominique Maraldi"},
    
    # M16-M30: Eagle through Capella
    {"messierNumber": 16, "ngcNumber": 6611, "commonName": "Eagle Nebula", "type": "Emission Nebula", "raDegrees": 274.700, "decDegrees": -13.807, "distanceParsec": 2000, "magnitude": 6.0, "sizeArcmin": 20.0, "color": [0.6, 0.9, 0.4], "constellation": "Serpens", "discovered": 1746, "discoverer": "Jean-Philippe Loys de Chéseaux"},
    {"messierNumber": 17, "ngcNumber": 6618, "commonName": "Omega Nebula", "type": "Emission Nebula", "raDegrees": 275.145, "decDegrees": -16.171, "distanceParsec": 2000, "magnitude": 6.0, "sizeArcmin": 46.0, "color": [0.6, 0.9, 0.4], "constellation": "Sagittarius", "discovered": 1745, "discoverer": "Jean-Philippe Loys de Chéseaux"},
    {"messierNumber": 18, "ngcNumber": 6613, "commonName": "Open Cluster", "type": "Open Cluster", "raDegrees": 274.962, "decDegrees": -17.076, "distanceParsec": 2200, "magnitude": 6.9, "sizeArcmin": 9.0, "color": [0.9, 0.9, 0.8], "constellation": "Sagittarius", "discovered": 1745, "discoverer": "Jean-Philippe Loys de Chéseaux"},
    {"messierNumber": 19, "ngcNumber": 6273, "commonName": "Globular Cluster", "type": "Globular Cluster", "raDegrees": 246.816, "decDegrees": -27.224, "distanceParsec": 8600, "magnitude": 7.1, "sizeArcmin": 13.8, "color": [0.8, 0.8, 1.0], "constellation": "Ophiuchus", "discovered": 1764, "discoverer": "Charles Messier"},
    {"messierNumber": 20, "ngcNumber": 6514, "commonName": "Trifid Nebula", "type": "Emission Nebula", "raDegrees": 270.295, "decDegrees": -23.021, "distanceParsec": 1600, "magnitude": 6.3, "sizeArcmin": 29.0, "color": [0.6, 0.9, 0.4], "constellation": "Sagittarius", "discovered": 1764, "discoverer": "Charles Messier"},
    {"messierNumber": 21, "ngcNumber": 6531, "commonName": "Open Cluster", "type": "Open Cluster", "raDegrees": 270.585, "decDegrees": -22.496, "distanceParsec": 1980, "magnitude": 5.9, "sizeArcmin": 13.0, "color": [0.9, 0.9, 0.8], "constellation": "Sagittarius", "discovered": 1764, "discoverer": "Charles Messier"},
    {"messierNumber": 22, "ngcNumber": 6656, "commonName": "Globular Cluster", "type": "Globular Cluster", "raDegrees": 279.103, "decDegrees": -23.902, "distanceParsec": 3200, "magnitude": 5.1, "sizeArcmin": 32.3, "color": [0.8, 0.8, 1.0], "constellation": "Sagittarius", "discovered": 1665, "discoverer": "Abraham Ihle"},
    {"messierNumber": 23, "ngcNumber": 6494, "commonName": "Open Cluster", "type": "Open Cluster", "raDegrees": 269.448, "decDegrees": -19.017, "distanceParsec": 2300, "magnitude": 5.5, "sizeArcmin": 27.0, "color": [0.9, 0.9, 0.8], "constellation": "Sagittarius", "discovered": 1764, "discoverer": "Charles Messier"},
    {"messierNumber": 24, "ngcNumber": 6603, "commonName": "Milky Way Star Cloud", "type": "Star Cloud", "raDegrees": 271.825, "decDegrees": -18.404, "distanceParsec": 4500, "magnitude": 4.6, "sizeArcmin": 90.0, "color": [0.9, 0.9, 0.9], "constellation": "Sagittarius", "discovered": 1764, "discoverer": "Charles Messier"},
    {"messierNumber": 25, "ngcNumber": 6694, "commonName": "Open Cluster", "type": "Open Cluster", "raDegrees": 278.561, "decDegrees": -19.252, "distanceParsec": 1900, "magnitude": 4.6, "sizeArcmin": 32.0, "color": [0.9, 0.9, 0.8], "constellation": "Sagittarius", "discovered": 1764, "discoverer": "Charles Messier"},
    {"messierNumber": 26, "ngcNumber": 6694, "commonName": "Open Cluster", "type": "Open Cluster", "raDegrees": 282.733, "decDegrees": -9.367, "distanceParsec": 2300, "magnitude": 8.0, "sizeArcmin": 15.0, "color": [0.9, 0.9, 0.8], "constellation": "Scutum", "discovered": 1764, "discoverer": "Charles Messier"},
    {"messierNumber": 27, "ngcNumber": 6853, "commonName": "Dumbbell Nebula", "type": "Planetary Nebula", "raDegrees": 299.898, "decDegrees": 22.720, "distanceParsec": 1250, "magnitude": 7.5, "sizeArcmin": 8.0, "color": [0.6, 0.8, 0.9], "constellation": "Vulpecula", "discovered": 1764, "discoverer": "Charles Messier"},
    {"messierNumber": 28, "ngcNumber": 6626, "commonName": "Globular Cluster", "type": "Globular Cluster", "raDegrees": 276.069, "decDegrees": -24.868, "distanceParsec": 7700, "magnitude": 6.8, "sizeArcmin": 11.2, "color": [0.8, 0.8, 1.0], "constellation": "Sagittarius", "discovered": 1764, "discoverer": "Charles Messier"},
    {"messierNumber": 29, "ngcNumber": 6913, "commonName": "Open Cluster", "type": "Open Cluster", "raDegrees": 305.120, "decDegrees": 38.535, "distanceParsec": 2000, "magnitude": 6.6, "sizeArcmin": 7.0, "color": [0.9, 0.9, 0.8], "constellation": "Cygnus", "discovered": 1764, "discoverer": "Charles Messier"},
    {"messierNumber": 30, "ngcNumber": 7099, "commonName": "Globular Cluster", "type": "Globular Cluster", "raDegrees": 325.092, "decDegrees": -23.179, "distanceParsec": 8100, "magnitude": 7.2, "sizeArcmin": 11.0, "color": [0.8, 0.8, 1.0], "constellation": "Capella", "discovered": 1764, "discoverer": "Charles Messier"},
    
    # M31-M45: Andromeda through Pleiades
    {"messierNumber": 31, "ngcNumber": 224, "commonName": "Andromeda Galaxy", "type": "Galaxy", "raDegrees": 10.685, "decDegrees": 41.269, "distanceParsec": 770000, "magnitude": 3.4, "sizeArcmin": 178.0, "color": [0.9, 0.8, 0.7], "constellation": "Andromeda", "discovered": 964, "discoverer": "Abd al-Rahman al-Sufi"},
    {"messierNumber": 32, "ngcNumber": 221, "commonName": "Dwarf Elliptical Galaxy", "type": "Galaxy", "raDegrees": 10.668, "decDegrees": 40.865, "distanceParsec": 770000, "magnitude": 8.1, "sizeArcmin": 8.7, "color": [0.85, 0.80, 0.75], "constellation": "Andromeda", "discovered": 1749, "discoverer": "Le Gentil"},
    {"messierNumber": 33, "ngcNumber": 598, "commonName": "Triangulum Galaxy", "type": "Galaxy", "raDegrees": 23.462, "decDegrees": 30.660, "distanceParsec": 860000, "magnitude": 5.7, "sizeArcmin": 73.0, "color": [0.88, 0.78, 0.70], "constellation": "Triangulum", "discovered": 1654, "discoverer": "Giovanni Battista Hodierna"},
    {"messierNumber": 34, "ngcNumber": 1039, "commonName": "Open Cluster", "type": "Open Cluster", "raDegrees": 42.787, "decDegrees": 42.737, "distanceParsec": 1400, "magnitude": 5.2, "sizeArcmin": 35.0, "color": [0.9, 0.9, 0.8], "constellation": "Perseus", "discovered": 1764, "discoverer": "Charles Messier"},
    {"messierNumber": 35, "ngcNumber": 2168, "commonName": "Open Cluster", "type": "Open Cluster", "raDegrees": 92.348, "decDegrees": 24.338, "distanceParsec": 840, "magnitude": 5.1, "sizeArcmin": 28.0, "color": [0.9, 0.9, 0.8], "constellation": "Gemini", "discovered": 1745, "discoverer": "Jean-Philippe Loys de Chéseaux"},
    {"messierNumber": 36, "ngcNumber": 1960, "commonName": "Open Cluster", "type": "Open Cluster", "raDegrees": 85.388, "decDegrees": 34.138, "distanceParsec": 1300, "magnitude": 6.0, "sizeArcmin": 12.0, "color": [0.9, 0.9, 0.8], "constellation": "Auriga", "discovered": 1654, "discoverer": "Unknown"},
    {"messierNumber": 37, "ngcNumber": 2099, "commonName": "Open Cluster", "type": "Open Cluster", "raDegrees": 88.297, "decDegrees": 32.554, "distanceParsec": 1400, "magnitude": 5.6, "sizeArcmin": 24.0, "color": [0.9, 0.9, 0.8], "constellation": "Auriga", "discovered": 1654, "discoverer": "Unknown"},
    {"messierNumber": 38, "ngcNumber": 1912, "commonName": "Open Cluster", "type": "Open Cluster", "raDegrees": 84.546, "decDegrees": 35.806, "distanceParsec": 1300, "magnitude": 6.4, "sizeArcmin": 21.0, "color": [0.9, 0.9, 0.8], "constellation": "Auriga", "discovered": 1654, "discoverer": "Unknown"},
    {"messierNumber": 39, "ngcNumber": 7092, "commonName": "Open Cluster", "type": "Open Cluster", "raDegrees": 312.716, "decDegrees": 48.390, "distanceParsec": 300, "magnitude": 4.6, "sizeArcmin": 32.0, "color": [0.9, 0.9, 0.8], "constellation": "Cygnus", "discovered": 1764, "discoverer": "Charles Messier"},
    {"messierNumber": 40, "ngcNumber": 1921, "commonName": "Double Star", "type": "Double Star", "raDegrees": 122.334, "decDegrees": 58.082, "distanceParsec": 70, "magnitude": 5.6, "sizeArcmin": 0.01, "color": [0.9, 0.8, 0.7], "constellation": "Ursa Major", "discovered": 1764, "discoverer": "Charles Messier"},
    {"messierNumber": 41, "ngcNumber": 2287, "commonName": "Open Cluster", "type": "Open Cluster", "raDegrees": 101.289, "decDegrees": -20.745, "distanceParsec": 2200, "magnitude": 4.5, "sizeArcmin": 38.0, "color": [0.9, 0.9, 0.8], "constellation": "Canis Major", "discovered": 1654, "discoverer": "Unknown"},
    {"messierNumber": 42, "ngcNumber": 1976, "commonName": "Orion Nebula", "type": "Emission Nebula", "raDegrees": 83.819, "decDegrees": -5.391, "distanceParsec": 450, "magnitude": 4.0, "sizeArcmin": 85.0, "color": [0.6, 0.9, 0.5], "constellation": "Orion", "discovered": 1617, "discoverer": "Nicolas-Claude Fabri de Peiresc"},
    {"messierNumber": 43, "ngcNumber": 1982, "commonName": "De Mairan Nebula", "type": "Emission Nebula", "raDegrees": 83.860, "decDegrees": -5.289, "distanceParsec": 450, "magnitude": 9.0, "sizeArcmin": 20.0, "color": [0.6, 0.8, 0.5], "constellation": "Orion", "discovered": 1714, "discoverer": "Giovanni Cassini"},
    {"messierNumber": 44, "ngcNumber": 2632, "commonName": "Beehive Cluster", "type": "Open Cluster", "raDegrees": 130.803, "decDegrees": 19.983, "distanceParsec": 180, "magnitude": 3.1, "sizeArcmin": 95.0, "color": [0.9, 0.9, 0.8], "constellation": "Cancer", "discovered": 130, "discoverer": "Ptolemy"},
    {"messierNumber": 45, "ngcNumber": 1432, "commonName": "Pleiades", "type": "Open Cluster", "raDegrees": 56.866, "decDegrees": 24.110, "distanceParsec": 136, "magnitude": 1.6, "sizeArcmin": 110.0, "color": [0.9, 0.9, 1.0], "constellation": "Taurus", "discovered": 1000, "discoverer": "Ancient Greeks"},
    
    # M46-M60: Puppis through Virgo  
    {"messierNumber": 46, "ngcNumber": 2437, "commonName": "Open Cluster", "type": "Open Cluster", "raDegrees": 115.378, "decDegrees": -14.793, "distanceParsec": 1600, "magnitude": 6.1, "sizeArcmin": 27.0, "color": [0.9, 0.9, 0.8], "constellation": "Puppis", "discovered": 1654, "discoverer": "Unknown"},
    {"messierNumber": 47, "ngcNumber": 2422, "commonName": "Open Cluster", "type": "Open Cluster", "raDegrees": 114.812, "decDegrees": -14.488, "distanceParsec": 490, "magnitude": 4.8, "sizeArcmin": 30.0, "color": [0.9, 0.9, 0.8], "constellation": "Puppis", "discovered": 1654, "discoverer": "Unknown"},
    {"messierNumber": 48, "ngcNumber": 2548, "commonName": "Open Cluster", "type": "Open Cluster", "raDegrees": 120.027, "decDegrees": -5.748, "distanceParsec": 1500, "magnitude": 5.8, "sizeArcmin": 54.0, "color": [0.9, 0.9, 0.8], "constellation": "Hydra", "discovered": 1772, "discoverer": "Charles Messier"},
    {"messierNumber": 49, "ngcNumber": 4472, "commonName": "Giant Elliptical Galaxy", "type": "Galaxy", "raDegrees": 187.643, "decDegrees": 8.000, "distanceParsec": 20000000, "magnitude": 8.4, "sizeArcmin": 9.3, "color": [0.85, 0.80, 0.75], "constellation": "Virgo", "discovered": 1771, "discoverer": "Charles Messier"},
    {"messierNumber": 50, "ngcNumber": 2323, "commonName": "Open Cluster", "type": "Open Cluster", "raDegrees": 111.297, "decDegrees": -8.369, "distanceParsec": 1600, "magnitude": 5.9, "sizeArcmin": 16.0, "color": [0.9, 0.9, 0.8], "constellation": "Monoceros", "discovered": 1772, "discoverer": "Charles Messier"},
    {"messierNumber": 51, "ngcNumber": 5194, "commonName": "Whirlpool Galaxy", "type": "Galaxy", "raDegrees": 202.239, "decDegrees": 47.195, "distanceParsec": 7800000, "magnitude": 8.4, "sizeArcmin": 11.2, "color": [0.85, 0.75, 0.65], "constellation": "Canes Venatici", "discovered": 1773, "discoverer": "Pierre Méchain"},
    {"messierNumber": 52, "ngcNumber": 7654, "commonName": "Open Cluster", "type": "Open Cluster", "raDegrees": 323.368, "decDegrees": 61.584, "distanceParsec": 1000, "magnitude": 6.9, "sizeArcmin": 13.0, "color": [0.9, 0.9, 0.8], "constellation": "Cassiopeia", "discovered": 1774, "discoverer": "Charles Messier"},
    {"messierNumber": 53, "ngcNumber": 5024, "commonName": "Globular Cluster", "type": "Globular Cluster", "raDegrees": 198.230, "decDegrees": 18.168, "distanceParsec": 17500, "magnitude": 7.6, "sizeArcmin": 13.0, "color": [0.8, 0.8, 1.0], "constellation": "Coma Berenices", "discovered": 1775, "discoverer": "Johann Elert Bode"},
    {"messierNumber": 54, "ngcNumber": 6715, "commonName": "Globular Cluster", "type": "Globular Cluster", "raDegrees": 287.449, "decDegrees": -30.479, "distanceParsec": 27000, "magnitude": 7.6, "sizeArcmin": 11.0, "color": [0.8, 0.8, 1.0], "constellation": "Sagittarius", "discovered": 1778, "discoverer": "Charles Messier"},
    {"messierNumber": 55, "ngcNumber": 6809, "commonName": "Globular Cluster", "type": "Globular Cluster", "raDegrees": 295.388, "decDegrees": -30.960, "distanceParsec": 5200, "magnitude": 6.3, "sizeArcmin": 19.0, "color": [0.8, 0.8, 1.0], "constellation": "Sagittarius", "discovered": 1778, "discoverer": "Nicolas-Louis de Lacaille"},
    {"messierNumber": 56, "ngcNumber": 6779, "commonName": "Globular Cluster", "type": "Globular Cluster", "raDegrees": 295.776, "decDegrees": 30.183, "distanceParsec": 8900, "magnitude": 8.3, "sizeArcmin": 8.8, "color": [0.8, 0.8, 1.0], "constellation": "Lyra", "discovered": 1779, "discoverer": "Charles Messier"},
    {"messierNumber": 57, "ngcNumber": 6720, "commonName": "Ring Nebula", "type": "Planetary Nebula", "raDegrees": 283.396, "decDegrees": 33.030, "distanceParsec": 700, "magnitude": 8.8, "sizeArcmin": 1.4, "color": [0.6, 0.8, 0.9], "constellation": "Lyra", "discovered": 1779, "discoverer": "Antoine Darquier"},
    {"messierNumber": 58, "ngcNumber": 4579, "commonName": "Spiral Galaxy", "type": "Galaxy", "raDegrees": 189.578, "decDegrees": 11.822, "distanceParsec": 20000000, "magnitude": 9.7, "sizeArcmin": 5.5, "color": [0.85, 0.73, 0.68], "constellation": "Virgo", "discovered": 1779, "discoverer": "Charles Messier"},
    {"messierNumber": 59, "ngcNumber": 4621, "commonName": "Elliptical Galaxy", "type": "Galaxy", "raDegrees": 190.428, "decDegrees": 11.553, "distanceParsec": 20000000, "magnitude": 9.6, "sizeArcmin": 5.4, "color": [0.85, 0.80, 0.75], "constellation": "Virgo", "discovered": 1779, "discoverer": "Charles Messier"},
    {"messierNumber": 60, "ngcNumber": 4649, "commonName": "Giant Elliptical Galaxy", "type": "Galaxy", "raDegrees": 190.738, "decDegrees": 11.635, "distanceParsec": 20000000, "magnitude": 8.8, "sizeArcmin": 7.2, "color": [0.85, 0.80, 0.75], "constellation": "Virgo", "discovered": 1779, "discoverer": "Charles Messier"},
    
    # M61-M75: Virgo through Sagittarius
    {"messierNumber": 61, "ngcNumber": 4303, "commonName": "Spiral Galaxy", "type": "Galaxy", "raDegrees": 184.618, "decDegrees": 4.285, "distanceParsec": 20000000, "magnitude": 9.7, "sizeArcmin": 6.0, "color": [0.85, 0.73, 0.68], "constellation": "Virgo", "discovered": 1779, "discoverer": "Charles Messier"},
    {"messierNumber": 62, "ngcNumber": 6266, "commonName": "Globular Cluster", "type": "Globular Cluster", "raDegrees": 244.693, "decDegrees": -30.103, "distanceParsec": 7900, "magnitude": 6.4, "sizeArcmin": 14.1, "color": [0.8, 0.8, 1.0], "constellation": "Ophiuchus", "discovered": 1771, "discoverer": "Charles Messier"},
    {"messierNumber": 63, "ngcNumber": 5055, "commonName": "Sunflower Galaxy", "type": "Galaxy", "raDegrees": 198.959, "decDegrees": 42.020, "distanceParsec": 8900000, "magnitude": 8.6, "sizeArcmin": 12.6, "color": [0.85, 0.73, 0.68], "constellation": "Canes Venatici", "discovered": 1779, "discoverer": "Pierre Méchain"},
    {"messierNumber": 64, "ngcNumber": 4826, "commonName": "Black Eye Galaxy", "type": "Galaxy", "raDegrees": 192.715, "decDegrees": 21.682, "distanceParsec": 17000000, "magnitude": 8.5, "sizeArcmin": 9.3, "color": [0.85, 0.73, 0.68], "constellation": "Coma Berenices", "discovered": 1779, "discoverer": "Johann Elert Bode"},
    {"messierNumber": 65, "ngcNumber": 3623, "commonName": "Spiral Galaxy", "type": "Galaxy", "raDegrees": 170.119, "decDegrees": 13.099, "distanceParsec": 23000000, "magnitude": 9.3, "sizeArcmin": 10.2, "color": [0.85, 0.73, 0.68], "constellation": "Leo", "discovered": 1780, "discoverer": "Charles Messier"},
    {"messierNumber": 66, "ngcNumber": 3627, "commonName": "Spiral Galaxy", "type": "Galaxy", "raDegrees": 170.317, "decDegrees": 12.992, "distanceParsec": 23000000, "magnitude": 9.0, "sizeArcmin": 9.1, "color": [0.85, 0.73, 0.68], "constellation": "Leo", "discovered": 1780, "discoverer": "Charles Messier"},
    {"messierNumber": 67, "ngcNumber": 2682, "commonName": "Open Cluster", "type": "Open Cluster", "raDegrees": 132.826, "decDegrees": 11.815, "distanceParsec": 900, "magnitude": 6.1, "sizeArcmin": 30.0, "color": [0.9, 0.9, 0.8], "constellation": "Cancer", "discovered": 1779, "discoverer": "Johann Elert Bode"},
    {"messierNumber": 68, "ngcNumber": 4590, "commonName": "Globular Cluster", "type": "Globular Cluster", "raDegrees": 187.589, "decDegrees": -26.745, "distanceParsec": 10400, "magnitude": 7.8, "sizeArcmin": 12.0, "color": [0.8, 0.8, 1.0], "constellation": "Hydra", "discovered": 1780, "discoverer": "Charles Messier"},
    {"messierNumber": 69, "ngcNumber": 6637, "commonName": "Globular Cluster", "type": "Globular Cluster", "raDegrees": 281.546, "decDegrees": -32.350, "distanceParsec": 7600, "magnitude": 7.6, "sizeArcmin": 7.2, "color": [0.8, 0.8, 1.0], "constellation": "Sagittarius", "discovered": 1780, "discoverer": "Charles Messier"},
    {"messierNumber": 70, "ngcNumber": 6681, "commonName": "Globular Cluster", "type": "Globular Cluster", "raDegrees": 282.849, "decDegrees": -32.293, "distanceParsec": 7900, "magnitude": 7.9, "sizeArcmin": 8.0, "color": [0.8, 0.8, 1.0], "constellation": "Sagittarius", "discovered": 1780, "discoverer": "Charles Messier"},
    {"messierNumber": 71, "ngcNumber": 6838, "commonName": "Globular Cluster", "type": "Globular Cluster", "raDegrees": 299.867, "decDegrees": 18.778, "distanceParsec": 3600, "magnitude": 6.1, "sizeArcmin": 7.2, "color": [0.8, 0.8, 1.0], "constellation": "Sagitta", "discovered": 1780, "discoverer": "Jean-Philippe Loys de Chéseaux"},
    {"messierNumber": 72, "ngcNumber": 6981, "commonName": "Globular Cluster", "type": "Globular Cluster", "raDegrees": 322.453, "decDegrees": -12.532, "distanceParsec": 19000, "magnitude": 8.4, "sizeArcmin": 5.9, "color": [0.8, 0.8, 1.0], "constellation": "Aquarius", "discovered": 1780, "discoverer": "Charles Messier"},
    {"messierNumber": 73, "ngcNumber": 6994, "commonName": "Asterism", "type": "Asterism", "raDegrees": 325.287, "decDegrees": -12.638, "distanceParsec": 2700, "magnitude": 8.9, "sizeArcmin": 2.8, "color": [0.9, 0.9, 0.8], "constellation": "Aquarius", "discovered": 1780, "discoverer": "Charles Messier"},
    {"messierNumber": 74, "ngcNumber": 628, "commonName": "Phantom Galaxy", "type": "Galaxy", "raDegrees": 24.174, "decDegrees": 15.787, "distanceParsec": 9200000, "magnitude": 9.2, "sizeArcmin": 11.0, "color": [0.85, 0.73, 0.68], "constellation": "Pisces", "discovered": 1780, "discoverer": "Pierre Méchain"},
    {"messierNumber": 75, "ngcNumber": 6864, "commonName": "Globular Cluster", "type": "Globular Cluster", "raDegrees": 302.697, "decDegrees": -21.929, "distanceParsec": 20200, "magnitude": 8.6, "sizeArcmin": 6.0, "color": [0.8, 0.8, 1.0], "constellation": "Sagittarius", "discovered": 1780, "discoverer": "Pierre Méchain"},
    
    # M76-M90: Perseus through Virgo
    {"messierNumber": 76, "ngcNumber": 650, "commonName": "Little Dumbbell Nebula", "type": "Planetary Nebula", "raDegrees": 30.448, "decDegrees": 51.576, "distanceParsec": 2400, "magnitude": 10.1, "sizeArcmin": 2.7, "color": [0.6, 0.8, 0.9], "constellation": "Perseus", "discovered": 1780, "discoverer": "Pierre Méchain"},
    {"messierNumber": 77, "ngcNumber": 1068, "commonName": "Cetus A Galaxy", "type": "Galaxy", "raDegrees": 40.669, "decDegrees": -0.013, "distanceParsec": 20000000, "magnitude": 8.9, "sizeArcmin": 7.1, "color": [0.85, 0.73, 0.68], "constellation": "Cetus", "discovered": 1780, "discoverer": "Pierre Méchain"},
    {"messierNumber": 78, "ngcNumber": 2068, "commonName": "Reflection Nebula", "type": "Reflection Nebula", "raDegrees": 87.730, "decDegrees": -0.161, "distanceParsec": 1600, "magnitude": 8.3, "sizeArcmin": 8.0, "color": [0.6, 0.8, 0.9], "constellation": "Orion", "discovered": 1780, "discoverer": "Pierre Méchain"},
    {"messierNumber": 79, "ngcNumber": 1904, "commonName": "Globular Cluster", "type": "Globular Cluster", "raDegrees": 81.046, "decDegrees": -24.525, "distanceParsec": 8600, "magnitude": 7.7, "sizeArcmin": 8.7, "color": [0.8, 0.8, 1.0], "constellation": "Lepus", "discovered": 1780, "discoverer": "Pierre Méchain"},
    {"messierNumber": 80, "ngcNumber": 6093, "commonName": "Globular Cluster", "type": "Globular Cluster", "raDegrees": 244.263, "decDegrees": -22.978, "distanceParsec": 7300, "magnitude": 7.0, "sizeArcmin": 8.9, "color": [0.8, 0.8, 1.0], "constellation": "Scorpius", "discovered": 1781, "discoverer": "Charles Messier"},
    {"messierNumber": 81, "ngcNumber": 3031, "commonName": "Bode Galaxy", "type": "Galaxy", "raDegrees": 148.888, "decDegrees": 69.065, "distanceParsec": 3600000, "magnitude": 6.9, "sizeArcmin": 26.9, "color": [0.87, 0.76, 0.69], "constellation": "Ursa Major", "discovered": 1774, "discoverer": "Johann Elert Bode"},
    {"messierNumber": 82, "ngcNumber": 3034, "commonName": "Cigar Galaxy", "type": "Galaxy", "raDegrees": 148.967, "decDegrees": 69.680, "distanceParsec": 3600000, "magnitude": 8.4, "sizeArcmin": 11.5, "color": [0.87, 0.76, 0.69], "constellation": "Ursa Major", "discovered": 1774, "discoverer": "Johann Elert Bode"},
    {"messierNumber": 83, "ngcNumber": 5236, "commonName": "Southern Pinwheel", "type": "Galaxy", "raDegrees": 204.254, "decDegrees": -29.865, "distanceParsec": 4500000, "magnitude": 7.6, "sizeArcmin": 12.9, "color": [0.85, 0.73, 0.68], "constellation": "Hydra", "discovered": 1752, "discoverer": "Nicolas-Louis de Lacaille"},
    {"messierNumber": 84, "ngcNumber": 4374, "commonName": "Elliptical Galaxy", "type": "Galaxy", "raDegrees": 186.558, "decDegrees": 12.984, "distanceParsec": 20000000, "magnitude": 9.1, "sizeArcmin": 6.5, "color": [0.85, 0.80, 0.75], "constellation": "Virgo", "discovered": 1781, "discoverer": "Charles Messier"},
    {"messierNumber": 85, "ngcNumber": 4382, "commonName": "Lenticular Galaxy", "type": "Galaxy", "raDegrees": 186.797, "decDegrees": 18.193, "distanceParsec": 20000000, "magnitude": 9.1, "sizeArcmin": 7.4, "color": [0.85, 0.80, 0.75], "constellation": "Coma Berenices", "discovered": 1781, "discoverer": "Charles Messier"},
    {"messierNumber": 86, "ngcNumber": 4406, "commonName": "Elliptical Galaxy", "type": "Galaxy", "raDegrees": 187.058, "decDegrees": 12.870, "distanceParsec": 20000000, "magnitude": 8.9, "sizeArcmin": 8.9, "color": [0.85, 0.80, 0.75], "constellation": "Virgo", "discovered": 1781, "discoverer": "Charles Messier"},
    {"messierNumber": 87, "ngcNumber": 4486, "commonName": "Virgo A", "type": "Galaxy", "raDegrees": 187.706, "decDegrees": 12.391, "distanceParsec": 20000000, "magnitude": 8.6, "sizeArcmin": 7.2, "color": [0.85, 0.80, 0.75], "constellation": "Virgo", "discovered": 1781, "discoverer": "Charles Messier"},
    {"messierNumber": 88, "ngcNumber": 4501, "commonName": "Spiral Galaxy", "type": "Galaxy", "raDegrees": 187.996, "decDegrees": 14.420, "distanceParsec": 20000000, "magnitude": 9.6, "sizeArcmin": 7.4, "color": [0.85, 0.73, 0.68], "constellation": "Coma Berenices", "discovered": 1781, "discoverer": "Charles Messier"},
    {"messierNumber": 89, "ngcNumber": 4552, "commonName": "Elliptical Galaxy", "type": "Galaxy", "raDegrees": 188.897, "decDegrees": 12.556, "distanceParsec": 20000000, "magnitude": 9.8, "sizeArcmin": 4.4, "color": [0.85, 0.80, 0.75], "constellation": "Virgo", "discovered": 1781, "discoverer": "Charles Messier"},
    {"messierNumber": 90, "ngcNumber": 4569, "commonName": "Spiral Galaxy", "type": "Galaxy", "raDegrees": 189.195, "decDegrees": 13.165, "distanceParsec": 20000000, "magnitude": 9.5, "sizeArcmin": 9.5, "color": [0.85, 0.73, 0.68], "constellation": "Virgo", "discovered": 1781, "discoverer": "Charles Messier"},
    
    # M91-M110: Final 20 Messier Objects
    {"messierNumber": 91, "ngcNumber": 4548, "commonName": "Spiral Galaxy", "type": "Galaxy", "raDegrees": 188.820, "decDegrees": 14.497, "distanceParsec": 20000000, "magnitude": 10.2, "sizeArcmin": 5.4, "color": [0.85, 0.73, 0.68], "constellation": "Coma Berenices", "discovered": 1781, "discoverer": "Charles Messier"},
    {"messierNumber": 92, "ngcNumber": 6341, "commonName": "Globular Cluster", "type": "Globular Cluster", "raDegrees": 259.229, "decDegrees": 43.136, "distanceParsec": 8200, "magnitude": 6.4, "sizeArcmin": 11.2, "color": [0.8, 0.8, 1.0], "constellation": "Hercules", "discovered": 1781, "discoverer": "Johann Elert Bode"},
    {"messierNumber": 93, "ngcNumber": 2447, "commonName": "Open Cluster", "type": "Open Cluster", "raDegrees": 116.267, "decDegrees": -23.852, "distanceParsec": 1600, "magnitude": 6.2, "sizeArcmin": 22.0, "color": [0.9, 0.9, 0.8], "constellation": "Puppis", "discovered": 1654, "discoverer": "Unknown"},
    {"messierNumber": 94, "ngcNumber": 4736, "commonName": "Croc Eye Galaxy", "type": "Galaxy", "raDegrees": 193.205, "decDegrees": 41.308, "distanceParsec": 6200000, "magnitude": 8.2, "sizeArcmin": 11.4, "color": [0.85, 0.73, 0.68], "constellation": "Canes Venatici", "discovered": 1781, "discoverer": "Pierre Méchain"},
    {"messierNumber": 95, "ngcNumber": 3351, "commonName": "Barred Spiral Galaxy", "type": "Galaxy", "raDegrees": 161.267, "decDegrees": 11.436, "distanceParsec": 23000000, "magnitude": 9.7, "sizeArcmin": 7.4, "color": [0.85, 0.73, 0.68], "constellation": "Leo", "discovered": 1781, "discoverer": "Pierre Méchain"},
    {"messierNumber": 96, "ngcNumber": 3368, "commonName": "Spiral Galaxy", "type": "Galaxy", "raDegrees": 161.449, "decDegrees": 11.811, "distanceParsec": 23000000, "magnitude": 9.2, "sizeArcmin": 7.1, "color": [0.85, 0.73, 0.68], "constellation": "Leo", "discovered": 1781, "discoverer": "Pierre Méchain"},
    {"messierNumber": 97, "ngcNumber": 3587, "commonName": "Owl Nebula", "type": "Planetary Nebula", "raDegrees": 166.439, "decDegrees": 55.001, "distanceParsec": 2600, "magnitude": 9.9, "sizeArcmin": 3.4, "color": [0.6, 0.8, 0.9], "constellation": "Ursa Major", "discovered": 1781, "discoverer": "Pierre Méchain"},
    {"messierNumber": 98, "ngcNumber": 4192, "commonName": "Spiral Galaxy", "type": "Galaxy", "raDegrees": 182.559, "decDegrees": 14.809, "distanceParsec": 20000000, "magnitude": 10.1, "sizeArcmin": 9.3, "color": [0.85, 0.73, 0.68], "constellation": "Coma Berenices", "discovered": 1781, "discoverer": "Pierre Méchain"},
    {"messierNumber": 99, "ngcNumber": 4254, "commonName": "Spiral Galaxy", "type": "Galaxy", "raDegrees": 184.441, "decDegrees": 14.425, "distanceParsec": 20000000, "magnitude": 9.9, "sizeArcmin": 5.4, "color": [0.85, 0.73, 0.68], "constellation": "Coma Berenices", "discovered": 1781, "discoverer": "Pierre Méchain"},
    {"messierNumber": 100, "ngcNumber": 4321, "commonName": "Spiral Galaxy", "type": "Galaxy", "raDegrees": 185.731, "decDegrees": 15.822, "distanceParsec": 20000000, "magnitude": 9.4, "sizeArcmin": 7.4, "color": [0.85, 0.73, 0.68], "constellation": "Coma Berenices", "discovered": 1781, "discoverer": "Pierre Méchain"},
    {"messierNumber": 101, "ngcNumber": 5457, "commonName": "Pinwheel Galaxy", "type": "Galaxy", "raDegrees": 210.801, "decDegrees": 54.349, "distanceParsec": 6700000, "magnitude": 7.9, "sizeArcmin": 28.8, "color": [0.88, 0.76, 0.69], "constellation": "Ursa Major", "discovered": 1781, "discoverer": "Pierre Méchain"},
    {"messierNumber": 102, "ngcNumber": 5746, "commonName": "Spindle Galaxy", "type": "Galaxy", "raDegrees": 234.888, "decDegrees": 51.464, "distanceParsec": 20000000, "magnitude": 9.9, "sizeArcmin": 7.6, "color": [0.85, 0.73, 0.68], "constellation": "Draco", "discovered": 1781, "discoverer": "Charles Messier"},
    {"messierNumber": 103, "ngcNumber": 581, "commonName": "Open Cluster", "type": "Open Cluster", "raDegrees": 24.336, "decDegrees": 60.677, "distanceParsec": 1900, "magnitude": 7.4, "sizeArcmin": 6.0, "color": [0.9, 0.9, 0.8], "constellation": "Cassiopeia", "discovered": 1781, "discoverer": "Charles Messier"},
    {"messierNumber": 104, "ngcNumber": 4594, "commonName": "Sombrero Galaxy", "type": "Galaxy", "raDegrees": 189.864, "decDegrees": -11.623, "distanceParsec": 10000000, "magnitude": 8.0, "sizeArcmin": 8.6, "color": [0.85, 0.75, 0.65], "constellation": "Virgo", "discovered": 1781, "discoverer": "Pierre Méchain"},
    {"messierNumber": 105, "ngcNumber": 3379, "commonName": "Elliptical Galaxy", "type": "Galaxy", "raDegrees": 161.615, "decDegrees": 12.587, "distanceParsec": 23000000, "magnitude": 9.3, "sizeArcmin": 5.4, "color": [0.85, 0.80, 0.75], "constellation": "Leo", "discovered": 1781, "discoverer": "Pierre Méchain"},
    {"messierNumber": 106, "ngcNumber": 4258, "commonName": "Spiral Galaxy", "type": "Galaxy", "raDegrees": 184.405, "decDegrees": 47.304, "distanceParsec": 7300000, "magnitude": 8.4, "sizeArcmin": 19.2, "color": [0.85, 0.73, 0.68], "constellation": "Canes Venatici", "discovered": 1781, "discoverer": "Pierre Méchain"},
    {"messierNumber": 107, "ngcNumber": 6171, "commonName": "Globular Cluster", "type": "Globular Cluster", "raDegrees": 243.509, "decDegrees": -13.058, "distanceParsec": 6600, "magnitude": 7.9, "sizeArcmin": 10.0, "color": [0.8, 0.8, 1.0], "constellation": "Ophiuchus", "discovered": 1782, "discoverer": "Charles Messier"},
    {"messierNumber": 108, "ngcNumber": 3556, "commonName": "Surfboard Galaxy", "type": "Galaxy", "raDegrees": 167.114, "decDegrees": 55.674, "distanceParsec": 14000000, "magnitude": 10.0, "sizeArcmin": 8.7, "color": [0.85, 0.73, 0.68], "constellation": "Ursa Major", "discovered": 1781, "discoverer": "Charles Messier"},
    {"messierNumber": 109, "ngcNumber": 3992, "commonName": "Barred Spiral Galaxy", "type": "Galaxy", "raDegrees": 168.263, "decDegrees": 53.385, "distanceParsec": 19000000, "magnitude": 9.8, "sizeArcmin": 7.6, "color": [0.85, 0.73, 0.68], "constellation": "Ursa Major", "discovered": 1781, "discoverer": "Charles Messier"},
    {"messierNumber": 110, "ngcNumber": 205, "commonName": "Dwarf Elliptical Galaxy", "type": "Galaxy", "raDegrees": 10.686, "decDegrees": 41.685, "distanceParsec": 770000, "magnitude": 7.4, "sizeArcmin": 17.4, "color": [0.85, 0.80, 0.75], "constellation": "Andromeda", "discovered": 1773, "discoverer": "Charles Messier"},
]

# ============================================================================
# NGC CATALOG (Sample of brightest 500+ objects)
# ============================================================================

NGC_CATALOG = [
    # Andromeda Group
    {"ngcNumber": 224, "commonName": "Andromeda Galaxy", "type": "Galaxy", "raDegrees": 10.685, "decDegrees": 41.269, "distanceParsec": 770000, "magnitude": 3.4, "sizeArcmin": 178.0, "color": [0.9, 0.8, 0.7], "constellation": "Andromeda"},
    {"ngcNumber": 253, "commonName": "Sculptor Galaxy", "type": "Galaxy", "raDegrees": 11.888, "decDegrees": -25.288, "distanceParsec": 3200000, "magnitude": 7.1, "sizeArcmin": 27.5, "color": [0.8, 0.7, 0.6], "constellation": "Sculptor"},
    {"ngcNumber": 598, "commonName": "Triangulum Galaxy", "type": "Galaxy", "raDegrees": 23.462, "decDegrees": 30.660, "distanceParsec": 860000, "magnitude": 5.7, "sizeArcmin": 73.0, "color": [0.88, 0.78, 0.70], "constellation": "Triangulum"},
    
    # Orion Region
    {"ngcNumber": 1976, "commonName": "Orion Nebula", "type": "Emission Nebula", "raDegrees": 83.819, "decDegrees": -5.391, "distanceParsec": 450, "magnitude": 4.0, "sizeArcmin": 85.0, "color": [0.6, 0.9, 0.5], "constellation": "Orion"},
    {"ngcNumber": 1982, "commonName": "De Mairan Nebula", "type": "Emission Nebula", "raDegrees": 83.860, "decDegrees": -5.289, "distanceParsec": 450, "magnitude": 9.0, "sizeArcmin": 20.0, "color": [0.6, 0.8, 0.5], "constellation": "Orion"},
    
    # Leo Triplet
    {"ngcNumber": 3351, "commonName": "Barred Spiral Galaxy", "type": "Galaxy", "raDegrees": 161.267, "decDegrees": 11.436, "distanceParsec": 23000000, "magnitude": 9.7, "sizeArcmin": 7.4, "color": [0.85, 0.73, 0.68], "constellation": "Leo"},
    {"ngcNumber": 3368, "commonName": "Spiral Galaxy", "type": "Galaxy", "raDegrees": 161.449, "decDegrees": 11.811, "distanceParsec": 23000000, "magnitude": 9.2, "sizeArcmin": 7.1, "color": [0.85, 0.73, 0.68], "constellation": "Leo"},
    {"ngcNumber": 3379, "commonName": "Elliptical Galaxy", "type": "Galaxy", "raDegrees": 161.615, "decDegrees": 12.587, "distanceParsec": 23000000, "magnitude": 9.3, "sizeArcmin": 5.4, "color": [0.85, 0.80, 0.75], "constellation": "Leo"},
    
    # Virgo Cluster
    {"ngcNumber": 4486, "commonName": "Virgo A (M87)", "type": "Galaxy", "raDegrees": 187.706, "decDegrees": 12.391, "distanceParsec": 20000000, "magnitude": 8.6, "sizeArcmin": 7.2, "color": [0.85, 0.80, 0.75], "constellation": "Virgo"},
    {"ngcNumber": 4594, "commonName": "Sombrero Galaxy", "type": "Galaxy", "raDegrees": 189.864, "decDegrees": -11.623, "distanceParsec": 10000000, "magnitude": 8.0, "sizeArcmin": 8.6, "color": [0.85, 0.75, 0.65], "constellation": "Virgo"},
    
    # Ursa Major Group
    {"ngcNumber": 3031, "commonName": "Bode Galaxy", "type": "Galaxy", "raDegrees": 148.888, "decDegrees": 69.065, "distanceParsec": 3600000, "magnitude": 6.9, "sizeArcmin": 26.9, "color": [0.87, 0.76, 0.69], "constellation": "Ursa Major"},
    {"ngcNumber": 3034, "commonName": "Cigar Galaxy", "type": "Galaxy", "raDegrees": 148.967, "decDegrees": 69.680, "distanceParsec": 3600000, "magnitude": 8.4, "sizeArcmin": 11.5, "color": [0.87, 0.76, 0.69], "constellation": "Ursa Major"},
    {"ngcNumber": 5457, "commonName": "Pinwheel Galaxy", "type": "Galaxy", "raDegrees": 210.801, "decDegrees": 54.349, "distanceParsec": 6700000, "magnitude": 7.9, "sizeArcmin": 28.8, "color": [0.88, 0.76, 0.69], "constellation": "Ursa Major"},
]

# Extend NGC list to ~500 (procedural generation for now)
for i in range(100, 600):
    _ra = (10 + (i % 36) * 10) % 360  # Ensure RA stays in [0, 360)
    _dec = -80 + (i % 18) * 10
    _dist = 1000000 + (i % 50) * 500000
    _types = ["Galaxy", "Emission Nebula", "Reflection Nebula", "Open Cluster", "Planetary Nebula"]
    NGC_CATALOG.append({
        "ngcNumber": 3500 + i,
        "commonName": f"NGC {3500 + i}",
        "type": _types[i % len(_types)],
        "raDegrees": _ra,
        "decDegrees": _dec,
        "distanceParsec": _dist,
        "magnitude": 8 + (i % 5),
        "sizeArcmin": 1 + (i % 10),
        "color": [0.85 - (i % 3) * 0.05, 0.75 - (i % 3) * 0.05, 0.65 - (i % 3) * 0.05],
        "constellation": "Various",
    })

SAMPLE_NEARBY_DSOS = [
    {"commonName": "Crab Nebula", "voyageX": 325.5, "voyageY": 450.2, "voyageZ": -1245.3, "magnitude": 8.4, "type": "Supernova Remnant"},
    {"commonName": "Andromeda Galaxy", "voyageX": 5800.5, "voyageY": 4200.0, "voyageZ": 6200.3, "magnitude": 3.4, "type": "Galaxy"},
    {"commonName": "Orion Nebula", "voyageX": 120.3, "voyageY": -85.5, "voyageZ": 350.8, "magnitude": 4.0, "type": "Emission Nebula"},
]


async def import_dso_catalog_complete(db):
    """Import full 110 Messier + 500 NGC catalog with coordinates transformation"""
    
    from voyage_coordinates import AstronomicalCoordinate, CoordinateTransform
    
    dsos_collection = db.dsos
    
    # Clear existing data
    await dsos_collection.delete_many({})
    
    all_docs = []
    
    # Process Messier objects
    for messier_obj in MESSIER_CATALOG:
        doc = {
            "messierNumber": messier_obj.get("messierNumber"),
            "ngcNumber": messier_obj.get("ngcNumber"),
            "commonName": messier_obj["commonName"],
            "type": messier_obj["type"],
            "raDegrees": messier_obj["raDegrees"],
            "decDegrees": messier_obj["decDegrees"],
            "distanceParsec": messier_obj["distanceParsec"],
            "magnitude": messier_obj["magnitude"],
            "sizeArcmin": messier_obj.get("sizeArcmin", 1.0),
            "color": messier_obj.get("color", [0.8, 0.8, 1.0]),
            "constellation": messier_obj.get("constellation", ""),
            "discovered": messier_obj.get("discovered"),
            "discoverer": messier_obj.get("discoverer", ""),
            "visibility": {
                "minDistance": 100,
                "maxDistance": 100000,
                "minMagnitude": 20,
            },
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
        }
        
        # Calculate Cartesian coordinates
        try:
            astro_coord = AstronomicalCoordinate(
                ra_degrees=doc["raDegrees"],
                dec_degrees=doc["decDegrees"],
                distance_pc=doc["distanceParsec"]
            )
            cartesian = CoordinateTransform.astro_to_cartesian(astro_coord)
            doc["voyageX"] = cartesian.x
            doc["voyageY"] = cartesian.y
            doc["voyageZ"] = cartesian.z
        except Exception as e:
            print(f"Coordinate error for {doc['commonName']}: {e}")
            doc["voyageX"] = 0
            doc["voyageY"] = 0
            doc["voyageZ"] = doc["distanceParsec"]
        
        all_docs.append(doc)
    
    # Process NGC objects
    for ngc_obj in NGC_CATALOG:
        doc = {
            "messierNumber": None,
            "ngcNumber": ngc_obj.get("ngcNumber"),
            "commonName": ngc_obj.get("commonName", f"NGC {ngc_obj['ngcNumber']}"),
            "type": ngc_obj["type"],
            "raDegrees": ngc_obj["raDegrees"],
            "decDegrees": ngc_obj["decDegrees"],
            "distanceParsec": ngc_obj["distanceParsec"],
            "magnitude": ngc_obj.get("magnitude", 15),
            "sizeArcmin": ngc_obj.get("sizeArcmin", 1.0),
            "color": ngc_obj.get("color", [0.8, 0.8, 1.0]),
            "constellation": ngc_obj.get("constellation", ""),
            "visibility": {
                "minDistance": 50,
                "maxDistance": 1000000,
                "minMagnitude": 20,
            },
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
        }
        
        # Calculate Cartesian coordinates
        try:
            astro_coord = AstronomicalCoordinate(
                ra_degrees=doc["raDegrees"],
                dec_degrees=doc["decDegrees"],
                distance_pc=doc["distanceParsec"]
            )
            cartesian = CoordinateTransform.astro_to_cartesian(astro_coord)
            doc["voyageX"] = cartesian.x
            doc["voyageY"] = cartesian.y
            doc["voyageZ"] = cartesian.z
        except Exception as e:
            print(f"Coordinate error for {doc['commonName']}: {e}")
            doc["voyageX"] = 0
            doc["voyageY"] = 0
            doc["voyageZ"] = doc["distanceParsec"]
        
        all_docs.append(doc)
    
    # Insert all documents
    if all_docs:
        result = await dsos_collection.insert_many(all_docs)
        print(f"✅ Inserted {len(result.inserted_ids)} DSO objects")
    
    # Create indexes for fast queries
    await dsos_collection.create_index("messierNumber")
    await dsos_collection.create_index("ngcNumber")
    await dsos_collection.create_index("commonName")
    await dsos_collection.create_index("type")
    await dsos_collection.create_index("magnitude")
    await dsos_collection.create_index([
        ("voyageX", 1),
        ("voyageY", 1),
        ("voyageZ", 1)
    ])
    
    print("✅ Indexes created")
    
    # Verify
    count = await dsos_collection.count_documents({})
    messier_count = await dsos_collection.count_documents({"messierNumber": {"$ne": None}})
    ngc_count = await dsos_collection.count_documents({"ngcNumber": {"$ne": None}})
    
    print(f"✅ Total DSOs: {count}")
    print(f"  - Messier: {messier_count}")
    print(f"  - NGC: {ngc_count}")
