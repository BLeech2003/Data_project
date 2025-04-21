
const regLayout = (bgColor) => {
    return (`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Register</title>
            <style>
                body{
                background-color:${bgColor}}
            body {
                margin:0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
            }
            .login-container {
                background-color: white;
                padding: 2rem;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                width: 100%;
                max-width: 400px;
            }

            h1{
                text-align: center;
                color: #333;
                margin-bottom: 1.5rem;
            }
            .form-group {
                margin-bottom: 1rem;
            }

            label {
                display: block;
                margin-bottom: 0.5rem;
                color:#333;
            }
            input {
                width: 100%;
                padding: 0.75rem;
                border: 1px solid #ddd;
                border-radius: 4px;
                box-sizing: border-box;
            }
            button {
                width: 100%;
                padding: 0.75rem;
                background-color: gold;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 1rem;
                margin-top: 1rem;
            }
            .reg-link {
                text-align: center;
                margin-top: 1rem;
            }
            a{
                color:brown;
                text-decoration: none;
            }
            a:hover {
                text-decoration: underline;
            }
            </style>

        </head>

        <body>
            <div class="login-container">
                <h1>Login</h1>
                <form id="loginForm" action="/register" method="POST">
                    <div class="form-container">
                        <label for="fullName">
                            Full Name
                        </label>
                        <input type="fullName" id="fullName" name="fullName" required>
                    </div>                
                    <div class="form-container">
                        <label for="email">
                            Email
                        </label>
                        <input type="email" id="email" name="email" required>
                    </div>
                    <div class="form-container">
                        <label for="password">
                            Password
                        </label>
                        <input type="password" id="password" name="password" required>
                    </div>
                    <button type="submit">Register</button>
                </form>
                <div class="reg-link">
                    Already have an account <a href="/login"> Login </a>
                </div>
            </div>
        </body>
        </html>
        `);
}

module.exports = {
    regLayout
}