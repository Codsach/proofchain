from fastapi import FastAPI, Header, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="ProofChain AI Service", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

INTERNAL_AI_KEY = os.getenv("INTERNAL_AI_KEY", "")


def verify_internal_key(x_internal_key: str = Header(...)):
    if not INTERNAL_AI_KEY:
        raise HTTPException(status_code=500, detail="Internal key not configured")
    if x_internal_key != INTERNAL_AI_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")


@app.get("/health")
def health():
    return {"status": "ok", "service": "proofchain-ai", "version": "2.0.0"}


from routes.analyse import router as analyse_router
app.include_router(analyse_router, dependencies=[Depends(verify_internal_key)])