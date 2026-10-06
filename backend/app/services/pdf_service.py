import io
import re
from typing import Tuple, Optional
import pypdf


class PDFService:
    @staticmethod
    def validate_pdf_structure(file_bytes: bytes) -> Tuple[bool, Optional[str]]:
        """
        Validates that the provided byte content is a legitimate, non-corrupted PDF file.
        Checks both PDF signature and header structure via pypdf.
        """
        if not file_bytes or len(file_bytes) < 32:
            return False, "El archivo está vacío o es demasiado pequeño para ser un PDF válido."

        # Check for standard PDF magic header (%PDF-) in the first 1024 bytes
        header_sample = file_bytes[:1024]
        if b"%PDF-" not in header_sample:
            return False, "El archivo no contiene una cabecera de formato PDF válida (%PDF-)."

        # Validate with pypdf parser
        try:
            stream = io.BytesIO(file_bytes)
            reader = pypdf.PdfReader(stream)
            if reader.is_encrypted:
                try:
                    # Attempt to decrypt with empty password if standard protection
                    decrypted = reader.decrypt("")
                    if decrypted == 0:
                        return False, "El archivo PDF está protegido por contraseña y no se puede procesar."
                except Exception:
                    return False, "El archivo PDF está cifrado o protegido."

            if len(reader.pages) == 0:
                return False, "El archivo PDF no contiene ninguna página."

            # Attempt accessing the first page to confirm structure is readable
            _ = reader.pages[0]
            return True, None
        except Exception as e:
            return False, f"Estructura de PDF corrupta o no reconocible: {str(e)}"

    @staticmethod
    def extract_and_clean_text(file_bytes: bytes) -> Tuple[Optional[str], Optional[str]]:
        """
        Extracts text from all pages of the PDF and applies basic normalization.
        Returns a tuple: (cleaned_text, error_message).
        If no extractable text is found (e.g., scanned image PDF), returns (None, error_message).
        """
        try:
            stream = io.BytesIO(file_bytes)
            reader = pypdf.PdfReader(stream)
            raw_pages = []

            for page_idx, page in enumerate(reader.pages):
                try:
                    page_text = page.extract_text()
                    if page_text and page_text.strip():
                        raw_pages.append(page_text.strip())
                except Exception:
                    # Skip problematic page but continue extracting others
                    continue

            if not raw_pages:
                return (
                    None,
                    "No fue posible extraer texto del PDF. El documento podría ser un PDF escaneado o no contener texto seleccionable."
                )

            # Combine page texts
            combined_raw = "\n\n".join(raw_pages)

            # Text cleaning:
            # 1. Normalize line breaks (\r\n or \r -> \n)
            cleaned = combined_raw.replace("\r\n", "\n").replace("\r", "\n")

            # 2. Remove problematic non-printable control characters, keeping valid tabs and newlines
            cleaned = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", cleaned)

            # 3. Clean each line: collapse excessive horizontal spaces/tabs into a single space
            lines = [re.sub(r"[^\S\n]+", " ", line).strip() for line in cleaned.split("\n")]

            # 4. Reconstruct and collapse 3 or more consecutive newlines into 2
            reconstructed = "\n".join(lines)
            reconstructed = re.sub(r"\n{3,}", "\n\n", reconstructed).strip()

            if not reconstructed:
                return (
                    None,
                    "No fue posible extraer texto del PDF. El documento podría ser un PDF escaneado o no contener texto seleccionable."
                )

            return reconstructed, None

        except Exception as e:
            return None, f"Error durante la extracción de texto del PDF: {str(e)}"


pdf_service = PDFService()
