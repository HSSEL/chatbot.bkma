document.getElementById('send-button').addEventListener('click', function() {
  const useCase = document.getElementById('use-case-selector').value;
  const model = document.getElementById('model-selector').value;
  const fileInput = document.getElementById('file-input');
  const messageInput = document.getElementById('message-input').value;
  const formData = new FormData();

  formData.append('use_case', useCase);
  formData.append('model', model);
  if (fileInput.files.length > 0) {
      formData.append('file', fileInput.files[0]);
  }
  formData.append('message', messageInput);

  fetch('/process', {
      method: 'POST',
      body: formData
  })
  .then(response => response.json())
  .then(data => {
      const messagesContainer = document.getElementById('messages');
      const messageElement = document.createElement('div');
      messageElement.classList.add('message');
      messageElement.textContent = data.response;
      messagesContainer.appendChild(messageElement);
  })
  .catch(error => console.error('Error processing request:', error));
});
