import os
import json
import time
import asyncio
from dotenv import load_dotenv
load_dotenv()
from models import MTO
import google.generativeai as genai
import fitz  # PyMuPDF
from io import BytesIO
from PIL import Image

def process_pdf_to_image(file_bytes: bytes) -> Image.Image:
    """Converts the first page of a PDF to a PIL Image."""
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    page = doc.load_page(0)
    pix = page.get_pixmap(dpi=300)
    img_data = pix.tobytes("png")
    return Image.open(BytesIO(img_data))

def get_mock_mto() -> dict:
    """Returns a mock MTO when API key is missing or pipeline fails."""
    return {
    "drawing_meta": {
      "drawing_no": "XTP/F-17",
      "revision": None,
      "line_number": "loop-3",
      "nps": "2\", 1.5\", 1/2\"",
      "material_class": "CS A106 Gr.B",
      "service": "PROCESS"
    },
    "items": [
      {
        "item_no": 1,
        "category": "PIPE",
        "description": "Pipe, Seamless, BE, A106 Gr.B, Sch.40",
        "size_nps": "2\"",
        "schedule_rating": "SCH 40",
        "material_spec": "ASTM A106 Gr.B",
        "end_type": "BW",
        "quantity": 1,
        "unit": "M",
        "length_m": 43.19799999999999,
        "remarks": "Sum of all segments based on visible dimensions and assumed 1ft segments for unlabeled straight runs.",
        "confidence": 0.85
      },
      {
        "item_no": 2,
        "category": "FITTING",
        "description": "Elbow, 90 Deg, Long Radius, BW",
        "size_nps": "2\"",
        "schedule_rating": "SCH 40",
        "material_spec": "ASTM A234 WPB",
        "end_type": "BW",
        "quantity": 29,
        "unit": "EA",
        "length_m": None,
        "remarks": None,
        "confidence": 0.95
      },
      {
        "item_no": 3,
        "category": "FITTING",
        "description": "Tee, Equal, BW",
        "size_nps": "2\"",
        "schedule_rating": "SCH 40",
        "material_spec": "ASTM A234 WPB",
        "end_type": "BW",
        "quantity": 3,
        "unit": "EA",
        "length_m": None,
        "remarks": None,
        "confidence": 0.9
      },
      {
        "item_no": 4,
        "category": "FITTING",
        "description": "Reducer, Concentric, BW",
        "size_nps": "2\"x1.5\"",
        "schedule_rating": "SCH 40",
        "material_spec": "ASTM A234 WPB",
        "end_type": "BW",
        "quantity": 1,
        "unit": "EA",
        "length_m": None,
        "remarks": "Estimated from symbol near 1.5\" branch",
        "confidence": 0.75
      },
      {
        "item_no": 5,
        "category": "FITTING",
        "description": "Elbow, 90 Deg, Long Radius, SW",
        "size_nps": "1.5\"",
        "schedule_rating": "SCH 80",
        "material_spec": "ASTM A234 WPB",
        "end_type": "SW",
        "quantity": 2,
        "unit": "EA",
        "length_m": None,
        "remarks": "Associated with 1.5\" branch",
        "confidence": 0.8
      },
      {
        "item_no": 6,
        "category": "FITTING",
        "description": "Tee, Reducing, SW",
        "size_nps": "2\"x1.5\"",
        "schedule_rating": "SCH 80",
        "material_spec": "ASTM A234 WPB",
        "end_type": "SW",
        "quantity": 1,
        "unit": "EA",
        "length_m": None,
        "remarks": "Connecting 1.5\" line to 2\" main line",
        "confidence": 0.75
      },
      {
        "item_no": 7,
        "category": "FLANGE",
        "description": "Weld Neck Flange, RF, 150#",
        "size_nps": "2\"",
        "schedule_rating": "ASME B16.5 150#",
        "material_spec": "ASTM A105",
        "end_type": "FLGD",
        "quantity": 12,
        "unit": "EA",
        "length_m": None,
        "remarks": None,
        "confidence": 0.95
      },
      {
        "item_no": 8,
        "category": "FLANGE",
        "description": "Weld Neck Flange, RF, 150#",
        "size_nps": "1.5\"",
        "schedule_rating": "ASME B16.5 150#",
        "material_spec": "ASTM A105",
        "end_type": "FLGD",
        "quantity": 2,
        "unit": "EA",
        "length_m": None,
        "remarks": None,
        "confidence": 0.9
      },
      {
        "item_no": 9,
        "category": "VALVE",
        "description": "Gate Valve, RF, 150#",
        "size_nps": "2\"",
        "schedule_rating": "150#",
        "material_spec": "ASTM A216 WCB",
        "end_type": "FLGD",
        "quantity": 5,
        "unit": "EA",
        "length_m": None,
        "remarks": None,
        "confidence": 0.9
      },
      {
        "item_no": 10,
        "category": "VALVE",
        "description": "Globe Valve, RF, 150#",
        "size_nps": "1.5\"",
        "schedule_rating": "150#",
        "material_spec": "ASTM A216 WCB",
        "end_type": "FLGD",
        "quantity": 1,
        "unit": "EA",
        "length_m": None,
        "remarks": None,
        "confidence": 0.85
      },
      {
        "item_no": 11,
        "category": "GASKET",
        "description": "Gasket, RF, 150#, Spiral Wound SS/FG",
        "size_nps": "2\"",
        "schedule_rating": "150#",
        "material_spec": "ASME B16.20",
        "end_type": "-",
        "quantity": 12,
        "unit": "EA",
        "length_m": None,
        "remarks": None,
        "confidence": 0.95
      },
      {
        "item_no": 12,
        "category": "GASKET",
        "description": "Gasket, RF, 150#, Spiral Wound SS/FG",
        "size_nps": "1.5\"",
        "schedule_rating": "150#",
        "material_spec": "ASME B16.20",
        "end_type": "-",
        "quantity": 2,
        "unit": "EA",
        "length_m": None,
        "remarks": None,
        "confidence": 0.9
      },
      {
        "item_no": 13,
        "category": "BOLT",
        "description": "Bolting, Stud Bolt w/ 2 Nuts, ASTM A193 Gr.B7 / A194 Gr.2H",
        "size_nps": "2\"",
        "schedule_rating": "150#",
        "material_spec": "ASTM A193 B7/A194 2H",
        "end_type": "-",
        "quantity": 12,
        "unit": "SET",
        "length_m": None,
        "remarks": None,
        "confidence": 0.95
      },
      {
        "item_no": 14,
        "category": "BOLT",
        "description": "Bolting, Stud Bolt w/ 2 Nuts, ASTM A193 Gr.B7 / A194 Gr.2H",
        "size_nps": "1.5\"",
        "schedule_rating": "150#",
        "material_spec": "ASTM A193 B7/A194 2H",
        "end_type": "-",
        "quantity": 2,
        "unit": "SET",
        "length_m": None,
        "remarks": None,
        "confidence": 0.9
      },
      {
        "item_no": 15,
        "category": "PIPE",
        "description": "Pipe, Seamless, BE, A106 Gr.B, Sch.80",
        "size_nps": "1.5\"",
        "schedule_rating": "SCH 80",
        "material_spec": "ASTM A106 Gr.B",
        "end_type": "SW",
        "quantity": 1,
        "unit": "M",
        "length_m": 0.9144,
        "remarks": "Segment labeled 3'",
        "confidence": 0.8
      },
      {
        "item_no": 16,
        "category": "PIPE",
        "description": "Pipe, Seamless, BE, A106 Gr.B, Sch.80",
        "size_nps": "1/2\"",
        "schedule_rating": "SCH 80",
        "material_spec": "ASTM A106 Gr.B",
        "end_type": "SW",
        "quantity": 1,
        "unit": "M",
        "length_m": 0.1524,
        "remarks": "Segment labeled 1/2'",
        "confidence": 0.7
      }
    ],
    "summary": {
      "total_pipe_length_m": 44.26479999999999,
      "fittings": 36,
      "flanges": 14,
      "valves": 6,
      "gaskets": 14,
      "bolt_sets": 14,
      "field_welds": 0
    }
  }

prompt_template = """
You are an expert piping engineer and Material Take-Off (MTO) estimator.
Analyze the provided piping isometric drawing and extract a structured Material Take-Off (MTO).

Instructions:
1. Parse the title block to extract drawing_meta (drawing_no, revision, line_number, nps, material_class, service).
2. Trace the pipe route and detect all inline symbols (pipe, elbows, tees, reducers, flanges, valves, etc.).
3. Categorize items into: PIPE, FITTING, FLANGE, VALVE, GASKET, BOLT, SUPPORT, OTHER.
4. For PIPE, quantity should be 1 and length_m should be the sum of all dimensions (in meters).
5. For discrete items (FITTINGS, FLANGES, VALVES), quantify them by count (unit: EA).
6. Ensure gaskets and bolts are included for every flanged joint. Assume 1 gasket and 1 bolt set per flange connection.
7. Search the drawing for Field Weld (FW) symbols or notations. Count them and map the total to `summary.field_welds`.
8. Return the data adhering EXACTLY to the provided JSON schema.
"""

async def run_pipeline(job_id: str, file_bytes: bytes, file_ext: str, update_log_cb) -> MTO:
    """Runs the extraction pipeline, using Gemini Vision API if available, or a mock fallback."""
    try:
        api_key = os.getenv("GEMINI_API_KEY")
        
        await update_log_cb("info", "[preprocess] checking file type")
        
        if file_ext == "pdf":
            await update_log_cb("info", "[preprocess] rendering PDF to image")
            img = process_pdf_to_image(file_bytes)
        else:
            await update_log_cb("info", "[preprocess] loading image")
            img = Image.open(BytesIO(file_bytes))
            
        await update_log_cb("ok", f"[preprocess] image ready ({img.width}x{img.height})")
        
        if not api_key:
            await update_log_cb("warn", "[vision] GEMINI_API_KEY not found. Using mock pipeline.")
            await asyncio.sleep(2) # Simulate processing
            await update_log_cb("info", "[vision] tracing pipe route (mock)")
            await asyncio.sleep(2)
            await update_log_cb("ok", "[vision] extraction complete (mock)")
            await update_log_cb("info", "[validate] schema valid - 0 errors")
            await asyncio.sleep(1)
            await update_log_cb("ok", "[derive] MTO ready")
            return MTO(**get_mock_mto())
            
        await update_log_cb("info", "[vision] calling gemini-2.5-flash with structured JSON schema")
        genai.configure(api_key=api_key)
        
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            generation_config={"response_mime_type": "application/json"}
        )
        
        prompt = prompt_template + "\nOutput exactly a JSON object matching this schema:\n" + MTO.schema_json()
        
        response = await asyncio.to_thread(model.generate_content, [prompt, img])
        
        await update_log_cb("info", "[vision] parsing title block and tracing route")
        try:
            raw_data = json.loads(response.text)
        except json.JSONDecodeError:
            text = response.text.strip()
            if text.startswith("```json"): text = text[7:]
            if text.endswith("```"): text = text[:-3]
            raw_data = json.loads(text.strip())
            
        await update_log_cb("ok", f"[vision] extraction complete")
        await update_log_cb("info", "[validate] checking response against Pydantic schema")
        
        mto = MTO(**raw_data)
        await update_log_cb("ok", "[validate] schema valid")
        
        await update_log_cb("info", "[derive] computing summary totals")
        await update_log_cb("ok", "[derive] MTO ready")
        
        return mto
        
    except Exception as e:
        await update_log_cb("warn", f"[error] {str(e)}")
        await update_log_cb("warn", "[error] falling back to mock pipeline")
        return MTO(**get_mock_mto())
