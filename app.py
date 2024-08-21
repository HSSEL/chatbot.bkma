from flask import Flask, request, jsonify, render_template
from ollama_api import OllamaAPI
from qa import perform_qa
from summarization import summarize_pdf
from web_search import search_web, search_url_content
from chat import handle_chat
import os
import requests

app = Flask(__name__, template_folder='templates')  # Corrected here

OLLAMA_BASE_URL = "http://ollama.diramino.com:11434"
ollama_api = OllamaAPI(OLLAMA_BASE_URL)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/models', methods=['GET'])
def get_models():
    try:
        models = ollama_api.list_models()
        return jsonify({'models': models})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/languages', methods=['GET'])
def languages():
    translations_dir = 'translations'
    try:
        languages = [f for f in os.listdir(translations_dir) if os.path.isdir(os.path.join(translations_dir, f))]
        return jsonify({'languages': languages})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/process', methods=['POST'])
def process_request():
    use_case = request.form.get('use_case')
    model = request.form.get('model')
    file = request.files.get('file')
    message = request.form.get('message')
    response = ""

    try:
        if use_case == "QA":
            if file and message:
                file_path = f"uploads/{file.filename}"
                file.save(file_path)
                response = perform_qa(file_path, message, model, OLLAMA_BASE_URL)
            else:
                response = "Please upload a PDF file and enter a question for QA."

        elif use_case == 'Chat':
            if message:  # Ensure message is provided
                response = handle_chat(model, message, OLLAMA_BASE_URL)
            else:
                response = "Please provide a message for chat."

        elif use_case == "Search":
            url = request.form.get('url')
            if url:
                content = search_url_content(url)
                response = f"Content from {url}:\n\n{content}"
            else:
                response = "Please enter a URL for web search."

        elif use_case == "Summarization":
            if file:
                file_path = f"uploads/{file.filename}"
                file.save(file_path)
                response = summarize_pdf(file_path, model, OLLAMA_BASE_URL)
            else:
                response = "Please upload a PDF file for summarization."

        else:
            response = "Invalid use case."

    except Exception as e:
        response = f"An error occurred: {str(e)}"

    return jsonify({'response': response})

def handle_chat(model, message, base_url):
    """
    Function to handle chat requests by sending a message to the selected model.
    
    Args:
        model (str): The model to use for generating the response.
        message (str): The message to send to the model.
        base_url (str): The base URL of the LLM API.

    Returns:
        str: The response from the model.
    """
    endpoint = f"{base_url}/v1/engines/{model}/completions"
    
    headers = {
        "Content-Type": "application/json",
    }
    
    data = {
        "prompt": message,
        "max_tokens": 150  # Adjust this as needed
    }
    
    try:
        response = requests.post(endpoint, json=data, headers=headers)
        response.raise_for_status()  # Raise an exception for HTTP errors
        result = response.json()
        return result.get("choices", [{}])[0].get("text", "").strip()
    except requests.RequestException as e:
        return f"An error occurred: {str(e)}"

if __name__ == "__main__":
    if not os.path.exists('uploads'):
        os.makedirs('uploads')
    app.run(debug=True)
