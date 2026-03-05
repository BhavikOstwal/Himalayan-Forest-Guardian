import sys
import os
import argparse
import numpy as np
import six
import soundfile
import tensorflow.compat.v1 as tf
import torch
import librosa

# Add VGGish directory and current directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
ml_dir = os.path.abspath(os.path.join(current_dir, '..'))
vggish_dir = os.path.join(ml_dir, 'VGGish')
sys.path.append(vggish_dir)
sys.path.append(current_dir)

import vggish_input
import vggish_params
import vggish_postprocess
import vggish_slim
from model import IllegalLoggingModel
from config import META_CLASSES

def generate_dummy_audio():
    """Generates a simple 5-second sine wave as a fallback."""
    num_secs = 5
    freq = 1000
    sr = 44100
    t = np.arange(0, num_secs, 1 / sr)
    x = np.sin(2 * np.pi * freq * t)
    # Convert to signed 16-bit samples.
    samples = np.clip(x * 32768, -32768, 32767).astype(np.int16)
    wav_file = six.BytesIO()
    soundfile.write(wav_file, samples, sr, format='WAV', subtype='PCM_16')
    wav_file.seek(0)
    return wav_file

def main(args):
    # ==========================================
    # 1. Load Audio and Extract VGGish Features
    # ==========================================
    if args.wav_file:
        wav_file = args.wav_file
        print(f"Loading user audio file: {wav_file}")
    else:
        print("No audio file provided. Generating a 5-second 1000Hz sine wave dummy...")
        wav_file = generate_dummy_audio()

    print("Extracting log mel spectrogram examples...")
    examples_batch = vggish_input.wavfile_to_examples(wav_file)

    checkpoint_path = os.path.join(vggish_dir, 'weights', 'vggish_model.ckpt')
    pca_params_path = os.path.join(vggish_dir, 'weights', 'vggish_pca_params.npz')

    print("Initializing VGGish Postprocessor...")
    pproc = vggish_postprocess.Postprocessor(pca_params_path)

    print("Running VGGish inference...")
    with tf.Graph().as_default(), tf.Session() as sess:
        vggish_slim.define_vggish_slim(training=False)
        vggish_slim.load_vggish_slim_checkpoint(sess, checkpoint_path)
        
        features_tensor = sess.graph.get_tensor_by_name(
            vggish_params.INPUT_TENSOR_NAME)
        embedding_tensor = sess.graph.get_tensor_by_name(
            vggish_params.OUTPUT_TENSOR_NAME)

        [embedding_batch] = sess.run([embedding_tensor],
                                     feed_dict={features_tensor: examples_batch})

        # Process into uint8 format similar to AudioSet features
        postprocessed_batch = pproc.postprocess(embedding_batch)

    # ==========================================
    # 2. Rescale Features for Custom Classifier
    # ==========================================
    print(f"Extracted {postprocessed_batch.shape[0]} frames of features.")
    
    # Cast to float32 and scale to [0, 1] exactly like preprocess.py does
    embeddings = postprocessed_batch.astype(np.float32) / 255.0

    # Ensure max 10 frames sequence as expected by the custom classifier training
    if embeddings.shape[0] < 10:
        # Pad with zeros if less than 10 frames
        pad_size = 10 - embeddings.shape[0]
        padding = np.zeros((pad_size, 128), dtype=np.float32)
        embeddings = np.vstack([embeddings, padding])
        print(f"Padded short sequence to 10 frames.")
    elif embeddings.shape[0] > 10:
        # Truncate to first 10 frames
        embeddings = embeddings[:10]
        print(f"Truncated long sequence to 10 frames.")

    # Shape expected: (batch_size, sequence_length, feature_dim) -> (1, 10, 128)
    embeddings = np.expand_dims(embeddings, axis=0)
    
    # ==========================================
    # 3. Custom Model Inference
    # ==========================================
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Loading custom classifier on {device}...")
    
    model_path = os.path.join(ml_dir, 'outputs_model.pt')
    if not os.path.exists(model_path):
        print(f"ERROR: Custom model weights not found at {model_path}.")
        sys.exit(1)

    model = IllegalLoggingModel(num_classes=5)
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.to(device)
    model.eval()

    inputs = torch.tensor(embeddings, dtype=torch.float32).to(device)

    print("Running classification...")
    with torch.no_grad():
        outputs = model(inputs)
        probs = torch.softmax(outputs, dim=1)
        pred_idx = torch.argmax(probs, dim=1).item()
        confidence = probs[0][pred_idx].item()

    # Map prediction back to string label
    pred_label = META_CLASSES.get(pred_idx, f"Unknown (ID: {pred_idx})")

    print("\n" + "="*40)
    print("INFERENCE RESULT:")
    print(f"Probs: {probs}")
    print(f"Predicted Class: {pred_label} (ID: {pred_idx})")
    print(f"Confidence:      {confidence:.4f}")
    print("="*40 + "\n")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="End-to-End Audio Inference Pipeline")
    parser.add_argument('--wav_file', type=str, default=None,
                        help="Path to a .wav audio file for inference. Defaults to generating a dummy sine tone.")
    args = parser.parse_args()
    
    # Suppress verbose TF logging locally
    tf.logging.set_verbosity(tf.logging.ERROR)
    os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
    
    main(args)
