import sys
import os
import argparse
import numpy as np
import tensorflow.compat.v1 as tf
import torch
import librosa

# Paths
current_dir = os.path.dirname(os.path.abspath(__file__))
illegal_dir = os.path.abspath(os.path.join(current_dir, 'model_weights', 'IllegalLogging'))
vggish_dir = os.path.abspath(os.path.join(current_dir, 'model_weights', 'VGGish'))

sys.path.append(os.path.abspath(os.path.join(current_dir, 'VGGish'))) # for vggish scripts
sys.path.append(os.path.abspath(os.path.join(current_dir, 'src'))) #for model and config files

import vggish_input
import vggish_params
import vggish_postprocess
import vggish_slim

from model import IllegalLoggingModel
from config import META_CLASSES


# Load m4a/wav convert to VGGish examples
def m4a_to_examples(audio_path):
    data, sr = librosa.load(audio_path, sr=None, mono=True)
    examples = vggish_input.waveform_to_examples(data, sr)
    return examples


# Convert embeddings to classifier input
def prepare_embeddings(postprocessed_batch):
    embeddings = postprocessed_batch.astype(np.float32) / 255.0

    if embeddings.shape[0] < 10:
        pad = np.zeros((10 - embeddings.shape[0], 128), dtype=np.float32)
        embeddings = np.vstack([embeddings, pad])
    elif embeddings.shape[0] > 10:
        embeddings = embeddings[:10]

    embeddings = np.expand_dims(embeddings, axis=0)

    return embeddings





def main(args):

    folder = args.audio_folder

    if not os.path.exists(folder):
        print("Folder not found:", folder)
        sys.exit(1)


    # Load custom classifier
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    model_path = os.path.join(illegal_dir, "outputs_model.pt")

    model = IllegalLoggingModel(num_classes=5)
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.to(device)
    model.eval()

    print("Loaded classifier on:", device)

    # Setup VGGish
    checkpoint_path = os.path.join(vggish_dir, "vggish_model.ckpt")
    pca_params_path = os.path.join(vggish_dir, "vggish_pca_params.npz")

    pproc = vggish_postprocess.Postprocessor(pca_params_path)

    # TensorFlow session
    with tf.Graph().as_default(), tf.Session() as sess:

        vggish_slim.define_vggish_slim(training=False)
        vggish_slim.load_vggish_slim_checkpoint(sess, checkpoint_path)

        features_tensor = sess.graph.get_tensor_by_name(vggish_params.INPUT_TENSOR_NAME)

        embedding_tensor = sess.graph.get_tensor_by_name(vggish_params.OUTPUT_TENSOR_NAME)

        # Loop through all files
        # files = [f for f in os.listdir(folder) if f.endswith(".m4a")]
        files = [f for f in os.listdir(folder) if f.endswith(".wav")]

        print(f"\nFound {len(files)} audio files\n")

        output_file = os.path.join(folder, "inference_results.txt")
        fout = open(output_file, "w")

        for file in sorted(files):

            audio_path = os.path.join(folder, file)

            print("Processing:", file)

            try:

                # examples_batch = m4a_to_examples(audio_path)
                examples_batch = vggish_input.wavfile_to_examples(audio_path)

                [embedding_batch] = sess.run(
                    [embedding_tensor],
                    feed_dict={features_tensor: examples_batch},
                )

                postprocessed_batch = pproc.postprocess(embedding_batch)

                # Prepare classifier input
                embeddings = prepare_embeddings(postprocessed_batch)

                inputs = torch.tensor(embeddings, dtype=torch.float32).to(device)


                # run classifier
                with torch.no_grad():

                    outputs = model(inputs)
                    probs = torch.softmax(outputs, dim=1)

                    pred_idx = torch.argmax(probs, dim=1).item()
                    confidence = probs[0][pred_idx].item()

                pred_label = META_CLASSES.get(pred_idx, str(pred_idx))

                # print(f"Prediction: {pred_label} | Confidence: {confidence:.4f}")
                result_line = f"{file} | Prediction: {pred_label} | Confidence: {confidence:.4f}"
                print(result_line)
                fout.write(result_line + "\n")

            except Exception as e:
                print("Error processing:", file)
                print(e)

            print("-" * 40)

        fout.close()
        print(f"\nResults saved to: {output_file}")

if __name__ == "__main__":

    parser = argparse.ArgumentParser(description="Batch inference for .m4a audio files")

    parser.add_argument(
        "--audio_folder",
        type=str,
        default="data/demo",
        help="Folder containing .m4a audio files",
    )

    args = parser.parse_args()

    tf.logging.set_verbosity(tf.logging.ERROR)
    os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

    main(args)