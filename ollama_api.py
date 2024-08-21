import requests

class OllamaAPI:
    def __init__(self, base_url):
        self.base_url = base_url

    def list_models(self):
        response = requests.get(f"{self.base_url}/api/tags")
        if response.status_code == 200:
            return [model['name'] for model in response.json()['models']]
        else:
            return []

    def query_model(self, model, prompt):
        payload = {"model": model, "prompt": prompt}
        response = requests.post(f"{self.base_url}/api/generate", json=payload)
        if response.status_code == 200:
            return response.json()["response"]
        else:
            return "Error querying the model"
