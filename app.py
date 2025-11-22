from flask import Flask, render_template, request, redirect
from database import get_db

app = Flask(__name__)

@app.route("/")
def dashboard():
    conn = get_db()
    products = conn.execute("SELECT * FROM products").fetchall()
    return render_template("dashboard.html", products=products)

@app.route("/add-product", methods=["GET", "POST"])
def add_product():
    if request.method == "POST":
        name = request.form["name"]
        sku = request.form["sku"]
        category = request.form["category"]
        stock = request.form["stock"]

        conn = get_db()
        conn.execute("INSERT INTO products(name, sku, category, stock) VALUES(?,?,?,?)",
                     (name, sku, category, stock))
        conn.commit()

        return redirect("/")

    return render_template("add_product.html")

@app.route("/update-stock/<int:id>", methods=["POST"])
def update_stock(id):
    qty = int(request.form["qty"])

    conn = get_db()
    conn.execute("UPDATE products SET stock = stock + ? WHERE id = ?", (qty, id))
    conn.commit()

    return redirect("/")
    
if __name__ == "__main__":
    app.run(debug=True)
