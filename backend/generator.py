import os
import json
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from google.oauth2 import service_account
from googleapiclient.discovery import build
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="CV Generator API")

# Update CORS to allow both local Next.js and future Vercel domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "*"], # Restrict "*" to Vercel URL later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SCOPES = ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/documents']
# Reads from Render env variable, falls back to local ID
TARGET_FOLDER_ID = os.getenv('DRIVE_FOLDER_ID', 'ACTUAL_FOLDER_ID_HERE')

def get_google_services():
    try:
        # 1. Check if we are in production (Render) reading from a JSON string
        google_creds_json = os.getenv('GOOGLE_CREDENTIALS_JSON')
        
        if google_creds_json:
            creds_dict = json.loads(google_creds_json)
            creds = service_account.Credentials.from_service_account_info(
                creds_dict, scopes=SCOPES)
        else:
            # 2. Fallback for local development
            creds = service_account.Credentials.from_service_account_file(
                'service-account.json', scopes=SCOPES)
            
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

    file_metadata = {
        'name': request.title,
        'mimeType': 'application/vnd.google-apps.document',
        'parents': [TARGET_FOLDER_ID]
    }
    
    try:
        doc = drive_service.files().create(body=file_metadata, fields='id').execute()
        document_id = doc.get('id')

        requests = [
            {
                'insertText': {
                    'location': {'index': 1},
                    'text': request.content
                }
            }
        ]

        docs_service.documents().batchUpdate(
            documentId=document_id, body={'requests': requests}).execute()

        document_url = f"https://docs.google.com/document/d/{document_id}/edit"
        return {"status": "success", "url": document_url}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document generation failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    # Important for Render: host must be 0.0.0.0 and port must read from env
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)