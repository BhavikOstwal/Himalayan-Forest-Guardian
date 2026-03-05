import os
import numpy as np
import tensorflow as tf
from tqdm import tqdm
from config import CLASS_INDEX_MAP, SAFE_BACKGROUND_IDS, BACKGROUND_CLASS

BASE_FEATURE_DIR = "../data/features"
OUTPUT_DIR = "../data/processed"

os.makedirs(OUTPUT_DIR, exist_ok=True)

def parse_tfrecord(example):
    context_features = {
        "video_id": tf.io.FixedLenFeature([], tf.string),
        "start_time_seconds": tf.io.FixedLenFeature([], tf.float32),
        "end_time_seconds": tf.io.FixedLenFeature([], tf.float32),
        "labels": tf.io.VarLenFeature(tf.int64)
    }

    sequence_features = {
        "audio_embedding": tf.io.FixedLenSequenceFeature([], tf.string)
    }

    context, sequence = tf.io.parse_single_sequence_example(
        example,
        context_features=context_features,
        sequence_features=sequence_features
    )

    print(f"Context: {context}\n")
    print(f"Sequence: {sequence}\n")

    embeddings = tf.map_fn(
        lambda x: tf.io.decode_raw(x, tf.uint8),
        sequence["audio_embedding"],
        dtype=tf.uint8
    )

    print(f"Raw embeddings shape: {embeddings.shape}\n")

    embeddings = tf.cast(embeddings, tf.float32) / 255.0
    embeddings = tf.reshape(embeddings, [-1, 128])

    print(f"embeddings shape: {embeddings.shape}\n")

    labels = tf.sparse.to_dense(context["labels"])

    return embeddings.numpy(), labels.numpy()

def map_to_meta_class(labels):
    labels = set(labels)

    # Check positive classes first
    for meta_class, indices in CLASS_INDEX_MAP.items():
        if labels.intersection(indices):
            return meta_class

    # Check safe background
    if labels.intersection(SAFE_BACKGROUND_IDS):
        return BACKGROUND_CLASS

    # Discard everything else
    return None

def process_split(split_name):
    split_dir = os.path.join(BASE_FEATURE_DIR, split_name)

    X = []
    y = []

    tfrecord_files = [
        os.path.join(split_dir, f)
        for f in os.listdir(split_dir)
        if f.endswith(".tfrecord")
    ]

    tfrecord_files = tfrecord_files

    for file in tqdm(tfrecord_files, desc=f"Processing {split_name}"):

        dataset = tf.data.TFRecordDataset(file)
        print(f"Dataset: {dataset}\n")

        for raw_record in dataset:
            print(f"Raw record: {raw_record}\n")
            embeddings, labels = parse_tfrecord(raw_record)

            meta_label = map_to_meta_class(labels)
            print(f"Meta label: {meta_label}\n")

            # break
            if meta_label is None:
                continue

            if embeddings.shape[0] < 10:
                continue

            embeddings = embeddings[:10]

            X.append(embeddings)
            y.append(meta_label)

    X = np.array(X)
    y = np.array(y)

    return X, y

def main():

    print("Processing TRAIN (unbal_train)...")
    X_train, y_train = process_split("unbal_train")

    print("Processing TEST (eval)...")
    X_test, y_test = process_split("eval")

    np.save(os.path.join(OUTPUT_DIR, "X_train.npy"), X_train)
    np.save(os.path.join(OUTPUT_DIR, "y_train.npy"), y_train)
    np.save(os.path.join(OUTPUT_DIR, "X_test.npy"), X_test)
    np.save(os.path.join(OUTPUT_DIR, "y_test.npy"), y_test)

    print("Saved processed datasets.")

if __name__ == "__main__":
    main()