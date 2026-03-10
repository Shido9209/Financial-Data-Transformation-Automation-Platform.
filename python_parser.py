import pandas as pd
import chardet
import json
import os
from typing import Dict, Any, List, Optional

class UniversalFinancialParser:
    def __init__(self, mapping_schema_path: str = None):
        self.mapping_schema = {}
        if mapping_schema_path and os.path.exists(mapping_schema_path):
            with open(mapping_schema_path, 'r') as f:
                self.mapping_schema = json.load(f)

    def detect_encoding(self, file_path: str) -> str:
        """Detect the encoding of a file."""
        with open(file_path, 'rb') as f:
            raw_data = f.read(10000)
            result = chardet.detect(raw_data)
            return result['encoding'] or 'utf-8'

    def detect_delimiter(self, file_path: str, encoding: str) -> str:
        """Detect the delimiter of a CSV file."""
        import csv
        with open(file_path, 'r', encoding=encoding) as f:
            sample = f.read(2048)
            try:
                sniffer = csv.Sniffer()
                dialect = sniffer.sniff(sample)
                return dialect.delimiter
            except csv.Error:
                return ',' # Default to comma

    def parse_file(self, file_path: str, sheet_name: Optional[str] = None, nrows: int = None) -> pd.DataFrame:
        """
        Parse a financial document (CSV, Excel, JSON) into a Pandas DataFrame.
        Handles various delimiters and encodings.
        """
        ext = file_path.split('.')[-1].lower()
        
        if ext in ['csv', 'txt']:
            encoding = self.detect_encoding(file_path)
            delimiter = self.detect_delimiter(file_path, encoding)
            df = pd.read_csv(file_path, encoding=encoding, sep=delimiter, nrows=nrows)
        elif ext in ['xls', 'xlsx']:
            # If sheet_name is None, it reads the first sheet by default
            df = pd.read_excel(file_path, sheet_name=sheet_name, nrows=nrows)
        elif ext == 'json':
            df = pd.read_json(file_path)
            if nrows:
                df = df.head(nrows)
        else:
            raise ValueError(f"Unsupported file extension: {ext}")
            
        return df

    def get_sheet_names(self, file_path: str) -> List[str]:
        """Get all sheet names from an Excel file."""
        ext = file_path.split('.')[-1].lower()
        if ext in ['xls', 'xlsx']:
            xl = pd.ExcelFile(file_path)
            return xl.sheet_names
        return []

    def normalize_dates(self, df: pd.DataFrame, date_columns: List[str]) -> pd.DataFrame:
        """Convert various date formats to ISO-8601 (YYYY-MM-DD)."""
        for col in date_columns:
            if col in df.columns:
                df[col] = pd.to_datetime(df[col], errors='coerce').dt.strftime('%Y-%m-%d')
        return df

    def normalize_currency(self, df: pd.DataFrame, currency_columns: List[str]) -> pd.DataFrame:
        """Handle various number separators (e.g., 1.000,00 vs 1,000.00)."""
        for col in currency_columns:
            if col in df.columns:
                # Convert to string first
                s = df[col].astype(str)
                # Remove currency symbols and spaces
                s = s.str.replace(r'[^\d\.,\-]', '', regex=True)
                
                # Logic to handle European vs US formats
                # If we see a pattern like d.ddd,dd
                def parse_number(val):
                    if pd.isna(val) or val == '': return val
                    # Count dots and commas
                    dots = val.count('.')
                    commas = val.count(',')
                    
                    if commas == 1 and dots >= 0:
                        comma_pos = val.find(',')
                        dot_pos = val.rfind('.')
                        if comma_pos > dot_pos:
                            # European format: 1.000,00 -> 1000.00
                            val = val.replace('.', '').replace(',', '.')
                        else:
                            # US format: 1,000.00 -> 1000.00
                            val = val.replace(',', '')
                    elif commas > 1 and dots <= 1:
                        # US format: 1,000,000.00
                        val = val.replace(',', '')
                    elif dots > 1 and commas <= 1:
                        # European format: 1.000.000,00
                        val = val.replace('.', '').replace(',', '.')
                    return float(val) if val else None

                df[col] = s.apply(parse_number)
        return df

    def apply_mapping(self, df: pd.DataFrame, file_type: str) -> pd.DataFrame:
        """Apply saved JSON mapping schema to rename columns."""
        if file_type in self.mapping_schema:
            mapping = self.mapping_schema[file_type].get('column_mapping', {})
            # mapping is { "Destination Field": "Source Column" }
            # We need { "Source Column": "Destination Field" } for pandas rename
            reverse_mapping = {v: k for k, v in mapping.items()}
            df = df.rename(columns=reverse_mapping)
        return df

# Example usage:
# parser = UniversalFinancialParser('mapping_schema.json')
# df = parser.parse_file('statement.csv', nrows=10)
# df = parser.apply_mapping(df, 'bank_statement_v1')
# df = parser.normalize_dates(df, ['Date'])
# df = parser.normalize_currency(df, ['Debit', 'Credit', 'Balance'])
