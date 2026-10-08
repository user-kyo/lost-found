import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re

# Download required NLTK data for lemmatization and stop-words
import os
try:
    nltk.data.find('corpora/stopwords')
    nltk.data.find('corpora/wordnet')
except LookupError:
    print("Downloading NLTK dependencies...")
    nltk.download('stopwords', quiet=True)
    nltk.download('wordnet', quiet=True)

class BalikHubNLPModel:
    def __init__(self):
        self.lemmatizer = WordNetLemmatizer()
        self.stop_words = set(stopwords.words('english'))
        # Add domain-specific stop words to filter out noise
        self.stop_words.update(["lost", "found", "missing"])
        
        # TF-IDF Vectorizer matching the paper's specifications:
        # - unigrams and bigrams
        # - L2 normalization
        # - minimum and maximum document frequency thresholds
        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            min_df=1,
            max_df=0.95,
            norm='l2',
            stop_words=None # Stop words handled in preprocess
        )
        
        self.database_vectors = None
        self.database_ids = []
        self.database_records = []
        self.is_trained = False
        
        # Empirically derived cosine similarity threshold (as per paper Chapter 3/4)
        self.confidence_threshold = 0.45 

    def preprocess_text(self, text: str) -> str:
        """
        Executes the exact NLP preprocessing pipeline: 
        case folding -> punctuation removal -> tokenization -> stop-word removal -> lemmatization.
        """
        if not isinstance(text, str):
            return ""
        
        # 1. Case folding
        text = text.lower()
        
        # 2. Punctuation removal
        text = re.sub(r'[^\w\s]', '', text)
        
        # 3. Tokenization
        tokens = text.split()
        
        # 4. Stop-word removal and 5. Lemmatization
        clean_tokens = [
            self.lemmatizer.lemmatize(word) 
            for word in tokens 
            if word not in self.stop_words
        ]
        
        return " ".join(clean_tokens)

    def train(self, documents: list, ids: list, records: list) -> bool:
        """
        Builds the global TF-IDF vocabulary and transforms the database into a compressed sparse row matrix.
        """
        cleaned_docs = [self.preprocess_text(doc) for doc in documents]
        
        if not cleaned_docs:
            return False
            
        self.database_vectors = self.vectorizer.fit_transform(cleaned_docs)
        self.database_ids = ids
        self.database_records = records
        self.is_trained = True
        return True

    def extract_attributes(self, text: str) -> dict:
        """
        Extracts key characteristics to present in the UI.
        Since TF-IDF doesn't extract discrete fields, this uses rule-based logic to mimic feature extraction.
        """
        text_lower = text.lower()
        
        # Characteristic extractors
        colors = ["black", "blue", "red", "silver", "gray", "white", "green", "yellow", "pink", "purple"]
        found_colors = [c.capitalize() for c in colors if re.search(rf'\b{c}\b', text_lower)]
        
        item_types = ["backpack", "bag", "wallet", "phone", "laptop", "keys", "keychain", "jacket", "umbrella", "earbuds", "bottle", "flask"]
        found_type = next((t.capitalize() for t in item_types if t in text_lower), "Unspecified Item")
        
        brands = ["jansport", "apple", "samsung", "nike", "hydro flask", "casio", "yeti", "stanley"]
        found_brand = next((b.capitalize() for b in brands if b in text_lower), "Unbranded / Unknown")
        
        # Location hints
        locations = ["library", "cafeteria", "gym", "hallway", "lab", "classroom"]
        found_loc = next((l.capitalize() for l in locations if l in text_lower), "Unknown campus area")
        
        return {
            "itemType": found_type,
            "color": ", ".join(found_colors) if found_colors else "Not specified",
            "brand": found_brand,
            "locationHint": found_loc,
            "accessories": "None mentioned",
            "distinguishingFeatures": text[:50] + ("..." if len(text) > 50 else ""),
            "tags": [found_type] + found_colors + ([found_brand] if found_brand != "Unbranded / Unknown" else [])
        }

    def predict_matches(self, query: str) -> list:
        """
        Executes the highly-optimized O(N x k) Cosine Similarity calculation across the sparse matrix.
        """
        if not self.is_trained or self.database_vectors is None:
            return []

        cleaned_query = self.preprocess_text(query)
        query_vector = self.vectorizer.transform([cleaned_query])
        
        # Compute dot product against L2-normalized CSR matrix
        similarities = cosine_similarity(query_vector, self.database_vectors).flatten()
        
        results = []
        # Rank the candidates
        for idx in similarities.argsort()[::-1]:
            score = similarities[idx]
            
            # Filter weak candidates
            if score > 0.0: 
                results.append({
                    "id": self.database_ids[idx],
                    "record": self.database_records[idx],
                    "similarityScore": int(score * 100),
                    "confidence": "High" if score >= self.confidence_threshold else "Low"
                })
                
            if len(results) >= 5: # Retain only Top-5 matches as per paper specs
                break
                
        return results
