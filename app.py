from flask import Flask, render_template, request
import os

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload():
    if 'audio' not in request.files:
        return 'No audio file found', 400
    
    file = request.files['audio']

    if file.filename == '':
        return 'No selected file', 400

    if file:
        if not os.path.exists('uploads'):
            os.makedirs('uploads')
        
        filepath = os.path.join('uploads', 'recording.webm')
        file.save(filepath)
        
        # Here you would typically process the audio file (e.g., with your NLP model)
        # and save results to the database.
        
        return 'Audio uploaded successfully', 200

if __name__ == '__main__':
    app.run(debug=True)
