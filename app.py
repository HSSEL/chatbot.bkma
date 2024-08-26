from flask import Flask, request, jsonify, render_template, redirect, session, g
from flask_bcrypt import Bcrypt
from ollama_api import OllamaAPI
from qa import perform_qa
from summarization import summarize_pdf
from web_search import search_web, search_url_content
from chat import handle_chat
import requests
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from dotenv import load_dotenv
from datetime import datetime
import os
import mysql.connector
from mysql.connector import Error
from config import Config

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__, template_folder='templates')
OLLAMA_BASE_URL = "http://ollama.diramino.com:11434"
ollama_api = OllamaAPI(OLLAMA_BASE_URL)
app.config.from_object(Config)

# Initialize extensions
bcrypt = Bcrypt(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'
login_manager.login_message_category = 'info'


@app.route('/models', methods=['GET'])
def get_models():
    try:
        models = ollama_api.list_models()
        return jsonify({'models': models})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def get_db_connection():
    try:
        connection = mysql.connector.connect(
            host='localhost',         # Replace with your DB server address
            database='bkma',          # Replace with your database name
            user='root',              # Replace with your DB username
            password=''               # Replace with your DB password
        )
        if connection.is_connected():
            return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
    return None

@app.teardown_appcontext
def close_connection(exception):
    if hasattr(g, 'db_connection') and g.db_connection.is_connected():
        g.db_connection.close()

# Define the User class
class User(UserMixin):
    def __init__(self, id, email, password):
        self.id = id
        self.email = email
        self.password = password

    def get_id(self):
        return self.id

# User loader function
@login_manager.user_loader
def load_user(user_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT * FROM users WHERE id = %s', (user_id,))
    user_data = cursor.fetchone()
    conn.close()
    if user_data:
        return User(id=user_data['id'], email=user_data['email'], password=user_data['password'])
    return None

# Routes
@app.route('/')
def home():
    if current_user.is_authenticated:
        return redirect('/index')
    return redirect('/login')

@app.route('/index')
@login_required
def index():
    return render_template('index.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT * FROM users WHERE email = %s', (email,))
        user = cursor.fetchone()
        conn.close()
        
        print(f"User from DB: {user}")  # Debug: display the user data from DB
        
        if user and bcrypt.check_password_hash(user['password'], password):
            user_obj = User(id=user['id'], email=user['email'], password=user['password'])
            login_user(user_obj)
            session['email'] = user['email']  # Stocke l'email dans la session
            return redirect('/')
        else:
            return render_template('login.html', message='Invalid credentials')
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        # Retrieve form data
        username = request.form.get('username')
        email = request.form.get('email')
        phone = request.form.get('phone')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm-password')

        # Validation checks
        if not username or not email or not phone or not password or not confirm_password:
            return render_template('register.html', message='Please fill out all fields.')

        if password != confirm_password:
            return render_template('register.html', message='Passwords do not match.')

        if len(password) < 6:
            return render_template('register.html', message='Password must be at least 6 characters.')

        # Hash the password
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

        # Insert into the database
        try:
            conn = get_db_connection()
            cursor = conn.cursor()

            # Insert the new user into the users table
            cursor.execute('INSERT INTO users (username, email, phone, password) VALUES (%s, %s, %s, %s)', 
                           (username, email, phone, hashed_password))
            conn.commit()
            conn.close()

            # Redirect to the login page after successful registration
            return redirect('/login')

        except Error as e:
            print(f"Error during registration: {e}")
            return render_template('register.html', message='An error occurred during registration.')

    # Render the registration form
    return render_template('register.html')

@app.route('/logout')
@login_required
def logout():
    print(f"User {current_user.email} is logging out.")  # Debug: affiche l'utilisateur qui se déconnecte
    logout_user()
    session.pop('email', None)
    return redirect('/login')



@app.route('/profile')
@login_required
def profile():
    if 'email' not in session:
        return redirect(url_for('login'))
    
    email = session['email']
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT username FROM users WHERE email = %s', (email,))
    user = cursor.fetchone()
    conn.close()
    
    if user:
        return render_template('profile.html', email=email)  # Pass the email to the template
    else:
        return redirect(url_for('login'))

@app.route('/chat-history')
@login_required
def chat_history():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT * FROM chats WHERE user_id = %s ORDER BY timestamp DESC', (current_user.id,))
    chats = cursor.fetchall()
    conn.close()
    return render_template('chat_history.html', chats=chats)


@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'})

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'})

    if file:
        file_path = f"uploads/{file.filename}"
        file.save(file_path)
        return jsonify({'message': 'File uploaded successfully'})
    
    return jsonify({'error': 'An error occurred'})

@app.route('/process', methods=['POST'])
@login_required
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
            if message:
                response = handle_chat(model, message, OLLAMA_BASE_URL)
                
                conn = get_db_connection()
                cursor = conn.cursor()
                cursor.execute('INSERT INTO chats (user_id, message, response, timestamp) VALUES (%s, %s, %s, %s)',
                               (current_user.id, message, response, datetime.utcnow()))
                conn.commit()
                conn.close()
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

@app.route('/backend-api/v2/conversations', methods=['GET', 'POST'])
def conversations():
    if request.method == 'GET':
        # Handle the GET request for conversations
        # Example: Return a list of conversations
        return jsonify({"conversations": []}), 200

    if request.method == 'POST':
        # Handle the POST request to create a new conversation
        data = request.json
        # Process the data and create a new conversation
        return jsonify({"message": "Conversation created successfully!"}), 201

if __name__ == "__main__":
    if not os.path.exists('uploads'):
        os.makedirs('uploads')

    conn = get_db_connection()
    if conn:
        cursor = conn.cursor()
        cursor.execute('''CREATE TABLE IF NOT EXISTS users (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            email VARCHAR(255) UNIQUE NOT NULL,
                            password VARCHAR(255) NOT NULL
                        )''')
        cursor.execute('''CREATE TABLE IF NOT EXISTS chats (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            user_id INT NOT NULL,
                            message TEXT NOT NULL,
                            response TEXT,
                            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                            FOREIGN KEY (user_id) REFERENCES users(id)
                        )''')
        conn.close()
        
    app.run(debug=True)
