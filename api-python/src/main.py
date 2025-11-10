from fastapi import FastAPI
import psycopg2
import os

app = FastAPI()

@app.get("/")
def root():
    return {"message": "Python API is running!"}

def get_connection():
    return psycopg2.connect(
        host=os.getenv("PGHOST"),
        user=os.getenv("PGUSER"),
        password=os.getenv("PGPASSWORD"),
        database=os.getenv("PGDATABASE")
    )

@app.get("/db")
def read_db():
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM test;")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return {"rows": rows}
    except Exception as e:
        return {"error": str(e)}

@app.get("/db/add/{name}")
def add_name(name: str):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("INSERT INTO test (name) VALUES (%s);", (name,))
        conn.commit()
        cur.close()
        conn.close()
        return {"message": f"Successfully inserted: {name}"}
    except Exception as e:
        return {"error": str(e)}
