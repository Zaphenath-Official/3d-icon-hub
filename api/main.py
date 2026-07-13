import os
import sys
import torch
import re
import subprocess
import io
import uuid
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from unsloth import FastLanguageModel

app = Flask(__name__)
CORS(app)

MODEL_CONTAINER = {
    "model": None,
    "tokenizer": None,
    "current_mode": None
}

BASE_MODEL_NAME = "unsloth/gemma-2-2b-it-bnb-4bit"
MAX_SEQ_LENGTH = 2048

ALPACA_PROMPT = """Below is an instruction that describes a task. Write a response that appropriately completes the request.

### Instruction:
{}

### Response:
"""

# Upgraded cache to hold 3 distinct asset variations simultaneously
GENERATION_CACHE = {
    "flat": [
        "<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><circle cx='50' cy='50' r='40' fill='#4CAF50'/></svg>",
        "<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect x='10' y='10' width='80' height='80' fill='#2196F3'/></svg>",
        "<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><polygon points='50,15 90,85 10,85' fill='#FF9800'/></svg>"
    ],
    "3d": [
        "import bpy\\nbpy.ops.mesh.primitive_uv_sphere_add(radius=1.0)",
        "import bpy\\nbpy.ops.mesh.primitive_cube_add(size=2.0)",
        "import bpy\\nbpy.ops.mesh.primitive_cone_add(radius1=1.0, depth=2.0)"
    ]
}

def initialize_or_switch_model(target_mode):
    global MODEL_CONTAINER
    if MODEL_CONTAINER["current_mode"] == target_mode and MODEL_CONTAINER["model"] is not None:
        return MODEL_CONTAINER["model"], MODEL_CONTAINER["tokenizer"]

    print(f"🔄 Swapping system state context to target generation type: [{target_mode}]...")
    if MODEL_CONTAINER["model"] is not None:
        del MODEL_CONTAINER["model"]
        del MODEL_CONTAINER["tokenizer"]
        import gc
        gc.collect()
        torch.cuda.empty_cache()

    if target_mode == "flat":
        path = "training/flat_icons_lora"
    elif target_mode == "3d":
        path = "training/three_d_icons_lora"
    else:
        path = BASE_MODEL_NAME

    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name = path,
        max_seq_length = MAX_SEQ_LENGTH,
        dtype = None,
        load_in_4bit = True,
    )
    FastLanguageModel.for_inference(model)
    
    MODEL_CONTAINER["model"] = model
    MODEL_CONTAINER["tokenizer"] = tokenizer
    MODEL_CONTAINER["current_mode"] = target_mode
    return model, tokenizer

# Initialize baseline
initialize_or_switch_model("base")

@app.route("/api/generate", methods=["POST"])
def generate_icon_code():
    global GENERATION_CACHE
    data = request.json or {}
    instruction = data.get("prompt", "").strip()
    mode = data.get("mode", "base").lower()

    if not instruction:
        return jsonify({"error": "A prompt instruction is required"}), 400

    try:
        model, tokenizer = initialize_or_switch_model(mode)
        formatted_prompt = ALPACA_PROMPT.format(instruction)
        inputs = tokenizer([formatted_prompt], return_tensors="pt").to("cuda")
        
        # Enable sampling and set num_return_sequences to 3 for variant generation
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=1024,
                use_cache=True,
                do_sample=True,
                temperature=0.7,
                top_p=0.95,
                num_return_sequences=3
            )
            
        variations = []
        for i, output in enumerate(outputs):
            generated_tokens = output[inputs.input_ids.shape[1]:]
            raw_response = tokenizer.decode(generated_tokens, skip_special_tokens=True).strip()
            clean_code = re.sub(r"^```(?:xml|python|svg|javascript)?\\n|```$", "", raw_response, flags=re.MULTILINE).strip()
            variations.append(clean_code)

        # Cache the new batch of 3 variations
        if mode in ["flat", "3d"]:
            GENERATION_CACHE[mode] = variations

        return jsonify({
            "status": "success",
            "mode_used": mode,
            "variations": variations
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/asset/display", methods=["GET"])
def display_asset():
    """Returns specific variation via its array index index (0, 1, or 2)"""
    mode = request.args.get("mode", "flat").lower()
    try:
        idx = int(request.args.get("index", 0))
    except ValueError:
        idx = 0
        
    if idx < 0 or idx > 2:
        return jsonify({"error": "Index must be 0, 1, or 2"}), 400

    if mode == "flat":
        return GENERATION_CACHE["flat"][idx], 200, {"Content-Type": "image/svg+xml"}
    else:
        # Client side UI uses this script body to render placeholder/text or pass to local execution environment
        return jsonify({
            "mode": "3d",
            "index": idx,
            "script": GENERATION_CACHE["3d"][idx]
        })

@app.route("/api/asset/copy", methods=["GET"])
def copy_asset_code():
    """Returns plain code for the exact asset index selected"""
    mode = request.args.get("mode", "flat").lower()
    try:
        idx = int(request.args.get("index", 0))
    except ValueError:
        idx = 0

    if idx < 0 or idx > 2:
        return jsonify({"error": "Index must be 0, 1, or 2"}), 400

    target_code = GENERATION_CACHE["flat"][idx] if mode == "flat" else GENERATION_CACHE["3d"][idx]
    return jsonify({
        "status": "success",
        "mode": mode,
        "index": idx,
        "raw_code": target_code
    })

@app.route("/api/asset/download", methods=["GET"])
def download_asset_file():
    """Compiles SVGs directly or runs a headless Blender script compilation to compile a real .gltf"""
    mode = request.args.get("mode", "flat").lower()
    try:
        idx = int(request.args.get("index", 0))
    except ValueError:
        idx = 0

    if idx < 0 or idx > 2:
        return jsonify({"error": "Index must be 0, 1, or 2"}), 400

    if mode == "flat":
        file_buffer = io.BytesIO(GENERATION_CACHE["flat"][idx].encode('utf-8'))
        return send_file(
            file_buffer,
            mimetype="image/svg+xml",
            as_attachment=True,
            download_name=f"vector_icon_{idx}.svg"
        )
    else:
        # 3D .gltf Compilation Pipeline via Headless Blender
        blender_script_content = GENERATION_CACHE["3d"][idx]
        task_id = str(uuid.uuid4())
        script_filename = f"temp_script_{task_id}.py"
        gltf_filename = f"output_mesh_{task_id}.gltf"

        # Append the GLTF export command block to the model's instructions dynamically
        export_runner_code = f"""{blender_script_content}

import bpy
# Clear any default cameras/lights from the build scene to keep output pure
for obj in bpy.data.objects:
    if obj.type in ['CAMERA', 'LIGHT']:
        bpy.data.objects.remove(obj, do_unlink=True)

# Export the scene geometry out as standard gltf format
bpy.ops.export_scene.gltf(filepath='{gltf_filename}', export_format='GLTF_EMBEDDED')
"""
        
        try:
            with open(script_filename, "w") as f:
                f.write(export_runner_code)

            # Fire off headless blender command process safely
            subprocess.run(
                ["blender", "--background", "--python", script_filename],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                timeout=30
            )

            if os.path.exists(gltf_filename):
                with open(gltf_filename, "rb") as f:
                    gltf_data = io.BytesIO(f.read())
                
                # Cleanup temp worker file layers from workspace
                os.remove(script_filename)
                os.remove(gltf_filename)

                return send_file(
                    gltf_data,
                    mimetype="model/gltf+json",
                    as_attachment=True,
                    download_name=f"3d_icon_{idx}.gltf"
                )
            else:
                raise FileNotFoundError("Blender failed to compile geometric output payload.")

        except Exception as e:
            # Fallback safe exit path: provides raw text script if subprocess error spikes
            if os.path.exists(script_filename): os.remove(script_filename)
            fallback_buffer = io.BytesIO(blender_script_content.encode('utf-8'))
            return send_file(
                fallback_buffer,
                mimetype="text/x-python",
                as_attachment=True,
                download_name=f"fallback_3d_script_{idx}.py"
            )

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
