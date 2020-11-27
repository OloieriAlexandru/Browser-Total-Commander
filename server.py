from flask import Flask, render_template

PORT = 3333

app = Flask(__name__,
            template_folder='public')


@app.route("/")
def index():
    return render_template("index.html")


if __name__ == "__main__":
    app.run(port=PORT)
