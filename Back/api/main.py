from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from database import conn 
import bcrypt
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


class UserRegister(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class Post(BaseModel):
    content: str
    user_id: int

def hash_password(password: str) -> str:
    return bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")

def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(
        password.encode("utf-8"),
        password_hash.encode("utf-8")
    )

def password_too_weak(password):
    return len(password) < 4

def user_or_email_exists(username, email):
    cursor.execute(
        "SELECT 1 FROM users WHERE username = %s OR email = %s",
        (username, email)
    )
    return cursor.fetchone() is not None




@app.post("/register")
def register(user: UserRegister):
    if not user.username or not user.email or not user.password:
        raise HTTPException(
            status_code=400,
            detail="Username, email and password are required"
        )

    if password_too_weak(user.password):
        raise HTTPException(
            status_code=400,
            detail="Password is too weak"
        )

    if user_or_email_exists(user.username, user.email):
        raise HTTPException(
            status_code=409,
            detail="Username or email already exists"
        )

    password_hash = hash_password(user.password)

    cursor.execute(
        """
        INSERT INTO users (username, email, password_hash)
        VALUES (%s, %s, %s)
        """,
        (user.username, user.email, password_hash)
    )
    conn.commit()

    return {"message": "User created"}




@app.post("/login")
def login(user: UserLogin):
    cursor.execute(
        "SELECT id, password_hash FROM users WHERE username = %s",
        (user.username,)
    )
    result = cursor.fetchone()

    if not result:
        raise HTTPException(status_code=401, detail="Wrong credentials")

    user_id, password_hash = result

    if not verify_password(user.password, password_hash):
        raise HTTPException(status_code=401, detail="Wrong credentials")

    return {"user_id": user_id}




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



@app.get("/users/{user_id}")
def get_user_profile(user_id: int):
    cursor.execute(
        """
        SELECT id, username, email, created_at
        FROM users
        WHERE id = %s
        """,
        (user_id,)
    )
    user = cursor.fetchone()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": user[0],
        "username": user[1],
        "email": user[2],
        "created_at": user[3]
    }


@app.get("/users/{user_id}/posts")
def get_user_posts(user_id: int):
    cursor.execute(
        """
        SELECT content, created_at
        FROM posts
        WHERE user_id = %s
        ORDER BY created_at DESC
        """,
        (user_id,)
    )

    rows = cursor.fetchall()

    return [
        {
            "content": row[0],
            "created_at": row[1]
        }
        for row in rows
    ]

