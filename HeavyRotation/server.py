from flask import Flask, request

app = Flask(__name__)

@app.route("/callback")
def callback():
    # Get the authorization code from the URL query parameters
    code = request.args.get('code')
    return f"Authorization Code: {code}"

if __name__ == "__main__":
    app.run(host='localhost', port=8888)
