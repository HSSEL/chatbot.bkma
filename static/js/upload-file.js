document.getElementById('file-input').addEventListener('change', function() {
  const file = this.files[0];
  if (file) {
      // Code pour traiter le fichier (par exemple, envoyer au serveur)
      console.log('File selected:', file.name);
  }
});