from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from database import get_connection
from typing import Optional
import bcrypt
import psycopg2
import base64
import os
from fastapi.middleware.cors import CORSMiddleware
 
 
app = FastAPI()
 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://projektarbete.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
 
 
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
    image_data: Optional[str] = None
 
class CommentCreate(BaseModel):
    content: str
    user_id: int
    post_id: int
 
class FollowRequest(BaseModel):
    follower_id: int
    following_id: int
 
class LikeRequest(BaseModel):
    user_id: int
    post_id: int
 
class ProfilePicture(BaseModel):
    user_id: int
    image_data: str
 
 
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
 
 
@app.post("/register")
def register(user: UserRegister):
    if not user.username or not user.email or not user.password:
        raise HTTPException(status_code=400, detail="Username, email and password are required")
 
    if password_too_weak(user.password):
        raise HTTPException(status_code=400, detail="Password is too weak")
 
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT 1 FROM users WHERE username = %s OR email = %s",
            (user.username, user.email)
        )
        if cursor.fetchone():
            raise HTTPException(status_code=409, detail="Username or email already exists")
 
        password_hash = hash_password(user.password)
        cursor.execute(
            "INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s)",
            (user.username, user.email, password_hash)
        )
        conn.commit()
    finally:
        cursor.close()
        conn.close()
 
    return {"message": "User created"}
 
 
@app.post("/login")
def login(user: UserLogin):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT id, password_hash FROM users WHERE username = %s",
            (user.username,)
        )
        result = cursor.fetchone()
    finally:
        cursor.close()
        conn.close()
 
    if not result:
        raise HTTPException(status_code=401, detail="Wrong credentials")
 
    user_id, password_hash = result
 
    if not verify_password(user.password, password_hash):
        raise HTTPException(status_code=401, detail="Wrong credentials")
 
    return {"user_id": user_id}
 
 
@app.post("/posts")
def create_post(post: Post):
    binary_data = None
    if post.image_data:
        if "," in post.image_data:
            header, encoded = post.image_data.split(",", 1)
        else:
            encoded = post.image_data
        binary_data = base64.b64decode(encoded)
 
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO posts (content, user_id, image_data) VALUES (%s, %s, %s)",
            (post.content, post.user_id, binary_data)
        )
        conn.commit()
    finally:
        cursor.close()
        conn.close()
 
    return {"message": "Post created"}
 
 
@app.get("/posts")
def get_posts(limit: int = 10, skip: int = 0):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT posts.id, posts.content, users.username, posts.user_id, posts.created_at, posts.image_data
            FROM posts
            JOIN users ON posts.user_id = users.id
            ORDER BY posts.created_at DESC
            LIMIT %s OFFSET %s
        """, (limit, skip))
        rows = cursor.fetchall()
    finally:
        cursor.close()
        conn.close()
 
    posts = []
    for r in rows:
        img_base64 = None
        if r[5]:
            img_base64 = f"data:image/jpeg;base64,{base64.b64encode(r[5]).decode('utf-8')}"
        posts.append({
            "id": r[0],
            "content": r[1],
            "username": r[2],
            "user_id": r[3],
            "created_at": r[4],
            "image_data": img_base64
        })
    return posts
 
 
@app.get("/users/{user_id}")
def get_user_profile(user_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT id, username, email, created_at FROM users WHERE id = %s",
            (user_id,)
        )
        row = cursor.fetchone()
    finally:
        cursor.close()
        conn.close()
 
    if row is None:
        raise HTTPException(status_code=404, detail="User not found")
 
    id, username, email, created_at = row
    return {"id": id, "username": username, "email": email, "created_at": created_at}
 
 
@app.get("/users/{user_id}/posts")
def get_user_posts(user_id: int, limit: int = 10, skip: int = 0):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT posts.id, posts.content, users.username, posts.user_id, posts.created_at, posts.image_data
            FROM posts
            JOIN users ON posts.user_id = users.id
            WHERE posts.user_id = %s
            ORDER BY posts.created_at DESC
            LIMIT %s OFFSET %s
        """, (user_id, limit, skip))
        rows = cursor.fetchall()
    finally:
        cursor.close()
        conn.close()
 
    posts = []
    for r in rows:
        img_base64 = None
        if r[5]:
            img_base64 = f"data:image/jpeg;base64,{base64.b64encode(r[5]).decode('utf-8')}"
        posts.append({
            "id": r[0],
            "content": r[1],
            "username": r[2],
            "user_id": r[3],
            "created_at": r[4],
            "image_data": img_base64
        })
    return posts
 
 
@app.post("/comments")
def create_comment(comment: CommentCreate):
    if not comment.content:
        raise HTTPException(status_code=400, detail="Content is required")
 
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT 1 FROM users WHERE id = %s", (comment.user_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="User not found")
 
        cursor.execute("SELECT 1 FROM posts WHERE id = %s", (comment.post_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Post not found")
 
        cursor.execute(
            "INSERT INTO comments (content, user_id, post_id) VALUES (%s, %s, %s)",
            (comment.content, comment.user_id, comment.post_id)
        )
        conn.commit()
    finally:
        cursor.close()
        conn.close()
 
    return {"message": "Comment created"}
 
 
@app.get("/posts/{post_id}/comments")
def get_comments(post_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT comments.content, comments.created_at, users.username
            FROM comments
            JOIN users ON comments.user_id = users.id
            WHERE comments.post_id = %s
            ORDER BY comments.created_at DESC
        """, (post_id,))
        rows = cursor.fetchall()
    finally:
        cursor.close()
        conn.close()
 
    return [{"content": row[0], "created_at": row[1], "username": row[2]} for row in rows]
 
 
@app.post("/follow")
def follow_user(req: FollowRequest):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO followers (follower_id, following_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
            (req.follower_id, req.following_id)
        )
        conn.commit()
    finally:
        cursor.close()
        conn.close()
 
    return {"message": "Followed"}
 
 
@app.post("/unfollow")
def unfollow_user(req: FollowRequest):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "DELETE FROM followers WHERE follower_id = %s AND following_id = %s",
            (req.follower_id, req.following_id)
        )
        conn.commit()
    finally:
        cursor.close()
        conn.close()
 
    return {"message": "Unfollowed"}
 
 
@app.get("/is_following/{follower_id}/{following_id}")
def is_following(follower_id: int, following_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT 1 FROM followers WHERE follower_id = %s AND following_id = %s",
            (follower_id, following_id)
        )
        result = cursor.fetchone()
    finally:
        cursor.close()
        conn.close()
 
    return {"is_following": result is not None}
 
 
@app.get("/users/{user_id}/follow_stats")
def get_follow_stats(user_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT COUNT(*) FROM followers WHERE following_id = %s", (user_id,))
        followers_count = cursor.fetchone()[0]
 
        cursor.execute("SELECT COUNT(*) FROM followers WHERE follower_id = %s", (user_id,))
        following_count = cursor.fetchone()[0]
    finally:
        cursor.close()
        conn.close()
 
    return {"followers_count": followers_count, "following_count": following_count}
 
 
@app.post("/like")
def like_post(req: LikeRequest):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO likes (user_id, post_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
            (req.user_id, req.post_id)
        )
        conn.commit()
    finally:
        cursor.close()
        conn.close()
 
    return {"message": "Liked"}
 
 
@app.post("/unlike")
def unlike_post(req: LikeRequest):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "DELETE FROM likes WHERE user_id = %s AND post_id = %s",
            (req.user_id, req.post_id)
        )
        conn.commit()
    finally:
        cursor.close()
        conn.close()
 
    return {"message": "Unliked"}
 
 
@app.get("/posts/{post_id}/likes/{user_id}")
def get_post_likes(post_id: int, user_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT COUNT(*) FROM likes WHERE post_id = %s", (post_id,))
        count = cursor.fetchone()[0]
 
        cursor.execute(
            "SELECT 1 FROM likes WHERE post_id = %s AND user_id = %s",
            (post_id, user_id)
        )
        liked = cursor.fetchone() is not None
    finally:
        cursor.close()
        conn.close()
 
    return {"likes_count": count, "liked": liked}
 
 
@app.get("/users/{user_id}/followers")
def get_followers(user_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT users.id, users.username
            FROM followers
            JOIN users ON followers.follower_id = users.id
            WHERE followers.following_id = %s
        """, (user_id,))
        rows = cursor.fetchall()
    finally:
        cursor.close()
        conn.close()
 
    return [{"id": r[0], "username": r[1]} for r in rows]
 
 
@app.get("/users/{user_id}/following")
def get_following(user_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT users.id, users.username
            FROM followers
            JOIN users ON followers.following_id = users.id
            WHERE followers.follower_id = %s
        """, (user_id,))
        rows = cursor.fetchall()
    finally:
        cursor.close()
        conn.close()
 
    return [{"id": r[0], "username": r[1]} for r in rows]
 
 
@app.get("/posts/following")
def get_following_posts(user_id: int, limit: int = 10, skip: int = 0):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT posts.id, posts.content, users.username, posts.user_id, posts.created_at, posts.image_data
            FROM posts
            JOIN users ON posts.user_id = users.id
            WHERE posts.user_id IN (
                SELECT following_id FROM followers WHERE follower_id = %s
            )
            AND posts.user_id != %s
            ORDER BY posts.created_at DESC
            LIMIT %s OFFSET %s
        """, (user_id, user_id, limit, skip))
        rows = cursor.fetchall()
    finally:
        cursor.close()
        conn.close()
 
    return [{
        "id": r[0],
        "content": r[1],
        "username": r[2],
        "user_id": r[3],
        "created_at": r[4],
        "image_data": f"data:image/jpeg;base64,{base64.b64encode(r[5]).decode('utf-8')}" if r[5] else None
    } for r in rows]
 
 
@app.delete("/posts/{post_id}/{user_id}")
def delete_post(post_id: int, user_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT user_id FROM posts WHERE id = %s", (post_id,))
        result = cursor.fetchone()
 
        if not result:
            raise HTTPException(status_code=404, detail="Post not found")
 
        if result[0] != user_id:
            raise HTTPException(status_code=403, detail="Not allowed")
 
        cursor.execute("DELETE FROM likes WHERE post_id = %s", (post_id,))
        cursor.execute("DELETE FROM comments WHERE post_id = %s", (post_id,))
        cursor.execute("DELETE FROM posts WHERE id = %s", (post_id,))
        conn.commit()
    finally:
        cursor.close()
        conn.close()
 
    return {"message": "Post deleted"}
 
 
@app.post("/users/{user_id}/profile_picture")
def upload_profile_picture(user_id: int, body: ProfilePicture):
    if "," in body.image_data:
        header, encoded = body.image_data.split(",", 1)
    else:
        encoded = body.image_data
    binary_data = base64.b64decode(encoded)
 
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "UPDATE users SET profile_picture = %s WHERE id = %s",
            (binary_data, user_id)
        )
        conn.commit()
    finally:
        cursor.close()
        conn.close()
 
    return {"message": "Profile picture updated"}
 
 
@app.get("/users/{user_id}/profile_picture")
def get_profile_picture(user_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT profile_picture FROM users WHERE id = %s", (user_id,))
        row = cursor.fetchone()
    finally:
        cursor.close()
        conn.close()
 
    if not row or not row[0]:
        return {"image_data": None}
 
    img_base64 = f"data:image/jpeg;base64,{base64.b64encode(row[0]).decode('utf-8')}"
    return {"image_data": img_base64}