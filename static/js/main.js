// Gestion des événements pour le changement d'URL de base de l'API
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

// Fonction pour afficher l'indicateur de saisie
function showTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    typingIndicator.classList.remove('typing-hidden');
    typingIndicator.classList.add('typing');
}

// Fonction pour cacher l'indicateur de saisie
function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    typingIndicator.classList.remove('typing');
    typingIndicator.classList.add('typing-hiding');
    setTimeout(() => {
        typingIndicator.classList.add('typing-hidden');
        typingIndicator.classList.remove('typing-hiding');
    }, 400); // Durée de l'animation hide_popup
}

// Gestionnaire d'événements pour le bouton d'envoi
document.getElementById('send-button').addEventListener('click', function() {
    showTypingIndicator(); // Afficher l'indicateur de saisie

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
        hideTypingIndicator(); // Cacher l'indicateur de saisie après la réponse

        const messagesContainer = document.getElementById('messages');
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.textContent = data.response;
        messagesContainer.appendChild(messageElement);
    })
    .catch(error => {
        hideTypingIndicator(); // Cacher l'indicateur de saisie en cas d'erreur
        console.error('Error processing request:', error);
    });
});

// Gestionnaire d'événements pour le changement de fichier
document.getElementById('file-input').addEventListener('change', function() {
    const file = this.files[0];
    const fileLink = document.getElementById('file-link');
    const fileName = document.getElementById('file-name');
    const fileDisplay = document.getElementById('file-display');

    if (file) {
        fileLink.href = URL.createObjectURL(file);
        fileName.textContent = file.name;
        fileDisplay.style.display = 'block';
    } else {
        fileDisplay.style.display = 'none';
    }
});
