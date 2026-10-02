#!/usr/bin/env python3
import urllib.request
import json
import concurrent.futures
import sys
import os

print("=== Generando datos para Fase 4: Léxico Strong y Referencias Cruzadas ===")

# 1. Mapeo de abreviaturas TSK a ID de libro bíblico (1-66)
ABBREV_TO_BOOK_ID = {
    'GEN': 1, 'EXO': 2, 'LEV': 3, 'NUM': 4, 'DEU': 5,
    'JOS': 6, 'JDG': 7, 'RUT': 8, '1SA': 9, '2SA': 10,
    '1KI': 11, '2KI': 12, '1CH': 13, '2CH': 14, 'EZR': 15,
    'NEH': 16, 'EST': 17, 'JOB': 18, 'PSA': 19, 'PRO': 20,
    'ECC': 21, 'SOS': 22, 'ISA': 23, 'JER': 24, 'LAM': 25,
    'EZE': 26, 'DAN': 27, 'HOS': 28, 'JOE': 29, 'AMO': 30,
    'OBA': 31, 'JON': 32, 'MIC': 33, 'NAH': 34, 'HAB': 35,
    'ZEP': 36, 'HAG': 37, 'ZEC': 38, 'MAL': 39,
    'MAT': 40, 'MAR': 41, 'LUK': 42, 'JOH': 43, 'ACT': 44,
    'ROM': 45, '1CO': 46, '2CO': 47, 'GAL': 48, 'EPH': 49,
    'PHP': 50, 'COL': 51, '1TH': 52, '2TH': 53, '1TI': 54,
    '2TI': 55, 'TIT': 56, 'PHM': 57, 'HEB': 58, 'JAM': 59,
    '1PE': 60, '2PE': 61, '1JO': 62, '2JO': 63, '3JO': 64,
    'JDE': 65, 'REV': 66
}

# 2. Descargar Diccionarios Strong OpenScriptures
print("Descargando Diccionarios Strong Hebreo y Griego...")
with urllib.request.urlopen('https://raw.githubusercontent.com/openscriptures/strongs/master/hebrew/strongs-hebrew-dictionary.js') as r:
    c = r.read().decode('utf-8')
    h_data = json.loads(c[c.find('{'):c.rfind('}')+1])

with urllib.request.urlopen('https://raw.githubusercontent.com/openscriptures/strongs/master/greek/strongs-greek-dictionary.js') as r:
    c = r.read().decode('utf-8')
    g_data = json.loads(c[c.find('{'):c.rfind('}')+1])

print(f"Hebreo: {len(h_data)} entradas | Griego: {len(g_data)} entradas")

# Diccionario enriquecido con definiciones en español para términos teológicos y comunes
SPANISH_GLOSSES = {
    # Hebreo
    "H1": {"es": "Padre, antepasado, cabeza de familia", "cat": "Familia y Sociedad"},
    "H1254": {"es": "Crear (exclusivo de Dios), dar origen de la nada", "cat": "Creación y Soberanía"},
    "H430": {"es": "Dios, el Dios Supremo, Creador omnipotente y Juez", "cat": "Teología Propia"},
    "H3068": {"es": "El SEÑOR (Yahweh / YHWH), el Dios eterno del pacto", "cat": "Nombres Divinos"},
    "H7307": {"es": "Espíritu, aliento de vida, viento, el Espíritu Santo", "cat": "Neumatología"},
    "H7965": {"es": "Paz, plenitud, bienestar, salud, integridad, armonía", "cat": "Vida Espiritual"},
    "H2617": {"es": "Misericordia, amor leal del pacto, bondad entrañable (Hesed)", "cat": "Atributos Divinos"},
    "H1285": {"es": "Pacto, alianza solemne entre Dios y el hombre", "cat": "Pactos Bíblicos"},
    "H6918": {"es": "Santo, consagrado, apartado de lo profano", "cat": "Santidad"},
    "H6944": {"es": "Santidad, lugar sagrado, devoción", "cat": "Santidad"},
    "H8451": {"es": "Torá, ley, instrucción, enseñanza divina", "cat": "La Ley"},
    "H6666": {"es": "Justicia, rectitud moral, equidad (Tsedaká)", "cat": "Justicia Divina"},
    "H4941": {"es": "Juicio, derecho, veredicto, ordenanza divina", "cat": "Justicia Divina"},
    "H5315": {"es": "Alma, vida, ser viviente, respiración, corazón", "cat": "Antropología Bíblica"},
    "H3820": {"es": "Corazón, entendimiento, voluntad íntima, pensamientos", "cat": "Antropología Bíblica"},
    "H2451": {"es": "Sabiduría, destreza práctica para vivir con temor a Dios", "cat": "Sabiduría"},
    "H3374": {"es": "Temor reverente de Dios, piedad, respeto profundo", "cat": "Vida Espiritual"},
    "H5769": {"es": "Eternidad, perpetuidad, por siempre, tiempo sin fin", "cat": "Atributos Divinos"},
    "H1350": {"es": "Redimir, rescatar, pariente redentor (Goel)", "cat": "Redención"},
    "H3444": {"es": "Salvación, liberación, victoria dada por Dios (Yeshuá)", "cat": "Salvación"},
    "H3467": {"es": "Salvar, librar, dar auxilio en peligro", "cat": "Salvación"},
    "H530": {"es": "Fidelidad, firmeza, estabilidad, lealtad (Emuná)", "cat": "Vida Espiritual"},
    "H543": {"es": "Amén, que así sea, verídico, seguro", "cat": "Vida Espiritual"},
    "H1288": {"es": "Bendecir, arrodillarse, alabar a Dios", "cat": "Alabanza y Adoración"},
    "H1984": {"es": "Alabar, celebrar con júbilo, exaltar (Halal / Aleluya)", "cat": "Alabanza y Adoración"},
    "H3034": {"es": "Dar gracias, confesar el nombre de Dios, alabar (Yadá)", "cat": "Alabanza y Adoración"},
    "H7462": {"es": "Pastorear, guiar al rebaño, alimentar (Pastor)", "cat": "Ministerio Pastoral"},
    "H5030": {"es": "Profeta, portavoz de Dios, heraldo inspirado", "cat": "Ministerios Bíblicos"},
    "H3548": {"es": "Sacerdote, mediador entre Dios y el pueblo", "cat": "Ministerios Bíblicos"},
    "H4428": {"es": "Rey, soberano, gobernante ungido", "cat": "Gobierno y Reino"},
    "H4899": {"es": "Mesías, ungido de Dios, Cristo prometido", "cat": "Mesías y Redentor"},
    "H2403": {"es": "Pecado, falta, errar al blanco santo de Dios", "cat": "Hamartiología"},
    "H5771": {"es": "Iniquidad, perversión moral, culpa deliberada", "cat": "Hamartiología"},
    "H6588": {"es": "Rebelión, transgresión deliberada contra la ley", "cat": "Hamartiología"},
    "H3722": {"es": "Expiar, cubrir el pecado, reconciliar (Kapar / Yom Kipur)", "cat": "Expiación y Perdón"},
    "H5545": {"es": "Perdonar, disculpar por gracia soberana", "cat": "Expiación y Perdón"},
    "H7725": {"es": "Volver, retornar a Dios, arrepentirse (Teshuvá)", "cat": "Arrepentimiento"},
    "H2132": {"es": "Aceite, unción, grosura", "cat": "Símbolos Sagrados"},
    "H410": {"es": "Dios, Fuerte, Todopoderoso (El)", "cat": "Nombres Divinos"},
    "H7706": {"es": "El Todopoderoso, Quien todo lo sustenta (Shaddai)", "cat": "Nombres Divinos"},
    "H5945": {"es": "El Altísimo, Soberano por encima de todo (Elyón)", "cat": "Nombres Divinos"},

    # Griego
    "G26": {"es": "Amor incondicional, abnegado, sacrificial y divino (Ágape)", "cat": "Atributos Divinos"},
    "G25": {"es": "Amar con entrega sacrificial y compromiso santo", "cat": "Vida Cristiana"},
    "G5485": {"es": "Gracia, favor inmerecido, generosidad bondadosa de Dios", "cat": "Soteriología"},
    "G4102": {"es": "Fe, confianza plena, lealtad y convicción firme en Dios (Pistis)", "cat": "Soteriología"},
    "G4100": {"es": "Creer, confiar el ser entero en Cristo Jesús", "cat": "Soteriología"},
    "G3056": {"es": "La Palabra, el Verbo eterno de Dios encarnado (Logos)", "cat": "Cristología"},
    "G4151": {"es": "Espíritu, el Espíritu Santo de Dios, hálito y vida (Pneuma)", "cat": "Neumatología"},
    "G1343": {"es": "Justicia, rectitud moral, justificación ante Dios", "cat": "Soteriología"},
    "G1344": {"es": "Justificar, declarar justo y perdonado ante Dios", "cat": "Soteriología"},
    "G225": {"es": "Verdad divina, autenticidad, realidad revelada (Aletheia)", "cat": "Doctrina Bíblica"},
    "G2222": {"es": "Vida plena y eterna, vida divina transmitida al creyente (Zoé)", "cat": "Vida Cristiana"},
    "G1515": {"es": "Paz, tranquilidad del alma reconciliada con Dios (Eiréne)", "cat": "Vida Cristiana"},
    "G2842": {"es": "Comunión, fraternidad profunda, solidaridad mutua (Koinonía)", "cat": "Eclesiología"},
    "G3341": {"es": "Arrepentimiento, transformación radical de mentalidad y corazón (Metánoia)", "cat": "Soteriología"},
    "G4991": {"es": "Salvación, liberación, preservación eterna y victoria (Sotería)", "cat": "Soteriología"},
    "G4990": {"es": "Salvador, libertador, rescate divino (Sotér)", "cat": "Cristología"},
    "G5547": {"es": "Cristo, el Ungido, el Mesías esperado", "cat": "Cristología"},
    "G2962": {"es": "Señor, Soberano supremo, Dueño de todo (Kýrios)", "cat": "Cristología"},
    "G2316": {"es": "Dios, la Deidad suprema y Trina (Theós)", "cat": "Teología Propia"},
    "G40": {"es": "Santo, apartado para Dios, consagrado a la pureza (Hágios)", "cat": "Santidad"},
    "G3875": {"es": "El Consolador, Abogado, Intercesor, el Espíritu Santo (Parácleto)", "cat": "Neumatología"},
    "G1577": {"es": "Iglesia, congregación de los redimidos, convocados (Ekklesía)", "cat": "Eclesiología"},
    "G2098": {"es": "Evangelio, buenas noticias de salvación y reconciliación", "cat": "Evangelización"},
    "G2097": {"es": "Evangelizar, proclamar las buenas nuevas de Jesucristo", "cat": "Evangelización"},
    "G1680": {"es": "Esperanza viva, certeza gozosa en las promesas divinas (Elpis)", "cat": "Vida Cristiana"},
    "G5479": {"es": "Gozo, alegría profunda e inamovible concedida por Dios (Jará)", "cat": "Vida Cristiana"},
    "G4716": {"es": "Cruz, el instrumento de redención y victoria sobre el pecado", "cat": "Expiación y Redención"},
    "G281": {"es": "Amén, en verdad, ciertamente, asentimiento firme", "cat": "Vida Cristiana"},
    "G1242": {"es": "Pacto, testamento sellado por Dios (Diatheke)", "cat": "Pactos Bíblicos"},
    "G266": {"es": "Pecado, errar el blanco divino, desvío moral (Hamartía)", "cat": "Hamartiología"},
    "G859": {"es": "Perdón, remisión de ofensas, cancelación de la deuda (Áphesis)", "cat": "Expiación y Redención"},
    "G629": {"es": "Redención, liberación mediante el precio pagado en la cruz (Apolýtrosis)", "cat": "Expiación y Redención"},
    "G3141": {"es": "Testimonio, evidencia fidedigna de la verdad (Martyría)", "cat": "Ministerio y Misión"},
    "G4166": {"es": "Pastor, guía espiritual que cuida y apacienta las ovejas", "cat": "Ministerio Pastoral"},
    "G652": {"es": "Apóstol, enviado oficial y comisionado por Cristo", "cat": "Ministerios Bíblicos"},
    "G1320": {"es": "Maestro, instructor fiel de la verdad divina (Didáskalos)", "cat": "Ministerios Bíblicos"},
    "G1249": {"es": "Diácono, siervo diligente en amor para la comunidad", "cat": "Ministerios Bíblicos"},
    "G4245": {"es": "Anciano, presbítero, supervisor maduro en la fe (Presbýteros)", "cat": "Ministerios Bíblicos"},
}

strong_unified = {}

for k, v in h_data.items():
    num = int(k[1:])
    extra = SPANISH_GLOSSES.get(k, {})
    strong_unified[k] = {
        'id': k,
        'num': num,
        'lang': 'hebrew',
        'lemma': v.get('lemma', ''),
        'translit': v.get('xlit', ''),
        'pron': v.get('pron', ''),
        'deriv': v.get('derivation', ''),
        'def': v.get('strongs_def', '').strip(),
        'kjv': v.get('kjv_def', '').strip(),
        'esGloss': extra.get('es', ''),
        'category': extra.get('cat', '')
    }

for k, v in g_data.items():
    num = int(k[1:])
    extra = SPANISH_GLOSSES.get(k, {})
    strong_unified[k] = {
        'id': k,
        'num': num,
        'lang': 'greek',
        'lemma': v.get('lemma', ''),
        'translit': v.get('translit', ''),
        'pron': '',
        'deriv': v.get('derivation', ''),
        'def': v.get('strongs_def', '').strip(),
        'kjv': v.get('kjv_def', '').strip(),
        'esGloss': extra.get('es', ''),
        'category': extra.get('cat', '')
    }

out_strong = 'src/data/strong-dictionary.json'
with open(out_strong, 'w', encoding='utf-8') as f:
    json.dump(strong_unified, f, ensure_ascii=False, separators=(',', ':'))

print(f"Guardado exitoso: {out_strong} ({os.path.getsize(out_strong) / 1024 / 1024:.2f} MB)")

# 3. Descargar las 32 partes de referencias cruzadas TSK (Treasury of Scripture Knowledge)
print("Descargando referencias cruzadas bíblicas TSK (32 archivos en paralelo)...")

def fetch_tsk(i):
    url = f'https://raw.githubusercontent.com/josephilipraja/bible-cross-reference-json/master/{i}.json'
    try:
        with urllib.request.urlopen(url, timeout=15) as r:
            return json.loads(r.read().decode('utf-8'))
    except Exception as e:
        print(f"Error descargando parte {i}: {e}")
        return {}

with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:
    all_tsk = list(ex.map(fetch_tsk, range(1, 33)))

def parse_ref(ref_str):
    parts = ref_str.strip().split()
    if len(parts) >= 3:
        b_abbr, ch, v = parts[0], parts[1], parts[2]
        b_id = ABBREV_TO_BOOK_ID.get(b_abbr)
        if b_id:
            return f"{b_id}:{ch}:{v}"
    return None

compressed_tsk = {}
total_links = 0

for file_data in all_tsk:
    for k, item in file_data.items():
        v_str = item.get('v')
        if not v_str: continue
        parts = v_str.strip().split()
        if len(parts) < 3: continue
        b_id = ABBREV_TO_BOOK_ID.get(parts[0])
        if not b_id: continue
        ch, v = parts[1], parts[2]
        key = f"{b_id}-{ch}-{v}"
        refs = []
        r_map = item.get('r', {})
        for _, ref_val in r_map.items():
            parsed = parse_ref(ref_val)
            if parsed:
                refs.append(parsed)
                total_links += 1
        if refs:
            compressed_tsk[key] = refs

out_tsk = 'src/data/cross-references.json'
with open(out_tsk, 'w', encoding='utf-8') as f:
    json.dump(compressed_tsk, f, ensure_ascii=False, separators=(',', ':'))

print(f"Guardado exitoso: {out_tsk} ({len(compressed_tsk)} versículos con {total_links} conexiones bíblicas, {os.path.getsize(out_tsk) / 1024 / 1024:.2f} MB)")

# 4. Crear archivo de Términos Teológicos Fundamentales
theological_terms = [
    {
        "id": "term-shalom",
        "name": "Shalom (Paz Integral)",
        "original": "שָׁלוֹם",
        "translit": "Shâlôwm",
        "strongId": "H7965",
        "testament": "Antiguo Testamento",
        "category": "Vida Espiritual y Bienestar",
        "shortSummary": "Mucho más que ausencia de conflicto: es plenitud, armonía con Dios, salud total y prosperidad espiritual.",
        "explanation": "En el pensamiento bíblico hebreo, 'Shalom' no denota simplemente una tregua militar o ausencia de guerra. Proviene de la raíz 'shalam' (completar, pagar, restaurar). Describe el estado integral en el que nada falta, nada está roto y todas las áreas de la vida reposan en la perfecta justicia y favor de Dios. Jesús es profetizado como el 'Príncipe de Paz' (Sar Shalom, Isaías 9:6) y en el NT Jesús declara: 'Mi paz os dejo, mi paz os doy; yo no os la doy como el mundo la da' (Juan 14:27).",
        "keyVerses": ["Números 6:24-26", "Salmos 29:11", "Isaías 9:6", "Jeremías 29:11", "Juan 14:27", "Filipenses 4:7"]
    },
    {
        "id": "term-hesed",
        "name": "Hesed (Amor Leal y Misericordia de Pacto)",
        "original": "חֶסֶד",
        "translit": "Chesed / Hesed",
        "strongId": "H2617",
        "testament": "Antiguo Testamento",
        "category": "Atributos Divinos",
        "shortSummary": "El amor fiel, entrañable e inquebrantable de Dios que persiste aun cuando el ser humano falla.",
        "explanation": "'Hesed' es una de las palabras más ricas de las Escrituras. Traducida a menudo como 'misericordia', 'clemencia' o 'gran bondad', expresa el compromiso incondicional y la fidelidad eterna de Dios con Su pacto. Es el amor activo que busca el bien del otro más allá del merecimiento, resumido en el Salmo 136: 'Porque para siempre es su misericordia'.",
        "keyVerses": ["Éxodo 34:6-7", "Salmos 23:6", "Salmos 136:1-26", "Lamentaciones 3:22-23", "Miqueas 6:8", "Oseas 6:6"]
    },
    {
        "id": "term-ruaj",
        "name": "Ruaj (Espíritu y Aliento Divino)",
        "original": "רוּחַ",
        "translit": "Rûwach / Ruaj",
        "strongId": "H7307",
        "testament": "Antiguo Testamento",
        "category": "Neumatología",
        "shortSummary": "Viento invisible pero poderoso, el aliento creador que imparte vida y la presencia soberana de Dios.",
        "explanation": "Aparece desde el segundo versículo de la Biblia: 'y el Espíritu de Dios se movía sobre la faz de las aguas' (Génesis 1:2). 'Ruaj' es dinámico y vivificante; cuando Dios insufla Su ruaj en el polvo, el hombre llega a ser un ser viviente (Génesis 2:7). En el valle de los huesos secos (Ezequiel 37), el Ruaj de Dios resucita un ejército de entre la muerte espiritual.",
        "keyVerses": ["Génesis 1:2", "Job 33:4", "Salmos 104:30", "Ezequiel 37:9-14", "Zacarías 4:6"]
    },
    {
        "id": "term-elohim",
        "name": "Elohim (Dios Creador y Soberano)",
        "original": "אֱלֹהִים",
        "translit": "ʼĔlôhîym",
        "strongId": "H430",
        "testament": "Antiguo Testamento",
        "category": "Nombres Divinos",
        "shortSummary": "Nombre plural de majestad para el Dios único, Creador omnipotente y Gobernante del universo.",
        "explanation": "El sustantivo 'Elohim' posee terminación plural gramatical hebrea (-im), utilizada teológicamente como plural de excelencia y majestad suprema, insinuando en el misterio de la revelación progresiva la Santa Trinidad. En Génesis 1:1 rige el verbo singular 'creó' (bará), demostrando que un único Dios creador actúa en infinita grandeza.",
        "keyVerses": ["Génesis 1:1", "Deuteronomio 10:17", "Salmos 8:5", "Isaías 45:18", "Salmos 90:1-2"]
    },
    {
        "id": "term-yahweh",
        "name": "Yahweh / YHWH (El SEÑOR del Pacto)",
        "original": "יְהֹוָה",
        "translit": "Yehôvâh / Yahweh",
        "strongId": "H3068",
        "testament": "Antiguo Testamento",
        "category": "Nombres Divinos",
        "shortSummary": "El nombre sagrado inefable: El Eterno, el que existe por Sí mismo y nunca abandona a Su pueblo.",
        "explanation": "Revelado a Moisés en la zarza ardiente: 'YO SOY EL QUE SOY' (Éxodo 3:14). El Tetragrámaton YHWH subraya la autoexistencia, inmutabilidad y fidelidad del Dios vivo. En las traducciones al español como Reina-Valera 1960 se vierte con mayúsculas 'JEHOVÁ' o 'el SEÑOR'.",
        "keyVerses": ["Éxodo 3:14-15", "Éxodo 6:2-3", "Salmos 23:1", "Isaías 42:8", "Malaquías 3:6"]
    },
    {
        "id": "term-bara",
        "name": "Bará (Crear de la Nada)",
        "original": "בָּרָא",
        "translit": "Bârâʼ",
        "strongId": "H1254",
        "testament": "Antiguo Testamento",
        "category": "Creación",
        "shortSummary": "Verbo reservado exclusivamente a la acción creadora de Dios, produciendo algo nuevo donde antes no existía materia.",
        "explanation": "En las Escrituras, el ser humano jamás es sujeto de 'bará'. Solamente Dios 'crea' (bará) el cosmos (Génesis 1:1), la vida y un corazón limpio en el pecador arrepentido: 'Crea en mí, oh Dios, un corazón limpio' (Salmo 51:10).",
        "keyVerses": ["Génesis 1:1", "Génesis 1:27", "Salmos 51:10", "Isaías 40:28", "Isaías 65:17"]
    },
    {
        "id": "term-qadosh",
        "name": "Qadosh (Santo, Trascendente)",
        "original": "קָדוֹשׁ",
        "translit": "Qâdôwsh",
        "strongId": "H6918",
        "testament": "Antiguo Testamento",
        "category": "Santidad Divina",
        "shortSummary": "Completamente apartado de lo corrupto, puro en esencia y trascendente sobre toda la creación.",
        "explanation": "La santidad de Dios es Su gloria esencial. En Isaías 6:3 los serafines proclaman el trisagio: 'Santo, Santo, Santo, Jehová de los ejércitos'. Dios llama a Su pueblo a reflejar Su naturaleza: 'Sed santos, porque yo soy santo' (Levítico 19:2; 1 Pedro 1:16).",
        "keyVerses": ["Levítico 11:44", "Levítico 19:2", "Isaías 6:3", "Isaías 57:15", "Habacuc 1:13"]
    },
    {
        "id": "term-berit",
        "name": "Berit (Pacto Solemne)",
        "original": "בְּרִית",
        "translit": "Bᵉrîyth",
        "strongId": "H1285",
        "testament": "Antiguo Testamento",
        "category": "Pactos Bíblicos",
        "shortSummary": "Compromiso sagrado jurado por Dios con garantías divinas de redención y comunión.",
        "explanation": "La teología bíblica está cimentada sobre los pactos divinos: Adámico, Noé, Abrahámico, Mosaico, Davídico y el Nuevo Pacto prometido en Jeremías 31:31 y sellado por la sangre de Jesús (Lucas 22:20; Hebreos 8:6-13).",
        "keyVerses": ["Génesis 9:9-11", "Génesis 15:18", "Jeremías 31:31-34", "Lucas 22:20", "Hebreos 9:15"]
    },
    {
        "id": "term-agape",
        "name": "Ágape (Amor Sacrificial y Divino)",
        "original": "ἀγάπη",
        "translit": "Agápē",
        "strongId": "G26",
        "testament": "Nuevo Testamento",
        "category": "Atributos Divinos y Ética",
        "shortSummary": "El amor desinteresado que no depende del valor del receptor, sino que se entrega hasta la muerte.",
        "explanation": "'De tal manera amó Dios al mundo...' (Juan 3:16). A diferencia de 'filia' (amistad) o 'eros' (pasión), 'ágape' es el amor divino que busca activamente el mayor bienestar eterno del otro a cualquier costo personal. Romanos 5:8 enseña: 'Mas Dios muestra su amor para con nosotros, en que siendo aún pecadores, Cristo murió por nosotros'.",
        "keyVerses": ["Juan 3:16", "Romanos 5:8", "1 Corintios 13:1-13", "Gálatas 5:22", "1 Juan 4:7-12"]
    },
    {
        "id": "term-logos",
        "name": "Logos (El Verbo / La Palabra Eterna)",
        "original": "λόγος",
        "translit": "Lógos",
        "strongId": "G3056",
        "testament": "Nuevo Testamento",
        "category": "Cristología",
        "shortSummary": "La suprema revelación personal de Dios encarnada: Jesucristo, por quien todo fue creado.",
        "explanation": "En la filosofía griega era el principio ordenador del cosmos; en el pensamiento judío era la 'Dabar Yahweh' (la Palabra creadora del SEÑOR). El apóstol Juan las une majestuosamente en Juan 1:1-14: el Logos era en el principio con Dios, era Dios, y se hizo carne para habitar entre los hombres lleno de gracia y de verdad.",
        "keyVerses": ["Juan 1:1-3", "Juan 1:14", "Hebreos 4:12", "1 Juan 1:1", "Apocalipsis 19:13"]
    },
    {
        "id": "term-pneuma",
        "name": "Pneuma (El Espíritu Santo)",
        "original": "πνεῦμα",
        "translit": "Pneûma",
        "strongId": "G4151",
        "testament": "Nuevo Testamento",
        "category": "Neumatología",
        "shortSummary": "La tercera persona de la Trinidad: santificador, consolador, guía y dador de dones espirituales.",
        "explanation": "El Espíritu Santo regenera al creyente (Tito 3:5), da testimonio de nuestra filiación divina (Romanos 8:16), produce Su fruto en nosotros (Gálatas 5:22-23) y unge con poder a la Iglesia para la misión y el testimonio fiel (Hechos 1:8).",
        "keyVerses": ["Mateo 28:19", "Juan 14:16-17", "Juan 16:13-14", "Hechos 1:8", "Romanos 8:9-11", "Gálatas 5:22-25"]
    },
    {
        "id": "term-pistis",
        "name": "Pistis (Fe, Certeza y Fidelidad)",
        "original": "πίστις",
        "translit": "Pístis",
        "strongId": "G4102",
        "testament": "Nuevo Testamento",
        "category": "Soteriología",
        "shortSummary": "No es una simple emoción o pensamiento positivo: es entrega total, confianza incondicional y lealtad a Cristo.",
        "explanation": "Hebreos 11:1 define la fe como 'la certeza de lo que se espera, la convicción de lo que no se ve'. La fe es el canal por el cual el ser humano se apropia de la gracia salvadora (Efesios 2:8-9). Sin fe es imposible agradar a Dios (Hebreos 11:6), y la fe verdadera se evidencia de modo activo a través de las obras de amor (Santiago 2:17).",
        "keyVerses": ["Habacuc 2:4", "Romanos 1:17", "Romanos 5:1", "Efesios 2:8-9", "Hebreos 11:1-6", "Santiago 2:14-26"]
    },
    {
        "id": "term-charis",
        "name": "Charis (Gracia Inmerecida)",
        "original": "χάρις",
        "translit": "Cháris",
        "strongId": "G5485",
        "testament": "Nuevo Testamento",
        "category": "Soteriología",
        "shortSummary": "La dádiva y bondad inagotable de Dios hacia quienes merecían juicio, capacitándolos para vida santa.",
        "explanation": "La gracia es el corazón del evangelio cristiano. No es una mera dispensa legal, sino el favor vivificante de Dios que salva al pecador independientemente de méritos humanos (Efesios 2:8-9) y le enseña a renunciar a la impiedad para vivir sobria y piadosamente (Tito 2:11-12).",
        "keyVerses": ["Juan 1:16-17", "Romanos 3:24", "Romanos 5:20-21", "2 Corintios 12:9", "Efesios 2:8-10", "Tito 2:11-14"]
    },
    {
        "id": "term-dikaiosyne",
        "name": "Dikaiosýne (Justicia y Justificación)",
        "original": "δικαιοσύνη",
        "translit": "Dikaiosýnē",
        "strongId": "G1343",
        "testament": "Nuevo Testamento",
        "category": "Soteriología",
        "shortSummary": "La justicia de Dios imputada al creyente por medio de la fe en Jesucristo, libertándolo de condenación.",
        "explanation": "El problema humano fundamental es que 'no hay justo, ni aun uno' (Romanos 3:10). La gloriosa solución del evangelio es que la perfecta justicia de Cristo nos es atribuida cuando creemos en Él (2 Corintios 5:21), siendo declarados justos delante del tribunal divino.",
        "keyVerses": ["Romanos 1:17", "Romanos 3:21-26", "Romanos 5:1-2", "2 Corintios 5:21", "Filipenses 3:9"]
    },
    {
        "id": "term-koinonia",
        "name": "Koinonía (Comunión y Participación Fraterna)",
        "original": "κοινωνία",
        "translit": "Koinōnía",
        "strongId": "G2842",
        "testament": "Nuevo Testamento",
        "category": "Eclesiología",
        "shortSummary": "Unión íntima, compartir mutuo de bienes espirituales y materiales entre hermanos en Cristo.",
        "explanation": "Describe la vida en común de la Iglesia primitiva (Hechos 2:42). No es un compañerismo superficial, sino el lazo indisoluble forjado por participar todos de la vida del mismo Espíritu y del cuerpo de Cristo.",
        "keyVerses": ["Hechos 2:42", "1 Corintios 10:16", "2 Corintios 13:14", "Filipenses 2:1-2", "1 Juan 1:3-7"]
    },
    {
        "id": "term-metanoia",
        "name": "Metánoia (Arrepentimiento Transformador)",
        "original": "μετάνοια",
        "translit": "Metánoia",
        "strongId": "G3341",
        "testament": "Nuevo Testamento",
        "category": "Soteriología y Vida Cristiana",
        "shortSummary": "Cambio radical de mentalidad, rumbo y dirección: dar la espalda al pecado para correr hacia Dios.",
        "explanation": "Literalmente significa 'cambio de mente' (meta = después/cambio; nous = mente). Es el primer llamado de Jesús en Su ministerio público: 'Arrepentíos [metanoeite], porque el reino de los cielos se ha acercado' (Mateo 4:17). Produce frutos dignos en una conducta renovada (Lucas 3:8).",
        "keyVerses": ["Mateo 3:8", "Mateo 4:17", "Lucas 15:7", "Hechos 3:19", "Hechos 17:30", "2 Corintios 7:10"]
    },
    {
        "id": "term-soteria",
        "name": "Sotería (Salvación y Liberación Plena)",
        "original": "σωτηρία",
        "translit": "Sōtēría",
        "strongId": "G4991",
        "testament": "Nuevo Testamento",
        "category": "Soteriología",
        "shortSummary": "Rescate completo del creyente de la condenación, del poder del pecado y de la muerte eterna.",
        "explanation": "Abarca tres tiempos en la vida del creyente: fuimos salvos de la culpa del pecado (justificación), estamos siendo salvos del dominio del pecado (santificación), y seremos salvos de la presencia del pecado (glorificación final).",
        "keyVerses": ["Lucas 19:9", "Romanos 1:16", "Efesios 1:13", "Filipenses 2:12", "1 Tesalonicenses 5:9", "Hebreos 2:3"]
    },
    {
        "id": "term-eirene",
        "name": "Eiréne (Paz con Dios)",
        "original": "εἰρήνη",
        "translit": "Eirḗnē",
        "strongId": "G1515",
        "testament": "Nuevo Testamento",
        "category": "Vida Cristiana",
        "shortSummary": "Reconciliación y sosiego del alma obtenida por la cruz de nuestro Señor Jesucristo.",
        "explanation": "Traducción griega del 'Shalom' hebreo. 'Justificados, pues, por la fe, tenemos paz para con Dios por medio de nuestro Señor Jesucristo' (Romanos 5:1). Filipenses 4:7 promete la paz que 'sobrepasa todo entendimiento, guardará vuestros corazones y vuestros pensamientos en Cristo Jesús'.",
        "keyVerses": ["Juan 14:27", "Romanos 5:1", "Romanos 8:6", "Efesios 2:14-17", "Filipenses 4:7", "Colosenses 3:15"]
    }
]

out_terms = 'src/data/theological-terms.json'
with open(out_terms, 'w', encoding='utf-8') as f:
    json.dump(theological_terms, f, ensure_ascii=False, indent=2)

print(f"Guardado exitoso: {out_terms} ({len(theological_terms)} conceptos teológicos)")
print("=== Proceso completado exitosamente ===")
