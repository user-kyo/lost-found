from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from model import BalikHubNLPModel
import uvicorn

app = FastAPI(title="BalikHub TF-IDF NLP Engine")
nlp_model = BalikHubNLPModel()

class ExtractRequest(BaseModel):
    description: str

class MatchRequest(BaseModel):
    lostDescription: str
    lostAttributes: Optional[Dict[str, Any]] = None
    foundItem: Dict[str, Any]

@app.on_event("startup")
def startup_event():
    # Initialize the TF-IDF vectorizer with mock data to build the global vocabulary
    mock_data = [
        {"id": "f1", "title": "Black Jansport Backpack", "description": "Found a black backpack near San Pablo City Public Library.", "itemType": "Backpack", "color": "Black", "brand": "Jansport", "status": "available"},
        {"id": "f2", "title": "Silver Apple iPhone", "description": "Silver iPhone with a clear case found at City Hall Plaza.", "itemType": "Phone", "color": "Silver", "brand": "Apple", "status": "available"},
        {"id": "f3", "title": "Blue Hydro Flask", "description": "Blue water bottle with stickers found near the public market.", "itemType": "Water Bottle", "color": "Blue", "brand": "Hydro Flask", "status": "available"},
        {"id": "f4", "title": "Brown Leather Wallet", "description": "Brown wallet found at the San Pablo public terminal.", "itemType": "Wallet", "color": "Brown", "brand": "Unknown", "status": "available"}
    ]
    
    available_records = [r for r in mock_data if r.get("status") == "available"]
    documents = [f"{r.get('title', '')} {r.get('description', '')} {r.get('itemType', '')} {r.get('color', '')} {r.get('brand', '')}" for r in available_records]
    ids = [r['id'] for r in available_records]
    nlp_model.train(documents, ids, available_records)
    print("Hybrid TF-IDF matcher trained on available mock posts.")

@app.post("/api/extract")
def extract_attributes(req: ExtractRequest):
    attributes = nlp_model.extract_attributes(req.description)
    return {
        "success": True,
        "source": "python_tfidf_pipeline",
        "data": attributes
    }

@app.post("/api/match-analyze")
def match_analyze(req: MatchRequest):
    # This endpoint receives the lost description and a SINGLE found item from the TypeScript server
    # to evaluate their similarity.
    lost_text = f"{req.lostDescription} " + (" ".join(str(v) for v in (req.lostAttributes or {}).values()))
    
    f_item = req.foundItem
    found_text = f"{f_item.get('title', '')} {f_item.get('itemType', '')} {f_item.get('color', '')} {f_item.get('brand', '')} {f_item.get('description', '')}"
    
    # Train a temporary local model just to compute cosine similarity between these two texts
    temp_model = BalikHubNLPModel()
    temp_model.train([found_text], [f_item.get('id', '1')], [f_item])
    matches = temp_model.predict_matches(lost_text)
    
    if matches:
        match = matches[0]
        score = match["similarityScore"]
    else:
        score = 0
        
    confidence = "High" if score >= int(nlp_model.confidence_threshold * 100) else "Low"
    
    return {
        "similarityScore": score,
        "confidence": confidence,
        "matchedAttributes": ["Public-description TF-IDF overlap"],
        "discrepancies": ["Private verification details are excluded from matching"],
        "aiSummary": "Hybrid TF-IDF ranked this public post against the owner description. LGU verification is mandatory."
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
