import json
import os
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Dict

app = FastAPI(title="CDA Midterm Quiz System")

# Ensure static directory exists
if not os.path.exists("static"):
    os.makedirs("static")


# Load questions from JSON
def load_questions():
    with open("questions.json", "r", encoding="utf-8") as f:
        return json.load(f)


QUESTIONS = load_questions()


@app.get("/api/questions")
async def get_questions(chapter: int = None):
    if chapter:
        filtered = [q for q in QUESTIONS if q["chapter"] == chapter]
        return filtered
    return QUESTIONS


@app.get("/api/chapters")
async def get_chapters():
    chapters = sorted(list(set(q["chapter"] for q in QUESTIONS)))
    return chapters


# Serve static files
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
async def read_index():
    return FileResponse("static/index.html")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
