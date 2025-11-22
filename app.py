from flask import Flask, render_template, request, redirect, session, jsonify
import sqlite3
import random
import time
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = "supersecretkey"

# Temporary OTP store
otp_store = {}  # {email: {"otp":123456, "expires":time}}

# ------------------ DB INIT ---------------------
def init_db():
    conn = sqlite3.connect("users.db")
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT UNIQUE,
            password TEXT
        )
    """)
    conn.commit()
    conn.close()

init_db()

# ------------------ UI PAGE ---------------------
@app.route("/")
def home():
    return render_template("auth.html")


# ------------------ SIGNUP ----------------------
@app.route("/signup", methods=["POST"])
def signup():
    data = request.json
    name = data["name"]
    email = data["email"].lower()
    password = data["password"]

    conn = sqlite3.connect("users.db")
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE email=?", (email,))
    if cur.fetchone():
        conn.close()
        return jsonify({"status": "exists"})

    hashed = generate_password_hash(password)

    cur.execute("INSERT INTO users(name,email,password) VALUES(?,?,?)",
                (name, email, hashed))
    conn.commit()
    conn.close()

    return jsonify({"status": "ok"})


# ------------------ LOGIN -----------------------
@app.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data["email"].lower()
    password = data["password"]

    conn = sqlite3.connect("users.db")
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE email=?", (email,))
    user = cur.fetchone()
    conn.close()

    if not user or not check_password_hash(user[3], password):
        return jsonify({"status": "invalid"})

    session["user"] = user[1]
    return jsonify({"status": "ok"})


# ------------------ SEND OTP ---------------------
@app.route("/send-otp", methods=["POST"])
def send_otp():
    data = request.json
    email = data["email"].lower()

    conn = sqlite3.connect("users.db")
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE email=?", (email,))
    user = cur.fetchone()
    conn.close()

    if not user:
        return jsonify({"status": "not_found"})

    otp = random.randint(100000, 999999)
    otp_store[email] = {"otp": otp, "expires": time.time() + 180}

    print("DEBUG OTP:", otp)

    return jsonify({"status": "ok", "otp": otp})


# ------------------ RESET PASSWORD ----------------
@app.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.json
    email = data["email"]
    otp_input = data["otp"]
    new_pass = data["password"]

    if email not in otp_store:
        return jsonify({"status": "no_otp"})

    d = otp_store[email]

    if time.time() > d["expires"]:
        del otp_store[email]
        return jsonify({"status": "expired"})

    if str(d["otp"]) != otp_input:
        return jsonify({"status": "wrong"})

    hashed = generate_password_hash(new_pass)

    conn = sqlite3.connect("users.db")
    cur = conn.cursor()
    cur.execute("UPDATE users SET password=? WHERE email=?", (hashed, email))
    conn.commit()
    conn.close()

    del otp_store[email]
    return jsonify({"status": "ok"})


# ------------------ DASHBOARD ---------------------
@app.route("/dashboard")
def dashboard():
    if "user" not in session:
        return redirect("/")
    return f"<h1>Welcome {session['user']}</h1><br><a href='/'>Logout</a>"


if __name__ == "__main__":
    app.run(debug=True)
