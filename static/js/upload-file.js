document.getElementById('file-input').addEventListener('change', function(event) {
    const file = event.target.files[0];

    if (file && file.type === 'application/pdf') {
        const fileDisplay = document.getElementById('file-display');
        const fileName = document.getElementById('file-name');

        // Create an object URL for the PDF file
        fileName.textContent = file.name;
        fileName.href = URL.createObjectURL(file);
        fileDisplay.style.display = 'flex';
    }
});

document.getElementById('send-button').addEventListener('click', function() {
    const useCase = document.getElementById('use-case-selector').value;
    const model = document.getElementById('model-selector').value;
    const fileInput = document.getElementById('file-input');
    const message = document.getElementById('message-input').value;

    const formData = new FormData();
    formData.append('use_case', useCase);
    formData.append('model', model);
    formData.append('message', message);

    if (fileInput.files.length > 0) {
        formData.append('file', fileInput.files[0]);
    }

    fetch('/process', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        const result = document.getElementById('result');
        result.textContent = data.response;
    })
    .catch(error => console.error('Error:', error));
});

document.getElementById('upload-button').addEventListener('click', function() {
    const fileInput = document.getElementById('file-input');
    const file = fileInput.files[0];

    if (file) {
        const formData = new FormData();
        formData.append('file', file);

        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            const fileNameDisplay = document.getElementById('file-name-display');
            fileNameDisplay.textContent = data.file_name;
        })
        .catch(error => console.error('Error:', error));
    }
});
