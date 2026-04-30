import pandas as pd
import os

# load audioset MID to index mapping
current_dir = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(current_dir, "..", "metadata", "class_labels_indices.csv")

if not os.path.exists(CSV_PATH):
    raise FileNotFoundError(
        f"class_labels_indices.csv not found at {CSV_PATH}"
    )

df = pd.read_csv(CSV_PATH)
MID_TO_INDEX = dict(zip(df["mid"], df["index"]))


# meta classes
META_CLASSES = {
    0: "background",
    1: "chainsaw",
    2: "gunshot",
    3: "birds",
    4: "animals"
}

BACKGROUND_CLASS = 0

# define MIDS ;(MID = Machine Identifier in Audioset ontology)
MIDS = {
    "chainsaw": "/m/01j4z9",
    "gunshot": "/m/032s66",

    "engine": "/m/02mk9",
    "motorcycle": "/m/04_sv",
    "mid_engine": "/t/dd00066",

    "speech": "/m/09x0r",
    "conversation": "/m/01h8n0",
    "shout": "/m/07p6fty",

    "wood": "/m/083vt",
    "rain": "/m/06mb1",
    "leaves": "/m/09t49",
    "wind": "/t/dd00092",
    "natural": "/m/059j3w",
    "birds": "/m/015p6",
    "animals": "/m/01280g",
    "small_birds": "/m/07pggtn"
}

def get_index(mid):
    if mid not in MID_TO_INDEX:
        raise ValueError(f"MID {mid} not found in class_labels_indices.csv")
    return MID_TO_INDEX[mid]


# class index map (INTEGER IDS)
CLASS_INDEX_MAP = {
    1: [
        get_index(MIDS["chainsaw"]),
        get_index(MIDS["wood"]),
        get_index(MIDS["engine"]),
        get_index(MIDS["mid_engine"])
    ],
    2: [get_index(MIDS["gunshot"])],
    # 3: [
    #     get_index(MIDS["motorcycle"]),
    # ],
    3: [
        get_index(MIDS["birds"]),
        get_index(MIDS["small_birds"])
    ],
    4: [get_index(MIDS["animals"])],
    # 5: [
    #     get_index(MIDS["speech"]),
    #     get_index(MIDS["conversation"]),
    #     get_index(MIDS["shout"])
    # ]
}

SAFE_BACKGROUND_IDS = [
    get_index(MIDS["rain"]),
    get_index(MIDS["leaves"]),
    get_index(MIDS["wind"]),
    # get_index(MIDS["natural"]), # natural sound is not in class to indices csv.. so we skip it for now
    
]