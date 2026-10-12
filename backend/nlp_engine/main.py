import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from model import BalikHubNLPModel
import uvicorn

nlp_model = BalikHubNLPModel()

MODEL_PERSIST_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "tfidf_model.joblib"))

class ExtractRequest(BaseModel):
    description: str

class MatchRequest(BaseModel):
    lostDescription: str
    lostAttributes: Optional[Dict[str, Any]] = None
    foundItem: Dict[str, Any]

class SearchRequest(BaseModel):
    query: str
    availablePosts: List[Dict[str, Any]]

class RetrainRequest(BaseModel):
    posts: List[Dict[str, Any]]
    persist: Optional[bool] = True

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Attempt to load persisted TF-IDF model from disk first
    if nlp_model.load_model(MODEL_PERSIST_PATH):
        print(f"Persisted TF-IDF model loaded from {MODEL_PERSIST_PATH} ({len(nlp_model.database_ids)} indexed items).")
    else:
        # Baseline mock items for initial TF-IDF vocabulary initialization
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
        saved = nlp_model.save_model(MODEL_PERSIST_PATH)
        print(f"Hybrid TF-IDF matcher trained on baseline mock posts and persisted: {saved} ({MODEL_PERSIST_PATH})")
    yield

app = FastAPI(title="BalikHub TF-IDF NLP Engine", lifespan=lifespan)

    # Baseline mock items for initial TF-IDF vocabulary initialization
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
    saved = nlp_model.save_model(MODEL_PERSIST_PATH)
    print(f"Hybrid TF-IDF matcher trained on baseline mock posts and persisted: {saved} ({MODEL_PERSIST_PATH})")

@app.get("/api/model-status")
def get_model_status():
    return {
        "isTrained": nlp_model.is_trained,
        "indexedCount": len(nlp_model.database_ids) if nlp_model.database_ids else 0,
        "persistedFileExists": os.path.exists(MODEL_PERSIST_PATH),
        "modelPath": MODEL_PERSIST_PATH,
        "alpha": nlp_model.alpha,
        "confidenceThreshold": nlp_model.confidence_threshold
    }

@app.post("/api/retrain")
def retrain_model(req: RetrainRequest):
    if not req.posts:
        return {"success": False, "error": "No posts provided for retraining"}

    available_records = [r for r in req.posts if r.get("status") in ("available", "published", None)]
    if not available_records:
        available_records = req.posts

    documents = [f"{r.get('title', r.get('publicDescription', ''))} {r.get('description', '')} {r.get('category', r.get('itemType', ''))} {r.get('color', '')} {r.get('brand', '')} {r.get('areaFound', '')}" for r in available_records]
    ids = [r.get('id', str(i)) for i, r in enumerate(available_records)]

    success = nlp_model.train(documents, ids, available_records)
    if success and req.persist:
        nlp_model.save_model(MODEL_PERSIST_PATH)

    return {
        "success": success,
        "indexedCount": len(ids),
        "persisted": req.persist and success,
        "modelPath": MODEL_PERSIST_PATH
    }

@app.post("/api/extract")
def extract_attributes(req: ExtractRequest):
    attributes = nlp_model.extract_attributes(req.description)
    return {
        "success": True,
        "source": "python_tfidf_pipeline",
        "data": attributes
    }

@app.post("/api/search")
def search_posts(req: SearchRequest):
    if not req.availablePosts:
        return []

    documents = [f"{r.get('category', '')} {r.get('color', '')} {r.get('publicDescription', '')} {r.get('areaFound', '')}" for r in req.availablePosts]
    ids = [r.get('id') for r in req.availablePosts]
    
    # Train and persist model with available posts to keep index synchronized
    try:
        nlp_model.train(documents, ids, req.availablePosts)
        nlp_model.save_model(MODEL_PERSIST_PATH)
        matches = nlp_model.predict_matches(req.query)
        return matches
    except Exception as e:
        print(f"TF-IDF matching failed: {e}")
        return req.availablePosts

@app.post("/api/match-analyze")
def match_analyze(req: MatchRequest):
    lost_text = f"{req.lostDescription} " + (" ".join(str(v) for v in (req.lostAttributes or {}).values()))
    
    f_item = req.foundItem
    found_text = f"{f_item.get('title', f_item.get('category', ''))} {f_item.get('itemType', f_item.get('category', ''))} {f_item.get('color', '')} {f_item.get('brand', '')} {f_item.get('publicDescription', f_item.get('description', ''))}"
    
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
        "aiSummary": "Hybrid TF-IDF ranked this public post against the owner description. Guidance Office verification is mandatory."
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

