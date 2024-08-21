document.getElementById('ollama-base-url').addEventListener('change', function() {
  const baseUrl = this.value;
  fetch(`/models?base_url=${baseUrl}`)
      .then(response => response.json())
      .then(data => {
          const modelSelector = document.getElementById('model-selector');
          modelSelector.innerHTML = '';
          data.models.forEach(model => {
              const option = document.createElement('option');
              option.value = model;
              option.textContent = model;
              modelSelector.appendChild(option);
          });
      })
      .catch(error => console.error('Error fetching models:', error));
});
