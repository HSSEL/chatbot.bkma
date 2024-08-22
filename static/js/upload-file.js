document.getElementById('file-input').addEventListener('change', function(event) {
    const file = event.target.files[0];

    if (file && file.type === 'application/pdf') {
        const fileDisplay = document.getElementById('file-display');
        const fileName = document.getElementById('file-name');

        // Créer une URL d'objet pour le fichier PDF
        fileName.textContent = file.name;
        fileName.href = URL.createObjectURL(file);
        fileDisplay.style.display = 'flex';
    }
});

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
