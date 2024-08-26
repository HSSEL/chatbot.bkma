document.getElementById('register-form').addEventListener('submit', function(event) {
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  if (password !== confirmPassword) {
      event.preventDefault(); // Empêche le formulaire d'être soumis
      alert("Passwords do not match.");
  }
});
document.addEventListener('DOMContentLoaded', function() {
  // Vérifiez si le message est présent dans l'URL
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('message')) {
      alert(urlParams.get('message'));
  }

  // Ajouter la validation du mot de passe comme avant
  document.getElementById('register-form').addEventListener('submit', function(event) {
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirm-password').value;

      if (password !== confirmPassword) {
          event.preventDefault(); // Empêche le formulaire d'être soumis
          alert("Passwords do not match.");
      }
  });
});

