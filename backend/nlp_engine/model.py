import os
import re
import math
import joblib
import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from sklearn.feature_extraction.text import TfidfVectorizer
from scipy.sparse import hstack

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
        self.stop_words.update({
            "ang", "ng", "sa", "na", "ko", "ako", "ay", "mga", "po", "opo",
            "yung", "yun", "ito", "iyon", "ni", "kay", "nasa", "mo",
            "lost", "found", "missing", "nawala", "nakita"
        })

        self.lexicon = {
            "pitaka": "wallet", "susi": "key", "payong": "umbrella",
            "relo": "watch", "orasan": "watch", "salamin": "eyeglasses",
            "sapatos": "shoes", "tsinelas": "slippers", "selpon": "phone",
            "cellphone": "phone", "cp": "phone", "itim": "black",
            "puti": "white", "pula": "red", "asul": "blue", "berde": "green",
            "dilaw": "yellow", "kayumanggi": "brown", "abo": "gray",
            "balat": "leather", "plastik": "plastic", "tela": "cloth",
            "blk": "black", "wht": "white"
        }
        self.keep_mixed_alphanumeric_tokens = True

        self.word_vectorizer = TfidfVectorizer(
            analyzer="word",
            ngram_range=(1, 2),
            min_df=1,
            max_df=1.0,
            norm='l2',
            stop_words=None
        )
        self.char_vectorizer = TfidfVectorizer(
            analyzer="char_wb",
            ngram_range=(3, 5),
            min_df=1,
            norm='l2',
            stop_words=None
        )
        
        self.database_vectors = None
        self.database_ids = []
        self.database_records = []
        self.is_trained = False
        
        self.alpha = 0.6
        self.confidence_threshold = 0.35

    def _edit_distance_at_most_one(self, left: str, right: str) -> bool:
        if abs(len(left) - len(right)) > 1:
            return False
        if left == right:
            return True
        previous = list(range(len(right) + 1))
        for i, left_char in enumerate(left, start=1):
            current = [i]
            row_min = i
            for j, right_char in enumerate(right, start=1):
                insertions = previous[j] + 1
                deletions = current[j - 1] + 1
                substitutions = previous[j - 1] + (left_char != right_char)
                value = min(insertions, deletions, substitutions)
                current.append(value)
                row_min = min(row_min, value)
            if row_min > 1:
                return False
            previous = current
        return previous[-1] <= 1

    def _normalize_lexicon_token(self, token: str) -> str:
        if token in self.lexicon:
            return self.lexicon[token]
        for surface, canonical in self.lexicon.items():
            if len(surface) >= 5 and self._edit_distance_at_most_one(token, surface):
                return canonical
        return token

    def preprocess_text(self, text: str) -> str:
        """
        Language-agnostic preprocessing for English, Filipino, and Taglish.
        """
        if not isinstance(text, str):
            return ""

        text = text.lower()
        text = re.sub(r'(.)\1{2,}', r'\1\1', text)
        text = re.sub(r'[\U00010000-\U0010ffff]', ' ', text)
        text = re.sub(r'[^a-z0-9\s]', ' ', text)
        tokens = text.split()

        clean_tokens = []
        for token in tokens:
            if token.isdigit():
                continue
            if (
                not self.keep_mixed_alphanumeric_tokens
                and any(ch.isalpha() for ch in token)
                and any(ch.isdigit() for ch in token)
            ):
                continue
            token = self._normalize_lexicon_token(token)
            if token in self.stop_words:
                continue
            clean_tokens.append(self.lemmatizer.lemmatize(token))

        return " ".join(clean_tokens)

    def train(self, documents: list, ids: list, records: list) -> bool:
        """
        Builds the global TF-IDF vocabulary and transforms the database into a compressed sparse row matrix.
        """
        cleaned_docs = [self.preprocess_text(doc) for doc in documents]
        
        if not cleaned_docs:
            return False
            
        word_vectors = self.word_vectorizer.fit_transform(cleaned_docs)
        char_vectors = self.char_vectorizer.fit_transform(cleaned_docs)
        self.database_vectors = hstack([
            math.sqrt(self.alpha) * word_vectors,
            math.sqrt(1 - self.alpha) * char_vectors
        ]).tocsr()
        self.database_ids = ids
        self.database_records = records
        self.is_trained = True
        return True

    def save_model(self, filepath: str) -> bool:
        """
        Persists the fitted TF-IDF vectorizers, sparse matrices, vocabulary, and records to disk.
        """
        if not self.is_trained:
            return False
        try:
            parent_dir = os.path.dirname(os.path.abspath(filepath))
            if parent_dir:
                os.makedirs(parent_dir, exist_ok=True)
            bundle = {
                "word_vectorizer": self.word_vectorizer,
                "char_vectorizer": self.char_vectorizer,
                "database_vectors": self.database_vectors,
                "database_ids": self.database_ids,
                "database_records": self.database_records,
                "is_trained": self.is_trained,
                "alpha": self.alpha,
                "confidence_threshold": self.confidence_threshold,
                "keep_mixed_alphanumeric_tokens": self.keep_mixed_alphanumeric_tokens
            }
            joblib.dump(bundle, filepath)
            return True
        except Exception as e:
            print(f"Failed to persist TF-IDF model to {filepath}: {e}")
            return False

    def load_model(self, filepath: str) -> bool:
        """
        Loads the persisted TF-IDF vectorizers, vocabulary, and matrices from disk.
        """
        if not os.path.exists(filepath):
            return False
        try:
            bundle = joblib.load(filepath)
            self.word_vectorizer = bundle.get("word_vectorizer", self.word_vectorizer)
            self.char_vectorizer = bundle.get("char_vectorizer", self.char_vectorizer)
            self.database_vectors = bundle.get("database_vectors", self.database_vectors)
            self.database_ids = bundle.get("database_ids", [])
            self.database_records = bundle.get("database_records", [])
            self.is_trained = bundle.get("is_trained", False)
            self.alpha = bundle.get("alpha", self.alpha)
            self.confidence_threshold = bundle.get("confidence_threshold", self.confidence_threshold)
            self.keep_mixed_alphanumeric_tokens = bundle.get("keep_mixed_alphanumeric_tokens", self.keep_mixed_alphanumeric_tokens)
            return self.is_trained
        except Exception as e:
            print(f"Failed to load TF-IDF model from {filepath}: {e}")
            return False

    def retrain(self, documents: list, ids: list, records: list, filepath: str = None) -> bool:
        """
        Retrains the model on new documents and optionally persists to disk.
        """
        success = self.train(documents, ids, records)
        if success and filepath:
            self.save_model(filepath)
        return success


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
        locations = ["library", "city hall", "plaza", "terminal", "lgu office", "market", "barangay"]
        found_loc = next((l.capitalize() for l in locations if l in text_lower), "San Pablo City")
        
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
        Ranks available posts with one sparse dot product over the hybrid TF-IDF matrix.
        """
        if not self.is_trained or self.database_vectors is None:
            return []

        cleaned_query = self.preprocess_text(query)
        query_word = self.word_vectorizer.transform([cleaned_query])
        query_char = self.char_vectorizer.transform([cleaned_query])
        query_vector = hstack([
            math.sqrt(self.alpha) * query_word,
            math.sqrt(1 - self.alpha) * query_char
        ]).tocsr()

        similarities = (query_vector @ self.database_vectors.T).toarray().flatten()
        
        results = []
        # Rank the candidates
        for idx in similarities.argsort()[::-1]:
            score = similarities[idx]
            
            # Filter weak candidates
            if score >= self.confidence_threshold: 
                results.append({
                    "id": self.database_ids[idx],
                    "item": self.database_records[idx],
                    "similarityScore": int(score * 100),
                    "confidence": "High"
                })
                
            if len(results) >= 5: # Retain only Top-5 matches as per paper specs
                break
                
        return results
