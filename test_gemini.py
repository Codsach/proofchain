import os
import json
import sys
sys.path.append(r"C:\MyProjects\proofchain\ai-service")
from dotenv import load_dotenv

load_dotenv(".env.local")

from gemini import analyse_image

# Create a dummy image
dummy_image = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDAT\x08\xd7c\xf8\xff\xff\xff\x00\x00\x05\xfe\x02\xfe\x00\x00\x00\x00IEND\xaeB`\x82'

result = analyse_image(dummy_image, "image/png")
print("Result:", result)
