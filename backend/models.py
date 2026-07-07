from pydantic import BaseModel, Field
from typing import List, Optional

class DrawingMeta(BaseModel):
    drawing_no: Optional[str] = Field(default="", description="Drawing Number")
    revision: Optional[str] = Field(default="", description="Revision")
    line_number: Optional[str] = Field(default="", description="Line Number")
    nps: Optional[str] = Field(default="", description="Nominal Pipe Size (NPS)")
    material_class: Optional[str] = Field(default="", description="Material Class")
    service: Optional[str] = Field(default="", description="Service")

class MTOItem(BaseModel):
    item_no: int = Field(description="Sequential item or piece mark number")
    category: str = Field(description="Category of item: PIPE, FITTING, FLANGE, VALVE, GASKET, BOLT, SUPPORT, or OTHER")
    description: str = Field(description="Full engineering description")
    size_nps: str = Field(description="Nominal Pipe Size (inches), reducing items have two sizes e.g. 6\"x4\"")
    schedule_rating: str = Field(description="Wall thickness schedule or pressure class")
    material_spec: str = Field(description="ASTM/ASME material grade")
    end_type: str = Field(description="Connection type: BW, SW, THD, FLGD, or -")
    quantity: int = Field(description="Count for discrete items (1 for PIPE usually, since length_m defines quantity)")
    unit: str = Field(description="M for pipe, EA for discrete, SET for bolts")
    length_m: Optional[float] = Field(default=None, description="Total cut length, pipes only")
    remarks: Optional[str] = Field(default="", description="Additional remarks")
    confidence: Optional[float] = Field(default=0.9, description="Confidence score of detection (0.0 to 1.0)")

class MTOSummary(BaseModel):
    total_pipe_length_m: float = Field(default=0.0)
    fittings: int = Field(default=0)
    flanges: int = Field(default=0)
    valves: int = Field(default=0)
    gaskets: int = Field(default=0)
    bolt_sets: int = Field(default=0)
    field_welds: int = Field(default=0)

class MTO(BaseModel):
    drawing_meta: DrawingMeta
    items: List[MTOItem]
    summary: MTOSummary
