import psycopg2
import os

def get_connection():
    return psycopg2.connect(
        host="aws-1-eu-west-1.pooler.supabase.com",
        dbname="postgres",
        user="postgres.ztfvjvcknuhvxqythwsk",
        password=os.environ["DB_PASSWORD"],
        port=6543
    )

conn = get_connection()