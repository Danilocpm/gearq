document.getElementById('signupForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const data = {
        rf: document.getElementById('rf').value,
        password: document.getElementById('password').value,
        cpf: document.getElementById('cpf').value,
    };

    fetch('/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            alert(data.message);
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
});