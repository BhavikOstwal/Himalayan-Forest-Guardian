import random
import time

def process_audio_chunk(audio_data: str) -> dict:
    """
    Mock ML inference predicting if chainsaw sound is present.
    """
    # Simulate processing delay
    time.sleep(0.5)
    
    # Randomly generate predictions emphasizing chainsaw detection
    is_chainsaw = random.random() > 0.5  # 50% chance for test purposes
    confidence = random.uniform(85.0, 99.9) if is_chainsaw else random.uniform(5.0, 45.0)
    
    return {
        "is_chainsaw": is_chainsaw,
        "confidence": round(confidence, 2)
    }
