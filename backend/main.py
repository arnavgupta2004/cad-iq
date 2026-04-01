from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.rules import router as rules_router
from routes.upload import router as upload_router
from routes.validate import router as validate_router
from services.rag_engine import initialize_knowledge_base


@asynccontextmanager
async def lifespan(_: FastAPI):
    initialize_knowledge_base()
    yield


app = FastAPI(title="CAD-IQ Backend", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router)
app.include_router(rules_router)
app.include_router(validate_router)


@app.get("/")
def read_root():
    return {"message": "Hello from CAD-IQ backend"}
