Chatbot Application
This project is a chatbot application built with Flask. The chatbot supports various use cases such as question answering (QA), summarization, chat, and web search. It integrates with the Ollama API to interact with different language models.

Features
Question Answering (QA): Ask questions based on a PDF document.
Summarization: Summarize the content of a PDF document.
Chat: Interact with a chatbot model.
Web Search: Retrieve content from a provided URL.
Prerequisites
Python 3.7 or later
pip (Python package installer)



Installation
Clone the repository:

"bash""
clone https://github.com/HSSEL/chatbot.bkma.git
cd chatbot.bkma


Create a virtual environment:

bash

python -m venv venv
Activate the virtual environment:

On Windows:

bash

venv\Scripts\activate


On macOS/Linux:

bash

source venv/bin/activate


Install the dependencies:

bash

pip install -r requirements.txt



Running the Application

Start the Flask application:

bash

python app.py


Access the application:

Open your web browser and go to:


http://127.0.0.1:5000