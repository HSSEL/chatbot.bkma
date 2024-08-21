import requests

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
   
    model = "gemma:2b"  
    endpoint = f"{base_url}/v1/engines/{model}/completions"

    
    headers = {
        "Content-Type": "application/json",
    }
    
    data = {
        "prompt": message,
        "max_tokens": 150,  # Adjust this as needed
        "temperature": 0.7,  # Adjust this for more or less randomness
        "top_p": 1.0,  # Adjust this for more or less diversity
        "frequency_penalty": 0.0,  # Adjust this to reduce repetition
        "presence_penalty": 0.0  # Adjust this to encourage new topics
    }
    
    try:
        response = requests.post(endpoint, json=data, headers=headers)
        response.raise_for_status()  # Raise an exception for HTTP errors
        result = response.json()
        return result.get("choices", [{}])[0].get("text", "").strip()
    except requests.RequestException as e:
        return f"An error occurred: {str(e)}"
