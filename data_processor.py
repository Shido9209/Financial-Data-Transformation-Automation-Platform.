import pandas as pd
import numpy as np
import json
from typing import Dict, Any, List, Tuple

class DataProcessor:
    def __init__(self, mapping_schema: Dict[str, str] = None):
        """
        Initialize the processor with an optional mapping schema.
        mapping_schema: { "Source Column": "Standard Field" }
        """
        self.mapping_schema = mapping_schema or {}
        self.summary = {
            "duplicates_removed": 0,
            "dates_converted": 0
        }

    def load_data(self, file_path: str, nrows: int = 10) -> pd.DataFrame:
        """
        Task 1: The "Raw Mirror" Data Preview
        Loads data exactly as it appears in storage. If the Excel file contains 
        a serial date (like 45417), it will load and display 45417.
        """
        ext = file_path.split('.')[-1].lower()
        
        if ext in ['csv', 'txt']:
            df = pd.read_csv(file_path, nrows=nrows)
        elif ext in ['xls', 'xlsx']:
            df = pd.read_excel(file_path, nrows=nrows)
        elif ext == 'json':
            df = pd.read_json(file_path)
            if nrows:
                df = df.head(nrows)
        else:
            raise ValueError(f"Unsupported file extension: {ext}")
            
        return df

    def fix_excel_dates(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Task 3: The "Date Fixer" Module
        Converts serial numbers (e.g., 45417) to ISO dates (2024-05-05) 
        using the '1899-12-30' origin.
        """
        date_keywords = ['date', 'dt', 'time', 'period']
        
        for col in df.columns:
            is_date_col = any(k in col.lower() for k in date_keywords)
            is_mapped_date = self.mapping_schema.get(col) == 'Date'
            
            if is_date_col or is_mapped_date:
                # Check if the column contains numeric values (Excel serials)
                numeric_mask = pd.to_numeric(df[col], errors='coerce').notna()
                
                if numeric_mask.any():
                    # Extract the numeric values
                    numeric_vals = pd.to_numeric(df.loc[numeric_mask, col])
                    
                    # Filter for reasonable Excel serial dates (roughly 1982 to 2064)
                    valid_serials = numeric_vals[(numeric_vals > 30000) & (numeric_vals < 60000)]
                    
                    if not valid_serials.empty:
                        # Convert Excel serial to datetime using 1899-12-30 origin
                        converted_dates = pd.to_datetime(valid_serials, unit='D', origin='1899-12-30')
                        
                        # Format to YYYY-MM-DD string
                        df.loc[valid_serials.index, col] = converted_dates.dt.strftime('%Y-%m-%d')
                        self.summary["dates_converted"] += len(valid_serials)
                        
        return df

    def remove_duplicates(self, df: pd.DataFrame) -> pd.DataFrame:
        """Removes exact duplicate rows."""
        initial_rows = len(df)
        df = df.drop_duplicates()
        self.summary["duplicates_removed"] = initial_rows - len(df)
        return df

    def run_pipeline(self, df: pd.DataFrame, active_features: Dict[str, bool]) -> Tuple[pd.DataFrame, List[Dict]]:
        """
        Task 2: Modular "Selective Feature" Processing
        Checks which features are "True" and executes them in order.
        """
        # Reset summary for this run
        self.summary = {k: 0 for k in self.summary}
        
        # Keep a copy of the original data for comparison
        df_before = df.copy()
        
        # Map feature flags to class methods
        feature_map = {
            "fix_excel_dates": self.fix_excel_dates,
            "remove_duplicates": self.remove_duplicates
        }
        
        # Execute only selected features in order
        for feature, is_active in active_features.items():
            if is_active and feature in feature_map:
                df = feature_map[feature](df)
                
        # Task 4: The Comparison Output
        comparison_results = []
        
        for idx in df_before.index:
            row_result = {}
            
            if idx not in df.index:
                # Row was removed (e.g., by remove_duplicates)
                for col in df_before.columns:
                    orig_val = df_before.loc[idx, col]
                    row_result[col] = {
                        "original": None if pd.isna(orig_val) else orig_val,
                        "transformed": None,
                        "status": "Removed"
                    }
            else:
                # Row exists, compare values
                for col in df_before.columns:
                    orig_val = df_before.loc[idx, col]
                    new_val = df.loc[idx, col]
                    
                    orig_is_na = pd.isna(orig_val)
                    new_is_na = pd.isna(new_val)
                    
                    if orig_is_na and new_is_na:
                        status = "Unchanged"
                    elif str(orig_val) != str(new_val):
                        status = "Fixed"
                    else:
                        status = "Unchanged"
                        
                    row_result[col] = {
                        "original": None if orig_is_na else orig_val,
                        "transformed": None if new_is_na else new_val,
                        "status": status
                    }
            comparison_results.append(row_result)
            
        return df, comparison_results

# ==========================================
# Example Usage & JSON Response Generation
# ==========================================
def generate_sample_response():
    # 1. Create a raw sample DataFrame with Excel serial dates and a duplicate row
    data = {
        'Txn_Date': [45417, '10/25/2023', 45417],
        'Description': ['STRIPE PAYOUT', 'AWS WEB SERVICES', 'STRIPE PAYOUT'],
        'Amount': [1240.50, -45.00, 1240.50]
    }
    df_raw = pd.DataFrame(data)
    
    # 2. Initialize Processor with mapping
    mapping = {
        'Txn_Date': 'Date'
    }
    processor = DataProcessor(mapping_schema=mapping)
    
    # 3. Define Active Features
    active_features = {
        "fix_excel_dates": True,
        "remove_duplicates": True
    }
    
    # 4. Run Pipeline
    df_after, comparison = processor.run_pipeline(df_raw.copy(), active_features)
    
    # 5. Construct the final JSON
    response = {
        "status": "success",
        "summary": processor.summary,
        "processed_results": comparison
    }
    
    return json.dumps(response, indent=2)

if __name__ == "__main__":
    print(generate_sample_response())
