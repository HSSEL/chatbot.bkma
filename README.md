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


code sql (mysql)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password VARCHAR(255) NOT NULL
);
CREATE TABLE IF NOT EXISTS chats (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            user_id INT NOT NULL,
                            message TEXT NOT NULL,
                            response TEXT,
                            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                            FOREIGN KEY (user_id) REFERENCES users(id))