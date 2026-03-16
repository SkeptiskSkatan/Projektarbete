import psycopg2
import os

def get_connection():
    return psycopg2.connect(
        host="db.ztfvjvcknuhvxqythwsk.supabase.co",
        dbname="postgres",
        user="postgres",
        password=os.environ["DB_PASSWORD"],
        port=6543
    )

conn = get_connection()