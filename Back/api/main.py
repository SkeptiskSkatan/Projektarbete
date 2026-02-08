from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from database import conn 
from fastapi.middleware.cors import CORSMiddleware



app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],   
    allow_headers=["*"],
)

cursor = conn.cursor()

class User(BaseModel):
    username: str
    password: str

class Post(BaseModel):
    content: str
    user_id: int



def password_too_weak(losen):
    if len(losen) < 4:
        return True
    else:
        return False

def user_already_exists(namn):
    cursor.execute(
        "SELECT 1 FROM users WHERE username = %s",
        (namn,)
    )
    return cursor.fetchone() is not None





@app.post("/register")
def register(user: User):
    if not user.username or not user.password:
        raise HTTPException(
            status_code=400,
            detail="Username and password are required"
        )
    
    if password_too_weak(user.password):
        raise HTTPException(
            status_code=400,
            detail="Password is too weak"
    )

    if user_already_exists(user.username):
        raise HTTPException(
            status_code=409,
            detail="Username already exists"
    )

    cursor.execute(
        "INSERT INTO users (username, password) VALUES (%s, %s)",
        (user.username, user.password)
    )
    conn.commit()

    return {"message": "User created"}



@app.post("/login")
def login(user: User):
    cursor.execute(
        "SELECT id FROM users WHERE username=%s AND password=%s",
        (user.username, user.password)
    )
    result = cursor.fetchone()
    if result:
        return {"user_id": result[0]}
    return {"error": "Wrong credentials"}



@app.post("/posts")
def create_post(post: Post):
    cursor.execute(
        "INSERT INTO posts (content, user_id) VALUES (%s, %s)",
        (post.content, post.user_id)
    )
    conn.commit()
    return {"message": "Post created"}


@app.get("/posts")
def get_posts():
    cursor = conn.cursor()
    cursor.execute("""
        SELECT posts.content, users.username
        FROM posts
        JOIN users ON posts.user_id = users.id
        ORDER BY posts.created_at DESC
    """)

    rows = cursor.fetchall()

    return [
        {
            "content": row[0],
            "username": row[1]
        }
        for row in rows
    ]

