import sys
import os
import numpy as np
import tensorflow.compat.v1 as tf
import torch

# Add ML directory and VGGish to path so we can import them
current_dir = os.path.dirname(os.path.abspath(__file__))
app_dir = os.path.dirname(current_dir)
ml_dir = os.path.join(app_dir, 'ml')
vggish_dir = os.path.join(ml_dir, 'VGGish')
src_dir = os.path.join(ml_dir, 'src')
weights_dir = os.path.join(ml_dir, 'model_weights')

sys.path.append(vggish_dir)
sys.path.append(src_dir)

import vggish_input
import vggish_params
import vggish_postprocess
import vggish_slim
from model import IllegalLoggingModel
from config import META_CLASSES

class AudioClassifierService:
    _instance = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        self.device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
        print(f"Initializing AudioClassifierService on {self.device}...")
        
        # Paths
        self.checkpoint_path = os.path.join(weights_dir, 'VGGish', 'vggish_model.ckpt')
        self.pca_params_path = os.path.join(weights_dir, 'VGGish', 'vggish_pca_params.npz')
        self.model_path = os.path.join(weights_dir, 'IllegalLogging', 'outputs_model.pt')
        
        tf.logging.set_verbosity(tf.logging.ERROR)
        os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
        
        # Load VGGish
        self.pproc = vggish_postprocess.Postprocessor(self.pca_params_path)
        self.tf_graph = tf.Graph()
        self.tf_sess = tf.Session(graph=self.tf_graph)
        
        with self.tf_graph.as_default():
            vggish_slim.define_vggish_slim(training=False)
            vggish_slim.load_vggish_slim_checkpoint(self.tf_sess, self.checkpoint_path)
            self.features_tensor = self.tf_sess.graph.get_tensor_by_name(vggish_params.INPUT_TENSOR_NAME)
            self.embedding_tensor = self.tf_sess.graph.get_tensor_by_name(vggish_params.OUTPUT_TENSOR_NAME)
            
        # Load PyTorch Model
        self.pytorch_model = IllegalLoggingModel(num_classes=5)
        self.pytorch_model.load_state_dict(torch.load(self.model_path, map_location=self.device))
        self.pytorch_model.to(self.device)
        self.pytorch_model.eval()
        
        print("AudioClassifierService initialized successfully.")

    def analyze_audio_file(self, wav_file_path: str) -> dict:
        print(f"Extracting log mel spectrogram examples from {wav_file_path}...")
        try:
            examples_batch = vggish_input.wavfile_to_examples(wav_file_path)
        except Exception as e:
            print(f"Error processing wav file: {e}")
            return {"is_chainsaw": False, "confidence": 0.0, "prediction_class": "error"}

        if len(examples_batch) == 0:
            return {"is_chainsaw": False, "confidence": 0.0, "prediction_class": "too_short"}

        # Run VGGish inference
        [embedding_batch] = self.tf_sess.run([self.embedding_tensor],
                                     feed_dict={self.features_tensor: examples_batch})

        postprocessed_batch = self.pproc.postprocess(embedding_batch)

        # Rescale
        embeddings = postprocessed_batch.astype(np.float32) / 255.0

        if embeddings.shape[0] < 10:
            pad_size = 10 - embeddings.shape[0]
            padding = np.zeros((pad_size, 128), dtype=np.float32)
            embeddings = np.vstack([embeddings, padding])
        elif embeddings.shape[0] > 10:
            embeddings = embeddings[:10]

        embeddings = np.expand_dims(embeddings, axis=0)

        # Run PyTorch Model
        inputs = torch.tensor(embeddings, dtype=torch.float32).to(self.device)

        with torch.no_grad():
            outputs = self.pytorch_model(inputs)
            probs = torch.softmax(outputs, dim=1)
            pred_idx = torch.argmax(probs, dim=1).item()
            confidence = probs[0][pred_idx].item() * 100.0

        pred_label = META_CLASSES.get(pred_idx, f"Unknown ({pred_idx})")
        
        # 'Chainsaw' implies is_chainsaw=True
        is_chainsaw = (pred_label.lower() == "chainsaw")

        return {
            "prediction_class": pred_label,
            "confidence": round(confidence, 2),
            "is_chainsaw": is_chainsaw
        }
