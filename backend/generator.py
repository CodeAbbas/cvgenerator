# main.py
import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from google.oauth2 import service_account
from googleapiclient.discovery import build
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(title="CV Generator API")
# CORS middleware for local testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Next.js local port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load environment variables or configuration
SERVICE_ACCOUNT_FILE = 'service-account.json'
SCOPES = ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/documents']
TARGET_FOLDER_ID = '1xKHQiJDwNibLcq1DZjjMvJKEsQ525bzP'

def get_google_services():
    try:
        creds = service_account.Credentials.from_service_account_file(
            SERVICE_ACCOUNT_FILE, scopes=SCOPES)
        drive_service = build('drive', 'v3', credentials=creds)
        docs_service = build('docs', 'v1', credentials=creds)
        return drive_service, docs_service
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Authentication failed: {str(e)}")

class CVRequest(BaseModel):
    title: str
    content: str

@app.post("/generate-cv")
async def generate_cv(request: CVRequest):
    drive_service, docs_service = get_google_services()

    # 1. Create the blank document inside the specific Google Drive folder
    file_metadata = {
        'name': request.title,
        'mimeType': 'application/vnd.google-apps.document',
        'parents': [TARGET_FOLDER_ID]
    }
    
    try:
        doc = drive_service.files().create(body=file_metadata, fields='id').execute()
        document_id = doc.get('id')

        # 2. Advanced Document Formatting Requests
        # We insert the text, then apply formatting based on text patterns
        requests = [
            {
                'insertText': {
                    'location': {'index': 1},
                    'text': request.content
                }
            },
            # Example: Make the entire document Arial font
            {
                'updateTextStyle': {
                    'range': {
                        'startIndex': 1,
                        'endIndex': len(request.content)
                    },
                    'textStyle': {
                        'weightedFontFamily': {'fontFamily': 'Arial'}
                    },
                    'fields': 'weightedFontFamily'
                }
            }
        ]

        # Execute formatting updates
        docs_service.documents().batchUpdate(
            documentId=document_id, body={'requests': requests}).execute()

        document_url = f"https://docs.google.com/document/d/{document_id}/edit"
        return {"status": "success", "document_id": document_id, "url": document_url}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document generation failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)