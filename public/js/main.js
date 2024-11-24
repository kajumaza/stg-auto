document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register');
    const loginForm = document.getElementById('login');

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;
    const telephone = document.getElementById('reg-telephone').value;
    const password = document.getElementById('reg-password').value;
    const tier = document.getElementById('reg-tier').value;

    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, telephone, password, tier }),
        });

        console.log('Registration response status:', response.status);

        if (response.ok) {
            const data = await response.json();
            console.log('Registration successful, received data:', data);
            alert('Registration successful. Please log in.');
            document.getElementById('register').reset();
        } else {
            const errorData = await response.json();
            console.error('Registration failed:', errorData);
            alert(`Registration failed: ${errorData.error}`);
        }
    } catch (error) {
        console.error('Error during registration:', error);
        alert('An error occurred during registration. Please try again.');
    }
}

async function processPayment(tier) {
    try {
        const response = await fetch('/process-payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tier }),
        });
        if (!response.ok) {
            throw new Error('Payment processing failed');
        }
        return true;
    } catch (error) {
        console.error('Error during payment processing:', error);
        alert('An error occurred during payment processing. Please try again.');
        return false;
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        console.log('Login response status:', response.status);

        if (response.ok) {
            const data = await response.json();
            console.log('Login successful, received data:', data);

            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('username', data.username);
                console.log('Token and username stored in localStorage');
                
                window.location.href = '/dashboard.html';
            } else {
                console.error('No token received from server');
                alert('Login successful, but no token received. Please try again.');
            }
        } else {
            const errorData = await response.json();
            console.error('Login failed:', errorData);
            alert(`Login failed: ${errorData.error}`);
        }
    } catch (error) {
        console.error('Error during login:', error);
        alert('An error occurred during login. Please try again.');
    }
}